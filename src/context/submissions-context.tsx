'use client';

import { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import { submissions as initialSubmissions, type Submission, type SubmittedDocument, type AmendmentRequest, type Amendment } from '@/lib/data';

type NewAmendmentRequest = Omit<AmendmentRequest, 'id' | 'requestedAt' | 'status'>;

// This is the payload received from the form.
type AmendedFilePayload = {
    file: File;
    documentType: string;
    originalDocumentId?: string;
    amendmentRequestId: string;
    previewUrl: string; // This is a blob URL that should NOT be stored long-term.
};

type SubmissionsContextType = {
  submissions: Submission[];
  addSubmission: (submission: Submission) => void;
  updateSubmissionStatus: (submissionId: string, newStatus: Submission['status'], details?: string | NewAmendmentRequest) => void;
  resolveAmendmentRequest: (submissionId: string, amendmentRequestId: string, branchComment: string, newFileData?: { name: string; size: number; type: string; url: string }) => void;
  submitAmendment: (submissionId: string, amendedFiles: AmendedFilePayload[], comment: string, responseType: string) => Promise<void>;
};

const SubmissionsContext = createContext<SubmissionsContextType | undefined>(undefined);

export function SubmissionsProvider({ children }: { children: ReactNode }) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);

  const addSubmission = useCallback((submission: Submission) => {
    // Bank-safe implementation: Explicitly create a new object with only serializable metadata.
    // This prevents large objects (like File or Blob) from ever being stored
    // in the global context, which is the root cause of the UI freezes.
    const safeSubmission: Submission = {
      id: submission.id,
      customerName: submission.customerName,
      branch: submission.branch,
      submittedAt: submission.submittedAt,
      status: submission.status,
      officer: submission.officer,
      documents: submission.documents.map(d => ({
        id: d.id,
        fileName: d.fileName,
        documentType: d.documentType,
        uploadedAt: d.uploadedAt,
        size: d.size,
        format: d.format,
        url: d.url,
        version: d.version,
      })),
      // Ensure optional fields are handled correctly
      amendmentHistory: submission.amendmentHistory ? [...submission.amendmentHistory] : undefined,
      pendingAmendments: submission.pendingAmendments ? [...submission.pendingAmendments] : undefined,
    };
    setSubmissions(currentSubmissions => [safeSubmission, ...currentSubmissions]);
  }, []);

  const updateSubmissionStatus = useCallback((submissionId: string, newStatus: Submission['status'], details?: string | NewAmendmentRequest) => {
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
  
  const resolveAmendmentRequest = useCallback((submissionId: string, amendmentRequestId: string, branchComment: string, newFileData?: { name: string; size: number; type: string; url: string }) => {
      setSubmissions(currentSubmissions => 
        currentSubmissions.map(s => {
            if (s.id === submissionId) {
                const request = s.pendingAmendments?.find(req => req.id === amendmentRequestId);
                if (!request) return s;

                let newDocumentForHistory: SubmittedDocument | undefined = undefined;
                let updatedDocuments = [...s.documents];

                if (newFileData) {
                    let version = 1;
                    if (request.type === 'REPLACE_EXISTING') {
                        const existingDocs = s.documents.filter(d => d.documentType === request.targetDocumentType);
                        const maxVersion = Math.max(0, ...existingDocs.map(d => d.version || 1));
                        version = maxVersion + 1;
                    }

                    const newDocument: SubmittedDocument = {
                        id: `doc-${Date.now()}`,
                        fileName: newFileData.name,
                        documentType: request.targetDocumentType,
                        url: `https://picsum.photos/seed/doc${Date.now()}/800/1100`,
                        size: newFileData.size,
                        format: newFileData.type,
                        uploadedAt: new Date().toISOString(),
                        version: version
                    };
                    updatedDocuments.push(newDocument);
                    newDocumentForHistory = newDocument;
                }

                const newHistoryEntry: Amendment = {
                    requestedAt: request.requestedAt,
                    requestedBy: s.officer,
                    reason: request.comment,
                    respondedAt: new Date().toISOString(),
                    responseComment: branchComment,
                    responseType: newFileData ? 'File Submitted' : 'Comment Only',
                    documents: newDocumentForHistory ? [newDocumentForHistory] : [],
                };

                const updatedPendingAmendments = (s.pendingAmendments || []).filter(req => req.id !== amendmentRequestId);
                
                const updatedSubmission: Submission = {
                    ...s,
                    documents: updatedDocuments,
                    amendmentHistory: [...(s.amendmentHistory || []), newHistoryEntry],
                    pendingAmendments: updatedPendingAmendments,
                    status: updatedPendingAmendments.length === 0 ? 'Pending Review' : s.status,
                };
                return updatedSubmission;
            }
            return s;
        })
      );
  }, []);

  const submitAmendment = useCallback(async (submissionId: string, amendedFiles: AmendedFilePayload[], comment: string, responseType: string): Promise<void> => {
    // This is now a true async function.
    return new Promise(resolve => {
        setTimeout(() => { // Simulate async backend call
            setSubmissions(currentSubmissions =>
                currentSubmissions.map(s => {
                    if (s.id === submissionId) {
                        const reasons = s.pendingAmendments?.map(r => r.comment).join('\n') || 'General amendment response.';
                        
                        // CRITICAL: Convert the payload with File objects into lightweight SubmittedDocument objects.
                        // DO NOT store the blob URL or File object in the global state.
                        const newDocumentsForState: SubmittedDocument[] = amendedFiles.map(f => {
                            const originalDoc = s.documents.find(d => d.id === f.originalDocumentId);
                            const version = (originalDoc?.version || 0) + 1;
                            return {
                                id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                                fileName: f.file.name,
                                documentType: f.documentType,
                                // Use a placeholder URL, NOT the blob URL from the payload.
                                url: `https://picsum.photos/seed/doc${Date.now()}${Math.random()}/800/1100`, 
                                size: f.file.size,
                                format: f.file.type,
                                uploadedAt: new Date().toISOString(),
                                version: version,
                            };
                        });
                        
                        const newHistoryEntry: Amendment = {
                            requestedAt: s.pendingAmendments?.[0]?.requestedAt || new Date().toISOString(),
                            requestedBy: s.officer,
                            reason: reasons,
                            respondedAt: new Date().toISOString(),
                            responseComment: comment,
                            responseType: responseType,
                            documents: newDocumentsForState, // Use the new lightweight documents.
                        };
                        
                        const updatedDocuments = [...s.documents, ...newDocumentsForState];

                        return {
                            ...s,
                            status: 'Pending Review',
                            documents: updatedDocuments,
                            amendmentHistory: [...(s.amendmentHistory || []), newHistoryEntry],
                            pendingAmendments: [], // Clear pending requests.
                        };
                    }
                    return s;
                })
            );
            resolve();
        }, 500); // Simulate network latency
    });
  }, []);


  return (
    <SubmissionsContext.Provider value={{ submissions, addSubmission, updateSubmissionStatus, resolveAmendmentRequest, submitAmendment }}>
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
