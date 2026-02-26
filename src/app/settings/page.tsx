
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
  History,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { MOCK_USER } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import { useUser, useFirestore } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  const [isLoading, setIsLoading] = React.useState(false)
  const [balance, setBalance] = React.useState(50000)

  const MOCK_TRADING_HISTORY = [
    { id: 1, asset: "AAPL", type: "UP", outcome: "WIN", amount: "₹500.00", result: "+₹400.00", time: "2 mins ago" },
    { id: 2, asset: "NVDA", type: "DOWN", outcome: "WIN", amount: "₹1,000.00", result: "+₹800.00", time: "15 mins ago" },
    { id: 3, asset: "TSLA", type: "UP", outcome: "LOSS", amount: "₹500.00", result: "-₹500.00", time: "1 hour ago" },
    { id: 4, asset: "RELIANCE", type: "UP", outcome: "WIN", amount: "₹200.00", result: "+₹160.00", time: "3 hours ago" },
  ]

  React.useEffect(() => {
    async function fetchBalance() {
      if (!db || !user) return
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (snap.exists()) setBalance(snap.data().balance || 50000)
    }
    fetchBalance()
  }, [db, user])

  const handleSave = (section: string) => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Settings Updated",
        description: `Your ${section} settings have been saved successfully.`,
      })
    }, 1000)
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
                      <AvatarFallback className="text-3xl font-black">AT</AvatarFallback>
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
                    <h2 className="text-3xl font-headline font-bold text-foreground">{user?.displayName || MOCK_USER.name}</h2>
                    <div className="flex items-center gap-3 mt-1 text-muted-foreground font-medium">
                      <span>Pro Trader • Demo Level</span>
                      <div className="size-1 bg-muted-foreground/30 rounded-full" />
                      <span>Joined Feb 2024</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-muted/30 px-6 py-3 rounded-2xl border border-border/50 text-center min-w-[120px]">
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                        <Wallet className="size-3 text-primary" /> Balance
                      </div>
                      <div className="text-lg font-black font-headline">₹{balance.toLocaleString()}</div>
                    </div>
                    <div className="bg-muted/30 px-6 py-3 rounded-2xl border border-border/50 text-center min-w-[120px]">
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                        <Zap className="size-3 text-yellow-500" /> Accuracy
                      </div>
                      <div className="text-lg font-black font-headline">{MOCK_USER.predictionAccuracy}%</div>
                    </div>
                    <div className="bg-muted/30 px-6 py-3 rounded-2xl border border-border/50 text-center min-w-[120px]">
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                        <Trophy className="size-3 text-emerald-500" /> Progress
                      </div>
                      <div className="text-lg font-black font-headline">{MOCK_USER.learningProgress}%</div>
                    </div>
                  </div>
                </div>

                {/* Performance Analytics Component */}
                <div className="space-y-6 pt-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary border-l-2 border-primary pl-4">Performance Analytics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-primary/5 border-primary/20 p-6 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <TrendingUp className="size-5 text-primary" />
                        <Badge className="bg-primary/20 text-primary border-none text-[10px]">Net Profit</Badge>
                      </div>
                      <div className="text-2xl font-black text-primary">₹12,450.00</div>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Total virtual gains</p>
                    </Card>
                    <Card className="bg-destructive/5 border-destructive/20 p-6 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <TrendingDown className="size-5 text-destructive" />
                        <Badge variant="destructive" className="bg-destructive/20 text-destructive border-none text-[10px]">Net Loss</Badge>
                      </div>
                      <div className="text-2xl font-black text-destructive">₹4,200.00</div>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Total virtual drawdown</p>
                    </Card>
                    <Card className="bg-muted/30 border-border/50 p-6 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <Activity className="size-5 text-muted-foreground" />
                        <Badge variant="secondary" className="text-[10px]">Active trades</Badge>
                      </div>
                      <div className="text-2xl font-black">14</div>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Trades closed this session</p>
                    </Card>
                  </div>
                </div>

                {/* Trading History Component */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary border-l-2 border-primary pl-4">Recent History</h3>
                    <Button variant="link" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground p-0 h-auto">View All Trades</Button>
                  </div>
                  <div className="rounded-2xl border border-border/50 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-muted/30 text-[10px] uppercase font-black text-muted-foreground tracking-widest border-b border-border/50">
                          <tr>
                            <th className="px-6 py-4">Asset</th>
                            <th className="px-6 py-4">Prediction</th>
                            <th className="px-6 py-4">Stake</th>
                            <th className="px-6 py-4">Outcome</th>
                            <th className="px-6 py-4 text-right">Profit/Loss</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {MOCK_TRADING_HISTORY.map((trade) => (
                            <tr key={trade.id} className="hover:bg-muted/10 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="size-6 rounded bg-muted flex items-center justify-center font-black text-[10px] text-primary">
                                    {trade.asset[0]}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold">{trade.asset}</span>
                                    <span className="text-[9px] text-muted-foreground uppercase">{trade.time}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className={cn("flex items-center gap-1.5 font-bold text-xs", trade.type === "UP" ? "text-primary" : "text-destructive")}>
                                  {trade.type === "UP" ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                                  {trade.type}
                                </div>
                              </td>
                              <td className="px-6 py-4 font-medium text-muted-foreground">{trade.amount}</td>
                              <td className="px-6 py-4">
                                <Badge className={cn("text-[9px] font-black uppercase tracking-tighter rounded-md h-5", trade.outcome === "WIN" ? "bg-primary/20 text-primary border-none" : "bg-destructive/20 text-destructive border-none")}>
                                  {trade.outcome}
                                </Badge>
                              </td>
                              <td className={cn("px-6 py-4 text-right font-black", trade.outcome === "WIN" ? "text-primary" : "text-destructive")}>
                                {trade.result}
                              </td>
                            </tr>
                          ))}
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
                        <Input id="name" defaultValue={user?.displayName || MOCK_USER.name} className="h-12 bg-muted/30 border-none rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Email Address</Label>
                        <Input id="email" defaultValue={user?.email || MOCK_USER.email} className="h-12 bg-muted/30 border-none rounded-xl font-bold" />
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
                <Button className="ml-auto gap-2 h-12 px-8 rounded-xl font-bold shadow-xl shadow-primary/20" onClick={() => handleSave("profile")} disabled={isLoading}>
                  {isLoading ? <><Zap className="size-4 animate-spin" /> Updating...</> : <><Save className="size-4" /> Save Professional Profile</>}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
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
                  <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/30 border border-border/50">
                    <div className="space-y-1">
                      <Label className="text-base font-bold">Learning Milestones</Label>
                      <p className="text-xs text-muted-foreground">Get notified when new course content matches your strategy.</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-8 pb-8">
                <Button className="ml-auto rounded-xl font-bold" onClick={() => handleSave("notification")}>Save Preferences</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
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
                        <SelectItem value="eur">EUR - Euro</SelectItem>
                        <SelectItem value="btc">BTC - Bitcoin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Display Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger className="h-12 bg-muted/30 border-none rounded-xl font-bold">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English (Global)</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-5 rounded-2xl bg-primary/5 border border-primary/20">
                  <div className="space-y-1">
                    <Label className="text-base font-bold text-primary">Advanced One-Click Trading</Label>
                    <p className="text-xs text-muted-foreground">Enable instant order execution without confirmation dialogs.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
              <CardFooter className="px-8 pb-8">
                <Button className="ml-auto rounded-xl font-bold" onClick={() => handleSave("preferences")}>Update Terminal</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Security Tab */}
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
                  <div className="flex items-center justify-between p-6 rounded-2xl bg-muted/30 border border-border/50 group hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-5">
                      <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Mail className="size-6 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-base font-bold">Login Notification Email</Label>
                        <p className="text-xs text-muted-foreground">Receive a security alert for every new device login.</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
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
