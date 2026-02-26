'use server';
/**
 * @fileOverview An AI financial advisor chatbot that provides personalized advice based on user data.
 *
 * - aiFinancialStrategyAdvisor - A function that handles the AI financial advisor chat process.
 * - AiFinancialAdvisorInput - The input type for the aiFinancialStrategyAdvisor function.
 * - AiFinancialAdvisorOutput - The return type for the aiFinancialStrategyAdvisor function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiFinancialAdvisorInputSchema = z.object({
  userQuery: z.string().describe("The user's question or request for the financial advisor."),
  portfolioData: z.string().describe("JSON string representing the user's investment portfolio data."),
  predictionHistory: z.string().describe("JSON string representing the user's stock prediction history."),
  newsSentiment: z.string().describe("JSON string summarizing the user's relevant financial news sentiment."),
  learningProgress: z.string().describe("JSON string indicating the user's financial learning progress."),
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
  prompt: `You are an expert AI Financial Advisor named FinIntel AI. Your goal is to provide personalized investment suggestions, risk warnings, market explanations, and answer financial questions based on the user's provided data. Always be helpful, informative, and cautious, emphasizing that this advice is for informational purposes only and not professional financial advice.

User's Query: {{{userQuery}}}

User's Portfolio Data:
{{{portfolioData}}}

User's Prediction History:
{{{predictionHistory}}}

User's News Sentiment:
{{{newsSentiment}}}

User's Learning Progress:
{{{learningProgress}}}

Based on the above information, provide a comprehensive and personalized response to the user's query.`,
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
