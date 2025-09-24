
'use server';
/**
 * @fileOverview Generates an AI-powered analysis for a given team.
 *
 * - generateTeamAnalysis - The main function to call the analysis generation flow.
 * - TeamStats - The Zod schema for the team statistics input.
 * - TeamAnalysisOutput - The Zod schema for the output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Player } from '@/lib/data';

const PlayerStatsSchema = z.object({
    id: z.string(),
    name: z.string(),
    nickname: z.string(),
    avatar: z.string(),
    stats: z.object({
        played: z.number(),
        wins: z.number(),
        goalsFor: z.number(),
    })
});

const TeamStatsSchema = z.object({
  teamId: z.string(),
  teamName: z.string(),
  players: z.array(PlayerStatsSchema.partial()).describe('List of players in the team.'),
  totalMatches: z.number().describe('Total matches played by the team.'),
  wins: z.number().describe('Total wins.'),
  draws: z.number().describe('Total draws.'),
  losses: z.number().describe('Total losses.'),
  goalsFor: z.number().describe('Total goals scored.'),
  goalsAgainst: z.number().describe('Total goals conceded.'),
  averageGoalsPerMatch: z.number().describe('Average goals scored per match.'),
  winPercentage: z.number().describe('The win percentage of the team.'),
  form: z.array(z.string()).describe('Recent form (e.g., ["W", "L", "W", "D", "W"]).'),
  language: z.string().optional().describe('The language for the generated report (e.g., "en", "ar").'),
});
export type TeamStats = z.infer<typeof TeamStatsSchema>;


const TeamAnalysisOutputSchema = z.object({
  analysis: z
    .string()
    .describe(
      'A concise and insightful performance analysis for the team, formatted in markdown. Include sections for Strengths, Weaknesses, and Key Player.'
    ),
});
export type TeamAnalysisOutput = z.infer<typeof TeamAnalysisOutputSchema>;

export async function generateTeamAnalysis(
  input: TeamStats
): Promise<TeamAnalysisOutput> {
  return generateTeamAnalysisFlow(input);
}

const teamAnalysisPrompt = ai.definePrompt({
  name: 'teamAnalysisPrompt',
  input: { schema: TeamStatsSchema },
  output: { schema: TeamAnalysisOutputSchema },
  prompt: `You are a professional sports analyst.

  Your task is to generate a performance analysis report for a fantasy sports team based on the provided stats.
  The report should be concise, insightful, and formatted in markdown.
  
  {{#if language}}Please generate the report in this language: {{{language}}}.{{/if}}

  Team Information:
  - Name: {{{teamName}}}
  - Matches Played: {{{totalMatches}}}
  - Record (W-D-L): {{{wins}}}-{{{draws}}}-{{{losses}}}
  - Win Percentage: {{{winPercentage}}}%
  - Goals For: {{{goalsFor}}}
  - Goals Against: {{{goalsAgainst}}}
  - Avg Goals/Match: {{{averageGoalsPerMatch}}}
  - Recent Form: {{{form}}}

  Players:
  {{#each players}}
  - {{name}} ({{stats.wins}} Wins, {{stats.goalsFor}} Goals)
  {{/each}}


  Structure your report with the following markdown sections:
  ### STRENGTHS
  Analyze the team's strengths based on their stats (e.g., high win rate, strong offense).

  ### WEAKNESSES
  Analyze the team's weaknesses (e.g., poor defense, inconsistent form).

  ### KEY PLAYER
  Identify the most impactful player on the team and explain why.

  Keep the tone professional but engaging.
  `,
});

const generateTeamAnalysisFlow = ai.defineFlow(
  {
    name: 'generateTeamAnalysisFlow',
    inputSchema: TeamStatsSchema,
    outputSchema: TeamAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await teamAnalysisPrompt(input);
    return output!;
  }
);
