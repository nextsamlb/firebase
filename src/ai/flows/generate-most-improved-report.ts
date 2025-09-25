
'use server';
/**
 * @fileOverview Identifies and generates a report for the most improved player.
 *
 * - generateMostImprovedReport - Creates a summary about the player who has shown the most improvement.
 * - MostImprovedReportInput - The input type for the function.
 * - MostImprovedReportOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const PlayerImprovementSchema = z.object({
  id: z.string(),
  name: z.string(),
  previousWinRate: z.number().describe("The player's win rate in the first half of the season."),
  currentWinRate: z.number().describe("The player's win rate in the second half of the season."),
  previousGoals: z.number().describe("Goals scored in the first half."),
  currentGoals: z.number().describe("Goals scored in the second half."),
});

const MostImprovedReportInputSchema = z.object({
  players: z.array(PlayerImprovementSchema).describe('A list of players and their performance stats from two different periods.'),
});
export type MostImprovedReportInput = z.infer<typeof MostImprovedReportInputSchema>;

const MostImprovedReportOutputSchema = z.object({
  report: z.string().describe('A markdown-formatted report identifying the most improved player and a brief analysis of their progress. The report should start with a header like `### [Player Name]`'),
});
export type MostImprovedReportOutput = z.infer<typeof MostImprovedReportOutputSchema>;

export async function generateMostImprovedReport(input: MostImprovedReportInput): Promise<MostImprovedReportOutput> {
  return generateMostImprovedReportFlow(input);
}

const mostImprovedReportPrompt = ai.definePrompt({
  name: 'mostImprovedReportPrompt',
  input: { schema: MostImprovedReportInputSchema },
  output: { schema: MostImprovedReportOutputSchema },
  prompt: `You are a sports analyst tasked with identifying the "Most Improved Player".

  Analyze the following player data, which compares performance from the first half of the season (previous) to the second half (current).
  Identify the single player who has shown the most significant improvement, considering the change in both win rate and goals scored.
  
  Your output should be a short markdown report. Start with a markdown header (###) with the player's name, then write a 2-3 sentence analysis explaining why they are the most improved.

  Data:
  {{#each players}}
  - Player: {{{name}}}, Previous Win Rate: {{previousWinRate}}, Current Win Rate: {{currentWinRate}}, Previous Goals: {{previousGoals}}, Current Goals: {{currentGoals}}
  {{/each}}
  `,
});

const generateMostImprovedReportFlow = ai.defineFlow(
  {
    name: 'generateMostImprovedReportFlow',
    inputSchema: MostImprovedReportInputSchema,
    outputSchema: MostImprovedReportOutputSchema,
  },
  async (input) => {
    const { output } = await mostImprovedReportPrompt(input);
    return output!;
  }
);
