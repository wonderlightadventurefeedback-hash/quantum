
"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ArrowRight, 
  BrainCircuit, 
  TrendingUp, 
  ShieldCheck, 
  Mail, 
  MapPin, 
  Phone,
  Globe,
  Sparkles,
  ChevronRight
} from "lucide-react"
import { useUser } from "@/firebase"

export default function LandingPage() {
  const { user, loading } = useUser()
  const router = useRouter()

  if (!loading && user) {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-headline font-bold text-white text-xl">FI</span>
            </div>
            <span className="font-headline font-bold text-2xl tracking-tight text-primary">
              FinIntel AI
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#hero" className="hover:text-primary transition-colors">Home</a>
            <a href="#about" className="hover:text-primary transition-colors">About</a>
            <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
            <Link href="/login">
              <Button variant="outline" className="border-primary/20 hover:bg-primary/5">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button className="font-bold shadow-lg shadow-primary/20">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative pt-48 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
              <Sparkles className="size-3" /> The Future of Investing is Here
            </div>
            <h1 className="text-6xl md:text-7xl font-headline font-bold leading-[1.1] tracking-tight">
              Master the Markets with <span className="text-primary italic">AI Intelligence</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Experience a sophisticated trading platform that combines real-time data analysis, personalized learning paths, and AI-driven predictive insights.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/login">
                <Button size="lg" className="h-14 px-10 rounded-full text-lg font-bold gap-3 shadow-xl shadow-primary/25">
                  Start Your Journey <ArrowRight className="size-5" />
                </Button>
              </Link>
              <Button size="lg" variant="ghost" className="h-14 px-8 rounded-full text-lg font-medium group">
                View Demo <ChevronRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>

          <div className="mt-20 relative animate-in fade-in zoom-in-95 duration-1000 delay-300">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-transparent blur-3xl opacity-20" />
            <div className="relative rounded-3xl border border-primary/20 bg-card/50 backdrop-blur-xl overflow-hidden shadow-2xl">
              <img 
                src="https://picsum.photos/seed/dashboard/1200/600" 
                alt="FinIntel Dashboard Preview" 
                className="w-full h-auto opacity-90"
                data-ai-hint="finance dashboard"
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-headline font-bold leading-tight">
                Designed for the <span className="text-primary">Next Generation</span> of Investors
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                At FinIntel AI, we believe that professional-grade market intelligence should be accessible to everyone. Our platform leverages advanced machine learning to analyze global news sentiment, predict market movements, and provide personalized advice tailored to your goals.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                <div className="space-y-3">
                  <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <BrainCircuit className="size-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">AI Predictions</h3>
                  <p className="text-sm text-muted-foreground">Test your intuition against our high-accuracy ML models.</p>
                </div>
                <div className="space-y-3">
                  <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="size-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">Market Intel</h3>
                  <p className="text-sm text-muted-foreground">Real-time sentiment analysis of global news feeds.</p>
                </div>
              </div>
            </div>
            <div className="relative aspect-square">
              <div className="absolute -inset-10 bg-primary/10 blur-[100px] rounded-full" />
              <img 
                src="https://picsum.photos/seed/ai-tech/800/800" 
                alt="AI Technology" 
                className="relative rounded-3xl object-cover w-full h-full shadow-2xl"
                data-ai-hint="artificial intelligence"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto glass-card rounded-[2.5rem] overflow-hidden border-primary/10">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="bg-primary p-12 lg:p-20 text-primary-foreground space-y-12">
                <div className="space-y-4">
                  <h2 className="text-4xl font-headline font-bold">Get in Touch</h2>
                  <p className="text-primary-foreground/80 leading-relaxed">
                    Have questions about our AI models or institutional plans? Our team is ready to assist you.
                  </p>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-white/10 flex items-center justify-center">
                      <Mail className="size-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold opacity-60">Email</div>
                      <div className="font-medium">hello@finintel.ai</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-white/10 flex items-center justify-center">
                      <Phone className="size-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold opacity-60">Support</div>
                      <div className="font-medium">+1 (555) 123-4567</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-white/10 flex items-center justify-center">
                      <MapPin className="size-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold opacity-60">Headquarters</div>
                      <div className="font-medium">Financial District, New York, NY</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-12 lg:p-20 bg-card/40 backdrop-blur-xl">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold opacity-70">First Name</label>
                      <Input placeholder="John" className="bg-muted/30 border-none h-12" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold opacity-70">Last Name</label>
                      <Input placeholder="Doe" className="bg-muted/30 border-none h-12" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold opacity-70">Email Address</label>
                    <Input placeholder="john@example.com" type="email" className="bg-muted/30 border-none h-12" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold opacity-70">Message</label>
                    <Textarea placeholder="How can we help you?" className="bg-muted/30 border-none min-h-[150px]" />
                  </div>
                  <Button className="w-full h-14 font-bold text-lg shadow-xl shadow-primary/20">
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-border/40">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="font-headline font-bold text-white">FI</span>
              </div>
              <span className="font-headline font-bold text-xl tracking-tight text-primary">
                FinIntel AI
              </span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground font-medium">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Risk Disclosure</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 FinIntel AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
