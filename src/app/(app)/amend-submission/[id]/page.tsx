
"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams, notFound } from 'next/navigation';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubmissions } from '@/context/submissions-context';
import { type Submission, type SubmittedDocument, type AmendmentRequest } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineUploader } from "@/components/amendment-uploader";

// Schema for a single file object being managed by the form
const amendedFileObjectSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number(),
  url: z.string(), // This will be a Data URL for local preview
});

const amendedFileSchema = z.object({
    amendmentRequestId: z.string(),
    documentType: z.string(),
    originalDocumentId: z.string().optional(),
    file: amendedFileObjectSchema,
});

// Main schema for the amendment submission form
const amendmentResponseSchema = z.object({
  responseComment: z.string().min(10, "A response comment of at least 10 characters is required."),
  amendedFiles: z.array(amendedFileSchema),
  submitting: z.boolean().optional(),
}).refine(
  (data) => data.amendedFiles.length > 0,
  {
    message: "You must upload at least one document to respond to an amendment request.",
    path: ["amendedFiles"],
  }
);

type FormValues = z.infer<typeof amendmentResponseSchema>;

export default function AmendSubmissionPage() {
    const params = useParams<{ id: string }>();
    const { submissions, submitAmendment } = useSubmissions();
    const router = useRouter();
    const { toast } = useToast();
    
    const [submission, setSubmission] = useState<Submission | undefined>();
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<FormValues>({
        resolver: zodResolver(amendmentResponseSchema),
        defaultValues: { responseComment: "", amendedFiles: [], submitting: false },
    });

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "amendedFiles",
        keyName: 'formId',
    });
    
    const isSubmitting = form.watch("submitting");

    useEffect(() => {
        if (params.id) {
            const sub = submissions.find(s => s.id === params.id);
            if (sub && sub.status === 'Action Required') {
                setSubmission(sub);
            } else if (sub) {
                // If submission exists but doesn't require action, redirect
                router.replace('/submissions');
            }
        }
        setIsLoading(false);
    }, [params.id, submissions, router]);

    const handleFileUploaded = (request: AmendmentRequest, uploadedFile: File) => {
        if (uploadedFile.size > 5 * 1024 * 1024) { // 5MB limit
            toast({
                variant: "destructive",
                title: "File too large",
                description: "Please upload files smaller than 5MB.",
            });
            return;
        }
        
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const fileData = {
                amendmentRequestId: request.id,
                documentType: request.targetDocumentType,
                originalDocumentId: request.targetDocumentId,
                file: {
                    name: uploadedFile.name,
                    type: uploadedFile.type,
                    size: uploadedFile.size,
                    url: dataUrl,
                },
            };

            const currentFiles = form.getValues("amendedFiles");
            const existingIndex = currentFiles.findIndex(
                f => f.amendmentRequestId === request.id
            );

            if (existingIndex >= 0) {
                update(existingIndex, fileData);
            } else {
                append(fileData);
            }
            form.trigger("amendedFiles");
        };
        reader.readAsDataURL(uploadedFile);
    };

    const handleFileRemoved = (amendmentRequestId: string) => {
        const fieldIndex = fields.findIndex(f => f.amendmentRequestId === amendmentRequestId);
        if (fieldIndex > -1) {
            remove(fieldIndex);
        }
    };
    
    const handleAmendmentSubmit = async (data: FormValues) => {
        if (!submission || !submission.pendingAmendments) return;
        
        try {
            form.setValue("submitting", true);

            const newDocuments: SubmittedDocument[] = data.amendedFiles.map((f, index) => {
                const amendment = submission.pendingAmendments?.find(
                    a => a.id === f.amendmentRequestId
                );

                const originalDoc =
                    amendment?.type === "REPLACE_EXISTING"
                    ? submission.documents.find(d => d.id === f.originalDocumentId)
                    : undefined;
                
                // CRITICAL: Use a placeholder URL, not the large Data URL from the form state.
                const stableUrl = `https://picsum.photos/seed/newdoc${Date.now()}${index}/800/1100`;

                return {
                    id: `doc-${Date.now()}-${index}`,
                    fileName: f.file.name,
                    documentType: f.documentType,
                    url: stableUrl,
                    size: f.file.size,
                    format: f.file.type,
                    uploadedAt: new Date().toISOString(),
                    version: originalDoc ? (originalDoc.version || 1) + 1 : 1,
                };
            });

            await submitAmendment(submission.id, newDocuments, data.responseComment, 'Fully Amended');

            toast({
                title: "Amendment Response Sent",
                description: "Your response has been sent to the KYC officer for review.",
            });

            setTimeout(() => router.push('/submissions'), 100);

        } catch (err) {
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "Something went wrong, please try again.",
            });
        } finally {
            form.setValue("submitting", false);
        }
    };
    
    if (isLoading) {
        return <Skeleton className="h-screen w-full" />;
    }

    if (!submission || !submission.pendingAmendments || submission.pendingAmendments.length === 0) {
        notFound();
    }
    
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Button variant="outline" onClick={() => router.back()} className="mb-2"><ArrowLeft /> Back</Button>
            
            <Card>
                <CardHeader>
                    <CardTitle className="gradient-text">Respond to Amendment Request</CardTitle>
                    <CardDescription>For submission ID {submission.id} ({submission.customerName})</CardDescription>
                </CardHeader>
            </Card>

            <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAmendmentSubmit)} className="space-y-6">
                <Card>
                     <CardHeader>
                        <CardTitle>Step 1: Review Requests & Upload Documents</CardTitle>
                        <CardDescription>
                            Review the officer's comments and upload the required documents.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {submission.pendingAmendments.map(request => (
                            <div key={request.id}>
                                <Alert variant="destructive" className="mb-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Officer Comment</AlertTitle>
                                    <AlertDescription>
                                        {request.comment}
                                    </AlertDescription>
                                </Alert>
                                <InlineUploader 
                                    mode={request.type === 'REPLACE_EXISTING' ? 'REPLACE' : 'ADD'}
                                    documentType={request.targetDocumentType}
                                    uploadedFile={form.watch('amendedFiles').find(f => f.amendmentRequestId === request.id)?.file}
                                    onFileUploaded={(file) => handleFileUploaded(request, file)}
                                    onFileRemoved={() => handleFileRemoved(request.id)}
                                />
                            </div>
                        ))}
                         <FormField
                            control={form.control}
                            name="amendedFiles"
                            render={({ fieldState }) => (
                                <FormMessage>{fieldState.error?.message}</FormMessage>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Step 2: Provide Response Comment</CardTitle>
                        <CardDescription>
                            Add a comment for the KYC officer explaining the changes you made.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <FormField control={form.control} name="responseComment" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Your Comment</FormLabel>
                                <FormControl><Textarea placeholder="e.g., All requested documents have been uploaded." {...field} rows={4} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                </Card>
                
                <CardFooter className="justify-end sticky bottom-0 bg-background/95 py-4 border-t z-10">
                     <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? "Submitting..." : "Submit Amendment Response"}
                    </Button>
                </CardFooter>
            </form>
            </Form>
        </div>
    );
}
