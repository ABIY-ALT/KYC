"use client";

import { useRouter } from 'next/navigation';
import { useSubmissions } from '@/context/submissions-context';
import { type Submission } from "@/lib/data";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WorkflowStatus } from '@/components/workflow-status';

export default function SubmissionReviewPage({ params }: { params: { id: string } }) {
    const { submissions, updateSubmissionStatus } = useSubmissions();
    const router = useRouter();
    const { toast } = useToast();
    
    const submission = submissions.find(s => s.id === params.id);
    
    if (!submission) {
        notFound();
    }
    
    const handleStatusChange = (newStatus: Submission['status']) => {
        updateSubmissionStatus(submission.id, newStatus);
        // Optionally, you can navigate away after a final action
        if (newStatus === 'Approved' || newStatus === 'Rejected') {
            setTimeout(() => router.push('/review-queue'), 1500);
        }
    };

    const handleApprove = () => {
        handleStatusChange('Approved');
        toast({ title: "Approved", description: `Submission ${submission.id} has been approved.`});
    };
    
    const handleEscalate = () => {
        handleStatusChange('Escalated');
        toast({ title: "Escalated", description: `Submission ${submission.id} has been escalated.`, variant: 'destructive'});
    }

    return (
        <div>
            <Button variant="outline" onClick={() => router.back()} className="mb-6">
                <ArrowLeft /> Back
            </Button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    <Card className="overflow-hidden">
                        <CardHeader>
                            <CardTitle>Document Viewer</CardTitle>
                            <CardDescription>Review the submitted document below for {submission.customerName}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative aspect-[8.5/11] w-full bg-muted rounded-md overflow-hidden border">
                                <Image 
                                    src={submission.documentUrl} 
                                    alt={`Document for ${submission.customerName}`}
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    data-ai-hint="document paper"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 flex flex-col gap-6">
                   <WorkflowStatus 
                        submission={submission}
                        onApprove={handleApprove}
                        onEscalate={handleEscalate}
                        onStatusChange={handleStatusChange}
                   />
                </div>
            </div>
        </div>
    );
}
