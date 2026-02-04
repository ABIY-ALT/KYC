"use client";

import { useRouter } from 'next/navigation';
import { useSubmissions } from '@/context/submissions-context';
import { type Submission } from "@/lib/data";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, User, Building, Check, Send, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { AmendmentDialog } from "@/components/amendment-dialog";
import { useToast } from "@/hooks/use-toast";

function ActionButtons({ submission, onStatusChange }: { submission: Submission, onStatusChange: (newStatus: Submission['status']) => void }) {
    const { toast } = useToast();

    const handleApprove = () => {
        onStatusChange('Approved');
        toast({ title: "Approved", description: `Submission ${submission.id} has been approved.`});
    };
    
    const handleEscalate = () => {
        onStatusChange('Escalated');
        toast({ title: "Escalated", description: `Submission ${submission.id} has been escalated.`, variant: 'destructive'});
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
                <CardDescription>Review complete? Take the next step.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-2">
                <Button onClick={handleApprove}>
                    <Check /> Approve Submission
                </Button>
                <AmendmentDialog submissionId={submission.id} onStatusChange={onStatusChange} />
                <Button variant="destructive" onClick={handleEscalate}>
                    <Send /> Escalate to Supervisor
                </Button>
            </CardContent>
        </Card>
    );
}


export default function SubmissionReviewPage({ params }: { params: { id: string } }) {
    const { submissions, updateSubmissionStatus } = useSubmissions();
    const router = useRouter();
    
    const submission = submissions.find(s => s.id === params.id);
    
    if (!submission) {
        notFound();
    }
    
    const handleStatusChange = (newStatus: Submission['status']) => {
        updateSubmissionStatus(submission.id, newStatus);
    };

    const details = [
        { label: "Customer Name", value: submission.customerName, icon: User },
        { label: "Branch", value: submission.branch, icon: Building },
        { label: "Submitted At", value: format(new Date(submission.submittedAt), "PPP p"), icon: Calendar },
        { label: "Document Type", value: submission.documentType, icon: FileText },
    ];

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
                            <CardDescription>Review the submitted document below.</CardDescription>
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Submission Details</CardTitle>
                            <div className="flex items-center gap-2 pt-2">
                                <span className="text-sm text-muted-foreground">Status:</span>
                                <Badge variant={
                                    submission.status === 'Approved' ? 'default'
                                    : submission.status === 'Pending' ? 'secondary'
                                    : submission.status === 'Escalated' ? 'destructive'
                                    : 'outline'
                                }>{submission.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {details.map((item, index) => (
                                <div key={index} className="flex items-center gap-3 text-sm">
                                    <item.icon className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">{item.value}</p>
                                        <p className="text-xs text-muted-foreground">{item.label}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    
                    <ActionButtons submission={submission} onStatusChange={handleStatusChange} />
                </div>
            </div>
        </div>
    );
}
