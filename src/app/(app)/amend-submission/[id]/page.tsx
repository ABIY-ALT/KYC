
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter, useParams, notFound } from 'next/navigation';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubmissions } from '@/context/submissions-context';
import { type Submission, type SubmittedDocument } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Eye, AlertTriangle, CheckCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { InlineUploader, fileSchema as amendFileSchema, renderFilePreviewIcon } from "@/components/amendment-uploader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const RESPONSE_TYPES = [
    'Fully Amended',
    'Partially Amended',
    'Unable to Amend'
];

const amendmentSchema = z.object({
  responseType: z.enum(['Fully Amended', 'Partially Amended', 'Unable to Amend']),
  comment: z.string().min(1, "A response message is required."),
  files: z.array(amendFileSchema).nonempty("At least one corrected document must be uploaded."),
});

type FormValues = z.infer<typeof amendmentSchema>;


export default function AmendSubmissionPage() {
    const params = useParams<{ id: string }>();
    const { submissions, submitAmendment } = useSubmissions();
    const router = useRouter();
    const { toast } = useToast();
    
    const [submission, setSubmission] = useState<Submission | undefined>();
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<FormValues>({
        resolver: zodResolver(amendmentSchema),
        defaultValues: { responseType: undefined, comment: "", files: [] },
    });
    
    // This effect ensures that any generated Object URLs are revoked when the component unmounts, preventing memory leaks.
    useEffect(() => {
        // This function will be called when the component unmounts
        return () => {
            const filesInForm = form.getValues('files');
            filesInForm.forEach(fileWrapper => {
                if (fileWrapper.file.dataUrl) {
                    URL.revokeObjectURL(fileWrapper.file.dataUrl);
                }
            });
        };
    }, [form]);


    useEffect(() => {
        if (params.id) {
            const sub = submissions.find(s => s.id === params.id);
            // This page is only for submissions that require amendment.
            if (sub && sub.status === 'Action Required') {
                setSubmission(sub);
            } else if (sub) {
                // If the submission exists but is not in the correct status, redirect.
                router.replace('/submissions');
            }
        }
        setIsLoading(false);
    }, [params.id, submissions, router]);


    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "files",
        keyName: "formId",
    });

    const handleFileUploaded = (originalDocId: string, uploadedFile: File) => {
        // Use URL.createObjectURL for efficiency. It creates a temporary, short URL
        // representing the file in the browser's memory, avoiding large Data URLs.
        const objectUrl = URL.createObjectURL(uploadedFile);

        const originalDoc = submission?.documents.find(d => d.id === originalDocId);

        const fileData = {
            originalDocId: originalDocId,
            file: {
                name: uploadedFile.name,
                type: uploadedFile.type,
                size: uploadedFile.size,
                dataUrl: objectUrl,
            },
            docType: originalDoc?.documentType || ''
        };
        
        const existingIndex = fields.findIndex(f => f.originalDocId === originalDocId);

        if (existingIndex > -1) {
            // Before replacing, revoke the old URL to prevent memory leaks
            const oldUrl = fields[existingIndex].file.dataUrl;
            URL.revokeObjectURL(oldUrl);
            update(existingIndex, fileData);
        } else {
            append(fileData);
        }
        form.trigger("files");
    };
    
    const handleAmendmentSubmit = (data: FormValues) => {
        if (!submission) return;
        const newDocuments: SubmittedDocument[] = data.files.map((f, index) => {
             const originalDoc = submission.documents.find(d => d.id === f.originalDocId);
             return {
                id: `doc-${Date.now()}-${index}`,
                fileName: f.file.name,
                documentType: f.docType,
                url: f.file.dataUrl, // Pass the Object URL
                size: f.file.size,
                format: f.file.type,
                uploadedAt: new Date().toISOString(),
                version: (originalDoc?.version || 1) + 1
             }
        });

        submitAmendment(submission.id, newDocuments, data.comment, data.responseType);

        toast({
            title: "Amendment Submitted",
            description: `Corrected documents for ${submission.customerName} have been sent for re-review.`,
        });

        setIsPreviewOpen(false);
        router.push('/submissions');
    };
    
    if (isLoading) {
        return <Skeleton className="h-screen w-full" />;
    }

    if (!submission) {
        notFound();
    }

    const requestDate = submission.amendmentHistory?.[0]?.requestedAt ? format(new Date(submission.amendmentHistory[0].requestedAt), 'dd/MM/yyyy') : 'a recent date';
    const placeholderTemplate = `All requested amendments have been completed. The corrected document(s) have been re-uploaded as per your comment dated ${requestDate}. Please proceed with review.`;


    return (
        <div className="max-w-5xl mx-auto">
            <Button variant="outline" onClick={() => router.back()} className="mb-6"><ArrowLeft /> Back</Button>
            
            <div className="space-y-8">
                 <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-lg mb-2">Action Required: Amendment for {submission.customerName}</AlertTitle>
                    <AlertDescription className="space-y-4">
                        <p>A KYC officer has requested changes for this submission. Please review the comments below and re-upload the corrected documents.</p>
                        {(submission.pendingAmendments && submission.pendingAmendments.length > 0) ? (
                            submission.pendingAmendments.map(request => (
                                <Card key={request.id} className="bg-background/50 border-destructive/20">
                                    <CardHeader className="p-4">
                                        <Label className="font-semibold text-muted-foreground">
                                            Request: {request.type === 'REPLACE_EXISTING' ? 'Replace' : 'Add'} "{request.targetDocumentType}"
                                        </Label>
                                        <p className="text-foreground bg-muted p-3 rounded-md mt-2">{request.comment}</p>
                                        <p className="text-xs pt-2 text-right">Requested On: {format(new Date(request.requestedAt), "PPP 'at' p")}</p>
                                    </CardHeader>
                                </Card>
                            ))
                        ) : null }
                    </AlertDescription>
                </Alert>

                <Card>
                     <CardHeader>
                        <CardTitle>Step 1: Upload Corrected Documents</CardTitle>
                        <CardDescription>
                            Upload new versions for the documents that need correction. Previous versions are kept in the submission history.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TooltipProvider>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">Status</TableHead>
                                        <TableHead>Document Name</TableHead>
                                        <TableHead className="text-center">Existing File</TableHead>
                                        <TableHead className="w-[300px]">Action: Upload New Version</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {submission.documents.map(doc => {
                                        const isAmended = fields.some(f => f.originalDocId === doc.id);
                                        const amendedFile = fields.find(f => f.originalDocId === doc.id)?.file;

                                        return (
                                            <TableRow key={doc.id} data-amended={isAmended} className="data-[amended=true]:bg-green-50 dark:data-[amended=true]:bg-green-950/50 transition-colors">
                                                <TableCell className="text-center">
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            {isAmended ? <CheckCircle className="h-5 w-5 text-green-500" /> : <AlertTriangle className="h-5 w-5 text-amber-500" />}
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{isAmended ? "New version uploaded" : "Action required"}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell className="font-medium">{doc.documentType}</TableCell>
                                                <TableCell className="text-center">
                                                    <Button asChild variant="ghost" size="sm">
                                                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                            <Eye className="mr-2"/> View
                                                        </a>
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <InlineUploader 
                                                        originalDoc={doc} 
                                                        onFileUploaded={(file) => handleFileUploaded(doc.id, file)}
                                                        uploadedFile={amendedFile}
                                                        onFileRemoved={() => {
                                                            const fieldIndex = fields.findIndex(f => f.originalDocId === doc.id);
                                                            if (fieldIndex > -1) {
                                                                const urlToRevoke = fields[fieldIndex].file.dataUrl;
                                                                URL.revokeObjectURL(urlToRevoke);
                                                                remove(fieldIndex);
                                                            }
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </TooltipProvider>
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
                <div className="max-w-5xl mx-auto flex justify-end gap-2">
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
