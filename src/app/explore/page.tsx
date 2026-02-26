
"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, TrendingUp, Filter, ArrowLeft, Loader2 } from "lucide-react"
import { MOCK_STOCKS, MOCK_MUTUAL_FUNDS, MOCK_FIXED_DEPOSITS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import Link from "next/link"

function ExploreContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("category") || "Stocks"
  const [activeTab, setActiveTab] = React.useState(initialCategory)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    setActiveTab(searchParams.get("category") || "Stocks")
  }, [searchParams])

  const handleAssetClick = (symbol: string) => {
    router.push(`/trade/${symbol}`)
  }

  const renderContent = () => {
    if (activeTab === "Stocks" || activeTab === "US Stocks") {
      const stocks = MOCK_STOCKS.filter(s => s.category === activeTab && 
        (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         s.symbol.toLowerCase().includes(searchQuery.toLowerCase())))
      
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stocks.map((stock) => (
            <Card 
              key={stock.symbol} 
              className="glass-card hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => handleAssetClick(stock.symbol)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center font-bold text-primary group-hover:scale-110 transition-transform">
                    {stock.symbol[0]}
                  </div>
                  <Badge variant={stock.change > 0 ? "default" : "destructive"}>
                    {stock.change > 0 ? "+" : ""}{stock.change}%
                  </Badge>
                </div>
                <h3 className="text-lg font-bold">{stock.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{stock.symbol}</p>
                <div className="flex justify-between items-end">
                  <div className="text-2xl font-bold">₹{stock.price.toLocaleString()}</div>
                  <Button variant="ghost" size="sm" className="text-primary font-bold">Invest Now</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (activeTab === "Mutual Funds") {
      const funds = MOCK_MUTUAL_FUNDS.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {funds.map((fund) => (
            <Card key={fund.id} className="glass-card hover:border-primary/50 transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Badge className="bg-primary/10 text-primary border-primary/20">Returns: {fund.returns}</Badge>
                  <Badge variant="outline">{fund.risk} Risk</Badge>
                </div>
                <h3 className="text-lg font-bold mb-1">{fund.name}</h3>
                <div className="text-sm text-muted-foreground mb-4">NAV: ${fund.nav}</div>
                <Button className="w-full font-bold">View Portfolio</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (activeTab === "Fixed Deposits") {
      const fds = MOCK_FIXED_DEPOSITS.filter(fd => fd.bank.toLowerCase().includes(searchQuery.toLowerCase()))
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fds.map((fd) => (
            <Card key={fd.id} className="glass-card hover:border-primary/50 transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="size-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">{fd.bank}</h3>
                    <p className="text-xs text-muted-foreground">Highest Security Rating</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Interest Rate</div>
                    <div className="text-xl font-bold text-primary">{fd.rate}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Tenure</div>
                    <div className="text-sm font-medium">{fd.tenure}</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full font-bold">Check Eligibility</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    return null
  }

  return (
    <DashboardShell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-headline font-bold">Market Explorer</h1>
            <p className="text-muted-foreground">Discover investment opportunities across global markets.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex p-1 bg-muted/50 rounded-2xl w-full md:w-auto">
            {["Stocks", "Mutual Funds", "US Stocks", "Fixed Deposits"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                  activeTab === tab ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder={`Search ${activeTab}...`} 
              className="pl-10 h-11 bg-muted/30 border-none rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {renderContent()}

        <Card className="glass-card bg-primary/5 border-primary/20 p-8 text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Don't see what you're looking for?</CardTitle>
            <CardDescription className="max-w-md mx-auto text-base">
              Our AI Advisor can help you find specialized instruments like ETF, Gold, or Bonds tailored to your risk profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/advisor">
              <Button size="lg" className="rounded-xl font-bold px-8">Ask FinIntel AI</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

export default function ExplorePage() {
  return (
    <React.Suspense fallback={
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    }>
      <ExploreContent />
    </React.Suspense>
  )
}
