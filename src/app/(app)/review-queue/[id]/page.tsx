
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, notFound, useParams } from 'next/navigation';
import Image from "next/image";
import { useSubmissions } from '@/context/submissions-context';
import { type Submission, type SubmittedDocument, type User as UserData } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkflowStatus } from '@/components/workflow-status';
import { ArrowLeft, FileText, Eye, MessageSquareReply, CheckCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const renderFilePreviewIcon = (file: SubmittedDocument) => {
    const fileType = file.format;
    const fileUrl = file.url;

    if (fileType.startsWith("image/")) {
      return <Image src={fileUrl} alt={file.fileName} width={40} height={40} className="rounded-sm object-cover" />
    }
    return <FileText className="h-10 w-10 text-muted-foreground" />
}

export default function SubmissionReviewPage() {
    const params = useParams<{ id: string }>();
    const { submissions, updateSubmissionStatus } = useSubmissions();
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [firestore, authUser]);
    const { data: userData } = useDoc<UserData>(userDocRef);

    const router = useRouter();
    const { toast } = useToast();
    
    const [submissionState, setSubmissionState] = useState<Submission | undefined>();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Find submission based on id from params
        if (params) {
            const submission = submissions.find(s => s.id === params.id);
            setSubmissionState(submission);
        }
        setIsLoading(false);
    }, [params, submissions]);
    
    const handleStatusChange = (newStatus: Submission['status'], reason?: string) => {
        if (!submissionState) return;
        updateSubmissionStatus(submissionState.id, newStatus, reason);
        setSubmissionState(prev => prev ? { ...prev, status: newStatus } : undefined);
        toast({
            title: `Status Updated: ${newStatus}`,
            description: `Submission for ${submissionState.customerName} is now ${newStatus}.`,
            variant: newStatus.includes('Approved') ? 'default' : newStatus.includes('Reject') || newStatus.includes('Escalate') ? 'destructive' : 'default'
        });
        if (newStatus === 'Approved' || newStatus === 'Rejected') {
            setTimeout(() => router.push('/review-queue'), 1500);
        }
    };

    const documentsByType = useMemo(() => {
        if (!submissionState) return [];
        const allDocs = submissionState.documents;
        
        const grouped = allDocs.reduce((acc, doc) => {
            const type = doc.documentType;
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(doc);
            return acc;
        }, {} as Record<string, SubmittedDocument[]>);
        
        // Sort versions within each group
        for (const type in grouped) {
            grouped[type].sort((a, b) => (b.version || 1) - (a.version || 1));
        }
        
        return Object.entries(grouped);
    }, [submissionState]);

    if (isLoading) {
        return (
            <div>
                <Skeleton className="h-10 w-24 mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                    <div className="lg:col-span-1 flex flex-col gap-6 sticky top-24">
                        <Skeleton className="h-96 w-full" />
                    </div>
                </div>
            </div>
        );
    }
    
    if (!submissionState) {
        notFound();
    }
    
    const handleApprove = () => handleStatusChange('Approved');
    const handleEscalate = () => handleStatusChange('Escalated');

    const userRole = userData?.role || 'Officer';
    
    const latestResponse = submissionState.amendmentHistory?.slice(-1)[0];

    // This page is now purely for review by Officers/Supervisors.
    return (
        <div>
            <Button variant="outline" onClick={() => router.back()} className="mb-6">
                <ArrowLeft /> Back
            </Button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                     <Card className="hover-lift">
                        <CardHeader>
                            <CardTitle className="gradient-text">Reviewing Submission for {submissionState.customerName}</CardTitle>
                            <CardDescription>ID: {submissionState.id} | Branch: {submissionState.branch}</CardDescription>
                        </CardHeader>
                    </Card>

                    {submissionState.status === 'Pending Review' && latestResponse && (
                         <Card className="hover-lift bg-primary/5 border-primary">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl"><MessageSquareReply /> Branch Response</CardTitle>
                                <CardDescription>
                                    Response received on {format(new Date(latestResponse.respondedAt!), "PPP 'at' p")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-xs font-semibold">Response Type</Label>
                                    <p>{latestResponse.responseType}</p>
                                </div>
                                <Separator/>
                                <div>
                                    <Label className="text-xs font-semibold">Branch Comment</Label>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{latestResponse.responseComment}</p>
                                </div>
                            </CardContent>
                             <CardFooter>
                                <Button variant="outline"><CheckCircle className="mr-2"/>Acknowledge & Continue</Button>
                            </CardFooter>
                        </Card>
                    )}

                    {documentsByType.map(([type, docs]) => (
                        <Card key={type} className="hover-lift">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">{type}</CardTitle>
                                <CardDescription>{docs.length} version(s) available. The latest version is at the top.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {docs.map(doc => (
                                    <div key={doc.id} className="p-3 border rounded-lg bg-muted/30">
                                        <div className="flex justify-between items-center">
                                            <div className="grid gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">Version {doc.version || 1}</Badge>
                                                    <p className="text-sm text-muted-foreground">{doc.fileName}</p>
                                                </div>
                                                <p className="text-xs text-muted-foreground pl-1">{format(new Date(doc.uploadedAt), "PPP 'at' p")}</p>
                                            </div>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm"><Eye className="mr-2"/>View</Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-4xl h-[90vh]">
                                                    <DialogHeader>
                                                        <DialogTitle>{doc.fileName}</DialogTitle>
                                                        <DialogDescription>
                                                            {type} (Version {doc.version || 1}) for {submissionState.customerName}.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="relative h-full w-full bg-black/10 rounded-md mt-4">
                                                        {doc.format.startsWith('image/') ? (
                                                            <Image 
                                                                src={doc.url} 
                                                                alt={`Document for ${submissionState.customerName}`}
                                                                fill
                                                                style={{ objectFit: 'contain' }}
                                                                sizes="90vw"
                                                                data-ai-hint="document paper"
                                                            />
                                                        ) : (
                                                            <iframe src={doc.url} className="w-full h-full rounded-md border" title={doc.fileName} />
                                                        )}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="lg:col-span-1 flex flex-col gap-6 sticky top-24">
                   <WorkflowStatus 
                        submission={submissionState}
                        onApprove={handleApprove}
                        onEscalate={handleEscalate}
                        onStatusChange={handleStatusChange}
                        userRole={userRole}
                   />
                </div>
            </div>
        </div>
    );
}
