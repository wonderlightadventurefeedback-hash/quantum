
"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Search, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown,
  ShieldCheck,
  Globe,
  LayoutDashboard,
  ChevronDown
} from "lucide-react"
import { useUser } from "@/firebase"
import { MOCK_INDICES } from "@/lib/mock-data"

export default function LandingPage() {
  const { user, loading } = useUser()
  const router = useRouter()

  React.useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading || user) return null

  return (
    <div className="min-h-screen bg-white text-[#44475b] font-body selection:bg-[#00d09c]/30">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00d09c] flex items-center justify-center">
                <span className="font-headline font-bold text-white text-lg">FI</span>
              </div>
              <span className="font-headline font-bold text-2xl tracking-tight text-[#44475b]">
                FinIntel
              </span>
            </Link>
            
            <nav className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-[#44475b]/80">
              <Link href="/dashboard" className="hover:text-[#00d09c] transition-colors">Stocks</Link>
              <Link href="/predict" className="hover:text-[#00d09c] transition-colors">F&O</Link>
              <Link href="/learn" className="hover:text-[#00d09c] transition-colors">Mutual Funds</Link>
              <button className="flex items-center gap-1 hover:text-[#00d09c] transition-colors">
                More <ChevronDown size={14} />
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-md mx-8 hidden md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input 
                placeholder="Search FinIntel..." 
                className="w-full pl-10 h-10 bg-[#f8f8f8] border-none rounded-md focus-visible:ring-1 focus-visible:ring-[#00d09c]/20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold border border-gray-200 px-1 rounded">
                Ctrl+K
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button className="bg-[#00d09c] hover:bg-[#00b085] text-white font-bold px-6 h-10 rounded-md">
                Login/Sign up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Market Ticker */}
      <div className="pt-20 bg-white border-b border-gray-50 h-12 flex items-center overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...MOCK_INDICES, ...MOCK_INDICES, ...MOCK_INDICES].map((index, i) => (
            <div key={i} className="flex items-center gap-2 px-6">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{index.name}</span>
              <span className="text-[11px] font-bold text-[#44475b]">{index.value}</span>
              <span className={`text-[11px] font-bold ${index.trend === 'UP' ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                {index.percent}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-white overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-6xl md:text-8xl font-headline font-bold text-[#44475b] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            Grow your wealth
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Trust by millions of users. The simple way to invest in stocks, mutual funds and more.
          </p>
          <Link href="/login">
            <Button className="bg-[#00d09c] hover:bg-[#00b085] text-white font-bold text-lg px-12 h-16 rounded-full shadow-lg shadow-[#00d09c]/20 animate-in fade-in zoom-in duration-1000">
              Get started
            </Button>
          </Link>

          <div className="mt-16 max-w-5xl mx-auto relative h-[400px] md:h-[600px] animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <img 
              src="https://picsum.photos/seed/financial-infrastructure/1200/800" 
              alt="Financial Ecosystem" 
              className="w-full h-full object-contain opacity-90"
              data-ai-hint="isometric finance"
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-[#f8f8f8]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6 text-left">
              <h2 className="text-4xl font-headline font-bold text-[#44475b]">
                Invest everywhere, <span className="text-[#00d09c]">anytime.</span>
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                Stay on top of the markets with our real-time tracking, AI-powered predictions, and personalized news sentiment analysis. Whether you are at home or on the go, FinIntel keeps you ahead.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6">
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <TrendingUp className="size-8 text-[#00d09c] mb-4" />
                  <h3 className="font-bold text-lg mb-2 text-[#44475b]">AI Insights</h3>
                  <p className="text-sm text-gray-400">Get predictive analysis on market trends before they happen.</p>
                </div>
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <ShieldCheck className="size-8 text-[#00d09c] mb-4" />
                  <h3 className="font-bold text-lg mb-2 text-[#44475b]">Safe & Secure</h3>
                  <p className="text-sm text-gray-400">Your data and investments are protected by bank-grade security.</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-[#00d09c]/10 blur-[80px] rounded-full" />
              <img 
                src="https://picsum.photos/seed/app-interface/800/800" 
                alt="Mobile App" 
                className="relative rounded-3xl w-full h-auto shadow-xl"
                data-ai-hint="mobile app"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="bg-[#00d09c] p-12 text-white flex flex-col justify-between">
                <div>
                  <h2 className="text-3xl font-headline font-bold mb-4">Contact us</h2>
                  <p className="opacity-80">Our support team is available 24/7 to help you with any queries.</p>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="flex items-center gap-3">
                    <Globe size={18} />
                    <span className="text-sm font-medium">help@finintel.ai</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <LayoutDashboard size={18} />
                    <span className="text-sm font-medium">Main Office: Mumbai, India</span>
                  </div>
                </div>
              </div>
              <div className="p-12">
                <form className="space-y-4">
                  <Input placeholder="Your Name" className="h-12 border-gray-100 bg-gray-50/50" />
                  <Input placeholder="Email Address" type="email" className="h-12 border-gray-100 bg-gray-50/50" />
                  <Textarea placeholder="Message" className="min-h-[120px] border-gray-100 bg-gray-50/50" />
                  <Button className="w-full h-12 bg-[#00d09c] hover:bg-[#00b085] font-bold">
                    Send message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-[#f8f8f8] border-t border-gray-100">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#00d09c] flex items-center justify-center">
                <span className="font-headline font-bold text-white text-[10px]">FI</span>
              </div>
              <span className="font-headline font-bold text-xl text-[#44475b]">FinIntel</span>
            </div>
            <div className="flex gap-8 text-sm text-gray-400 font-medium">
              <Link href="#" className="hover:text-[#00d09c]">Privacy Policy</Link>
              <Link href="#" className="hover:text-[#00d09c]">Terms of Service</Link>
              <Link href="#" className="hover:text-[#00d09c]">Help Center</Link>
            </div>
            <p className="text-sm text-gray-400">
              © 2024 FinIntel AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
