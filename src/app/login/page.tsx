
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth, useUser } from "@/firebase"
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth"
import { Sparkles, Loader2, Mail, Lock, User, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
  const router = useRouter()
  const auth = useAuth()
  const { user, loading } = useUser()
  const { toast } = useToast()
  
  const [isLoggingIn, setIsLoggingIn] = React.useState(false)
  const [isSignUp, setIsSignUp] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [displayName, setDisplayName] = React.useState("")

  React.useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleGoogleSignIn = async () => {
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Firebase Auth is not initialized. Please check your configuration.",
      })
      return
    }
    setIsLoggingIn(true)
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      toast({
        title: "Welcome to FinIntel AI",
        description: "Successfully signed in with Google.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message || "Something went wrong. Please try again.",
      })
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Firebase Auth is not initialized. Please check your configuration.",
      })
      return
    }
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all required fields.",
      })
      return
    }

    setIsLoggingIn(true)
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        if (displayName) {
          await updateProfile(userCredential.user, { displayName })
        }
        toast({
          title: "Account created",
          description: "Your FinIntel AI account is ready.",
        })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
        toast({
          title: "Welcome back",
          description: "Successfully signed in.",
        })
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: isSignUp ? "Sign up failed" : "Sign in failed",
        description: error.message || "Authentication error occurred.",
      })
    } finally {
      setIsLoggingIn(false)
    }
  }

  if (loading || user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin size-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden py-12 px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/50 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />

      {/* Standardized Header Navigation for Login */}
      <div className="w-full max-w-6xl fixed top-8 left-1/2 -translate-x-1/2 flex items-center justify-between px-6 z-20">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="font-headline font-bold text-white text-xl">FI</span>
          </div>
          <span className="font-headline font-bold text-2xl tracking-tight text-foreground hidden sm:block">
            FinIntel AI
          </span>
        </Link>
        <Button 
          variant="outline" 
          className="text-muted-foreground hover:text-foreground hover:bg-muted border-2 rounded-xl gap-2 h-11"
          asChild
        >
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <Card className="w-full max-w-[440px] bg-card/40 backdrop-blur-2xl border-border shadow-2xl z-10 overflow-hidden rounded-[2.5rem]">
        <CardHeader className="space-y-3 text-center pt-10 pb-4 px-10">
          <CardTitle className="text-4xl font-headline font-bold text-foreground leading-tight">
            {isSignUp ? "Join FinIntel" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm max-w-[280px] mx-auto leading-relaxed">
            {isSignUp 
              ? "Start your journey to financial intelligence today." 
              : "Login to access your personalized market insights."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-10 pt-4">
          <form onSubmit={handleEmailAuth} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.1em] ml-1">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input 
                    id="displayName"
                    placeholder="Enter your name"
                    autoComplete="name"
                    className="pl-12 h-14 bg-muted/40 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/40 transition-all"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isLoggingIn}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.1em] ml-1">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="pl-12 h-14 bg-muted/40 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/40 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoggingIn}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label htmlFor="password" className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.1em]">Password</Label>
                {!isSignUp && (
                  <button type="button" className="text-[10px] font-bold text-primary hover:underline">Forgot?</button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className="pl-12 h-14 bg-muted/40 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/40 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoggingIn}
                  required
                />
              </div>
            </div>
            <Button 
              type="submit"
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-2xl transition-all shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? <Loader2 className="animate-spin size-6" /> : (isSignUp ? "Create Account" : "Sign In")}
            </Button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full bg-border/50" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-transparent px-4 text-muted-foreground">Or with</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            type="button"
            className="w-full h-14 gap-4 border-2 bg-transparent text-foreground hover:bg-muted/50 transition-all rounded-2xl font-bold" 
            onClick={handleGoogleSignIn}
            disabled={isLoggingIn}
          >
            <svg className="size-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-6 pb-12 pt-6">
          <button 
            type="button"
            className="text-sm font-bold text-primary hover:underline transition-all"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Already a member? Sign in" : "New to FinIntel? Create account"}
          </button>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">
            <Sparkles className="size-3 text-primary" />
            Empowering Your Wealth
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
