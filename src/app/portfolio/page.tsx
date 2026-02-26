
"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts"
import { BrainCircuit, ShieldCheck, PieChart as PieChartIcon, ArrowUpRight, Plus, RefreshCw, Loader2, TrendingUp, TrendingDown } from "lucide-react"
import { aiPortfolioImprovementInsights } from "@/ai/flows/ai-portfolio-improvement-insights"
import { MOCK_PORTFOLIO } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))']
const FINNHUB_API_KEY = "d6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110";

export default function PortfolioPage() {
  const { toast } = useToast()
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [isFetching, setIsFetching] = React.useState(true)
  const [insights, setInsights] = React.useState<string | null>(null)
  const [portfolio, setPortfolio] = React.useState(MOCK_PORTFOLIO)

  const fetchLivePrices = async (showToast = false) => {
    setIsFetching(true)
    try {
      const updatedHoldings = await Promise.all(
        portfolio.holdings.map(async (holding) => {
          try {
            const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${holding.symbol}&token=${FINNHUB_API_KEY}`)
            if (res.ok) {
              const data = await res.json()
              if (data.c && data.c !== 0) {
                return {
                  ...holding,
                  currentPrice: data.c
                }
              }
            }
          } catch (e) {
            // Fallback for individual fetch failure
          }
          return holding
        })
      )

      setPortfolio(prev => ({
        ...prev,
        holdings: updatedHoldings
      }))

      if (showToast) {
        toast({
          title: "Portfolio Synced",
          description: "Live market prices have been updated.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: "Could not update live portfolio prices.",
      })
    } finally {
      setIsFetching(false)
    }
  }

  React.useEffect(() => {
    fetchLivePrices()
    const interval = setInterval(() => fetchLivePrices(), 60000)
    return () => clearInterval(interval)
  }, [])

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const result = await aiPortfolioImprovementInsights({
        holdings: portfolio.holdings,
        riskExposureScore: portfolio.riskScore,
        assetAllocation: portfolio.assetAllocation,
        sectorDiversification: portfolio.sectorDiversification
      })
      setInsights(result.insights)
      toast({
        title: "Analysis Complete",
        description: "AI-driven portfolio insights generated successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not reach the AI advisor at this time.",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAddAsset = () => {
    toast({
      title: "Add Asset",
      description: "Opening asset integration dialog...",
    })
  }

  const totalCurrentValue = portfolio.holdings.reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0)
  const totalInvestment = portfolio.holdings.reduce((sum, h) => sum + (h.purchasePrice * h.quantity), 0)
  const totalPL = totalCurrentValue - totalInvestment
  const plPercentage = (totalPL / totalInvestment) * 100

  return (
    <DashboardShell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">Portfolio Analyzer</h1>
            <p className="text-muted-foreground">Comprehensive breakdown of your assets and risk profile.</p>
          </div>
          <div className="flex items-center gap-3">
            {isFetching && <Loader2 className="size-4 animate-spin text-primary" />}
            <Button variant="outline" className="gap-2 h-11 rounded-xl" onClick={handleAddAsset}>
              <Plus className="size-4" /> Add Asset
            </Button>
            <Button className="gap-2 h-11 rounded-xl shadow-lg shadow-primary/20" onClick={handleRunAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? <RefreshCw className="size-4 animate-spin" /> : <BrainCircuit className="size-4" />}
              Generate AI Insights
            </Button>
          </div>
        </div>

        {/* High-level Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card bg-primary/5 border-primary/20 p-6 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Portfolio Value</span>
            <div className="text-3xl font-bold">₹{totalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </Card>
          <Card className="glass-card bg-muted/30 p-6 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Overall Profit/Loss</span>
            <div className={cn("text-3xl font-bold flex items-center gap-2", totalPL >= 0 ? "text-primary" : "text-destructive")}>
              ₹{Math.abs(totalPL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <Badge variant={totalPL >= 0 ? "default" : "destructive"} className="text-xs h-6">
                {totalPL >= 0 ? <TrendingUp className="size-3 mr-1" /> : <TrendingDown className="size-3 mr-1" />}
                {plPercentage.toFixed(2)}%
              </Badge>
            </div>
          </Card>
          <Card className="glass-card p-6 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Active Holdings</span>
            <div className="text-3xl font-bold">{portfolio.holdings.length} Assets</div>
          </Card>
        </div>

        {/* Analysis Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="glass-card overflow-hidden rounded-[2.5rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <PieChartIcon className="size-5" />
                Asset Allocation
              </CardTitle>
              <CardDescription>Your portfolio weight by asset class.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolio.assetAllocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="percentage"
                      nameKey="assetClass"
                    >
                      {portfolio.assetAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{backgroundColor: 'hsl(var(--card))', borderRadius: '16px', border: '1px solid hsl(var(--border))'}}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden rounded-[2.5rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <ShieldCheck className="size-5" />
                Risk Exposure
              </CardTitle>
              <CardDescription>Current risk assessment based on market volatility.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[300px]">
              <div className="relative size-48">
                <svg className="size-full" viewBox="0 0 100 100">
                  <circle
                    className="text-muted stroke-current"
                    strokeWidth="8"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-primary stroke-current transition-all duration-1000 ease-out"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={(1 - portfolio.riskScore / 100) * (2 * Math.PI * 40)}
                    strokeLinecap="round"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                    transform="rotate(-90 50 50)"
                  />
                  <text x="50" y="50" className="fill-foreground font-headline font-bold text-3xl" textAnchor="middle" dominantBaseline="middle">
                    {portfolio.riskScore}
                  </text>
                </svg>
              </div>
              <div className="text-center mt-6">
                <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 px-4 py-1 h-auto text-xs font-bold uppercase tracking-wider">Moderate-High Risk</Badge>
                <p className="text-xs text-muted-foreground mt-3 max-w-xs mx-auto font-medium">
                  Your portfolio is heavily skewed towards Technology, increasing sensitivity to sector volatility.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Holdings Table */}
        <Card className="glass-card overflow-hidden rounded-[2.5rem] shadow-2xl border-primary/5">
          <CardHeader className="bg-muted/10">
            <CardTitle className="text-xl font-headline font-bold">Current Holdings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] uppercase bg-muted/30 text-muted-foreground font-bold tracking-[0.2em]">
                  <tr>
                    <th className="px-8 py-5">Asset</th>
                    <th className="px-8 py-5 text-center">Quantity</th>
                    <th className="px-8 py-5 text-right">Avg. Cost</th>
                    <th className="px-8 py-5 text-right">Live Price</th>
                    <th className="px-8 py-5 text-right">Current Value</th>
                    <th className="px-8 py-5 text-right">Day P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {portfolio.holdings.map((holding, i) => {
                    const plValue = (holding.currentPrice - holding.purchasePrice) * holding.quantity
                    const plPercent = ((holding.currentPrice - holding.purchasePrice) / holding.purchasePrice) * 100
                    const currentVal = holding.currentPrice * holding.quantity
                    
                    return (
                      <tr 
                        key={holding.symbol} 
                        className="group hover:bg-muted/5 transition-colors cursor-pointer animate-in fade-in slide-in-from-right-4"
                        style={{ animationDelay: `${i * 50}ms` }}
                        onClick={() => router.push(`/trade/${holding.symbol}`)}
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-muted/50 flex items-center justify-center font-bold text-primary text-sm border border-border/50 group-hover:scale-105 transition-transform">
                              {holding.symbol[0]}
                            </div>
                            <div className="font-bold text-base">{holding.symbol}</div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center font-medium">{holding.quantity}</td>
                        <td className="px-8 py-6 text-right font-medium text-muted-foreground">₹{holding.purchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-8 py-6 text-right font-bold">₹{holding.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-8 py-6 text-right font-bold text-foreground">₹{currentVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className={cn("px-8 py-6 text-right font-bold", plValue >= 0 ? 'text-primary' : 'text-destructive')}>
                          <div className="flex flex-col items-end">
                            <span className="text-sm">₹{plValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="text-[10px] font-medium opacity-80">({plPercent.toFixed(2)}%)</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights Section */}
        {insights && (
          <Card className="glass-card border-primary/30 bg-primary/5 rounded-[2.5rem] overflow-hidden animate-in slide-in-from-right-8 duration-700">
            <CardHeader className="flex flex-row items-center gap-6 p-8 bg-primary/10">
              <div className="size-16 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-xl shadow-primary/20">
                <BrainCircuit className="size-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-headline font-bold">AI Strategic Optimization</CardTitle>
                <CardDescription className="text-primary/60 font-medium">Tailored suggestions based on your profile and real-time data.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-10">
              <div className="prose prose-invert max-w-none text-foreground leading-relaxed text-lg">
                <div className="whitespace-pre-wrap">{insights}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}
