'use server';
/**
 * @fileOverview An AI financial advisor chatbot that provides personalized advice based on real-time market data.
 *
 * - aiFinancialStrategyAdvisor - A function that handles the AI financial advisor chat process.
 * - AiFinancialAdvisorInput - The input type for the aiFinancialStrategyAdvisor function.
 * - AiFinancialAdvisorOutput - The return type for the aiFinancialStrategyAdvisor function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FINNHUB_API_KEY = "d6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110";

// --- Tools for Real-Time Finance Data ---

const getStockQuote = ai.defineTool(
  {
    name: 'getStockQuote',
    description: 'Get the current real-time stock price and quote for a specific ticker symbol.',
    inputSchema: z.object({
      symbol: z.string().describe('The stock ticker symbol (e.g., AAPL, NVDA, RELIANCE).'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    try {
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${input.symbol.toUpperCase()}&token=${FINNHUB_API_KEY}`);
      if (!res.ok) return { error: "Failed to fetch quote" };
      return res.json();
    } catch (e) {
      return { error: "Service unavailable" };
    }
  }
);

const getCompanyProfile = ai.defineTool(
  {
    name: 'getCompanyProfile',
    description: 'Get basic company information, market cap, industry, and headquarters details.',
    inputSchema: z.object({
      symbol: z.string().describe('The stock ticker symbol.'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    try {
      const res = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${input.symbol.toUpperCase()}&token=${FINNHUB_API_KEY}`);
      if (!res.ok) return { error: "Failed to fetch profile" };
      return res.json();
    } catch (e) {
      return { error: "Service unavailable" };
    }
  }
);

const getMarketNews = ai.defineTool(
  {
    name: 'getMarketNews',
    description: 'Get the latest general market news or news for a specific category.',
    inputSchema: z.object({
      category: z.enum(['general', 'forex', 'crypto', 'merger']).default('general').describe('The news category.'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    try {
      const res = await fetch(`https://finnhub.io/api/v1/news?category=${input.category}&token=${FINNHUB_API_KEY}`);
      if (!res.ok) return { error: "Failed to fetch news" };
      const data = await res.json();
      return data.slice(0, 5); // Return top 5 headlines
    } catch (e) {
      return { error: "Service unavailable" };
    }
  }
);

const getCompanyNews = ai.defineTool(
  {
    name: 'getCompanyNews',
    description: 'Get recent news headlines specifically for a given stock symbol.',
    inputSchema: z.object({
      symbol: z.string().describe('The stock ticker symbol.'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const res = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${input.symbol.toUpperCase()}&from=${weekAgo}&to=${today}&token=${FINNHUB_API_KEY}`);
      if (!res.ok) return { error: "Failed to fetch company news" };
      const data = await res.json();
      return data.slice(0, 5);
    } catch (e) {
      return { error: "Service unavailable" };
    }
  }
);

// --- Flow Implementation ---

const AiFinancialAdvisorInputSchema = z.object({
  userQuery: z.string().describe("The user's question or request for the financial advisor."),
  portfolioData: z.string().optional().describe("JSON string representing the user's investment portfolio data."),
  predictionHistory: z.string().optional().describe("JSON string representing the user's stock prediction history."),
  newsSentiment: z.string().optional().describe("JSON string summarizing the user's relevant financial news sentiment."),
  learningProgress: z.string().optional().describe("JSON string indicating the user's financial learning progress."),
});
export type AiFinancialAdvisorInput = z.infer<typeof AiFinancialAdvisorInputSchema>;

const AiFinancialAdvisorOutputSchema = z.object({
  response: z.string().describe("The AI financial advisor's response, advice, or explanation."),
});
export type AiFinancialAdvisorOutput = z.infer<typeof AiFinancialAdvisorOutputSchema>;

export async function aiFinancialStrategyAdvisor(input: AiFinancialAdvisorInput): Promise<AiFinancialAdvisorOutput> {
  return aiFinancialStrategyAdvisorFlow(input);
}

const aiFinancialAdvisorPrompt = ai.definePrompt({
  name: 'aiFinancialAdvisorPrompt',
  input: { schema: AiFinancialAdvisorInputSchema },
  output: { schema: AiFinancialAdvisorOutputSchema },
  tools: [getStockQuote, getCompanyProfile, getMarketNews, getCompanyNews],
  system: `You are FinIntel AI, a high-performance Financial Strategy Advisor.
Your core mission is to provide data-driven, professional, and actionable financial advice.

KEY GUIDELINES:
1. USE TOOLS: You have access to the Finnhub Real-Time API. Whenever a user asks about a specific stock, price, or market news, use the tools to fetch the LATEST data. Do not rely on your internal knowledge for current prices or news.
2. CONTEXTUAL AWARENESS: Consider the user's portfolio and history if provided, but prioritize fresh market data.
3. TONE: Professional, analytical, yet encouraging.
4. DISCLAIMER: Always remind users that your analysis is for educational purposes and not professional financial advice.
5. FORMATTING: Use Markdown for clarity. Use bold for stock symbols and prices.

If the user asks for a price of a stock not in your local mock data, search for it using the tools.`,
  prompt: `
User's Query: {{{userQuery}}}

User's Background Context:
- Portfolio: {{{portfolioData}}}
- History: {{{predictionHistory}}}
- Learning Progress: {{{learningProgress}}}

Based on the tools available and the user context, provide a comprehensive response.`,
});

const aiFinancialStrategyAdvisorFlow = ai.defineFlow(
  {
    name: 'aiFinancialStrategyAdvisorFlow',
    inputSchema: AiFinancialAdvisorInputSchema,
    outputSchema: AiFinancialAdvisorOutputSchema,
  },
  async (input) => {
    const { output } = await aiFinancialAdvisorPrompt(input);
    return output!;
  }
);
