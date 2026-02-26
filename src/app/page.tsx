
"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  LineChart as LineChartIcon,
  BookOpen,
  ArrowRight
} from "lucide-react"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts"
import { MOCK_USER, MOCK_STOCKS, MOCK_NEWS } from "@/lib/mock-data"

const data = [
  { name: "Mon", value: 2400 },
  { name: "Tue", value: 2600 },
  { name: "Wed", value: 2500 },
  { name: "Thu", value: 2800 },
  { name: "Fri", value: 3100 },
  { name: "Sat", value: 2900 },
  { name: "Sun", value: 3200 },
]

export default function OverviewPage() {
  const { toast } = useToast()
  const router = useRouter()

  const handleAction = (title: string, description: string) => {
    toast({
      title,
      description,
    })
  }

  return (
    <DashboardShell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">Good morning, {MOCK_USER.name}</h1>
            <p className="text-muted-foreground">Here's what's happening in the markets today.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" onClick={() => handleAction("Deposit Initiated", "Redirecting to secure payment gateway...")}>
              <Wallet className="size-4" /> Deposit
            </Button>
            <Button className="gap-2" onClick={() => handleAction("Quick Trade", "Trade execution panel opening...")}>
              <TrendingUp className="size-4" /> Quick Trade
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Portfolio Balance</CardTitle>
              <Wallet className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${MOCK_USER.balance.toLocaleString()}</div>
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <TrendingUp className="size-3" /> +12.5% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Prediction Accuracy</CardTitle>
              <LineChartIcon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{MOCK_USER.predictionAccuracy}%</div>
              <Progress value={MOCK_USER.predictionAccuracy} className="h-1 mt-3" />
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Learning Progress</CardTitle>
              <BookOpen className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{MOCK_USER.learningProgress}%</div>
              <Progress value={MOCK_USER.learningProgress} className="h-1 mt-3" />
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Market Sentiment</CardTitle>
              <TrendingUp className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Bullish</div>
              <p className="text-xs text-muted-foreground mt-1">Based on AI News Analysis</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Portfolio Performance</CardTitle>
              <CardDescription>Visualizing your growth over the last 7 days.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))'}}
                      itemStyle={{color: 'hsl(var(--primary))'}}
                    />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Watchlist</CardTitle>
              <CardDescription>Trending stocks in your radar.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_STOCKS.map((stock) => (
                  <div 
                    key={stock.symbol} 
                    className="flex items-center justify-between group cursor-pointer"
                    onClick={() => handleAction(`Viewing ${stock.symbol}`, `Current price: $${stock.price}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs">
                        {stock.symbol[0]}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground">{stock.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">${stock.price}</div>
                      <div className={cn(
                        "text-xs flex items-center justify-end gap-1",
                        stock.change > 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {stock.change > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                        {stock.change > 0 ? "+" : ""}{stock.change}%
                      </div>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="ghost" 
                  className="w-full text-xs text-primary" 
                  size="sm"
                  onClick={() => handleAction("Market Explorer", "Redirecting to global market overview...")}
                >
                  View full market <ArrowRight className="size-3 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Top AI News</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_NEWS.map((item) => (
                  <div key={item.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="text-sm font-medium line-clamp-2">{item.title}</h4>
                      <Badge variant={item.sentiment === 'POSITIVE' ? 'default' : item.sentiment === 'NEGATIVE' ? 'destructive' : 'secondary'}>
                        {item.sentiment}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{item.source}</span>
                      <span>•</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                ))}
                <Link href="/news">
                  <Button variant="link" className="w-full text-xs" size="sm">Go to News Intel</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">AI Financial Goal</CardTitle>
              <CardDescription>Personalized path to financial freedom.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                  <LineChartIcon className="size-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold">Diversify Tech Holdings</h4>
                  <p className="text-sm text-muted-foreground">Your portfolio is 60% tech. Consider adding defensive stocks.</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-background/50 border border-border">
                <div className="flex justify-between text-sm mb-2">
                  <span>Goal Completion</span>
                  <span className="font-bold">42%</span>
                </div>
                <Progress value={42} className="h-2" />
              </div>
              <Button className="w-full" onClick={() => router.push('/advisor')}>View Advisor Advice</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
