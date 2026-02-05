'use client';

import { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import { submissions as initialSubmissions, type Submission, type SubmittedDocument, type AmendmentRequest, type Amendment } from '@/lib/data';

type SubmissionsContextType = {
  submissions: Submission[];
  addSubmission: (submission: Submission) => void;
  updateSubmissionStatus: (submissionId: string, newStatus: Submission['status'], reason?: string) => void;
  resolveAmendmentRequest: (submissionId: string, amendmentRequestId: string, branchComment: string, newFile?: File) => void;
};

const SubmissionsContext = createContext<SubmissionsContextType | undefined>(undefined);

export function SubmissionsProvider({ children }: { children: ReactNode }) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);

  const addSubmission = useCallback((submission: Submission) => {
    setSubmissions(currentSubmissions => [submission, ...currentSubmissions]);
  }, []);

  const updateSubmissionStatus = useCallback((submissionId: string, newStatus: Submission['status'], reason?: string) => {
    setSubmissions(currentSubmissions =>
      currentSubmissions.map(s => {
        if (s.id === submissionId) {
            const updatedSubmission: Submission = { ...s, status: newStatus };
            if (newStatus === 'Action Required' && reason) {
                const newRequest: AmendmentRequest = {
                  id: `amend-req-${Date.now()}`,
                  type: 'REPLACE_EXISTING', // This is a default, a real app would need a UI for the officer to choose
                  targetDocumentId: s.documents[0]?.id,
                  targetDocumentType: s.documents[0]?.documentType || 'Unknown',
                  comment: reason,
                  requestedAt: new Date().toISOString(),
                  status: 'PENDING'
                };
                updatedSubmission.pendingAmendments = [...(s.pendingAmendments || []), newRequest];
            }
            return updatedSubmission;
        }
        return s;
      })
    );
  }, []);
  
  const resolveAmendmentRequest = useCallback((submissionId: string, amendmentRequestId: string, branchComment: string, newFile?: File) => {
      setSubmissions(currentSubmissions => 
        currentSubmissions.map(s => {
            if (s.id === submissionId) {
                const request = s.pendingAmendments?.find(req => req.id === amendmentRequestId);
                if (!request) return s;

                let newDocumentForHistory: SubmittedDocument | undefined = undefined;
                let updatedDocuments = [...s.documents];

                if (newFile) {
                    let version = 1;
                    if (request.type === 'REPLACE_EXISTING') {
                        const existingDocs = s.documents.filter(d => d.documentType === request.targetDocumentType);
                        const maxVersion = Math.max(0, ...existingDocs.map(d => d.version || 1));
                        version = maxVersion + 1;
                    }

                    const newDocument: SubmittedDocument = {
                        id: `doc-${Date.now()}`,
                        fileName: newFile.name,
                        documentType: request.targetDocumentType,
                        url: URL.createObjectURL(newFile),
                        size: newFile.size,
                        format: newFile.type,
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
                    responseType: newFile ? 'File Submitted' : 'Comment Only',
                    documents: newDocumentForHistory ? [newDocumentForHistory] : [],
                };

                const updatedPendingAmendments = s.pendingAmendments?.filter(req => req.id !== amendmentRequestId);
                
                return {
                    ...s,
                    documents: updatedDocuments,
                    amendmentHistory: [...(s.amendmentHistory || []), newHistoryEntry],
                    pendingAmendments: updatedPendingAmendments,
                    status: updatedPendingAmendments?.length === 0 ? 'Pending Review' : s.status,
                };
            }
            return s;
        })
      );
  }, []);


  return (
    <SubmissionsContext.Provider value={{ submissions, addSubmission, updateSubmissionStatus, resolveAmendmentRequest }}>
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
