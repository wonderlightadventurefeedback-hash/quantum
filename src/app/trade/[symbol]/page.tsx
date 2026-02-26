
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { 
  ArrowLeft, 
  Bell, 
  Bookmark,
  Plus, 
  ExternalLink, 
  Settings2, 
  ChevronDown,
  Info,
  Zap,
  Layout,
  Loader2,
  BookmarkCheck,
  TrendingUp,
  BarChart2,
  LineChart as LineChartIcon,
  Maximize2,
  Minimize2,
  X
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
import { MOCK_STOCKS, MOCK_USER } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useUser, useFirestore, useDoc } from "@/firebase"
import { doc, setDoc, deleteDoc, serverTimestamp, getDoc, updateDoc, increment } from "firebase/firestore"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

const FINNHUB_API_KEY = "d6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110";

type Timeframe = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "3Y" | "5Y" | "All";

const RangeBar = ({ low, high, current, labelLow, labelHigh }: { low: number, high: number, current: number, labelLow: string, labelHigh: string }) => {
  const percentage = ((current - low) / (high - low)) * 100;
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{labelLow}</span>
          <span className="text-sm font-bold">₹{low.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{labelHigh}</span>
          <span className="text-sm font-bold">₹{high.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
      <div className="relative h-[2px] w-full bg-muted/50 rounded-full">
        <div 
          className="absolute top-[-6px] -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[7px] border-b-muted-foreground transition-all duration-700 ease-out" 
          style={{ left: `${Math.min(Math.max(percentage, 0), 100)}%` }}
        />
      </div>
    </div>
  )
}

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

    return {
      time: i,
      open,
      high,
      low,
      close,
      body: [open, close],
      wick: [low, high],
      price: close,
      isUp: close >= open,
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
  const [activeOrderTab, setActiveOrderTab] = React.useState("BUY")
  const [qty, setQty] = React.useState("1")
  const [price, setPrice] = React.useState(initialStock.price.toString())
  const [chartType, setChartType] = React.useState<'area' | 'candle'>('candle')
  const [timeframe, setTimeframe] = React.useState<Timeframe>("1D")
  const [isFullScreen, setIsFullScreen] = React.useState(false)
  const [userBalance, setUserBalance] = React.useState<number>(0)
  
  const isUp = stock.change >= 0;
  const trendColor = isUp ? "hsl(var(--primary))" : "hsl(var(--destructive))";
  
  const chartData = React.useMemo(() => generateChartData(stock.price, isUp, timeframe), [stock.price, isUp, timeframe])

  const watchlistDocRef = React.useMemo(() => {
    if (!db || !user) return null
    return doc(db, 'users', user.uid, 'watchlist', symbol)
  }, [db, user, symbol])
  
  const { data: watchlistItem } = useDoc(watchlistDocRef)
  const isWatched = !!watchlistItem

  React.useEffect(() => {
    async function fetchUserData() {
      if (!db || !user) return
      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        setUserBalance(userSnap.data().balance || 0)
      }
    }
    fetchUserData()
  }, [db, user])

  const fetchLiveQuote = async () => {
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
  }

  React.useEffect(() => {
    fetchLiveQuote()
    const interval = setInterval(fetchLiveQuote, 30000)
    return () => clearInterval(interval)
  }, [symbol])

  const handleOrder = async () => {
    if (!db || !user) {
      toast({ title: "Auth Required", description: "Sign in to place orders.", variant: "destructive" })
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
          const newQty = currentData.quantity + orderQty
          const newAvgPrice = ((currentData.averagePrice * currentData.quantity) + totalCost) / newQty
          updateDoc(holdingRef, { quantity: newQty, averagePrice: newAvgPrice, lastUpdated: serverTimestamp() })
        } else {
          setDoc(holdingRef, { symbol, quantity: orderQty, averagePrice: orderPrice, lastUpdated: serverTimestamp() })
        }
        updateDoc(userRef, { balance: increment(-totalCost) })
        setUserBalance(prev => prev - totalCost)
      } else {
        const holdingSnap = await getDoc(holdingRef)
        if (!holdingSnap.exists() || holdingSnap.data().quantity < orderQty) {
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

  const toggleWatchlist = () => {
    if (!user || !watchlistDocRef) return
    if (isWatched) {
      deleteDoc(watchlistDocRef)
    } else {
      setDoc(watchlistDocRef, { symbol, addedAt: serverTimestamp() })
    }
  }

  const ChartComponent = () => (
    <ResponsiveContainer width="100%" height="100%">
      {chartType === 'area' ? (
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity={0.6}/>
              <stop offset="100%" stopColor={trendColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="1 4" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.2} />
          <XAxis dataKey="time" hide />
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip 
            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '16px' }}
            formatter={(value: any) => [`₹${parseFloat(value).toFixed(2)}`, "Price"]}
          />
          <Area type="monotone" dataKey="price" stroke={trendColor} strokeWidth={4} fillOpacity={1} fill="url(#colorPrice)" />
        </AreaChart>
      ) : (
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="1 4" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.2} />
          <XAxis dataKey="time" hide />
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '16px' }} />
          <Bar dataKey="wick" barSize={1} fill={trendColor} />
          <Bar dataKey="body" barSize={12} fill={trendColor} />
        </ComposedChart>
      )}
    </ResponsiveContainer>
  )

  return (
    <DashboardShell>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="gap-2 px-0" onClick={() => router.back()}>
            <ArrowLeft className="size-4" /> Market Explorer
          </Button>
          <div className="flex items-center gap-3">
            <Button variant={isWatched ? "secondary" : "outline"} onClick={toggleWatchlist} className="rounded-xl gap-2">
              {isWatched ? <BookmarkCheck className="size-4 fill-primary" /> : <Bookmark className="size-4" />}
              Watchlist
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center font-bold text-primary text-2xl border border-border/50">
                  {stock.symbol[0]}
                </div>
                <div>
                  <h1 className="text-4xl font-headline font-bold">{stock.name}</h1>
                  <div className={cn("text-lg font-bold mt-1", isUp ? "text-primary" : "text-destructive")}>
                    ₹{stock.price.toLocaleString()} ({isUp ? '+' : ''}{stock.change.toFixed(2)}%)
                  </div>
                </div>
              </div>
            </div>

            <div className="h-[450px] w-full glass-card p-4 rounded-[2.5rem] relative overflow-hidden shadow-2xl border-primary/10">
              <div className="absolute top-6 left-6 z-10 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setChartType('area')} className={cn(chartType === 'area' && "bg-primary text-white")}>Line</Button>
                <Button variant="outline" size="sm" onClick={() => setChartType('candle')} className={cn(chartType === 'candle' && "bg-primary text-white")}>Candle</Button>
              </div>
              <ChartComponent />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-1.5 bg-background/80 backdrop-blur-xl rounded-[2rem] border border-border">
                {["1D", "1W", "1M", "3M", "6M", "1Y"].map(t => (
                  <button key={t} onClick={() => setTimeframe(t as Timeframe)} className={cn("px-4 py-2 rounded-full text-xs font-bold", timeframe === t ? "bg-primary text-white" : "text-muted-foreground")}>{t}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <Card className="glass-card rounded-[2.5rem] overflow-hidden shadow-2xl">
              <CardHeader className="p-8">
                <CardTitle className="text-2xl font-headline font-bold">{stock.symbol}</CardTitle>
                <div className="text-sm text-muted-foreground">Trade directly with real-time settlement.</div>
              </CardHeader>
              <CardContent className="px-8 pb-10 space-y-6">
                <div className="flex p-1.5 bg-muted/50 rounded-2xl border">
                  <button onClick={() => setActiveOrderTab("BUY")} className={cn("flex-1 py-3 text-sm font-bold rounded-xl transition-all", activeOrderTab === "BUY" ? "bg-primary text-white" : "text-muted-foreground")}>BUY</button>
                  <button onClick={() => setActiveOrderTab("SELL")} className={cn("flex-1 py-3 text-sm font-bold rounded-xl transition-all", activeOrderTab === "SELL" ? "bg-destructive text-white" : "text-muted-foreground")}>SELL</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Qty</label>
                    <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="h-14 text-right text-xl font-bold bg-muted/30 border-none rounded-2xl" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Price</label>
                    <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="h-14 text-right text-xl font-bold bg-muted/30 border-none rounded-2xl" />
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-xs font-bold mb-4">
                    <span className="text-muted-foreground">Balance: ₹{userBalance.toLocaleString()}</span>
                    <span>Total: ₹{(parseFloat(qty) * parseFloat(price)).toLocaleString()}</span>
                  </div>
                  <Button 
                    className={cn("w-full h-16 rounded-2xl text-xl font-black transition-all", activeOrderTab === "BUY" ? "bg-primary shadow-primary/20" : "bg-destructive shadow-destructive/20")}
                    onClick={handleOrder}
                  >
                    {activeOrderTab === "BUY" ? "Buy Now" : "Sell Now"}
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
