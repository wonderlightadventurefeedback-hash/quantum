
"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { 
  Search,
  Bell,
  Settings,
  Zap,
  Moon,
  Sun,
  LogOut,
  TrendingUp,
  TrendingDown,
  Loader2,
  LayoutDashboard,
  BookOpen,
  Newspaper,
  PieChart,
  Bot,
  User,
  Bookmark
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MOCK_USER, MOCK_NEWS } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { signOut } from "firebase/auth"
import { doc } from "firebase/firestore"
import { StaggeredMenu } from "./staggered-menu"

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Watchlist", href: "/watchlist", icon: Bookmark },
  { name: "Trade", href: "/trade", icon: TrendingUp },
  { name: "Learn", href: "/learn", icon: BookOpen },
  { name: "Prediction Arena", href: "/predict", icon: Zap },
  { name: "News Intel", href: "/news", icon: Newspaper },
  { name: "Portfolio Analyzer", href: "/portfolio", icon: PieChart },
  { name: "AI Advisor", href: "/advisor", icon: Bot },
  { name: "Account", href: "/settings", icon: User },
]

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { user, loading } = useUser()
  const { toast } = useToast()
  
  const [theme, setTheme] = React.useState<"light" | "dark">("dark")
  const [isHeaderVisible, setIsHeaderVisible] = React.useState(true)
  const [globalSearch, setGlobalSearch] = React.useState("")
  
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const lastScrollY = React.useRef(0)

  // Real-time Balance fetch for header
  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, 'users', user.uid)
  }, [db, user])

  const { data: userProfile } = useDoc(userProfileRef)
  
  // Guarantee balance logic: If fetched value is negative or undefined, default to 50,000 for display safety
  const rawBalance = userProfile?.balance
  const balance = typeof rawBalance === 'number' && rawBalance >= 0 ? rawBalance : 50000

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "dark" : "light")
  }, [])

  React.useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const currentScrollY = container.scrollTop
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsHeaderVisible(false)
      } else if (currentScrollY < lastScrollY.current) {
        setIsHeaderVisible(true)
      }
      lastScrollY.current = currentScrollY
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
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
  }

  const handleLogout = async () => {
    if (!auth) return
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error: any) {
      toast({ variant: "destructive", title: "Logout failed", description: error.message })
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (globalSearch.trim()) {
      router.push(`/trade?q=${encodeURIComponent(globalSearch.trim())}`)
      setGlobalSearch("")
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center animate-pulse">
          <span className="font-headline font-bold text-white text-xl">FI</span>
        </div>
        <Loader2 className="animate-spin size-6 text-primary/60" />
      </div>
    )
  }

  if (!user) return null

  const staggeredItems = navItems.map(item => ({
    label: item.name,
    ariaLabel: item.name,
    link: item.href,
    icon: item.icon
  }))

  const socialItems = [
    { label: "Twitter", link: "https://twitter.com" },
    { label: "LinkedIn", link: "https://linkedin.com" },
    { label: "Support", link: "/contact" }
  ]

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <StaggeredMenu 
        position="left"
        items={staggeredItems}
        socialItems={socialItems}
        colors={['hsl(var(--background))', 'hsl(var(--primary))']}
        accentColor="hsl(var(--primary))"
        menuButtonColor="#ffffff"
        openMenuButtonColor="#000000"
        isFixed={true}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar bg-background text-foreground">
          <div className={cn(
            "sticky top-0 z-40 transition-all duration-500 ease-in-out transform",
            isHeaderVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
          )}>
            <header className="h-20 border-b border-border bg-background/95 backdrop-blur-md flex items-center justify-between px-8 pl-44">
              <div className="flex items-center gap-6">
                <form onSubmit={handleSearchSubmit} className="relative w-64 md:w-96 hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input 
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Search stocks (e.g. NVDA, AAPL)..." 
                    className="pl-10 bg-muted/50 border-none focus-visible:ring-primary/50 rounded-xl" 
                  />
                </form>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mr-4 gap-3 shadow-sm">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-r border-primary/20 pr-3">Demo Account</span>
                  <span className="text-sm font-black text-primary tracking-tight">₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-primary">
                  {theme === "light" ? <Moon className="size-5" /> : <Sun className="size-5" />}
                </Button>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground">
                  <Bell className="size-5" />
                  <span className="absolute top-2.5 right-2.5 size-2 bg-primary rounded-full ring-2 ring-background"></span>
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => router.push('/watchlist')}>
                  <Bookmark className="size-5" />
                </Button>
                <div className="h-8 w-px bg-border mx-2" />
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 p-2 h-auto hover:bg-muted rounded-xl"
                  onClick={() => router.push("/settings")}
                >
                  <Avatar className="size-8 border border-primary/20">
                    <AvatarImage src={user.photoURL || MOCK_USER.avatar} />
                    <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start text-sm text-left">
                    <span className="font-bold truncate max-w-[100px]">{user.displayName || 'Demo User'}</span>
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Demo Status</span>
                  </div>
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={handleLogout}>
                  <LogOut className="size-4" />
                </Button>
              </div>
            </header>

            <div className="bg-primary/5 border-b border-border h-10 flex items-center overflow-hidden shrink-0">
              <div className="flex items-center gap-2 px-4 bg-background border-r border-border h-full z-10 font-bold text-[10px] text-primary uppercase tracking-widest shrink-0">
                <Zap className="size-3 fill-primary animate-pulse" /> Market Pulse
              </div>
              <div className="flex animate-marquee hover:[animation-play-state:paused] whitespace-nowrap">
                {[...MOCK_NEWS, ...MOCK_NEWS].map((news, i) => (
                  <div key={i} className="flex items-center gap-6 px-4 group cursor-pointer">
                    <div className="flex items-center gap-2 text-[11px] font-medium">
                      <span className="text-muted-foreground uppercase">{news.time}</span>
                      <span className="group-hover:text-primary transition-colors font-bold">{news.title}</span>
                      {news.sentiment === "POSITIVE" ? <TrendingUp className="size-3 text-green-500" /> : <TrendingDown className="size-3 text-red-500" />}
                    </div>
                    <span className="text-border">|</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
