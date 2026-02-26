
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Bookmark,
  Loader2,
  BookmarkCheck,
  TrendingUp,
  LineChart as LineChartIcon,
  BarChart2,
  Maximize2,
  Minimize2,
  Zap,
  ShieldCheck,
  Wallet,
  Code,
  Bell,
  Link as LinkIcon,
  ChevronRight,
  Calendar,
  Layers
} from "lucide-react"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Bar,
  ComposedChart,
  Cell,
  ReferenceLine
} from "recharts"
import { MOCK_STOCKS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useUser, useFirestore, useDoc } from "@/firebase"
import { doc, setDoc, deleteDoc, serverTimestamp, getDoc, updateDoc, increment } from "firebase/firestore"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

const FINNHUB_API_KEY = "d6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110";

type Timeframe = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "3Y" | "5Y" | "All";

const generateChartData = (basePrice: number, isBullish: boolean, timeframe: Timeframe) => {
  let points = 60;
  let intervalMinutes = 5;
  
  switch(timeframe) {
    case "1D": points = 78; intervalMinutes = 5; break;
    case "1W": points = 40; intervalMinutes = 180; break;
    case "1M": points = 30; intervalMinutes = 1440; break;
    case "3M": points = 90; intervalMinutes = 1440; break;
    case "6M": points = 120; intervalMinutes = 1440; break;
    case "1Y": points = 100; intervalMinutes = 4320; break;
    case "3Y": points = 110; intervalMinutes = 12960; break;
    case "5Y": points = 120; intervalMinutes = 21600; break;
    case "All": points = 150; intervalMinutes = 43200; break;
    default: points = 60;
  }

  let currentPrice = basePrice * (isBullish ? 0.96 : 1.04);
  const startTime = new Date();
  
  return Array.from({ length: points }, (_, i) => {
    const volatility = basePrice * 0.012;
    const trend = isBullish ? (basePrice * 0.06) / points : -(basePrice * 0.06) / points;
    
    const open = currentPrice;
    const change = (Math.random() - 0.48) * volatility + trend;
    const close = open + change;
    
    const hasLongWick = Math.random() > 0.85;
    const wickHigh = Math.random() * (volatility * (hasLongWick ? 1.4 : 0.3));
    const wickLow = Math.random() * (volatility * (hasLongWick ? 1.6 : 0.8)); 
    
    const high = Math.max(open, close) + wickHigh;
    const low = Math.min(open, close) - wickLow;
    
    currentPrice = close;
    const candleUp = close >= open;
    const timeLabel = new Date(startTime.getTime() - (points - i) * intervalMinutes * 60000);
    
    return {
      time: i,
      label: timeframe === "1D" 
        ? timeLabel.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        : timeLabel.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      open,
      high,
      low,
      close,
      body: [open, close],
      wick: [low, high],
      price: close,
      isUp: candleUp,
      color: candleUp ? "hsl(var(--primary))" : "hsl(var(--destructive))",
    };
  })
}

export default function StockDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const symbol = params.symbol as string
  const { user } = useUser()
  const db = useFirestore()
  
  const initialStock = MOCK_STOCKS.find(s => s.symbol === symbol) || MOCK_STOCKS[0]
  const [stock, setStock] = React.useState(initialStock)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isMounted, setIsMounted] = React.useState(false)
  const [activeOrderTab, setActiveOrderTab] = React.useState("BUY")
  const [qty, setQty] = React.useState("1")
  const [price, setPrice] = React.useState(initialStock.price.toString())
  const [chartType, setChartType] = React.useState<'area' | 'candle'>('area')
  const [timeframe, setTimeframe] = React.useState<Timeframe>("1D")
  const [userBalance, setUserBalance] = React.useState<number>(0)
  const [tradeMode, setTradeMode] = React.useState("Delivery")
  
  const isUp = stock.change >= 0;
  const trendColor = isUp ? "hsl(var(--primary))" : "hsl(var(--destructive))";
  
  const chartData = React.useMemo(() => {
    if (!isMounted) return [];
    return generateChartData(stock.price, isUp, timeframe);
  }, [stock.price, isUp, timeframe, isMounted])

  const watchlistDocRef = React.useMemo(() => {
    if (!db || !user) return null
    return doc(db, 'users', user.uid, 'watchlist', symbol)
  }, [db, user, symbol])
  
  const { data: watchlistItem } = useDoc(watchlistDocRef)
  const isWatched = !!watchlistItem

  React.useEffect(() => {
    setIsMounted(true);
    async function fetchUserData() {
      if (!db || !user) return
      try {
        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          setUserBalance(userSnap.data().balance || 0)
        }
      } catch (err) {
        // Silent error for user data
      }
    }
    fetchUserData()
  }, [db, user])

  const fetchLiveQuote = React.useCallback(async () => {
    try {
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`)
      if (res.ok) {
        const data = await res.json()
        if (data.c && data.c !== 0) {
          setStock(prev => ({
            ...prev,
            price: data.c,
            change: data.dp || prev.change,
            trend: (data.dp || 0) >= 0 ? "UP" : "DOWN"
          }))
          setPrice(data.c.toString())
        }
      } else {
        throw new Error("Price fetch failed")
      }
    } catch (error) {
      // Fallback with small drift to simulate live movement if API fails
      const drift = (Math.random() - 0.5) * 0.1;
      setStock(prev => ({
        ...prev,
        price: +(prev.price + drift).toFixed(2)
      }))
    } finally {
      setIsLoading(false)
    }
  }, [symbol])

  React.useEffect(() => {
    fetchLiveQuote()
    const interval = setInterval(fetchLiveQuote, 30000)
    return () => clearInterval(interval)
  }, [fetchLiveQuote])

  const handleOrder = async () => {
    if (!db || !user) return
    const orderQty = parseFloat(qty)
    const orderPrice = parseFloat(price)
    const totalCost = orderQty * orderPrice

    if (activeOrderTab === "BUY" && totalCost > userBalance) {
      toast({ title: "Insufficient Funds", variant: "destructive" })
      return
    }

    const holdingRef = doc(db, 'users', user.uid, 'holdings', symbol)
    const userRef = doc(db, 'users', user.uid)

    try {
      if (activeOrderTab === "BUY") {
        const holdingSnap = await getDoc(holdingRef)
        if (holdingSnap.exists()) {
          const currentData = holdingSnap.data()
          const newQty = (currentData.quantity || 0) + orderQty
          const newAvgPrice = ((currentData.averagePrice * currentData.quantity) + totalCost) / newQty
          updateDoc(holdingRef, { quantity: newQty, averagePrice: newAvgPrice, lastUpdated: serverTimestamp() })
        } else {
          setDoc(holdingRef, { symbol, quantity: orderQty, averagePrice: orderPrice, lastUpdated: serverTimestamp() })
        }
        updateDoc(userRef, { balance: increment(-totalCost) })
        setUserBalance(prev => prev - totalCost)
      } else {
        const holdingSnap = await getDoc(holdingRef)
        if (!holdingSnap.exists() || (holdingSnap.data().quantity || 0) < orderQty) {
          toast({ title: "Insufficient Quantity", variant: "destructive" })
          return
        }
        const newQty = holdingSnap.data().quantity - orderQty
        if (newQty === 0) {
          deleteDoc(holdingRef)
        } else {
          updateDoc(holdingRef, { quantity: newQty, lastUpdated: serverTimestamp() })
        }
        updateDoc(userRef, { balance: increment(totalCost) })
        setUserBalance(prev => prev + totalCost)
      }

      toast({
        title: `${activeOrderTab} Order Successful`,
        description: `${orderQty} units of ${symbol} processed.`,
      })
    } catch (e) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: holdingRef.path, operation: 'write' }))
    }
  }

  const toggleWatchlist = async () => {
    if (!user || !watchlistDocRef) return
    try {
      if (isWatched) {
        deleteDoc(watchlistDocRef)
      } else {
        setDoc(watchlistDocRef, { symbol, addedAt: serverTimestamp() })
      }
    } catch (e) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: watchlistDocRef.path, operation: 'write' }))
    }
  }

  const ChartComponent = () => {
    if (!isMounted) return <div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'area' ? (
          <AreaChart data={chartData} margin={{ top: 10, right: 70, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={trendColor} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={trendColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis 
              dataKey="label" 
              hide={true}
            />
            <YAxis 
              orientation="right" 
              domain={['auto', 'auto']} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(val) => val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              formatter={(value: any) => [`₹${parseFloat(value).toFixed(2)}`, "Price"]}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={trendColor} 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              animationDuration={800}
            />
          </AreaChart>
        ) : (
          <ComposedChart data={chartData} margin={{ top: 10, right: 70, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis 
              dataKey="label" 
              hide={true}
            />
            <YAxis 
              orientation="right" 
              domain={['auto', 'auto']} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
            />
            <Bar dataKey="wick" barSize={1}>
              {chartData.map((entry: any, index: number) => (
                <Cell key={`wick-${index}`} fill={entry.color} />
              ))}
            </Bar>
            <Bar dataKey="body" barSize={8}>
              {chartData.map((entry: any, index: number) => (
                <Cell key={`body-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </ComposedChart>
        )}
      </ResponsiveContainer>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="size-14 rounded-2xl bg-orange-500 flex items-center justify-center shrink-0 shadow-lg text-white font-black text-2xl">
              {symbol[0]}
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-bold text-foreground">{stock.name}</h1>
              <div className="flex items-center gap-4">
                <div className={cn("text-2xl font-bold flex items-center gap-2", isUp ? "text-primary" : "text-destructive")}>
                  ₹{stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  <span className="text-sm font-bold">
                    {isUp ? '+' : ''}{stock.change.toFixed(2)} ({stock.change.toFixed(2)}%)
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">1D</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <Button variant="outline" size="sm" className="rounded-full gap-2 border-border/50 h-9">
              <Bell className="size-4" /> Create Alert
            </Button>
            <Button 
              variant={isWatched ? "secondary" : "outline"} 
              size="sm"
              onClick={toggleWatchlist} 
              className="rounded-full gap-2 border-border/50 h-9"
            >
              {isWatched ? <BookmarkCheck className="size-4 fill-primary text-primary" /> : <Bookmark className="size-4" />}
              Watchlist
            </Button>
            <div className="text-primary text-sm font-bold flex items-center gap-1 cursor-pointer hover:underline">
              <Code className="size-4 rotate-45" /> Option Chain
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Chart Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-[1.5rem] bg-background/50 border-border/40 h-[450px] relative flex flex-col pt-4 overflow-hidden shadow-sm">
              <div className="flex-1 min-h-0">
                <ChartComponent />
              </div>
              
              {/* Chart Controls Bar */}
              <div className="border-t border-border/40 px-6 py-4 flex items-center justify-between bg-muted/5">
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px] font-bold bg-muted/40 border-none mr-4">NSE</Badge>
                  {["1D", "1W", "1M", "3M", "6M", "1Y", "3Y", "5Y", "All"].map(t => (
                    <button 
                      key={t} 
                      onClick={() => setTimeframe(t as Timeframe)} 
                      className={cn(
                        "size-8 flex items-center justify-center rounded-full text-[10px] font-black transition-all", 
                        timeframe === t ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                  <button 
                    onClick={() => setChartType(chartType === 'area' ? 'candle' : 'area')}
                    className="size-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-primary transition-colors ml-2"
                  >
                    {chartType === 'area' ? <BarChart2 className="size-4" /> : <LineChartIcon className="size-4" />}
                  </button>
                </div>
                
                <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground gap-2">
                  Terminal <Code className="size-3" />
                </Button>
              </div>
            </div>

            {/* Create SIP Card */}
            <Card className="glass-card border-border/40 bg-background/30 rounded-[1.2rem] p-6 group cursor-pointer hover:bg-muted/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-muted flex items-center justify-center">
                    <Calendar className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Create Stock SIP</h3>
                    <p className="text-xs text-muted-foreground">Automate your investments in this Stock</p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>

            {/* Bottom Section Tabs */}
            <div className="flex items-center gap-8 border-b border-border/40 pb-2 overflow-x-auto no-scrollbar">
              {["Overview", "Technicals", "News", "Events", "F&O"].map((tab, i) => (
                <button 
                  key={tab} 
                  className={cn(
                    "text-sm font-bold whitespace-nowrap pb-2 transition-all relative",
                    i === 0 ? "text-primary after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-[2px] after:bg-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Trade Terminal Section */}
          <div className="lg:col-span-1">
            <Card className="glass-card rounded-[1.5rem] border-border/40 bg-background shadow-xl sticky top-24 overflow-hidden">
              <CardHeader className="p-6 border-b border-border/40 flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-bold">{stock.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span>NSE ₹{stock.price.toFixed(2)} (+{stock.change.toFixed(2)}%)</span>
                  <span>•</span>
                  <span>BSE ₹{(stock.price + 0.05).toFixed(2)}</span>
                  <span className="text-primary hover:underline cursor-pointer">Depth</span>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-8">
                {/* Buy/Sell Tabs */}
                <div className="flex items-center border-b border-border/40 mb-6">
                  <button 
                    onClick={() => setActiveOrderTab("BUY")}
                    className={cn(
                      "flex-1 pb-3 text-sm font-black transition-all relative",
                      activeOrderTab === "BUY" ? "text-primary after:content-[''] after:absolute after:bottom-[-1px] after:left-1/4 after:w-1/2 after:h-[2px] after:bg-primary" : "text-muted-foreground"
                    )}
                  >
                    BUY
                  </button>
                  <button 
                    onClick={() => setActiveOrderTab("SELL")}
                    className={cn(
                      "flex-1 pb-3 text-sm font-black transition-all relative",
                      activeOrderTab === "SELL" ? "text-destructive after:content-[''] after:absolute after:bottom-[-1px] after:left-1/4 after:w-1/2 after:h-[2px] after:bg-destructive" : "text-muted-foreground"
                    )}
                  >
                    SELL
                  </button>
                </div>

                {/* Trade Type Options */}
                <div className="flex gap-2 p-1 bg-muted/40 rounded-full border border-border/30">
                  {["Delivery", "Intraday", "MTF 4.11x"].map(mode => (
                    <button 
                      key={mode}
                      onClick={() => setTradeMode(mode)}
                      className={cn(
                        "flex-1 py-1.5 text-[10px] font-bold rounded-full transition-all",
                        tradeMode === mode ? "bg-background shadow-sm text-foreground border border-border/40" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Input Fields */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1 cursor-pointer">
                      Qty <span className="text-[10px] font-black uppercase text-foreground">NSE</span> <ChevronRight className="size-3 rotate-90" />
                    </label>
                    <Input 
                      type="number" 
                      value={qty} 
                      onChange={(e) => setQty(e.target.value)} 
                      className="w-32 h-10 text-right font-bold bg-muted/20 border-border/40 rounded-lg" 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1 cursor-pointer">
                      Price <span className="text-[10px] font-black uppercase text-foreground">Limit</span> <ChevronRight className="size-3 rotate-90" />
                    </label>
                    <Input 
                      type="number" 
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)} 
                      className="w-32 h-10 text-right font-bold bg-muted/20 border-border/40 rounded-lg" 
                    />
                  </div>
                </div>

                <div className="pt-8 border-t border-border/40 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold px-1">
                    <span className="text-muted-foreground">Balance : ₹{userBalance.toLocaleString()}</span>
                    <span className="text-muted-foreground">Approx req. : <span className="text-foreground border-b border-dotted border-muted-foreground">₹{(parseFloat(qty || '0') * parseFloat(price || '0')).toLocaleString()}</span></span>
                  </div>
                  <Button 
                    className={cn(
                      "w-full h-12 rounded-xl text-sm font-black transition-all shadow-lg active:scale-[0.98] tracking-widest uppercase", 
                      activeOrderTab === "BUY" ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-destructive text-destructive-foreground shadow-destructive/20"
                    )}
                    onClick={handleOrder}
                  >
                    {activeOrderTab === "BUY" ? "Buy" : "Sell"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
