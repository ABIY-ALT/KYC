'use client';

import { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import { submissions as initialSubmissions, type Submission, type SubmittedDocument, type AmendmentRequest, type Amendment } from '@/lib/data';

// This is the lightweight file object that comes from the UI.
type LocalAmendedFile = {
    file: File;
    documentType: string;
    originalDocumentId?: string;
    amendmentRequestId: string;
};

type SubmissionsContextType = {
  submissions: Submission[];
  addSubmission: (submission: Omit<Submission, 'amendmentHistory' | 'pendingAmendments'>) => void;
  updateSubmissionStatus: (submissionId: string, newStatus: Submission['status'], details?: string | Omit<AmendmentRequest, 'id' | 'requestedAt' | 'status'>) => void;
  submitAmendment: (submissionId: string, amendedFiles: LocalAmendedFile[], comment: string, responseType: string) => Promise<void>;
};

const SubmissionsContext = createContext<SubmissionsContextType | undefined>(undefined);

export function SubmissionsProvider({ children }: { children: ReactNode }) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);

  // Bank-safe state updater for amendment submissions
  const updateSubmissionState = useCallback((submissionId: string, amendment: Amendment) => {
    setSubmissions(prev =>
      prev.map(sub =>
        sub.id === submissionId
          ? {
              ...sub,
              status: "Pending Review", // Set status for the officer to re-review
              amendmentHistory: [...(sub.amendmentHistory || []), amendment], // Add the new amendment to history
              pendingAmendments: [], // Clear outstanding requests
              documents: [...sub.documents, ...amendment.documents], // Add new documents to the main list
            }
          : sub
      )
    );
  }, []);

  const submitAmendment = useCallback(async (submissionId: string, amendedFiles: LocalAmendedFile[], comment: string, responseType: string) => {
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) {
      throw new Error("Missing submissionId");
    }

    // Convert local files to clean, serializable metadata
    const newDocumentsForHistory: SubmittedDocument[] = amendedFiles.map(f => {
        const originalDoc = submission.documents.find(d => d.id === f.originalDocumentId);
        const version = (originalDoc?.version || 0) + 1;
        return {
            id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            fileName: f.file.name,
            documentType: f.documentType,
            // Use a safe, placeholder URL. The actual file would be uploaded to cloud storage in a real app.
            url: `https://picsum.photos/seed/doc${Date.now()}${Math.random()}/800/1100`, 
            size: f.file.size,
            format: f.file.type,
            uploadedAt: new Date().toISOString(),
            version: version,
        };
    });

    const reasons = submission.pendingAmendments?.map(r => r.comment).join('\n') || 'General amendment response.';

    /** 🔐 Construct amendment record (metadata only) */
    const amendmentRecord: Amendment = {
        requestedAt: submission.pendingAmendments?.[0]?.requestedAt || new Date().toISOString(),
        requestedBy: submission.officer,
        reason: reasons,
        respondedAt: new Date().toISOString(),
        responseComment: comment,
        responseType: responseType,
        documents: newDocumentsForHistory,
    };

    /** 🧠 IMPORTANT: NEVER mutate existing submission */
    updateSubmissionState(submissionId, amendmentRecord);
    
    /** Optional: In a real app, this would persist to Firestore. */
    // await persistAmendment(submissionId, amendmentRecord);

  }, [submissions, updateSubmissionState]);

  const addSubmission = useCallback((submission: Omit<Submission, 'amendmentHistory' | 'pendingAmendments'>) => {
    // Bank-safe implementation: Ensures only metadata is stored.
    const safeSubmission: Submission = {
      ...submission,
      documents: submission.documents.map(d => ({
        id: d.id,
        fileName: d.fileName,
        documentType: d.documentType,
        uploadedAt: d.uploadedAt,
        size: d.size,
        format: d.format,
        url: d.url, // URL is already a safe placeholder
        version: d.version,
      })),
    };
    setSubmissions(currentSubmissions => [safeSubmission, ...currentSubmissions]);
  }, []);

  const updateSubmissionStatus = useCallback((submissionId: string, newStatus: Submission['status'], details?: string | Omit<AmendmentRequest, 'id' | 'requestedAt' | 'status'>) => {
    setSubmissions(currentSubmissions =>
      currentSubmissions.map(s => {
        if (s.id === submissionId) {
            const updatedSubmission: Submission = { ...s, status: newStatus };
            
            if (newStatus === 'Action Required' && details && typeof details !== 'string') {
                const newRequest: AmendmentRequest = {
                  id: `amend-req-${Date.now()}`,
                  requestedAt: new Date().toISOString(),
                  status: 'PENDING',
                  ...details
                };
                updatedSubmission.pendingAmendments = [...(s.pendingAmendments || []), newRequest];
            }

            return updatedSubmission;
        }
        return s;
      })
    );
  }, []);

  const value = { submissions, addSubmission, updateSubmissionStatus, submitAmendment };

  return (
    <SubmissionsContext.Provider value={value}>
      {children}
    </SubmissionsContext.Provider>
  );
}

export function useSubmissions() {
  const context = useContext(SubmissionsContext);
  if (context === undefined) {
    throw new Error('useSubmissions must be used within a SubmissionsProvider');
  }
  return context;
}
