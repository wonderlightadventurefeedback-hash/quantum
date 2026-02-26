
"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Search, 
  TrendingUp, 
  ShieldCheck,
  Globe,
  LayoutDashboard,
  ChevronDown,
  Moon,
  Sun
} from "lucide-react"
import { useUser } from "@/firebase"
import { MOCK_INDICES } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"

export default function LandingPage() {
  const { user, loading } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  const [theme, setTheme] = React.useState<"light" | "dark">("light")

  React.useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "dark" : "light")
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
      localStorage.theme = "dark"
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.theme = "light"
    }
    toast({
      title: `${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} Mode Enabled`,
      description: `Interface updated to ${newTheme} aesthetic.`,
    })
  }

  if (loading || user) return null

  return (
    <div className="min-h-screen bg-background text-foreground font-body selection:bg-primary/30">
      {/* Top Navigation Bar - Groww Style */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="font-headline font-bold text-white text-lg">FI</span>
              </div>
              <span className="font-headline font-bold text-2xl tracking-tight text-foreground">
                FinIntel
              </span>
            </Link>
            
            <nav className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-muted-foreground">
              <Link href="/dashboard" className="hover:text-primary transition-colors">Stocks</Link>
              <Link href="/predict" className="hover:text-primary transition-colors">F&O</Link>
              <Link href="/learn" className="hover:text-primary transition-colors">Mutual Funds</Link>
              <button className="flex items-center gap-1 hover:text-primary transition-colors">
                More <ChevronDown size={14} />
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-md mx-8 hidden md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                placeholder="Search FinIntel..." 
                className="w-full pl-10 h-10 bg-muted/50 border-none rounded-md focus-visible:ring-1 focus-visible:ring-primary/20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold border border-border px-1 rounded">
                Ctrl+K
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-primary">
              {theme === "light" ? <Moon className="size-5" /> : <Sun className="size-5" />}
            </Button>
            <Link href="/login">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 h-10 rounded-md">
                Login/Sign up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Market Ticker */}
      <div className="pt-20 bg-background border-b border-border h-12 flex items-center overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...MOCK_INDICES, ...MOCK_INDICES, ...MOCK_INDICES].map((index, i) => (
            <div key={i} className="flex items-center gap-2 px-6">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{index.name}</span>
              <span className="text-[11px] font-bold text-foreground">{index.value}</span>
              <span className={`text-[11px] font-bold ${index.trend === 'UP' ? 'text-primary' : 'text-destructive'}`}>
                {index.percent}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-background overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-6xl md:text-8xl font-headline font-bold text-foreground mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            Grow your wealth
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Trusted by millions of users. The simple way to invest in stocks, mutual funds and more.
          </p>
          <Link href="/login">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-12 h-16 rounded-full shadow-lg shadow-primary/20">
              Get started
            </Button>
          </Link>

          <div className="mt-16 max-w-5xl mx-auto relative h-[400px] md:h-[500px] animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <img 
              src="https://picsum.photos/seed/financial-infrastructure/1200/800" 
              alt="Financial Ecosystem" 
              className="w-full h-full object-contain opacity-90 dark:invert-[0.05]"
              data-ai-hint="isometric finance"
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6 text-left">
              <h2 className="text-4xl font-headline font-bold text-foreground">
                Invest everywhere, <span className="text-primary">anytime.</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Stay on top of the markets with our real-time tracking, AI-powered predictions, and personalized news sentiment analysis. Whether you are at home or on the go, FinIntel keeps you ahead of the curve.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6">
                <div className="p-6 bg-card rounded-2xl shadow-sm border border-border">
                  <TrendingUp className="size-8 text-primary mb-4" />
                  <h3 className="font-bold text-lg mb-2 text-foreground">AI Insights</h3>
                  <p className="text-sm text-muted-foreground">Get predictive analysis on market trends before they happen with our advanced GenAI models.</p>
                </div>
                <div className="p-6 bg-card rounded-2xl shadow-sm border border-border">
                  <ShieldCheck className="size-8 text-primary mb-4" />
                  <h3 className="font-bold text-lg mb-2 text-foreground">Safe & Secure</h3>
                  <p className="text-sm text-muted-foreground">Your data and investments are protected by bank-grade encryption and Firebase security.</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full" />
              <img 
                src="https://picsum.photos/seed/app-interface/800/800" 
                alt="Mobile App" 
                className="relative rounded-3xl w-full h-auto shadow-xl border border-border"
                data-ai-hint="mobile app"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto rounded-[2rem] border border-border shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="bg-primary p-12 text-primary-foreground flex flex-col justify-between">
                <div>
                  <h2 className="text-3xl font-headline font-bold mb-4">Contact us</h2>
                  <p className="opacity-80">Our support team is available 24/7 to help you with any queries about your trading account.</p>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="flex items-center gap-3">
                    <Globe size={18} />
                    <span className="text-sm font-medium">support@finintel.ai</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <LayoutDashboard size={18} />
                    <span className="text-sm font-medium">Headquarters: Mumbai, India</span>
                  </div>
                </div>
              </div>
              <div className="p-12 bg-card">
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <Input placeholder="Your Name" className="h-12 border-border bg-muted/50" />
                  <Input placeholder="Email Address" type="email" className="h-12 border-border bg-muted/50" />
                  <Textarea placeholder="How can we help you?" className="min-h-[120px] border-border bg-muted/50" />
                  <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                    Send message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <span className="font-headline font-bold text-white text-[10px]">FI</span>
              </div>
              <span className="font-headline font-bold text-xl text-foreground">FinIntel</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground font-medium">
              <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-primary transition-colors">Help Center</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 FinIntel AI. All rights reserved. Built for professional traders.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
