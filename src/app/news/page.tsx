
"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Newspaper, TrendingUp, TrendingDown, RefreshCw, BarChart3, ShieldAlert, Loader2, ExternalLink, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'd6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110';

interface FinnhubNewsItem {
  id: number;
  headline: string;
  source: string;
  datetime: number;
  summary: string;
  url: string;
  image: string;
  category: string;
}

export default function NewsPage() {
  const { toast } = useToast()
  const [news, setNews] = React.useState<FinnhubNewsItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const fetchNews = React.useCallback(async (showToast = false) => {
    setIsRefreshing(true)
    try {
      // Use general market news endpoint
      const response = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch news");
      }
      
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setNews(data.slice(0, 20))
        if (showToast) {
          toast({
            title: "Feed Updated",
            description: "Successfully fetched latest global market news.",
          })
        }
      } else {
        throw new Error("Invalid data format received from news service");
      }
    } catch (error: any) {
      console.error("News Fetch Error:", error);
      toast({
        variant: "destructive",
        title: "Feed Error",
        description: error.message || "Could not connect to financial news service.",
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [toast]);

  React.useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const handleReadMore = (url: string) => {
    window.open(url, "_blank")
  }

  // Heuristic for AI Sentiment simulation
  const getSentiment = (id: number) => {
    const sentiments = ["POSITIVE", "NEGATIVE", "NEUTRAL"];
    return sentiments[id % 3];
  }

  const getScore = (id: number) => {
    return 40 + (id % 55);
  }

  return (
    <DashboardShell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-foreground">News Intelligence</h1>
            <p className="text-muted-foreground">Real-time global news powered by Finnhub API.</p>
          </div>
          <Button variant="outline" className="gap-2 h-11 rounded-xl" onClick={() => fetchNews(true)} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Refresh Feed
          </Button>
        </div>

        {/* Sentiment Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card border-green-500/20 bg-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-green-500 flex items-center gap-2 uppercase tracking-widest">
                <TrendingUp className="size-4" /> Bullish Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">14 Active</div>
              <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Identified in global tech feeds</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-red-500/20 bg-red-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-red-500 flex items-center gap-2 uppercase tracking-widest">
                <TrendingDown className="size-4" /> Bearish Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">6 Active</div>
              <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Detected in real estate sector</p>
            </CardContent>
          </Card>
          <Card className="glass-card bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest">
                <BarChart3 className="size-4 text-primary" /> Sentiment Gauge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end mb-2">
                <span className="text-3xl font-black">68</span>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Greed</span>
              </div>
              <Progress value={68} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* News Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="glass-card h-48 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="animate-spin text-primary size-8" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Fetching Global Intel...</span>
                </Card>
              ))
            ) : news.length === 0 ? (
              <Card className="glass-card p-20 text-center space-y-4">
                <Newspaper className="size-12 text-muted-foreground/30 mx-auto" />
                <h3 className="text-xl font-bold">No intelligence found</h3>
                <p className="text-sm text-muted-foreground">The news feed is currently empty. Check your API connection.</p>
                <Button onClick={() => fetchNews(true)} variant="outline">Retry Sync</Button>
              </Card>
            ) : (
              news.map((item, i) => {
                const sentiment = getSentiment(item.id);
                const score = getScore(item.id);
                const datetime = item.datetime ? new Date(item.datetime * 1000) : new Date();
                const relativeTime = formatDistanceToNow(datetime, { addSuffix: true });

                return (
                  <Card key={item.id} className="glass-card overflow-hidden hover:border-primary/50 transition-all group animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex flex-col md:flex-row">
                      <div className="p-8 flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                            <Newspaper className="size-3 text-primary" /> {item.source} • {relativeTime}
                          </div>
                          <Badge variant={sentiment === 'POSITIVE' ? 'default' : sentiment === 'NEGATIVE' ? 'destructive' : 'secondary'} className="text-[9px] font-black uppercase tracking-tighter">
                            {sentiment}
                          </Badge>
                        </div>
                        <h3 className="text-2xl font-headline font-bold leading-tight group-hover:text-primary transition-colors">
                          {item.headline}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {item.summary || "No summary available for this market update. Click below to view the full report."}
                        </p>
                        <div className="flex items-center gap-8 pt-4 border-t border-border/50">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Impact</span>
                            <div className="flex gap-1.5">
                              {[1,2,3,4,5].map(dot => (
                                <span key={dot} className={`size-2 rounded-full ${dot <= (score / 20) ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]' : 'bg-muted'}`} />
                              ))}
                            </div>
                          </div>
                          <Button 
                            variant="link" 
                            className="text-xs h-auto p-0 font-black uppercase tracking-widest gap-2 text-primary hover:text-primary/80"
                            onClick={() => handleReadMore(item.url)}
                          >
                            Read Full Intel <ExternalLink className="size-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="w-full md:w-56 bg-muted/20 border-l border-border/50 flex items-center justify-center p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                          <div className={`text-4xl font-black font-headline tracking-tighter ${sentiment === 'POSITIVE' ? 'text-green-500' : sentiment === 'NEGATIVE' ? 'text-red-500' : 'text-foreground'}`}>
                            {score}%
                          </div>
                          <div className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-2">AI Confidence</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          <div className="space-y-6">
            <Card className="glass-card bg-card/40">
              <CardHeader>
                <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Trending Sectors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  { name: "Semiconductors", trend: "UP" },
                  { name: "Cloud Computing", trend: "UP" },
                  { name: "Renewable Energy", trend: "DOWN" },
                  { name: "Fintech", trend: "UP" }
                ].map(s => (
                  <div key={s.name} className="flex items-center justify-between group cursor-pointer">
                    <span className="text-sm font-bold group-hover:text-primary transition-colors">{s.name}</span>
                    {s.trend === "UP" ? <TrendingUp className="size-4 text-green-500" /> : <TrendingDown className="size-4 text-red-500" />}
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card className="glass-card border-orange-500/20 bg-orange-500/5">
              <CardHeader>
                <CardTitle className="text-[10px] uppercase font-black tracking-[0.2em] text-orange-500 flex items-center gap-2">
                  <ShieldAlert className="size-4" /> Global Volatility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-xs p-4 rounded-xl bg-background/50 text-foreground/80 leading-relaxed border border-orange-500/10 italic">
                  "Market scanners indicate heightened liquidity shifts in Asian session futures. Proceed with caution."
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card p-6 flex flex-col items-center text-center gap-4 bg-primary/5 border-primary/20">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="size-6 text-primary fill-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold">Predict Market Moves</h4>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Use AI to analyze news impact</p>
              </div>
              <Button size="sm" className="w-full rounded-xl font-bold text-xs" onClick={() => window.location.href='/predict'}>
                Open Arena
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
