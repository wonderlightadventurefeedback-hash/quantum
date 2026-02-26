'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating AI-driven portfolio improvement insights.
 *
 * - aiPortfolioImprovementInsights - A function that handles the generation of portfolio insights.
 * - AiPortfolioImprovementInsightsInput - The input type for the aiPortfolioImprovementInsights function.
 * - AiPortfolioImprovementInsightsOutput - The return type for the aiPortfolioImprovementInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiPortfolioImprovementInsightsInputSchema = z.object({
  holdings: z.array(
    z.object({
      symbol: z.string().describe('The stock or asset symbol (e.g., AAPL).'),
      quantity: z.number().int().positive().describe('The number of shares or units held.'),
      purchasePrice: z.number().positive().describe('The price at which the asset was purchased.'),
      currentPrice: z.number().positive().describe('The current market price of the asset.'),
    })
  ).describe('A list of the user\u0027s current investment holdings.'),
  riskExposureScore: z.number().min(0).max(100).describe('A numerical score representing the user\u0027s overall risk exposure (0-100).'),
  assetAllocation: z.array(
    z.object({
      assetClass: z.string().describe('The name of the asset class (e.g., Equities, Bonds, Real Estate).'),
      percentage: z.number().min(0).max(100).describe('The percentage of the portfolio allocated to this asset class.'),
    })
  ).describe('The current allocation of the portfolio across different asset classes.'),
  sectorDiversification: z.array(
    z.object({
      sector: z.string().describe('The name of the industry sector (e.g., Technology, Healthcare, Finance).'),
      percentage: z.number().min(0).max(100).describe('The percentage of the portfolio allocated to this sector.'),
    })
  ).describe('The current diversification of the portfolio across different industry sectors.'),
});
export type AiPortfolioImprovementInsightsInput = z.infer<typeof AiPortfolioImprovementInsightsInputSchema>;

const AiPortfolioImprovementInsightsOutputSchema = z.object({
  insights: z.string().describe('Actionable suggestions and explanations for improving the user\u0027s investment portfolio.'),
});
export type AiPortfolioImprovementInsightsOutput = z.infer<typeof AiPortfolioImprovementInsightsOutputSchema>;

export async function aiPortfolioImprovementInsights(input: AiPortfolioImprovementInsightsInput): Promise<AiPortfolioImprovementInsightsOutput> {
  return aiPortfolioImprovementInsightsFlow(input);
}

const aiPortfolioImprovementPrompt = ai.definePrompt({
  name: 'aiPortfolioImprovementPrompt',
  input: { schema: AiPortfolioImprovementInsightsInputSchema },
  output: { schema: AiPortfolioImprovementInsightsOutputSchema },
  prompt: `You are an expert financial advisor specializing in investment portfolio optimization. Your goal is to provide personalized, actionable, and well-explained improvement insights for a user's investment portfolio.

Consider the user's current holdings, risk exposure, asset allocation, and sector diversification to identify areas for optimization. Focus on enhancing diversification, managing risk, and potentially improving returns.

Provide specific suggestions, explaining the rationale behind each one. The insights should be practical and easy for an investor to understand and implement.

Here is the user's current portfolio data:

**Holdings:**
{{#each holdings}}
- Symbol: {{{this.symbol}}}, Quantity: {{{this.quantity}}}, Purchase Price: {{{this.purchasePrice}}}, Current Price: {{{this.currentPrice}}}
{{/each}}

**Risk Exposure Score:** {{{riskExposureScore}}} (on a scale of 0-100)

**Asset Allocation:**
{{#each assetAllocation}}
- Asset Class: {{{this.assetClass}}}, Percentage: {{{this.percentage}}}%
{{/each}}

**Sector Diversification:**
{{#each sectorDiversification}}
- Sector: {{{this.sector}}}, Percentage: {{{this.percentage}}}%
{{/each}}

Based on this information, generate detailed improvement insights for the user's portfolio. Provide specific, actionable advice and explain your reasoning. The output should be a comprehensive block of text.`,
});

const aiPortfolioImprovementInsightsFlow = ai.defineFlow(
  {
    name: 'aiPortfolioImprovementInsightsFlow',
    inputSchema: AiPortfolioImprovementInsightsInputSchema,
    outputSchema: AiPortfolioImprovementInsightsOutputSchema,
  },
  async (input) => {
    const { output } = await aiPortfolioImprovementPrompt(input);
    return output!;
  }
);
