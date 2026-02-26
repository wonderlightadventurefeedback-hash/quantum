"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Wallet, 
  Zap,
  Info
} from "lucide-react"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { MOCK_STOCKS, MOCK_USER } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function TradePage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredStocks = MOCK_STOCKS.filter(stock => 
    stock.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          <div className="lg:col-span-3 space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input 
                placeholder="Search stocks by name or symbol (e.g. BOB, AMZN)..." 
                className="pl-12 h-14 bg-card/50 border-border rounded-2xl focus-visible:ring-primary/40"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Card className="glass-card border-none shadow-none bg-transparent overflow-hidden">
              <CardContent className="p-0">
                <div className="min-w-[800px] overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground font-bold uppercase tracking-widest border-b border-border/50">
                        <th className="px-6 py-4">Company</th>
                        <th className="px-6 py-4 text-center">Market Chart</th>
                        <th className="px-6 py-4 text-right">Price (INR)</th>
                        <th className="px-6 py-4 text-right">Volume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredStocks.map((stock, i) => (
                        <tr 
                          key={stock.symbol} 
                          className="group hover:bg-muted/5 transition-colors animate-in fade-in slide-in-from-right-4"
                          style={{ animationDelay: `${100 + (i * 30)}ms` }}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="size-12 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 font-bold text-primary text-base border border-border/50 transition-transform group-hover:scale-105">
                                {stock.symbol[0]}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="font-bold text-[14px] truncate">{stock.name}</div>
                                <Badge variant="secondary" className="w-fit text-[9px] h-4 py-0 px-1.5 bg-muted/50 text-muted-foreground font-bold uppercase border-none rounded-sm">
                                  {stock.symbol}
                                </Badge>
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
                              <div className="text-[14px] font-bold">₹{stock.price.toLocaleString()}</div>
                              <div className={cn(
                                "text-[10px] font-bold",
                                stock.trend === "UP" ? "text-green-500" : "text-red-500"
                              )}>
                                {stock.trend === "UP" ? "+" : ""}{(stock.price * (stock.change / 100)).toFixed(2)} ({stock.change.toFixed(2)}%)
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-xs font-medium text-muted-foreground">{stock.volume}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {filteredStocks.length === 0 && (
              <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
                <Search className="size-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-bold">No results found</h3>
                <p className="text-muted-foreground">Try searching for another ticker symbol or company name.</p>
              </div>
            )}
          </div>

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
              <CardContent className="p-4 flex items-start gap-2 text-[10px] text-muted-foreground leading-tight">
                <Info className="size-4 text-primary shrink-0" />
                All simulated trades are executed at current market price. Commission is 0 INR for the first 100 trades of the month.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
