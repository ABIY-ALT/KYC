'use client';

import './workflow-status.css';
import {
  Check,
  ShieldCheck,
  ClipboardCheck,
  Flag,
  Send,
  Edit,
  History,
  FileSearch,
} from 'lucide-react';
import type { Submission } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AmendmentDialog } from '@/components/amendment-dialog';

type WorkflowStepData = {
  title: string;
  status: 'completed' | 'active' | 'pending';
  time: string;
  details: string;
  icon: React.ElementType;
  badge?: string;
};

const getWorkflowSteps = (submission: Submission): WorkflowStepData[] => {
    const steps: WorkflowStepData[] = [
      {
        title: 'Document Uploaded',
        status: 'pending',
        time: format(new Date(submission.submittedAt), 'MMM dd, hh:mm a'),
        details: `${submission.documents.length} document(s) uploaded by branch`,
        icon: Check,
      },
      {
        title: 'Under Review',
        status: 'pending',
        time: 'Awaiting action',
        details: `Officer: ${submission.officer || 'N/A'}`,
        icon: FileSearch,
      },
      {
        title: 'Amendment Cycle',
        status: 'pending',
        time: 'No amendments requested',
        details: 'Documents are pending initial review',
        icon: History,
      },
      {
        title: 'Supervisor Approval',
        status: 'pending',
        time: 'Awaiting action',
        details: 'Will be escalated if needed',
        icon: ShieldCheck,
      },
      {
        title: 'Completion',
        status: 'pending',
        time: 'Not started',
        details: 'Customer verification complete',
        icon: Flag,
      },
    ];

    // Mark initial upload as complete
    steps[0].status = 'completed';

    switch (submission.status) {
        case 'Pending':
            steps[1].status = 'active';
            steps[1].time = 'Currently in queue';
            steps[1].badge = 'Reviewing';
            break;
        case 'Amendment':
            steps[1].status = 'completed';
            steps[2].status = 'active';
            steps[2].time = 'Amendment Requested';
            steps[2].details = `Reason: ${submission.amendmentReason || 'Not specified'}`;
            steps[2].badge = 'Action Required by Branch';
            break;
        case 'Amended - Pending Review':
            steps[1].status = 'completed';
            steps[2].status = 'completed';
            steps[2].time = `Amended on ${format(new Date(submission.amendmentHistory?.slice(-1)[0]?.respondedAt || Date.now()), 'MMM dd, hh:mm a')}`;
            steps[2].details = `New documents submitted.`;
            steps[1].status = 'active'; // Back to review step
            steps[1].time = 'Pending re-review';
            steps[1].badge = 'Reviewing Amendment';
            break;
        case 'Escalated':
            steps[1].status = 'completed';
            steps[2].status = 'completed';
            steps[3].status = 'active';
            steps[3].time = 'Currently with supervisor';
            steps[3].badge = 'Escalated';
            break;
        case 'Approved':
        case 'Rejected':
            steps[1].status = 'completed';
            steps[2].status = 'completed';
            steps[3].status = 'completed';
            steps[4].status = 'completed';
            steps[4].time = 'Finished';
            steps[4].details = `Submission was ${submission.status}`;
            break;
    }
    
    return steps;
};

interface WorkflowStatusProps {
    submission: Submission;
    onEscalate: () => void;
    onApprove: () => void;
    onStatusChange: (newStatus: Submission['status'], reason?: string) => void;
    userRole: 'Officer' | 'Supervisor' | 'Admin' | 'Branch Manager';
}

export function WorkflowStatus({ submission, onEscalate, onApprove, onStatusChange, userRole }: WorkflowStatusProps) {
  const steps = getWorkflowSteps(submission);

  const canTakeAction = userRole === 'Officer' || userRole === 'Supervisor' || userRole === 'Admin';
  const showActions = canTakeAction && (submission.status === 'Pending' || submission.status === 'Amended - Pending Review' || submission.status === 'Escalated');

  return (
    <div className="workflow-container hover-lift">
      <div className="workflow-title">
        <h3>KYC Workflow Status</h3>
        <div className="workflow-time">Updated just now</div>
      </div>
      
      <div className="workflow-timeline">
        {steps.map((step, index) => (
          <div key={index} className={cn('workflow-step', step.status)}>
            <div className="step-indicator"><step.icon /></div>
            <div className="step-content">
              <div className="step-title">{step.title}</div>
              <div className="step-time">{step.time}</div>
              <div className="step-details">{step.details}</div>
              {step.badge && <div className={cn("step-badge", step.status === 'active' && 'reviewing')}>{step.badge}</div>}
            </div>
            {index < steps.length - 1 && <div className="step-connector"></div>}
          </div>
        ))}
      </div>
      
      {showActions && (
          <div className="workflow-actions">
            <button className="btn-escalate" onClick={onEscalate}>
              <Send /> Escalate
            </button>
            <AmendmentDialog 
              submissionId={submission.id}
              onStatusChange={onStatusChange}
              trigger={
                <button className="btn-request-amendment">
                    <Edit /> Amend
                </button>
              }
            />
            <button className="btn-approve" onClick={onApprove}>
              <Check /> Approve
            </button>
          </div>
      )}
    </div>
  );
}
