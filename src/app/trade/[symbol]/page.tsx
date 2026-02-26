
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
  ArrowDownCircle
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

  // Live Prediction Mode State (Pocket Option Style)
  const [isLiveMode, setIsLiveMode] = React.useState(false)
  const [isTradingLive, setIsTradingLive] = React.useState(false)
  const [prediction, setPrediction] = React.useState<"HIGHER" | "LOWER" | null>(null)
  const [entryPrice, setEntryPrice] = React.useState<number>(0)
  const [tradeTimer, setTradeTimer] = React.useState(0)
  const [tradeResult, setTradeResult] = React.useState<"WIN" | "LOSS" | null>(null)
  const [tradeAmount, setTradeAmount] = React.useState("100")
  const TRADE_DURATION = 15; // 15 seconds for fast demo experience
  const PAYOUT_RATIO = 1.8; // 80% profit

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

  // Pocket Option Style Live Trade Logic
  const executeLiveTrade = async (dir: "HIGHER" | "LOWER") => {
    if (!db || !user || isTradingLive) return
    
    const amount = parseFloat(tradeAmount)
    if (amount <= 0 || isNaN(amount)) {
      toast({ title: "Invalid Amount", description: "Please enter a valid trade amount.", variant: "destructive" })
      return
    }

    if (amount > userBalance) {
      toast({ title: "Insufficient Balance", description: "Increase your demo funds to trade.", variant: "destructive" })
      return
    }

    setIsTradingLive(true)
    setPrediction(dir)
    setEntryPrice(stock.price)
    setTradeTimer(TRADE_DURATION)
    setTradeResult(null)

    // Deduct initial stake
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
      // Settle Trade logic
      // In a real app, we'd fetch the exact price at T+15
      // For demo, we simulate a slight movement from entry price
      const drift = (Math.random() - 0.45) * 2; // Bias slightly to win for demo feel
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
        toast({
          title: "PROFIT! +₹" + (winAmount - amount).toFixed(2),
          description: "Market settled at " + finalPrice.toFixed(2),
        })
      } else {
        toast({
          variant: "destructive",
          title: "TRADE EXPIRED",
          description: "Market settled against your prediction at " + finalPrice.toFixed(2),
        })
      }
    }
    return () => clearInterval(interval)
  }, [isTradingLive, tradeTimer, tradeAmount, db, user, toast, entryPrice, prediction, PAYOUT_RATIO])

  if (!isMounted) return null;

  return (
    <DashboardShell>
      <div className="max-w-[1280px] mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Section */}
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
              <Switch 
                id="live-mode" 
                checked={isLiveMode} 
                onCheckedChange={setIsLiveMode}
              />
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

        {/* Price and Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold font-headline">₹{stock.price.toFixed(2)}</span>
                <span className="text-xl font-medium text-muted-foreground">INR</span>
              </div>
              <div className={cn(
                "flex items-center gap-2 text-lg font-bold",
                isUp ? "text-green-500" : "text-red-500"
              )}>
                {isUp ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
                {isUp ? '+' : ''}{(stock.price * (stock.change / 100)).toFixed(2)} ({stock.change.toFixed(2)}%)
                <span className="text-muted-foreground font-normal text-sm ml-1">today</span>
              </div>
            </div>

            {/* Main Chart Area with Live Trade HUD */}
            <div className="relative group rounded-[2.5rem] overflow-hidden bg-card/30 border border-border/50 shadow-2xl backdrop-blur-sm">
              {/* Timeframe Selector */}
              <div className="flex border-b border-border/50 px-6 bg-muted/20">
                {["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "Max"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTimeframe(t as Timeframe)}
                    className={cn(
                      "px-4 py-4 text-[10px] font-black tracking-[0.2em] transition-all border-b-2 -mb-px",
                      activeTimeframe === t 
                        ? "border-primary text-primary" 
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
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
                    <YAxis 
                      domain={['auto', 'auto']} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <ReferenceLine y={prevClose} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    {isTradingLive && <ReferenceLine y={entryPrice} stroke="#f59e0b" strokeWidth={2} label={{ position: 'right', value: 'ENTRY', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />}
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
                      itemStyle={{ color: isUp ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke={isUp ? "#22c55e" : "#ef4444"} 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Pocket Option Style Live Trade HUD Overlay */}
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
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Pending Settlement</h4>
                              <div className="text-3xl font-black font-headline">
                                {prediction === "HIGHER" ? "HIGHER" : "LOWER"}
                              </div>
                            </div>
                            <Progress value={(tradeTimer/TRADE_DURATION)*100} className="h-2.5 bg-muted/50 rounded-full overflow-hidden" />
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-muted/20 rounded-2xl">
                                <span className="block text-[8px] font-black text-muted-foreground uppercase mb-1 tracking-tighter">Entry Price</span>
                                <span className="font-bold text-sm">₹{entryPrice.toFixed(2)}</span>
                              </div>
                              <div className="p-3 bg-muted/20 rounded-2xl">
                                <span className="block text-[8px] font-black text-muted-foreground uppercase mb-1 tracking-tighter">Current Price</span>
                                <span className="font-bold text-sm">₹{stock.price.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-8">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.1em]">Trade Amount</span>
                                <span className="text-[10px] font-bold text-primary">Demo Bal: ₹{userBalance.toLocaleString()}</span>
                              </div>
                              <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-muted-foreground opacity-50">₹</span>
                                <Input 
                                  type="number" 
                                  value={tradeAmount} 
                                  onChange={e => setTradeAmount(e.target.value)}
                                  className="pl-10 h-14 bg-muted/30 border-none rounded-2xl text-xl font-black focus-visible:ring-2 focus-visible:ring-primary/20 transition-all shadow-inner"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-md">
                                  PAYOUT: 180%
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-5">
                              <Button 
                                onClick={() => executeLiveTrade("HIGHER")}
                                className="h-24 flex-col gap-2 rounded-[1.5rem] bg-green-500 hover:bg-green-600 shadow-[0_10px_30px_rgba(34,197,94,0.3)] border-none transition-transform hover:scale-105 active:scale-95"
                              >
                                <ArrowUpCircle className="size-8" />
                                <span className="font-black text-sm tracking-widest uppercase">Higher</span>
                              </Button>
                              <Button 
                                onClick={() => executeLiveTrade("LOWER")}
                                className="h-24 flex-col gap-2 rounded-[1.5rem] bg-red-500 hover:bg-red-600 shadow-[0_10px_30px_rgba(239,68,68,0.3)] border-none transition-transform hover:scale-105 active:scale-95"
                              >
                                <ArrowDownCircle className="size-8" />
                                <span className="font-black text-sm tracking-widest uppercase">Lower</span>
                              </Button>
                            </div>
                          </div>
                        )}

                        {tradeResult && (
                          <div className={cn(
                            "p-5 rounded-3xl flex items-center justify-center gap-4 animate-in zoom-in-95 duration-500 shadow-xl",
                            tradeResult === "WIN" 
                              ? "bg-green-500/20 text-green-500 border border-green-500/30" 
                              : "bg-red-500/20 text-red-500 border border-red-500/30"
                          )}>
                            {tradeResult === "WIN" ? <Trophy className="size-6 animate-bounce" /> : <AlertCircle className="size-6" />}
                            <div>
                              <div className="font-black uppercase tracking-[0.2em] text-xs">
                                RESULT: {tradeResult === "WIN" ? "SUCCESS" : "FAILED"}
                              </div>
                              <div className="text-[10px] font-bold opacity-80">
                                {tradeResult === "WIN" ? "Virtual profit credited!" : "Market moved against you."}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Grid */}
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
                <div key={i} className="flex justify-between items-center border-b border-border/50 pb-2 group cursor-help">
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</span>
                  <span className="text-sm font-bold">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="space-y-8">
            {/* Trade Controller (Standard Investing) */}
            <Card className="glass-card bg-primary/5 border-primary/20 rounded-[2.5rem] overflow-hidden shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <Wallet className="size-5 text-primary" /> Instant Trade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    <span>Quantity</span>
                    <span>Buying Power: ₹{userBalance.toLocaleString()}</span>
                  </div>
                  <Input 
                    type="number" 
                    value={qty} 
                    onChange={e => setQty(e.target.value)} 
                    className="h-12 bg-background border-none rounded-xl text-lg font-bold shadow-inner"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={() => handleTrade("BUY")} 
                    className="h-12 rounded-xl bg-green-500 hover:bg-green-600 font-bold shadow-lg shadow-green-500/20"
                    disabled={isBuying}
                  >
                    {isBuying ? <Loader2 className="animate-spin" /> : "Buy"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleTrade("SELL")} 
                    className="h-12 rounded-xl border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold transition-all"
                    disabled={isBuying}
                  >
                    Sell
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Related Stocks */}
            <Card className="glass-card rounded-[2.5rem] border-none shadow-sm overflow-hidden">
              <div className="flex bg-muted/30">
                <button className="flex-1 py-4 text-[10px] uppercase font-black tracking-widest border-b-2 border-primary text-primary">Related Assets</button>
                <button className="flex-1 py-4 text-[10px] uppercase font-black tracking-widest text-muted-foreground">Recent</button>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {MOCK_STOCKS.filter(s => s.symbol !== symbol).slice(0, 4).map((s) => (
                    <div 
                      key={s.symbol} 
                      className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/trade/${s.symbol}`)}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm group-hover:text-primary transition-colors">{s.name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-medium">₹{s.price.toFixed(2)}</div>
                      </div>
                      <Badge variant={s.change > 0 ? "default" : "destructive"} className="h-7 min-w-[64px] justify-center rounded-lg font-black text-xs">
                        {s.change > 0 ? <TrendingUp className="size-3 mr-1" /> : <TrendingDown className="size-3 mr-1" />}
                        {Math.abs(s.change).toFixed(2)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Financial Intelligence Cards */}
            <div className="grid grid-cols-1 gap-4">
              <Card className="glass-card p-6 rounded-[2rem] space-y-4 hover:border-primary/30 transition-all cursor-default">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Quarterly financials</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">₹14.38KCr</div>
                  <div className="text-xs text-green-500 font-bold flex items-center gap-1">
                    <TrendingUp className="size-3" /> +15.65% Y/Y Revenue
                  </div>
                </div>
              </Card>
              <Card className="glass-card p-6 rounded-[2rem] space-y-4 hover:border-primary/30 transition-all cursor-default">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Market Sentiment</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-green-500 font-bold text-lg">BULLISH</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-black">AI Analysis</div>
                  </div>
                  <div className="space-y-1 border-l border-border/50 pl-4">
                    <div className="text-primary font-bold text-lg">72%</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-black">Confidence</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
