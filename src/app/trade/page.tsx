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
        description: `Bought 1 share of ${stock.symbol} at ${stock.price} INR`,
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
                placeholder="Search stocks by name or symbol (e.g. SBLI, AAPL)..." 
                className="pl-12 h-14 bg-card/50 border-border rounded-2xl focus-visible:ring-primary/40"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              {filteredStocks.map((stock) => (
                <Card key={stock.symbol} className="glass-card hover:border-primary/50 transition-all group overflow-hidden border-none shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="size-12 rounded-full bg-muted flex items-center justify-center shrink-0 font-bold text-muted-foreground border border-border/50">
                        {stock.symbol[0]}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-bold text-sm truncate">{stock.name}</h3>
                        <Badge variant="secondary" className="w-fit text-[9px] h-4 py-0 px-1.5 bg-muted/50 text-muted-foreground font-bold uppercase border-none rounded-sm">
                          {stock.symbol}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right shrink-0">
                        <div className="text-base font-bold flex items-center gap-1 justify-end">
                          {stock.price.toFixed(2)} <span className="text-[10px] text-muted-foreground font-normal">INR</span>
                        </div>
                        <div className={cn(
                          "text-[11px] font-bold px-2 py-0.5 rounded min-w-[70px] text-center mt-1",
                          stock.change > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {stock.change > 0 ? "+" : ""}{stock.change.toFixed(2)}%
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="rounded-lg font-bold h-9 text-xs"
                          onClick={() => toast({ title: stock.symbol, description: `Loading technical charts...` })}
                        >
                          Details
                        </Button>
                        <Button 
                          size="sm"
                          className="rounded-lg font-bold gap-2 h-9 text-xs"
                          disabled={isOrdering === stock.symbol}
                          onClick={() => handleBuy(stock)}
                        >
                          {isOrdering === stock.symbol ? (
                            <span className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <ShoppingCart className="size-3" />
                          )}
                          Buy
                        </Button>
                      </div>
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
                All simulated trades are executed at current market price. Commission is 0 INR for the first 100 trades of the month.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
