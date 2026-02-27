'use server';
/**
 * @fileOverview QuantumF AI Financial Advisor flow.
 * Implements a mandatory "Research & Collect" strategy where the AI 
 * analyzes, researches, and gathers intelligence through Gemini reasoning before providing an output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || 'd6g3c49r01qqnmbqk10gd6g3c49r01qqnmbqk110';

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
      // PHASE 1: RESEARCH MARKET CONTEXT
      const marketNews = await getMarketContext();

      // PHASE 2: EXECUTE RESEARCH & COLLECT PROTOCOL VIA GEMINI
      const { text } = await ai.generate({
        model: 'googleai/gemini-1.5-pro',
        system: `You are QuantumF AI, powered by high-performance Gemini reasoning.
Your core protocol is to RESEARCH and COLLECT all relevant information before providing any financial output.

MANDATORY EXECUTION PROTOCOL:
STEP 1: ANALYZE
Deconstruct the user's query: "${input.userQuery}". Identify the core financial intent and specific symbols involved.

STEP 2: RESEARCH
Cross-reference the query against our real-time feeds and context:
- Global Market Intelligence: ${marketNews}
- User Portfolio Context: ${input.portfolioData || 'No active holdings'}
- User Knowledge Level: ${input.learningProgress || 'Calibrating'}

STEP 3: COLLECT DATA
Gather all information about technical indicators, market sentiment, sector trends, and fundamental risks related to the query through your internal Gemini research layer.

STEP 4: OUTPUT
Provide a professional strategy. Your response MUST reflect that you have analyzed the question and collected all necessary details through your research layer before answering.

GUIDELINES:
1. Identify as QuantumF AI (Research & Collect Mode Active).
2. Use professional Markdown formatting. **Bold** stock symbols (e.g., **NVDA**).
3. Be analytical, supportive, and precise.
4. Always include a disclaimer: "This is educational research, not financial advice."`,
        prompt: input.userQuery,
      });

      if (!text) {
        throw new Error("Gemini Reasoning Engine failed to produce output.");
      }

      return { response: text };
    } catch (error: any) {
      console.error("Advisor Flow Error:", error);
      return { response: "I encountered a communication error with my Gemini research layer. Please verify your connection or try again shortly." };
    }
  }
);
