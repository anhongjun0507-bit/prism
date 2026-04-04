'use server';
/**
 * @fileOverview An AI admissions counselor chat agent.
 *
 * - aiCounselingChat - A function that handles the AI admissions counseling chat process.
 * - AICounselingChatInput - The input type for the aiCounselingChat function.
 * - AICounselingChatOutput - The return type for the aiCounselingChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AICounselingChatInputSchema = z.object({
  message: z.string().describe('The user\'s message to the AI admissions counselor.'),
});
export type AICounselingChatInput = z.infer<typeof AICounselingChatInputSchema>;

const AICounselingChatOutputSchema = z.object({
  response: z.string().describe('The AI\'s response to the user\'s message.'),
});
export type AICounselingChatOutput = z.infer<typeof AICounselingChatOutputSchema>;

export async function aiCounselingChat(input: AICounselingChatInput): Promise<AICounselingChatOutput> {
  return aiCounselingChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCounselingChatPrompt',
  input: {schema: AICounselingChatInputSchema},
  output: {schema: AICounselingChatOutputSchema},
  prompt: `You are an AI admissions counselor specializing in US university applications.
Your goal is to provide helpful, accurate, and personalized guidance to students about the application process.
Answer the user's questions and offer advice based on your expertise.

User's message: {{{message}}}

AI Counselor's response: `,
});

const aiCounselingChatFlow = ai.defineFlow(
  {
    name: 'aiCounselingChatFlow',
    inputSchema: AICounselingChatInputSchema,
    outputSchema: AICounselingChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
