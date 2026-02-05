"use client";

import { useRouter } from 'next/navigation';
import Image from "next/image";
import { notFound } from "next/navigation";
import { useSubmissions } from '@/context/submissions-context';
import { type Submission } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkflowStatus } from '@/components/workflow-status';
import { ArrowLeft, FileText, Eye } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

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
        toast({
            title: `Status Updated: ${newStatus}`,
            description: `Submission for ${submission.customerName} is now ${newStatus}.`,
            variant: newStatus === 'Approved' ? 'default' : newStatus === 'Rejected' || newStatus === 'Escalated' ? 'destructive' : 'default'
        });
        if (newStatus === 'Approved' || newStatus === 'Rejected') {
            setTimeout(() => router.push('/review-queue'), 1500);
        }
    };

    const handleApprove = () => handleStatusChange('Approved');
    const handleEscalate = () => handleStatusChange('Escalated');

    return (
        <div>
            <Button variant="outline" onClick={() => router.back()} className="mb-6">
                <ArrowLeft /> Back
            </Button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                     <Card className="hover-lift">
                        <CardHeader>
                            <CardTitle className="gradient-text">Reviewing Submission for {submission.customerName}</CardTitle>
                            <CardDescription>ID: {submission.id} | Branch: {submission.branch}</CardDescription>
                        </CardHeader>
                    </Card>

                    {submission.documents.map((doc, index) => (
                        <Card key={doc.id} className="hover-lift">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">{doc.documentType}</CardTitle>
                                <CardDescription>{doc.fileName} - {(doc.size / 1024).toFixed(1)} KB</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden border">
                                    {doc.format.startsWith('image/') ? (
                                        <Image 
                                            src={doc.url} 
                                            alt={`Document for ${submission.customerName}`}
                                            fill
                                            style={{ objectFit: 'contain' }}
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            data-ai-hint="document paper"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <FileText className="h-16 w-16 text-muted-foreground" />
                                            <p className="mt-2 text-muted-foreground">PDF Document</p>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button className="mt-4"><Eye className="mr-2"/>View PDF</Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-4xl h-[90vh]">
                                                    <DialogHeader>
                                                        <DialogTitle>{doc.fileName}</DialogTitle>
                                                        <DialogDescription>
                                                          Viewing PDF document for {submission.customerName}.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <iframe src={doc.url} className="w-full h-full rounded-md border" />
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="lg:col-span-1 flex flex-col gap-6 sticky top-24">
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
