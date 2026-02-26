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
import { User, Bell, Globe, Shield, Save, Camera, Mail, Lock } from "lucide-react"
import { MOCK_USER } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)

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
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h1 className="text-3xl font-headline font-bold">Account Settings</h1>
          <p className="text-muted-foreground">Manage your profile, notifications, and platform preferences.</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="profile" className="gap-2">
              <User className="size-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="size-4" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Globe className="size-4" /> Preferences
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="size-4" /> Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details and how others see you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Avatar className="size-24 border-4 border-primary/20">
                      <AvatarImage src={MOCK_USER.avatar} />
                      <AvatarFallback>AT</AvatarFallback>
                    </Avatar>
                    <button className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="size-6" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold">Profile Photo</h3>
                    <p className="text-sm text-muted-foreground">JPG, GIF or PNG. Max size of 2MB.</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline">Upload New</Button>
                      <Button size="sm" variant="ghost" className="text-destructive">Remove</Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={MOCK_USER.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" defaultValue={MOCK_USER.email} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" placeholder="Tell us about your financial goals..." className="min-h-[100px]" />
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-6">
                <Button className="ml-auto gap-2" onClick={() => handleSave("profile")} disabled={isLoading}>
                  {isLoading ? "Saving..." : <><Save className="size-4" /> Save Profile</>}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Control which updates you receive and how they are delivered.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Alerts</h3>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                    <div className="space-y-0.5">
                      <Label className="text-base font-bold">Market Volatility Alerts</Label>
                      <p className="text-sm text-muted-foreground">Receive alerts when markets move more than 3%.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                    <div className="space-y-0.5">
                      <Label className="text-base font-bold">AI Prediction Updates</Label>
                      <p className="text-sm text-muted-foreground">Get notified when AI analysis results are ready.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Education</h3>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                    <div className="space-y-0.5">
                      <Label className="text-base font-bold">Learning Reminders</Label>
                      <p className="text-sm text-muted-foreground">Weekly nudge to continue your financial courses.</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-6">
                <Button className="ml-auto gap-2" onClick={() => handleSave("notification")}>
                  <Save className="size-4" /> Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Platform Preferences</CardTitle>
                <CardDescription>Customize your trading experience and localized data.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Default Currency</Label>
                    <Select defaultValue="usd">
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">USD - US Dollar</SelectItem>
                        <SelectItem value="eur">EUR - Euro</SelectItem>
                        <SelectItem value="gbp">GBP - British Pound</SelectItem>
                        <SelectItem value="btc">BTC - Bitcoin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English (US)</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold">Auto-Invest Mode</Label>
                    <p className="text-sm text-muted-foreground">Allow AI to suggest automated rebalancing.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-6">
                <Button className="ml-auto gap-2" onClick={() => handleSave("preferences")}>
                  <Save className="size-4" /> Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Keep your account and assets protected.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Lock className="size-5 text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-base font-bold">Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Enable</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="size-5 text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-base font-bold">Login Notifications</Label>
                        <p className="text-sm text-muted-foreground">Get an email every time someone logs into your account.</p>
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
