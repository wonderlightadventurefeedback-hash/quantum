
"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Newspaper, TrendingUp, TrendingDown, RefreshCw, BarChart3, ShieldAlert, Loader2 } from "lucide-react"
import { MOCK_NEWS } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"

export default function NewsPage() {
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      toast({
        title: "Feed Updated",
        description: "Successfully fetched latest market sentiment data.",
      })
    }, 1500)
  }

  const handleReadAnalysis = (title: string) => {
    toast({
      title: "Opening Analysis",
      description: `Loading deep dive for: ${title}`,
    })
  }

  return (
    <DashboardShell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">News Intelligence</h1>
            <p className="text-muted-foreground">Real-time sentiment analysis of global financial markets.</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Refresh Feed
          </Button>
        </div>

        {/* Sentiment Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card border-green-500/20 bg-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-500 flex items-center gap-2">
                <TrendingUp className="size-4" /> Bullish Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12 Active</div>
              <p className="text-xs text-muted-foreground mt-1">Found in Tech & Energy</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-red-500/20 bg-red-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-500 flex items-center gap-2">
                <TrendingDown className="size-4" /> Bearish Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4 Active</div>
              <p className="text-xs text-muted-foreground mt-1">Found in Real Estate</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" /> Market Sentiment Gauge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end mb-2">
                <span className="text-2xl font-bold">72</span>
                <span className="text-xs font-bold text-primary uppercase tracking-tighter">Greed</span>
              </div>
              <Progress value={72} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* News Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            {MOCK_NEWS.map((item) => (
              <Card key={item.id} className="glass-card overflow-hidden hover:border-primary/50 transition-colors group">
                <div className="flex flex-col md:flex-row">
                  <div className="p-6 flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        <Newspaper className="size-3" /> {item.source} • {item.time}
                      </div>
                      <Badge variant={item.sentiment === 'POSITIVE' ? 'default' : item.sentiment === 'NEGATIVE' ? 'destructive' : 'secondary'}>
                        {item.sentiment}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-headline font-bold leading-tight group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      In a surprising turn of events, market analysts have observed a significant shift in trading volumes following the recent announcement...
                    </p>
                    <div className="flex items-center gap-6 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Impact Score</span>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(i => (
                            <span key={i} className={`size-1.5 rounded-full ${i <= (item.score / 20) ? 'bg-primary' : 'bg-muted'}`} />
                          ))}
                        </div>
                      </div>
                      <Button 
                        variant="link" 
                        className="text-xs h-auto p-0 font-bold"
                        onClick={() => handleReadAnalysis(item.title)}
                      >
                        Read Analysis
                      </Button>
                    </div>
                  </div>
                  <div className="w-full md:w-48 bg-muted/30 border-l border-border flex items-center justify-center p-6 text-center">
                    <div>
                      <div className={`text-2xl font-bold ${item.sentiment === 'POSITIVE' ? 'text-green-500' : item.sentiment === 'NEGATIVE' ? 'text-red-500' : 'text-foreground'}`}>
                        {item.score}%
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">AI Confidence</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider font-bold text-muted-foreground">Bullish Sectors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {["Semiconductors", "Cloud Computing", "Clean Energy"].map(s => (
                  <div key={s} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{s}</span>
                    <TrendingUp className="size-4 text-green-500" />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="glass-card border-orange-500/20">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider font-bold text-orange-500 flex items-center gap-2">
                  <ShieldAlert className="size-4" /> Market Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-xs p-3 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  Potential volatility spike expected during Wednesday's FOMC meeting.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
