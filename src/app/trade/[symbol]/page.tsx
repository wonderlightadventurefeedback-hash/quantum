
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
import { useUser, useFirestore } from "@/firebase"
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { useDoc } from "@/firebase"
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
    case "5Y": points = 200; multiplier = 0.50; break;
    default: points = 60;
  }

  let currentPrice = basePrice * (isBullish ? multiplier : (2 - multiplier));
  
  return Array.from({ length: points }, (_, i) => {
    const volatility = basePrice * 0.025; // Increased volatility for clearer candles
    const trend = isBullish ? (basePrice * (1 - multiplier)) / points : -(basePrice * (1 - multiplier)) / points;
    
    const open = currentPrice;
    const change = (Math.random() - 0.45) * volatility + trend;
    const close = open + change;
    
    // Hammer style logic: sometimes long wicks
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
      body: [open, close], // Range for the candle body
      wick: [low, high],   // Range for the candle wick
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
  const [orderType, setOrderType] = React.useState("Delivery")
  const [qty, setQty] = React.useState("1")
  const [price, setPrice] = React.useState(initialStock.price.toString())
  const [chartType, setChartType] = React.useState<'area' | 'candle'>('candle') // Default to candle for better technicals
  const [timeframe, setTimeframe] = React.useState<Timeframe>("1D")
  const [isFullScreen, setIsFullScreen] = React.useState(false)
  
  const isUp = stock.change >= 0;
  const trendColor = isUp ? "hsl(var(--primary))" : "hsl(var(--destructive))";
  
  const chartData = React.useMemo(() => generateChartData(stock.price, isUp, timeframe), [stock.price, isUp, timeframe])
  const priceChange = (stock.price * (Math.abs(stock.change) / 100)).toFixed(2)

  const watchlistDocRef = React.useMemo(() => {
    if (!db || !user) return null
    return doc(db, 'users', user.uid, 'watchlist', symbol)
  }, [db, user, symbol])
  
  const { data: watchlistItem } = useDoc(watchlistDocRef)
  const isWatched = !!watchlistItem

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
      // Catch network errors
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchLiveQuote()
    const interval = setInterval(fetchLiveQuote, 30000)
    return () => clearInterval(interval)
  }, [symbol])

  const performance = {
    todayLow: stock.price * 0.98,
    todayHigh: stock.price * 1.02,
    fiftyTwoWLow: stock.price * 0.65,
    fiftyTwoWHigh: stock.price * 1.05,
    open: stock.price * 0.99,
    prevClose: stock.price * 1.01,
    volume: stock.volume,
    totalTradedValue: "665 Cr",
    upperCircuit: stock.price * 1.1,
    lowerCircuit: stock.price * 0.9,
  }

  const handleOrder = () => {
    toast({
      title: `${activeOrderTab} Order Placed`,
      description: `Order for ${qty} shares of ${stock.symbol} at ₹${price} has been sent to the exchange.`,
    })
    if (isFullScreen) setIsFullScreen(false)
  }

  const toggleWatchlist = () => {
    if (!user || !watchlistDocRef) {
      toast({
        title: "Sign in required",
        description: "Please log in to manage your watchlist.",
        variant: "destructive"
      })
      return
    }

    if (isWatched) {
      deleteDoc(watchlistDocRef).catch(() => {
        const err = new FirestorePermissionError({ path: watchlistDocRef.path, operation: 'delete' })
        errorEmitter.emit('permission-error', err)
      })
      toast({ title: "Removed from Watchlist", description: `${stock.symbol} has been removed.` })
    } else {
      setDoc(watchlistDocRef, { symbol, addedAt: serverTimestamp() }).catch(() => {
        const err = new FirestorePermissionError({ path: watchlistDocRef.path, operation: 'create' })
        errorEmitter.emit('permission-error', err)
      })
      toast({ title: "Added to Watchlist", description: `${stock.symbol} is now being tracked.` })
    }
  }

  const ChartComponent = () => (
    <ResponsiveContainer width="100%" height="100%">
      {chartType === 'area' ? (
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity={0.6}/>
              <stop offset="100%" stopColor={trendColor} stopOpacity={0}/>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="1 4" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.2} />
          <XAxis dataKey="time" hide />
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip 
            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '16px', backdropFilter: 'blur(8px)' }}
            itemStyle={{ color: trendColor, fontWeight: 'bold' }}
            labelStyle={{ display: 'none' }}
            formatter={(value: any) => [`₹${parseFloat(value).toFixed(2)}`, "Current"]}
          />
          <Area type="monotone" dataKey="price" stroke={trendColor} strokeWidth={4} fillOpacity={1} fill="url(#colorPrice)" filter="url(#glow)" />
        </AreaChart>
      ) : (
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="1 4" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.2} />
          <XAxis dataKey="time" hide />
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip 
            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '16px' }}
            formatter={(value: any, name: string) => [`₹${parseFloat(Array.isArray(value) ? value[1] : value).toFixed(2)}`, name]}
            labelStyle={{ display: 'none' }}
          />
          {/* Wick: Thin line for hammer clarity */}
          <Bar dataKey="wick" barSize={1} filter="url(#glow)">
            {chartData.map((entry, index) => (
              <Cell key={`cell-wick-${index}`} fill={entry.isUp ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
            ))}
          </Bar>
          {/* Body: Thicker for professional visibility */}
          <Bar dataKey="body" barSize={14} filter="url(#glow)">
            {chartData.map((entry, index) => (
              <Cell key={`cell-body-${index}`} fill={entry.isUp ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
            ))}
          </Bar>
        </ComposedChart>
      )}
    </ResponsiveContainer>
  )

  return (
    <DashboardShell>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="gap-2 px-0 hover:bg-transparent" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
            <span className="text-sm font-medium">Back to Markets</span>
          </Button>
          <div className="flex items-center gap-3">
            {isLoading && <Loader2 className="size-4 animate-spin text-primary" />}
            <Button variant="outline" size="sm" className="rounded-xl gap-2 h-10 px-4">
              <Bell className="size-4" /> Create Alert
            </Button>
            <Button 
              variant={isWatched ? "secondary" : "outline"} 
              size="sm" 
              className={cn("rounded-xl gap-2 h-10 px-4 transition-all", isWatched && "bg-primary/10 text-primary border-primary/20")}
              onClick={toggleWatchlist}
            >
              {isWatched ? <BookmarkCheck className="size-4 fill-primary" /> : <Bookmark className="size-4" />}
              {isWatched ? "In Watchlist" : "Watchlist"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center font-bold text-primary text-2xl border border-border/50 shadow-sm transition-transform hover:scale-105">
                    {stock.symbol[0]}
                  </div>
                  <div>
                    <h1 className="text-4xl font-headline font-bold tracking-tight">{stock.name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium mt-1">
                      <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold">NSE</span>
                      <span className={isUp ? "text-primary" : "text-destructive"}>
                        ₹{stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({isUp ? '+' : ''}{stock.change.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="link" className="text-primary gap-2 font-bold group">
                  <span className="border-b border-primary/50 group-hover:border-primary transition-all">Option Chain</span>
                  <ExternalLink className="size-4" />
                </Button>
              </div>

              {/* Chart Section */}
              <div className="h-[500px] w-full glass-card p-4 rounded-[2.5rem] relative group/chart overflow-hidden shadow-2xl border-primary/10">
                <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
                  <Badge variant="outline" className="bg-background/80 backdrop-blur-md font-bold">Live</Badge>
                  <div className="flex p-0.5 bg-muted/50 rounded-lg border border-border/50">
                    <button onClick={() => setChartType('area')} className={cn("p-1.5 rounded-md", chartType === 'area' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                      <LineChartIcon className="size-4" />
                    </button>
                    <button onClick={() => setChartType('candle')} className={cn("p-1.5 rounded-md", chartType === 'candle' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                      <BarChart2 className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="absolute top-6 right-6 z-10">
                  <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="rounded-full bg-background/80 backdrop-blur-md border-border/50 hover:bg-primary/10 hover:border-primary/30">
                        <Maximize2 className="size-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-none w-screen h-screen m-0 p-0 bg-background border-none rounded-none">
                      <div className="flex flex-col h-full relative p-10 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <h2 className="text-3xl font-headline font-bold text-primary">{stock.name} <span className="text-muted-foreground text-sm">{stock.symbol}</span></h2>
                            <div className={cn("px-4 py-1 rounded-full text-lg font-bold", isUp ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}>
                              ₹{stock.price.toLocaleString()} ({isUp ? '+' : ''}{stock.change.toFixed(2)}%)
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex gap-2">
                              {["1D", "1W", "1M", "3M", "6M", "1Y"].map(t => (
                                <Button key={t} variant={timeframe === t ? "default" : "outline"} size="sm" className="rounded-full h-8 px-4" onClick={() => setTimeframe(t as Timeframe)}>{t}</Button>
                              ))}
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsFullScreen(false)}>
                              <X className="size-6" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex-1 min-h-0 bg-muted/5 rounded-[3rem] p-6 border border-border/50">
                          <ChartComponent />
                        </div>

                        <div className="flex items-center justify-center gap-4 pt-4">
                          <Button 
                            className="bg-primary hover:bg-primary/90 text-primary-foreground h-16 px-12 rounded-2xl text-xl font-black shadow-xl shadow-primary/20"
                            onClick={() => { setActiveOrderTab("BUY"); handleOrder(); }}
                          >
                            QUICK BUY {stock.symbol}
                          </Button>
                          <Button 
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground h-16 px-12 rounded-2xl text-xl font-black shadow-xl shadow-destructive/20"
                            onClick={() => { setActiveOrderTab("SELL"); handleOrder(); }}
                          >
                            QUICK SELL {stock.symbol}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <ChartComponent />
                
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-background/80 backdrop-blur-xl rounded-[2rem] border border-border shadow-2xl">
                  {(["1D", "1W", "1M", "3M", "6M", "1Y", "All"] as (Timeframe)[]).map((t) => (
                    <button 
                      key={t}
                      onClick={() => setTimeframe(t)}
                      className={cn(
                        "h-9 px-4 rounded-[1.25rem] text-[11px] font-bold transition-all",
                        t === timeframe ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                  <div className="w-px h-5 bg-border mx-1" />
                  <Button variant="outline" className="h-9 rounded-[1.25rem] text-[11px] font-bold gap-2 px-4 border-2 hover:bg-primary/5 hover:border-primary/50">
                    Terminal <Layout className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 gap-10">
                  {["Overview", "Technicals", "News", "Events", "F&O"].map((tab) => (
                    <TabsTrigger 
                      key={tab} 
                      value={tab.toLowerCase()}
                      className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-5 text-sm font-bold text-muted-foreground transition-all uppercase tracking-[0.2em]"
                    >
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="overview" className="pt-12 space-y-16">
                  <div className="space-y-10">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-headline font-bold">Performance Breakdown</h2>
                      <Info className="size-5 text-muted-foreground/60" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-14">
                      <RangeBar low={performance.todayLow} high={performance.todayHigh} current={stock.price} labelLow="Today's Low" labelHigh="Today's High" />
                      <RangeBar low={performance.fiftyTwoWLow} high={performance.fiftyTwoWHigh} current={stock.price} labelLow="52W Low" labelHigh="52W High" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-y-14 gap-x-12 p-8 bg-muted/20 rounded-[2rem] border border-border/50">
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Open</div>
                      <div className="text-xl font-bold">₹{performance.open.toFixed(2)}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Prev. Close</div>
                      <div className="text-xl font-bold">₹{performance.prevClose.toFixed(2)}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Volume</div>
                      <div className="text-xl font-bold">{performance.volume}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Traded Value</div>
                      <div className="text-xl font-bold">{performance.totalTradedValue}</div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="space-y-8">
            <Card className="glass-card border-none bg-card/60 backdrop-blur-3xl overflow-hidden rounded-[2.5rem] shadow-2xl border-t border-white/10 ring-1 ring-black/5">
              <CardHeader className="pb-6 pt-10 px-8">
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-headline font-bold">{stock.name}</span>
                  <span className={cn("text-xs font-bold", isUp ? "text-primary" : "text-destructive")}>
                    NSE ₹{stock.price.toLocaleString()} ({isUp ? '+' : ''}{stock.change.toFixed(2)}%)
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 px-8 pb-10">
                <div className="flex p-1.5 bg-muted/50 rounded-[1.5rem] border border-border/50">
                  <button onClick={() => setActiveOrderTab("BUY")} className={cn("flex-1 py-3 text-sm font-black rounded-xl transition-all duration-300", activeOrderTab === "BUY" ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02]" : "text-muted-foreground hover:text-foreground")}>BUY</button>
                  <button onClick={() => setActiveOrderTab("SELL")} className={cn("flex-1 py-3 text-sm font-black rounded-xl transition-all duration-300", activeOrderTab === "SELL" ? "bg-destructive text-destructive-foreground shadow-xl shadow-destructive/20 scale-[1.02]" : "text-muted-foreground hover:text-foreground")}>SELL</button>
                </div>

                <div className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Quantity</div>
                    <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="h-14 text-right text-xl font-bold bg-muted/30 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/40" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Price (Limit)</div>
                    <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="h-14 text-right text-xl font-bold bg-muted/30 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/40" />
                  </div>
                </div>

                <div className="pt-6 space-y-5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                    <span>Balance: ₹{MOCK_USER.balance.toLocaleString()}</span>
                    <span className="text-foreground">Total: ₹{(parseFloat(qty) * parseFloat(price)).toLocaleString()}</span>
                  </div>
                  <Button 
                    className={cn("w-full h-16 rounded-[1.5rem] text-xl font-black shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]", activeOrderTab === "BUY" ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-destructive text-destructive-foreground shadow-destructive/20")}
                    onClick={handleOrder}
                  >
                    {activeOrderTab === "BUY" ? "Buy Now" : "Sell Now"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-none bg-muted/30 p-6 rounded-[2rem]">
              <CardContent className="p-0 flex gap-4">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Info className="size-5 text-primary" /></div>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">Investing involves market risks. Ensure sufficient margin. Limit orders are filled at specified prices.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

