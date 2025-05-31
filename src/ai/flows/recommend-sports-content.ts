'use server';

/**
 * @fileOverview An AI agent that recommends sports content to users based on their chosen favorite sports.
 *
 * - recommendSportsContent - A function that handles the sports content recommendation process.
 * - RecommendSportsContentInput - The input type for the recommendSportsContent function.
 * - RecommendSportsContentOutput - The return type for the recommendSportsContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendSportsContentInputSchema = z.object({
  userSportsInterests: z
    .array(z.string())
    .describe('An array of the user\'s chosen favorite sports.'),
  availableContent: z.array(z.string()).describe('An array of available sports content.'),
});
export type RecommendSportsContentInput = z.infer<
  typeof RecommendSportsContentInputSchema
>;

const RecommendSportsContentOutputSchema = z.object({
  recommendedContent: z
    .array(z.string())
    .describe('An array of sports content recommended for the user.'),
});
export type RecommendSportsContentOutput = z.infer<
  typeof RecommendSportsContentOutputSchema
>;

export async function recommendSportsContent(
  input: RecommendSportsContentInput
): Promise<RecommendSportsContentOutput> {
  return recommendSportsContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendSportsContentPrompt',
  input: {schema: RecommendSportsContentInputSchema},
  output: {schema: RecommendSportsContentOutputSchema},
  prompt: `You are an AI assistant specializing in recommending sports content to users.

You will be provided with a list of the user's favorite sports and a list of available sports content.

Based on the user's interests, you will recommend the most relevant content to the user.

User's Favorite Sports: {{{userSportsInterests}}}
Available Sports Content: {{{availableContent}}}

Recommended Content:`, // Ensure the model outputs an array of strings
});

const recommendSportsContentFlow = ai.defineFlow(
  {
    name: 'recommendSportsContentFlow',
    inputSchema: RecommendSportsContentInputSchema,
    outputSchema: RecommendSportsContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
