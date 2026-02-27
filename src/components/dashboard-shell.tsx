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
  Bookmark,
  ExternalLink,
  Check
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { MOCK_USER, MOCK_NEWS } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, useCollection, addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase"
import { signOut } from "firebase/auth"
import { doc, collection, query, orderBy, limit, serverTimestamp, where } from "firebase/firestore"
import { StaggeredMenu } from "./staggered-menu"
import { OnboardingQuiz } from "./onboarding-quiz"
import { formatDistanceToNow } from "date-fns"

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Watchlist", href: "/watchlist", icon: Bookmark },
  { name: "Trade", href: "/trade", icon: TrendingUp },
  { name: "Learn", href: "/learn", icon: BookOpen },
  { name: "Prediction Arena", href: "/predict", icon: Zap },
  { name: "News Intel", href: "/news", icon: Newspaper },
  { name: "Portfolio Analyzer", href: "/portfolio", icon: PieChart },
  { name: "Gemini Intelligence", href: "/advisor", icon: Bot },
  { name: "Account", href: "/settings", icon: User },
]

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'd6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110';

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
  const [showOnboarding, setShowOnboarding] = React.useState(false)
  
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const lastScrollY = React.useRef(0)

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, 'users', user.uid)
  }, [db, user])

  const { data: userProfile } = useDoc(userProfileRef)
  
  React.useEffect(() => {
    if (userProfile && !userProfile.onboardingCompleted) {
      setShowOnboarding(true)
    }
  }, [userProfile])

  const balance = typeof userProfile?.balance === 'number' && userProfile.balance >= 0 ? userProfile.balance : 50000

  // Real-time Notifications
  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, 'users', user.uid, 'notifications'), orderBy('timestamp', 'desc'), limit(10))
  }, [db, user])
  const { data: notifications } = useCollection(notificationsQuery)
  const unreadCount = notifications?.filter(n => !n.read).length || 0

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "dark" : "light")
  }, [])

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
          <span className="font-headline font-bold text-white text-xl">QF</span>
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

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <OnboardingQuiz open={showOnboarding} onComplete={() => setShowOnboarding(false)} />
      
      <StaggeredMenu 
        position="left"
        items={staggeredItems}
        socialItems={[
          { label: "Twitter", link: "https://twitter.com" },
          { label: "LinkedIn", link: "https://linkedin.com" }
        ]}
        colors={['hsl(var(--background))', 'hsl(var(--primary))']}
        accentColor="hsl(var(--primary))"
        menuButtonColor="#ffffff"
        openMenuButtonColor="#000000"
        isFixed={true}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar bg-background text-foreground">
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-muted-foreground">
                    <Bell className="size-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2.5 right-2.5 size-2 bg-primary rounded-full ring-2 ring-background animate-pulse"></span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 rounded-2xl overflow-hidden border-border/50 shadow-2xl" align="end">
                  <div className="bg-muted/30 p-4 border-b border-border/50 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Market Signals</h3>
                    <Badge variant="secondary" className="text-[9px] font-bold h-4 px-1.5">{unreadCount} New</Badge>
                  </div>
                  <ScrollArea className="h-[350px]">
                    {!notifications || notifications.length === 0 ? (
                      <div className="p-8 text-center space-y-2">
                        <Zap className="size-8 text-muted-foreground/30 mx-auto" />
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">No active signals found</p>
                      </div>
                    ) : notifications.map((n) => (
                      <div key={n.id} className={cn("p-4 border-b border-border/30 hover:bg-muted/5 transition-colors group relative", !n.read && "bg-primary/5")}>
                        <div className="flex justify-between items-start gap-3 mb-1">
                          <h4 className="text-[11px] font-black leading-tight pr-4">{n.title}</h4>
                          <Badge variant={n.sentiment === 'POSITIVE' ? 'default' : n.sentiment === 'NEGATIVE' ? 'destructive' : 'outline'} className="text-[8px] h-3.5 px-1 uppercase shrink-0">{n.sentiment}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{n.message}</p>
                      </div>
                    ))}
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => router.push('/watchlist')}>
                <Bookmark className="size-5" />
              </Button>
              <div className="h-8 w-px bg-border mx-2" />
              <Button variant="ghost" className="flex items-center gap-3 p-2 h-auto hover:bg-muted rounded-xl" onClick={() => router.push("/settings")}>
                <Avatar className="size-8 border border-primary/20">
                  <AvatarImage src={user.photoURL || MOCK_USER.avatar} />
                  <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start text-sm text-left">
                  <span className="font-bold truncate max-w-[100px]">{user.displayName || 'Demo User'}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">{userProfile?.experienceLevel || 'Calibrating...'}</span>
                </div>
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={handleLogout}>
                <LogOut className="size-4" />
              </Button>
            </div>
          </header>

          <div className="p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
