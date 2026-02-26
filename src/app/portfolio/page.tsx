"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts"
import { BrainCircuit, ShieldCheck, PieChart as PieChartIcon, ArrowUpRight, Plus, RefreshCw } from "lucide-react"
import { aiPortfolioImprovementInsights } from "@/ai/flows/ai-portfolio-improvement-insights"
import { MOCK_PORTFOLIO } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))']

export default function PortfolioPage() {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [insights, setInsights] = React.useState<string | null>(null)

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const result = await aiPortfolioImprovementInsights({
        holdings: MOCK_PORTFOLIO.holdings,
        riskExposureScore: MOCK_PORTFOLIO.riskScore,
        assetAllocation: MOCK_PORTFOLIO.assetAllocation,
        sectorDiversification: MOCK_PORTFOLIO.sectorDiversification
      })
      setInsights(result.insights)
    } catch (error) {
      console.error(error)
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
            <p className="text-muted-foreground">Comprehensive breakdown of your assets and risk profile.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2"><Plus className="size-4" /> Add Asset</Button>
            <Button className="gap-2" onClick={handleRunAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? <RefreshCw className="size-4 animate-spin" /> : <BrainCircuit className="size-4" />}
              Generate AI Insights
            </Button>
          </div>
        </div>

        {/* Analysis Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="size-5 text-primary" />
                Asset Allocation
              </CardTitle>
              <CardDescription>Your portfolio weight by asset class.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={MOCK_PORTFOLIO.assetAllocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="percentage"
                      nameKey="assetClass"
                    >
                      {MOCK_PORTFOLIO.assetAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))'}}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                Risk Exposure
              </CardTitle>
              <CardDescription>Current risk assessment based on market volatility.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[300px]">
              <div className="relative size-48">
                <svg className="size-full" viewBox="0 0 100 100">
                  <circle
                    className="text-muted stroke-current"
                    strokeWidth="10"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-primary stroke-current transition-all duration-1000 ease-out"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={(1 - MOCK_PORTFOLIO.riskScore / 100) * (2 * Math.PI * 40)}
                    strokeLinecap="round"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                    transform="rotate(-90 50 50)"
                  />
                  <text x="50" y="50" className="fill-foreground font-headline font-bold text-2xl" textAnchor="middle" dominantBaseline="middle">
                    {MOCK_PORTFOLIO.riskScore}
                  </text>
                </svg>
              </div>
              <div className="text-center mt-4">
                <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">Moderate-High Risk</Badge>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                  Your portfolio is heavily skewed towards Tech, increasing potential volatility.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Holdings Table */}
        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <CardTitle>Current Holdings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/30 text-muted-foreground font-bold">
                  <tr>
                    <th className="px-6 py-4">Asset</th>
                    <th className="px-6 py-4">Quantity</th>
                    <th className="px-6 py-4">Buy Price</th>
                    <th className="px-6 py-4">Current Price</th>
                    <th className="px-6 py-4 text-right">Profit/Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {MOCK_PORTFOLIO.holdings.map((holding) => {
                    const pl = (holding.currentPrice - holding.purchasePrice) * holding.quantity
                    const plPercent = ((holding.currentPrice - holding.purchasePrice) / holding.purchasePrice) * 100
                    return (
                      <tr key={holding.symbol} className="hover:bg-muted/10">
                        <td className="px-6 py-4 font-bold">{holding.symbol}</td>
                        <td className="px-6 py-4">{holding.quantity}</td>
                        <td className="px-6 py-4">${holding.purchasePrice.toFixed(2)}</td>
                        <td className="px-6 py-4">${holding.currentPrice.toFixed(2)}</td>
                        <td className={`px-6 py-4 text-right font-bold ${pl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          <div className="flex flex-col items-end">
                            <span>${pl.toLocaleString()}</span>
                            <span className="text-xs font-normal">({plPercent.toFixed(2)}%)</span>
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
          <Card className="glass-card border-primary/40 bg-primary/5 animate-in slide-in-from-right-4 duration-500">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="size-12 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                <BrainCircuit className="size-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-headline">AI Strategic Optimization</CardTitle>
                <CardDescription>Tailored suggestions based on your profile.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none text-foreground leading-relaxed">
                <div className="whitespace-pre-wrap">{insights}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}