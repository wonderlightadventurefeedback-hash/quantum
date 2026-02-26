
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { 
  Plus, 
  MoreVertical, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Zap,
  Timer,
  ArrowUpCircle,
  ArrowDownCircle,
  LineChart as LineChartIcon,
  CandlestickChart as CandleIcon,
  Loader2,
  Activity
} from "lucide-react"
import { 
  BarChart,
  Bar,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  AreaChart,
  Area
} from "recharts"
import { MOCK_STOCKS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase"
import { doc, serverTimestamp, getDoc, increment, collection } from "firebase/firestore"

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

type Timeframe = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "Max";
type ChartType = "AREA" | "CANDLE";

interface OHLCData {
  time: string;
  open: number;
  close: number;
  high: number;
  low: number;
  body: [number, number];
  wick: [number, number];
  price: number;
}

const generateMarketData = (points: number, basePrice: number, tf: string): OHLCData[] => {
  let currentPrice = basePrice * 0.98;
  return Array.from({ length: points }, (_, i) => {
    const open = currentPrice;
    const volatility = basePrice * 0.01;
    const close = currentPrice + (Math.random() - 0.48) * volatility;
    const high = Math.max(open, close) + Math.random() * (volatility * 0.5);
    const low = Math.min(open, close) - Math.random() * (volatility * 0.5);
    currentPrice = close;
    
    return {
      time: tf === "1D" ? `${9 + Math.floor(i/6)}:${(i%6)*10}` : `Day ${i + 1}`,
      open: +open.toFixed(2),
      close: +close.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      body: [Math.min(open, close), Math.max(open, close)],
      wick: [low, high],
      price: +close.toFixed(2)
    };
  });
};

const CustomTooltip = ({ active, payload, chartType }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isUp = data.close >= data.open;
    
    if (chartType === "CANDLE") {
      return (
        <div className="bg-background border border-border p-3 rounded-xl shadow-2xl space-y-1">
          <div className="text-[10px] font-black text-muted-foreground uppercase">{data.time}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="text-[10px] text-muted-foreground">OPEN: <span className="text-foreground font-bold">{data.open}</span></div>
            <div className="text-[10px] text-muted-foreground">CLOSE: <span className="text-foreground font-bold">{data.close}</span></div>
            <div className="text-[10px] text-muted-foreground">HIGH: <span className="text-foreground font-bold">{data.high}</span></div>
            <div className="text-[10px] text-muted-foreground">LOW: <span className="text-foreground font-bold">{data.low}</span></div>
          </div>
          <div className={cn("text-xs font-black mt-1", isUp ? "text-green-500" : "text-red-500")}>
            {isUp ? "BULLISH" : "BEARISH"}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-background border border-border p-3 rounded-xl shadow-2xl">
        <div className="text-[10px] font-black text-muted-foreground uppercase">{data.time}</div>
        <div className="text-lg font-bold">₹{data.price}</div>
      </div>
    );
  }
  return null;
};

export default function StockDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const symbol = (params?.symbol as string) || "AAPL"
  const { user } = useUser()
  const db = useFirestore()
  
  const initialStock = MOCK_STOCKS.find(s => s.symbol === symbol) || MOCK_STOCKS[0]
  const [stock, setStock] = React.useState(initialStock)
  const [isMounted, setIsMounted] = React.useState(false)
  const [activeTimeframe, setActiveTimeframe] = React.useState<Timeframe>("1D")
  const [chartType, setChartType] = React.useState<ChartType>("AREA")
  const [qty, setQty] = React.useState("1")
  const [isProcessing, setIsProcessing] = React.useState(false)

  // Real-time Balance fetch
  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, 'users', user.uid)
  }, [db, user])
  const { data: userProfile } = useDoc(userProfileRef)
  const balance = typeof userProfile?.balance === 'number' ? userProfile.balance : 50000

  // Live Prediction Mode State
  const [isLiveMode, setIsLiveMode] = React.useState(false)
  const [isTradingLive, setIsTradingLive] = React.useState(false)
  const [prediction, setPrediction] = React.useState<"HIGHER" | "LOWER" | null>(null)
  const [entryPrice, setEntryPrice] = React.useState<number>(0)
  const [tradeTimer, setTradeTimer] = React.useState(0)
  const [tradeAmount, setTradeAmount] = React.useState("100")
  const TRADE_DURATION = 15;
  const PAYOUT_RATIO = 1.8;

  const [simulatedData, setSimulatedData] = React.useState<OHLCData[]>([])

  React.useEffect(() => {
    setIsMounted(true);
    setSimulatedData(generateMarketData(40, stock.price, "1D"));
  }, [])

  // Optimized ticker with "Spring-Anchor" to Finnhub live data
  React.useEffect(() => {
    if (!isMounted) return
    const interval = setInterval(() => {
      setSimulatedData(prev => {
        if (prev.length === 0) return generateMarketData(40, stock.price, "1D");
        const last = prev[prev.length - 1]
        const drift = (Math.random() - 0.5) * (stock.price * 0.0008)
        const anchorPull = (stock.price - last.price) * 0.15
        const nextPrice = +(last.price + drift + anchorPull).toFixed(2)
        
        const nextPoint: OHLCData = {
          time: last.time, 
          open: last.price,
          close: nextPrice,
          high: Math.max(last.price, nextPrice) + 0.1,
          low: Math.min(last.price, nextPrice) - 0.1,
          body: [Math.min(last.price, nextPrice), Math.max(last.price, nextPrice)],
          wick: [Math.min(last.price, nextPrice) - 0.15, Math.max(last.price, nextPrice) + 0.15],
          price: nextPrice
        }
        return [...prev.slice(1), nextPoint]
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [isMounted, stock.price])

  const currentSimulatedPrice = simulatedData.length > 0 ? simulatedData[simulatedData.length - 1].price : stock.price
  const isUp = stock.change >= 0;
  const prevClose = stock.price * (isUp ? 0.985 : 1.015)

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
        }
      }
    } catch (error) {}
  }, [symbol])

  React.useEffect(() => {
    fetchLiveQuote()
    const interval = setInterval(fetchLiveQuote, 30000)
    return () => clearInterval(interval)
  }, [fetchLiveQuote])

  const handleTrade = async (type: "BUY" | "SELL") => {
    if (!db || !user || isProcessing) return
    const orderQty = parseFloat(qty)
    if (isNaN(orderQty) || orderQty <= 0) {
      toast({ title: "Invalid Quantity", variant: "destructive" })
      return
    }
    
    const executionPrice = currentSimulatedPrice
    const totalCost = orderQty * executionPrice

    if (type === "BUY" && totalCost > balance) {
      toast({ title: "Insufficient Balance", description: `Order costs ₹${totalCost.toLocaleString()}. Balance: ₹${balance.toLocaleString()}`, variant: "destructive" })
      return
    }

    setIsProcessing(true)
    const holdingRef = doc(db, 'users', user.uid, 'holdings', symbol)
    const userRef = doc(db, 'users', user.uid)
    const activityRef = collection(db, 'users', user.uid, 'activity')

    try {
      if (type === "BUY") {
        setDocumentNonBlocking(holdingRef, { 
          symbol, 
          name: stock.name,
          quantity: increment(orderQty), 
          averagePrice: executionPrice, 
          lastUpdated: serverTimestamp() 
        }, { merge: true })
        
        setDocumentNonBlocking(userRef, { 
          balance: increment(-totalCost),
          updatedAt: serverTimestamp()
        }, { merge: true })

        addDocumentNonBlocking(activityRef, {
          type: "ORDER_BUY",
          symbol,
          name: stock.name,
          quantity: orderQty,
          price: executionPrice,
          total: -totalCost,
          timestamp: serverTimestamp(),
          status: "COMPLETED"
        })
        
        toast({ title: "Order Executed", description: `Bought ${orderQty} ${symbol} @ ₹${executionPrice}` })
      } else {
        const snap = await getDoc(holdingRef);
        if (!snap.exists() || snap.data().quantity < orderQty) throw new Error("Insufficient units");
        
        setDocumentNonBlocking(holdingRef, { 
          quantity: increment(-orderQty), 
          lastUpdated: serverTimestamp() 
        }, { merge: true })
        
        setDocumentNonBlocking(userRef, { 
          balance: increment(totalCost),
          updatedAt: serverTimestamp()
        }, { merge: true })

        addDocumentNonBlocking(activityRef, {
          type: "ORDER_SELL",
          symbol,
          name: stock.name,
          quantity: orderQty,
          price: executionPrice,
          total: totalCost,
          timestamp: serverTimestamp(),
          status: "COMPLETED"
        })
        
        toast({ title: "Order Executed", description: `Sold ${orderQty} ${symbol} @ ₹${executionPrice}` })
      }
    } catch (e: any) {
      toast({ title: "Trade Error", description: e.message, variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const executeLiveTrade = async (dir: "HIGHER" | "LOWER") => {
    if (!db || !user || isTradingLive) return
    const amount = parseFloat(tradeAmount)
    if (amount > balance) {
      toast({ title: "Insufficient Balance", variant: "destructive" })
      return
    }

    setIsTradingLive(true)
    setPrediction(dir)
    setEntryPrice(currentSimulatedPrice)
    setTradeTimer(TRADE_DURATION)

    setDocumentNonBlocking(doc(db, 'users', user.uid), { 
      balance: increment(-amount),
      updatedAt: serverTimestamp()
    }, { merge: true })
    
    toast({ title: "Position Opened", description: `Predicted ${dir} @ ₹${currentSimulatedPrice}` })
  }

  React.useEffect(() => {
    if (isTradingLive && tradeTimer > 0) {
      const timer = setInterval(() => setTradeTimer(t => t - 1), 1000)
      return () => clearInterval(timer)
    } else if (isTradingLive && tradeTimer === 0) {
      const isWin = (prediction === "HIGHER" && currentSimulatedPrice > entryPrice) || (prediction === "LOWER" && currentSimulatedPrice < entryPrice);
      const amount = parseFloat(tradeAmount)
      const profit = isWin ? (amount * 0.8) : -amount
      
      setIsTradingLive(false)
      if (isWin) {
        setDocumentNonBlocking(doc(db, 'users', user!.uid), { 
          balance: increment(amount * PAYOUT_RATIO),
          updatedAt: serverTimestamp()
        }, { merge: true })
        toast({ title: "TRADE WON", description: `Virtual Profit: ₹${(amount * 0.8).toFixed(2)}` })
      } else {
        toast({ variant: "destructive", title: "TRADE LOST", description: "Market moved against prediction." })
      }

      addDocumentNonBlocking(collection(db, 'users', user!.uid, 'activity'), {
        type: "ARENA_SPECULATE",
        symbol,
        name: stock.name,
        prediction,
        outcome: isWin ? "WIN" : "LOSS",
        stake: amount,
        total: profit,
        price: entryPrice,
        timestamp: serverTimestamp(),
        status: "SETTLED"
      })
    }
  }, [isTradingLive, tradeTimer, prediction, currentSimulatedPrice, entryPrice, tradeAmount, db, user, stock.name, symbol])

  if (!isMounted) return null;

  const livePL = isTradingLive ? (prediction === "HIGHER" ? (currentSimulatedPrice - entryPrice) : (entryPrice - currentSimulatedPrice)) : 0

  return (
    <DashboardShell>
      <div className="max-w-[1440px] mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-foreground flex items-center justify-center text-background text-2xl font-black shadow-xl">
              {symbol[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-headline font-bold">{stock.name}</h1>
                <MoreVertical className="size-5 text-muted-foreground cursor-pointer" />
              </div>
              <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest mt-1">
                <Activity className="size-3 text-primary" /> Exchange: {symbol} • Live Terminal
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex p-1 bg-muted/50 rounded-2xl">
              <button onClick={() => setChartType("AREA")} className={cn("p-2 rounded-xl transition-all", chartType === "AREA" ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}><LineChartIcon className="size-5" /></button>
              <button onClick={() => setChartType("CANDLE")} className={cn("p-2 rounded-xl transition-all", chartType === "CANDLE" ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}><CandleIcon className="size-5" /></button>
            </div>
            <div className="flex items-center space-x-3 bg-primary/5 px-5 py-2.5 rounded-2xl border border-primary/20">
              <Switch id="live-mode" checked={isLiveMode} onCheckedChange={setIsLiveMode} />
              <Label htmlFor="live-mode" className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 cursor-pointer">
                <Zap className={cn("size-4", isLiveMode ? "text-primary fill-primary animate-pulse" : "text-muted-foreground")} />
                Live Predict
              </Label>
            </div>
            <Button variant="outline" className="rounded-full gap-2 border-2 px-6 h-11 font-bold">
              <Plus className="size-4" /> Watchlist
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-3 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-bold font-headline tracking-tighter flex items-center gap-4">
                    <span className="size-3 bg-primary rounded-full animate-pulse"></span>
                    ₹{currentSimulatedPrice.toFixed(2)}
                  </span>
                  <Badge variant="outline" className="text-[10px] uppercase font-black px-2 py-1 tracking-widest bg-muted/50">LIVE</Badge>
                </div>
                <div className={cn("flex items-center gap-2 text-lg font-bold", isUp ? "text-green-500" : "text-red-500")}>
                  {isUp ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
                  {isUp ? '+' : ''}{(stock.price * (stock.change / 100)).toFixed(2)} ({stock.change.toFixed(2)}%)
                </div>
              </div>
              
              {isTradingLive && (
                <div className="bg-black/10 backdrop-blur-xl border border-primary/30 p-4 rounded-2xl min-w-[240px] animate-in slide-in-from-right-4 shadow-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest">Real-Time P/L</span>
                    <span className="text-[10px] font-black uppercase text-muted-foreground">{tradeTimer}s Left</span>
                  </div>
                  <div className={cn("text-2xl font-black font-headline", livePL >= 0 ? "text-green-500" : "text-red-500")}>
                    {livePL >= 0 ? "+" : ""}₹{Math.abs(livePL).toFixed(2)}
                  </div>
                  <div className="text-[9px] text-muted-foreground font-black mt-1 uppercase tracking-tighter">Predicted {prediction} @ ₹{entryPrice.toFixed(2)}</div>
                </div>
              )}
            </div>

            <div className="relative rounded-[3rem] overflow-hidden bg-card/20 border border-border/50 shadow-2xl backdrop-blur-md">
              <div className="flex border-b border-border/50 px-8 bg-muted/10">
                {["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "Max"].map((t) => (
                  <button key={t} onClick={() => setActiveTimeframe(t as Timeframe)} className={cn("px-6 py-5 text-[10px] font-black tracking-[0.2em] transition-all border-b-2 -mb-px", activeTimeframe === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>{t}</button>
                ))}
              </div>

              <div className="h-[540px] w-full p-10 relative">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "CANDLE" ? (
                    <BarChart data={simulatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.2} />
                      <XAxis dataKey="time" hide />
                      <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 700 }} />
                      <ReferenceLine y={prevClose} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" opacity={0.5} />
                      {isTradingLive && <ReferenceLine y={entryPrice} stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" label={{ position: 'right', value: 'STRIKE', fill: '#f59e0b', fontSize: 10, fontWeight: '900' }} />}
                      <Tooltip content={<CustomTooltip chartType="CANDLE" />} />
                      <Bar dataKey="wick" fill="#8884d8" barSize={1}>{simulatedData.map((e, i) => (<Cell key={i} fill={e.close >= e.open ? '#22c55e' : '#ef4444'} />))}</Bar>
                      <Bar dataKey="body" barSize={12}>{simulatedData.map((e, i) => (<Cell key={i} fill={e.close >= e.open ? '#22c55e' : '#ef4444'} />))}</Bar>
                    </BarChart>
                  ) : (
                    <AreaChart data={simulatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs><linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={isUp ? "#22c55e" : "#ef4444"} stopOpacity={0.3}/><stop offset="95%" stopColor={isUp ? "#22c55e" : "#ef4444"} stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.2} />
                      <XAxis dataKey="time" hide />
                      <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 700 }} />
                      <ReferenceLine y={prevClose} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" opacity={0.5} />
                      {isTradingLive && <ReferenceLine y={entryPrice} stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" label={{ position: 'right', value: 'STRIKE', fill: '#f59e0b', fontSize: 10, fontWeight: '900' }} />}
                      <Tooltip content={<CustomTooltip chartType="AREA" />} />
                      <Area type="monotone" dataKey="price" stroke={isUp ? "#22c55e" : "#ef4444"} strokeWidth={4} fillOpacity={1} fill="url(#colorPrice)" animationDuration={300} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>

                {isLiveMode && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                    <Card className="glass-card w-full max-w-sm p-10 pointer-events-auto border-primary/30 bg-background/40 backdrop-blur-3xl rounded-[3rem] animate-in zoom-in-95 shadow-[0_0_100px_rgba(var(--primary),0.1)]">
                      <div className="space-y-10">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-primary/20 text-primary border-none px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em]">Real-Time Speculation</Badge>
                          <div className="flex items-center gap-3 text-xs font-black text-muted-foreground uppercase tracking-widest bg-muted/30 px-4 py-1.5 rounded-full"><Timer className="size-4 text-primary" /> {isTradingLive ? `${tradeTimer}s` : "STANDBY"}</div>
                        </div>
                        {isTradingLive ? (
                          <div className="space-y-8 py-6 text-center">
                            <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em]">Position Settlement</h4>
                            <div className={cn("text-4xl font-black font-headline tracking-tighter", prediction === "HIGHER" ? "text-green-500" : "text-red-500")}>{prediction}</div>
                            <div className="space-y-3">
                              <Progress value={(tradeTimer/TRADE_DURATION)*100} className="h-3 bg-white/5 rounded-full" />
                              <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest"><span>Entry: ₹{entryPrice.toFixed(2)}</span><span>Live: ₹{currentSimulatedPrice.toFixed(2)}</span></div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-10">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center px-1"><span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Stake Amount</span><span className="text-[10px] font-black text-primary">Return: 80%</span></div>
                              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary text-xl">₹</span><Input type="number" value={tradeAmount} onChange={e => setTradeAmount(e.target.value)} className="h-16 pl-10 bg-black/20 border-none rounded-2xl text-2xl font-black focus-visible:ring-primary/40" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <Button onClick={() => executeLiveTrade("HIGHER")} className="h-28 flex-col gap-2 rounded-[2rem] bg-green-500 hover:bg-green-600 shadow-xl shadow-green-500/20 transition-all hover:scale-[1.05] active:scale-95"><ArrowUpCircle className="size-10" /><span className="font-black text-sm uppercase tracking-widest">Higher</span></Button>
                              <Button onClick={() => executeLiveTrade("LOWER")} className="h-28 flex-col gap-2 rounded-[2rem] bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all hover:scale-[1.05] active:scale-95"><ArrowDownCircle className="size-10" /><span className="font-black text-sm uppercase tracking-widest">Lower</span></Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <Card className="glass-card bg-primary/5 border-primary/20 rounded-[3rem] p-8 shadow-2xl">
              <CardHeader className="pb-6 px-0"><CardTitle className="text-xl font-headline font-bold flex items-center gap-3"><Wallet className="size-6 text-primary" /> Terminal Order</CardTitle></CardHeader>
              <CardContent className="space-y-8 px-0">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Order Quantity</Label>
                  <Input type="number" value={qty} onChange={e => setQty(e.target.value)} className="h-14 bg-background border-none rounded-2xl text-2xl font-black shadow-inner" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={() => handleTrade("BUY")} className="h-14 rounded-2xl bg-green-500 font-black text-lg uppercase tracking-tighter hover:bg-green-600 shadow-lg shadow-green-500/20 active:scale-95 transition-all" disabled={isProcessing}>{isProcessing ? <Loader2 className="animate-spin size-5" /> : "Buy"}</Button>
                  <Button variant="outline" onClick={() => handleTrade("SELL")} className="h-14 rounded-2xl border-2 border-red-500 text-red-500 font-black text-lg uppercase tracking-tighter hover:bg-red-500 hover:text-white shadow-lg shadow-red-500/10 active:scale-95 transition-all" disabled={isProcessing}>{isProcessing ? <Loader2 className="animate-spin size-5" /> : "Sell"}</Button>
                </div>
                <div className="text-center py-4 bg-muted/20 rounded-2xl border border-border/50">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Estimated Cost (Real-Time)</span>
                  <span className="text-xl font-black text-foreground">₹{(parseFloat(qty) * currentSimulatedPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="mt-4 p-6 rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">
                  <div className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-1.5 flex items-center gap-2"><Wallet className="size-3" /> Available Demo Balance</div>
                  <div className="text-2xl font-black text-primary tracking-tight">₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card rounded-[3rem] border-none shadow-xl overflow-hidden">
              <div className="flex bg-muted/30"><button className="flex-1 py-5 text-[10px] uppercase font-black tracking-[0.2em] border-b-2 border-primary text-primary">Sectors</button><button className="flex-1 py-5 text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Market</button></div>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {MOCK_STOCKS.filter(s => s.symbol !== symbol).slice(0, 6).map((s) => (
                    <div key={s.symbol} className="p-6 flex items-center justify-between hover:bg-muted/30 cursor-pointer group transition-colors" onClick={() => router.push(`/trade/${s.symbol}`)}>
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-muted/50 flex items-center justify-center font-black text-primary group-hover:scale-110 transition-transform">{s.symbol[0]}</div>
                        <div><div className="font-bold text-sm text-foreground">{s.name}</div><div className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">₹{s.price.toFixed(2)}</div></div>
                      </div>
                      <Badge variant={s.change > 0 ? "default" : "destructive"} className="h-7 min-w-[72px] justify-center rounded-lg font-black text-[10px]">{s.change > 0 ? '+' : ''}{s.change.toFixed(2)}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
