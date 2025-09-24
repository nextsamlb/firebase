
'use server';
/**
 * @fileOverview Generates an AI-powered performance analysis for a player.
 *
 * - generatePlayerReport - The main function to call the report generation flow.
 * - GeneratePlayerReportInput - The Zod schema for the input.
 * - GeneratePlayerReportOutput - The Zod schema for the output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GeneratePlayerReportInputSchema = z.object({
  name: z.string().describe('The full name of the player.'),
  nickname: z.string().describe('The nickname of the player.'),
  matchesPlayed: z.number().describe('Total number of matches played.'),
  wins: z.number().describe('Total number of wins.'),
  goals: z.number().describe('Total number of goals scored.'),
  assists: z.number().describe('Total number of assists.'),
  winRate: z.string().describe('The win rate of the player as a percentage string (e.g., "66.7%").'),
  language: z.string().optional().describe('The language for the generated report (e.g., "en", "ar").'),
});
export type GeneratePlayerReportInput = z.infer<typeof GeneratePlayerReportInputSchema>;

const GeneratePlayerReportOutputSchema = z.object({
  report: z
    .string()
    .describe(
      'A concise and insightful performance analysis report for the player, formatted in markdown. Include sections for Performance Overview, Offensive Analysis, and Development Recommendations.'
    ),
});
export type GeneratePlayerReportOutput = z.infer<typeof GeneratePlayerReportOutputSchema>;

export async function generatePlayerReport(
  input: GeneratePlayerReportInput
): Promise<GeneratePlayerReportOutput> {
  return generatePlayerReportFlow(input);
}

const playerReportPrompt = ai.definePrompt({
  name: 'playerReportPrompt',
  input: { schema: GeneratePlayerReportInputSchema },
  output: { schema: GeneratePlayerReportOutputSchema },
  prompt: `You are a professional sports analyst for the PIFA soccer league.

  Your task is to generate a performance analysis report for a player based on the provided stats.
  The report should be concise, insightful, and formatted in markdown.

  {{#if language}}Please generate the report in this language: {{{language}}}.{{/if}}

  Player Information:
  - Name: {{{name}}} ({{{nickname}}})
  - Matches Played: {{{matchesPlayed}}}
  - Wins: {{{wins}}}
  - Win Rate: {{{winRate}}}
  - Goals Scored: {{{goals}}}
  - Assists: {{{assists}}}

  Structure your report with the following markdown sections:
  ### PERFORMANCE OVERVIEW
  Provide a brief summary of the player's overall performance, mentioning their win rate and impact.

  ### OFFENSIVE ANALYSIS
  Analyze their goal and assist contributions. Calculate and mention their goals per match.

  ### DEVELOPMENT RECOMMENDATIONS
  Suggest 2-3 specific areas for improvement based on their stats.

  Keep the tone professional but engaging.
  `,
});

const generatePlayerReportFlow = ai.defineFlow(
  {
    name: 'generatePlayerReportFlow',
    inputSchema: GeneratePlayerReportInputSchema,
    outputSchema: GeneratePlayerReportOutputSchema,
  },
  async (input) => {
    const { output } = await playerReportPrompt(input);
    return output!;
  }
);
