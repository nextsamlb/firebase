'use server';

/**
 * @fileOverview Provides a message reply draft for the inbox.
 *
 * - draftReply - Generates a draft reply to a message.
 * - DraftReplyInput - The input type for the draftReply function.
 * - DraftReplyOutput - The return type for the draftReply function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DraftReplyInputSchema = z.object({
    originalSubject: z.string().describe('The subject of the original message.'),
    originalBody: z.string().describe('The body of the original message.'),
});
export type DraftReplyInput = z.infer<typeof DraftReplyInputSchema>;

const DraftReplyOutputSchema = z.object({
    replyBody: z.string().describe('The generated draft reply body.'),
});
export type DraftReplyOutput = z.infer<typeof DraftReplyOutputSchema>;

export async function draftReply(input: DraftReplyInput): Promise<DraftReplyOutput> {
    return draftReplyFlow(input);
}

const draftReplyPrompt = ai.definePrompt({
    name: 'draftReplyPrompt',
    input: {schema: DraftReplyInputSchema},
    output: {schema: DraftReplyOutputSchema},
    prompt: `You are a helpful assistant for a fantasy sports league app. Your task is to draft a concise and helpful reply to the following message.

    Original Message Subject: {{{originalSubject}}}
    Original Message Body: {{{originalBody}}}

    Generate a clear and brief reply. Do not add a greeting or a signature. Just provide the body of the message.
    `,
});

const draftReplyFlow = ai.defineFlow(
    {
        name: 'draftReplyFlow',
        inputSchema: DraftReplyInputSchema,
        outputSchema: DraftReplyOutputSchema,
    },
    async (input) => {
        const {output} = await draftReplyPrompt(input);
        return output!;
    }
);
