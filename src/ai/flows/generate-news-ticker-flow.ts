
'use server';

/**
 * @fileOverview Provides AI-generated news ticker items.
 *
 * - generateNewsTicker - Generates a list of short news items for a scrolling ticker.
 * - GenerateNewsTickerInput - The input type for the generateNewsTicker function.
 * - GenerateNewsTickerOutput - The return type for the generateNewsTickerOutput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlayerSchema = z.object({
    name: z.string(),
    stats: z.object({
        points: z.number(),
        goalsFor: z.number(),
    })
});

const MatchSchema = z.object({
    player1Id: z.string(),
    result: z.string().nullable(),
});

const GenerateNewsTickerInputSchema = z.object({
  matches: z.array(MatchSchema).describe("A list of recent match results."),
  players: z.array(PlayerSchema).describe("A list of top players."),
  language: z.string().optional().describe('The language for the generated news (e.g., "en", "ar").'),
});
export type GenerateNewsTickerInput = z.infer<typeof GenerateNewsTickerInputSchema>;


const NewsItemSchema = z.object({
    title: z.string().describe("A short, catchy headline (3-5 words)."),
    excerpt: z.string().describe("A one-sentence summary of the news (max 15 words).")
});

const GenerateNewsTickerOutputSchema = z.object({
  news: z.array(NewsItemSchema).describe('A list of 3-5 news items for the ticker.'),
});
export type GenerateNewsTickerOutput = z.infer<typeof GenerateNewsTickerOutputSchema>;


export async function generateNewsTicker(input: GenerateNewsTickerInput): Promise<GenerateNewsTickerOutput> {
  return generateNewsTickerFlow(input);
}

const newsTickerPrompt = ai.definePrompt({
    name: 'newsTickerPrompt',
    input: {schema: GenerateNewsTickerInputSchema},
    output: {schema: GenerateNewsTickerOutputSchema},
    prompt: `You are a sports news editor for a fantasy soccer league.
    
    Your task is to write 3 to 5 short, engaging news items for a scrolling news ticker.
    Each item needs a very short title and a one-sentence excerpt.
    Focus on recent results, top player performances, or exciting upcoming events. Be creative.

    {{#if language}}Please generate the news in this language: {{{language}}}.{{/if}}

    Here's the recent data to inspire the news:

    {{#if matches.length}}
    == Recent Matches ==
    {{#each matches}}
    - Match Result: {{{result}}}
    {{/each}}
    {{/if}}

    {{#if players.length}}
    == Top Players ==
    {{#each players}}
    - {{{name}}} (Points: {{stats.points}}, Goals: {{stats.goalsFor}})
    {{/each}}
    {{/if}}

    Based on this data, generate your news ticker items.
    `,
});

const generateNewsTickerFlow = ai.defineFlow(
    {
        name: 'generateNewsTickerFlow',
        inputSchema: GenerateNewsTickerInputSchema,
        outputSchema: GenerateNewsTickerOutputSchema,
    },
    async (input) => {
        if (input.matches.length === 0 && input.players.length === 0) {
            const noNews = input.language === 'ar' 
                ? { news: [{title: "هدوء تام", excerpt: "لا توجد أنشطة حديثة في الدوري للإبلاغ عنها."}] }
                : { news: [{title: "All Quiet", excerpt: "No recent league activity to report."}] };
            return noNews;
        }
        const {output} = await newsTickerPrompt(input);
        return output!;
    }
);
