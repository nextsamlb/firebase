
'use server';
/**
 * @fileOverview Generates an AI-powered analysis for a matchup between two teams.
 *
 * - generateMatchupAnalysis - The main function to call the analysis generation flow.
 * - MatchupData - The Zod schema for the matchup data input.
 * - MatchupAnalysisOutput - The Zod schema for the output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { type TeamStats } from './generate-team-analysis';

// Re-defining a minimal TeamStats schema for Zod validation within this file.
const TeamStatsSchema = z.object({
  teamId: z.string(),
  teamName: z.string(),
  players: z.array(z.any()).describe('List of players in the team.'),
  totalMatches: z.number().describe('Total matches played by the team.'),
  wins: z.number().describe('Total wins.'),
  draws: z.number().describe('Total draws.'),
  losses: z.number().describe('Total losses.'),
  goalsFor: z.number().describe('Total goals scored.'),
  goalsAgainst: z.number().describe('Total goals conceded.'),
  averageGoalsPerMatch: z.number().describe('Average goals scored per match.'),
  winPercentage: z.number().describe('The win percentage of the team.'),
  form: z.array(z.string()).describe('Recent form (e.g., ["W", "L", "W", "D", "W"]).'),
});


const MatchupDataSchema = z.object({
  homeTeam: TeamStatsSchema.describe('The statistics for the home team.'),
  awayTeam: TeamStatsSchema.describe('The statistics for the away team.'),
  headToHead: z.object({
      totalMeetings: z.number(),
      homeWins: z.number(),
      awayWins: z.number(),
      draws: z.number(),
      lastMeeting: z.object({
          date: z.string(),
          score: z.string(),
          venue: z.string(),
      }),
  }).describe('Head-to-head statistics between the two teams.').optional(),
  venue: z.string().describe('The venue for the upcoming match.'),
  competition: z.string().describe('The competition or league the match is part of.'),
  language: z.string().optional().describe('The language for the generated report (e.g., "en", "ar").'),
});

export type MatchupData = z.infer<typeof MatchupDataSchema>;

const MatchupAnalysisOutputSchema = z.object({
  analysis: z
    .string()
    .describe(
      'A detailed and insightful matchup analysis, formatted in markdown. It should include sections for Tactical Overview, Key Battles, and a final Prediction.'
    ),
});
export type MatchupAnalysisOutput = z.infer<typeof MatchupAnalysisOutputSchema>;

export async function generateMatchupAnalysis(
  input: MatchupData
): Promise<MatchupAnalysisOutput> {
  return generateMatchupAnalysisFlow(input);
}

const matchupAnalysisPrompt = ai.definePrompt({
  name: 'matchupAnalysisPrompt',
  input: { schema: MatchupDataSchema },
  output: { schema: MatchupAnalysisOutputSchema },
  prompt: `You are a world-class sports pundit providing a detailed preview for an upcoming match.

  Your task is to generate a matchup analysis based on the provided team statistics and head-to-head data.
  The analysis should be insightful, engaging, and formatted in markdown. It should focus on the narratives between the players.

  {{#if language}}Please generate the report in this language: {{{language}}}.{{/if}}

  Match Details:
  - Competition: {{{competition}}}
  - Venue: {{{venue}}}
  - Match: {{{homeTeam.teamName}}} vs. {{{awayTeam.teamName}}}

  Home Team/Player: {{{homeTeam.teamName}}}
  - Record (W-D-L): {{{homeTeam.wins}}}-{{{homeTeam.draws}}}-{{{homeTeam.losses}}}
  - Win Percentage: {{{homeTeam.winPercentage}}}%
  - Goals For/Against: {{{homeTeam.goalsFor}}}/{{{homeTeam.goalsAgainst}}}
  - Recent Form: {{{homeTeam.form}}}

  Away Team/Player(s): {{{awayTeam.teamName}}}
  - Record (W-D-L): {{{awayTeam.wins}}}-{{{awayTeam.draws}}}-{{{awayTeam.losses}}}
  - Win Percentage: {{{awayTeam.winPercentage}}}%
  - Goals For/Against: {{{awayTeam.goalsFor}}}/{{{awayTeam.goalsAgainst}}}
  - Recent Form: {{{awayTeam.form}}}
  
  {{#if headToHead}}
  Head-to-Head:
  - Total Meetings: {{{headToHead.totalMeetings}}}
  - {{{homeTeam.teamName}}} Wins: {{{headToHead.homeWins}}}
  - {{{awayTeam.teamName}}} Wins: {{{headToHead.awayWins}}}
  - Draws: {{{headToHead.draws}}}
  - Last Meeting: {{{headToHead.lastMeeting.score}}} at {{{headToHead.lastMeeting.venue}}} on {{{headToHead.lastMeeting.date}}}
  {{/if}}

  Structure your analysis with the following markdown sections:
  ### TACTICAL OVERVIEW
  Compare the two sides. Does one have a stronger offense? Does the other have a better defense? How might their recent form influence their approach?

  ### KEY BATTLES
  Identify 1-2 critical player-vs-player or unit-vs-unit matchups that could decide the game. For example, "The home team's star striker against the away team's rock-solid defense."

  ### PREDICTION
  Based on all the data, provide a final prediction for the match score and briefly justify it.
  `,
});

const generateMatchupAnalysisFlow = ai.defineFlow(
  {
    name: 'generateMatchupAnalysisFlow',
    inputSchema: MatchupDataSchema,
    outputSchema: MatchupAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await matchupAnalysisPrompt(input);
    return output!;
  }
);
