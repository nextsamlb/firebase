'use server';

/**
 * @fileOverview Provides a user summary for the admin dashboard.
 *
 * - getUserSummary - Retrieves a concise summary of a user for the admin dashboard.
 * - UserSummaryInput - The input type for the getUserSummary function.
 * - UserSummaryOutput - The return type for the getUserSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UserSummaryInputSchema = z.object({
  email: z.string().describe('The email address of the user.'),
  role: z.string().describe('The role of the user (e.g., admin, general user).'),
  registrationDate: z.string().describe('The registration date of the user.'),
});
export type UserSummaryInput = z.infer<typeof UserSummaryInputSchema>;

const UserSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the user account.'),
});
export type UserSummaryOutput = z.infer<typeof UserSummaryOutputSchema>;

export async function getUserSummary(input: UserSummaryInput): Promise<UserSummaryOutput> {
  return userSummaryFlow(input);
}

const userSummaryPrompt = ai.definePrompt({
  name: 'userSummaryPrompt',
  input: {schema: UserSummaryInputSchema},
  output: {schema: UserSummaryOutputSchema},
  prompt: `You are an administrator summarizing user accounts for a dashboard.

  Create a concise summary (one sentence) of the user account using the following information:

  Email: {{{email}}}
  Role: {{{role}}}
  Registration Date: {{{registrationDate}}}

  The summary should highlight the user's role and registration date.
  `,
});

const userSummaryFlow = ai.defineFlow(
  {
    name: 'userSummaryFlow',
    inputSchema: UserSummaryInputSchema,
    outputSchema: UserSummaryOutputSchema,
  },
  async input => {
    const {output} = await userSummaryPrompt(input);
    return output!;
  }
);
