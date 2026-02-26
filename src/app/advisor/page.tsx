
"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Sparkles, Loader2, Zap, Clock } from "lucide-react"
import { aiFinancialStrategyAdvisor } from "@/ai/flows/ai-financial-strategy-advisor"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, doc, query, orderBy, limit, serverTimestamp, getDocs } from "firebase/firestore"
import { MOCK_USER } from "@/lib/mock-data"
import { formatDistanceToNow } from "date-fns"

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp?: any
}

export default function AdvisorPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Fetch real user data for context
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

  // Persistent Chat Logic
  const messagesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, 'users', user.uid, 'chat_messages'), orderBy('timestamp', 'asc'))
  }, [db, user])
  const { data: history, isLoading: isHistoryLoading } = useCollection(messagesQuery)

  React.useEffect(() => {
    if (history && history.length > 0) {
      setMessages(history.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp })))
    } else if (history && history.length === 0 && !isHistoryLoading) {
      setMessages([
        { role: 'assistant', content: "Hello! I'm **FinIntel AI**, your expert financial advisor connected directly to OpenAI through ChatGPT. I have access to live market feeds and your portfolio to give you the best stock and finance answers. How can I help you today?" }
      ])
    }
  }, [history, isHistoryLoading])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !db || !user) return

    const userMsg = input.trim()
    setInput("")
    
    // Optimistic Update & Save to Firestore
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
        predictionHistory: "User transaction logs available in activity collection.",
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
        content: "I'm having trouble connecting to my intelligence layer. Please check your configuration.",
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
    "Review my current holdings",
    "Live price of NVIDIA?",
    "Analyze Tesla's company profile",
    "Latest market news headlines",
    "Should I diversify further?"
  ]

  return (
    <DashboardShell>
      <div className="h-[calc(100vh-12rem)] flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-headline font-bold">FinIntel Advisor</h1>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
                <Zap className="size-3 fill-primary animate-pulse" /> Ollama Active
              </span>
            </div>
            <p className="text-muted-foreground text-sm">Powered by OpenAI ChatGPT and Finnhub Real-Time API.</p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium">Synced with Portfolio</span>
          </div>
        </div>

        <Card className="flex-1 glass-card overflow-hidden flex flex-col border-none shadow-2xl">
          <ScrollArea className="flex-1 p-6 lg:p-10">
            <div className="space-y-8 max-w-4xl mx-auto">
              {isHistoryLoading && messages.length === 0 ? (
                <div className="h-full flex items-center justify-center py-20">
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>
              ) : messages.map((msg, i) => (
                <div key={i} className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Avatar className={`size-12 border-2 shrink-0 ${msg.role === 'assistant' ? 'border-primary/20 shadow-lg shadow-primary/5' : 'border-muted'}`}>
                    {msg.role === 'assistant' ? (
                      <AvatarImage src="/bot-avatar.png" className="bg-primary/5" />
                    ) : (
                      <AvatarImage src={user?.photoURL || MOCK_USER.avatar} />
                    )}
                    <AvatarFallback className={msg.role === 'assistant' ? 'bg-primary' : 'bg-muted'}>
                      {msg.role === 'assistant' ? <Bot className="text-white size-6" /> : <User className="size-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[85%] rounded-[2rem] px-7 py-5 text-[15px] leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-card border border-border/50 rounded-tl-none prose prose-sm dark:prose-invert max-w-none'
                  }`}>
                    {msg.content.split('\n').map((line, idx) => (
                      <p key={idx} className={idx > 0 ? "mt-2" : ""}>{line}</p>
                    ))}
                    {msg.timestamp && (
                      <div className="mt-3 pt-3 border-t border-current/10 flex items-center gap-1.5 text-[9px] font-black uppercase opacity-50">
                        <Clock className="size-2" />
                        {formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-6">
                  <Avatar className="size-12 border-2 border-primary/20 shrink-0">
                    <AvatarFallback className="bg-primary">
                      <Bot className="text-white size-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-card border border-border/50 rounded-[2rem] rounded-tl-none px-7 py-5 flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="size-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="size-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="size-2 bg-primary rounded-full animate-bounce"></span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">ChatGPT Analyzing Markets...</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Quick Suggestions */}
          <div className="px-10 py-4 border-t border-border/50 flex gap-3 overflow-x-auto no-scrollbar bg-muted/5">
            {suggestions.map((q) => (
              <Button 
                key={q} 
                variant="outline" 
                size="sm" 
                className="shrink-0 rounded-full bg-background border-border/50 hover:border-primary/50 hover:bg-primary/5 text-[11px] font-bold h-9 px-5 transition-all" 
                onClick={() => setInput(q)}
              >
                {q}
              </Button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-10 pt-4 bg-muted/5">
            <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about stock markets or finance..." 
                className="pr-16 h-16 bg-background border-border/50 rounded-2xl focus-visible:ring-primary/40 text-lg shadow-xl shadow-black/5"
              />
              <Button 
                type="submit" 
                size="icon" 
                className="absolute right-3 top-1/2 -translate-y-1/2 size-12 rounded-xl shadow-lg shadow-primary/20"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Send className="size-5" />}
              </Button>
            </form>
            <div className="flex items-center justify-center gap-4 mt-4">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                ChatGPT Intelligence Enabled
              </p>
              <div className="h-3 w-px bg-border" />
              <p className="text-[10px] text-muted-foreground italic">
                Answers all finance questions using Ollama and OpenAI logic.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
}
