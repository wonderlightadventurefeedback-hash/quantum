
"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Wallet, 
  TrendingUp, 
  Zap,
  Info,
  ShoppingCart
} from "lucide-react"
import { MOCK_STOCKS, MOCK_USER } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function TradePage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isOrdering, setIsOrdering] = React.useState<string | null>(null)

  const filteredStocks = MOCK_STOCKS.filter(stock => 
    stock.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleBuy = (stock: typeof MOCK_STOCKS[0]) => {
    setIsOrdering(stock.symbol)
    // Simulate API delay
    setTimeout(() => {
      setIsOrdering(null)
      toast({
        title: "Order Placed Successfully",
        description: `Bought 1 share of ${stock.symbol} at $${stock.price}`,
      })
    }, 1200)
  }

  return (
    <DashboardShell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">Trading Terminal</h1>
            <p className="text-muted-foreground">Execute real-time trades on global indices and individual stocks.</p>
          </div>
          <Card className="glass-card flex items-center gap-4 px-6 py-3 border-primary/20 bg-primary/5">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="size-5 text-primary" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Buying Power</div>
              <div className="text-xl font-bold">${MOCK_USER.balance.toLocaleString()}</div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Stock List */}
          <div className="lg:col-span-3 space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input 
                placeholder="Search stocks by name or symbol (e.g. AAPL, Tesla)..." 
                className="pl-12 h-14 bg-card/50 border-border rounded-2xl focus-visible:ring-primary/40"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStocks.map((stock) => (
                <Card key={stock.symbol} className="glass-card hover:border-primary/50 transition-all group overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center font-bold text-primary group-hover:scale-110 transition-transform">
                          {stock.symbol[0]}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{stock.name}</h3>
                          <Badge variant="outline" className="text-[10px] h-5">{stock.category}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">${stock.price}</div>
                        <div className={cn(
                          "text-xs font-bold flex items-center justify-end gap-1",
                          stock.change > 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {stock.change > 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                          {Math.abs(stock.change)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <Button 
                        variant="secondary" 
                        className="rounded-xl font-bold"
                        onClick={() => toast({ title: "View Chart", description: `Loading ${stock.symbol} real-time candlestick data...` })}
                      >
                        Details
                      </Button>
                      <Button 
                        className="rounded-xl font-bold gap-2"
                        disabled={isOrdering === stock.symbol}
                        onClick={() => handleBuy(stock)}
                      >
                        {isOrdering === stock.symbol ? (
                          <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <ShoppingCart className="size-4" />
                        )}
                        Buy {stock.symbol}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredStocks.length === 0 && (
              <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
                <Search className="size-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-bold">No results found</h3>
                <p className="text-muted-foreground">Try searching for another ticker symbol or company name.</p>
              </div>
            )}
          </div>

          {/* Sidebar / Market Info */}
          <div className="space-y-6">
            <Card className="glass-card border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-widest font-bold text-primary flex items-center gap-2">
                  <Zap className="size-4 fill-primary" /> Instant Buy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-xs text-muted-foreground leading-relaxed">
                  Toggle <span className="text-primary font-bold">One-Click Trading</span> for lightning-fast executions. Perfect for catching volatility.
                </div>
                <Button variant="outline" className="w-full text-xs h-9 rounded-lg">Configure Limits</Button>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-widest font-bold text-muted-foreground">Market Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Nasdaq</span>
                  <Badge className="bg-green-500/10 text-green-500 border-none">Open</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">NSE/BSE</span>
                  <Badge variant="outline" className="text-muted-foreground border-muted">Closed</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Crypto</span>
                  <Badge className="bg-green-500/10 text-green-500 border-none">24/7</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card bg-muted/30 border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <Info className="size-4 text-primary" />
                  Trading Rule
                </CardTitle>
              </CardHeader>
              <CardContent className="text-[10px] text-muted-foreground leading-tight">
                All simulated trades are executed at current market price. Commission is $0.00 for the first 100 trades of the month. High volatility might cause slippage.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
