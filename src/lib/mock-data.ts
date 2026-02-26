export const MOCK_USER = {
  name: "Alex Thompson",
  email: "alex@finintel.ai",
  avatar: "https://picsum.photos/seed/alex/200",
  balance: 24500.50,
  learningProgress: 65,
  predictionAccuracy: 78,
};

export const MOCK_INDICES = [
  { name: "NIFTY 50", value: "22,415.85", change: "+125.40", percent: "+0.56%", trend: "UP" },
  { name: "SENSEX", value: "73,806.15", change: "+412.10", percent: "+0.54%", trend: "UP" },
  { name: "BANK NIFTY", value: "47,286.40", change: "-85.20", percent: "-0.18%", trend: "DOWN" },
  { name: "IT INDEX", value: "35,120.90", change: "+210.15", percent: "+0.60%", trend: "UP" },
];

export const MOCK_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc.", price: 189.43, change: 1.25, trend: "UP" },
  { symbol: "TSLA", name: "Tesla, Inc.", price: 238.12, change: -2.4, trend: "DOWN" },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 485.50, change: 4.15, trend: "UP" },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 374.12, change: 0.85, trend: "UP" },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.10, change: -0.15, trend: "DOWN" },
];

export const MOCK_LEARNING_MODULES = [
  {
    id: "m1",
    title: "Stock Market Basics",
    description: "Learn the fundamentals of how markets work and basic terminology.",
    lessons: 5,
    completed: 5,
    image: "https://picsum.photos/seed/market/400/300"
  },
  {
    id: "m2",
    title: "Risk Management",
    description: "Master the art of protecting your capital through proven strategies.",
    lessons: 4,
    completed: 2,
    image: "https://picsum.photos/seed/risk/400/300"
  },
  {
    id: "m3",
    title: "Portfolio Diversification",
    description: "Avoid putting all your eggs in one basket with smart allocation.",
    lessons: 6,
    completed: 0,
    image: "https://picsum.photos/seed/diversify/400/300"
  },
  {
    id: "m4",
    title: "Market Psychology",
    description: "Understand the emotional cycles of bull and bear markets.",
    lessons: 4,
    completed: 0,
    image: "https://picsum.photos/seed/psych/400/300"
  }
];

export const MOCK_NEWS = [
  {
    id: "n1",
    title: "Fed Signals Potential Rate Cuts by Mid-2024",
    source: "Bloomberg",
    time: "2h ago",
    sentiment: "POSITIVE",
    score: 82,
  },
  {
    id: "n2",
    title: "Tech Sector Faces Regulatory Headwinds in Europe",
    source: "Reuters",
    time: "4h ago",
    sentiment: "NEGATIVE",
    score: 45,
  },
  {
    id: "n3",
    title: "Gold Hits New High as Investors Seek Safety",
    source: "CNBC",
    time: "6h ago",
    sentiment: "NEUTRAL",
    score: 60,
  }
];

export const MOCK_PORTFOLIO = {
  holdings: [
    { symbol: "AAPL", quantity: 15, purchasePrice: 150.25, currentPrice: 189.43 },
    { symbol: "MSFT", quantity: 10, purchasePrice: 310.50, currentPrice: 374.12 },
    { symbol: "NVDA", quantity: 5, purchasePrice: 220.00, currentPrice: 485.50 },
    { symbol: "TSLA", quantity: 20, purchasePrice: 260.00, currentPrice: 238.12 },
  ],
  assetAllocation: [
    { assetClass: "Equities", percentage: 75 },
    { assetClass: "Fixed Income", percentage: 15 },
    { assetClass: "Cash", percentage: 10 },
  ],
  sectorDiversification: [
    { sector: "Technology", percentage: 60 },
    { sector: "Consumer Discretionary", percentage: 20 },
    { sector: "Financials", percentage: 10 },
    { sector: "Others", percentage: 10 },
  ],
  riskScore: 68
};