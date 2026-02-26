
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
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden py-12 px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/50 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />

      {/* Top Left Branding */}
      <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <span className="font-headline font-bold text-white text-xl">FI</span>
        </div>
        <span className="font-headline font-bold text-2xl tracking-tight text-primary">
          FinIntel AI
        </span>
      </div>

      {/* Back Button */}
      <div className="absolute top-8 right-8 z-10">
        <Button 
          variant="ghost" 
          className="text-muted-foreground hover:text-foreground hover:bg-muted gap-2"
          asChild
        >
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <Card className="w-full max-w-md bg-card/40 backdrop-blur-xl border-border shadow-2xl z-10 overflow-hidden">
        <CardHeader className="space-y-2 text-center pb-2">
          <CardTitle className="text-3xl font-headline font-bold text-foreground">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm max-w-[280px] mx-auto leading-relaxed">
            {isSignUp 
              ? "Join 10,000+ smart investors today." 
              : "Sign in to access your AI-powered portfolio and market intel."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input 
                    id="displayName"
                    placeholder="John Doe"
                    autoComplete="name"
                    className="pl-10 h-12 bg-muted/30 border-border text-foreground focus-visible:ring-primary/50"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isLoggingIn}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="pl-10 h-12 bg-muted/30 border-border text-foreground focus-visible:ring-primary/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoggingIn}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className="pl-10 h-12 bg-muted/30 border-border text-foreground focus-visible:ring-primary/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoggingIn}
                  required
                />
              </div>
            </div>
            <Button 
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/10"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? <Loader2 className="animate-spin size-5" /> : (isSignUp ? "Create Account" : "Sign In")}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full bg-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-bold">Or continue with</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            type="button"
            className="w-full h-12 gap-3 border-border bg-transparent text-foreground hover:bg-muted transition-all rounded-xl" 
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
            Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pb-8">
          <button 
            type="button"
            className="text-sm text-primary hover:underline font-medium"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
          <div className="text-[10px] text-muted-foreground flex items-center gap-2">
            <Sparkles className="size-3 text-primary" />
            Your financial intelligence hub.
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
