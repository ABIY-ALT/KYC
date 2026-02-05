"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";
import type { Submission } from "@/lib/data";

// The trigger is now a ReactNode that will be wrapped by DialogTrigger
export function AmendmentDialog({ onStatusChange, submissionId, trigger }: { onStatusChange: (newStatus: Submission['status']) => void, submissionId: string, trigger?: React.ReactNode }) {
    const { toast } = useToast();
    const [reason, setReason] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const handleSendRequest = () => {
        if (reason.trim().length === 0) {
            toast({
                title: "Error",
                description: "Please provide a reason for the amendment request.",
                variant: "destructive",
            });
            return;
        }
        
        onStatusChange('Amendment');
        
        toast({
            title: "Request Sent",
            description: "An amendment request has been sent to the branch.",
        });
        setReason("");
        setIsOpen(false);
    };

    // The default trigger if none is provided
    const defaultTrigger = <Button variant="outline"><AlertTriangle /> Request Amendment</Button>;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || defaultTrigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Request Amendment</DialogTitle>
                    <DialogDescription>
                        Clearly explain what corrections are needed for this submission. The branch will be notified.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="message">Reason for Amendment</Label>
                        <Textarea
                            placeholder="e.g., The provided ID is expired. Please upload a valid, non-expired ID."
                            id="message"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" onClick={handleSendRequest}>Send Request</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
