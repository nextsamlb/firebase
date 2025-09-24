
'use server';
/**
 * @fileOverview Generates a report on potential bullying behavior.
 *
 * - generateBullyingReport - Creates a summary of negative community feedback.
 * - BullyingReportInput - The input type for the generateBullyingReport function.
 * - BullyingReportOutput - The return type for the generateBullyingReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const PlayerVoteSchema = z.object({
  playerName: z.string(),
  worstPlayerVotes: z.number(),
});

const BullyingReportInputSchema = z.object({
  players: z.array(PlayerVoteSchema).describe('A list of players and their "worst player" vote counts.'),
  language: z.string().optional().describe('The language for the generated report (e.g., "en", "ar").'),
});
export type BullyingReportInput = z.infer<typeof BullyingReportInputSchema>;

const BullyingReportOutputSchema = z.object({
  report: z.object({
    title: z.string().describe('A short, professional headline for the news ticker (e.g., "Community Conduct Review").'),
    summary: z.string().describe('A one-sentence summary (max 20 words) for the news ticker, written in a neutral, observational tone.'),
    playerInFocus: z.string().describe('The name of the player receiving the most negative votes.'),
  })
});
export type BullyingReportOutput = z.infer<typeof BullyingReportOutputSchema>;

export async function generateBullyingReport(input: BullyingReportInput): Promise<BullyingReportOutput> {
  return generateBullyingReportFlow(input);
}

const bullyingReportPrompt = ai.definePrompt({
  name: 'bullyingReportPrompt',
  input: { schema: BullyingReportInputSchema },
  output: { schema: BullyingReportOutputSchema },
  prompt: `You are a community manager for a fantasy sports league. Your task is to identify potential negative behavior based on "worst player of the match" votes.

  Analyze the following data and identify the player who has received the most "worst player" votes.
  
  Your output should be a news ticker item. It must be neutral, professional, and avoid accusatory language. The goal is to raise community awareness, not to punish.

  {{#if language}}Please generate the report in this language: {{{language}}}.{{/if}}

  Data:
  {{#each players}}
  - Player: {{{playerName}}}, Worst Player Votes: {{worstPlayerVotes}}
  {{/each}}

  Based on this, generate a report object with a title, a brief summary, and identify the player in focus.
  Example Summary: "Community feedback has highlighted player [Player Name] in recent matches. We encourage all members to uphold sportsmanship."
  `,
});

const generateBullyingReportFlow = ai.defineFlow(
  {
    name: 'generateBullyingReportFlow',
    inputSchema: BullyingReportInputSchema,
    outputSchema: BullyingReportOutputSchema,
  },
  async (input) => {
    const { output } = await bullyingReportPrompt(input);
    return output!;
  }
);
