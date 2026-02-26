
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
  Code
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

type Timeframe = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y" | "All";

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
    case "5Y": points = 120; intervalMinutes = 21600; break;
    case "All": points = 150; intervalMinutes = 43200; break;
    default: points = 60;
  }

  let currentPrice = basePrice * (isBullish ? 0.96 : 1.04);
  const startTime = new Date();
  
  return Array.from({ length: points }, (_, i) => {
    const volatility = basePrice * 0.015;
    const trend = isBullish ? (basePrice * 0.08) / points : -(basePrice * 0.08) / points;
    
    const open = currentPrice;
    const change = (Math.random() - 0.48) * volatility + trend;
    const close = open + change;
    
    // Technical analysis "Hammer" style wicks
    const wickHigh = Math.random() * (volatility * 0.4);
    const wickLow = Math.random() * (volatility * 1.2); // pronounced lower wick
    
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
  const [chartType, setChartType] = React.useState<'area' | 'candle'>('candle')
  const [timeframe, setTimeframe] = React.useState<Timeframe>("1D")
  const [isFullScreen, setIsFullScreen] = React.useState(false)
  const [userBalance, setUserBalance] = React.useState<number>(0)
  
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
      } catch (err) {}
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
      }
    } catch (error) {
      console.error(error)
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

    const lastPrice = stock.price;

    return (
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'area' ? (
          <AreaChart data={chartData} margin={{ top: 20, right: 70, left: 10, bottom: 10 }}>
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={trendColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={trendColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="1 4" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.15} />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
              interval={Math.floor(chartData.length / 6)}
              dy={15}
            />
            <YAxis 
              orientation="right" 
              domain={['auto', 'auto']} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
              tickFormatter={(val) => val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              formatter={(value: any) => [`₹${parseFloat(value).toFixed(2)}`, "Price"]}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={trendColor} 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              animationDuration={1500}
              filter="url(#glow)"
            />
            <ReferenceLine 
              y={lastPrice} 
              stroke={trendColor} 
              strokeDasharray="3 3" 
              label={{ 
                position: 'right', 
                value: lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                fill: 'white',
                fontSize: 10,
                fontWeight: 'bold',
                offset: 5,
                className: "price-marker"
              }} 
            />
          </AreaChart>
        ) : (
          <ComposedChart data={chartData} margin={{ top: 20, right: 70, left: 10, bottom: 10 }}>
            <defs>
              <filter id="candle-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="1 4" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.15} />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
              interval={Math.floor(chartData.length / 6)}
              dy={15}
            />
            <YAxis 
              orientation="right" 
              domain={['auto', 'auto']} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
              tickFormatter={(val) => val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
              labelStyle={{ fontWeight: 'bold' }}
            />
            {/* Hammer Style Candlesticks */}
            <Bar dataKey="wick" barSize={1} filter="url(#candle-glow)">
              {chartData.map((entry: any, index: number) => (
                <Cell key={`wick-${index}`} fill={entry.color} />
              ))}
            </Bar>
            <Bar dataKey="body" barSize={10} filter="url(#candle-glow)">
              {chartData.map((entry: any, index: number) => (
                <Cell key={`body-${index}`} fill={entry.color} />
              ))}
            </Bar>
            <ReferenceLine 
              y={lastPrice} 
              stroke={trendColor} 
              strokeDasharray="3 3"
              label={{ 
                position: 'right', 
                value: lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                fill: 'white',
                fontSize: 10,
                fontWeight: 'bold',
                offset: 5
              }}
            />
          </ComposedChart>
        )}
      </ResponsiveContainer>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="gap-2 px-0 hover:bg-transparent" onClick={() => router.back()}>
            <ArrowLeft className="size-4" /> Market Explorer
          </Button>
          <div className="flex items-center gap-3">
            <Button 
              variant={isWatched ? "secondary" : "outline"} 
              onClick={toggleWatchlist} 
              className="rounded-xl gap-2 shadow-sm border-border/50 h-10 px-6"
            >
              {isWatched ? <BookmarkCheck className="size-4 fill-primary text-primary" /> : <Bookmark className="size-4" />}
              {isWatched ? "In Watchlist" : "Add Watchlist"}
            </Button>
          </div>
        </div>

        <div className={cn("grid grid-cols-1 gap-10", isFullScreen ? "grid-cols-1" : "lg:grid-cols-3")}>
          <div className={cn("space-y-8", isFullScreen ? "col-span-1" : "lg:col-span-2")}>
            <div className="flex items-start justify-between px-2">
              <div className="flex gap-5">
                <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center font-bold text-primary text-2xl border border-border/50 shadow-inner">
                  {stock.symbol[0]}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">{stock.name}</h1>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-[0.1em] text-muted-foreground px-2 py-0.5">NSE: {stock.symbol}</Badge>
                  </div>
                  <div className={cn("text-2xl font-bold flex items-center gap-3", isUp ? "text-primary" : "text-destructive")}>
                    ₹{stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    <span className="text-base font-bold bg-muted/30 px-2 py-0.5 rounded-md">
                      {isUp ? '+' : ''}{stock.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={cn(
              "glass-card p-4 rounded-[2.5rem] relative bg-background/20 shadow-2xl border-border/30 flex flex-col transition-all duration-700",
              isFullScreen ? "h-[800px]" : "h-[550px]"
            )}>
              <div className="flex-1 min-h-0 pt-4">
                <ChartComponent />
              </div>
              
              {/* Institutional Terminal Controls */}
              <div className="flex items-center justify-between mt-8 px-4 pb-2">
                <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-[1.2rem] border border-border/30">
                  {["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"].map(t => (
                    <button 
                      key={t} 
                      onClick={() => setTimeframe(t as Timeframe)} 
                      className={cn(
                        "px-4 py-2 rounded-xl text-[11px] font-black transition-all", 
                        timeframe === t ? "bg-background text-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-[1.2rem] border border-border/30">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setChartType('area')}
                    className={cn("size-10 rounded-xl transition-all", chartType === 'area' ? "bg-background text-primary shadow-lg" : "text-muted-foreground")}
                  >
                    <LineChartIcon className="size-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setChartType('candle')}
                    className={cn("size-10 rounded-xl transition-all", chartType === 'candle' ? "bg-background text-primary shadow-lg" : "text-muted-foreground")}
                  >
                    <BarChart2 className="size-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-10 rounded-xl text-muted-foreground hover:text-foreground"
                    onClick={() => setIsFullScreen(!isFullScreen)}
                  >
                    {isFullScreen ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {!isFullScreen && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000">
              <Card className="glass-card rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] border-border/20 bg-background/40">
                <CardHeader className="p-10 border-b border-border/20 bg-muted/10">
                  <CardTitle className="text-2xl font-headline font-bold flex items-center justify-between">
                    Trade Terminal
                    <div className="size-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-10 space-y-10">
                  <div className="flex p-1.5 bg-muted/40 rounded-[1.8rem] border border-border/30">
                    <button 
                      onClick={() => setActiveOrderTab("BUY")} 
                      className={cn(
                        "flex-1 py-4 text-sm font-black rounded-[1.5rem] transition-all tracking-widest", 
                        activeOrderTab === "BUY" ? "bg-primary text-primary-foreground shadow-2xl" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      BUY
                    </button>
                    <button 
                      onClick={() => setActiveOrderTab("SELL")} 
                      className={cn(
                        "flex-1 py-4 text-sm font-black rounded-[1.5rem] transition-all tracking-widest", 
                        activeOrderTab === "SELL" ? "bg-destructive text-destructive-foreground shadow-2xl" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      SELL
                    </button>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Units to {activeOrderTab}</label>
                      <Input 
                        type="number" 
                        value={qty} 
                        onChange={(e) => setQty(e.target.value)} 
                        className="h-16 text-right text-3xl font-black bg-muted/20 border-none rounded-[1.5rem] focus-visible:ring-primary/20 pr-6" 
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Limit Price (₹)</label>
                      <Input 
                        type="number" 
                        value={price} 
                        onChange={(e) => setPrice(e.target.value)} 
                        className="h-16 text-right text-3xl font-black bg-muted/20 border-none rounded-[1.5rem] focus-visible:ring-primary/20 pr-6" 
                      />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-border/20 space-y-6">
                    <div className="flex justify-between items-center text-xs font-bold px-2">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Wallet className="size-4 text-primary/50" /> Bal: ₹{userBalance.toLocaleString()}
                      </span>
                      <span className="text-foreground text-sm">Total: ₹{(parseFloat(qty || '0') * parseFloat(price || '0')).toLocaleString()}</span>
                    </div>
                    <Button 
                      className={cn(
                        "w-full h-20 rounded-[1.8rem] text-2xl font-black transition-all shadow-2xl active:scale-[0.97] tracking-widest uppercase", 
                        activeOrderTab === "BUY" ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-destructive text-destructive-foreground shadow-destructive/20"
                      )}
                      onClick={handleOrder}
                    >
                      {activeOrderTab === "BUY" ? "Execute Buy" : "Execute Sell"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card bg-primary/5 border-primary/20 p-8 rounded-[2.5rem]">
                <div className="flex items-start gap-5">
                  <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Zap className="size-6 text-primary fill-primary/20" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Market Pulse</p>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                      Market volatility is currently <span className="text-foreground font-bold italic">Moderate</span>. Technical patterns suggest high liquidity at the ₹{stock.price.toFixed(0)} support level.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
      <style jsx global>{`
        .price-marker {
          background-color: #333;
          border-radius: 4px;
          padding: 2px 6px;
        }
        .recharts-reference-line-label text {
          font-weight: 800;
          filter: drop-shadow(0 0 4px rgba(0,0,0,0.8));
        }
      `}</style>
    </DashboardShell>
  )
}
