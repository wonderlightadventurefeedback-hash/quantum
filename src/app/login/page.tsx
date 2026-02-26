
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth, useUser, useFirestore } from "@/firebase"
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { Sparkles, Loader2, Mail, Lock, User, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
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

  const initializeDemoUser = async (user: any, name: string) => {
    if (!db) return
    const userRef = doc(db, 'users', user.uid)
    const snap = await getDoc(userRef)
    
    // Robust initialization: Set balance to 50,000 if it's a new user or the field is missing
    if (!snap.exists() || snap.data().balance === undefined) {
      const existingData = snap.exists() ? snap.data() : {}
      await setDoc(userRef, {
        id: user.uid,
        email: user.email || '',
        displayName: name || user.displayName || existingData.displayName || 'Demo User',
        balance: 50000,
        learningProgress: existingData.learningProgress ?? 0,
        predictionAccuracy: existingData.predictionAccuracy ?? 0,
        createdAt: existingData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true })
    }
  }

  const handleGoogleSignIn = async () => {
    if (!auth) return
    setIsLoggingIn(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      await initializeDemoUser(result.user, result.user.displayName || '')
      toast({
        title: "Welcome to FinIntel AI Demo",
        description: "Successfully signed in. ₹50,000 demo capital ready.",
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
    if (!auth) return
    
    if (!email || !password) {
      toast({ variant: "destructive", title: "Missing fields" })
      return
    }

    setIsLoggingIn(true)
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        if (displayName) {
          await updateProfile(userCredential.user, { displayName })
        }
        await initializeDemoUser(userCredential.user, displayName)
        toast({
          title: "Demo Account created",
          description: "₹50,000 demo capital has been added to your portfolio.",
        })
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        await initializeDemoUser(userCredential.user, '')
        toast({
          title: "Welcome back",
          description: "Accessing your demo portfolio.",
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

      <div className="w-full max-w-6xl fixed top-8 left-1/2 -translate-x-1/2 flex items-center justify-between px-6 z-20">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="font-headline font-bold text-white text-xl">FI</span>
          </div>
          <span className="font-headline font-bold text-2xl tracking-tight text-foreground hidden sm:block">
            FinIntel AI <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-2">DEMO</span>
          </span>
        </Link>
        <Button variant="outline" className="text-muted-foreground hover:text-foreground hover:bg-muted border-2 rounded-xl gap-2 h-11" asChild>
          <Link href="/"><ArrowLeft className="size-4" /> Back to Home</Link>
        </Button>
      </div>

      <Card className="w-full max-w-[440px] bg-card/40 backdrop-blur-2xl border-border shadow-2xl z-10 overflow-hidden rounded-[2.5rem]">
        <CardHeader className="space-y-3 text-center pt-10 pb-4 px-10">
          <CardTitle className="text-4xl font-headline font-bold text-foreground leading-tight">
            {isSignUp ? "Start Demo" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm max-w-[280px] mx-auto leading-relaxed">
            Join the demo experience and trade risk-free with virtual capital.
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
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
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
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-2xl transition-all shadow-xl shadow-primary/20"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? <Loader2 className="animate-spin size-6" /> : (isSignUp ? "Create Demo Account" : "Sign In")}
            </Button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><Separator className="w-full bg-border/50" /></div>
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
            Continue with Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-6 pb-12 pt-6">
          <button 
            type="button"
            className="text-sm font-bold text-primary hover:underline transition-all"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Already a member? Sign in" : "New to FinIntel? Create demo account"}
          </button>
        </CardFooter>
      </Card>
    </div>
  )
}
