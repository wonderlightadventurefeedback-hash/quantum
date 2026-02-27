
"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BrainCircuit, Check, ChevronRight, GraduationCap, TrendingUp, Zap, ShieldCheck, Loader2 } from "lucide-react"
import { useUser, useFirestore, updateDocumentNonBlocking } from "@/firebase"
import { doc, serverTimestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"

const QUESTIONS = [
  {
    id: "exp",
    title: "Market Tenure",
    question: "How long have you been trading or investing in global stocks?",
    options: [
      { label: "Absolute Beginner", value: "BEGINNER", score: 1 },
      { label: "Less than 1 Year", value: "NOVICE", score: 2 },
      { label: "1 to 3 Years", value: "INTERMEDIATE", score: 3 },
      { label: "3+ Years Pro", value: "PRO", score: 4 },
    ]
  },
  {
    id: "charts",
    title: "Technical IQ",
    question: "How would you describe your ability to read market charts?",
    options: [
      { label: "I don't understand them yet", value: "BEGINNER", score: 1 },
      { label: "I recognize basic trends", value: "NOVICE", score: 2 },
      { label: "I use RSI, MACD, and EMAs", value: "INTERMEDIATE", score: 3 },
      { label: "I perform complex wave analysis", value: "PRO", score: 4 },
    ]
  },
  {
    id: "risk",
    title: "Risk Profile",
    question: "What is your primary goal for this virtual trading account?",
    options: [
      { label: "Preserve capital & Learn", value: "BEGINNER", score: 1 },
      { label: "Steady portfolio growth", value: "NOVICE", score: 2 },
      { label: "High-frequency speculation", value: "INTERMEDIATE", score: 3 },
      { label: "Aggressive wealth building", value: "PRO", score: 4 },
    ]
  }
]

export function OnboardingQuiz({ open, onComplete }: { open: boolean, onComplete: () => void }) {
  const { user } = useUser()
  const db = useFirestore()
  const [step, setStep] = React.useState(0)
  const [answers, setAnswers] = React.useState<Record<string, string>>({})
  const [isFinishing, setIsFinishing] = React.useState(false)

  const currentQuestion = QUESTIONS[step]
  const progress = ((step + 1) / QUESTIONS.length) * 100

  const handleSelect = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }))
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1)
    } else {
      finishOnboarding()
    }
  }

  const finishOnboarding = async () => {
    if (!db || !user) return
    setIsFinishing(true)

    // Heuristic to calculate level
    const scores = Object.values(answers).map(val => {
      const opt = QUESTIONS.flatMap(q => q.options).find(o => o.value === val)
      return opt?.score || 1
    })
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
    
    let level = "BEGINNER"
    if (avgScore > 3.5) level = "PRO"
    else if (avgScore > 2.5) level = "INTERMEDIATE"
    else if (avgScore > 1.5) level = "NOVICE"

    const userRef = doc(db, 'users', user.uid)
    updateDocumentNonBlocking(userRef, {
      experienceLevel: level,
      onboardingCompleted: true,
      updatedAt: serverTimestamp()
    })

    // Simulate short delay for professional feel
    setTimeout(() => {
      setIsFinishing(false)
      onComplete()
    }, 1500)
  }

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl bg-card border-border/50 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
        <div className="bg-primary/5 border-b border-border/50 p-10 flex items-center justify-between">
          <div className="space-y-1">
            <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black uppercase tracking-widest px-3 py-1">
              QuantumF Terminal Setup
            </Badge>
            <DialogTitle className="text-3xl font-headline font-bold">Experience Assessment</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              We tailor your research engine based on your market history.
            </DialogDescription>
          </div>
          <div className="size-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <BrainCircuit className="size-8 text-white" />
          </div>
        </div>

        <div className="p-10 space-y-10">
          {isFinishing ? (
            <div className="py-20 text-center space-y-6 animate-in fade-in zoom-in-95">
              <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="size-10 text-primary animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-headline font-bold">Calibrating Terminal</h3>
                <p className="text-muted-foreground text-sm">Synthesizing your experience level with our ChatGPT research layer...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <Zap className="size-3 fill-primary" /> Step {step + 1} of {QUESTIONS.length}
                  </h4>
                  <span className="text-xs font-bold text-muted-foreground">{currentQuestion.title}</span>
                </div>
                <Progress value={progress} className="h-2 bg-muted/50" />
                <h3 className="text-2xl font-bold leading-snug">{currentQuestion.question}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className="flex flex-col items-start p-6 rounded-2xl bg-muted/20 border-2 border-transparent hover:border-primary/50 hover:bg-primary/5 transition-all group text-left"
                  >
                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{opt.label}</span>
                    <span className="text-[10px] font-black uppercase text-muted-foreground mt-1 group-hover:text-primary/70">Select Choice</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-muted/10 p-6 px-10 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ShieldCheck className="size-4 text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">QuantumF Verified Security</span>
          </div>
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">Research Layer Active</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
