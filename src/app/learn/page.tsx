
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, CheckCircle2, PlayCircle, Trophy, GraduationCap, Clock, Signal, Loader2 } from "lucide-react"
import { MOCK_LEARNING_MODULES } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"

export default function LearnPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const [activeTab, setActiveTab] = React.useState("All")

  // Real-time progress fetch
  const progressQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, 'users', user.uid, 'lesson_progress')
  }, [db, user])
  const { data: userProgress, isLoading: isProgressLoading } = useCollection(progressQuery)

  const categories = ["All", "Markets", "Trading", "Investing", "Finance"]
  
  const filteredModules = activeTab === "All" 
    ? MOCK_LEARNING_MODULES 
    : MOCK_LEARNING_MODULES.filter(m => m.category === activeTab)

  const getModuleProgress = (moduleId: string, totalLessons: number) => {
    if (!userProgress) return 0
    const completedInModule = userProgress.filter(p => p.moduleId === moduleId && p.status === 'completed').length
    return Math.min(100, Math.round((completedInModule / totalLessons) * 100))
  }

  const overallProgress = React.useMemo(() => {
    if (!userProgress || userProgress.length === 0) return 0
    const totalPossible = MOCK_LEARNING_MODULES.reduce((acc, m) => acc + m.lessons, 0)
    const completed = userProgress.filter(p => p.status === 'completed').length
    return Math.round((completed / totalPossible) * 100)
  }, [userProgress])

  const handleStartModule = (moduleId: string) => {
    router.push(`/learn/${moduleId}`)
  }

  return (
    <DashboardShell>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Hero Banner for Learning */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-primary/10 border border-primary/20 p-8 lg:p-12 animate-in fade-in slide-in-from-top-8 duration-1000">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl text-center md:text-left">
              <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-4 py-1">
                QuantumF Learning Path
              </Badge>
              <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight">
                Level up your <span className="text-primary italic">Wealth IQ.</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Master the world of finance through structured, interactive paths designed by market experts.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-background flex items-center justify-center border border-border">
                    <GraduationCap className="size-4 text-primary" />
                  </div>
                  <span className="text-sm font-bold">{MOCK_LEARNING_MODULES.length} Active Modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-background flex items-center justify-center border border-border">
                    <Trophy className="size-4 text-yellow-500" />
                  </div>
                  <span className="text-sm font-bold">Earn QF Certificates</span>
                </div>
              </div>
            </div>
            
            <Card className="glass-card w-full md:w-72 bg-background/50 border-primary/20 p-6 space-y-4 animate-in fade-in zoom-in-95 delay-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Overall IQ Progress</span>
                <span className="text-primary font-bold">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                You're building your professional financial foundation. Keep going to reach <span className="font-bold text-foreground">Market Pro</span> status.
              </p>
              <Button size="sm" className="w-full text-xs font-bold rounded-xl" onClick={() => router.push('/settings')}>
                View My Credentials
              </Button>
            </Card>
          </div>
        </div>

        {/* Categories Tab */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-left-4 delay-500">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="bg-muted/50 p-1 h-12 rounded-2xl">
              {categories.map((cat) => (
                <TabsTrigger 
                  key={cat} 
                  value={cat}
                  className="px-6 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-sm"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Signal className="size-4 text-primary" />
            <span>Found {filteredModules.length} Expert Modules</span>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredModules.map((module, i) => {
            const progress = getModuleProgress(module.id, module.lessons)
            const isCompleted = progress === 100
            const isStarted = progress > 0

            return (
              <Card 
                key={module.id} 
                className="overflow-hidden glass-card group flex flex-col border-none shadow-xl hover:shadow-primary/5 animate-in fade-in slide-in-from-bottom-8 duration-700"
                style={{ animationDelay: `${200 + (i * 100)}ms` }}
              >
                <div className="relative h-56 w-full overflow-hidden shrink-0">
                  <Image 
                    src={module.image} 
                    alt={module.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    data-ai-hint="finance education"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-black/50 backdrop-blur-md border-white/20 text-white uppercase tracking-tighter text-[10px]">
                      {module.category}
                    </Badge>
                  </div>
                  {isCompleted && (
                    <div className="absolute top-4 right-4 bg-green-500 rounded-full p-1.5 shadow-lg">
                      <CheckCircle2 className="size-4 text-white" />
                    </div>
                  )}
                </div>
                
                <CardContent className="pt-6 flex-1 space-y-4">
                  <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="size-3 text-primary" /> {module.lessons} Lessons
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3 text-primary" /> {module.lessons * 15} Min
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-headline font-bold leading-tight group-hover:text-primary transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {module.description}
                  </p>
                  
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span>Module Completion</span>
                      {isProgressLoading ? <Loader2 className="size-3 animate-spin" /> : <span className="text-primary">{progress}%</span>}
                    </div>
                    <Progress value={progress} className="h-1.5 bg-muted/50" />
                  </div>
                </CardContent>
                
                <CardFooter className="pt-4 border-t border-border/50">
                  <Button 
                    className={cn(
                      "w-full gap-2 rounded-xl font-bold h-11 transition-all",
                      isCompleted ? "bg-muted/50 text-foreground hover:bg-muted" : "shadow-lg shadow-primary/10 hover:scale-[1.02]"
                    )}
                    variant={isCompleted ? "secondary" : "default"}
                    onClick={() => handleStartModule(module.id)}
                  >
                    {isCompleted ? "Review Material" : isStarted ? "Resume Lesson" : "Start Learning"}
                    {!isCompleted && <PlayCircle className="size-4" />}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* Weekly Quiz Card */}
        <Card className="glass-card bg-gradient-to-br from-primary to-emerald-600 text-white border-none overflow-hidden relative p-1 animate-in fade-in slide-in-from-bottom-12 delay-1000">
          <div className="absolute top-[-10%] right-[-5%] p-8 opacity-10 rotate-12">
            <GraduationCap size={280} />
          </div>
          <div className="bg-background/10 backdrop-blur-3xl rounded-[2.3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-6 max-w-lg text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-headline font-bold">Knowledge Arena</h2>
              <p className="text-white/80 text-lg leading-relaxed">
                Test your market intuition from these lessons in our <span className="text-white font-bold underline decoration-white/30 underline-offset-4">Live Prediction Arena</span>. Apply what you've learned to real charts.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <Badge className="bg-white/20 hover:bg-white/30 border-none px-4 py-1.5 text-xs font-bold">Real-Time Data</Badge>
                <Badge className="bg-white/20 hover:bg-white/30 border-none px-4 py-1.5 text-xs font-bold">Demo Capital</Badge>
                <Badge className="bg-white/20 hover:bg-white/30 border-none px-4 py-1.5 text-xs font-bold">Live AI Reviews</Badge>
              </div>
            </div>
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 font-bold text-lg px-10 h-16 rounded-2xl shadow-2xl transition-all hover:scale-105"
              onClick={() => router.push('/predict')}
            >
              Enter Trading Arena
            </Button>
          </div>
        </Card>

      </div>
    </DashboardShell>
  )
}
