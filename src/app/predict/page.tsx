
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
  TrendingUp, 
  TrendingDown, 
  Timer, 
  Zap, 
  History, 
  Loader2, 
  ChevronDown, 
  Trophy, 
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  BrainCircuit,
  Wallet
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
import { aiStockPredictionExplanation } from "@/ai/flows/ai-stock-prediction-explanation-flow"
import { MOCK_STOCKS, Stock } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import { useUser, useFirestore } from "@/firebase"
import { doc, getDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"

const FINNHUB_API_KEY = "d6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110";

const generateLiveData = (basePrice: number) => {
  return Array.from({ length: 40 }, (_, i) => ({
    time: i,
    price: +(basePrice + (Math.random() - 0.5) * (basePrice * 0.01)).toFixed(2)
  }))
}

export default function PredictionArenaPage() {
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()

  const [isMounted, setIsMounted] = React.useState(false)
  const [selectedStock, setSelectedStock] = React.useState(MOCK_STOCKS[0])
  const [liveStocks, setLiveStocks] = React.useState<Stock[]>(MOCK_STOCKS)
  const [chartData, setChartData] = React.useState<any[]>([])
  
  // Trade State
  const [isTrading, setIsTrading] = React.useState(false)
  const [tradeTimer, setTradeTimer] = React.useState(0)
  const [tradeAmount, setTradeAmount] = React.useState("100")
  const [prediction, setPrediction] = React.useState<"HIGHER" | "LOWER" | null>(null)
  const [entryPrice, setEntryPrice] = React.useState(0)
  const [tradeResult, setTradeResult] = React.useState<any>(null)
  const [userBalance, setUserBalance] = React.useState(0)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)

  const TRADE_DURATION = 15;
  const PAYOUT = 1.8;

  React.useEffect(() => {
    setIsMounted(true)
    setChartData(generateLiveData(selectedStock.price))
    
    async function fetchBalance() {
      if (!db || !user) return
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (snap.exists()) setUserBalance(snap.data().balance || 0)
    }
    fetchBalance()
  }, [selectedStock, db, user])

  // Price Simulation
  React.useEffect(() => {
    if (!isMounted) return
    const interval = setInterval(() => {
      setChartData(prev => {
        const last = prev[prev.length - 1]
        const nextPrice = +(last.price + (Math.random() - 0.5) * (selectedStock.price * 0.002)).toFixed(2)
        return [...prev.slice(1), { time: last.time + 1, price: nextPrice }]
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [isMounted, selectedStock])

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : selectedStock.price

  const executeTrade = async (dir: "HIGHER" | "LOWER") => {
    if (!db || !user || isTrading) return
    const amount = parseFloat(tradeAmount)
    if (amount > userBalance) {
      toast({ title: "Insufficient Balance", variant: "destructive" })
      return
    }

    setIsTrading(true)
    setPrediction(dir)
    setEntryPrice(currentPrice)
    setTradeTimer(TRADE_DURATION)
    setTradeResult(null)

    const userRef = doc(db, 'users', user.uid)
    await updateDoc(userRef, { balance: increment(-amount) })
    setUserBalance(prev => prev - amount)

    toast({ title: "Trade Open", description: `Predicted ${dir} for ${selectedStock.symbol}` })
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
    const isWin = (prediction === "HIGHER" && currentPrice > entryPrice) || (prediction === "LOWER" && currentPrice < entryPrice)
    const amount = parseFloat(tradeAmount)
    const winAmount = amount * PAYOUT

    if (isWin && db && user) {
      await updateDoc(doc(db, 'users', user.uid), { balance: increment(winAmount) })
      setUserBalance(prev => prev + winAmount)
    }

    setIsAnalyzing(true)
    try {
      const response = await aiStockPredictionExplanation({
        stockSymbol: selectedStock.symbol,
        userPrediction: prediction === "HIGHER" ? "UP" : "DOWN",
        userConfidence: 85,
        aiPrediction: Math.random() > 0.5 ? "UP" : "DOWN",
        actualResult: currentPrice > entryPrice ? "UP" : "DOWN"
      })
      setTradeResult({ win: isWin, explanation: response.explanation })
    } catch (e) {
      setTradeResult({ win: isWin, explanation: "AI Analyst temporarily offline, but your result was recorded." })
    } finally {
      setIsAnalyzing(false)
      setIsTrading(false)
    }
  }

  if (!isMounted) return null

  return (
    <DashboardShell>
      <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
        
        {/* Arena Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-headline font-bold">Live Trading Arena</h1>
              <Badge className="bg-primary/20 text-primary border-none uppercase tracking-widest text-[10px] font-black">Live Speculation</Badge>
            </div>
            <p className="text-muted-foreground text-sm">High-intensity paper trading with 15s settlement.</p>
          </div>
          <Card className="glass-card bg-primary/5 border-primary/20 px-6 py-3 flex items-center gap-4">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="size-5 text-primary" />
            </div>
            <div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Demo Balance</div>
              <div className="text-xl font-bold">₹{userBalance.toLocaleString()}</div>
            </div>
          </Card>
        </div>

        {/* Stock Quick Selector Bar */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {MOCK_STOCKS.slice(0, 8).map(stock => (
            <button
              key={stock.symbol}
              onClick={() => {
                if (!isTrading) {
                  setSelectedStock(stock)
                  setTradeResult(null)
                }
              }}
              className={cn(
                "px-6 py-3 rounded-xl border transition-all shrink-0 flex items-center gap-3",
                selectedStock.symbol === stock.symbol 
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                  : "bg-card/40 border-border hover:border-primary/50"
              )}
            >
              <span className="font-black text-sm">{stock.symbol}</span>
              <span className="text-[10px] opacity-80 font-bold">₹{stock.price.toFixed(2)}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Terminal View */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="glass-card bg-card/30 border-border/50 rounded-[2.5rem] overflow-hidden relative shadow-2xl">
              <div className="h-20 border-b border-border/50 bg-muted/20 px-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-foreground flex items-center justify-center text-background font-black">
                    {selectedStock.symbol[0]}
                  </div>
                  <div>
                    <div className="font-bold">{selectedStock.name}</div>
                    <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Live Feed • {selectedStock.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black font-headline">₹{currentPrice.toFixed(2)}</div>
                  <div className={cn("text-xs font-bold", currentPrice >= selectedStock.price ? "text-green-500" : "text-red-500")}>
                    {currentPrice >= selectedStock.price ? "+" : ""}{(currentPrice - selectedStock.price).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="h-[500px] w-full p-8 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="arenaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.2} />
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <ReferenceLine y={selectedStock.price} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} />
                    {isTrading && <ReferenceLine y={entryPrice} stroke="#f59e0b" strokeWidth={2} label={{ position: 'right', value: 'ENTRY', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />}
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3} 
                      fill="url(#arenaGradient)" 
                      animationDuration={300}
                    />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Live Overlays */}
                {isTrading && (
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 w-full max-w-xs px-8">
                    <Card className="glass-card bg-background/80 backdrop-blur-3xl p-6 shadow-2xl border-primary/30 rounded-3xl animate-in zoom-in-95">
                      <div className="space-y-4 text-center">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Trade</span>
                          <span className="text-xl font-black text-primary">{tradeTimer}s</span>
                        </div>
                        <Progress value={(tradeTimer / TRADE_DURATION) * 100} className="h-2 bg-muted/50" />
                        <div className="flex justify-between items-center text-[10px] font-black uppercase">
                          <div className={cn(prediction === "HIGHER" ? "text-green-500" : "text-red-500")}>{prediction} Prediction</div>
                          <div className="text-muted-foreground">Entry: ₹{entryPrice.toFixed(2)}</div>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </Card>

            {/* AI Outcome Analysis */}
            {tradeResult && (
              <Card className="glass-card border-primary/20 bg-primary/5 rounded-[2.5rem] p-10 animate-in slide-in-from-bottom-4 shadow-xl">
                <div className="flex items-start gap-8">
                  <div className={cn(
                    "size-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                    tradeResult.win ? "bg-green-500 shadow-green-500/20" : "bg-red-500 shadow-red-500/20"
                  )}>
                    {tradeResult.win ? <Trophy className="size-8 text-white" /> : <AlertCircle className="size-8 text-white" />}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <h3 className="text-2xl font-headline font-bold">
                        {tradeResult.win ? "Profit Secured!" : "Trade Expired"}
                      </h3>
                      <Badge variant={tradeResult.win ? "default" : "destructive"}>
                        {tradeResult.win ? `+₹${(parseFloat(tradeAmount) * (PAYOUT-1)).toFixed(2)}` : `-₹${tradeAmount}`}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest mb-2">
                      <BrainCircuit className="size-4" /> AI Tactical Review
                    </div>
                    <p className="text-foreground/80 text-sm leading-relaxed border-l-2 border-primary/20 pl-6">
                      {tradeResult.explanation}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right Control Panel (Pocket Option Style) */}
          <div className="space-y-6">
            <Card className="glass-card bg-card/40 border-primary/20 p-8 rounded-[2.5rem] shadow-2xl">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Trade Expiration</span>
                    <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary">15s</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {["15s", "30s", "60s", "2m"].map(t => (
                      <Button key={t} variant="outline" size="sm" className={cn("rounded-xl font-bold h-10", t === "15s" ? "border-primary bg-primary/5" : "")}>
                        {t}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Trade Amount</span>
                    <span className="text-[10px] font-bold text-primary">80% Profit</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-muted-foreground opacity-50">₹</span>
                    <Input 
                      type="number"
                      value={tradeAmount}
                      onChange={e => setTradeAmount(e.target.value)}
                      className="pl-10 h-14 bg-background/50 border-none rounded-2xl text-xl font-black shadow-inner focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {["100", "500", "1k", "2k"].map(val => (
                      <Button key={val} variant="ghost" size="sm" className="bg-muted/30 text-[10px] font-black h-8 rounded-lg" onClick={() => setTradeAmount(val.replace('k','000'))}>
                        +{val}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <Button 
                    onClick={() => executeTrade("HIGHER")}
                    disabled={isTrading}
                    className="w-full h-24 flex-col gap-2 rounded-[1.5rem] bg-green-500 hover:bg-green-600 shadow-[0_10px_30px_rgba(34,197,94,0.3)] border-none transition-all hover:scale-[1.02] active:scale-95 group"
                  >
                    {isTrading && prediction === "HIGHER" ? (
                      <Loader2 className="size-8 animate-spin" />
                    ) : (
                      <>
                        <ArrowUpCircle className="size-8 group-hover:animate-bounce" />
                        <span className="font-black text-sm tracking-widest uppercase">Higher</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={() => executeTrade("LOWER")}
                    disabled={isTrading}
                    className="w-full h-24 flex-col gap-2 rounded-[1.5rem] bg-red-500 hover:bg-red-600 shadow-[0_10px_30px_rgba(239,68,68,0.3)] border-none transition-all hover:scale-[1.02] active:scale-95 group"
                  >
                    {isTrading && prediction === "LOWER" ? (
                      <Loader2 className="size-8 animate-spin" />
                    ) : (
                      <>
                        <ArrowDownCircle className="size-8 group-hover:animate-bounce" />
                        <span className="font-black text-sm tracking-widest uppercase">Lower</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 text-center">
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Potential Payout</div>
                  <div className="text-xl font-black text-primary">₹{(parseFloat(tradeAmount) * PAYOUT).toLocaleString()}</div>
                </div>
              </div>
            </Card>

            <Card className="glass-card border-none bg-primary/5 p-6 rounded-[2rem]">
              <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-4 flex items-center gap-2">
                <History className="size-4 text-primary" /> Market Context
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Volatility</span>
                  <span className="font-bold text-orange-500">HIGH</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Market Trend</span>
                  <div className="flex items-center gap-1 text-green-500 font-bold">
                    <TrendingUp className="size-3" /> BULLISH
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
