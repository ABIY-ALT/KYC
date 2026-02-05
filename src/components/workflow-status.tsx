'use client';

import './workflow-status.css';
import {
  Check,
  ShieldCheck,
  ClipboardCheck,
  Flag,
  Send,
  Edit,
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
        details: `${submission.documentType} uploaded by branch`,
        icon: Check,
      },
      {
        title: 'Under Review',
        status: 'pending',
        time: 'Awaiting action',
        details: `Officer: ${submission.officer || 'N/A'}`,
        icon: ShieldCheck,
      },
      {
        title: 'Supervisor Approval',
        status: 'pending',
        time: 'Awaiting action',
        details: 'Will be escalated if needed',
        icon: ClipboardCheck,
      },
      {
        title: 'Completion',
        status: 'pending',
        time: 'Not started',
        details: 'Customer verification complete',
        icon: Flag,
      },
    ];

    if (submission.status === 'Pending') {
        steps[0].status = 'completed';
        steps[1].status = 'active';
        steps[1].time = 'Currently in queue';
        steps[1].badge = 'Reviewing';
    } else if (submission.status === 'Amendment') {
        steps[0].status = 'completed';
        steps[1].status = 'active';
        steps[1].time = 'Amendment Requested';
        steps[1].badge = 'Amendment';
    } else if (submission.status === 'Escalated') {
        steps[0].status = 'completed';
        steps[1].status = 'completed';
        steps[2].status = 'active';
        steps[2].time = 'Currently with supervisor';
        steps[2].badge = 'Escalated';
    } else if (submission.status === 'Approved' || submission.status === 'Rejected') {
        steps[0].status = 'completed';
        steps[1].status = 'completed';
        steps[2].status = 'completed';
        steps[3].status = 'completed';
        steps[3].time = 'Finished';
        steps[3].details = `Submission was ${submission.status}`;
    } else { // default for pending
        steps[0].status = 'completed';
        steps[1].status = 'active';
        steps[1].time = 'Currently in queue';
        steps[1].badge = 'Reviewing';
    }
    return steps;
};

interface WorkflowStatusProps {
    submission: Submission;
    onEscalate: () => void;
    onApprove: () => void;
    onStatusChange: (newStatus: Submission['status']) => void;
}

export function WorkflowStatus({ submission, onEscalate, onApprove, onStatusChange }: WorkflowStatusProps) {
  const steps = getWorkflowSteps(submission);

  return (
    <div className="workflow-container">
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
      
      <div className="workflow-actions">
        <button className="btn-escalate" onClick={onEscalate}>
          <Send /> Escalate to Supervisor
        </button>
        <AmendmentDialog 
          submissionId={submission.id}
          onStatusChange={onStatusChange}
          trigger={
             <button className="btn-request-amendment">
                <Edit /> Request Amendment
            </button>
          }
        />
        <button className="btn-approve" onClick={onApprove}>
          <Check /> Approve Document
        </button>
      </div>
    </div>
  );
}
