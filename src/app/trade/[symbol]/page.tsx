
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  RefreshCw
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
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-full gap-2 border-2 px-6 h-11 font-bold">
              <Plus className="size-4" /> Follow
            </Button>
            <Button className="rounded-full gap-2 px-8 h-11 font-bold shadow-lg shadow-primary/20" onClick={() => router.push('/trade')}>
              Trade
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
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">
                Feb 26, 11:58 am GMT-5 • <span className="hover:underline cursor-pointer">Disclaimer</span>
              </div>
            </div>

            {/* Timeframe Selector */}
            <div className="flex border-b border-border">
              {["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "Max"].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTimeframe(t as Timeframe)}
                  className={cn(
                    "px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px",
                    activeTimeframe === t 
                      ? "border-primary text-primary" 
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Main Area Chart */}
            <div className="h-[400px] w-full pt-4 relative group">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isUp ? "#22c55e" : "#ef4444"} stopOpacity={0.15}/>
                      <stop offset="95%" stopColor={isUp ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="time" hide />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <ReferenceLine y={prevClose} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: 'Previous close', position: 'right', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: isUp ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke={isUp ? "#22c55e" : "#ef4444"} 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
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
                <div key={i} className="flex justify-between items-center border-b border-border pb-2 group cursor-help">
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</span>
                  <span className="text-sm font-bold">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="space-y-8">
            {/* Trade Controller */}
            <Card className="glass-card bg-primary/5 border-primary/20 rounded-3xl overflow-hidden shadow-xl">
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
                    className="h-12 bg-background border-2 rounded-xl text-lg font-bold"
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
            <Card className="glass-card rounded-3xl border-none shadow-sm overflow-hidden">
              <div className="flex bg-muted/30">
                <button className="flex-1 py-4 text-xs font-bold border-b-2 border-primary text-primary">Related</button>
                <button className="flex-1 py-4 text-xs font-bold text-muted-foreground">Following</button>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {MOCK_STOCKS.filter(s => s.symbol !== symbol).slice(0, 4).map((s) => (
                    <div 
                      key={s.symbol} 
                      className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer group"
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
                <div className="p-4 pt-0 text-right">
                  <span className="text-[10px] text-muted-foreground italic font-medium cursor-pointer hover:underline">Disclaimer</span>
                </div>
              </CardContent>
            </Card>

            {/* Financial Intelligence Cards */}
            <div className="grid grid-cols-1 gap-4">
              <Card className="glass-card p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quarterly financials</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">14.38KCr</div>
                  <div className="text-xs text-green-500 font-bold flex items-center gap-1">
                    <TrendingUp className="size-3" /> +15.65% Y/Y Revenue
                  </div>
                </div>
              </Card>
              <Card className="glass-card p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Earnings</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-green-500 font-bold text-lg">+6.25%</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-black">EPS Beat</div>
                  </div>
                  <div className="space-y-1 border-l border-border pl-4">
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
