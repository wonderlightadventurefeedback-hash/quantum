
'use server';
/**
 * @fileOverview QuantumF AI Financial Advisor flow powered by RapidAPI ChatGPT integration.
 * This flow provides professional, data-driven financial advice.
 *
 * - aiFinancialStrategyAdvisor - Entry point for the AI advisor process.
 * - AiFinancialAdvisorInput - Input schema for queries and context.
 * - AiFinancialAdvisorOutput - Standardized AI response format.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'd6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110';

async function getMarketContext() {
  try {
    const res = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`);
    if (!res.ok) return "N/A";
    const data = await res.json();
    return Array.isArray(data) ? data.slice(0, 5).map((n: any) => n.headline).join(' | ') : "N/A";
  } catch (e) {
    return "N/A";
  }
}

const AiFinancialAdvisorInputSchema = z.object({
  userQuery: z.string().describe("The user's question or request."),
  portfolioData: z.string().optional().describe("User's investment portfolio context."),
  learningProgress: z.string().optional().describe("User's educational status."),
});
export type AiFinancialAdvisorInput = z.infer<typeof AiFinancialAdvisorInputSchema>;

const AiFinancialAdvisorOutputSchema = z.object({
  response: z.string().describe("The AI advisor's professional response."),
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
    const API_KEY = process.env.RAPIDAPI_KEY || 'ef844e3b8eac407990679dffbd62147c.I9mEPUXANRbOARAI150CNX2a';

    try {
      const marketNews = await getMarketContext();

      const systemPrompt = `You are QuantumF AI, a high-performance Financial Strategy Advisor directly connected to OpenAI intelligence via ChatGPT. 
Your mission is to provide professional, data-driven financial advice for QuantumF platform users.

REAL-TIME CONTEXT:
Latest Headlines: ${marketNews}
User Portfolio: ${input.portfolioData || 'No active holdings'}
Learning Status: ${input.learningProgress || 'Just starting'}

GUIDELINES:
1. QUANTUMF BRAND: Always identify as QuantumF AI.
2. PROFESSIONAL: Use clear, analytical, and supportive language.
3. CONTEXTUAL: Reference the user's portfolio if provided.
4. DISCLAIMER: Always state that this is for educational purposes and not official financial advice.
5. FORMATTING: Use Markdown. Bold stock tickers (e.g., **AAPL**, **NVDA**).`;

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
              content: `${systemPrompt}\n\nUSER QUERY: ${input.userQuery}` 
            }
          ],
          web_access: false
        })
      });

      if (!response.ok) throw new Error("RapidAPI Service Unavailable");

      const result = await response.json();
      
      // Handle various response keys from RapidAPI Llama endpoints
      const botResponse = result.BOT || result.result || result.response || result.output || "I have processed your request but could not generate a text response. Please try asking about a specific market sector.";

      return { response: botResponse };
    } catch (error: any) {
      console.error("Advisor Flow Error:", error);
      return { response: "I encountered a communication error with my premium ChatGPT intelligence layer. Please verify your connection or try again shortly." };
    }
  }
);
