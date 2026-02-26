"use client"

import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CheckCircle2, PlayCircle, Trophy } from "lucide-react"
import { MOCK_LEARNING_MODULES } from "@/lib/mock-data"
import Image from "next/image"

export default function LearnPage() {
  return (
    <DashboardShell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">Financial Learning Path</h1>
            <p className="text-muted-foreground">Master the markets with our structured AI-driven curriculum.</p>
          </div>
          <Card className="glass-card px-6 py-3 border-primary/20 bg-primary/5 flex items-center gap-4">
            <Trophy className="size-6 text-primary" />
            <div>
              <div className="text-sm font-medium">Global Rank</div>
              <div className="text-xl font-bold">#1,240</div>
            </div>
          </Card>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MOCK_LEARNING_MODULES.map((module) => {
            const progress = (module.completed / module.lessons) * 100
            const isCompleted = progress === 100
            const isStarted = progress > 0

            return (
              <Card key={module.id} className="overflow-hidden glass-card group">
                <div className="relative h-48 w-full overflow-hidden">
                  <Image 
                    src={module.image} 
                    alt={module.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    data-ai-hint="finance education"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div>
                      <Badge className="mb-2 bg-primary/20 backdrop-blur-md border-primary/30">
                        {module.lessons} Lessons
                      </Badge>
                      <h3 className="text-xl font-headline font-bold text-white">{module.title}</h3>
                    </div>
                    {isCompleted && (
                      <CheckCircle2 className="size-8 text-green-400" />
                    )}
                  </div>
                </div>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
                    {module.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Module Progress</span>
                      <span className="font-bold">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button className="w-full gap-2" variant={isCompleted ? "outline" : "default"}>
                    {isCompleted ? "Review Material" : isStarted ? "Continue Learning" : "Start Module"}
                    {!isCompleted && <PlayCircle className="size-4" />}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* Quiz Prompt */}
        <Card className="glass-card bg-primary text-primary-foreground border-none overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <BookOpen size={180} />
          </div>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Weekly Knowledge Quiz</CardTitle>
            <CardDescription className="text-primary-foreground/70">
              Test your knowledge from this week's lessons and earn 500 FI Points.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 rounded-lg px-4 py-2 text-sm font-medium">15 Questions</div>
              <div className="bg-white/10 rounded-lg px-4 py-2 text-sm font-medium">Difficulty: Intermediate</div>
              <div className="bg-white/10 rounded-lg px-4 py-2 text-sm font-medium">Topics: Risk, Stocks</div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" className="font-bold text-primary">Take Quiz Now</Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardShell>
  )
}