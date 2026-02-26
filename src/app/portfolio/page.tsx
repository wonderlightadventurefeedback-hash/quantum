
"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
import { BrainCircuit, Plus, RefreshCw, Loader2, Wallet, TrendingUp, TrendingDown, LayoutDashboard, Clock, Activity, ShoppingBag, ArrowRightLeft } from "lucide-react"
import { aiPortfolioImprovementInsights } from "@/ai/flows/ai-portfolio-improvement-insights"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { collection, doc, query, orderBy, limit } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))']
const FINNHUB_API_KEY = "d6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110";

export default function PortfolioPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [isFetching, setIsFetching] = React.useState(true)
  const [isMounted, setIsMounted] = React.useState(false)
  const [insights, setInsights] = React.useState<string | null>(null)
  const [livePrices, setLivePrices] = React.useState<Record<string, number>>({})

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, 'users', user.uid)
  }, [db, user])

  const { data: userProfile } = useDoc(userProfileRef)
  const balance = typeof userProfile?.balance === 'number' ? userProfile.balance : 50000

  const holdingsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, 'users', user.uid, 'holdings')
  }, [db, user])

  const { data: holdings, isLoading: holdingsLoading } = useCollection(holdingsQuery)

  const activityQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, 'users', user.uid, 'activity'), orderBy('timestamp', 'desc'), limit(5))
  }, [db, user])

  const { data: recentActivity } = useCollection(activityQuery)

  React.useEffect(() => {
    setIsMounted(true);
  }, [])

  const fetchPrices = React.useCallback(async () => {
    if (!holdings || holdings.length === 0) {
      setIsFetching(false)
      return
    }
    
    setIsFetching(true)
    try {
      const prices: Record<string, number> = {}
      await Promise.all(
        holdings.map(async (h: any) => {
          try {
            const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${h.symbol}&token=${FINNHUB_API_KEY}`)
            if (res.ok) {
              const data = await res.json()
              if (data.c) prices[h.symbol] = data.c
            }
          } catch (e) { }
        })
      )
      setLivePrices(prices)
    } catch (error) {
    } finally {
      setIsFetching(false)
    }
  }, [holdings])

  React.useEffect(() => {
    if (isMounted) {
      fetchPrices()
      const interval = setInterval(fetchPrices, 45000)
      return () => clearInterval(interval)
    }
  }, [fetchPrices, isMounted])

  const portfolioStats = React.useMemo(() => {
    if (!holdings || !isMounted) return { totalValue: 0, totalInvestment: 0, totalPL: 0, plPercentage: 0 }
    
    const totalInvestment = holdings.reduce((sum, h: any) => sum + (h.averagePrice * h.quantity), 0)
    const totalValue = holdings.reduce((sum, h: any) => {
      const price = livePrices[h.symbol] || h.averagePrice
      return sum + (price * h.quantity)
    }, 0)
    
    const totalPL = totalValue - totalInvestment
    const plPercentage = totalInvestment > 0 ? (totalPL / totalInvestment) * 100 : 0
    
    return { totalValue, totalInvestment, totalPL, plPercentage }
  }, [holdings, livePrices, isMounted])

  const allocationData = React.useMemo(() => {
    if (!holdings || !isMounted) return []
    return holdings.map((h: any) => ({
      name: h.symbol,
      value: (livePrices[h.symbol] || h.averagePrice) * h.quantity
    }))
  }, [holdings, livePrices, isMounted])

  const handleRunAnalysis = async () => {
    if (!holdings || holdings.length === 0) {
      toast({ title: "No Holdings", description: "Add some assets to your demo portfolio first.", variant: "destructive" })
      return
    }
    
    setIsAnalyzing(true)
    try {
      const result = await aiPortfolioImprovementInsights({
        holdings: holdings.map((h: any) => ({
          symbol: h.symbol,
          quantity: h.quantity,
          purchasePrice: h.averagePrice,
          currentPrice: livePrices[h.symbol] || h.averagePrice
        })),
        riskExposureScore: 65,
        assetAllocation: [{ assetClass: "Equities", percentage: 100 }],
        sectorDiversification: [{ sector: "Market", percentage: 100 }]
      })
      setInsights(result.insights)
      toast({ title: "Analysis Complete", description: "Strategic review is ready." })
    } catch (error) {
      toast({ variant: "destructive", title: "Analysis Failed" })
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!isMounted) return null;

  return (
    <DashboardShell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-headline font-bold">Demo Portfolio</h1>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black uppercase tracking-widest text-[10px]">Virtual</Badge>
            </div>
            <p className="text-muted-foreground">Tracking your virtual assets and paper trading performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 h-11 rounded-xl shadow-sm" onClick={() => router.push('/trade')}>
              <Plus className="size-4" /> Virtual Trade
            </Button>
            <Button className="gap-2 h-11 rounded-xl shadow-lg shadow-primary/20" onClick={handleRunAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? <RefreshCw className="size-4 animate-spin" /> : <BrainCircuit className="size-4" />}
              AI Strategic Review
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="glass-card bg-primary/5 border-primary/20 p-6 shadow-sm">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Demo Value</span>
            <div className="text-3xl font-bold">₹{portfolioStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </Card>
          <Card className="glass-card bg-muted/30 p-6 shadow-sm">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Virtual P/L</span>
            <div className={cn("text-3xl font-bold flex items-center gap-2", portfolioStats.totalPL >= 0 ? "text-primary" : "text-destructive")}>
              ₹{Math.abs(portfolioStats.totalPL).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              <Badge variant={portfolioStats.totalPL >= 0 ? "default" : "destructive"} className="text-[10px] h-5">
                {portfolioStats.plPercentage >= 0 ? '+' : ''}{portfolioStats.plPercentage.toFixed(2)}%
              </Badge>
            </div>
          </Card>
          <Card className="glass-card p-6 shadow-sm">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Demo Balance</span>
            <div className="text-3xl font-bold flex items-center gap-2">
              <Wallet className="size-6 text-primary" />
              ₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </Card>
          <Card className="glass-card p-6 shadow-sm">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Demo Assets</span>
            <div className="text-3xl font-bold">{holdings?.length || 0} Assets</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 glass-card rounded-[2.5rem] overflow-hidden shadow-xl border-none">
            <CardHeader className="bg-muted/10 px-8 py-6 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-headline font-bold flex items-center gap-2">
                <LayoutDashboard className="size-5 text-primary" /> Virtual Asset Breakdown
              </CardTitle>
              {isFetching && <Loader2 className="size-4 animate-spin text-primary" />}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] uppercase bg-muted/30 text-muted-foreground font-black tracking-[0.2em]">
                    <tr>
                      <th className="px-8 py-5">Asset</th>
                      <th className="px-8 py-5 text-center">Qty</th>
                      <th className="px-8 py-5 text-right">Avg. Price</th>
                      <th className="px-8 py-5 text-right">Market Price</th>
                      <th className="px-8 py-5 text-right">Total P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {holdingsLoading ? (
                      <tr><td colSpan={5} className="p-16 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>
                    ) : holdings?.length === 0 ? (
                      <tr><td colSpan={5} className="p-16 text-center text-muted-foreground italic">No demo holdings found. Start trading to track your virtual performance.</td></tr>
                    ) : holdings?.map((h: any, i: number) => {
                      const ltp = livePrices[h.symbol] || h.averagePrice
                      const pl = (ltp - h.averagePrice) * h.quantity
                      const plP = ((ltp - h.averagePrice) / h.averagePrice) * 100
                      
                      return (
                        <tr key={h.symbol} className="hover:bg-muted/5 transition-colors cursor-pointer group" onClick={() => router.push(`/trade/${h.symbol}`)}>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-lg bg-muted flex items-center justify-center font-bold text-primary group-hover:scale-110 transition-transform">
                                {h.symbol[0]}
                              </div>
                              <span className="font-bold">{h.symbol}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center font-medium">{h.quantity}</td>
                          <td className="px-8 py-6 text-right text-muted-foreground">₹{h.averagePrice.toFixed(2)}</td>
                          <td className="px-8 py-6 text-right font-bold">₹{ltp.toFixed(2)}</td>
                          <td className={cn("px-8 py-6 text-right font-black", pl >= 0 ? "text-primary" : "text-destructive")}>
                            {pl >= 0 ? "+" : ""}₹{pl.toFixed(2)} <span className="text-[10px] ml-1">({plP.toFixed(2)}%)</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card rounded-[2.5rem] overflow-hidden shadow-xl border-none p-8 flex flex-col items-center justify-center">
            <h3 className="text-lg font-headline font-bold mb-8 w-full text-left">Demo Diversification</h3>
            <div className="h-[280px] w-full">
              {allocationData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {allocationData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-xs italic">
                  Not enough data for allocation chart.
                </div>
              )}
            </div>
          </Card>
        </div>

        <Card className="glass-card border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/10 px-8 py-6 border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-headline font-bold flex items-center gap-2">
              <Activity className="size-5 text-primary" /> Recent Transaction Logs
            </CardTitle>
            <Button variant="ghost" className="text-xs font-bold gap-2" onClick={() => router.push('/settings')}>
              View Full History <Clock className="size-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {!recentActivity || recentActivity.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground italic text-sm">
                  Your transaction history is currently empty.
                </div>
              ) : recentActivity.map((act) => {
                const isBuy = act.type === "ORDER_BUY";
                const isSell = act.type === "ORDER_SELL";
                const isArena = act.type === "ARENA_SPECULATE";
                
                return (
                  <div key={act.id} className="p-6 px-8 flex items-center justify-between hover:bg-muted/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "size-10 rounded-xl flex items-center justify-center shadow-sm border border-border/50",
                        isBuy ? "bg-green-500/10 text-green-500" : isSell ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"
                      )}>
                        {isBuy ? <ShoppingBag size={18} /> : isSell ? <ArrowRightLeft size={18} /> : <Zap size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{act.symbol}</span>
                          <Badge variant="outline" className="text-[9px] h-4 py-0 uppercase tracking-widest font-black">
                            {isBuy ? "SPOT BUY" : isSell ? "SPOT SELL" : "ARENA"}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5">
                          {act.timestamp ? formatDistanceToNow(act.timestamp.toDate(), { addSuffix: true }) : 'Processing...'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn("font-black", (act.total || 0) >= 0 ? "text-primary" : "text-destructive")}>
                        {(act.total || 0) >= 0 ? "+" : ""}₹{Math.abs(act.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">
                        {isArena ? `RESULT: ${act.outcome}` : `PRICE: ₹${act.price.toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {insights && (
          <Card className="glass-card border-primary/30 bg-primary/5 rounded-[2.5rem] p-12 animate-in zoom-in-95 shadow-2xl">
            <div className="flex items-start gap-8">
              <div className="size-16 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                <BrainCircuit className="size-8 text-white" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-headline font-bold text-foreground">Demo AI Strategic Review</h3>
                <div className="text-foreground/80 leading-relaxed whitespace-pre-wrap text-sm border-l-2 border-primary/20 pl-6 py-2">
                  {insights}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}
