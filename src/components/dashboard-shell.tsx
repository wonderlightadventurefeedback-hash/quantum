
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  BookOpen, 
  TrendingUp, 
  Newspaper, 
  PieChart, 
  MessageSquare, 
  Users, 
  Search,
  Bell,
  Settings,
  Menu,
  X
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MOCK_USER } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"

const navItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Learn", href: "/learn", icon: BookOpen },
  { name: "Prediction Arena", href: "/predict", icon: TrendingUp },
  { name: "News Intel", href: "/news", icon: Newspaper },
  { name: "Portfolio Analyzer", href: "/portfolio", icon: PieChart },
  { name: "AI Advisor", href: "/advisor", icon: MessageSquare },
  { name: "Community", href: "/community", icon: Users },
]

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { toast } = useToast()
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true)

  const handleHeaderAction = (action: string) => {
    toast({
      title: action,
      description: `Feature coming soon: ${action} configuration.`,
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Searching...",
      description: "Searching our global market database.",
    })
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "bg-card/50 backdrop-blur-md border-r border-border transition-all duration-300 z-50",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 h-20">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="font-headline font-bold text-white">FI</span>
            </div>
            {isSidebarOpen && (
              <span className="font-headline font-bold text-xl tracking-tight text-primary">
                FinIntel AI
              </span>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-4 h-12",
                      isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-muted-foreground",
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
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-4 p-2 h-auto",
                !isSidebarOpen && "justify-center"
              )}
              onClick={() => handleHeaderAction("Profile Settings")}
            >
              <Avatar className="size-8">
                <AvatarImage src={MOCK_USER.avatar} />
                <AvatarFallback>AT</AvatarFallback>
              </Avatar>
              {isSidebarOpen && (
                <div className="flex flex-col items-start text-sm">
                  <span className="font-medium truncate max-w-[120px]">{MOCK_USER.name}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">Pro Member</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 border-b border-border bg-background/50 backdrop-blur-md flex items-center justify-between px-8 z-40">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative" onClick={() => handleHeaderAction("Notifications")}>
              <Bell className="size-5" />
              <span className="absolute top-2 right-2 size-2 bg-primary rounded-full ring-2 ring-background"></span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleHeaderAction("Settings")}>
              <Settings className="size-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  )
}
