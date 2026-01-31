// This file implements the AI-assisted compliance check flow.
// It allows KYC Officers to pre-screen submitted KYC documents using AI.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiAssistedComplianceCheckInputSchema = z.object({
  documentText: z.string().describe('The text content of the KYC document.'),
  regulatoryGuidelines: z.string().describe('The KYC regulatory guidelines.'),
});
export type AiAssistedComplianceCheckInput = z.infer<typeof AiAssistedComplianceCheckInputSchema>;

const AiAssistedComplianceCheckOutputSchema = z.object({
  complianceSummary: z.string().describe('A summary of the compliance check, highlighting potential issues and discrepancies.'),
  isCompliant: z.boolean().describe('Whether the document is compliant based on the AI analysis.'),
});
export type AiAssistedComplianceCheckOutput = z.infer<typeof AiAssistedComplianceCheckOutputSchema>;

export async function aiAssistedComplianceCheck(
  input: AiAssistedComplianceCheckInput
): Promise<AiAssistedComplianceCheckOutput> {
  return aiAssistedComplianceCheckFlow(input);
}

const aiAssistedComplianceCheckPrompt = ai.definePrompt({
  name: 'aiAssistedComplianceCheckPrompt',
  input: {schema: AiAssistedComplianceCheckInputSchema},
  output: {schema: AiAssistedComplianceCheckOutputSchema},
  prompt: `You are an AI assistant that reviews KYC documents for compliance with regulatory guidelines.

  Document Text: {{{documentText}}}
  Regulatory Guidelines: {{{regulatoryGuidelines}}}

  Analyze the document and provide a compliance summary, highlighting any potential issues or discrepancies.
  Also, determine if the document is compliant based on your analysis and set the isCompliant field accordingly. Return the response as a valid JSON.
  `,
});

const aiAssistedComplianceCheckFlow = ai.defineFlow(
  {
    name: 'aiAssistedComplianceCheckFlow',
    inputSchema: AiAssistedComplianceCheckInputSchema,
    outputSchema: AiAssistedComplianceCheckOutputSchema,
  },
  async input => {
    const {output} = await aiAssistedComplianceCheckPrompt(input);
    return output!;
  }
);
