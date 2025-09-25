
'use server';

/**
 * @fileOverview A flow for generating images from text prompts using Imagen.
 *
 * - generateImage - Generates an image based on a descriptive prompt.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {googleAI} from '@genkit-ai/googleai';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('A detailed prompt to generate an image.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async ({ prompt }) => {
    const { media } = await ai.generate({
      model: googleAI.model('imagen-4.0-fast-generate-001'),
      prompt: `Generate a dramatic, cinematic, hyper-realistic sports photograph of the following moment from a soccer match: ${prompt}. Focus on the emotion and action.`,
      config: {
        aspectRatio: '16:9'
      }
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed to return a valid URL.');
    }

    return { imageUrl: media.url };
  }
);
