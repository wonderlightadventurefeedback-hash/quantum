
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Timer, 
  Zap, 
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  BrainCircuit,
  Wallet,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
  Loader2
} from "lucide-react"
import { 
  Area, 
  AreaChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  ReferenceLine 
} from "recharts"
import { aiStockPredictionExplanation } from "@/ai/flows/ai-stock-prediction-explanation-flow"
import { MOCK_STOCKS } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase"
import { doc, increment, serverTimestamp, collection } from "firebase/firestore"
import { cn } from "@/lib/utils"

const generateLiveData = (basePrice: number) => {
  return Array.from({ length: 50 }, (_, i) => ({
    time: i,
    price: +(basePrice + (Math.random() - 0.5) * (basePrice * 0.008)).toFixed(2)
  }))
}

export default function PredictionArenaPage() {
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()

  const [isMounted, setIsMounted] = React.useState(false)
  const [selectedStock, setSelectedStock] = React.useState(MOCK_STOCKS[0])
  const [chartData, setChartData] = React.useState<any[]>([])
  
  // Trade State
  const [isTrading, setIsTrading] = React.useState(false)
  const [tradeTimer, setTradeTimer] = React.useState(0)
  const [tradeAmount, setTradeAmount] = React.useState("500")
  const [prediction, setPrediction] = React.useState<"UP" | "DOWN" | null>(null)
  const [entryPrice, setEntryPrice] = React.useState(0)
  const [tradeResult, setTradeResult] = React.useState<any>(null)

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, 'users', user.uid)
  }, [db, user])

  const { data: userProfile } = useDoc(userProfileRef)
  const balance = userProfile?.balance ?? 50000

  const TRADE_DURATION = 15;
  const PAYOUT = 1.8;

  React.useEffect(() => {
    setIsMounted(true)
    setChartData(generateLiveData(selectedStock.price))
  }, [selectedStock])

  React.useEffect(() => {
    if (!isMounted) return
    const interval = setInterval(() => {
      setChartData(prev => {
        if (prev.length === 0) return generateLiveData(selectedStock.price);
        const last = prev[prev.length - 1]
        const nextPrice = +(last.price + (Math.random() - 0.5) * (selectedStock.price * 0.0015)).toFixed(2)
        return [...prev.slice(1), { time: last.time + 1, price: nextPrice }]
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [isMounted, selectedStock])

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : selectedStock.price

  const executeTrade = async (dir: "UP" | "DOWN") => {
    if (!db || !user || isTrading) return
    const amount = parseFloat(tradeAmount)
    const currentBalance = userProfile?.balance ?? 50000

    if (amount <= 0 || isNaN(amount)) {
      toast({ title: "Invalid Amount", variant: "destructive" })
      return
    }
    if (amount > currentBalance) {
      toast({ title: "Insufficient Demo Capital", description: "You need more virtual funds to open this position.", variant: "destructive" })
      return
    }

    setIsTrading(true)
    setPrediction(dir)
    setEntryPrice(currentPrice)
    setTradeTimer(TRADE_DURATION)
    setTradeResult(null)

    const userRef = doc(db, 'users', user.uid)
    const newBalance = currentBalance - amount
    
    // Explicitly set the new balance to ensure no negative unitialized start
    setDocumentNonBlocking(userRef, { 
      balance: newBalance,
      updatedAt: serverTimestamp()
    }, { merge: true })
    
    toast({ title: "Trade Executed", description: `Virtual ${dir} position opened @ ₹${currentPrice}` })
  }

  React.useEffect(() => {
    let interval: any;
    if (isTrading && tradeTimer > 0) {
      interval = setInterval(() => setTradeTimer(t => t - 1), 1000)
    } else if (isTrading && tradeTimer === 0) {
      settleTrade()
    }
    return () => clearInterval(interval)
  }, [isTrading, tradeTimer])

  const settleTrade = async () => {
    if (!prediction) return;
    
    const isWin = (prediction === "UP" && currentPrice > entryPrice) || (prediction === "DOWN" && currentPrice < entryPrice)
    const amount = parseFloat(tradeAmount)
    const winAmount = amount * PAYOUT
    const profit = isWin ? (amount * 0.8) : -amount

    if (isWin && db && user) {
      const userRef = doc(db, 'users', user.uid)
      setDocumentNonBlocking(userRef, { 
        balance: increment(winAmount),
        updatedAt: serverTimestamp()
      }, { merge: true })
    }

    let aiReview = "AI Analyst busy, but your virtual result was recorded.";
    try {
      const response = await aiStockPredictionExplanation({
        stockSymbol: selectedStock.symbol,
        userPrediction: prediction!,
        userConfidence: 85,
        aiPrediction: Math.random() > 0.5 ? "UP" : "DOWN",
        actualResult: currentPrice > entryPrice ? "UP" : "DOWN"
      })
      aiReview = response.explanation;
      setTradeResult({ win: isWin, explanation: aiReview })
    } catch (e) {
      setTradeResult({ win: isWin, explanation: aiReview })
    }

    // Save trade record to Firestore history
    if (db && user) {
      const predictionsRef = collection(db, 'users', user.uid, 'stock_predictions');
      addDocumentNonBlocking(predictionsRef, {
        stockId: selectedStock.symbol,
        predictionTimestamp: serverTimestamp(),
        userPredictedDirection: prediction,
        actualDirection: currentPrice > entryPrice ? "UP" : "DOWN",
        userPredictionMatched: isWin,
        amount: amount,
        profit: profit,
        startPrice: entryPrice,
        endPrice: currentPrice,
        aiExplanation: aiReview,
        predictionHorizon: `${TRADE_DURATION}s`
      });
    }

    setIsTrading(false)
  }

  if (!isMounted) return null

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
        
        {/* Arena Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/40 p-6 rounded-[2rem] border border-border/50 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div className="size-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Activity className="size-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-headline font-black uppercase tracking-tighter">Live Speculation</h1>
                <Badge className="bg-primary/20 text-primary border-none font-black text-[9px] uppercase tracking-[0.2em]">Demo Arena</Badge>
              </div>
              <p className="text-muted-foreground text-xs font-medium mt-1">High-frequency paper trading with instant virtual settlement.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-muted/30 px-6 py-2 rounded-2xl border border-border/50">
              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Demo Balance</div>
              <div className="text-xl font-black font-headline text-primary">₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div className="h-10 w-px bg-border mx-2" />
            <Button variant="outline" className="rounded-xl border-2 font-bold h-12" onClick={() => router.push('/dashboard')}>
              Exit Arena
            </Button>
          </div>
        </div>

        {/* Asset Selector */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {MOCK_STOCKS.map(stock => (
            <button 
              key={stock.symbol} 
              onClick={() => { if (!isTrading) { setSelectedStock(stock); setTradeResult(null); } }} 
              className={cn(
                "px-6 py-4 rounded-2xl border transition-all shrink-0 flex items-center gap-4", 
                selectedStock.symbol === stock.symbol 
                  ? "bg-primary text-primary-foreground border-primary shadow-xl scale-105 z-10" 
                  : "bg-card/40 border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="font-black text-sm tracking-tight">{stock.symbol}</span>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black opacity-80">₹{stock.price.toFixed(2)}</span>
                <span className={cn("text-[9px] font-bold", stock.change >= 0 ? "text-green-400" : "text-red-400")}>
                  {stock.change >= 0 ? '+' : ''}{stock.change}%
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[650px]">
          {/* Main Chart Area */}
          <div className="lg:col-span-3 h-full">
            <Card className="h-full glass-card bg-black/40 border-border/50 rounded-[2.5rem] overflow-hidden relative shadow-2xl">
              <div className="absolute top-8 left-8 z-20 flex items-center gap-4">
                <div className="size-12 rounded-xl bg-white/10 backdrop-blur-xl flex items-center justify-center font-black text-xl border border-white/10">
                  {selectedStock.symbol[0]}
                </div>
                <div>
                  <div className="font-black text-lg tracking-tight">{selectedStock.name}</div>
                  <div className="flex items-center gap-2">
                    <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Demo Market • 80% Profit</span>
                  </div>
                </div>
              </div>

              <div className="absolute top-8 right-8 z-20 text-right">
                <div className="text-4xl font-black font-headline tracking-tighter text-white">₹{currentPrice.toFixed(2)}</div>
                <div className={cn("text-xs font-bold mt-1", currentPrice >= entryPrice ? "text-green-400" : "text-red-400")}>
                  {isTrading ? (currentPrice >= entryPrice ? <ArrowUpRight className="inline size-4" /> : <ArrowDownRight className="inline size-4" />) : null}
                  {isTrading ? (currentPrice - entryPrice).toFixed(2) : ""}
                </div>
              </div>

              <div className="h-full w-full p-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="arenaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    {isTrading && (
                      <ReferenceLine 
                        y={entryPrice} 
                        stroke="#f59e0b" 
                        strokeWidth={2} 
                        strokeDasharray="5 5"
                        label={{ position: 'right', value: 'STRIKE', fill: '#f59e0b', fontSize: 10, fontWeight: '900' }} 
                      />
                    )}
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={4} 
                      fill="url(#arenaGradient)" 
                      animationDuration={300} 
                    />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Overlay Trade Status */}
                {isTrading && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full max-w-sm bg-black/60 backdrop-blur-3xl p-10 rounded-[3rem] border border-primary/30 shadow-[0_0_100px_rgba(var(--primary),0.1)] text-center scale-up-center animate-in zoom-in-95">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Active Speculation</span>
                          <span className="text-4xl font-black font-headline text-white">{tradeTimer}s</span>
                        </div>
                        <Progress value={(tradeTimer / TRADE_DURATION) * 100} className="h-3 bg-white/5" />
                        <div className="flex justify-between items-end border-t border-white/5 pt-6">
                          <div className="text-left">
                            <div className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Entry Price</div>
                            <div className="text-lg font-black">₹{entryPrice.toFixed(2)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Prediction</div>
                            <div className={cn("text-lg font-black", prediction === "UP" ? "text-green-500" : "text-red-500")}>{prediction}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trade Result Card */}
                {tradeResult && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-30 p-10">
                    <Card className="w-full max-w-xl glass-card bg-card/90 border-primary/20 rounded-[3rem] p-12 shadow-2xl animate-in zoom-in-95">
                      <div className="flex flex-col items-center text-center space-y-8">
                        <div className={cn(
                          "size-24 rounded-3xl flex items-center justify-center shadow-2xl", 
                          tradeResult.win ? "bg-green-500 shadow-green-500/20" : "bg-red-500 shadow-red-500/20"
                        )}>
                          {tradeResult.win ? <Trophy className="size-12 text-white" /> : <AlertCircle className="size-12 text-white" />}
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-4xl font-black font-headline uppercase tracking-tighter">
                            {tradeResult.win ? "Virtual Profit!" : "Trade Expired"}
                          </h3>
                          <p className="text-muted-foreground font-medium">
                            {tradeResult.win ? `You earned ₹${(parseFloat(tradeAmount) * 0.8).toFixed(2)} demo profit.` : "The demo market moved against your prediction."}
                          </p>
                        </div>
                        <div className="w-full bg-muted/30 p-6 rounded-2xl text-left border-l-4 border-primary">
                          <div className="text-[10px] font-black uppercase text-primary tracking-widest mb-2 flex items-center gap-2">
                            <BrainCircuit className="size-3" /> AI Strategic Review
                          </div>
                          <p className="text-sm text-foreground/80 leading-relaxed italic">"{tradeResult.explanation}"</p>
                        </div>
                        <Button className="w-full h-14 rounded-2xl font-black text-lg uppercase tracking-tight" onClick={() => setTradeResult(null)}>
                          Continue Trading
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Control Panel */}
          <div className="h-full">
            <Card className="h-full glass-card bg-card/40 border-border/50 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-between">
              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Investment</span>
                    <span className="text-[10px] font-black text-primary uppercase">Profit +80%</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary text-xl">₹</span>
                    <Input 
                      type="number" 
                      value={tradeAmount} 
                      onChange={e => setTradeAmount(e.target.value)} 
                      className="h-16 pl-10 bg-black/40 border-none rounded-2xl text-2xl font-black focus-visible:ring-primary/40" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {["100", "500", "1000", "5000"].map(amt => (
                      <Button key={amt} variant="outline" className="rounded-xl font-black text-[10px] h-10 border-white/5 hover:bg-white/5" onClick={() => setTradeAmount(amt)}>
                        ₹{amt}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <div className="flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>Potential Return</span>
                    <span className="text-white">₹{(parseFloat(tradeAmount) * 1.8 || 0).toLocaleString()}</span>
                  </div>
                  <Button 
                    onClick={() => executeTrade("UP")} 
                    disabled={isTrading} 
                    className="w-full h-28 bg-green-500 hover:bg-green-600 rounded-[2rem] flex-col gap-2 shadow-xl shadow-green-500/10 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <ArrowUpCircle className="size-10" />
                    <span className="font-black text-lg uppercase tracking-tighter">Higher</span>
                  </Button>
                  <Button 
                    onClick={() => executeTrade("DOWN")} 
                    disabled={isTrading} 
                    className="w-full h-28 bg-red-500 hover:bg-red-600 rounded-[2rem] flex-col gap-2 shadow-xl shadow-red-500/10 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <ArrowDownCircle className="size-10" />
                    <span className="font-black text-lg uppercase tracking-tighter">Lower</span>
                  </Button>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-3 mt-6">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap className="size-5 text-primary fill-primary" />
                </div>
                <div className="text-[10px] font-medium text-muted-foreground leading-tight">
                  High-intensity mode active. Trades settle in real-time using virtual demo capital.
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
