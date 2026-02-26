
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth, useUser } from "@/firebase"
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { LogIn, Sparkles, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const auth = useAuth()
  const { user, loading } = useUser()
  const { toast } = useToast()
  const [isLoggingIn, setIsLoggingIn] = React.useState(false)

  React.useEffect(() => {
    if (user && !loading) {
      router.push('/')
    }
  }, [user, loading, router])

  const handleGoogleSignIn = async () => {
    if (!auth) return
    setIsLoggingIn(true)
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      toast({
        title: "Welcome to FinIntel AI",
        description: "Successfully signed in with Google.",
      })
      router.push('/')
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

  if (loading || user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin size-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background p-4">
      <div className="absolute top-8 left-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <span className="font-headline font-bold text-white text-xl">FI</span>
        </div>
        <span className="font-headline font-bold text-2xl tracking-tight text-primary">
          FinIntel AI
        </span>
      </div>

      <Card className="w-full max-w-md glass-card border-primary/20 bg-card/40 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-headline font-bold">Welcome Back</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to access your AI-powered portfolio and market intel.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-4">
          <Button 
            variant="outline" 
            className="h-14 gap-3 text-lg font-medium border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all" 
            onClick={handleGoogleSignIn}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <Loader2 className="animate-spin size-5" />
            ) : (
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
            )}
            Sign in with Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pb-8">
          <div className="text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="size-3 text-primary" />
            Join 10,000+ smart investors today.
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
