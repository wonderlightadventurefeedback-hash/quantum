'use server';
/**
 * @fileOverview An AI financial advisor chatbot powered by OpenAI GPT-4o (ChatGPT) 
 * that provides personalized advice based on real-time market data from Finnhub.
 *
 * - aiFinancialStrategyAdvisor - A function that handles the AI financial advisor chat process.
 * - AiFinancialAdvisorInput - The input type for the aiFinancialStrategyAdvisor function.
 * - AiFinancialAdvisorOutput - The return type for the aiFinancialStrategyAdvisor function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import OpenAI from 'openai';

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'd6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110';

// --- Tools for Real-Time Finance Data ---

async function getStockQuote(symbol: string) {
  try {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${FINNHUB_API_KEY}`);
    if (!res.ok) return { error: "Failed to fetch quote" };
    return res.json();
  } catch (e) {
    return { error: "Service unavailable" };
  }
}

async function getCompanyProfile(symbol: string) {
  try {
    const res = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol.toUpperCase()}&token=${FINNHUB_API_KEY}`);
    if (!res.ok) return { error: "Failed to fetch profile" };
    return res.json();
  } catch (e) {
    return { error: "Service unavailable" };
  }
}

async function getMarketNews(category: 'general' | 'forex' | 'crypto' | 'merger' = 'general') {
  try {
    const res = await fetch(`https://finnhub.io/api/v1/news?category=${category}&token=${FINNHUB_API_KEY}`);
    if (!res.ok) return { error: "Failed to fetch news" };
    const data = await res.json();
    return Array.isArray(data) ? data.slice(0, 5) : { error: "Invalid response" };
  } catch (e) {
    return { error: "Service unavailable" };
  }
}

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

const aiFinancialStrategyAdvisorFlow = ai.defineFlow(
  {
    name: 'aiFinancialStrategyAdvisorFlow',
    inputSchema: AiFinancialAdvisorInputSchema,
    outputSchema: AiFinancialAdvisorOutputSchema,
  },
  async (input) => {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      return { response: "I'm currently missing my OpenAI Intelligence Key. To activate ChatGPT reasoning, please add **OPENAI_API_KEY** to your Vercel Environment Variables. In the meantime, I can still provide real-time data visualization on your dashboard!" };
    }

    try {
      // Initialize OpenAI client inside the flow to prevent module-level evaluation crashes
      const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
      });

      const messages: any[] = [
        {
          role: 'system',
          content: `You are FinIntel AI, a high-performance Financial Strategy Advisor powered by ChatGPT (GPT-4o).
Your core mission is to provide data-driven, professional, and actionable financial advice covering ALL areas of personal and professional finance.

AREAS OF EXPERTISE:
- Stock Market Analysis (Live technical and fundamental data)
- Portfolio Diversification & Risk Management
- Retirement Planning & Wealth Building
- Tax Strategy & Financial Optimization
- Technical Education (explaining complex instruments like F&O, Bonds, or ETFs)

KEY GUIDELINES:
1. USE TOOLS: You have access to real-time market data. Always check latest prices if asked about symbols.
2. PERSONALIZED: Reference the user's portfolio context: ${input.portfolioData || 'No portfolio data provided'}.
3. TONE: Professional, analytical, and supportive.
4. DISCLAIMER: Always mention that this is for educational purposes and not professional financial advice.
5. FORMATTING: Use Markdown with bolding for tickers and figures.`
        },
        {
          role: 'user',
          content: input.userQuery
        }
      ];

      const tools = [
        {
          type: 'function',
          function: {
            name: 'get_stock_quote',
            description: 'Get real-time price for a stock symbol',
            parameters: {
              type: 'object',
              properties: { symbol: { type: 'string' } },
              required: ['symbol']
            }
          }
        },
        {
          type: 'function',
          function: {
            name: 'get_market_news',
            description: 'Get latest general market news',
            parameters: {
              type: 'object',
              properties: { category: { type: 'string', enum: ['general', 'crypto'] } }
            }
          }
        }
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools: tools as any,
        tool_choice: 'auto',
      });

      const responseMessage = response.choices[0].message;

      if (responseMessage.tool_calls) {
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          let toolResult;

          if (functionName === 'get_stock_quote') {
            toolResult = await getStockQuote(functionArgs.symbol);
          } else if (functionName === 'get_market_news') {
            toolResult = await getMarketNews(functionArgs.category);
          }

          messages.push(responseMessage);
          messages.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: functionName,
            content: JSON.stringify(toolResult),
          });
        }

        const secondResponse = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
        });

        return { response: secondResponse.choices[0].message.content || "I processed the data but couldn't generate a text response." };
      }

      return { response: responseMessage.content || "I'm here to help with your financial questions." };
    } catch (error: any) {
      console.error("Advisor Flow Error:", error);
      return { response: "I encountered an error while communicating with ChatGPT. Please verify that your **OPENAI_API_KEY** is valid and has sufficient credits." };
    }
  }
);
