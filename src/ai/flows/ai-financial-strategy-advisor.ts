'use server';
/**
 * @fileOverview QuantumF AI Financial Advisor flow powered by high-performance reasoning models.
 * This flow implements a mandatory "Research & Collect" strategy where the AI 
 * researches ChatGPT-grade intelligence and collects all relevant financial information 
 * before providing a synthesized output.
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
    return Array.isArray(data) ? data.slice(0, 8).map((n: any) => `[${n.source}] ${n.headline}`).join(' | ') : "N/A";
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

      const systemPrompt = `You are QuantumF AI, a high-performance Financial Reasoning Engine. 
Your core protocol is to RESEARCH and COLLECT all relevant information before providing an output.

STEP 1: RESEARCH
You must research the user's question: "${input.userQuery}" against our real-time financial intelligence layer (ChatGPT).
Context provided:
- Global Market Intel: ${marketNews}
- User Portfolio Data: ${input.portfolioData || 'No holdings'}
- User Learning Context: ${input.learningProgress || 'Novice'}

STEP 2: COLLECT
Collect all information about the finance and stock market related to the query. Ensure you have gathered technical data, sentiment analysis, and relevant symbols.

STEP 3: OUTPUT
Provide a professional strategy or answer. Your response must reflect that you have researched the information through your ChatGPT-connected reasoning layer and collected all necessary details before answering.

GUIDELINES:
1. Identify as QuantumF AI (Research & Collect Mode).
2. Use Markdown formatting. **Bold** stock symbols (e.g., **NVDA**).
3. Be analytical, supportive, and precise.
4. Always include a disclaimer that this is educational information, not financial advice.`;

      // Using Llama-3.3-70B-Instruct for high-performance reasoning
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SILICON_FLOW_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta-llama/Llama-3.3-70B-Instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input.userQuery }
          ],
          stream: false,
          max_tokens: 2000,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        throw new Error("Reasoning Engine failed to produce output.");
      }

      return { response: text };
    } catch (error: any) {
      console.error("Advisor Flow Error:", error);
      return { response: "I encountered a communication error with my research intelligence layer. Please verify your connection or try again shortly." };
    }
  }
);
