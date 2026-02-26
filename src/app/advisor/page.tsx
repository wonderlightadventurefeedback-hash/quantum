
"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Loader2, MessageSquarePlus, Trash2 } from "lucide-react"
import { aiFinancialStrategyAdvisor } from "@/ai/flows/ai-financial-strategy-advisor"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking } from "@/firebase"
import { collection, doc, query, orderBy, limit, serverTimestamp, setDoc, deleteDoc, getDocs, writeBatch } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

const FINNHUB_API_KEY = "d6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110";

type Message = {
  id: string
  sender: 'user' | 'ai'
  content: string
  timestamp: any
}

export default function AdvisorPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isInitializing, setIsInitializing] = React.useState(true)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // 1. Fetch Real User Profile & Progress
  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, 'users', user.uid)
  }, [db, user])
  const { data: userProfile } = useDoc(userProfileRef)

  // 2. Fetch Real Portfolio Holdings
  const holdingsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, 'users', user.uid, 'holdings')
  }, [db, user])
  const { data: holdings } = useCollection(holdingsQuery)

  // 3. Fetch Real Activity/Prediction History
  const activityQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, 'users', user.uid, 'activity'), orderBy('timestamp', 'desc'), limit(10))
  }, [db, user])
  const { data: activity } = useCollection(activityQuery)

  // 4. Persistence: Fetch Chat History
  const chatQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    // Using a simplified single conversation for the demo
    return query(collection(db, 'users', user.uid, 'chat_messages'), orderBy('timestamp', 'asc'))
  }, [db, user])
  const { data: messages, isLoading: messagesLoading } = useCollection<Message>(chatQuery)

  React.useEffect(() => {
    if (!messagesLoading) {
      setIsInitializing(false)
    }
  }, [messagesLoading])

  const fetchLatestNews = async () => {
    try {
      const res = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`)
      if (res.ok) {
        const data = await res.json()
        return data.slice(0, 5).map((n: any) => ({ title: n.headline, summary: n.summary }))
      }
    } catch (e) {}
    return []
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !db || !user) return

    const userMsg = input.trim()
    setInput("")
    setIsLoading(true)

    try {
      // Save User Message to Firestore
      const msgRef = collection(db, 'users', user.uid, 'chat_messages')
      await addDocumentNonBlocking(msgRef, {
        sender: 'user',
        content: userMsg,
        timestamp: serverTimestamp()
      })

      // Fetch dynamic context for the AI
      const news = await fetchLatestNews()
      
      const portfolioData = holdings ? JSON.stringify(holdings.map(h => ({
        symbol: h.symbol,
        qty: h.quantity,
        avgPrice: h.averagePrice
      }))) : "No active holdings."

      const predictionHistory = activity ? JSON.stringify(activity.filter(a => a.type === "ARENA_SPECULATE").map(a => ({
        symbol: a.symbol,
        outcome: a.outcome,
        profit: a.total
      }))) : "No recent arena activity."

      // Call AI Flow with real data
      const aiResponse = await aiFinancialStrategyAdvisor({
        userQuery: userMsg,
        portfolioData,
        predictionHistory,
        newsSentiment: JSON.stringify(news),
        learningProgress: `${userProfile?.learningProgress || 0}% complete.`
      })

      // Save AI Response to Firestore
      await addDocumentNonBlocking(msgRef, {
        sender: 'ai',
        content: aiResponse.response,
        timestamp: serverTimestamp()
      })

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Advisor Error",
        description: "FinIntel AI is currently under heavy load. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = async () => {
    if (!db || !user || !messages) return
    try {
      const batch = writeBatch(db)
      const snaps = await getDocs(collection(db, 'users', user.uid, 'chat_messages'))
      snaps.forEach(d => batch.delete(d.ref))
      await batch.commit()
      toast({ title: "Chat Cleared", description: "History has been wiped from our demo servers." })
    } catch (e) {}
  }

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  return (
    <DashboardShell>
      <div className="h-[calc(100vh-12rem)] flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-headline font-bold">FinIntel AI Advisor</h1>
            <p className="text-muted-foreground">Functional intelligence connected to your real-time portfolio and history.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive h-10 px-4 rounded-xl gap-2" onClick={clearChat}>
              <Trash2 className="size-4" /> Clear Chat
            </Button>
            <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl flex items-center gap-2">
              <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-black text-primary uppercase tracking-widest">System Active</span>
            </div>
          </div>
        </div>

        <Card className="flex-1 glass-card overflow-hidden flex flex-col shadow-2xl border-none">
          <ScrollArea className="flex-1 p-8">
            <div className="space-y-8">
              {/* Welcome Message if empty */}
              {(!messages || messages.length === 0) && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-6 opacity-60">
                  <div className="size-20 rounded-[2rem] bg-primary/10 flex items-center justify-center">
                    <Bot className="size-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">I'm ready to help, {user?.displayName || 'Trader'}.</h3>
                    <p className="text-sm max-w-xs mx-auto">Ask me about your holdings, market trends, or for a review of your risk exposure.</p>
                  </div>
                </div>
              )}

              {messages?.map((msg) => (
                <div key={msg.id} className={`flex gap-5 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                  <Avatar className="size-12 border-2 border-primary/20 shrink-0 shadow-lg">
                    {msg.sender === 'ai' ? (
                      <AvatarImage src="/bot-avatar.png" />
                    ) : (
                      <AvatarImage src={user?.photoURL || "/user-avatar.png"} />
                    )}
                    <AvatarFallback className={msg.sender === 'ai' ? 'bg-primary' : 'bg-muted'}>
                      {msg.sender === 'ai' ? <Bot className="text-white size-6" /> : <User className="size-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[75%] rounded-[2rem] px-7 py-5 text-sm leading-relaxed shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none font-bold' 
                      : 'bg-card/80 border border-border/50 rounded-tl-none text-foreground'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-5">
                  <Avatar className="size-12 border-2 border-primary/20 shrink-0 shadow-lg">
                    <AvatarFallback className="bg-primary">
                      <Bot className="text-white size-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-card/80 border border-border/50 rounded-[2rem] rounded-tl-none px-7 py-5 flex items-center justify-center">
                    <div className="flex gap-1.5">
                      <span className="size-2 bg-primary/40 rounded-full animate-bounce"></span>
                      <span className="size-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="size-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Quick Suggestions */}
          <div className="px-8 py-4 border-t border-border/50 bg-muted/10 flex gap-3 overflow-x-auto no-scrollbar">
            {[
              "Review my demo portfolio", 
              "Should I buy Apple now?", 
              "Explain semiconductor trend", 
              "Check my risk profile",
              "How am I doing in the Arena?"
            ].map((q) => (
              <Button 
                key={q} 
                variant="outline" 
                size="sm" 
                className="shrink-0 rounded-full bg-background border-border/50 text-[10px] font-black uppercase tracking-widest hover:border-primary/50 transition-all" 
                onClick={() => setInput(q)}
              >
                {q}
              </Button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-8 pt-4">
            <form onSubmit={handleSendMessage} className="relative group">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask FinIntel AI anything about the markets..." 
                className="pr-16 h-16 bg-muted/30 border-none rounded-[1.5rem] focus-visible:ring-primary/40 text-base font-medium shadow-inner"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2 size-12 rounded-2xl shadow-xl shadow-primary/20 transition-transform active:scale-95"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Send className="size-5" />}
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground text-center mt-4 font-black uppercase tracking-widest opacity-50">
              Personalized for {user?.displayName || 'User'} • System v2.0 Operational
            </p>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
}
