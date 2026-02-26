"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bookmark, TrendingUp, TrendingDown, ArrowRight, Star } from "lucide-react"
import { MOCK_STOCKS } from "@/lib/mock-data"
import { useRouter } from "next/navigation"

export default function WatchlistPage() {
  const router = useRouter()
  
  return (
    <DashboardShell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-3">
            <Star className="size-8 text-yellow-500 fill-yellow-500" /> My Watchlist
          </h1>
          <p className="text-muted-foreground">Monitor your favorite assets for the perfect entry point.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_STOCKS.slice(0, 4).map((stock) => (
            <Card key={stock.symbol} className="glass-card hover:border-primary/50 transition-all cursor-pointer group" onClick={() => router.push(`/trade/${stock.symbol}`)}>
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
                  <Button variant="ghost" size="sm" className="text-primary font-bold gap-2">
                    Trade <ArrowRight className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="glass-card border-dashed border-2 flex flex-col items-center justify-center p-12 text-center bg-muted/5">
          <Bookmark className="size-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold">Add more to your watchlist</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2">
            Click the bookmark icon on any stock page to track it here.
          </p>
          <Button className="mt-6 rounded-xl font-bold" onClick={() => router.push('/trade')}>
            Explore Markets
          </Button>
        </Card>
      </div>
    </DashboardShell>
  )
}
