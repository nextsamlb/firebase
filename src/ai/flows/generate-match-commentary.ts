
'use server';

/**
 * @fileOverview Provides AI-generated commentary for matches.
 *
 * - generateMatchCommentary - Generates a brief, exciting commentary for a given match.
 * - GenerateMatchCommentaryInput - The input type for the generateMatchCommentary function.
 * - GenerateMatchCommentaryOutput - The return type for the generateMatchCommentary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMatchCommentaryInputSchema = z.object({
  player1Name: z.string().describe('The name of the home player.'),
  player2Name: z.string().describe('The name of the away player.'),
  result: z.string().describe('The final score of the match (e.g., "3-1").'),
  stageName: z.string().describe('The stage of the tournament (e.g., "Group Stage").'),
});
export type GenerateMatchCommentaryInput = z.infer<typeof GenerateMatchCommentaryInputSchema>;

const GenerateMatchCommentaryOutputSchema = z.object({
  commentary: z.string().describe('A brief, exciting commentary of the match.'),
});
export type GenerateMatchCommentaryOutput = z.infer<typeof GenerateMatchCommentaryOutputSchema>;


export async function generateMatchCommentary(input: GenerateMatchCommentaryInput): Promise<GenerateMatchCommentaryOutput> {
  return generateMatchCommentaryFlow(input);
}


const commentaryPrompt = ai.definePrompt({
    name: 'matchCommentaryPrompt',
    input: {schema: GenerateMatchCommentaryInputSchema},
    output: {schema: GenerateMatchCommentaryOutputSchema},
    prompt: `You are a world-class sports commentator for a fantasy soccer league.
    
    Generate a short, exciting, and dramatic commentary (2-3 sentences) for the following match.
    Do not use the players' nicknames. Be creative and engaging.

    Match Details:
    - Stage: {{{stageName}}}
    - Home Player: {{{player1Name}}}
    - Away Player: {{{player2Name}}}
    - Final Score: {{{player1Name}}} {{result}} {{{player2Name}}}
    `,
});

const generateMatchCommentaryFlow = ai.defineFlow(
    {
        name: 'generateMatchCommentaryFlow',
        inputSchema: GenerateMatchCommentaryInputSchema,
        outputSchema: GenerateMatchCommentaryOutputSchema,
    },
    async (input) => {
        const {output} = await commentaryPrompt(input);
        return output!;
    }
);
