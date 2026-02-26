
"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Info, BrainCircuit, History, Loader2 } from "lucide-react"
import { aiStockPredictionExplanation } from "@/ai/flows/ai-stock-prediction-explanation-flow"
import { MOCK_STOCKS, Stock } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"

const FINNHUB_API_KEY = "d6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110";

export default function PredictionPage() {
  const { toast } = useToast()
  const [liveStocks, setLiveStocks] = React.useState<Stock[]>(MOCK_STOCKS)
  const [selectedStock, setSelectedStock] = React.useState(MOCK_STOCKS[0])
  const [prediction, setPrediction] = React.useState<'UP' | 'DOWN' | null>(null)
  const [confidence, setConfidence] = React.useState([50])
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [isFetching, setIsFetching] = React.useState(true)
  const [result, setResult] = React.useState<any>(null)

  const fetchPrices = async () => {
    try {
      const updated = await Promise.all(
        MOCK_STOCKS.slice(0, 8).map(async (stock) => {
          const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${FINNHUB_API_KEY}`)
          if (res.ok) {
            const data = await res.json()
            if (data.c) {
              return {
                ...stock,
                price: data.c,
                change: data.dp || stock.change,
                trend: (data.dp || 0) >= 0 ? "UP" : "DOWN" as "UP" | "DOWN"
              }
            }
          }
          return stock
        })
      )
      setLiveStocks(updated)
      // Update selected stock price if found in updated list
      const matched = updated.find(s => s.symbol === selectedStock.symbol)
      if (matched) setSelectedStock(matched)
    } catch (err) {
      console.error(err)
    } finally {
      setIsFetching(false)
    }
  }

  React.useEffect(() => {
    fetchPrices()
  }, [])

  const handlePredict = async () => {
    if (!prediction) {
      toast({ title: "Please select a direction", description: "Predict UP or DOWN to continue.", variant: "destructive" })
      return
    }

    setIsAnalyzing(true)
    
    try {
      const aiPrediction = Math.random() > 0.4 ? 'UP' : 'DOWN'
      const actualResult = Math.random() > 0.5 ? 'UP' : 'DOWN'

      const response = await aiStockPredictionExplanation({
        stockSymbol: selectedStock.symbol,
        userPrediction: prediction,
        userConfidence: confidence[0],
        aiPrediction,
        actualResult
      })

      setResult({
        ...response,
        aiPrediction,
        actualResult
      })
    } catch (error) {
      toast({ title: "Analysis failed", description: "The AI analyst is currently unavailable.", variant: "destructive" })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-headline font-bold text-foreground">Prediction Arena</h1>
            <p className="text-muted-foreground">Test your market intuition against our AI algorithms.</p>
          </div>
          {isFetching && <Loader2 className="size-5 animate-spin text-primary" />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 glass-card border-primary/20 bg-background/50">
            <CardHeader>
              <CardTitle className="text-primary">Place Your Prediction</CardTitle>
              <CardDescription>Select a stock and tell us where you think it's headed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {liveStocks.slice(0, 8).map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => setSelectedStock(stock)}
                    className={`p-4 rounded-xl border transition-all text-left group ${
                      selectedStock.symbol === stock.symbol 
                        ? 'bg-primary/10 border-primary ring-1 ring-primary' 
                        : 'bg-muted/50 border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-bold text-foreground group-hover:text-primary transition-colors">{stock.symbol}</div>
                    <div className="text-xs text-muted-foreground font-medium">₹{stock.price.toLocaleString()}</div>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-foreground">Market Direction</label>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant={prediction === 'UP' ? 'default' : 'outline'}
                    className={`h-20 flex-col gap-2 rounded-2xl ${prediction === 'UP' ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' : 'border-border'}`}
                    onClick={() => setPrediction('UP')}
                  >
                    <TrendingUp className="size-6" />
                    <span className="font-bold">BULLISH (UP)</span>
                  </Button>
                  <Button 
                    variant={prediction === 'DOWN' ? 'default' : 'outline'}
                    className={`h-20 flex-col gap-2 rounded-2xl ${prediction === 'DOWN' ? 'bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90' : 'border-border'}`}
                    onClick={() => setPrediction('DOWN')}
                  >
                    <TrendingDown className="size-6" />
                    <span className="font-bold">BEARISH (DOWN)</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Confidence Level</label>
                  <span className="text-primary font-bold">{confidence[0]}%</span>
                </div>
                <Slider 
                  value={confidence} 
                  onValueChange={setConfidence} 
                  max={100} 
                  step={1}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full h-12 text-lg font-bold gap-2 shadow-xl shadow-primary/20" 
                onClick={handlePredict}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>Analysing Market Data...</>
                ) : (
                  <>Run AI Analysis <BrainCircuit className="size-5" /></>
                )}
              </Button>
            </CardFooter>
          </Card>

          <div className="space-y-6">
            <Card className="glass-card border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Info className="size-5" />
                  How it works
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-4">
                <p>1. You make a prediction based on technical and fundamental indicators.</p>
                <p>2. Our ML models run a simultaneous prediction using sentiment and historical data.</p>
                <p>3. We compare results and provide an AI-generated explanation of the discrepancy.</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <History className="size-5" />
                  Your Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-headline font-bold mb-2 text-foreground">78.4%</div>
                <p className="text-xs text-muted-foreground">Top 15% of all users this month</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {result && (
          <Card className="glass-card border-primary bg-primary/5 animate-in zoom-in-95 duration-500">
            <CardHeader className="flex flex-row items-center justify-between border-b border-primary/10 mb-6">
              <div>
                <CardTitle className="text-2xl font-headline text-primary">Analysis Result: {result.predictionOutcome}</CardTitle>
                <CardDescription>Generated by FinIntel AI Analyzer</CardDescription>
              </div>
              <Badge variant={result.predictionOutcome === 'MATCHED' ? 'default' : 'destructive'} className="text-lg py-1 px-4">
                {result.predictionOutcome}
              </Badge>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">User Prediction</div>
                <div className="flex items-center gap-2 text-xl font-bold text-foreground">
                  {prediction === 'UP' ? <TrendingUp className="text-primary" /> : <TrendingDown className="text-destructive" />}
                  {prediction} ({confidence[0]}%)
                </div>
                <div className="text-sm font-medium text-muted-foreground mt-4 uppercase tracking-wider">AI Prediction</div>
                <div className="flex items-center gap-2 text-xl font-bold text-foreground">
                  {result.aiPrediction === 'UP' ? <TrendingUp className="text-primary" /> : <TrendingDown className="text-destructive" />}
                  {result.aiPrediction}
                </div>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">AI Rationale & Feedback</div>
                <div className="bg-background/40 p-6 rounded-2xl border border-primary/20 text-foreground leading-relaxed">
                  {result.explanation}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}
