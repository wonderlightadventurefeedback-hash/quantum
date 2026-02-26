export const MOCK_USER = {
  name: "Alex Thompson",
  email: "alex@finintel.ai",
  avatar: "https://picsum.photos/seed/alex/200",
  balance: 50000.00,
  learningProgress: 65,
  predictionAccuracy: 78,
};

export const MOCK_INDICES = [
  { name: "NIFTY 50", value: "22,415.85", change: "+125.40", percent: "+0.56%", trend: "UP" },
  { name: "SENSEX", value: "73,806.15", change: "+412.10", percent: "+0.54%", trend: "UP" },
  { name: "NASDAQ 100", value: "18,210.30", change: "+155.20", percent: "+0.86%", trend: "UP" },
  { name: "S&P 500", value: "5,137.08", change: "+40.22", percent: "+0.80%", trend: "UP" },
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
    symbol: "AAPL", 
    name: "Apple Inc.", 
    price: 189.43, 
    change: 1.15, 
    trend: "UP", 
    category: "US Stocks", 
    volume: "52.4M",
    sparklineData: [{value: 185}, {value: 187}, {value: 186}, {value: 188}, {value: 189}]
  },
  { 
    symbol: "MSFT", 
    name: "Microsoft Corp.", 
    price: 415.50, 
    change: 0.85, 
    trend: "UP", 
    category: "US Stocks", 
    volume: "21.5M",
    sparklineData: [{value: 410}, {value: 412}, {value: 411}, {value: 414}, {value: 415}]
  },
  { 
    symbol: "NVDA", 
    name: "NVIDIA Corporation", 
    price: 875.25, 
    change: 3.42, 
    trend: "UP", 
    category: "US Stocks", 
    volume: "41.0M",
    sparklineData: [{value: 840}, {value: 855}, {value: 860}, {value: 870}, {value: 875}]
  },
  { 
    symbol: "TSLA", 
    name: "Tesla, Inc.", 
    price: 175.20, 
    change: -2.15, 
    trend: "DOWN", 
    category: "US Stocks", 
    volume: "85.0M",
    sparklineData: [{value: 180}, {value: 178}, {value: 179}, {value: 176}, {value: 175}]
  },
  { 
    symbol: "GOOGL", 
    name: "Alphabet Inc.", 
    price: 152.12, 
    change: 1.45, 
    trend: "UP", 
    category: "US Stocks", 
    volume: "28.0M",
    sparklineData: [{value: 148}, {value: 150}, {value: 149}, {value: 151}, {value: 152}]
  },
  { 
    symbol: "META", 
    name: "Meta Platforms", 
    price: 485.58, 
    change: 2.34, 
    trend: "UP", 
    category: "US Stocks", 
    volume: "21.0M",
    sparklineData: [{value: 470}, {value: 475}, {value: 480}, {value: 478}, {value: 482}, {value: 485}]
  },
  { 
    symbol: "AMZN", 
    name: "Amazon.com Inc.", 
    price: 175.35, 
    change: 1.12, 
    trend: "UP", 
    category: "US Stocks", 
    volume: "45.0M",
    sparklineData: [{value: 170}, {value: 172}, {value: 171}, {value: 174}, {value: 173}, {value: 175}]
  },
  { 
    symbol: "NFLX", 
    name: "Netflix, Inc.", 
    price: 610.45, 
    change: 0.95, 
    trend: "UP", 
    category: "US Stocks", 
    volume: "540K",
    sparklineData: [{value: 600}, {value: 605}, {value: 602}, {value: 608}, {value: 610}]
  },
  { 
    symbol: "RELIANCE", 
    name: "Reliance Industries", 
    price: 2980.45, 
    change: -1.20, 
    trend: "DOWN", 
    category: "Stocks", 
    volume: "5.4M",
    sparklineData: [{value: 3020}, {value: 3010}, {value: 3000}, {value: 3015}, {value: 2990}, {value: 2980}]
  },
  { 
    symbol: "TATAMOTORS", 
    name: "Tata Motors Passenger", 
    price: 391.55, 
    change: 2.54, 
    trend: "UP", 
    category: "Stocks", 
    volume: "14.6M",
    sparklineData: [{value: 370}, {value: 375}, {value: 385}, {value: 380}, {value: 390}, {value: 391}]
  },
  { 
    symbol: "HDFCBANK", 
    name: "HDFC Bank Ltd.", 
    price: 1450.20, 
    change: 0.45, 
    trend: "UP", 
    category: "Stocks", 
    volume: "12.8M",
    sparklineData: [{value: 1440}, {value: 1445}, {value: 1448}, {value: 1452}, {value: 1450}]
  },
  { 
    symbol: "INFY", 
    name: "Infosys Limited", 
    price: 1612.35, 
    change: -0.85, 
    trend: "DOWN", 
    category: "Stocks", 
    volume: "8.2M",
    sparklineData: [{value: 1630}, {value: 1625}, {value: 1620}, {value: 1615}, {value: 1612}]
  },
  { 
    symbol: "AMD", 
    name: "Advanced Micro Devices", 
    price: 180.20, 
    change: 2.15, 
    trend: "UP", 
    category: "US Stocks", 
    volume: "62.4M",
    sparklineData: [{value: 175}, {value: 178}, {value: 177}, {value: 181}, {value: 180}]
  }
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
