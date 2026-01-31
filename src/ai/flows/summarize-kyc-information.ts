'use server';

/**
 * @fileOverview Summarizes key information from KYC documents for supervisors.
 *
 * - summarizeKycInformation - A function that summarizes KYC information.
 * - SummarizeKycInformationInput - The input type for summarizeKycInformation function.
 * - SummarizeKycInformationOutput - The return type for summarizeKycInformation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeKycInformationInputSchema = z.object({
  documents: z.string().describe('The KYC documents to summarize.'),
  caseDetails: z.string().describe('Details about the specific KYC case.'),
});
export type SummarizeKycInformationInput = z.infer<typeof SummarizeKycInformationInputSchema>;

const SummarizeKycInformationOutputSchema = z.object({
  summary: z.string().describe('A summary of the key information from the KYC documents and case details.'),
});
export type SummarizeKycInformationOutput = z.infer<typeof SummarizeKycInformationOutputSchema>;

export async function summarizeKycInformation(input: SummarizeKycInformationInput): Promise<SummarizeKycInformationOutput> {
  return summarizeKycInformationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeKycInformationPrompt',
  input: {schema: SummarizeKycInformationInputSchema},
  output: {schema: SummarizeKycInformationOutputSchema},
  prompt: `You are an expert KYC analyst.

  Summarize the key information from the following KYC documents and case details so that a supervisor can quickly understand the critical details and make informed decisions on escalated cases.

  KYC Documents: {{{documents}}}
  Case Details: {{{caseDetails}}}
  `,
});

const summarizeKycInformationFlow = ai.defineFlow(
  {
    name: 'summarizeKycInformationFlow',
    inputSchema: SummarizeKycInformationInputSchema,
    outputSchema: SummarizeKycInformationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
