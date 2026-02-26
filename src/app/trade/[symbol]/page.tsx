
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Bell, 
  Plus, 
  ExternalLink, 
  Settings2, 
  ChevronDown,
  Info,
  Zap,
  Layout
} from "lucide-react"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts"
import { MOCK_STOCKS, MOCK_USER } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// Range Bar component for Today's and 52W Low/High
const RangeBar = ({ low, high, current, labelLow, labelHigh }: { low: number, high: number, current: number, labelLow: string, labelHigh: string }) => {
  const percentage = ((current - low) / (high - low)) * 100;
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{labelLow}</span>
          <span className="text-sm font-bold">{low.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{labelHigh}</span>
          <span className="text-sm font-bold">{high.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
      <div className="relative h-[2px] w-full bg-muted/50 rounded-full">
        <div 
          className="absolute top-[-6px] -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[7px] border-b-muted-foreground transition-all duration-700 ease-out" 
          style={{ left: `${Math.min(Math.max(percentage, 0), 100)}%` }}
        />
      </div>
    </div>
  )
}

// Generate more detailed data for the big chart
const generateChartData = (basePrice: number) => {
  return Array.from({ length: 100 }, (_, i) => ({
    time: i,
    price: basePrice + (Math.random() - 0.5) * (basePrice * 0.05),
  }))
}

export default function StockDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const symbol = params.symbol as string
  
  const stock = MOCK_STOCKS.find(s => s.symbol === symbol) || MOCK_STOCKS[0]
  const [activeOrderTab, setActiveOrderTab] = React.useState("BUY")
  const [orderType, setOrderType] = React.useState("Delivery")
  const [qty, setQty] = React.useState("1")
  const [price, setPrice] = React.useState(stock.price.toString())
  
  const chartData = React.useMemo(() => generateChartData(stock.price), [stock.price])
  const priceChange = (stock.price * (stock.change / 100)).toFixed(2)

  // Dummy performance data
  const performance = {
    todayLow: stock.price * 0.98,
    todayHigh: stock.price * 1.02,
    fiftyTwoWLow: stock.price * 0.65,
    fiftyTwoWHigh: stock.price * 1.05,
    open: stock.price * 0.99,
    prevClose: stock.price * 1.01,
    volume: stock.volume,
    totalTradedValue: "665 Cr",
    upperCircuit: stock.price * 1.1,
    lowerCircuit: stock.price * 0.9,
  }

  const handleOrder = () => {
    toast({
      title: `${activeOrderTab} Order Placed`,
      description: `Order for ${qty} shares of ${stock.symbol} at ${price} has been sent to the exchange.`,
    })
  }

  return (
    <DashboardShell>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Breadcrumbs / Top Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="gap-2 px-0 hover:bg-transparent" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
            <span className="text-sm font-medium">Back to Markets</span>
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="rounded-xl gap-2">
              <Bell className="size-4" /> Create Alert
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl gap-2">
              <Plus className="size-4" /> Watchlist
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 space-y-10">
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="size-14 rounded-2xl bg-muted/50 flex items-center justify-center font-bold text-primary text-xl border border-border/50">
                    {stock.symbol[0]}
                  </div>
                  <div>
                    <h1 className="text-3xl font-headline font-bold">{stock.name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                      <span>NSE ₹{stock.price}</span>
                      <span className="text-primary">({stock.change > 0 ? '+' : ''}{stock.change}%)</span>
                      <span>• BSE ₹{stock.price}</span>
                    </div>
                  </div>
                </div>
                <Button variant="link" className="text-primary gap-1 font-bold">
                  <ExternalLink className="size-4" /> Option Chain
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-headline font-bold">₹{stock.price}</span>
                  <span className={cn(
                    "text-lg font-bold",
                    stock.trend === "UP" ? "text-green-500" : "text-red-500"
                  )}>
                    {stock.trend === "UP" ? "+" : ""}{priceChange} ({stock.change}%)
                  </span>
                  <span className="text-muted-foreground text-sm font-medium uppercase tracking-widest">1D</span>
                </div>
              </div>

              {/* Main Chart */}
              <div className="h-[400px] w-full glass-card p-4 rounded-3xl relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.1} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
                
                {/* Chart Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1 bg-muted/80 backdrop-blur-md rounded-2xl border border-border shadow-xl">
                  {["NSE", "1D", "1W", "1M", "3M", "6M", "1Y", "3Y", "5Y", "All"].map((t) => (
                    <Button 
                      key={t} 
                      variant="ghost" 
                      size="sm" 
                      className={cn(
                        "h-8 px-3 rounded-xl text-[10px] font-bold",
                        t === "1D" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t}
                    </Button>
                  ))}
                  <div className="w-px h-4 bg-border mx-1" />
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl text-primary">
                    <Zap className="size-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 rounded-xl text-[10px] font-bold gap-2 bg-background">
                    Terminal <Layout className="size-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Performance Section */}
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 gap-8">
                  {["Overview", "Technicals", "News", "Events", "F&O"].map((tab) => (
                    <TabsTrigger 
                      key={tab} 
                      value={tab.toLowerCase()}
                      className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 py-4 text-sm font-bold text-muted-foreground transition-all uppercase tracking-widest"
                    >
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="overview" className="pt-10 space-y-12">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-headline font-bold">Performance</h2>
                      <Info className="size-4 text-muted-foreground" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                      <RangeBar 
                        low={performance.todayLow} 
                        high={performance.todayHigh} 
                        current={stock.price} 
                        labelLow="Today's Low" 
                        labelHigh="Today's High" 
                      />
                      <RangeBar 
                        low={performance.fiftyTwoWLow} 
                        high={performance.fiftyTwoWHigh} 
                        current={stock.price} 
                        labelLow="52W Low" 
                        labelHigh="52W High" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-8">
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Open</div>
                      <div className="text-base font-bold">₹{performance.open.toFixed(2)}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Prev. Close</div>
                      <div className="text-base font-bold">₹{performance.prevClose.toFixed(2)}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Volume</div>
                      <div className="text-base font-bold">{performance.volume}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total traded value</div>
                      <div className="text-base font-bold">{performance.totalTradedValue}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Upper Circuit</div>
                      <div className="text-base font-bold">₹{performance.upperCircuit.toFixed(2)}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Lower Circuit</div>
                      <div className="text-base font-bold">₹{performance.lowerCircuit.toFixed(2)}</div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Panel: Order Form */}
          <div className="space-y-6">
            <Card className="glass-card border-border overflow-hidden rounded-[2rem] shadow-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xl font-headline font-bold">{stock.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      NSE ₹{stock.price} (+{stock.change}%) • BSE ₹{stock.price}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex p-1 bg-muted/50 rounded-2xl">
                  <button 
                    onClick={() => setActiveOrderTab("BUY")}
                    className={cn(
                      "flex-1 py-2 text-sm font-bold rounded-xl transition-all",
                      activeOrderTab === "BUY" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground"
                    )}
                  >
                    BUY
                  </button>
                  <button 
                    onClick={() => setActiveOrderTab("SELL")}
                    className={cn(
                      "flex-1 py-2 text-sm font-bold rounded-xl transition-all",
                      activeOrderTab === "SELL" ? "bg-destructive text-destructive-foreground shadow-lg" : "text-muted-foreground"
                    )}
                  >
                    SELL
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {["Delivery", "Intraday", "MTF 4.11x"].map((t) => (
                    <Button 
                      key={t}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "rounded-full h-8 text-xs font-bold shrink-0",
                        orderType === t ? "border-primary text-primary bg-primary/5" : "border-border"
                      )}
                      onClick={() => setOrderType(t)}
                    >
                      {t}
                    </Button>
                  ))}
                  <Button variant="ghost" size="icon" className="size-8 rounded-full border border-border">
                    <Settings2 className="size-3" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                      Qty <span className="uppercase">{stock.symbol}</span> <ChevronDown className="size-3" />
                    </div>
                    <Input 
                      type="number" 
                      value={qty} 
                      onChange={(e) => setQty(e.target.value)}
                      className="h-10 text-right font-bold bg-muted/20 border-border" 
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                      Price <span className="uppercase">Limit</span> <ChevronDown className="size-3" />
                    </div>
                    <Input 
                      type="number" 
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)}
                      className="h-10 text-right font-bold bg-muted/20 border-border" 
                    />
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      Balance: ₹{MOCK_USER.balance.toLocaleString()} <Info className="size-3" />
                    </div>
                    <div>Approx req: ₹{(parseFloat(qty) * parseFloat(price)).toLocaleString()}</div>
                  </div>
                  <Button 
                    className={cn(
                      "w-full h-14 rounded-2xl text-lg font-bold shadow-xl transition-transform hover:scale-[1.02]",
                      activeOrderTab === "BUY" ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"
                    )}
                    onClick={handleOrder}
                  >
                    {activeOrderTab === "BUY" ? "Buy" : "Sell"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-none bg-muted/20 p-4">
              <CardContent className="p-0 flex gap-3">
                <Info className="size-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-tight font-medium">
                  Ensure sufficient margin for the order. Market orders are executed at best available price. Trading involves risk.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
