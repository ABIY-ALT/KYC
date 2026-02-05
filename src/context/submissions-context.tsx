'use client';

import { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import { submissions as initialSubmissions, type Submission } from '@/lib/data';

type SubmissionsContextType = {
  submissions: Submission[];
  addSubmission: (submission: Submission) => void;
  updateSubmissionStatus: (submissionId: string, newStatus: Submission['status']) => void;
};

const SubmissionsContext = createContext<SubmissionsContextType | undefined>(undefined);

export function SubmissionsProvider({ children }: { children: ReactNode }) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);

  const addSubmission = useCallback((submission: Submission) => {
    setSubmissions(currentSubmissions => [submission, ...currentSubmissions]);
  }, []);

  const updateSubmissionStatus = useCallback((submissionId: string, newStatus: Submission['status']) => {
    setSubmissions(currentSubmissions =>
      currentSubmissions.map(s =>
        s.id === submissionId ? { ...s, status: newStatus } : s
      )
    );
  }, []);

  return (
    <SubmissionsContext.Provider value={{ submissions, addSubmission, updateSubmissionStatus }}>
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
