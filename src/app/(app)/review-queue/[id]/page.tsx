
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, notFound, useParams } from 'next/navigation';
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
import { Textarea } from "@/components/ui/textarea";
import { WorkflowStatus } from '@/components/workflow-status';
import { ArrowLeft, FileText, Eye, UploadCloud, XCircle, AlertTriangle, MessageSquareReply, CheckCircle, FileUp, FileClock, CheckCircle2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";


const RESPONSE_TYPES = [
    'Fully Amended',
    'Partially Amended',
    'Unable to Amend'
];

const fileSchema = z.object({
  originalDocId: z.string(),
  file: z.instanceof(File),
  docType: z.string().min(1, "Please select a document type."),
});

const amendmentSchema = z.object({
  responseType: z.enum(['Fully Amended', 'Partially Amended', 'Unable to Amend']),
  comment: z.string().min(1, "A response message is required."),
  files: z.array(fileSchema).nonempty("At least one corrected document must be uploaded."),
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

function InlineUploader({ originalDoc, onFileUploaded }: { originalDoc: SubmittedDocument, onFileUploaded: (file: File) => void }) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onFileUploaded(acceptedFiles[0]);
        }
    }, [onFileUploaded]);

    const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        noClick: true,
        noKeyboard: true,
        accept: { 'image/*': ['.jpeg', '.png'], 'application/pdf': ['.pdf'] }
    });

    return (
        <div {...getRootProps()} className={cn(
            "p-2 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors flex items-center justify-center",
            isDragActive 
                ? "border-primary bg-primary/10" 
                : "border-transparent hover:border-input"
        )}>
            <input {...getInputProps()} />
            <Button type="button" variant="outline" size="sm" onClick={open}>
                <FileUp className="mr-2" />
                {isDragActive ? 'Drop to Replace' : 'Replace File'}
            </Button>
        </div>
    );
}

export default function SubmissionReviewPage() {
    const params = useParams<{ id: string }>();
    const { submissions, updateSubmissionStatus, submitAmendment } = useSubmissions();
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [firestore, authUser]);
    const { data: userData } = useDoc<UserData>(userDocRef);

    const router = useRouter();
    const { toast } = useToast();
    
    // Local state for amendment mode
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

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(amendmentSchema),
        defaultValues: { responseType: undefined, comment: "", files: [] },
    });

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "files",
        keyName: "formId",
    });

    const handleFileUploaded = (originalDocId: string, file: File) => {
        const existingIndex = fields.findIndex(f => f.originalDocId === originalDocId);
        const originalDoc = submissionState?.documents.find(d => d.id === originalDocId);
        
        const fileData = {
            originalDocId: originalDocId,
            file: file,
            docType: originalDoc?.documentType || ''
        };

        if (existingIndex > -1) {
            update(existingIndex, fileData);
        } else {
            append(fileData);
        }
        form.trigger("files"); // re-validate files array
    };
    
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

    const handleAmendmentSubmit = (data: FormValues) => {
        if (!submissionState) return;
        const newDocuments: SubmittedDocument[] = data.files.map((f, index) => {
             const originalDoc = submissionState.documents.find(d => d.id === f.originalDocId);
             return {
                id: `doc-${Date.now()}-${index}`,
                fileName: f.file.name,
                documentType: f.docType,
                url: URL.createObjectURL(f.file),
                size: f.file.size,
                format: f.file.type,
                uploadedAt: new Date().toISOString(),
                version: (originalDoc?.version || 1) + 1
             }
        });

        submitAmendment(submissionState.id, newDocuments, data.comment, data.responseType);
        
        // Update local state to reflect submission
        setSubmissionState(prev => prev ? { ...prev, status: 'Amended - Pending Review' } : undefined);

        toast({
            title: "Amendment Submitted",
            description: `Corrected documents for ${submissionState.customerName} have been sent for re-review.`,
        });

        setIsPreviewOpen(false);
    };

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
    const isBranchUser = userRole === 'Branch Manager' || userRole === 'Officer';
    
    const allDocuments = [
        ...submissionState.documents,
        ...(submissionState.amendmentHistory || []).flatMap(h => h.documents)
    ];

    const latestResponse = submissionState.amendmentHistory?.slice(-1)[0];

    // Branch user responding to an amendment request
    if (isBranchUser && (submissionState.status === 'Amendment' || submissionState.status === 'Amended - Pending Review')) {
        const requestDate = submissionState.amendmentRequestedAt ? format(new Date(submissionState.amendmentRequestedAt), 'dd/MM/yyyy') : 'a recent date';
        const placeholderTemplate = `All requested amendments have been completed. The corrected document(s) have been re-uploaded as per your comment dated ${requestDate}. Please proceed with review.`;

        // POST-SUBMISSION VIEW
        if (submissionState.status === 'Amended - Pending Review') {
             return (
                 <div>
                    <Button variant="outline" onClick={() => router.push('/submissions')} className="mb-6"><ArrowLeft /> Back to Submissions</Button>
                    <Alert variant="default" className="mb-6 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800 dark:text-green-400">Amendment Response Submitted</AlertTitle>
                        <AlertDescription className="text-green-700 dark:text-green-500">
                            Your response has been sent to the KYC Officer for review. No further actions are required from your side at this time.
                        </AlertDescription>
                    </Alert>
                    <Card><CardHeader><CardTitle>Submission Details (Read-Only)</CardTitle></CardHeader></Card>
                 </div>
             )
        }

        // AMENDMENT MODE VIEW
        return (
            <div>
                <Button variant="outline" onClick={() => router.back()} className="mb-6"><ArrowLeft /> Back</Button>
                
                <div className="space-y-8">
                     <Alert variant="destructive" className="mb-6">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="text-lg mb-2">Action Required: Amendment Requested</AlertTitle>
                        <AlertDescription className="space-y-2">
                            <p>A KYC officer has requested changes for this submission. Please review their comments and re-upload the corrected documents.</p>
                            <div className="p-4 bg-background/50 rounded-md border border-destructive/20">
                                <p className="font-semibold text-destructive-foreground">KYC Officer's Comment:</p>
                                <p className="text-destructive-foreground/90 mt-1">"{submissionState.amendmentReason || 'No reason provided.'}"</p>
                            </div>
                             <p className="text-xs pt-2">Requested On: {format(new Date(submissionState.amendmentRequestedAt!), "PPP 'at' p")}</p>
                        </AlertDescription>
                    </Alert>

                    <Card>
                         <CardHeader>
                            <CardTitle>Step 1: Upload Corrected Documents</CardTitle>
                            <CardDescription>
                                Replace the documents that need correction. The status icon will turn green once a new file is uploaded for a row.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">Status</TableHead>
                                        <TableHead>Document Name</TableHead>
                                        <TableHead className="text-center">Existing File</TableHead>
                                        <TableHead className="w-[300px]">Action: Replace File</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {submissionState.documents.map(doc => {
                                        const isAmended = fields.some(f => f.originalDocId === doc.id);
                                        const amendedFile = fields.find(f => f.originalDocId === doc.id)?.file;

                                        return (
                                            <TableRow key={doc.id} data-amended={isAmended} className="data-[amended=true]:bg-green-50 dark:data-[amended=true]:bg-green-950/50 transition-colors">
                                                <TableCell className="text-center">
                                                    {isAmended ? <CheckCircle className="h-5 w-5 text-green-500" /> : <AlertTriangle className="h-5 w-5 text-amber-500" />}
                                                </TableCell>
                                                <TableCell className="font-medium">{doc.documentType}</TableCell>
                                                <TableCell className="text-center">
                                                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="ghost" size="sm"><Eye className="mr-2"/> View</Button>
                                                    </a>
                                                </TableCell>
                                                <TableCell>
                                                    {amendedFile ? (
                                                        <div className="flex items-center gap-2 p-1 rounded-md border bg-muted/50">
                                                            <FileText className="h-5 w-5 flex-shrink-0" />
                                                            <p className="text-sm truncate flex-1">{amendedFile.name}</p>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(fields.findIndex(f => f.originalDocId === doc.id))}>
                                                                <XCircle className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <InlineUploader originalDoc={doc} onFileUploaded={(file) => handleFileUploaded(doc.id, file)} />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Step 2: Provide Response</CardTitle>
                        </CardHeader>
                        <Form {...form}>
                        <form className="space-y-6 p-6 pt-0">
                             <FormField control={form.control} name="responseType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Response Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a response type" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {RESPONSE_TYPES.map(type => <SelectItem key={type} value={type as any}>{type}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="comment" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Message to KYC Officer</FormLabel>
                                    <FormControl><Textarea placeholder={placeholderTemplate} {...field} rows={4} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </form>
                        </Form>
                    </Card>
                </div>

                {/* Sticky Action Bar */}
                 <div className="sticky bottom-0 bg-background/95 py-4 border-t mt-8 z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>Preview All Amendments</Button>
                        <Button onClick={form.handleSubmit(handleAmendmentSubmit)} disabled={!form.formState.isValid}>Submit Amendment Response</Button>
                    </div>
                 </div>

                 <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Preview Amendment Response</DialogTitle>
                            <DialogDescription>Review your changes before sending them to the KYC Officer. This action cannot be undone.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                             <Card><CardHeader className="p-4"><CardTitle className="text-lg">Branch Response</CardTitle></CardHeader>
                                <CardContent className="space-y-2 p-4 pt-0">
                                    <p><span className="font-semibold">Response Type:</span> {form.getValues('responseType')}</p>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{form.getValues('comment')}</p>
                                </CardContent>
                             </Card>
                             <Card><CardHeader className="p-4"><CardTitle className="text-lg">Amended Documents</CardTitle></CardHeader>
                                <CardContent className="p-4 pt-0 space-y-2">
                                     {fields.map(f => (
                                         <div key={f.id} className="flex items-center gap-2 p-2 rounded-md bg-muted">
                                            {renderFilePreviewIcon(f.file)}
                                            <div className="flex-1"><p className="font-medium">{f.docType}</p><p className="text-sm text-muted-foreground">{f.file.name}</p></div>
                                         </div>
                                     ))}
                                 </CardContent>
                             </Card>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Cancel</Button>
                            <Button onClick={form.handleSubmit(handleAmendmentSubmit)}>Confirm & Submit</Button>
                        </DialogFooter>
                    </DialogContent>
                 </Dialog>
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
                            <CardTitle className="gradient-text">Reviewing Submission for {submissionState.customerName}</CardTitle>
                            <CardDescription>ID: {submissionState.id} | Branch: {submissionState.branch}</CardDescription>
                        </CardHeader>
                    </Card>

                    {submissionState.status === 'Amended - Pending Review' && latestResponse && (
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
                                            alt={`Document for ${submissionState.customerName}`}
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
                                                          Viewing PDF document for {submissionState.customerName}.
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

    