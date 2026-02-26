
"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Bell, 
  Globe, 
  Shield, 
  Save, 
  Camera, 
  Mail, 
  Lock, 
  Trophy, 
  Zap, 
  Wallet, 
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Clock,
  RefreshCw,
  ShoppingBag,
  ArrowRightLeft
} from "lucide-react"
import { MOCK_USER } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, setDocumentNonBlocking } from "@/firebase"
import { doc, collection, query, orderBy, limit, serverTimestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

export default function SettingsPage() {
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  const [isSaving, setIsSaving] = React.useState(false)
  const [isResetting, setIsResetting] = React.useState(false)

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, 'users', user.uid)
  }, [db, user])

  const { data: userProfile } = useDoc(userProfileRef)
  const balance = userProfile?.balance ?? 50000

  // Fetch Real Unified Activity History (Buy/Sell + Arena)
  const activityQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, 'users', user.uid, 'activity'),
      orderBy('timestamp', 'desc'),
      limit(15)
    )
  }, [db, user])

  const { data: activityLog, isLoading: historyLoading } = useCollection(activityQuery)

  const performanceStats = React.useMemo(() => {
    if (!activityLog) return { netProfit: 0, netLoss: 0, activeTrades: 0, accuracy: 0 }
    
    let profit = 0;
    let loss = 0;
    let wins = 0;
    let settledTrades = 0;
    
    activityLog.forEach(act => {
      if (act.type === "ARENA_SPECULATE") {
        settledTrades++;
        const p = act.total || 0;
        if (p > 0) {
          profit += p;
          wins++;
        } else {
          loss += Math.abs(p);
        }
      }
    })

    const accuracy = settledTrades > 0 ? Math.round((wins / settledTrades) * 100) : 0;

    return { 
      netProfit: profit, 
      netLoss: loss, 
      activeTrades: settledTrades,
      accuracy: accuracy
    }
  }, [activityLog])

  const handleSave = (section: string) => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: "Settings Updated",
        description: `Your ${section} settings have been saved successfully.`,
      })
    }, 1000)
  }

  const handleResetBalance = async () => {
    if (!db || !user) return
    setIsResetting(true)
    const userRef = doc(db, 'users', user.uid)
    
    try {
      setDocumentNonBlocking(userRef, {
        balance: 50000,
        updatedAt: serverTimestamp()
      }, { merge: true })
      
      toast({
        title: "Demo Balance Reset",
        description: "Your virtual capital has been restored to ₹50,000.00",
      })
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: "Could not reset demo balance. Please try again.",
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <DashboardShell>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">Trader Control Center</h1>
            <p className="text-muted-foreground text-sm">Manage your professional demo identity and platform security.</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl">
            <CheckCircle2 className="size-4 text-primary" />
            <span className="text-xs font-black text-primary uppercase tracking-widest">Demo Account Verified</span>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="bg-muted/50 p-1 h-14 rounded-2xl w-full justify-start gap-2 overflow-x-auto no-scrollbar">
            <TabsTrigger value="profile" className="gap-2 px-6 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg whitespace-nowrap">
              <User className="size-4" /> Trader Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 px-6 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg whitespace-nowrap">
              <Bell className="size-4" /> Alerts
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2 px-6 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg whitespace-nowrap">
              <Globe className="size-4" /> Terminal
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 px-6 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-lg whitespace-nowrap">
              <Shield className="size-4" /> Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="glass-card border-none shadow-2xl overflow-hidden rounded-[2.5rem]">
              <div className="h-32 bg-gradient-to-r from-primary/20 via-background to-background relative border-b border-border/50">
                <div className="absolute -bottom-12 left-10 p-1 bg-background rounded-3xl shadow-xl">
                  <div className="relative group">
                    <Avatar className="size-32 rounded-[1.5rem] border-4 border-background">
                      <AvatarImage src={user?.photoURL || MOCK_USER.avatar} />
                      <AvatarFallback className="text-3xl font-black">{userProfile?.displayName?.[0] || 'T'}</AvatarFallback>
                    </Avatar>
                    <button className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="size-8" />
                    </button>
                  </div>
                </div>
              </div>
              
              <CardContent className="pt-16 px-10 pb-10 space-y-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-headline font-bold text-foreground">{userProfile?.displayName || user?.displayName || 'Demo User'}</h2>
                    <div className="flex items-center gap-3 mt-1 text-muted-foreground font-medium">
                      <span>Pro Trader • Demo Level</span>
                      <div className="size-1 bg-muted-foreground/30 rounded-full" />
                      <span>Live Terminal Access</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-muted/30 px-6 py-3 rounded-2xl border border-border/50 text-center min-w-[140px] group relative">
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                        <Wallet className="size-3 text-primary" /> Demo Balance
                      </div>
                      <div className="text-lg font-black font-headline">₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <button 
                        onClick={handleResetBalance}
                        disabled={isResetting}
                        className="absolute -top-2 -right-2 size-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                        title="Reset to ₹50,000"
                      >
                        {isResetting ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                      </button>
                    </div>
                    <div className="bg-muted/30 px-6 py-3 rounded-2xl border border-border/50 text-center min-w-[120px]">
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                        <Zap className="size-3 text-yellow-500" /> Accuracy
                      </div>
                      <div className="text-lg font-black font-headline">{performanceStats.accuracy}%</div>
                    </div>
                    <div className="bg-muted/30 px-6 py-3 rounded-2xl border border-border/50 text-center min-w-[120px]">
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                        <Trophy className="size-3 text-emerald-500" /> Progress
                      </div>
                      <div className="text-lg font-black font-headline">{MOCK_USER.learningProgress}%</div>
                    </div>
                  </div>
                </div>

                {/* Performance Analytics */}
                <div className="space-y-6 pt-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary border-l-2 border-primary pl-4">Arena Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-primary/5 border-primary/20 p-6 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <TrendingUp className="size-5 text-primary" />
                        <Badge className="bg-primary/20 text-primary border-none text-[10px]">Arena Gains</Badge>
                      </div>
                      <div className="text-2xl font-black text-primary">₹{performanceStats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Cumulative virtual profit</p>
                    </Card>
                    <Card className="bg-destructive/5 border-destructive/20 p-6 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <TrendingDown className="size-5 text-destructive" />
                        <Badge variant="destructive" className="bg-destructive/20 text-destructive border-none text-[10px]">Arena Loss</Badge>
                      </div>
                      <div className="text-2xl font-black text-destructive">₹{performanceStats.netLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Cumulative virtual drawdown</p>
                    </Card>
                    <Card className="bg-muted/30 border-border/50 p-6 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <Activity className="size-5 text-muted-foreground" />
                        <Badge variant="secondary" className="text-[10px]">Arena Stats</Badge>
                      </div>
                      <div className="text-2xl font-black">{performanceStats.activeTrades}</div>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Speculations settled</p>
                    </Card>
                  </div>
                </div>

                {/* Real-Time Activity Log */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary border-l-2 border-primary pl-4">Live Activity Terminal</h3>
                    <div className="flex items-center gap-2">
                      {historyLoading && <Loader2 className="size-3 animate-spin text-primary" />}
                      <span className="text-[10px] font-black uppercase text-muted-foreground">Showing real-time order history</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-muted/30 text-[10px] uppercase font-black text-muted-foreground tracking-widest border-b border-border/50">
                          <tr>
                            <th className="px-6 py-4">Asset</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">Qty / Stake</th>
                            <th className="px-6 py-4">Execution Price</th>
                            <th className="px-6 py-4 text-right">Total / Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {historyLoading ? (
                            <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>
                          ) : !activityLog || activityLog.length === 0 ? (
                            <tr><td colSpan={5} className="p-12 text-center text-muted-foreground italic">No real-time data found. Start buying stocks or speculating in the Arena to see your activity here.</td></tr>
                          ) : activityLog.map((act) => {
                            const isBuy = act.type === "ORDER_BUY";
                            const isSell = act.type === "ORDER_SELL";
                            const isArena = act.type === "ARENA_SPECULATE";
                            
                            return (
                              <tr key={act.id} className="hover:bg-muted/10 transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className="size-6 rounded bg-muted flex items-center justify-center font-black text-[10px] text-primary">
                                      {act.symbol?.[0] || '?'}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-bold">{act.symbol}</span>
                                      <span className="text-[9px] text-muted-foreground uppercase flex items-center gap-1">
                                        <Clock className="size-2" />
                                        {act.timestamp ? formatDistanceToNow(act.timestamp.toDate(), { addSuffix: true }) : 'just now'}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className={cn(
                                    "flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-tighter",
                                    isBuy ? "text-green-500" : isSell ? "text-blue-500" : "text-amber-500"
                                  )}>
                                    {isBuy ? <ShoppingBag className="size-3" /> : isSell ? <ArrowRightLeft className="size-3" /> : <Activity className="size-3" />}
                                    {isBuy ? "Spot Buy" : isSell ? "Spot Sell" : "Arena Trade"}
                                  </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-muted-foreground">
                                  {isArena ? `₹${(act.stake || 0).toLocaleString()}` : `${act.quantity} Units`}
                                </td>
                                <td className="px-6 py-4 font-bold">₹{(act.price || 0).toFixed(2)}</td>
                                <td className={cn(
                                  "px-6 py-4 text-right font-black",
                                  (act.total || 0) >= 0 ? "text-primary" : "text-destructive"
                                )}>
                                  {(act.total || 0) >= 0 ? "+" : ""}₹{Math.abs(act.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary border-l-2 border-primary pl-4">Account Details</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Full Name</Label>
                        <Input id="name" defaultValue={userProfile?.displayName || user?.displayName || ''} className="h-12 bg-muted/30 border-none rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Email Address</Label>
                        <Input id="email" defaultValue={userProfile?.email || user?.email || ''} className="h-12 bg-muted/30 border-none rounded-xl font-bold" disabled />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary border-l-2 border-primary pl-4">Trader Bio</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bio" className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Strategy & Goals</Label>
                        <Textarea id="bio" placeholder="Tell us about your financial goals..." className="min-h-[128px] bg-muted/30 border-none rounded-xl font-medium resize-none leading-relaxed" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 px-10 py-6 border-t border-border/50">
                <Button className="ml-auto gap-2 h-12 px-8 rounded-xl font-bold shadow-xl shadow-primary/20" onClick={() => handleSave("profile")} disabled={isSaving}>
                  {isSaving ? <><Zap className="size-4 animate-spin" /> Updating...</> : <><Save className="size-4" /> Save Professional Profile</>}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Other Tabs */}
          <TabsContent value="notifications">
            <Card className="glass-card rounded-[2rem] border-none shadow-xl">
              <CardHeader className="px-8 pt-8">
                <CardTitle className="text-xl font-headline font-bold">Signal Preferences</CardTitle>
                <CardDescription>Configure market alerts and AI analysis notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-8 pb-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/30 border border-border/50">
                    <div className="space-y-1">
                      <Label className="text-base font-bold">Volatility Alerts</Label>
                      <p className="text-xs text-muted-foreground">Notify when tracked indices move more than 3% in a session.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/30 border border-border/50">
                    <div className="space-y-1">
                      <Label className="text-base font-bold">AI Prediction Complete</Label>
                      <p className="text-xs text-muted-foreground">Receive instant alerts when strategic analysis is ready.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-8 pb-8">
                <Button className="ml-auto rounded-xl font-bold" onClick={() => handleSave("notification")}>Save Preferences</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card className="glass-card rounded-[2rem] border-none shadow-xl">
              <CardHeader className="px-8 pt-8">
                <CardTitle className="text-xl font-headline font-bold">Terminal Settings</CardTitle>
                <CardDescription>Customize your trading interface and localization.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 px-8 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Default Currency</Label>
                    <Select defaultValue="inr">
                      <SelectTrigger className="h-12 bg-muted/30 border-none rounded-xl font-bold">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inr">INR - Indian Rupee</SelectItem>
                        <SelectItem value="usd">USD - US Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-8 pb-8">
                <Button className="ml-auto rounded-xl font-bold" onClick={() => handleSave("preferences")}>Update Terminal</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="glass-card rounded-[2rem] border-none shadow-xl">
              <CardHeader className="px-8 pt-8">
                <CardTitle className="text-xl font-headline font-bold">Security & Protection</CardTitle>
                <CardDescription>Keep your professional account and virtual assets secure.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-8 pb-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 rounded-2xl bg-muted/30 border border-border/50 group hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-5">
                      <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Lock className="size-6 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-base font-bold">Two-Factor Authentication</Label>
                        <p className="text-xs text-muted-foreground">Add an extra layer of security via SMS or authenticator app.</p>
                      </div>
                    </div>
                    <Button variant="outline" className="rounded-xl border-2 font-bold">Enable 2FA</Button>
                  </div>
                  <div className="pt-6">
                    <Button 
                      variant="destructive" 
                      className="gap-2 h-12 px-8 rounded-xl font-bold"
                      onClick={handleResetBalance}
                      disabled={isResetting}
                    >
                      {isResetting ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                      Reset Demo Capital to ₹50,000
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}
