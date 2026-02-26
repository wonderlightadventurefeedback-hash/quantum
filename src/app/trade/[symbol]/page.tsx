
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

type Timeframe = "1D" | "1M" | "3M" | "1Y" | "5Y" | "All";

const generateChartData = (basePrice: number, isBullish: boolean, timeframe: Timeframe) => {
  let points = 60;
  let intervalMinutes = 5;
  
  switch(timeframe) {
    case "1D": points = 78; intervalMinutes = 5; break; // 6.5 hours of trading
    case "1M": points = 30; intervalMinutes = 1440; break;
    case "3M": points = 90; intervalMinutes = 1440; break;
    case "1Y": points = 100; intervalMinutes = 4320; break;
    case "5Y": points = 120; intervalMinutes = 21600; break;
    case "All": points = 150; intervalMinutes = 43200; break;
    default: points = 60;
  }

  let currentPrice = basePrice * (isBullish ? 0.98 : 1.02);
  const startTime = new Date();
  startTime.setHours(9, 30, 0, 0);

  return Array.from({ length: points }, (_, i) => {
    const volatility = basePrice * 0.01;
    const trend = isBullish ? (basePrice * 0.04) / points : -(basePrice * 0.04) / points;
    
    const open = currentPrice;
    const change = (Math.random() - 0.48) * volatility + trend;
    const close = open + change;
    
    const high = Math.max(open, close) + Math.random() * (volatility * 0.2);
    const low = Math.min(open, close) - Math.random() * (volatility * 0.2);
    
    currentPrice = close;

    const candleUp = close >= open;
    const timeLabel = new Date(startTime.getTime() + i * intervalMinutes * 60000);
    
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
      } catch (err) {
        // Silently handle
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
    if (!db || !user) {
      toast({ title: "Auth Required", variant: "destructive" })
      return
    }

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

    const lastPrice = chartData[chartData.length - 1]?.price || stock.price;

    return (
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'area' ? (
          <AreaChart data={chartData} margin={{ top: 20, right: 60, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={trendColor} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={trendColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              interval={Math.floor(chartData.length / 6)}
              dy={10}
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
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              formatter={(value: any) => [`₹${parseFloat(value).toFixed(2)}`, "Price"]}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={trendColor} 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              animationDuration={1500}
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
                backgroundColor: '#666',
                padding: { left: 4, right: 4, top: 2, bottom: 2 },
                offset: 5,
                className: "price-label-box"
              }} 
            />
          </AreaChart>
        ) : (
          <ComposedChart data={chartData} margin={{ top: 20, right: 60, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              interval={Math.floor(chartData.length / 6)}
              dy={10}
            />
            <YAxis 
              orientation="right" 
              domain={['auto', 'auto']} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(val) => val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
            <Bar dataKey="wick" barSize={1} animationDuration={1000}>
              {chartData.map((entry: any, index: number) => (
                <Cell key={`wick-${index}`} fill={entry.color} />
              ))}
            </Bar>
            <Bar dataKey="body" barSize={8} animationDuration={1000}>
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
              className="rounded-xl gap-2 shadow-sm border-border/50"
            >
              {isWatched ? <BookmarkCheck className="size-4 fill-primary text-primary" /> : <Bookmark className="size-4" />}
              {isWatched ? "In Watchlist" : "Add Watchlist"}
            </Button>
          </div>
        </div>

        <div className={cn("grid grid-cols-1 gap-8", isFullScreen ? "grid-cols-1" : "lg:grid-cols-3")}>
          <div className={cn("space-y-8", isFullScreen ? "col-span-1" : "lg:col-span-2")}>
            <div className="flex items-start justify-between px-2">
              <div className="flex gap-4">
                <div className="size-14 rounded-2xl bg-muted/50 flex items-center justify-center font-bold text-primary text-xl border border-border/50 shadow-sm">
                  {stock.symbol[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-headline font-bold">{stock.name}</h1>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-tighter text-muted-foreground">{stock.symbol}</Badge>
                  </div>
                  <div className={cn("text-xl font-bold mt-1 flex items-center gap-2", isUp ? "text-primary" : "text-destructive")}>
                    ₹{stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    <span className="text-sm font-medium">({isUp ? '+' : ''}{stock.change.toFixed(2)}%)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={cn(
              "glass-card p-4 rounded-[2rem] relative bg-background/30 shadow-sm border-border/40 flex flex-col transition-all duration-500",
              isFullScreen ? "h-[750px]" : "h-[500px]"
            )}>
              <div className="flex-1 min-h-0">
                <ChartComponent />
              </div>
              
              {/* Bottom Controls - Matching Image Style */}
              <div className="flex items-center justify-between mt-4 px-2">
                <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl border border-border/40">
                  {["1D", "1M", "3M", "1Y", "5Y", "All"].map(t => (
                    <button 
                      key={t} 
                      onClick={() => setTimeframe(t as Timeframe)} 
                      className={cn(
                        "px-4 py-2 rounded-lg text-[11px] font-bold transition-all", 
                        timeframe === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-xl border border-border/40">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    <Code className="size-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setChartType('area')}
                    className={cn("size-8 rounded-lg transition-all", chartType === 'area' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
                  >
                    <LineChartIcon className="size-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setChartType('candle')}
                    className={cn("size-8 rounded-lg transition-all", chartType === 'candle' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
                  >
                    <BarChart2 className="size-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                    onClick={() => setIsFullScreen(!isFullScreen)}
                  >
                    {isFullScreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {!isFullScreen && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <Card className="glass-card rounded-[2.5rem] overflow-hidden shadow-xl border-border/40 bg-background/50">
                <CardHeader className="p-8 border-b border-border/40">
                  <CardTitle className="text-2xl font-headline font-bold flex items-center justify-between">
                    Trade Terminal
                    <ShieldCheck className="size-5 text-primary opacity-60" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="flex p-1.5 bg-muted/50 rounded-2xl border border-border/40">
                    <button 
                      onClick={() => setActiveOrderTab("BUY")} 
                      className={cn(
                        "flex-1 py-3 text-sm font-bold rounded-xl transition-all", 
                        activeOrderTab === "BUY" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      BUY
                    </button>
                    <button 
                      onClick={() => setActiveOrderTab("SELL")} 
                      className={cn(
                        "flex-1 py-3 text-sm font-bold rounded-xl transition-all", 
                        activeOrderTab === "SELL" ? "bg-destructive text-destructive-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      SELL
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Shares to {activeOrderTab}</label>
                      <Input 
                        type="number" 
                        value={qty} 
                        onChange={(e) => setQty(e.target.value)} 
                        className="h-14 text-right text-2xl font-bold bg-muted/30 border-none rounded-2xl focus-visible:ring-primary/20" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Limit Price</label>
                      <Input 
                        type="number" 
                        value={price} 
                        onChange={(e) => setPrice(e.target.value)} 
                        className="h-14 text-right text-2xl font-bold bg-muted/30 border-none rounded-2xl focus-visible:ring-primary/20" 
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/40 space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold px-1">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Wallet className="size-3 text-primary/60" /> Bal: ₹{userBalance.toLocaleString()}
                      </span>
                      <span className="text-foreground">Total: ₹{(parseFloat(qty || '0') * parseFloat(price || '0')).toLocaleString()}</span>
                    </div>
                    <Button 
                      className={cn(
                        "w-full h-16 rounded-2xl text-xl font-black transition-all shadow-lg active:scale-[0.98]", 
                        activeOrderTab === "BUY" ? "bg-primary text-primary-foreground shadow-primary/10" : "bg-destructive text-destructive-foreground shadow-destructive/10"
                      )}
                      onClick={handleOrder}
                    >
                      {activeOrderTab === "BUY" ? "Place Buy Order" : "Place Sell Order"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card bg-primary/5 border-primary/10 p-6">
                <div className="flex items-start gap-4">
                  <Zap className="size-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary/80">Market Pulse</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Ticker {symbol} is currently showing a {isUp ? 'bullish' : 'bearish'} pattern over the {timeframe} timeframe. Indicators suggest continued {isUp ? 'accumulation' : 'distribution'}.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
      <style jsx global>{`
        .recharts-reference-line-label text {
          font-weight: bold;
        }
        .price-label-box {
          background-color: #333;
          border-radius: 4px;
        }
      `}</style>
    </DashboardShell>
  )
}
