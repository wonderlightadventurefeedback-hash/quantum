
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  BookOpen, 
  TrendingUp, 
  TrendingDown,
  Newspaper, 
  PieChart, 
  MessageSquare, 
  Users, 
  Search,
  Bell,
  Settings,
  Menu,
  Zap,
  Moon,
  Sun,
  LogOut,
  LogIn,
  Loader2
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MOCK_USER, MOCK_NEWS } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import { useUser, useAuth } from "@/firebase"
import { signOut } from "firebase/auth"

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Learn", href: "/learn", icon: BookOpen },
  { name: "Prediction Arena", href: "/predict", icon: TrendingUp },
  { name: "News Intel", href: "/news", icon: Newspaper },
  { name: "Portfolio Analyzer", href: "/portfolio", icon: PieChart },
  { name: "AI Advisor", href: "/advisor", icon: MessageSquare },
  { name: "Community", href: "/community", icon: Users },
]

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const { user, loading } = useUser()
  const { toast } = useToast()
  
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true)
  const [theme, setTheme] = React.useState<"light" | "dark">("dark")
  const [isHeaderVisible, setIsHeaderVisible] = React.useState(true)
  
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const lastScrollY = React.useRef(0)

  // Authentication Guard
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "dark" : "light")
  }, [])

  // Smart Header Scroll Logic
  React.useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const currentScrollY = container.scrollTop
      
      // Hide if scrolling down and past a threshold
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsHeaderVisible(false)
      } 
      // Show if scrolling up
      else if (currentScrollY < lastScrollY.current) {
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
    toast({
      title: `${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} Mode Enabled`,
      description: `Interface updated to ${newTheme} aesthetic.`,
    })
  }

  const handleLogout = async () => {
    if (!auth) return
    try {
      await signOut(auth)
      toast({
        title: "Signed Out",
        description: "You have been successfully logged out.",
      })
      router.push('/login')
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error.message,
      })
    }
  }

  const handleHeaderAction = (action: string) => {
    if (action === "Profile Settings" || action === "Settings") {
      router.push("/settings")
    } else if (action === "Notifications") {
      toast({
        title: "Notifications",
        description: "Checking for latest market alerts...",
      })
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Searching...",
      description: "Searching our global market database.",
    })
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

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "bg-card border-r border-border transition-all duration-300 z-50",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 px-6 h-20">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="font-headline font-bold text-white">FI</span>
            </div>
            {isSidebarOpen && (
              <span className="font-headline font-bold text-xl tracking-tight text-primary">
                FinIntel AI
              </span>
            )}
          </Link>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    suppressHydrationWarning
                    className={cn(
                      "w-full justify-start gap-4 h-12",
                      isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-muted-foreground hover:text-foreground",
                      !isSidebarOpen && "justify-center px-0"
                    )}
                  >
                    <item.icon className={cn("shrink-0 size-5", isActive && "text-primary")} />
                    {isSidebarOpen && <span>{item.name}</span>}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border">
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                suppressHydrationWarning
                className={cn(
                  "w-full justify-start gap-4 p-2 h-auto hover:bg-muted",
                  !isSidebarOpen && "justify-center"
                )}
                onClick={() => handleHeaderAction("Profile Settings")}
              >
                <Avatar className="size-8">
                  <AvatarImage src={user.photoURL || MOCK_USER.avatar} />
                  <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                </Avatar>
                {isSidebarOpen && (
                  <div className="flex flex-col items-start text-sm overflow-hidden text-left">
                    <span className="font-medium truncate w-full">{user.displayName || 'User'}</span>
                    <span className="text-xs text-muted-foreground truncate w-full">Pro Member</span>
                  </div>
                )}
              </Button>
              {isSidebarOpen && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  suppressHydrationWarning
                  className="w-full justify-start gap-4 text-muted-foreground hover:text-destructive" 
                  onClick={handleLogout}
                >
                  <LogOut className="size-4" />
                  <span>Logout</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div 
          ref={scrollContainerRef} 
          className="flex-1 overflow-y-auto custom-scrollbar bg-background text-foreground"
        >
          {/* Sticky Header Wrapper */}
          <div className={cn(
            "sticky top-0 z-40 transition-transform duration-300 ease-in-out",
            isHeaderVisible ? "translate-y-0" : "-translate-y-full"
          )}>
            {/* Header */}
            <header className="h-20 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-8">
              <div className="flex items-center gap-6">
                <Button variant="ghost" size="icon" suppressHydrationWarning onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                  <Menu className="size-5" />
                </Button>
                <form onSubmit={handleSearch} className="relative w-64 md:w-96 hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search stocks, news, lessons..." 
                    className="pl-10 bg-muted/50 border-none focus-visible:ring-primary/50" 
                  />
                </form>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" suppressHydrationWarning onClick={toggleTheme} className="text-muted-foreground hover:text-primary">
                  {theme === "light" ? <Moon className="size-5" /> : <Sun className="size-5" />}
                </Button>
                <Button variant="ghost" size="icon" suppressHydrationWarning className="relative text-muted-foreground" onClick={() => handleHeaderAction("Notifications")}>
                  <Bell className="size-5" />
                  <span className="absolute top-2.5 right-2.5 size-2 bg-primary rounded-full ring-2 ring-background"></span>
                </Button>
                <Button variant="ghost" size="icon" suppressHydrationWarning className="text-muted-foreground" onClick={() => handleHeaderAction("Settings")}>
                  <Settings className="size-5" />
                </Button>
              </div>
            </header>

            {/* Realtime Market Ticker */}
            <div className="bg-primary/5 border-b border-border h-10 flex items-center overflow-hidden shrink-0">
              <div className="flex items-center gap-2 px-4 bg-background border-r border-border h-full z-10 font-bold text-[10px] text-primary uppercase tracking-widest shrink-0">
                <Zap className="size-3 fill-primary animate-pulse" /> Market Pulse
              </div>
              <div className="flex animate-marquee hover:[animation-play-state:paused] whitespace-nowrap">
                {[...MOCK_NEWS, ...MOCK_NEWS, ...MOCK_NEWS].map((news, i) => (
                  <div key={i} className="flex items-center gap-6 px-4 group cursor-pointer" onClick={() => toast({ title: news.title, description: `Source: ${news.source}` })}>
                    <div className="flex items-center gap-2 text-[11px] font-medium">
                      <span className="text-muted-foreground">{news.time}</span>
                      <span className="group-hover:text-primary transition-colors">{news.title}</span>
                      {news.sentiment === "POSITIVE" ? (
                        <TrendingUp className="size-3 text-green-500" />
                      ) : (
                        <TrendingDown className="size-3 text-red-500" />
                      )}
                      <span className={cn(
                        "font-bold",
                        news.sentiment === "POSITIVE" ? "text-green-500" : "text-red-500"
                      )}>
                        {news.score}%
                      </span>
                    </div>
                    <span className="text-border">|</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Page Content Container */}
          <div className="p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
