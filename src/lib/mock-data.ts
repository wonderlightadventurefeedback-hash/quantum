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

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  trend: "UP" | "DOWN";
  category: "Stocks" | "US Stocks";
  volume: string;
  sparklineData: { value: number }[];
}

export const MOCK_STOCKS: Stock[] = [
  { 
    symbol: "BOB", 
    name: "Bank of Baroda", 
    price: 324.45, 
    change: 2.72, 
    trend: "UP", 
    category: "Stocks", 
    volume: "2,05,02,406",
    sparklineData: [{value: 300}, {value: 310}, {value: 305}, {value: 320}, {value: 315}, {value: 324}]
  },
  { 
    symbol: "TATAMOTORS", 
    name: "Tata Motors Passenger", 
    price: 391.55, 
    change: 2.54, 
    trend: "UP", 
    category: "Stocks", 
    volume: "1,46,97,484",
    sparklineData: [{value: 370}, {value: 375}, {value: 385}, {value: 380}, {value: 390}, {value: 391}]
  },
  { 
    symbol: "EICHERMOT", 
    name: "Eicher Motors", 
    price: 8190.00, 
    change: 2.27, 
    trend: "UP", 
    category: "Stocks", 
    volume: "4,27,401",
    sparklineData: [{value: 8000}, {value: 8050}, {value: 8100}, {value: 8080}, {value: 8150}, {value: 8190}]
  },
  { 
    symbol: "BEL", 
    name: "Bharat Electronics", 
    price: 449.05, 
    change: 2.22, 
    trend: "UP", 
    category: "Stocks", 
    volume: "1,37,38,213",
    sparklineData: [{value: 430}, {value: 435}, {value: 440}, {value: 438}, {value: 445}, {value: 449}]
  },
  { 
    symbol: "SOLARINDS", 
    name: "Solar Industries", 
    price: 13755.00, 
    change: 2.20, 
    trend: "UP", 
    category: "Stocks", 
    volume: "1,48,694",
    sparklineData: [{value: 13400}, {value: 13500}, {value: 13600}, {value: 13550}, {value: 13700}, {value: 13755}]
  },
  { 
    symbol: "ZYDUSLIFE", 
    name: "Zydus", 
    price: 938.50, 
    change: 2.05, 
    trend: "UP", 
    category: "Stocks", 
    volume: "14,36,917",
    sparklineData: [{value: 910}, {value: 920}, {value: 915}, {value: 925}, {value: 930}, {value: 938}]
  },
  { 
    symbol: "RELIANCE", 
    name: "Reliance Industries", 
    price: 2980.45, 
    change: -1.20, 
    trend: "DOWN", 
    category: "Stocks", 
    volume: "54,23,102",
    sparklineData: [{value: 3020}, {value: 3010}, {value: 3000}, {value: 3015}, {value: 2990}, {value: 2980}]
  },
  { 
    symbol: "AMZN", 
    name: "Amazon.com Inc.", 
    price: 175.35, 
    change: 1.12, 
    trend: "UP", 
    category: "US Stocks", 
    volume: "4,50,00,000",
    sparklineData: [{value: 170}, {value: 172}, {value: 171}, {value: 174}, {value: 173}, {value: 175}]
  },
  { 
    symbol: "META", 
    name: "Meta Platforms", 
    price: 485.58, 
    change: 2.34, 
    trend: "UP", 
    category: "US Stocks", 
    volume: "2,10,00,000",
    sparklineData: [{value: 470}, {value: 475}, {value: 480}, {value: 478}, {value: 482}, {value: 485}]
  },
];

export const MOCK_MUTUAL_FUNDS = [
  { id: "mf1", name: "BlueChip Growth Fund", nav: 145.20, returns: "18.5%", risk: "High", category: "Mutual Funds" },
  { id: "mf2", name: "Balanced Hybrid Fund", nav: 82.45, returns: "12.2%", risk: "Moderate", category: "Mutual Funds" },
  { id: "mf3", name: "Tax Saver ELSS", nav: 210.10, returns: "22.1%", risk: "High", category: "Mutual Funds" },
  { id: "mf4", name: "Liquid Debt Fund", nav: 34.50, returns: "6.8%", risk: "Low", category: "Mutual Funds" },
];

export const MOCK_FIXED_DEPOSITS = [
  { id: "fd1", bank: "HDFC Bank", rate: "7.1%", tenure: "1-3 Years", category: "Fixed Deposits" },
  { id: "fd2", bank: "ICICI Bank", rate: "7.25%", tenure: "2-5 Years", category: "Fixed Deposits" },
  { id: "fd3", bank: "SBI Bank", rate: "6.8%", tenure: "Above 5 Years", category: "Fixed Deposits" },
  { id: "fd4", bank: "Axis Bank", rate: "7.4%", tenure: "Standard", category: "Fixed Deposits" },
];

export const MOCK_LEARNING_MODULES = [
  {
    id: "m1",
    title: "Stock Market Basics",
    category: "Markets",
    description: "Learn the fundamentals of how markets work and basic terminology.",
    lessons: 5,
    completed: 5,
    image: "https://picsum.photos/seed/market/400/300"
  },
  {
    id: "m2",
    title: "Technical Analysis 101",
    category: "Trading",
    description: "Master chart patterns, indicators, and price action strategies.",
    lessons: 8,
    completed: 3,
    image: "https://picsum.photos/seed/trading/400/300"
  },
  {
    id: "m3",
    title: "Portfolio Diversification",
    category: "Investing",
    description: "Avoid putting all your eggs in one basket with smart asset allocation.",
    lessons: 6,
    completed: 0,
    image: "https://picsum.photos/seed/diversify/400/300"
  },
  {
    id: "m4",
    title: "Risk Management",
    category: "Trading",
    description: "Learn how to protect your capital and manage position sizes effectively.",
    lessons: 4,
    completed: 2,
    image: "https://picsum.photos/seed/risk/400/300"
  },
  {
    id: "m5",
    title: "Financial Planning",
    category: "Finance",
    description: "Structured path to budgeting, saving, and long-term wealth building.",
    lessons: 10,
    completed: 1,
    image: "https://picsum.photos/seed/finance/400/300"
  },
  {
    id: "m6",
    title: "Options Strategy",
    category: "Trading",
    description: "Advanced strategies for calls, puts, and complex derivative spreads.",
    lessons: 12,
    completed: 0,
    image: "https://picsum.photos/seed/options/400/300"
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
