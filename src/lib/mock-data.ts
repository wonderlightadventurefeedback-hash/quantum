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
  { symbol: "SBLI", name: "SBL Infratech Limited", price: 42.60, change: 20.00, trend: "UP", category: "Stocks" },
  { symbol: "SBRANDS", name: "Sanghvi Brands Ltd.", price: 10.98, change: 20.00, trend: "UP", category: "Stocks" },
  { symbol: "TARMAT", name: "Tarmat Ltd.", price: 64.89, change: 19.99, trend: "UP", category: "Stocks" },
  { symbol: "XTGLOBAL", name: "XTGlobal Infotech Ltd.", price: 33.63, change: 19.98, trend: "UP", category: "Stocks" },
  { symbol: "RUDRA", name: "Rudra Global Infra Products L...", price: 21.40, change: 19.96, trend: "UP", category: "Stocks" },
  { symbol: "SHANTIDENM", name: "Shanti Spintex Ltd.", price: 68.75, change: 19.57, trend: "UP", category: "Stocks" },
  { symbol: "RMDRIP", name: "R M Drip And Sprinklers Syste...", price: 78.36, change: -20.00, trend: "DOWN", category: "Stocks" },
  { symbol: "SIROHIA", name: "Sirohia & Sons Ltd", price: 4.82, change: -19.67, trend: "DOWN", category: "Stocks" },
  { symbol: "SOFCOM", name: "Sofcom Systems Ltd.", price: 22.49, change: -18.28, trend: "DOWN", category: "Stocks" },
  { symbol: "TGIF", name: "TGIF Agribusiness Ltd.", price: 70.50, change: -18.02, trend: "DOWN", category: "Stocks" },
  { symbol: "LLFICL", name: "Leading Leasing Finance & In...", price: 2.31, change: -17.79, trend: "DOWN", category: "Stocks" },
  { symbol: "ANNVRPP", name: "Annvriddhi Ventures Ltd TEMP", price: 2.42, change: -16.55, trend: "DOWN", category: "Stocks" },
  { symbol: "AMZN", name: "Amazon.com", price: 175.35, change: 1.12, trend: "UP", category: "US Stocks" },
  { symbol: "META", name: "Meta Platforms", price: 485.58, change: 2.34, trend: "UP", category: "US Stocks" },
  { symbol: "BRK.B", name: "Berkshire Hathaway", price: 405.12, change: -0.45, trend: "DOWN", category: "US Stocks" },
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
