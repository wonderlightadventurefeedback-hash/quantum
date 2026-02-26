'use server';
/**
 * @fileOverview An AI financial advisor chatbot powered by RapidAPI Llama.
 * This flow provides expert answers on the stock market and finance.
 *
 * - aiFinancialStrategyAdvisor - A function that handles the AI financial advisor chat process.
 * - AiFinancialAdvisorInput - The input type for the aiFinancialStrategyAdvisor function.
 * - AiFinancialAdvisorOutput - The return type for the aiFinancialStrategyAdvisor function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'd6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110';

// --- Tools for Real-Time Finance Data ---

async function getMarketNews() {
  try {
    const res = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`);
    if (!res.ok) return { error: "Failed to fetch news" };
    const data = await res.json();
    return Array.isArray(data) ? data.slice(0, 3) : { error: "Invalid response" };
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
    // RapidAPI Key provided by user
    const API_KEY = process.env.RAPIDAPI_KEY || 'ef844e3b8eac407990679dffbd62147c.I9mEPUXANRbOARAI150CNX2a';

    try {
      // Prefetch some market context to make the AI "Expert"
      const news = await getMarketNews();
      const newsSummary = Array.isArray(news) ? news.map((n: any) => n.headline).join(' | ') : "N/A";

      const systemPrompt = `You are FinIntel AI, a high-performance Financial Strategy Advisor directly connected to ChatGPT intelligence. 
Your core mission is to provide data-driven, professional, and actionable financial advice covering stock markets and personal finance.

CURRENT MARKET CONTEXT:
Latest News: ${newsSummary}
User Portfolio: ${input.portfolioData || 'No active holdings'}

KEY GUIDELINES:
1. PERSONALIZED: Reference the user's portfolio context.
2. TONE: Professional, analytical, and supportive.
3. DISCLAIMER: Always mention that this is for educational purposes and not professional financial advice.
4. FORMATTING: Use Markdown with bolding for tickers and figures.`;

      const response = await fetch('https://open-ai21.p.rapidapi.com/conversationllama', {
        method: 'POST',
        headers: {
          'x-rapidapi-host': 'open-ai21.p.rapidapi.com',
          'x-rapidapi-key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { 
              role: 'user', 
              content: `${systemPrompt}\n\nUSER QUESTION: ${input.userQuery}` 
            }
          ],
          web_access: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("RapidAPI Error:", errorText);
        throw new Error(`Intelligence Layer Unavailable (Status: ${response.status})`);
      }

      const result = await response.json();
      
      // Handle the common RapidAPI open-ai21 response format
      const botResponse = result.BOT || result.result || result.response || "I have analyzed the market data but could not generate a textual response. Please try asking about a specific stock symbol.";

      return { response: botResponse };
    } catch (error: any) {
      console.error("Advisor Flow Error:", error);
      return { response: "I'm having difficulty connecting to my ChatGPT intelligence layer right now. Please ensure your configuration is active or try again in a few moments." };
    }
  }
);
