'use server';
/**
 * @fileOverview An AI agent that analyzes a student's academic profile to predict
 * admission chances to US universities and provides recommendations.
 *
 * - admissionProbabilityAnalysis - A function that handles the admission probability analysis process.
 * - AdmissionProbabilityAnalysisInput - The input type for the admissionProbabilityAnalysis function.
 * - AdmissionProbabilityAnalysisOutput - The return type for the admissionProbabilityAnalysis function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema
const AdmissionProbabilityAnalysisInputSchema = z.object({
  gpa: z.number().min(0.0).max(4.0).describe('Current GPA on a 4.0 scale.'),
  satScore: z.number().min(400).max(1600).optional().describe('SAT score out of 1600.'),
  actScore: z.number().min(1).max(36).optional().describe('ACT score out of 36.'),
  toeflScore: z.number().min(0).max(120).optional().describe('TOEFL score out of 120.'),
  apCourses: z.array(z.string()).optional().describe('List of AP courses taken.'),
  dreamSchool: z.string().describe('The name of the user\'s dream university.'),
  major: z.string().describe('The user\'s desired major.'),
});
export type AdmissionProbabilityAnalysisInput = z.infer<typeof AdmissionProbabilityAnalysisInputSchema>;

// Output Schema
const AdmissionProbabilityAnalysisOutputSchema = z.object({
  dreamSchool: z.string().describe('The dream school provided in the input.'),
  major: z.string().describe('The desired major provided in the input.'),
  admissionProbability: z.number().min(0).max(100).describe('A percentage representing the admission probability (0-100).'),
  analysis: z.string().describe('A detailed explanation of the probability, highlighting strengths and weaknesses.'),
  recommendations: z.array(z.string()).describe('Actionable recommendations to improve admission chances.'),
});
export type AdmissionProbabilityAnalysisOutput = z.infer<typeof AdmissionProbabilityAnalysisOutputSchema>;

// Wrapper function
export async function admissionProbabilityAnalysis(
  input: AdmissionProbabilityAnalysisInput
): Promise<AdmissionProbabilityAnalysisOutput> {
  return admissionProbabilityAnalysisFlow(input);
}

// Prompt definition
const prompt = ai.definePrompt({
  name: 'admissionProbabilityAnalysisPrompt',
  input: { schema: AdmissionProbabilityAnalysisInputSchema },
  output: { schema: AdmissionProbabilityAnalysisOutputSchema },
  prompt: `You are an expert US university admissions counselor, specializing in advising Korean international school students.
Your task is to analyze a student's academic profile and predict their admission chances to a specific US university for a specific major.
Provide a clear admission probability percentage, a detailed analysis, and actionable recommendations.

Here is the student's academic profile:
Dream University: {{{dreamSchool}}}
Desired Major: {{{major}}}
GPA: {{{gpa}}} (out of 4.0)
{{#if satScore}}SAT Score: {{{satScore}}} (out of 1600)
{{/if}}{{#if actScore}}ACT Score: {{{actScore}}} (out of 36)
{{/if}}{{#if toeflScore}}TOEFL Score: {{{toeflScore}}} (out of 120)
{{/if}}{{#if apCourses}}AP Courses Taken:
{{#each apCourses}}- {{{this}}}
{{/each}}{{else}}No AP courses listed.
{{/if}}

Based on this information, provide a comprehensive analysis of their admission probability for {{{dreamSchool}}} in {{{major}}}.
Your response MUST be a JSON object conforming to the following schema, including the dreamSchool and major from the input:
{{jsonSchema output.schema}}
`,
});

// Flow definition
const admissionProbabilityAnalysisFlow = ai.defineFlow(
  {
    name: 'admissionProbabilityAnalysisFlow',
    inputSchema: AdmissionProbabilityAnalysisInputSchema,
    outputSchema: AdmissionProbabilityAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to get admission probability analysis from AI.');
    }
    return output;
  }
);
