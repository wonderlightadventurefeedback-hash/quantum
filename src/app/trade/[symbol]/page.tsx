"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft, 
  Plus, 
  MoreVertical, 
  TrendingUp, 
  TrendingDown, 
  ChevronDown, 
  Info,
  Wallet,
  Loader2,
  RefreshCw,
  Zap,
  Timer,
  Trophy,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  Bookmark,
  BarChart3,
  Code
} from "lucide-react"
import { 
  Area, 
  AreaChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from "recharts"
import { MOCK_STOCKS, Stock } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useUser, useFirestore } from "@/firebase"
import { doc, setDoc, serverTimestamp, getDoc, updateDoc, increment } from "firebase/firestore"

const FINNHUB_API_KEY = "d6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110";

type Timeframe = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "Max";

const generateAreaChartData = (basePrice: number, isBullish: boolean) => {
  const points = 40;
  let currentPrice = basePrice * (isBullish ? 0.97 : 1.03);
  return Array.from({ length: points }, (_, i) => {
    const drift = (Math.random() - 0.48) * (basePrice * 0.01);
    currentPrice += drift;
    return {
      time: `${9 + Math.floor(i/6)}:${(i%6)*10} am`,
      price: +currentPrice.toFixed(2),
    };
  })
}

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
  const [qty, setQty] = React.useState("1")
  const [userBalance, setUserBalance] = React.useState<number>(0)
  const [isBuying, setIsBuying] = React.useState(false)

  // Live Prediction Mode State
  const [isLiveMode, setIsLiveMode] = React.useState(false)
  const [isTradingLive, setIsTradingLive] = React.useState(false)
  const [prediction, setPrediction] = React.useState<"HIGHER" | "LOWER" | null>(null)
  const [entryPrice, setEntryPrice] = React.useState<number>(0)
  const [tradeTimer, setTradeTimer] = React.useState(0)
  const [tradeResult, setTradeResult] = React.useState<"WIN" | "LOSS" | null>(null)
  const [tradeAmount, setTradeAmount] = React.useState("100")
  const TRADE_DURATION = 15;
  const PAYOUT_RATIO = 1.8;

  const isUp = stock.change >= 0;
  const chartData = React.useMemo(() => isMounted ? generateAreaChartData(stock.price, isUp) : [], [stock.price, isUp, isMounted])
  const prevClose = stock.price * (isUp ? 0.985 : 1.015)

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
    if (!db || !user) return
    const orderQty = parseFloat(qty)
    const totalCost = orderQty * stock.price

    if (type === "BUY" && totalCost > userBalance) {
      toast({ title: "Insufficient Funds", variant: "destructive" })
      return
    }

    setIsBuying(true)
    const holdingRef = doc(db, 'users', user.uid, 'holdings', symbol)
    const userRef = doc(db, 'users', user.uid)

    try {
      if (type === "BUY") {
        await updateDoc(holdingRef, { 
          symbol, 
          quantity: increment(orderQty), 
          averagePrice: stock.price, 
          lastUpdated: serverTimestamp() 
        }).catch(async () => {
          await setDoc(holdingRef, { symbol, quantity: orderQty, averagePrice: stock.price, lastUpdated: serverTimestamp() })
        })
        await updateDoc(userRef, { balance: increment(-totalCost) })
        setUserBalance(prev => prev - totalCost)
      } else {
        const snap = await getDoc(holdingRef);
        if (!snap.exists() || snap.data().quantity < orderQty) {
          throw new Error("Insufficient holdings");
        }
        await updateDoc(holdingRef, { quantity: increment(-orderQty), lastUpdated: serverTimestamp() })
        await updateDoc(userRef, { balance: increment(totalCost) })
        setUserBalance(prev => prev + totalCost)
      }
      toast({ title: `${type} Successful`, description: `${orderQty} units of ${symbol} processed.` })
    } catch (e: any) {
      toast({ title: "Trade Failed", description: e.message || "An error occurred", variant: "destructive" })
    } finally {
      setIsBuying(false)
    }
  }

  const executeLiveTrade = async (dir: "HIGHER" | "LOWER") => {
    if (!db || !user || isTradingLive) return
    
    const amount = parseFloat(tradeAmount)
    if (amount <= 0 || isNaN(amount)) {
      toast({ title: "Invalid Amount", variant: "destructive" })
      return
    }

    if (amount > userBalance) {
      toast({ title: "Insufficient Balance", variant: "destructive" })
      return
    }

    setIsTradingLive(true)
    setPrediction(dir)
    setEntryPrice(stock.price)
    setTradeTimer(TRADE_DURATION)
    setTradeResult(null)

    const userRef = doc(db, 'users', user.uid)
    try {
      await updateDoc(userRef, { balance: increment(-amount) })
      setUserBalance(prev => prev - amount)
    } catch (err) {
      setIsTradingLive(false)
      toast({ title: "Execution Error", variant: "destructive" })
      return
    }

    toast({
      title: "Trade Open",
      description: `Predicted ${dir} for ${symbol} @ ${stock.price.toFixed(2)}`,
    })
  }

  React.useEffect(() => {
    let interval: any;
    if (isTradingLive && tradeTimer > 0) {
      interval = setInterval(() => setTradeTimer(t => t - 1), 1000)
    } else if (isTradingLive && tradeTimer === 0) {
      const drift = (Math.random() - 0.45) * 2;
      const finalPrice = entryPrice + drift;
      const isHigher = finalPrice > entryPrice;
      const isWin = (prediction === "HIGHER" && isHigher) || (prediction === "LOWER" && !isHigher);
      const amount = parseFloat(tradeAmount)
      const winAmount = amount * PAYOUT_RATIO
      setTradeResult(isWin ? "WIN" : "LOSS")
      setIsTradingLive(false)
      if (isWin && db && user) {
        updateDoc(doc(db, 'users', user.uid), { balance: increment(winAmount) })
        setUserBalance(prev => prev + winAmount)
        toast({ title: "PROFIT! +₹" + (winAmount - amount).toFixed(2) })
      } else {
        toast({ variant: "destructive", title: "TRADE EXPIRED" })
      }
    }
    return () => clearInterval(interval)
  }, [isTradingLive, tradeTimer, tradeAmount, db, user, toast, entryPrice, prediction])

  if (!isMounted) return null;

  return (
    <DashboardShell>
      <div className="max-w-[1280px] mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
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
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                EXCHANGE: {symbol}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-3 bg-muted/50 px-5 py-2.5 rounded-2xl border border-border/50 shadow-sm transition-all hover:border-primary/30">
              <Switch id="live-mode" checked={isLiveMode} onCheckedChange={setIsLiveMode} />
              <Label htmlFor="live-mode" className="text-xs font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer">
                <Zap className={cn("size-4", isLiveMode ? "text-primary fill-primary animate-pulse" : "text-muted-foreground")} />
                Live Predict
              </Label>
            </div>
            <Button variant="outline" className="rounded-full gap-2 border-2 px-6 h-11 font-bold">
              <Plus className="size-4" /> Watchlist
            </Button>
            <Button className="rounded-full gap-2 px-8 h-11 font-bold shadow-lg shadow-primary/20" onClick={() => router.push('/trade')}>
              All Assets
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold font-headline">₹{stock.price.toFixed(2)}</span>
                <span className="text-xl font-medium text-muted-foreground">INR</span>
              </div>
              <div className={cn("flex items-center gap-2 text-lg font-bold", isUp ? "text-green-500" : "text-red-500")}>
                {isUp ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
                {isUp ? '+' : ''}{(stock.price * (stock.change / 100)).toFixed(2)} ({stock.change.toFixed(2)}%)
                <span className="text-muted-foreground font-normal text-sm ml-1">today</span>
              </div>
            </div>

            <div className="relative group rounded-[2.5rem] overflow-hidden bg-card/30 border border-border/50 shadow-2xl backdrop-blur-sm">
              <div className="flex border-b border-border/50 px-6 bg-muted/20">
                {["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "Max"].map((t) => (
                  <button key={t} onClick={() => setActiveTimeframe(t as Timeframe)} className={cn("px-4 py-4 text-[10px] font-black tracking-[0.2em] transition-all border-b-2 -mb-px", activeTimeframe === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
                    {t}
                  </button>
                ))}
              </div>

              <div className="h-[480px] w-full p-8 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isUp ? "#22c55e" : "#ef4444"} stopOpacity={0.15}/>
                        <stop offset="95%" stopColor={isUp ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <ReferenceLine y={prevClose} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    {isTradingLive && <ReferenceLine y={entryPrice} stroke="#f59e0b" strokeWidth={2} label={{ position: 'right', value: 'ENTRY', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />}
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }} itemStyle={{ color: isUp ? '#22c55e' : '#ef4444', fontWeight: 'bold' }} />
                    <Area type="monotone" dataKey="price" stroke={isUp ? "#22c55e" : "#ef4444"} strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" activeDot={{ r: 6, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>

                {isLiveMode && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                    <Card className="glass-card w-full max-w-sm mx-auto p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] pointer-events-auto border-primary/20 bg-background/60 backdrop-blur-3xl rounded-[2.5rem] animate-in zoom-in-95 duration-500">
                      <div className="space-y-8">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-primary/20 text-primary border-none gap-1.5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest">
                            <Zap className="size-3 fill-primary" /> Live Speculation
                          </Badge>
                          <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest bg-muted/30 px-3 py-1 rounded-full">
                            <Timer className="size-3.5 text-primary" /> {isTradingLive ? `${tradeTimer}s` : "Waiting"}
                          </div>
                        </div>

                        {isTradingLive ? (
                          <div className="space-y-6 py-6 text-center">
                            <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Pending Settlement</h4>
                            <div className="text-3xl font-black font-headline">{prediction}</div>
                            <Progress value={(tradeTimer/TRADE_DURATION)*100} className="h-2.5 bg-muted/50 rounded-full" />
                          </div>
                        ) : (
                          <div className="space-y-8">
                            <div className="space-y-4">
                              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.1em]">Trade Amount</span>
                              <Input type="number" value={tradeAmount} onChange={e => setTradeAmount(e.target.value)} className="h-14 bg-muted/30 border-none rounded-2xl text-xl font-black" />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                              <Button onClick={() => executeLiveTrade("HIGHER")} className="h-24 flex-col gap-2 rounded-[1.5rem] bg-green-500"><ArrowUpCircle className="size-8" /><span className="font-black text-sm uppercase">Higher</span></Button>
                              <Button onClick={() => executeLiveTrade("LOWER")} className="h-24 flex-col gap-2 rounded-[1.5rem] bg-red-500"><ArrowDownCircle className="size-8" /><span className="font-black text-sm uppercase">Lower</span></Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-12 pt-8">
              {[
                { label: "Open", value: (stock.price * 0.99).toFixed(2) },
                { label: "Mkt cap", value: "4.00LCr" },
                { label: "Dividend", value: "0.38%" },
                { label: "High", value: (stock.price * 1.02).toFixed(2) },
                { label: "P/E ratio", value: "34.43" },
                { label: "Qtrly div amt", value: "0.26" },
                { label: "Low", value: (stock.price * 0.98).toFixed(2) },
                { label: "52-wk high", value: "288.61" },
                { label: "52-wk low", value: "169.21" },
              ].map((stat, i) => (
                <div key={i} className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                  <span className="text-sm font-bold">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <Card className="glass-card bg-primary/5 border-primary/20 rounded-[2.5rem] p-6 shadow-xl">
              <CardHeader className="pb-4 px-0"><CardTitle className="text-lg font-headline flex items-center gap-2"><Wallet className="size-5 text-primary" /> Instant Trade</CardTitle></CardHeader>
              <CardContent className="space-y-6 px-0">
                <Input type="number" value={qty} onChange={e => setQty(e.target.value)} className="h-12 bg-background border-none rounded-xl text-lg font-bold" />
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => handleTrade("BUY")} className="h-12 rounded-xl bg-green-500 font-bold" disabled={isBuying}>Buy</Button>
                  <Button variant="outline" onClick={() => handleTrade("SELL")} className="h-12 rounded-xl border-2 border-red-500 text-red-500 font-bold" disabled={isBuying}>Sell</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card rounded-[2.5rem] border-none shadow-sm overflow-hidden">
              <div className="flex bg-muted/30">
                <button className="flex-1 py-4 text-[10px] uppercase font-black tracking-widest border-b-2 border-primary text-primary">Related Assets</button>
                <button className="flex-1 py-4 text-[10px] uppercase font-black tracking-widest text-muted-foreground">Recent</button>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {MOCK_STOCKS.filter(s => s.symbol !== symbol).slice(0, 4).map((s) => (
                    <div key={s.symbol} className="p-6 flex items-center justify-between hover:bg-muted/30 cursor-pointer" onClick={() => router.push(`/trade/${s.symbol}`)}>
                      <div><div className="font-bold text-sm">{s.name}</div><div className="text-[10px] text-muted-foreground uppercase">₹{s.price.toFixed(2)}</div></div>
                      <Badge variant={s.change > 0 ? "default" : "destructive"} className="h-7 min-w-[64px] justify-center rounded-lg font-black text-xs">{s.change > 0 ? '+' : ''}{Math.abs(s.change).toFixed(2)}%</Badge>
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
