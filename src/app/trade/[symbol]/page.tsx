
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
  AlertCircle
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
  const [prediction, setPrediction] = React.useState<"UP" | "DOWN" | null>(null)
  const [tradeTimer, setTradeTimer] = React.useState(0)
  const [tradeResult, setTradeResult] = React.useState<"WIN" | "LOSS" | null>(null)
  const [tradeAmount, setTradeAmount] = React.useState("100")

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
        await updateDoc(holdingRef, { quantity: increment(-orderQty), lastUpdated: serverTimestamp() })
        await updateDoc(userRef, { balance: increment(totalCost) })
        setUserBalance(prev => prev + totalCost)
      }
      toast({ title: `${type} Successful`, description: `${orderQty} units of ${symbol} processed.` })
    } catch (e) {
      toast({ title: "Trade Failed", variant: "destructive" })
    } finally {
      setIsBuying(false)
    }
  }

  // Live Trade HUD Logic
  const executeLiveTrade = async (dir: "UP" | "DOWN") => {
    const amount = parseFloat(tradeAmount)
    if (amount > userBalance) {
      toast({ title: "Insufficient Balance", description: "Increase your demo funds to trade.", variant: "destructive" })
      return
    }
    if (isTradingLive) return

    setIsTradingLive(true)
    setPrediction(dir)
    setTradeTimer(15) // 15 second trade
    setTradeResult(null)

    const userRef = doc(db!, 'users', user!.uid)
    await updateDoc(userRef, { balance: increment(-amount) })
    setUserBalance(prev => prev - amount)

    toast({
      title: "Live Trade Executed",
      description: `Predicted ${dir} for ${symbol}. Settling in 15s...`,
    })
  }

  React.useEffect(() => {
    let interval: any;
    if (isTradingLive && tradeTimer > 0) {
      interval = setInterval(() => setTradeTimer(t => t - 1), 1000)
    } else if (isTradingLive && tradeTimer === 0) {
      // Settle Trade
      const isWin = Math.random() > 0.45 // 55% win rate for demo feel
      const winAmount = parseFloat(tradeAmount) * 1.8 // 80% profit
      
      setTradeResult(isWin ? "WIN" : "LOSS")
      setIsTradingLive(false)

      if (isWin && db && user) {
        updateDoc(doc(db, 'users', user.uid), { balance: increment(winAmount) })
        setUserBalance(prev => prev + winAmount)
        toast({
          title: "TRADE WON! 🎉",
          description: `₹${winAmount.toFixed(2)} credited to your demo account.`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Trade Expired",
          description: "Market moved against your prediction.",
        })
      }
    }
    return () => clearInterval(interval)
  }, [isTradingLive, tradeTimer, tradeAmount, db, user, toast])

  if (!isMounted) return null;

  return (
    <DashboardShell>
      <div className="max-w-[1280px] mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-foreground flex items-center justify-center text-background text-2xl font-black">
              {symbol[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-headline font-bold">{stock.name}</h1>
                <MoreVertical className="size-5 text-muted-foreground cursor-pointer" />
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                NASDAQ: {symbol}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2 bg-muted/50 px-4 py-2 rounded-2xl border border-border/50">
              <Switch 
                id="live-mode" 
                checked={isLiveMode} 
                onCheckedChange={setIsLiveMode}
              />
              <Label htmlFor="live-mode" className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Zap className={cn("size-3", isLiveMode ? "text-primary fill-primary" : "text-muted-foreground")} />
                Live Predict
              </Label>
            </div>
            <Button variant="outline" className="rounded-full gap-2 border-2 px-6 h-11 font-bold">
              <Plus className="size-4" /> Follow
            </Button>
            <Button className="rounded-full gap-2 px-8 h-11 font-bold shadow-lg shadow-primary/20" onClick={() => router.push('/trade')}>
              Explore
            </Button>
          </div>
        </div>

        {/* Price and Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold font-headline">{stock.price.toFixed(2)}</span>
                <span className="text-xl font-medium text-muted-foreground">USD</span>
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
            <div className="relative group rounded-[2.5rem] overflow-hidden bg-card/30 border border-border/50">
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

              <div className="h-[450px] w-full p-8 relative">
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

                {/* Live Trade HUD Overlay */}
                {isLiveMode && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Card className="glass-card w-full max-w-sm mx-auto p-6 shadow-2xl pointer-events-auto border-primary/20 bg-background/40 backdrop-blur-2xl rounded-[2rem] animate-in zoom-in-95">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1 px-3">
                            <Zap className="size-3 fill-primary" /> Live Demo Trade
                          </Badge>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            <Timer className="size-3 text-primary" /> {isTradingLive ? `${tradeTimer}s` : "Idle"}
                          </div>
                        </div>

                        {isTradingLive ? (
                          <div className="space-y-4 py-4">
                            <div className="flex justify-between items-center text-sm font-bold">
                              <span>Settling {prediction} Prediction</span>
                              <span className="text-primary">{Math.round((tradeTimer/15)*100)}%</span>
                            </div>
                            <Progress value={(tradeTimer/15)*100} className="h-2 bg-muted/50" />
                            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
                              Entering @ {stock.price.toFixed(2)} USD
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <span>Entry Amount</span>
                                <span>Bal: ₹{userBalance.toLocaleString()}</span>
                              </div>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                                <Input 
                                  type="number" 
                                  value={tradeAmount} 
                                  onChange={e => setTradeAmount(e.target.value)}
                                  className="pl-8 h-12 bg-background border-none rounded-xl text-lg font-bold focus-visible:ring-primary/20"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <Button 
                                onClick={() => executeLiveTrade("UP")}
                                className="h-20 flex-col gap-2 rounded-2xl bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20"
                              >
                                <TrendingUp className="size-6" />
                                <span className="font-bold">UP</span>
                              </Button>
                              <Button 
                                onClick={() => executeLiveTrade("DOWN")}
                                className="h-20 flex-col gap-2 rounded-2xl bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
                              >
                                <TrendingDown className="size-6" />
                                <span className="font-bold">DOWN</span>
                              </Button>
                            </div>
                          </div>
                        )}

                        {tradeResult && (
                          <div className={cn(
                            "p-4 rounded-xl flex items-center justify-center gap-3 animate-in zoom-in-95",
                            tradeResult === "WIN" ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                          )}>
                            {tradeResult === "WIN" ? <Trophy className="size-5" /> : <AlertCircle className="size-5" />}
                            <span className="font-black uppercase tracking-widest text-xs">
                              Trade Result: {tradeResult}
                            </span>
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
            {/* Trade Controller */}
            <Card className="glass-card bg-primary/5 border-primary/20 rounded-[2.5rem] overflow-hidden shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <Wallet className="size-5 text-primary" /> Execute Trade
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
                    className="h-12 bg-background border-none rounded-xl text-lg font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={() => handleTrade("BUY")} 
                    className="h-12 rounded-xl bg-green-500 hover:bg-green-600 font-bold"
                    disabled={isBuying}
                  >
                    {isBuying ? <Loader2 className="animate-spin" /> : "Buy"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleTrade("SELL")} 
                    className="h-12 rounded-xl border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold"
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
                <button className="flex-1 py-4 text-[10px] uppercase font-black tracking-widest border-b-2 border-primary text-primary">Related</button>
                <button className="flex-1 py-4 text-[10px] uppercase font-black tracking-widest text-muted-foreground">Following</button>
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
                        <div className="text-[10px] text-muted-foreground uppercase font-medium">{s.price} USD</div>
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
              <Card className="glass-card p-6 rounded-[2rem] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Quarterly financials</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">14.38KCr</div>
                  <div className="text-xs text-green-500 font-bold flex items-center gap-1">
                    <TrendingUp className="size-3" /> +15.65% Y/Y Revenue
                  </div>
                </div>
              </Card>
              <Card className="glass-card p-6 rounded-[2rem] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Earnings</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-green-500 font-bold text-lg">+6.25%</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-black">EPS Beat</div>
                  </div>
                  <div className="space-y-1 border-l border-border/50 pl-4">
                    <div className="text-green-500 font-bold text-lg">+3.78%</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-black">Revenue Beat</div>
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
