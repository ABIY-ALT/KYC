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

  const submitAmendment = useCallback(
    async (
      submissionId: string,
      amendedFiles: LocalAmendedFile[],
      comment: string,
      responseType: string
    ) => {
      if (!amendedFiles.length) {
        throw new Error("No amended files provided");
      }
  
      setSubmissions(prev =>
        prev.map(sub => {
          if (sub.id !== submissionId) return sub;
  
          const now = new Date().toISOString();
  
          // Build documents metadata ONLY
          const amendmentDocuments: SubmittedDocument[] = amendedFiles.map((f, index) => {
            const original = sub.documents.find(d => d.id === f.originalDocumentId);
            const nextVersion = (original?.version ?? 0) + 1;
  
            return {
              id: `doc-${submissionId}-${nextVersion}-${index}`,
              fileName: f.file.name,
              documentType: f.documentType,
              url: `https://picsum.photos/seed/amd${Date.now()}${index}/800/1100`, // placeholder
              size: f.file.size,
              format: f.file.type,
              uploadedAt: now,
              version: nextVersion,
            };
          });
  
          const amendment: Amendment = {
            requestedAt: sub.pendingAmendments?.[0]?.requestedAt ?? now,
            requestedBy: sub.officer,
            reason:
              sub.pendingAmendments?.map(r => r.comment).join("\n") ??
              "Amendment requested",
            respondedAt: now,
            responseComment: comment,
            responseType,
            documents: amendmentDocuments,
          };
  
          return {
            ...sub,
            status: "Pending Review",
            amendmentHistory: [...(sub.amendmentHistory ?? []), amendment],
            pendingAmendments: [],
  
            // ⚠️ DO NOT duplicate entire document list
            documents: sub.documents,
          };
        })
      );
  
      // Optional persistence hook
      // await persistAmendment(submissionId, amendment);
    },
    []
  );

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
