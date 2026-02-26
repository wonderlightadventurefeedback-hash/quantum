
"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  PieChart,
  Briefcase,
  Globe,
  CircleDollarSign,
  ChevronRight
} from "lucide-react"
import { MOCK_USER, MOCK_STOCKS, MOCK_INDICES, MOCK_NEWS } from "@/lib/mock-data"

export default function DashboardOverview() {
  const { toast } = useToast()
  const router = useRouter()

  const handleAction = (title: string, description: string) => {
    toast({
      title,
      description,
    })
  }

  const navigateToExplore = (category: string) => {
    router.push(`/explore?category=${encodeURIComponent(category)}`)
  }

  return (
    <DashboardShell>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Market Indices Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-1000 delay-200">
          {MOCK_INDICES.map((index) => (
            <Card key={index.name} className="glass-card hover:bg-muted/10 cursor-pointer border-none shadow-sm transition-all hover:scale-[1.02]">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{index.name}</span>
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
        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-1000 delay-400">
          <h2 className="text-xl font-headline font-bold flex items-center gap-2">
            Invest in <ChevronRight className="size-5 text-primary" />
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Stocks", icon: Briefcase, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Mutual Funds", icon: PieChart, color: "text-green-500", bg: "bg-green-500/10" },
              { label: "US Stocks", icon: Globe, color: "text-indigo-500", bg: "bg-indigo-500/10" },
              { label: "Fixed Deposits", icon: CircleDollarSign, color: "text-orange-500", bg: "bg-orange-500/10" },
            ].map((cat) => (
              <button 
                key={cat.label}
                className="group flex flex-col items-center gap-3 p-6 rounded-2xl glass-card transition-all hover:border-primary/50"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-600">
          
          {/* Top Gainers / Losers */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-headline font-bold">Stocks in Focus</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-full text-xs">Top Gainers</Button>
                <Button variant="ghost" size="sm" className="rounded-full text-xs text-muted-foreground">Top Losers</Button>
              </div>
            </div>
            
            <Card className="glass-card border-none shadow-none bg-transparent">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                {MOCK_STOCKS.filter(s => s.category === "Stocks").slice(0, 10).map((stock) => (
                  <div 
                    key={stock.symbol} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/10 transition-colors cursor-pointer group"
                    onClick={() => handleAction(`Viewing ${stock.symbol}`, `Current price: ${stock.price} INR`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0 font-bold text-muted-foreground text-xs border border-border/50">
                        {stock.symbol[0]}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="font-bold text-sm truncate">{stock.name}</div>
                        <Badge variant="secondary" className="w-fit text-[9px] h-4 py-0 px-1.5 bg-muted/50 text-muted-foreground font-bold uppercase border-none rounded-sm">
                          {stock.symbol}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div className="flex flex-col items-end">
                        <div className="text-sm font-bold flex items-center gap-1">
                          {stock.price.toFixed(2)} <span className="text-[9px] text-muted-foreground font-normal">INR</span>
                        </div>
                      </div>
                      <div className={cn(
                        "text-[11px] font-bold px-2 py-1 rounded min-w-[70px] text-center",
                        stock.change > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      )}>
                        {stock.change > 0 ? "+" : ""}{stock.change.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full text-primary font-bold text-sm gap-2 mt-4" onClick={() => navigateToExplore('Stocks')}>
                View more stocks <ArrowRight className="size-4" />
              </Button>
            </Card>
          </div>

          {/* User Portfolio Summary & News */}
          <div className="space-y-8">
            <Card className="glass-card bg-primary/5 border-primary/20 p-6 space-y-4 hover:shadow-primary/10 transition-shadow">
              <h2 className="font-headline font-bold text-lg">Your Portfolio</h2>
              <div>
                <div className="text-3xl font-bold">${MOCK_USER.balance.toLocaleString()}</div>
                <div className="text-xs text-green-500 font-bold flex items-center gap-1 mt-1">
                  <TrendingUp className="size-3" /> +12.5% Returns
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="outline" className="text-xs h-9 rounded-lg" onClick={() => router.push('/portfolio')}>Analyze</Button>
                <Button className="text-xs h-9 rounded-lg" onClick={() => handleAction("Quick Buy", "Opening execution panel...")}>Invest More</Button>
              </div>
            </Card>

            <div className="space-y-4">
              <h2 className="text-lg font-headline font-bold">Top Market News</h2>
              <div className="space-y-4">
                {MOCK_NEWS.slice(0, 3).map((item) => (
                  <div key={item.id} className="group cursor-pointer border-b border-border/50 pb-4 last:border-0" onClick={() => router.push('/news')}>
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

        </div>

        {/* Global Market Explorer Call to Action */}
        <Card className="glass-card bg-gradient-to-r from-primary/10 via-background to-background border-primary/20 overflow-hidden relative group">
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
