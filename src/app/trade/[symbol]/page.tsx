
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
  Wallet
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
  Cell
} from "recharts"
import { MOCK_STOCKS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useUser, useFirestore, useDoc } from "@/firebase"
import { doc, setDoc, deleteDoc, serverTimestamp, getDoc, updateDoc, increment } from "firebase/firestore"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

const FINNHUB_API_KEY = "d6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110";

type Timeframe = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y";

const generateChartData = (basePrice: number, isBullish: boolean, timeframe: Timeframe) => {
  let points = 60;
  let multiplier = 0.95;
  
  switch(timeframe) {
    case "1D": points = 60; multiplier = 0.98; break;
    case "1W": points = 70; multiplier = 0.95; break;
    case "1M": points = 90; multiplier = 0.90; break;
    case "3M": points = 100; multiplier = 0.85; break;
    case "6M": points = 120; multiplier = 0.80; break;
    case "1Y": points = 150; multiplier = 0.70; break;
    default: points = 60;
  }

  let currentPrice = basePrice * (isBullish ? multiplier : (2 - multiplier));
  
  return Array.from({ length: points }, (_, i) => {
    const volatility = basePrice * 0.025;
    const trend = isBullish ? (basePrice * (1 - multiplier)) / points : -(basePrice * (1 - multiplier)) / points;
    
    const open = currentPrice;
    const change = (Math.random() - 0.45) * volatility + trend;
    const close = open + change;
    
    const wickExpansion = Math.random() > 0.7 ? volatility * 1.5 : volatility * 0.5;
    const high = Math.max(open, close) + Math.random() * wickExpansion;
    const low = Math.min(open, close) - Math.random() * wickExpansion;
    
    currentPrice = close;

    const candleUp = close >= open;

    return {
      time: i,
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
      } catch (err) {
        // Silently handle user data fetch errors
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
      console.error("Live quote fetch error:", error)
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
      toast({ title: "Auth Required", description: "Sign in to place orders.", variant: "destructive" })
      return
    }

    const orderQty = parseFloat(qty)
    const orderPrice = parseFloat(price)
    const totalCost = orderQty * orderPrice

    if (isNaN(orderQty) || orderQty <= 0) {
      toast({ title: "Invalid Quantity", variant: "destructive" })
      return
    }

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
        title: `${activeOrderTab} Order Complete`,
        description: `Successfully ${activeOrderTab === 'BUY' ? 'purchased' : 'sold'} ${orderQty} units of ${symbol}.`,
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
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={trendColor} stopOpacity={0.6}/>
                <stop offset="100%" stopColor={trendColor} stopOpacity={0}/>
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="1 4" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.2} />
            <XAxis dataKey="time" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '16px' }}
              formatter={(value: any) => [`₹${parseFloat(value).toFixed(2)}`, "Price"]}
            />
            <Area type="monotone" dataKey="price" stroke={trendColor} strokeWidth={4} fillOpacity={1} fill="url(#colorPrice)" filter="url(#glow)" />
          </AreaChart>
        ) : (
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="1 4" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.2} />
            <XAxis dataKey="time" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '16px' }} />
            <Bar dataKey="wick" barSize={1}>
              {chartData.map((entry: any, index: number) => (
                <Cell key={`wick-${index}`} fill={entry.color} />
              ))}
            </Bar>
            <Bar dataKey="body" barSize={10}>
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
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="gap-2 px-0" onClick={() => router.back()}>
            <ArrowLeft className="size-4" /> Market Explorer
          </Button>
          <div className="flex items-center gap-3">
            <Button 
              variant={isWatched ? "secondary" : "outline"} 
              onClick={toggleWatchlist} 
              className="rounded-xl gap-2 shadow-sm"
            >
              {isWatched ? <BookmarkCheck className="size-4 fill-primary text-primary" /> : <Bookmark className="size-4" />}
              {isWatched ? "In Watchlist" : "Add Watchlist"}
            </Button>
            <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setIsFullScreen(!isFullScreen)}>
              {isFullScreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
          </div>
        </div>

        <div className={cn("grid grid-cols-1 gap-10", isFullScreen ? "grid-cols-1" : "lg:grid-cols-3")}>
          <div className={cn("space-y-10", isFullScreen ? "col-span-1" : "lg:col-span-2")}>
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center font-bold text-primary text-2xl border border-border/50 shadow-inner">
                  {stock.symbol[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-4xl font-headline font-bold">{stock.name}</h1>
                    <Badge variant="outline" className="text-xs uppercase tracking-tighter">{stock.symbol}</Badge>
                  </div>
                  <div className={cn("text-xl font-bold mt-1 flex items-center gap-2", isUp ? "text-primary" : "text-destructive")}>
                    ₹{stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    <span className="text-sm">({isUp ? '+' : ''}{stock.change.toFixed(2)}%)</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Market Cap</div>
                  <div className="text-sm font-bold">₹24.8T</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg Vol (10D)</div>
                  <div className="text-sm font-bold">12.4M</div>
                </div>
              </div>
            </div>

            <div className={cn(
              "glass-card p-6 rounded-[2.5rem] relative overflow-hidden shadow-2xl border-primary/10 transition-all duration-500",
              isFullScreen ? "h-[700px]" : "h-[450px]"
            )}>
              <div className="absolute top-6 left-6 z-10 flex gap-2 p-1 bg-background/50 backdrop-blur-md rounded-xl border">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setChartType('area')} 
                  className={cn("rounded-lg h-8 text-xs font-bold", chartType === 'area' && "bg-primary text-primary-foreground hover:bg-primary/90")}
                >
                  <LineChartIcon className="size-3 mr-1.5" /> Line
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setChartType('candle')} 
                  className={cn("rounded-lg h-8 text-xs font-bold", chartType === 'candle' && "bg-primary text-primary-foreground hover:bg-primary/90")}
                >
                  <BarChart2 className="size-3 mr-1.5" /> Candle
                </Button>
              </div>
              
              <ChartComponent />
              
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-1.5 bg-background/80 backdrop-blur-xl rounded-[2rem] border border-border shadow-lg">
                {["1D", "1W", "1M", "3M", "6M", "1Y"].map(t => (
                  <button 
                    key={t} 
                    onClick={() => setTimeframe(t as Timeframe)} 
                    className={cn(
                      "px-4 py-2 rounded-full text-[10px] font-bold tracking-wider transition-all", 
                      timeframe === t ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {!isFullScreen && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              <Card className="glass-card rounded-[2.5rem] overflow-hidden shadow-2xl border-primary/20 bg-background/50">
                <CardHeader className="p-8 border-b border-border/50">
                  <CardTitle className="text-2xl font-headline font-bold flex items-center justify-between">
                    Execution Terminal
                    <ShieldCheck className="size-5 text-primary" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="flex p-1.5 bg-muted/50 rounded-2xl border border-border/50">
                    <button 
                      onClick={() => setActiveOrderTab("BUY")} 
                      className={cn(
                        "flex-1 py-3 text-sm font-bold rounded-xl transition-all", 
                        activeOrderTab === "BUY" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      BUY
                    </button>
                    <button 
                      onClick={() => setActiveOrderTab("SELL")} 
                      className={cn(
                        "flex-1 py-3 text-sm font-bold rounded-xl transition-all", 
                        activeOrderTab === "SELL" ? "bg-destructive text-destructive-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      SELL
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Quantity</label>
                      <Input 
                        type="number" 
                        value={qty} 
                        onChange={(e) => setQty(e.target.value)} 
                        className="h-14 text-right text-2xl font-bold bg-muted/30 border-none rounded-2xl focus-visible:ring-primary/40" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Limit Price</label>
                      <Input 
                        type="number" 
                        value={price} 
                        onChange={(e) => setPrice(e.target.value)} 
                        className="h-14 text-right text-2xl font-bold bg-muted/30 border-none rounded-2xl focus-visible:ring-primary/40" 
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/50 space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Wallet className="size-3 text-primary" /> Cash: ₹{userBalance.toLocaleString()}
                      </span>
                      <span className="text-foreground">Est. Total: ₹{(parseFloat(qty || '0') * parseFloat(price || '0')).toLocaleString()}</span>
                    </div>
                    <Button 
                      className={cn(
                        "w-full h-16 rounded-2xl text-xl font-black transition-all shadow-xl active:scale-95", 
                        activeOrderTab === "BUY" ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-destructive text-destructive-foreground shadow-destructive/20"
                      )}
                      onClick={handleOrder}
                    >
                      {activeOrderTab === "BUY" ? "Review Purchase" : "Confirm Sale"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card bg-primary/5 border-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Zap className="size-5 text-primary shrink-0 mt-1" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">Analyst Insight</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Strong institutional accumulation detected at the ₹{stock.price.toFixed(0)} level. Trend strength index is currently Bullish.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
