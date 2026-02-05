"use client";

import { useState, useCallback } from "react";
import { useRouter, notFound } from 'next/navigation';
import Image from "next/image";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import { useSubmissions } from '@/context/submissions-context';
import { type Submission, type SubmittedDocument, type User as UserData } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WorkflowStatus } from '@/components/workflow-status';
import { ArrowLeft, FileText, Eye, UploadCloud, XCircle, AlertCircle, MessageSquareReply, CheckCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const DOCUMENT_TYPES = [
  'National ID',
  'Passport',
  'Business License',
  'Memorandum of Association',
  'Application Form',
  'Supporting Document',
];

const RESPONSE_TYPES = [
    'Correction Provided',
    'Additional Information',
    'Query to Officer',
];

const fileSchema = z.object({
  file: z.instanceof(File),
  docType: z.string().min(1, "Please select a document type."),
  id: z.string()
});

const amendmentSchema = z.object({
  responseType: z.string().min(1, "Please select a response type."),
  comment: z.string().min(1, "A response message is required."),
  files: z.array(fileSchema).nonempty("At least one corrected document is required."),
});

type FormValues = z.infer<typeof amendmentSchema>;

const renderFilePreviewIcon = (file: File | SubmittedDocument) => {
    const isFileInstance = file instanceof File;
    const fileType = isFileInstance ? file.type : file.format;
    const fileUrl = isFileInstance ? URL.createObjectURL(file) : file.url;

    if (fileType.startsWith("image/")) {
      return <Image src={fileUrl} alt={file.name || file.fileName} width={40} height={40} className="rounded-sm object-cover" />
    }
    return <FileText className="h-10 w-10 text-muted-foreground" />
}

export default function SubmissionReviewPage({ params }: { params: { id: string } }) {
    const { submissions, updateSubmissionStatus, submitAmendment } = useSubmissions();
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [firestore, authUser]);
    const { data: userData } = useDoc<UserData>(userDocRef);

    const router = useRouter();
    const { toast } = useToast();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    
    const submission = submissions.find(s => s.id === params.id);

    const form = useForm<FormValues>({
        resolver: zodResolver(amendmentSchema),
        defaultValues: { responseType: "", comment: "", files: [] },
    });
    const { fields, append, remove } = useFieldArray({ control: form.control, name: "files" });
    const onDrop = useCallback((acceptedFiles: File[]) => {
        acceptedFiles.forEach(file => {
        if (!fields.some(field => field.file.name === file.name && field.file.size === file.size)) {
            append({ file, docType: "", id: Math.random().toString(36).substring(7) });
        }
        });
    }, [append, fields]);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
    
    if (!submission) {
        notFound();
    }
    
    const handleStatusChange = (newStatus: Submission['status'], reason?: string) => {
        updateSubmissionStatus(submission.id, newStatus, reason);
        toast({
            title: `Status Updated: ${newStatus}`,
            description: `Submission for ${submission.customerName} is now ${newStatus}.`,
            variant: newStatus.includes('Approved') ? 'default' : newStatus.includes('Reject') || newStatus.includes('Escalate') ? 'destructive' : 'default'
        });
        if (newStatus === 'Approved' || newStatus === 'Rejected') {
            setTimeout(() => router.push('/review-queue'), 1500);
        }
    };

    const handleAmendmentSubmit = (data: FormValues) => {
        const newDocuments: SubmittedDocument[] = data.files.map((f, index) => ({
            id: `doc-${Date.now()}-${index}`,
            fileName: f.file.name,
            documentType: f.docType,
            url: URL.createObjectURL(f.file),
            size: f.file.size,
            format: f.file.type,
            uploadedAt: new Date().toISOString(),
            version: (submission.amendmentHistory?.length || 0) + 2
        }));

        submitAmendment(submission.id, newDocuments, data.comment, data.responseType);
        
        toast({
            title: "Amendment Submitted",
            description: `Corrected documents for ${submission.customerName} have been sent for re-review.`,
        });

        router.push('/submissions');
        setIsConfirmOpen(false);
    };

    const handleApprove = () => handleStatusChange('Approved');
    const handleEscalate = () => handleStatusChange('Escalated');

    // Determine user role - default to officer if not loaded
    const userRole = userData?.role || 'Officer';
    const isReviewerUser = userRole === 'Supervisor' || userRole === 'Admin' || userRole === 'Officer';
    const isBranchUser = userRole === 'Branch Manager' || userRole === 'Officer';

    // Combine original and amended documents for review
    const allDocuments = [
        ...submission.documents,
        ...(submission.amendmentHistory || []).flatMap(h => h.documents)
    ];

    const latestResponse = submission.amendmentHistory?.slice(-1)[0];

    // Branch user responding to an amendment request
    if (isBranchUser && submission.status === 'Amendment') {
        const requestDate = submission.amendmentRequestedAt ? format(new Date(submission.amendmentRequestedAt), 'dd/MM/yyyy') : 'a recent date';
        const placeholderTemplate = `All requested amendments have been completed. The corrected document(s) have been re-uploaded as per your comment dated ${requestDate}. Please proceed with review.`;

        return (
            <div>
                 <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                    <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Amendment Submission</AlertDialogTitle>
                        <AlertDialogDescription>
                          By submitting this amendment, you confirm that all requested corrections have been completed. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={form.handleSubmit(handleAmendmentSubmit)}>Confirm & Submit</AlertDialogAction>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <Button variant="outline" onClick={() => router.back()} className="mb-6"><ArrowLeft /> Back</Button>
                <div className="grid lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-destructive/10 border-destructive hover-lift">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><AlertCircle/> Step 1: Review Amendment Request</CardTitle>
                                <CardDescription>The KYC officer has requested changes for submission {submission.id} ({submission.customerName}).</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Label className="font-semibold">Reason from KYC Officer:</Label>
                                <p className="text-destructive-foreground bg-destructive/20 p-3 rounded-md mt-2">{submission.amendmentReason}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Step 2: Upload Corrected Documents & Respond</CardTitle>
                                <CardDescription>
                                    This is where you upload the new files. Upload the corrected or additional documents as requested by the officer. You must also select a response type and add a comment.
                                </CardDescription>
                            </CardHeader>
                            <Form {...form}>
                            <form className="space-y-6 p-6 pt-0" onSubmit={(e) => e.preventDefault()}>
                                <FormField control={form.control} name="responseType" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Response Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select a response type" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {RESPONSE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="comment" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Response Message</FormLabel>
                                        <FormControl><Textarea placeholder={placeholderTemplate} {...field} rows={4} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                 )} />

                                <div {...getRootProps()} className={cn("border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors", isDragActive && "border-primary bg-primary/10")}>
                                    <input {...getInputProps()} />
                                    <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <p className="mt-4 text-muted-foreground">{isDragActive ? 'Drop files here...' : 'Drag & drop corrected files here, or click'}</p>
                                </div>

                                {fields.length > 0 && (
                                    <ScrollArea className="h-60 w-full rounded-md border p-4 space-y-4">
                                    {fields.map((field, index) => (
                                    <div key={field.id} className="flex items-center gap-4">
                                        <div className="flex-shrink-0">{renderFilePreviewIcon(field.file)}</div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium truncate">{field.file.name}</p>
                                            <p className="text-xs text-muted-foreground">{(field.file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                        <FormField control={form.control} name={`files.${index}.docType`} render={({ field: selectField }) => (
                                            <FormItem className="w-56"><Select onValueChange={selectField.onChange} defaultValue={selectField.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent>{DOCUMENT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></FormItem>
                                        )} />
                                        <Button variant="ghost" size="icon" onClick={() => remove(index)}><XCircle className="h-5 w-5 text-destructive" /></Button>
                                    </div>
                                    ))}
                                    </ScrollArea>
                                )}
                            </form>
                            </Form>
                             <CardFooter>
                                <Button onClick={() => setIsConfirmOpen(true)}>Submit Amendment for Review</Button>
                            </CardFooter>
                        </Card>
                        
                        <Card>
                            <CardHeader><CardTitle>Original Documents (Read-Only)</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {submission.documents.map(doc => (
                                     <div key={doc.id} className="flex items-center gap-4 p-2 rounded-md bg-muted/50">
                                         <div className="flex-shrink-0">{renderFilePreviewIcon(doc)}</div>
                                         <div className="flex-1">
                                            <p className="font-semibold">{doc.documentType}</p>
                                            <p className="text-sm text-muted-foreground truncate">{doc.fileName}</p>
                                         </div>
                                         <a href={doc.url} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm"><Eye className="mr-2"/> View</Button></a>
                                     </div>
                                ))}
                            </CardContent>
                        </Card>

                    </div>
                    <div className="lg:col-span-1 flex flex-col gap-6 sticky top-24">
                        <WorkflowStatus submission={submission} userRole={userRole} onApprove={()=>{}} onEscalate={()=>{}} onStatusChange={()=>{}}/>
                    </div>
                </div>
            </div>
        );
    }

    // Default view for Officer/Supervisor to review a submission
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

                    {submission.status === 'Amended - Pending Review' && latestResponse && (
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

                    {allDocuments.map((doc, index) => (
                        <Card key={doc.id} className="hover-lift">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="flex items-center gap-2 text-xl">{doc.documentType}</CardTitle>
                                    {doc.version && doc.version > 1 && <Badge variant="outline">Version {doc.version}</Badge>}
                                </div>
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
                        userRole={userRole}
                   />
                </div>
            </div>
        </div>
    );
}
