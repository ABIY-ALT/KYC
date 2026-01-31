"use server";

import { aiAssistedComplianceCheck, AiAssistedComplianceCheckInput } from '@/ai/flows/ai-assisted-compliance-check';

// A mock for regulatory guidelines. In a real app, this would come from a database or a configuration file.
const regulatoryGuidelines = `
1.  **Identity Verification**: The document must be a government-issued photo ID (e.g., Passport, National ID, Driver's License).
2.  **Full Name Match**: The name on the document must exactly match the customer's registered name. For example, 'Alice Johnson' not 'A. Johnson'.
3.  **Expiry Date**: The document must not be expired. The expiration date must be clearly visible and in the future.
4.  **Date of Birth**: The date of birth must be present and match the customer's records.
5.  **Document Integrity**: The document should not show signs of tampering, alteration, or damage that obscures information.
6.  **Image Quality**: The photo on the ID must be clear and recognizable.
`;

export async function runComplianceCheck(documentText: string) {
    try {
        if (!documentText) {
            return { error: "Document text is empty. Cannot perform compliance check." };
        }
        
        const input: AiAssistedComplianceCheckInput = {
            documentText,
            regulatoryGuidelines,
        };
        const result = await aiAssistedComplianceCheck(input);
        return result;
    } catch (error) {
        console.error("AI Compliance Check failed:", error);
        return { error: "An error occurred during the AI compliance check. Please try again later." };
    }
}
