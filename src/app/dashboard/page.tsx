
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { 
  TrendingUp, 
  ArrowRight,
  PieChart,
  Briefcase,
  Globe,
  CircleDollarSign,
  ChevronRight,
  Loader2
} from "lucide-react"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { MOCK_USER, MOCK_STOCKS, MOCK_INDICES, MOCK_NEWS, Stock } from "@/lib/mock-data"

const FINNHUB_API_KEY = "d6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110";

export default function DashboardOverview() {
  const { toast } = useToast()
  const router = useRouter()
  const [liveStocks, setLiveStocks] = React.useState<Stock[]>(MOCK_STOCKS)
  const [isLoading, setIsLoading] = React.useState(true)

  const fetchLivePrices = async () => {
    try {
      const updatedStocks = await Promise.all(
        MOCK_STOCKS.map(async (stock) => {
          if (stock.category === "US Stocks") {
            const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${FINNHUB_API_KEY}`)
            if (res.ok) {
              const data = await res.json()
              if (data.c) {
                return {
                  ...stock,
                  price: data.c,
                  change: data.dp || stock.change,
                  trend: (data.dp || 0) >= 0 ? "UP" : "DOWN" as "UP" | "DOWN"
                }
              }
            }
          }
          // Drift simulation for others to show "active" market
          const drift = (Math.random() - 0.5) * 0.5
          return {
            ...stock,
            price: +(stock.price + drift).toFixed(2)
          }
        })
      )
      setLiveStocks(updatedStocks)
    } catch (error) {
      console.error("Dashboard live price sync error", error)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchLivePrices()
    const interval = setInterval(() => fetchLivePrices(), 60000)
    return () => clearInterval(interval)
  }, [])

  const navigateToExplore = (category: string) => {
    router.push(`/explore?category=${encodeURIComponent(category)}`)
  }

  const handleStockClick = (symbol: string) => {
    router.push(`/trade/${symbol}`)
  }

  return (
    <DashboardShell>
      <div className="space-y-12 pb-10">
        
        {/* Market Indices Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-1000 ease-out">
          {MOCK_INDICES.map((index, i) => (
            <Card 
              key={index.name} 
              className="glass-card hover:bg-muted/10 cursor-pointer border-none shadow-sm transition-all hover:scale-[1.02]"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{index.name}</span>
                  <div className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded",
                    index.trend === "UP" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                  )}>
                    {index.percent}
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xl font-headline font-bold">{index.value}</div>
                  <div className={cn(
                    "text-xs font-medium",
                    index.trend === "UP" ? "text-green-500" : "text-red-500"
                  )}>
                    {index.change}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Investment Categories */}
        <div className="space-y-6 animate-in fade-in slide-in-from-left-8 duration-1000 delay-300 ease-out">
          <h2 className="text-xl font-headline font-bold flex items-center gap-2">
            Invest in <ChevronRight className="size-5 text-primary" />
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Stocks", icon: Briefcase, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Mutual Funds", icon: PieChart, color: "text-green-500", bg: "bg-green-500/10" },
              { label: "US Stocks", icon: Globe, color: "text-indigo-500", bg: "bg-indigo-500/10" },
              { label: "Fixed Deposits", icon: CircleDollarSign, color: "text-orange-500", bg: "bg-orange-500/10" },
            ].map((cat, i) => (
              <button 
                key={cat.label}
                className="group flex flex-col items-center gap-3 p-6 rounded-2xl glass-card transition-all hover:border-primary/50 animate-in fade-in zoom-in-95"
                style={{ animationDelay: `${400 + (i * 100)}ms` }}
                onClick={() => navigateToExplore(cat.label)}
              >
                <div className={cn("size-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110", cat.bg)}>
                  <cat.icon className={cn("size-7", cat.color)} />
                </div>
                <span className="font-bold text-sm">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stocks in Focus Section */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-600">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-headline font-bold">Stocks in Focus</h2>
            <div className="flex items-center gap-4">
               {isLoading && <Loader2 className="size-4 animate-spin text-primary" />}
               <Button variant="ghost" className="text-primary font-bold text-sm gap-2" onClick={() => navigateToExplore('Stocks')}>
                View all <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
          
          <Card className="glass-card border-none shadow-none bg-transparent overflow-hidden">
            <CardContent className="p-0">
              <div className="min-w-[800px] overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground font-bold uppercase tracking-widest border-b border-border/50">
                      <th className="px-6 py-4 font-bold">Company</th>
                      <th className="px-6 py-4 text-center">Trend (1D)</th>
                      <th className="px-6 py-4 text-right">Market Price (Live)</th>
                      <th className="px-6 py-4 text-right">Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {liveStocks.filter(s => s.category === "Stocks" || s.category === "US Stocks").slice(0, 8).map((stock, i) => (
                      <tr 
                        key={stock.symbol} 
                        className="group hover:bg-muted/5 transition-colors cursor-pointer animate-in fade-in slide-in-from-right-4"
                        style={{ animationDelay: `${700 + (i * 50)}ms` }}
                        onClick={() => handleStockClick(stock.symbol)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="size-12 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 font-bold text-primary text-base border border-border/50 transition-transform group-hover:scale-105">
                              {stock.symbol[0]}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="font-bold text-[15px] text-foreground truncate">{stock.name}</div>
                              <div className="text-[11px] text-muted-foreground font-medium">{stock.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-24 h-10 mx-auto">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={stock.sparklineData}>
                                <Line 
                                  type="monotone" 
                                  dataKey="value" 
                                  stroke={stock.trend === "UP" ? "#22c55e" : "#ef4444"} 
                                  strokeWidth={2} 
                                  dot={false} 
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <div className="text-[15px] font-bold">₹{stock.price.toLocaleString()}</div>
                            <div className={cn(
                              "text-xs font-bold",
                              stock.trend === "UP" ? "text-green-500" : "text-red-500"
                            )}>
                              {stock.trend === "UP" ? "+" : ""}{(stock.price * (stock.change / 100)).toFixed(2)} ({stock.change.toFixed(2)}%)
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-medium text-muted-foreground">{stock.volume}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Portfolio Summary & News Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-8">
            <Card className="glass-card bg-primary/5 border-primary/20 p-6 space-y-4 hover:shadow-primary/10 transition-shadow">
              <h2 className="font-headline font-bold text-lg">Your Portfolio</h2>
              <div>
                <div className="text-3xl font-bold">₹{MOCK_USER.balance.toLocaleString()}</div>
                <div className="text-xs text-green-500 font-bold flex items-center gap-1 mt-1">
                  <TrendingUp className="size-3" /> +12.5% Returns
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="outline" className="text-xs h-9 rounded-lg" onClick={() => router.push('/portfolio')}>Analyze</Button>
                <Button className="text-xs h-9 rounded-lg" onClick={() => router.push('/trade')}>Invest More</Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-headline font-bold">Top Market News</h2>
            <div className="space-y-4">
              {MOCK_NEWS.slice(0, 3).map((item, i) => (
                <div 
                  key={item.id} 
                  className="group cursor-pointer border-b border-border/50 pb-4 last:border-0 animate-in fade-in slide-in-from-bottom-2" 
                  style={{ animationDelay: `${1000 + (i * 100)}ms` }}
                  onClick={() => router.push('/news')}
                >
                  <div className="flex justify-between items-start gap-3">
                    <h4 className="text-xs font-bold leading-tight group-hover:text-primary transition-colors">{item.title}</h4>
                    <Badge variant="outline" className="text-[9px] h-4 py-0 shrink-0">{item.sentiment}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground uppercase font-medium">
                    <span>{item.source}</span>
                    <span>•</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Market Explorer Call to Action */}
        <Card className="glass-card bg-gradient-to-r from-primary/10 via-background to-background border-primary/20 overflow-hidden relative group animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-1000">
          <div className="absolute right-[-5%] top-[-20%] opacity-10 transition-transform group-hover:scale-110 duration-700">
            <Globe size={300} className="text-primary" />
          </div>
          <CardContent className="p-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-2xl font-headline font-bold">Explore Global Opportunities</h2>
              <p className="text-muted-foreground max-w-md">Access 50+ global markets and invest in world-leading companies with zero commission for the first 30 days.</p>
            </div>
            <Button size="lg" className="rounded-full px-8 gap-2 font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105" onClick={() => navigateToExplore('US Stocks')}>
              Open Global Account <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>

      </div>
    </DashboardShell>
  )
}
