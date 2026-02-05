
'use client';

import { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import { submissions as initialSubmissions, type Submission, type SubmittedDocument, type AmendmentRequest, type Amendment } from '@/lib/data';

type NewAmendmentRequest = Omit<AmendmentRequest, 'id' | 'requestedAt' | 'status'>;

type FileData = { name: string; type: string; size: number; url: string; };

type SubmissionsContextType = {
  submissions: Submission[];
  addSubmission: (submission: Submission) => void;
  updateSubmissionStatus: (submissionId: string, newStatus: Submission['status'], details?: string | NewAmendmentRequest) => void;
  resolveAmendmentRequest: (submissionId: string, amendmentRequestId: string, branchComment: string, newFileData?: FileData) => void;
  submitAmendment: (submissionId: string, newDocuments: SubmittedDocument[], comment: string, responseType: string) => Promise<void>;
};

const SubmissionsContext = createContext<SubmissionsContextType | undefined>(undefined);

export function SubmissionsProvider({ children }: { children: ReactNode }) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);

  const addSubmission = useCallback((submission: Submission) => {
    setSubmissions(currentSubmissions => [submission, ...currentSubmissions]);
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
  
  const resolveAmendmentRequest = useCallback((submissionId: string, amendmentRequestId: string, branchComment: string, newFileData?: FileData) => {
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
                        url: newFileData.url,
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

  const submitAmendment = useCallback((submissionId: string, newDocuments: SubmittedDocument[], comment: string, responseType: string): Promise<void> => {
    return new Promise((resolve) => {
        setSubmissions(currentSubmissions =>
            currentSubmissions.map(s => {
                if (s.id === submissionId) {
                    // This combines all pending requests into a single history entry.
                    const reasons = s.pendingAmendments?.map(r => r.comment).join('\n') || 'General amendment response.';
                    
                    const newHistoryEntry: Amendment = {
                        requestedAt: s.pendingAmendments?.[0]?.requestedAt || new Date().toISOString(),
                        requestedBy: s.officer,
                        reason: reasons,
                        respondedAt: new Date().toISOString(),
                        responseComment: comment,
                        responseType: responseType,
                        documents: newDocuments,
                    };
                    
                    const updatedDocuments = [...s.documents, ...newDocuments];

                    const updatedSubmission: Submission = {
                        ...s,
                        status: 'Pending Review',
                        documents: updatedDocuments,
                        amendmentHistory: [...(s.amendmentHistory || []), newHistoryEntry],
                        pendingAmendments: [], // All pending requests are considered resolved
                    };

                    return updatedSubmission;
                }
                return s;
            })
        );
        resolve();
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
