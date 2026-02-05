'use client';

import { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import { submissions as initialSubmissions, type Submission, type SubmittedDocument } from '@/lib/data';

type SubmissionsContextType = {
  submissions: Submission[];
  addSubmission: (submission: Submission) => void;
  updateSubmissionStatus: (submissionId: string, newStatus: Submission['status'], reason?: string) => void;
  submitAmendment: (submissionId: string, amendedDocuments: SubmittedDocument[], branchComment?: string) => void;
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
            const updatedSubmission = { ...s, status: newStatus };
            if (newStatus === 'Amendment' && reason) {
                updatedSubmission.amendmentReason = reason;
            }
            return updatedSubmission;
        }
        return s;
      })
    );
  }, []);

  const submitAmendment = useCallback((submissionId: string, amendedDocuments: SubmittedDocument[], branchComment?: string) => {
      setSubmissions(currentSubmissions => 
        currentSubmissions.map(s => {
            if (s.id === submissionId) {
                const newHistoryEntry = {
                    requestedAt: new Date().toISOString(), // This would ideally be stored from the request
                    requestedBy: s.officer,
                    reason: s.amendmentReason || "No reason specified",
                    respondedAt: new Date().toISOString(),
                    responseComment: branchComment,
                    documents: amendedDocuments
                };

                return {
                    ...s,
                    status: 'Amended - Pending Review',
                    amendmentHistory: [...(s.amendmentHistory || []), newHistoryEntry],
                    amendmentReason: undefined, // Clear the reason after submission
                };
            }
            return s;
        })
      );
  }, []);

  return (
    <SubmissionsContext.Provider value={{ submissions, addSubmission, updateSubmissionStatus, submitAmendment }}>
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
