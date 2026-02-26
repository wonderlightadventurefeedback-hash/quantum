"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react"
import { aiFinancialStrategyAdvisor } from "@/ai/flows/ai-financial-strategy-advisor"
import { MOCK_PORTFOLIO, MOCK_USER, MOCK_NEWS } from "@/lib/mock-data"

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function AdvisorPage() {
  const [messages, setMessages] = React.useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm FinIntel AI, your personal financial strategy advisor. How can I help you optimize your investments today?" }
  ])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsLoading(true)

    try {
      const response = await aiFinancialStrategyAdvisor({
        userQuery: userMsg,
        portfolioData: JSON.stringify(MOCK_PORTFOLIO),
        predictionHistory: "78% accuracy, focus on Tech/EV sectors.",
        newsSentiment: JSON.stringify(MOCK_NEWS),
        learningProgress: `${MOCK_USER.learningProgress}% complete.`
      })
      setMessages(prev => [...prev, { role: 'assistant', content: response.response }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment." }])
    } finally {
      setIsLoading(false)
    }
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
            <h1 className="text-3xl font-headline font-bold">AI Financial Advisor</h1>
            <p className="text-muted-foreground">Contextual advice based on your real-time portfolio and history.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium">FinIntel AI Online</span>
          </div>
        </div>

        <Card className="flex-1 glass-card overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Avatar className="size-10 border-2 border-primary/20 shrink-0">
                    {msg.role === 'assistant' ? (
                      <AvatarImage src="/bot-avatar.png" />
                    ) : (
                      <AvatarImage src={MOCK_USER.avatar} />
                    )}
                    <AvatarFallback className={msg.role === 'assistant' ? 'bg-primary' : 'bg-muted'}>
                      {msg.role === 'assistant' ? <Bot className="text-white size-5" /> : <User className="size-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[80%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-muted/50 border border-border rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4">
                  <Avatar className="size-10 border-2 border-primary/20 shrink-0">
                    <AvatarFallback className="bg-primary">
                      <Bot className="text-white size-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted/50 border border-border rounded-2xl rounded-tl-none px-5 py-4">
                    <div className="flex gap-1">
                      <span className="size-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                      <span className="size-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="size-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Quick Suggestions */}
          <div className="px-6 py-3 border-t border-border flex gap-2 overflow-x-auto custom-scrollbar no-scrollbar">
            {["Should I buy Apple now?", "Review my risk exposure", "Analyze tech sentiment", "How's my learning progress?"].map((q) => (
              <Button key={q} variant="outline" size="sm" className="shrink-0 rounded-full bg-muted/30 text-xs" onClick={() => setInput(q)}>
                {q}
              </Button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-6 pt-2">
            <form onSubmit={handleSendMessage} className="relative">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about the markets..." 
                className="pr-12 h-14 bg-muted/30 border-none rounded-2xl focus-visible:ring-primary/40"
              />
              <Button 
                type="submit" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Send className="size-4" />}
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground text-center mt-3">
              FinIntel AI provides educational analysis and should not be considered professional financial advice.
            </p>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
}