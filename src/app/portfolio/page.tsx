
"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts"
import { BrainCircuit, ShieldCheck, PieChart as PieChartIcon, ArrowUpRight, Plus, RefreshCw, Loader2, TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { aiPortfolioImprovementInsights } from "@/ai/flows/ai-portfolio-improvement-insights"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { collection, query, doc, getDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))']
const FINNHUB_API_KEY = "d6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110";

export default function PortfolioPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [isFetching, setIsFetching] = React.useState(true)
  const [insights, setInsights] = React.useState<string | null>(null)
  const [livePrices, setLivePrices] = React.useState<Record<string, number>>({})
  const [userBalance, setUserBalance] = React.useState<number>(0)

  const holdingsQuery = React.useMemo(() => {
    if (!db || !user) return null
    return collection(db, 'users', user.uid, 'holdings')
  }, [db, user])

  const { data: holdings, loading: holdingsLoading } = useCollection(holdingsQuery)

  React.useEffect(() => {
    async function fetchUserData() {
      if (!db || !user) return
      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        setUserBalance(userSnap.data().balance || 0)
      }
    }
    fetchUserData()
  }, [db, user])

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
          const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${h.symbol}&token=${FINNHUB_API_KEY}`)
          if (res.ok) {
            const data = await res.json()
            if (data.c) prices[h.symbol] = data.c
          }
        })
      )
      setLivePrices(prices)
    } catch (error) {
      console.error("Failed to fetch prices:", error)
    } finally {
      setIsFetching(false)
    }
  }, [holdings])

  React.useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 30000)
    return () => clearInterval(interval)
  }, [fetchPrices])

  const portfolioStats = React.useMemo(() => {
    if (!holdings) return { totalValue: 0, totalInvestment: 0, totalPL: 0, plPercentage: 0 }
    
    const totalInvestment = holdings.reduce((sum, h: any) => sum + (h.averagePrice * h.quantity), 0)
    const totalValue = holdings.reduce((sum, h: any) => {
      const price = livePrices[h.symbol] || h.averagePrice
      return sum + (price * h.quantity)
    }, 0)
    
    const totalPL = totalValue - totalInvestment
    const plPercentage = totalInvestment > 0 ? (totalPL / totalInvestment) * 100 : 0
    
    return { totalValue, totalInvestment, totalPL, plPercentage }
  }, [holdings, livePrices])

  const allocationData = React.useMemo(() => {
    if (!holdings) return []
    return holdings.map((h: any) => ({
      name: h.symbol,
      value: (livePrices[h.symbol] || h.averagePrice) * h.quantity
    }))
  }, [holdings, livePrices])

  const handleRunAnalysis = async () => {
    if (!holdings || holdings.length === 0) {
      toast({ title: "No Holdings", description: "Add some assets to your portfolio first.", variant: "destructive" })
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
        riskExposureScore: 65, // Dynamic risk scoring can be added
        assetAllocation: [{ assetClass: "Equities", percentage: 100 }],
        sectorDiversification: [{ sector: "Market", percentage: 100 }]
      })
      setInsights(result.insights)
    } catch (error) {
      toast({ variant: "destructive", title: "Analysis Failed" })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">Portfolio Analyzer</h1>
            <p className="text-muted-foreground">Real-time breakdown of your investments and profit/loss.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 h-11 rounded-xl" onClick={() => router.push('/trade')}>
              <Plus className="size-4" /> Trade Assets
            </Button>
            <Button className="gap-2 h-11 rounded-xl shadow-lg shadow-primary/20" onClick={handleRunAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? <RefreshCw className="size-4 animate-spin" /> : <BrainCircuit className="size-4" />}
              AI Insights
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="glass-card bg-primary/5 border-primary/20 p-6">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Value</span>
            <div className="text-3xl font-bold">₹{portfolioStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </Card>
          <Card className="glass-card bg-muted/30 p-6">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total P&L</span>
            <div className={cn("text-3xl font-bold flex items-center gap-2", portfolioStats.totalPL >= 0 ? "text-primary" : "text-destructive")}>
              ₹{Math.abs(portfolioStats.totalPL).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              <Badge variant={portfolioStats.totalPL >= 0 ? "default" : "destructive"}>
                {portfolioStats.plPercentage.toFixed(2)}%
              </Badge>
            </div>
          </Card>
          <Card className="glass-card p-6">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Buying Power</span>
            <div className="text-3xl font-bold flex items-center gap-2">
              <Wallet className="size-6 text-primary" />
              ₹{userBalance.toLocaleString()}
            </div>
          </Card>
          <Card className="glass-card p-6">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Holdings</span>
            <div className="text-3xl font-bold">{holdings?.length || 0} Assets</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 glass-card rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-muted/10">
              <CardTitle className="text-xl font-headline font-bold">My Holdings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] uppercase bg-muted/30 text-muted-foreground font-bold tracking-[0.2em]">
                    <tr>
                      <th className="px-8 py-5">Asset</th>
                      <th className="px-8 py-5 text-center">Qty</th>
                      <th className="px-8 py-5 text-right">Avg. Price</th>
                      <th className="px-8 py-5 text-right">LTP</th>
                      <th className="px-8 py-5 text-right">Value</th>
                      <th className="px-8 py-5 text-right">P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {holdingsLoading ? (
                      <tr><td colSpan={6} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>
                    ) : holdings?.length === 0 ? (
                      <tr><td colSpan={6} className="p-10 text-center text-muted-foreground italic">No holdings found. Start trading to see data here.</td></tr>
                    ) : holdings?.map((h: any, i: number) => {
                      const ltp = livePrices[h.symbol] || h.averagePrice
                      const val = ltp * h.quantity
                      const pl = (ltp - h.averagePrice) * h.quantity
                      const plP = ((ltp - h.averagePrice) / h.averagePrice) * 100
                      
                      return (
                        <tr key={h.symbol} className="hover:bg-muted/5 cursor-pointer" onClick={() => router.push(`/trade/${h.symbol}`)}>
                          <td className="px-8 py-6 font-bold">{h.symbol}</td>
                          <td className="px-8 py-6 text-center font-medium">{h.quantity}</td>
                          <td className="px-8 py-6 text-right text-muted-foreground">₹{h.averagePrice.toFixed(2)}</td>
                          <td className="px-8 py-6 text-right font-bold">₹{ltp.toFixed(2)}</td>
                          <td className="px-8 py-6 text-right font-bold">₹{val.toFixed(2)}</td>
                          <td className={cn("px-8 py-6 text-right font-bold", pl >= 0 ? "text-primary" : "text-destructive")}>
                            {pl >= 0 ? "+" : ""}₹{pl.toFixed(2)} ({plP.toFixed(2)}%)
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card rounded-[2.5rem] overflow-hidden p-6">
            <h3 className="text-lg font-headline font-bold mb-4 flex items-center gap-2">
              <PieChartIcon className="size-5 text-primary" /> Allocation
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {allocationData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {insights && (
          <Card className="glass-card border-primary/30 bg-primary/5 rounded-[2.5rem] p-10 animate-in zoom-in-95">
            <div className="flex items-start gap-6">
              <div className="size-16 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                <BrainCircuit className="size-8 text-white" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-headline font-bold">AI Strategic Review</h3>
                <div className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{insights}</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}
