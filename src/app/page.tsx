
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
  Sun,
  Mail,
  MapPin,
  Phone
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
    <div className="min-h-screen bg-background text-foreground font-body selection:bg-primary/30 relative">
      {/* Global Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] opacity-60" />
      </div>

      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
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
                placeholder="Search stocks, indices..." 
                className="w-full pl-10 h-11 bg-muted/50 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold border border-border px-1.5 py-0.5 rounded-md">
                Ctrl+K
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-primary rounded-xl">
              {theme === "light" ? <Moon className="size-5" /> : <Sun className="size-5" />}
            </Button>
            <Link href="/login">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 h-11 rounded-xl shadow-lg shadow-primary/10">
                Login/Sign up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Market Ticker */}
      <div className="pt-20 bg-background border-b border-border h-12 flex items-center overflow-hidden relative z-10">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...MOCK_INDICES, ...MOCK_INDICES, ...MOCK_INDICES].map((index, i) => (
            <div key={i} className="flex items-center gap-2 px-8">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{index.name}</span>
              <span className="text-[11px] font-bold text-foreground">{index.value}</span>
              <span className={`text-[11px] font-bold ${index.trend === 'UP' ? 'text-primary' : 'text-destructive'}`}>
                {index.percent}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-48 lg:pt-48 lg:pb-64 bg-transparent overflow-hidden relative z-10">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <div className="inline-block px-4 py-1.5 mb-8 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-4 duration-500">
            Intelligent Investing for Everyone
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-headline font-bold text-foreground mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700">
            Grow your wealth
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Trusted by millions of smart investors. The simplest, most transparent way to invest in stocks, mutual funds, and global indices.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Link href="/login">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-12 h-16 rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                Get started
              </Button>
            </Link>
            <Button variant="outline" className="text-lg px-12 h-16 rounded-2xl border-2 hover:bg-muted/50 transition-all">
              Explore Markets
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 bg-muted/20 relative z-10 border-y border-border/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8 text-left">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-headline font-bold text-foreground leading-tight">
                  Invest everywhere, <span className="text-primary italic">anytime.</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Stay on top of the markets with our real-time tracking, AI-powered predictions, and personalized news sentiment analysis. Whether you are at home or on the go, FinIntel keeps you ahead of the curve.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                <div className="p-8 bg-card/50 backdrop-blur-md rounded-3xl shadow-sm border border-border group hover:border-primary/50 transition-all">
                  <TrendingUp className="size-10 text-primary mb-6 transition-transform group-hover:scale-110" />
                  <h3 className="font-bold text-xl mb-3 text-foreground">AI Insights</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Get predictive analysis on market trends before they happen with our advanced GenAI models.</p>
                </div>
                <div className="p-8 bg-card/50 backdrop-blur-md rounded-3xl shadow-sm border border-border group hover:border-primary/50 transition-all">
                  <ShieldCheck className="size-10 text-primary mb-6 transition-transform group-hover:scale-110" />
                  <h3 className="font-bold text-xl mb-3 text-foreground">Safe & Secure</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Your data and investments are protected by bank-grade encryption and Firebase security.</p>
                </div>
              </div>
            </div>
            <div className="relative lg:ml-auto">
              <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full opacity-50" />
              <div className="relative rounded-[2.5rem] overflow-hidden border border-border shadow-2xl transition-transform hover:scale-[1.02] duration-700">
                <img 
                  src="https://picsum.photos/seed/dashboard-view/800/800" 
                  alt="FinIntel Dashboard Interface" 
                  className="w-full h-auto object-cover"
                  data-ai-hint="dashboard design"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 bg-background relative z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="rounded-[3rem] border border-border shadow-2xl overflow-hidden bg-card/40 backdrop-blur-xl">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="bg-primary p-12 lg:p-16 text-primary-foreground flex flex-col justify-between">
                <div className="space-y-6">
                  <h2 className="text-4xl font-headline font-bold leading-tight">Connect with our<br/>market experts.</h2>
                  <p className="text-lg opacity-80 leading-relaxed max-w-sm">
                    Our support team is available 24/7 to help you with any queries about your trading account or market analysis.
                  </p>
                </div>
                <div className="space-y-6 mt-12">
                  <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="size-10 rounded-full bg-white/10 flex items-center justify-center transition-colors group-hover:bg-white/20">
                      <Mail size={18} />
                    </div>
                    <span className="text-sm font-medium">support@finintel.ai</span>
                  </div>
                  <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="size-10 rounded-full bg-white/10 flex items-center justify-center transition-colors group-hover:bg-white/20">
                      <MapPin size={18} />
                    </div>
                    <span className="text-sm font-medium">Fintech Hub, Mumbai, India</span>
                  </div>
                  <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="size-10 rounded-full bg-white/10 flex items-center justify-center transition-colors group-hover:bg-white/20">
                      <Phone size={18} />
                    </div>
                    <span className="text-sm font-medium">+91 (22) 4000-5000</span>
                  </div>
                </div>
              </div>
              <div className="p-12 lg:p-16 space-y-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-headline font-bold text-foreground">Send a Message</h3>
                  <p className="text-sm text-muted-foreground">We'll get back to you within 24 hours.</p>
                </div>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input placeholder="Your Name" className="h-14 border-border bg-muted/30 rounded-xl focus:ring-primary/20" />
                    <Input placeholder="Email Address" type="email" className="h-14 border-border bg-muted/30 rounded-xl focus:ring-primary/20" />
                  </div>
                  <Input placeholder="Subject" className="h-14 border-border bg-muted/30 rounded-xl focus:ring-primary/20" />
                  <Textarea placeholder="Describe your inquiry..." className="min-h-[160px] border-border bg-muted/30 rounded-xl focus:ring-primary/20 resize-none" />
                  <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-xl shadow-lg shadow-primary/10 transition-all hover:scale-[1.01]">
                    Send message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-muted/30 border-t border-border relative z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex flex-col items-center md:items-start gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <span className="font-headline font-bold text-white text-[11px]">FI</span>
                </div>
                <span className="font-headline font-bold text-2xl text-foreground">FinIntel</span>
              </Link>
              <p className="text-sm text-muted-foreground text-center md:text-left max-w-xs">
                Built with precision for the next generation of professional traders and long-term investors.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-sm text-muted-foreground font-medium">
              <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-primary transition-colors">Risk Disclosure</Link>
              <Link href="#" className="hover:text-primary transition-colors">Careers</Link>
            </div>
            <div className="text-center md:text-right space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                © 2024 FinIntel AI Platform
              </p>
              <div className="flex justify-center md:justify-end gap-4 text-primary">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                  <Globe size={14} />
                </div>
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                  <LayoutDashboard size={14} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
