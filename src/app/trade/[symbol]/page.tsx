"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Bookmark,
  Search,
  Loader2,
  BookmarkCheck,
  TrendingUp,
  LineChart as LineChartIcon,
  BarChart2,
  Zap,
  ShieldCheck,
  Wallet,
  Code,
  Bell,
  ChevronRight,
  Calendar,
  Layers,
  Activity,
  Newspaper,
  History,
  Target,
  Layout,
  MousePointer2,
  Maximize2,
  Settings2,
  ChevronDown,
  Crosshair,
  BarChart3,
  Flame,
  Link2
} from "lucide-react"
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Bar,
  ComposedChart,
  Cell,
  BarChart
} from "recharts"
import { MOCK_STOCKS, MOCK_NEWS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useUser, useFirestore, useDoc } from "@/firebase"
import { doc, setDoc, deleteDoc, serverTimestamp, getDoc, updateDoc, increment } from "firebase/firestore"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

const FINNHUB_API_KEY = "d6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110";

type Timeframe = "1D" | "5D" | "1M" | "3M" | "6M" | "1Y";

const generateChartData = (basePrice: number, isBullish: boolean, timeframe: Timeframe) => {
  let points = 60;
  switch(timeframe) {
    case "1D": points = 78; break;
    case "5D": points = 40; break;
    default: points = 60;
  }

  let currentPrice = basePrice * (isBullish ? 0.98 : 1.02);
  
  return Array.from({ length: points }, (_, i) => {
    const volatility = basePrice * 0.015; 
    const open = currentPrice;
    const change = (Math.random() - 0.48) * volatility;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * (volatility * 0.5);
    const low = Math.min(open, close) - Math.random() * (volatility * 0.5);
    
    currentPrice = close;
    const isUp = close >= open;
    
    return {
      time: i,
      open,
      high,
      low,
      close,
      body: [open, close],
      wick: [low, high],
      price: close,
      color: isUp ? "#26a69a" : "#ef5350",
    };
  })
}

const MOCK_OI_DATA = Array.from({ length: 15 }, (_, i) => ({
  strike: 25300 + (i * 50),
  callOI: Math.random() * 100,
  putOI: Math.random() * 100,
}));

const TerminalChart = ({ data, height = 300, title, symbol, timeframe, setTimeframe }: { data: any[], height?: number, title?: string, symbol: string, timeframe: Timeframe, setTimeframe: (t: Timeframe) => void }) => (
  <div className="bg-[#0d1117] border border-[#21262d] rounded-sm relative flex flex-col group overflow-hidden">
    <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#21262d]">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tight">{title || symbol}</span>
        <div className="flex items-center gap-1">
          {["1D", "5D", "1M"].map(t => (
            <button 
              key={t} 
              onClick={() => setTimeframe(t as Timeframe)}
              className={cn("text-[9px] px-1.5 py-0.5 rounded-sm font-bold", timeframe === t ? "bg-primary/20 text-primary" : "text-gray-500 hover:text-gray-300")}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="text-gray-500 hover:text-primary"><Settings2 className="size-3" /></button>
        <button className="text-gray-500 hover:text-primary"><Maximize2 className="size-3" /></button>
      </div>
    </div>
    <div className="w-full pt-4" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#21262d" />
          <XAxis dataKey="time" hide />
          <YAxis 
            orientation="right" 
            domain={['auto', 'auto']} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 9, fill: '#8b949e' }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '4px', fontSize: '10px' }}
            itemStyle={{ padding: 0 }}
          />
          <Bar dataKey="wick" barSize={1}>
            {data.map((entry: any, index: number) => <Cell key={`wick-${index}`} fill={entry.color} />)}
          </Bar>
          <Bar dataKey="body" barSize={6}>
            {data.map((entry: any, index: number) => <Cell key={`body-${index}`} fill={entry.color} />)}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  </div>
)

export default function StockTerminalPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const symbol = (params?.symbol as string) || "AAPL"
  const { user } = useUser()
  const db = useFirestore()
  
  const initialStock = MOCK_STOCKS.find(s => s.symbol === symbol) || MOCK_STOCKS[0]
  const [stock, setStock] = React.useState(initialStock)
  const [isMounted, setIsMounted] = React.useState(false)
  const [activeOrderTab, setActiveOrderTab] = React.useState("BUY")
  const [qty, setQty] = React.useState("1")
  const [price, setPrice] = React.useState(initialStock.price.toString())
  const [timeframe, setTimeframe] = React.useState<Timeframe>("1D")
  const [userBalance, setUserBalance] = React.useState<number>(0)
  
  const isUp = stock.change >= 0;
  
  const chartData = React.useMemo(() => {
    if (!isMounted) return [];
    return generateChartData(stock.price, isUp, timeframe);
  }, [stock.price, isUp, timeframe, isMounted])

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
          setPrice(data.c.toString())
        }
      }
    } catch (error) {}
  }, [symbol])

  React.useEffect(() => {
    fetchLiveQuote()
    const interval = setInterval(fetchLiveQuote, 30000)
    return () => clearInterval(interval)
  }, [fetchLiveQuote])

  const handleOrder = async () => {
    if (!db || !user) return
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
        updateDoc(holdingRef, { 
          symbol, 
          quantity: increment(orderQty), 
          averagePrice: orderPrice, 
          lastUpdated: serverTimestamp() 
        }).catch(() => {
          setDoc(holdingRef, { symbol, quantity: orderQty, averagePrice: orderPrice, lastUpdated: serverTimestamp() })
        })
        updateDoc(userRef, { balance: increment(-totalCost) })
        setUserBalance(prev => prev - totalCost)
      } else {
        updateDoc(holdingRef, { quantity: increment(-orderQty), lastUpdated: serverTimestamp() })
        updateDoc(userRef, { balance: increment(totalCost) })
        setUserBalance(prev => prev + totalCost)
      }

      toast({ title: `${activeOrderTab} Order Successful`, description: `${orderQty} units processed.` })
    } catch (e) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: holdingRef.path, operation: 'write' }))
    }
  }

  if (!isMounted) return null;

  return (
    <DashboardShell>
      <div className="h-[calc(100vh-8rem)] flex flex-col bg-[#010409] -m-8 overflow-hidden text-gray-300">
        
        {/* Terminal Top Bar */}
        <div className="h-12 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="size-6 bg-primary rounded-sm flex items-center justify-center font-black text-white text-[10px]">FI</div>
              <span className="font-bold text-xs uppercase tracking-tighter">Terminal</span>
            </div>
            <div className="h-6 w-px bg-[#30363d]" />
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-[10px] font-bold hover:text-white uppercase"><Layout className="size-3 text-primary" /> Layout <ChevronDown className="size-2" /></button>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white uppercase">{symbol}</span>
                <span className={cn("text-xs font-bold", isUp ? "text-green-500" : "text-red-500")}>
                  {stock.price.toFixed(2)} {isUp ? '▲' : '▼'} {stock.change.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#0d1117] rounded-full px-3 py-1 border border-[#30363d]">
              <Flame className="size-3 text-orange-500" />
              <span className="text-[10px] font-bold uppercase">1-Click OFF</span>
              <div className="size-2 bg-gray-600 rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              {["Holdings", "Orders", "Positions"].map(t => (
                <button key={t} className="text-[10px] font-bold uppercase hover:text-white flex items-center gap-1">{t} <ChevronDown className="size-2" /></button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          
          {/* Left Vertical Toolbar */}
          <div className="w-14 bg-[#0d1117] border-r border-[#30363d] flex flex-col items-center py-4 gap-6 shrink-0">
            <button className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors flex flex-col items-center gap-1">
              <Zap className="size-5" />
              <span className="text-[8px] font-bold uppercase">Scalper</span>
            </button>
            {[
              { icon: Link2, label: "Options" },
              { icon: TrendingUp, label: "Trade" },
              { icon: BarChart3, label: "Market" },
              { icon: History, label: "History" }
            ].map((tool, i) => (
              <button key={i} className="text-gray-500 hover:text-white hover:bg-white/5 p-2 rounded-lg transition-colors flex flex-col items-center gap-1">
                <tool.icon className="size-5" />
                <span className="text-[8px] font-bold uppercase">{tool.label}</span>
              </button>
            ))}
            <div className="mt-auto flex flex-col gap-4 pb-4">
              <button className="text-gray-500 hover:text-white"><Settings2 className="size-5" /></button>
              <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-[10px]">S</div>
            </div>
          </div>

          {/* Main Matrix Content */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* Charts Matrix Column */}
            <div className="flex-1 flex flex-col gap-1 p-1 overflow-y-auto custom-scrollbar">
              <TerminalChart 
                data={chartData} 
                height={600} 
                title={`${symbol} Main Analysis`} 
                symbol={symbol} 
                timeframe={timeframe} 
                setTimeframe={setTimeframe} 
              />
              
              {/* Terminal Quick Trade HUD */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-sm p-4 flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-gray-500">Qty</span>
                    <Input value={qty} onChange={e => setQty(e.target.value)} className="w-20 h-8 bg-[#0d1117] border-[#30363d] text-[10px] font-bold text-center" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-gray-500">Price</span>
                    <Input value={price} onChange={e => setPrice(e.target.value)} className="w-24 h-8 bg-[#0d1117] border-[#30363d] text-[10px] font-bold text-center" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => { setActiveOrderTab("BUY"); handleOrder(); }} className="bg-[#26a69a] hover:bg-[#2bbbad] text-white font-black text-[10px] px-8 h-8 uppercase">Buy</Button>
                  <Button onClick={() => { setActiveOrderTab("SELL"); handleOrder(); }} className="bg-[#ef5350] hover:bg-[#ff5252] text-white font-black text-[10px] px-8 h-8 uppercase">Sell</Button>
                </div>
              </div>
            </div>

            {/* Right Analysis Panel */}
            <div className="w-80 bg-[#0d1117] border-l border-[#30363d] flex flex-col shrink-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d]">
                <h3 className="text-[10px] font-bold uppercase text-white flex items-center gap-2"><BarChart2 className="size-3 text-primary" /> OI Analysis</h3>
                <div className="flex gap-2">
                  <Maximize2 className="size-3 text-gray-500 cursor-pointer" />
                  <Crosshair className="size-3 text-gray-500 cursor-pointer" />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
                
                {/* OI Distribution Chart */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Open Interest (Tue, 01 Jul)</span>
                    <span className="text-[9px] text-gray-500 uppercase">Expiry 03 Jul</span>
                  </div>
                  <div className="h-48 w-full bg-[#161b22] border border-[#21262d] rounded-sm p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={MOCK_OI_DATA}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#21262d" />
                        <XAxis dataKey="strike" hide />
                        <Tooltip contentStyle={{ backgroundColor: '#0d1117', fontSize: '10px' }} />
                        <Bar dataKey="callOI" fill="#ef5350" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="putOI" fill="#26a69a" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold pt-1">
                    <span className="text-red-400">Total Call OI: 6.00Cr</span>
                    <span className="text-white">PCR: 1.36</span>
                    <span className="text-green-400">Total Put OI: 4.42Cr</span>
                  </div>
                </div>

                {/* OI Change Chart */}
                <div className="space-y-2 pt-4 border-t border-[#21262d]">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-gray-400">OI Change (1D)</span>
                  </div>
                  <div className="h-48 w-full bg-[#161b22] border border-[#21262d] rounded-sm p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={MOCK_OI_DATA}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#21262d" />
                        <XAxis dataKey="strike" hide />
                        <Bar dataKey="callOI" fill="#ef5350" />
                        <Bar dataKey="putOI" fill="#26a69a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {["5 Min", "10 Min", "15 Min", "Full Day"].map(t => (
                      <button key={t} className="bg-[#21262d] text-[9px] py-1 font-bold rounded-sm border border-[#30363d] hover:bg-[#30363d]">{t}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-[#21262d]">
                  <h4 className="text-[10px] font-bold uppercase text-primary">Market Alerts</h4>
                  <div className="bg-primary/5 border border-primary/20 p-3 rounded-sm">
                    <p className="text-[10px] leading-tight italic">Heavy Call unwinding noticed at 25500 strike. Bullish momentum expected.</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Far Right Sidebar Tabs */}
            <div className="w-12 bg-[#0d1117] border-l border-[#30363d] flex flex-col py-4 gap-8 shrink-0">
              {[
                { icon: Bookmark, label: "WL" },
                { icon: Search, label: "SC" },
                { icon: BarChart3, label: "OI" },
                { icon: Code, label: "OC" }
              ].map((tab, i) => (
                <button key={i} className="text-gray-500 hover:text-primary transition-colors flex flex-col items-center gap-1">
                  <tab.icon className="size-4" />
                  <span className="text-[7px] font-black uppercase">{tab.label}</span>
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
