
"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  Send, 
  Bot, 
  User, 
  Zap, 
  Loader2, 
  Clock, 
  Info, 
  TrendingUp, 
  Activity, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown,
  Globe,
  Search,
  Cpu,
  Database
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
import { aiFinancialStrategyAdvisor } from "@/ai/flows/ai-financial-strategy-advisor"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, doc, query, orderBy, limit, serverTimestamp } from "firebase/firestore"
import { MOCK_USER } from "@/lib/mock-data"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp?: any
}

const generateMarketData = (base: number) => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: i,
    price: +(base + (Math.random() - 0.5) * (base * 0.05)).toFixed(2)
  }))
}

export default function AdvisorPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  
  const [chartData] = React.useState(generateMarketData(18500))

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, 'users', user.uid)
  }, [db, user])
  const { data: userProfile } = useDoc(userProfileRef)

  const holdingsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, 'users', user.uid, 'holdings')
  }, [db, user])
  const { data: holdings } = useCollection(holdingsQuery)

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, 'users', user.uid, 'chat_messages'), orderBy('timestamp', 'asc'), limit(50))
  }, [db, user])
  const { data: history, isLoading: isHistoryLoading } = useCollection(messagesQuery)

  React.useEffect(() => {
    if (history && history.length > 0) {
      setMessages(history.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp })))
    } else if (history && history.length === 0 && !isHistoryLoading) {
      setMessages([
        { role: 'assistant', content: "Welcome to **QuantumF AI**. My reasoning engine researches your questions through ChatGPT and collects all relevant financial and stock market information before providing an output. How can I help you optimize your strategy today?" }
      ])
    }
  }, [history, isHistoryLoading])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !db || !user) return

    const userMsg = input.trim()
    setInput("")
    
    const userMsgRef = collection(db, 'users', user.uid, 'chat_messages')
    addDocumentNonBlocking(userMsgRef, {
      role: 'user',
      content: userMsg,
      timestamp: serverTimestamp()
    })

    setIsLoading(true)

    try {
      const response = await aiFinancialStrategyAdvisor({
        userQuery: userMsg,
        portfolioData: JSON.stringify(holdings || []),
        learningProgress: `${userProfile?.learningProgress || 0}% complete.`
      })

      addDocumentNonBlocking(userMsgRef, {
        role: 'assistant',
        content: response.response,
        timestamp: serverTimestamp()
      })
    } catch (error) {
      addDocumentNonBlocking(userMsgRef, {
        role: 'assistant',
        content: "I encountered a communication error with my premium ChatGPT research layer. Please verify your configuration or try again shortly.",
        timestamp: serverTimestamp()
      })
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  const suggestions = [
    "Research NVIDIA technicals",
    "Analyze my current holdings",
    "Collect latest market news",
    "Stock trends through ChatGPT",
    "Explain Ethereum value"
  ]

  return (
    <DashboardShell>
      <div className="h-[calc(100vh-12rem)] flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-headline font-black uppercase tracking-tighter text-foreground">Intelligence Terminal</h1>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                <Search className="size-3 mr-1 inline animate-pulse" /> Research Mode
              </Badge>
              <Badge variant="outline" className="border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                <Database className="size-3 mr-1 inline" /> ChatGPT Data Collect
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs font-medium">
              QuantumF researches your question and collects all information through ChatGPT before giving the output.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-muted/30 border border-border/50 px-6 py-2.5 rounded-2xl">
            <div className="flex items-center gap-2 pr-4 border-r border-border/50">
              <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-foreground uppercase tracking-widest">Global Sync</span>
            </div>
            <div className="text-[10px] font-black text-primary uppercase tracking-widest">Status: Ready</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          
          <Card className="lg:col-span-2 glass-card overflow-hidden flex flex-col border-none shadow-2xl relative bg-card/40 backdrop-blur-xl">
            <ScrollArea className="flex-1 px-6 py-8">
              <div className="space-y-8 max-w-4xl mx-auto">
                {isHistoryLoading && messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center py-20">
                    <Loader2 className="size-8 animate-spin text-primary" />
                  </div>
                ) : messages.map((msg, i) => (
                  <div key={i} className={cn(
                    "flex gap-4 animate-in fade-in slide-in-from-bottom-2",
                    msg.role === 'user' ? 'flex-row-reverse text-right' : 'flex-row'
                  )}>
                    <Avatar className={cn(
                      "size-10 border-2 shrink-0 shadow-lg mt-1",
                      msg.role === 'assistant' ? 'border-primary/20 bg-primary' : 'border-muted bg-muted'
                    )}>
                      {msg.role === 'assistant' ? (
                        <Bot className="text-white size-5" />
                      ) : (
                        <AvatarImage src={user?.photoURL || MOCK_USER.avatar} />
                      )}
                      <AvatarFallback className="bg-transparent">
                        {msg.role === 'assistant' ? <Bot className="text-white size-5" /> : <User className="size-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "max-w-[85%] md:max-w-[75%] rounded-[2rem] px-6 py-4 text-[15px] leading-relaxed shadow-sm",
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-none ml-auto' 
                        : 'bg-background/80 border border-border/50 rounded-tl-none prose prose-sm dark:prose-invert max-w-none text-left'
                    )}>
                      {msg.content.split('\n').map((line, idx) => (
                        <p key={idx} className={cn(idx > 0 && "mt-2")}>{line}</p>
                      ))}
                      {msg.timestamp && (
                        <div className={cn(
                          "mt-2 pt-2 border-t flex items-center gap-1.5 text-[9px] font-black uppercase opacity-40",
                          msg.role === 'user' ? 'border-primary-foreground/10 justify-end' : 'border-border'
                        )}>
                          <Clock className="size-2" />
                          {formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4 animate-pulse">
                    <Avatar className="size-10 border-2 border-primary/20 bg-primary shrink-0 shadow-lg mt-1">
                      <Bot className="text-white size-5" />
                    </Avatar>
                    <div className="bg-background/80 border border-border/50 rounded-[2rem] rounded-tl-none px-6 py-4 flex items-center gap-4">
                      <div className="flex gap-1.5">
                        <span className="size-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="size-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="size-2 bg-primary rounded-full animate-bounce"></span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">ChatGPT Researching & Collecting Information...</span>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} className="h-4" />
              </div>
            </ScrollArea>

            <div className="px-6 py-4 border-t border-border/50 flex gap-3 overflow-x-auto no-scrollbar bg-muted/5 backdrop-blur-sm">
              {suggestions.map((q) => (
                <button 
                  key={q} 
                  className="shrink-0 rounded-full bg-background border border-border/50 hover:border-primary/50 hover:bg-primary/5 text-[10px] font-black uppercase h-9 px-6 transition-all" 
                  onClick={() => setInput(q)}
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="p-6 bg-muted/10 border-t border-border/50 backdrop-blur-md">
              <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
                <Input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Research the finance and stock market through ChatGPT..." 
                  className="pr-16 h-16 bg-background border-border/50 rounded-2xl focus-visible:ring-primary/40 text-lg shadow-xl"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 size-12 rounded-xl shadow-lg transition-transform active:scale-95"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <Send className="size-5" />}
                </Button>
              </form>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <Info className="size-3 text-muted-foreground" />
                  <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest text-center">
                    QuantumF researches through ChatGPT and collects all information about finance and stocks before giving the output
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="hidden lg:flex flex-col gap-6 overflow-y-auto no-scrollbar pb-10">
            <Card className="glass-card bg-card/40 border-none shadow-xl overflow-hidden p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Market Pulse</h3>
                <Badge variant="outline" className="text-[9px] uppercase font-black">Sentiment: Bullish</Badge>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '10px' }}
                    />
                    <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between text-center gap-2">
                <div className="flex-1 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="text-[9px] font-black text-muted-foreground uppercase">Research Index</div>
                  <div className="text-lg font-black text-foreground">18,452.10</div>
                </div>
                <div className="flex-1 p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                  <div className="text-[9px] font-black text-muted-foreground uppercase">Global Intel</div>
                  <div className="text-lg font-black text-green-500">+1.24%</div>
                </div>
              </div>
            </Card>

            <Card className="glass-card bg-card/40 border-none shadow-xl p-6 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" /> Sector Strengths
              </h3>
              <div className="space-y-4">
                {[
                  { name: "Technology", strength: 85, trend: "UP" },
                  { name: "Financials", strength: 62, trend: "UP" },
                  { name: "Real Estate", strength: 34, trend: "DOWN" },
                  { name: "Energy", strength: 48, trend: "UP" },
                ].map((s) => (
                  <div key={s.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter">
                      <span className="text-foreground flex items-center gap-1">
                        {s.name} {s.trend === "UP" ? <TrendingUp className="size-2 text-green-500" /> : <TrendingDown className="size-2 text-red-500" />}
                      </span>
                      <span className={cn(s.trend === "UP" ? "text-green-500" : "text-red-500")}>{s.strength}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-1000", s.trend === "UP" ? "bg-primary" : "bg-red-500")}
                        style={{ width: `${s.strength}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="glass-card bg-primary border-none shadow-xl p-6 text-white overflow-hidden relative group">
              <div className="absolute top-[-20%] right-[-10%] opacity-10 transition-transform group-hover:scale-110 duration-700">
                <Globe size={120} />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Global Insight</h4>
              <p className="text-sm font-bold leading-tight">QuantumF researching 50+ global markets through ChatGPT intelligence...</p>
              <Button size="sm" variant="secondary" className="mt-4 w-full rounded-xl font-black text-[10px] uppercase h-9 bg-white text-primary">
                View Global Report
              </Button>
            </Card>
          </div>

        </div>
      </div>
    </DashboardShell>
  )
}
