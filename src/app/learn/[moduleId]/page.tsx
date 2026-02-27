
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  PlayCircle, 
  CheckCircle2, 
  Lock, 
  BookOpen, 
  ChevronRight, 
  Zap,
  Loader2,
  Trophy,
  BrainCircuit
} from "lucide-react"
import { MOCK_LEARNING_MODULES } from "@/lib/mock-data"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase"
import { doc, serverTimestamp, collection } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function ModuleWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  const moduleId = params?.moduleId as string

  const module = MOCK_LEARNING_MODULES.find(m => m.id === moduleId) || MOCK_LEARNING_MODULES[0]
  
  // Real-time progress fetch
  const progressRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, 'users', user.uid, 'lesson_progress')
  }, [db, user])
  const { data: progressList, isLoading: isProgressLoading } = useCollection(progressRef)

  const [activeLessonIndex, setActiveLessonIndex] = React.useState(0)
  const [isCompleting, setIsCompleting] = React.useState(false)

  const lessons = React.useMemo(() => {
    return Array.from({ length: module.lessons }, (_, i) => ({
      id: `lesson-${i + 1}`,
      title: `Lesson ${i + 1}: ${i === 0 ? "Fundamentals" : i === 1 ? "Advanced Concepts" : "Market Mechanics"}`,
      content: "Detailed educational content about financial markets and strategies. This section provides the core knowledge required to master this specific module. Research shows that consistent practice and active recall are key to long-term retention of financial concepts.",
      isLocked: i > 0 && !(progressList?.find(p => p.lessonId === `lesson-${i}` && p.moduleId === moduleId)?.status === 'completed')
    }))
  }, [module.lessons, progressList, moduleId])

  const currentLesson = lessons[activeLessonIndex]
  const isCompleted = progressList?.some(p => p.lessonId === currentLesson.id && p.moduleId === moduleId && p.status === 'completed')

  const handleCompleteLesson = async () => {
    if (!db || !user || isCompleting) return
    setIsCompleting(true)

    const lessonProgressRef = doc(db, 'users', user.uid, 'lesson_progress', `${moduleId}_${currentLesson.id}`)
    
    try {
      setDocumentNonBlocking(lessonProgressRef, {
        moduleId,
        lessonId: currentLesson.id,
        status: 'completed',
        completedAt: serverTimestamp(),
        userId: user.uid
      }, { merge: true })

      toast({
        title: "Lesson Complete!",
        description: "Your progress has been synced to your professional profile.",
      })

      if (activeLessonIndex < lessons.length - 1) {
        setActiveLessonIndex(prev => prev + 1)
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" })
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push('/learn')}>
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-headline font-bold">{module.title}</h1>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{module.category}</Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-1">{module.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-muted/30 px-6 py-2.5 rounded-2xl border border-border/50">
            <div className="text-right mr-4 border-r border-border/50 pr-4">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Workspace Progress</div>
              <div className="text-xl font-bold text-primary">
                {Math.round((progressList?.filter(p => p.moduleId === moduleId && p.status === 'completed').length || 0) / module.lessons * 100)}%
              </div>
            </div>
            <Zap className="size-5 text-primary animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Lessons Navigation */}
          <Card className="lg:col-span-1 glass-card border-none shadow-xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-muted/10 border-b border-border/50 px-8 py-6">
              <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
                <BookOpen className="size-5 text-primary" /> Learning Path
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/30">
                {lessons.map((lesson, idx) => {
                  const lessonCompleted = progressList?.some(p => p.lessonId === lesson.id && p.moduleId === moduleId && p.status === 'completed')
                  return (
                    <button
                      key={lesson.id}
                      disabled={lesson.isLocked && !lessonCompleted}
                      onClick={() => setActiveLessonIndex(idx)}
                      className={cn(
                        "w-full flex items-center justify-between p-6 px-8 text-left transition-all group",
                        activeLessonIndex === idx ? "bg-primary/5 border-l-4 border-primary" : "hover:bg-muted/10",
                        lesson.isLocked && !lessonCompleted && "opacity-50 grayscale cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "size-10 rounded-xl flex items-center justify-center font-bold text-xs transition-colors",
                          activeLessonIndex === idx ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
                        )}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-sm font-bold truncate max-w-[180px]">{lesson.title}</div>
                          <div className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">
                            {lessonCompleted ? "Completed" : lesson.isLocked ? "Locked" : "Next Up"}
                          </div>
                        </div>
                      </div>
                      {lessonCompleted ? (
                        <CheckCircle2 className="size-5 text-primary" />
                      ) : lesson.isLocked ? (
                        <Lock className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Active Workspace */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card border-none shadow-2xl rounded-[2.5rem] overflow-hidden min-h-[500px] flex flex-col">
              <div className="relative h-48 w-full bg-primary overflow-hidden">
                <Image 
                  src={module.image} 
                  alt="Lesson Header" 
                  fill 
                  className="object-cover opacity-40 grayscale-[50%]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <div className="absolute bottom-8 left-10">
                  <Badge className="bg-primary text-white border-none mb-2">Lesson {activeLessonIndex + 1}</Badge>
                  <h2 className="text-3xl font-headline font-bold text-white">{currentLesson.title}</h2>
                </div>
              </div>
              
              <CardContent className="p-10 flex-1 space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-[0.2em]">
                    <Zap className="size-3 fill-primary" /> Core Learning Material
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed text-lg">
                    {currentLesson.content}
                    <br /><br />
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-start gap-4">
                  <BrainCircuit className="size-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-sm">Pro Strategic Insight</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Mastering the fundamentals of {module.title} is essential before moving to technical execution. Ensure you understand the underlying market drivers.
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-10 pt-0">
                {isCompleted ? (
                  <Button className="w-full h-14 rounded-2xl bg-muted text-foreground hover:bg-muted/80 font-bold text-lg gap-2" disabled>
                    <CheckCircle2 className="size-5 text-primary" /> Lesson Completed
                  </Button>
                ) : (
                  <Button 
                    className="w-full h-14 rounded-2xl font-bold text-lg gap-2 shadow-xl shadow-primary/20 hover:scale-[1.01]" 
                    onClick={handleCompleteLesson}
                    disabled={isCompleting}
                  >
                    {isCompleting ? <Loader2 className="animate-spin" /> : <><Trophy className="size-5" /> Complete & Continue</>}
                  </Button>
                )}
              </CardFooter>
            </Card>

            <div className="grid grid-cols-2 gap-6">
              <Card className="glass-card border-none p-6 text-center group cursor-pointer hover:border-primary/30 transition-all" onClick={() => router.push('/predict')}>
                <Zap className="size-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-sm">Practice in Arena</h4>
                <p className="text-[10px] text-muted-foreground uppercase mt-1">Live Demo Trading</p>
              </Card>
              <Card className="glass-card border-none p-6 text-center group cursor-pointer hover:border-primary/30 transition-all" onClick={() => router.push('/advisor')}>
                <BrainCircuit className="size-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-sm">Ask AI Advisor</h4>
                <p className="text-[10px] text-muted-foreground uppercase mt-1">Clarify Concepts</p>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </DashboardShell>
  )
}
