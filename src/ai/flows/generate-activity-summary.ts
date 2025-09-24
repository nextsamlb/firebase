
'use server';

/**
 * @fileOverview Provides an AI-generated summary of recent league activity.
 *
 * - generateActivitySummary - Generates a brief, engaging summary of recent events.
 * - GenerateActivitySummaryInput - The input type for the generateActivitySummary function.
 * - GenerateActivitySummaryOutput - The return type for the generateActivitySummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MatchEventSchema = z.object({
  matchId: z.string(),
  stageName: z.string(),
  player1Name: z.string(),
  player2Name: z.string(),
  result: z.string(),
  timestamp: z.string(),
});

const TransferEventSchema = z.object({
  playerName: z.string(),
  fromTeam: z.string(),
  toTeam: z.string(),
  value: z.number(),
  timestamp: z.string(),
});

const GenerateActivitySummaryInputSchema = z.object({
  matches: z.array(MatchEventSchema).describe("A list of recent match results."),
  transfers: z.array(TransferEventSchema).describe("A list of recent player transfers."),
  language: z.string().optional().describe('The language for the generated report (e.g., "en", "ar").'),
});
export type GenerateActivitySummaryInput = z.infer<typeof GenerateActivitySummaryInputSchema>;

const GenerateActivitySummaryOutputSchema = z.object({
  summary: z.string().describe('A brief, engaging summary of the provided league activity, formatted as a single paragraph.'),
});
export type GenerateActivitySummaryOutput = z.infer<typeof GenerateActivitySummaryOutputSchema>;


export async function generateActivitySummary(input: GenerateActivitySummaryInput): Promise<GenerateActivitySummaryOutput> {
  return generateActivitySummaryFlow(input);
}

const summaryPrompt = ai.definePrompt({
    name: 'activitySummaryPrompt',
    input: {schema: GenerateActivitySummaryInputSchema},
    output: {schema: GenerateActivitySummaryOutputSchema},
    prompt: `You are a sports journalist for a fantasy soccer league.
    
    Your task is to write a short, engaging summary (as a single paragraph) of the recent league activity.
    Focus on the most interesting results and narratives. Be creative and make it sound like a real news report.

    {{#if language}}Please generate the report in this language: {{{language}}}.{{/if}}

    Here's the recent activity:

    {{#if matches.length}}
    == Recent Matches ==
    {{#each matches}}
    - {{{stageName}}}: {{{player1Name}}} vs {{{player2Name}}}, Result: {{{result}}} (on {{timestamp}})
    {{/each}}
    {{/if}}

    {{#if transfers.length}}
    == Recent Transfers ==
    {{#each transfers}}
    - {{{playerName}}} transferred from {{{fromTeam}}} to {{{toTeam}}} for a fee of {{value}} (on {{timestamp}})
    {{/each}}
    {{/if}}

    Based on this data, generate your summary.
    `,
});

const generateActivitySummaryFlow = ai.defineFlow(
    {
        name: 'generateActivitySummaryFlow',
        inputSchema: GenerateActivitySummaryInputSchema,
        outputSchema: GenerateActivitySummaryOutputSchema,
    },
    async (input) => {
        if (input.matches.length === 0 && input.transfers.length === 0) {
            const noNews = input.language === 'ar' 
                ? { summary: "لا توجد أنشطة حديثة في الدوري للإبلاغ عنها. الهدوء يعم الملعب..." }
                : { summary: "No recent activity to report in the league. It's all quiet on the pitch..." };
            return noNews;
        }
        const {output} = await summaryPrompt(input);
        return output!;
    }
);
