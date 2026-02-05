"use client";

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { Submission } from "@/lib/data";

interface AmendmentRequestInfoModalProps {
  submission: Submission | null;
  onClose: () => void;
}

export function AmendmentRequestInfoModal({ submission, onClose }: AmendmentRequestInfoModalProps) {
  const router = useRouter();

  if (!submission) {
    return null;
  }

  const handleProceed = () => {
    onClose();
    router.push(`/review-queue/${submission.id}`);
  };

  return (
    <Dialog open={!!submission} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Amendment Request Details</DialogTitle>
          <DialogDescription>
            A KYC Officer has requested changes for submission ID: {submission.id}. 
            Click "Proceed to Upload" to go to the amendment page.
          </DialogDescription>
        </DialogHeader>
        <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Officer's Comment</AlertTitle>
            <AlertDescription>
                "{submission.amendmentReason || 'No specific reason was provided.'}"
            </AlertDescription>
        </Alert>
        <DialogFooter className="sm:justify-between">
            <Button type="button" variant="outline" onClick={onClose}>
                Close
            </Button>
            <Button type="button" onClick={handleProceed}>
                Proceed to Upload
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
