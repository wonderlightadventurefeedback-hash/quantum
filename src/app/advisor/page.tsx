"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Sparkles, Loader2, Zap, Clock, Info } from "lucide-react"
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
    return query(collection(db, 'users', user.uid, 'chat_messages'), orderBy('timestamp', 'asc'), limit(50))
  }, [db, user])
  const { data: history, isLoading: isHistoryLoading } = useCollection(messagesQuery)

  React.useEffect(() => {
    if (history && history.length > 0) {
      setMessages(history.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp })))
    } else if (history && history.length === 0 && !isHistoryLoading) {
      setMessages([
        { role: 'assistant', content: "Hello! I am **QuantumF AI**, your direct connection to OpenAI's advanced intelligence. I provide expert strategies for stock markets, crypto, and personal finance. How can I help you optimize your wealth today?" }
      ])
    }
  }, [history, isHistoryLoading])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !db || !user) return

    const userMsg = input.trim()
    setInput("")
    
    // Save User message to Firestore
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
        content: "I'm having difficulty connecting to my ChatGPT intelligence layer right now. Please ensure your configuration is active or try again in a few moments.",
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
    "Analyze Tesla's profile",
    "Market news headlines",
    "Explain Ethereum"
  ]

  return (
    <DashboardShell>
      <div className="h-[calc(100vh-12rem)] flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between px-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-headline font-bold">QuantumF AI Advisor</h1>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
                <Zap className="size-3 fill-primary animate-pulse" /> ChatGPT Core
              </span>
            </div>
            <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
              Directly connected to OpenAI through ChatGPT to provide professional, data-driven answers for all stock market and financial inquiries.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl">
            <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-600">Intelligence Sync: Active</span>
          </div>
        </div>

        <Card className="flex-1 glass-card overflow-hidden flex flex-col border-none shadow-2xl relative">
          <ScrollArea className="flex-1 px-6 py-10 lg:px-12">
            <div className="space-y-10 max-w-5xl mx-auto">
              {isHistoryLoading && messages.length === 0 ? (
                <div className="h-full flex items-center justify-center py-20">
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>
              ) : messages.map((msg, i) => (
                <div key={i} className={cn(
                  "flex gap-6 animate-in fade-in slide-in-from-bottom-2",
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}>
                  <Avatar className={cn(
                    "size-12 border-2 shrink-0 shadow-lg",
                    msg.role === 'assistant' ? 'border-primary/20 bg-primary' : 'border-muted bg-muted'
                  )}>
                    {msg.role === 'assistant' ? (
                      <Bot className="text-white size-6" />
                    ) : (
                      <AvatarImage src={user?.photoURL || MOCK_USER.avatar} />
                    )}
                    <AvatarFallback className="bg-transparent">
                      {msg.role === 'assistant' ? <Bot className="text-white size-6" /> : <User className="size-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "max-w-[80%] rounded-[2.5rem] px-8 py-6 text-[15px] leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-card border border-border/50 rounded-tl-none prose prose-sm dark:prose-invert max-w-none'
                  )}>
                    {msg.content.split('\n').map((line, idx) => (
                      <p key={idx} className={cn(idx > 0 && "mt-2")}>{line}</p>
                    ))}
                    {msg.timestamp && (
                      <div className={cn(
                        "mt-4 pt-4 border-t flex items-center gap-1.5 text-[9px] font-black uppercase opacity-40",
                        msg.role === 'user' ? 'border-primary-foreground/10' : 'border-border'
                      )}>
                        <Clock className="size-2" />
                        {formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-6 animate-pulse">
                  <Avatar className="size-12 border-2 border-primary/20 bg-primary shrink-0 shadow-lg">
                    <Bot className="text-white size-6" />
                  </Avatar>
                  <div className="bg-card border border-border/50 rounded-[2.5rem] rounded-tl-none px-8 py-6 flex items-center gap-4">
                    <div className="flex gap-1.5">
                      <span className="size-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="size-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="size-2 bg-primary rounded-full animate-bounce"></span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">QuantumF Analyzing...</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} className="h-4" />
            </div>
          </ScrollArea>

          {/* Quick Suggestions */}
          <div className="px-12 py-4 border-t border-border/50 flex gap-3 overflow-x-auto no-scrollbar bg-muted/5 backdrop-blur-sm">
            {suggestions.map((q) => (
              <Button 
                key={q} 
                variant="outline" 
                size="sm" 
                className="shrink-0 rounded-full bg-background border-border/50 hover:border-primary/50 hover:bg-primary/5 text-[11px] font-bold h-9 px-6 transition-all" 
                onClick={() => setInput(q)}
              >
                {q}
              </Button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-10 pt-4 bg-muted/10 border-t border-border/50 backdrop-blur-md">
            <form onSubmit={handleSendMessage} className="relative max-w-5xl mx-auto">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about markets, portfolio strategies, or crypto..." 
                className="pr-16 h-16 bg-background border-border/50 rounded-2xl focus-visible:ring-primary/40 text-lg shadow-2xl shadow-black/5"
              />
              <Button 
                type="submit" 
                size="icon" 
                className="absolute right-3 top-1/2 -translate-y-1/2 size-12 rounded-xl shadow-lg shadow-primary/20 transition-transform active:scale-95"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Send className="size-5" />}
              </Button>
            </form>
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <Info className="size-3 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                  Powered by OpenAI ChatGPT
                </p>
              </div>
              <div className="h-3 w-px bg-border" />
              <p className="text-[10px] text-muted-foreground italic font-medium">
                Educational strategies derived from direct OpenAI intelligence.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
}
