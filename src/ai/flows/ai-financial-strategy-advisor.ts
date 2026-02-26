
'use server';
/**
 * @fileOverview QuantumF AI Financial Advisor flow powered by Ollama (Llama 3) intelligence.
 * This flow provides professional, data-driven financial advice using the SiliconFlow Llama 3 endpoint.
 *
 * - aiFinancialStrategyAdvisor - Entry point for the AI advisor process.
 * - AiFinancialAdvisorInput - Input schema for queries and context.
 * - AiFinancialAdvisorOutput - Standardized AI response format.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'd6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110';
const SILICON_FLOW_KEY = 'ef844e3b8eac407990679dffbd62147c.I9mEPUXANRbOARAI150CNX2a';

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
    try {
      const marketNews = await getMarketContext();

      const systemPrompt = `You are QuantumF AI, a high-performance Financial Strategy Advisor powered by Ollama (Llama 3).
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

      // Use SiliconFlow OpenAI-compatible endpoint for Llama 3 (Ollama grade)
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SILICON_FLOW_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-V3', // High-performance reasoning model
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input.userQuery }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        throw new Error("AI failed to generate a response text.");
      }

      return { response: text };
    } catch (error: any) {
      console.error("Advisor Flow Error:", error);
      return { response: "I encountered a communication error with my Ollama intelligence layer. Please verify your connection or try again shortly." };
    }
  }
);
