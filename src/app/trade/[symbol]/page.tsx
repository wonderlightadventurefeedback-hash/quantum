
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
  Loader2
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

const FINNHUB_API_KEY = "d6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110";

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

  // Real-time Balance and Profile
  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, 'users', user.uid)
  }, [db, user])

  const { data: userProfile } = useDoc(userProfileRef)
  const balance = typeof userProfile?.balance === 'number' && userProfile.balance >= 0 ? userProfile.balance : 50000

  // Live Prediction Mode State
  const [isLiveMode, setIsLiveMode] = React.useState(false)
  const [isTradingLive, setIsTradingLive] = React.useState(false)
  const [prediction, setPrediction] = React.useState<"HIGHER" | "LOWER" | null>(null)
  const [entryPrice, setEntryPrice] = React.useState<number>(0)
  const [tradeTimer, setTradeTimer] = React.useState(0)
  const [tradeAmount, setTradeAmount] = React.useState("100")
  const TRADE_DURATION = 15;
  const PAYOUT_RATIO = 1.8;

  const isUp = stock.change >= 0;
  
  const chartData = React.useMemo(() => {
    if (!isMounted) return [];
    const points = activeTimeframe === "1D" ? 40 : activeTimeframe === "5D" ? 60 : 30;
    return generateMarketData(points, stock.price, activeTimeframe);
  }, [stock.price, activeTimeframe, isMounted])

  const prevClose = stock.price * (isUp ? 0.985 : 1.015)

  React.useEffect(() => {
    setIsMounted(true);
  }, [])

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
    
    const currentBalance = balance
    const totalValue = orderQty * stock.price

    if (type === "BUY" && totalValue > currentBalance) {
      toast({ 
        title: "Insufficient Demo Funds", 
        description: `This virtual purchase costs ₹${totalValue.toLocaleString()}. Your demo balance is ₹${currentBalance.toLocaleString()}.`, 
        variant: "destructive" 
      })
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
          averagePrice: stock.price, 
          lastUpdated: serverTimestamp() 
        }, { merge: true })
        
        const newBalance = currentBalance - totalValue
        setDocumentNonBlocking(userRef, { 
          balance: newBalance,
          updatedAt: serverTimestamp()
        }, { merge: true })

        // Log Activity
        addDocumentNonBlocking(activityRef, {
          type: "ORDER_BUY",
          symbol,
          name: stock.name,
          quantity: orderQty,
          price: stock.price,
          total: totalValue,
          timestamp: serverTimestamp(),
          status: "COMPLETED"
        })
        
        toast({ title: "Virtual Buy Success", description: `Added ${orderQty} shares of ${symbol} to your demo portfolio.` })
      } else {
        const snap = await getDoc(holdingRef);
        const currentQty = snap.exists() ? snap.data().quantity : 0
        if (!snap.exists() || currentQty < orderQty) {
          throw new Error(`You don't own enough shares to sell this quantity. Available: ${currentQty}`);
        }
        
        setDocumentNonBlocking(holdingRef, { 
          quantity: increment(-orderQty), 
          lastUpdated: serverTimestamp() 
        }, { merge: true })
        
        const newBalance = currentBalance + totalValue
        setDocumentNonBlocking(userRef, { 
          balance: newBalance,
          updatedAt: serverTimestamp()
        }, { merge: true })

        // Log Activity
        addDocumentNonBlocking(activityRef, {
          type: "ORDER_SELL",
          symbol,
          name: stock.name,
          quantity: orderQty,
          price: stock.price,
          total: totalValue,
          timestamp: serverTimestamp(),
          status: "COMPLETED"
        })
        
        toast({ title: "Virtual Sell Success", description: `Sold ${orderQty} shares of ${symbol}. Funds added to demo balance.` })
      }
    } catch (e: any) {
      toast({ title: "Trade Error", description: e.message || "An error occurred", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const executeLiveTrade = async (dir: "HIGHER" | "LOWER") => {
    if (!db || !user || isTradingLive) return
    const amount = parseFloat(tradeAmount)
    const currentBalance = balance

    if (amount <= 0 || isNaN(amount)) {
      toast({ title: "Invalid Amount", variant: "destructive" })
      return
    }
    if (amount > currentBalance) {
      toast({ title: "Insufficient Balance", variant: "destructive" })
      return
    }

    setIsTradingLive(true)
    setPrediction(dir)
    setEntryPrice(stock.price)
    setTradeTimer(TRADE_DURATION)

    const userRef = doc(db, 'users', user.uid)
    const newBalance = currentBalance - amount
    setDocumentNonBlocking(userRef, { 
      balance: newBalance,
      updatedAt: serverTimestamp()
    }, { merge: true })
    
    toast({ title: "Position Opened", description: `Predicted ${dir} for ${symbol} @ ${stock.price.toFixed(2)}` })
  }

  React.useEffect(() => {
    let interval: any;
    if (isTradingLive && tradeTimer > 0) {
      interval = setInterval(() => setTradeTimer(t => t - 1), 1000)
    } else if (isTradingLive && tradeTimer === 0) {
      const finalPrice = stock.price + (Math.random() - 0.45) * 2;
      const isWin = (prediction === "HIGHER" && finalPrice > entryPrice) || (prediction === "LOWER" && finalPrice < entryPrice);
      const amount = parseFloat(tradeAmount)
      
      setIsTradingLive(false)
      if (isWin && db && user) {
        const userRef = doc(db, 'users', user.uid)
        setDocumentNonBlocking(userRef, { 
          balance: increment(amount * PAYOUT_RATIO),
          updatedAt: serverTimestamp()
        }, { merge: true })
        toast({ title: "TRADE WON", description: `Profited ₹${(amount * 0.8).toFixed(2)} in virtual returns.` })
      } else {
        toast({ variant: "destructive", title: "TRADE EXPIRED", description: "Market moved against your prediction." })
      }

      // Log Live Prediction Activity
      if (db && user) {
        const activityRef = collection(db, 'users', user.uid, 'activity');
        addDocumentNonBlocking(activityRef, {
          type: "ARENA_SPECULATE",
          symbol,
          name: stock.name,
          prediction: prediction,
          outcome: isWin ? "WIN" : "LOSS",
          stake: amount,
          total: isWin ? (amount * 0.8) : -amount,
          price: entryPrice,
          timestamp: serverTimestamp(),
          status: "SETTLED"
        })
      }
    }
    return () => clearInterval(interval)
  }, [isTradingLive, tradeTimer, db, user, prediction, entryPrice, stock.price, tradeAmount, symbol, stock.name])

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
            <div className="flex p-1 bg-muted/50 rounded-2xl">
              <button 
                onClick={() => setChartType("AREA")} 
                className={cn("p-2 rounded-xl transition-all", chartType === "AREA" ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
              >
                <LineChartIcon className="size-5" />
              </button>
              <button 
                onClick={() => setChartType("CANDLE")} 
                className={cn("p-2 rounded-xl transition-all", chartType === "CANDLE" ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
              >
                <CandleIcon className="size-5" />
              </button>
            </div>
            <div className="flex items-center space-x-3 bg-muted/50 px-5 py-2.5 rounded-2xl border border-border/50">
              <Switch id="live-mode" checked={isLiveMode} onCheckedChange={setIsLiveMode} />
              <Label htmlFor="live-mode" className="text-xs font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer">
                <Zap className={cn("size-4", isLiveMode ? "text-primary fill-primary animate-pulse" : "text-muted-foreground")} />
                Live Predict
              </Label>
            </div>
            <Button variant="outline" className="rounded-full gap-2 border-2 px-6 h-11 font-bold">
              <Plus className="size-4" /> Watchlist
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
                  {chartType === "CANDLE" ? (
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="time" hide />
                      <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <ReferenceLine y={prevClose} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                      {isTradingLive && <ReferenceLine y={entryPrice} stroke="#f59e0b" strokeWidth={2} label={{ position: 'right', value: 'ENTRY', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />}
                      <Tooltip content={<CustomTooltip chartType="CANDLE" />} />
                      <Bar dataKey="wick" fill="#8884d8" barSize={1}>
                        {chartData.map((entry, index) => (
                          <Cell key={`wick-${index}`} fill={entry.close >= entry.open ? '#22c55e' : '#ef4444'} />
                        ))}
                      </Bar>
                      <Bar dataKey="body" barSize={12}>
                        {chartData.map((entry, index) => (
                          <Cell key={`body-${index}`} fill={entry.close >= entry.open ? '#22c55e' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isUp ? "#22c55e" : "#ef4444"} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={isUp ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="time" hide />
                      <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <ReferenceLine y={prevClose} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                      {isTradingLive && <ReferenceLine y={entryPrice} stroke="#f59e0b" strokeWidth={2} label={{ position: 'right', value: 'ENTRY', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />}
                      <Tooltip content={<CustomTooltip chartType="AREA" />} />
                      <Area type="monotone" dataKey="price" stroke={isUp ? "#22c55e" : "#ef4444"} strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>

                {isLiveMode && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                    <Card className="glass-card w-full max-w-sm mx-auto p-8 shadow-2xl pointer-events-auto border-primary/20 bg-background/60 backdrop-blur-3xl rounded-[2.5rem] animate-in zoom-in-95 duration-500">
                      <div className="space-y-8">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-primary/20 text-primary border-none px-4 py-1.5 text-[10px] font-black uppercase tracking-widest">
                            Live Speculation
                          </Badge>
                          <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest bg-muted/30 px-3 py-1 rounded-full">
                            <Timer className="size-3.5 text-primary" /> {isTradingLive ? `${tradeTimer}s` : "Waiting"}
                          </div>
                        </div>

                        {isTradingLive ? (
                          <div className="space-y-6 py-6 text-center">
                            <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Settlement Pending</h4>
                            <div className="text-3xl font-black font-headline">{prediction}</div>
                            <div className="space-y-2">
                              <Progress value={(tradeTimer/TRADE_DURATION)*100} className="h-2.5 bg-muted/50 rounded-full" />
                              <div className="text-[10px] font-bold text-muted-foreground">ENTRY: ₹{entryPrice.toFixed(2)}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-8">
                            <div className="space-y-4">
                              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.1em]">Trade Amount</span>
                              <Input type="number" value={tradeAmount} onChange={e => setTradeAmount(e.target.value)} className="h-14 bg-muted/30 border-none rounded-2xl text-xl font-black" />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                              <Button onClick={() => executeLiveTrade("HIGHER")} className="h-24 flex-col gap-2 rounded-[1.5rem] bg-green-500 hover:bg-green-600"><ArrowUpCircle className="size-8" /><span className="font-black text-sm uppercase">Higher</span></Button>
                              <Button onClick={() => executeLiveTrade("LOWER")} className="h-24 flex-col gap-2 rounded-[1.5rem] bg-red-500 hover:bg-red-600"><ArrowDownCircle className="size-8" /><span className="font-black text-sm uppercase">Lower</span></Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-12 pt-8 border-t border-border/50">
              {[
                { label: "Mkt cap", value: "4.00LCr" },
                { label: "P/E ratio", value: "34.43" },
                { label: "Dividend yield", value: "0.38%" },
                { label: "Prev close", value: prevClose.toFixed(2) },
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
              <CardHeader className="pb-4 px-0">
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <Wallet className="size-5 text-primary" /> Instant Trade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 px-0">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Quantity</Label>
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
                    className="h-12 rounded-xl bg-green-500 font-bold hover:bg-green-600" 
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="animate-spin size-4" /> : "Buy"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleTrade("SELL")} 
                    className="h-12 rounded-xl border-2 border-red-500 text-red-500 font-bold hover:bg-red-50" 
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="animate-spin size-4" /> : "Sell"}
                  </Button>
                </div>
                <div className="pt-2 text-center">
                  <span className="text-xs text-muted-foreground">
                    Estimated Cost: <span className="font-bold text-foreground">₹{(parseFloat(qty) * stock.price || 0).toFixed(2)}</span>
                  </span>
                </div>
                <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Available Demo Balance</div>
                  <div className="text-lg font-black text-primary">₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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
                  {MOCK_STOCKS.filter(s => s.symbol !== symbol).slice(0, 5).map((s) => (
                    <div key={s.symbol} className="p-6 flex items-center justify-between hover:bg-muted/30 cursor-pointer group" onClick={() => router.push(`/trade/${s.symbol}`)}>
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-muted flex items-center justify-center font-bold text-primary group-hover:scale-110 transition-transform">
                          {s.symbol[0]}
                        </div>
                        <div><div className="font-bold text-sm">{s.name}</div><div className="text-[10px] text-muted-foreground uppercase">₹{s.price.toFixed(2)}</div></div>
                      </div>
                      <Badge variant={s.change > 0 ? "default" : "destructive"} className="h-7 min-w-[64px] justify-center rounded-lg font-black text-xs">
                        {s.change > 0 ? '+' : ''}{s.change.toFixed(2)}%
                      </Badge>
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
