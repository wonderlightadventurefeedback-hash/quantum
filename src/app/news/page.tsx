
"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Newspaper, TrendingUp, TrendingDown, RefreshCw, BarChart3, ShieldAlert, Loader2, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

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
      const response = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`)
      if (!response.ok) throw new Error("Failed to fetch news")
      const data = await response.json()
      setNews(data.slice(0, 20)) // Get top 20 news items
      if (showToast) {
        toast({
          title: "Feed Updated",
          description: "Successfully fetched latest global market news.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Feed Error",
        description: "Could not connect to financial news service.",
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

  // Heuristic for AI Sentiment simulation since Finnhub general news doesn't include it directly
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
            <h1 className="text-3xl font-headline font-bold">News Intelligence</h1>
            <p className="text-muted-foreground">Real-time global news powered by Finnhub API.</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => fetchNews(true)} disabled={isRefreshing}>
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
              <div className="text-2xl font-bold">14 Active</div>
              <p className="text-xs text-muted-foreground mt-1">Identified in global tech feeds</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-red-500/20 bg-red-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-500 flex items-center gap-2">
                <TrendingDown className="size-4" /> Bearish Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6 Active</div>
              <p className="text-xs text-muted-foreground mt-1">Detected in real estate sector</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" /> Global Sentiment Gauge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end mb-2">
                <span className="text-2xl font-bold">68</span>
                <span className="text-xs font-bold text-primary uppercase tracking-tighter">Greed</span>
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
                <Card key={i} className="glass-card h-40 flex items-center justify-center">
                  <Loader2 className="animate-spin text-primary" />
                </Card>
              ))
            ) : (
              news.map((item, i) => {
                const sentiment = getSentiment(item.id);
                const score = getScore(item.id);
                const datetime = item.datetime ? new Date(item.datetime * 1000) : new Date();
                const relativeTime = formatDistanceToNow(datetime, { addSuffix: true });

                return (
                  <Card key={item.id} className="glass-card overflow-hidden hover:border-primary/50 transition-colors group animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex flex-col md:flex-row">
                      <div className="p-6 flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                            <Newspaper className="size-3" /> {item.source} • {relativeTime}
                          </div>
                          <Badge variant={sentiment === 'POSITIVE' ? 'default' : sentiment === 'NEGATIVE' ? 'destructive' : 'secondary'}>
                            {sentiment}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-headline font-bold leading-tight group-hover:text-primary transition-colors">
                          {item.headline}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.summary || "No summary available for this market update."}
                        </p>
                        <div className="flex items-center gap-6 pt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">Impact Score</span>
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map(dot => (
                                <span key={dot} className={`size-1.5 rounded-full ${dot <= (score / 20) ? 'bg-primary' : 'bg-muted'}`} />
                              ))}
                            </div>
                          </div>
                          <Button 
                            variant="link" 
                            className="text-xs h-auto p-0 font-bold gap-1"
                            onClick={() => handleReadMore(item.url)}
                          >
                            Read Full Article <ExternalLink className="size-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="w-full md:w-48 bg-muted/30 border-l border-border flex items-center justify-center p-6 text-center">
                        <div>
                          <div className={`text-2xl font-bold ${sentiment === 'POSITIVE' ? 'text-green-500' : sentiment === 'NEGATIVE' ? 'text-red-500' : 'text-foreground'}`}>
                            {score}%
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">AI Confidence</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
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
                  Global feeds indicate heightened volatility in Asian markets during next session.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
