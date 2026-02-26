'use server';
/**
 * @fileOverview This file defines a Genkit flow for explaining stock prediction outcomes.
 * It takes user and AI predictions, user confidence, and actual market results as input,
 * and outputs an AI-generated explanation of why the user's prediction matched or failed.
 *
 * - aiStockPredictionExplanation - The wrapper function to call the Genkit flow.
 * - AiStockPredictionExplanationInput - The input type for the flow.
 * - AiStockPredictionExplanationOutput - The output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiStockPredictionExplanationInputSchema = z.object({
  stockSymbol: z.string().describe('The ticker symbol of the stock being predicted.'),
  userPrediction: z.enum(['UP', 'DOWN']).describe('The user\'s prediction for the stock movement.'),
  userConfidence: z.number().min(0).max(100).describe('The user\'s confidence level in their prediction, as a percentage between 0 and 100.'),
  aiPrediction: z.enum(['UP', 'DOWN']).describe('The AI\'s prediction for the stock movement.'),
  actualResult: z.enum(['UP', 'DOWN']).describe('The actual market movement of the stock.'),
});
export type AiStockPredictionExplanationInput = z.infer<typeof AiStockPredictionExplanationInputSchema>;

const AiStockPredictionExplanationOutputSchema = z.object({
  predictionOutcome: z.enum(['MATCHED', 'FAILED']).describe('Indicates whether the user\'s prediction matched or failed the actual market result.'),
  explanation: z.string().describe('A detailed AI-generated explanation for why the user\'s prediction matched or failed, offering insights and learning points.'),
});
export type AiStockPredictionExplanationOutput = z.infer<typeof AiStockPredictionExplanationOutputSchema>;

export async function aiStockPredictionExplanation(input: AiStockPredictionExplanationInput): Promise<AiStockPredictionExplanationOutput> {
  return aiStockPredictionExplanationFlow(input);
}

const explainPredictionPrompt = ai.definePrompt({
  name: 'explainPredictionPrompt',
  input: { schema: AiStockPredictionExplanationInputSchema },
  output: { schema: AiStockPredictionExplanationOutputSchema },
  prompt: `You are an expert financial analyst and a patient educator. Your task is to provide a clear, constructive, and detailed explanation for a stock prediction outcome.

Given the following information about a stock prediction:

Stock Symbol: {{{stockSymbol}}}
User's Prediction: {{{userPrediction}}}
User's Confidence: {{{userConfidence}}}%
AI's Prediction: {{{aiPrediction}}}
Actual Market Result: {{{actualResult}}}

Analyze the user's prediction in comparison to the actual market result.
- If the user's prediction matches the actual market result, clearly state that it matched and explain the possible factors that contributed to its success.
- If the user's prediction failed to match the actual market result, clearly state that it failed and provide potential reasons for the discrepancy.

In your explanation, consider the user's confidence level and how the AI's prediction aligned or differed. Offer actionable insights or learning points to help the user improve their future predictions. Maintain a supportive and informative tone.

Provide the response as a JSON object with two fields: 'predictionOutcome' (either 'MATCHED' or 'FAILED') and 'explanation' (a detailed string).`
});

const aiStockPredictionExplanationFlow = ai.defineFlow(
  {
    name: 'aiStockPredictionExplanationFlow',
    inputSchema: AiStockPredictionExplanationInputSchema,
    outputSchema: AiStockPredictionExplanationOutputSchema,
  },
  async (input) => {
    const { output } = await explainPredictionPrompt(input);
    if (!output) {
      throw new Error('Failed to get explanation from AI.');
    }
    return output;
  }
);
