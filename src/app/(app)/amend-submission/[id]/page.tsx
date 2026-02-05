"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams, notFound } from 'next/navigation';
import { useForm, useFieldArray, useWatch } from "react-hook-form";
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

// This schema now validates the presence of a File object.
const amendedFileSchema = z.object({
    amendmentRequestId: z.string(),
    documentType: z.string(),
    originalDocumentId: z.string().optional(),
    file: z.instanceof(File, { message: "File is required." }),
    previewUrl: z.string(), // We'll keep the blob URL for previews
});

const amendmentResponseSchema = z.object({
  responseComment: z.string().min(10, "A response comment of at least 10 characters is required."),
  amendedFiles: z.array(amendedFileSchema),
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(amendmentResponseSchema),
        defaultValues: { responseComment: "", amendedFiles: [] },
    });

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "amendedFiles",
        keyName: 'formId',
    });
    
    // Use the more performant `useWatch` hook.
    const amendedFiles = useWatch({ control: form.control, name: "amendedFiles" });

    useEffect(() => {
        if (params.id) {
            const sub = submissions.find(s => s.id === params.id);
            setSubmission(sub);
        }
        setIsLoading(false);
    }, [params.id, submissions]);

    // CRITICAL: This effect cleans up the blob URLs when the component unmounts to prevent memory leaks.
    useEffect(() => {
        return () => {
            const currentFiles = form.getValues('amendedFiles');
            currentFiles.forEach(f => {
                if (f.previewUrl) {
                    URL.revokeObjectURL(f.previewUrl);
                }
            });
        }
    }, [form]);

    const handleFileUploaded = useCallback((request: AmendmentRequest, uploadedFile: File) => {
        if (uploadedFile.size > 5 * 1024 * 1024) { // 5MB limit
            toast({
                variant: "destructive",
                title: "File too large",
                description: "Please upload files smaller than 5MB.",
            });
            return;
        }
        
        // This is the lightweight object we store in state. It contains the File object, not its content.
        const fileData = {
            amendmentRequestId: request.id,
            documentType: request.targetDocumentType,
            originalDocumentId: request.targetDocumentId,
            file: uploadedFile,
            previewUrl: URL.createObjectURL(uploadedFile),
        };

        const currentFiles = form.getValues("amendedFiles");
        const existingIndex = currentFiles.findIndex(
            f => f.amendmentRequestId === request.id
        );

        if (existingIndex >= 0) {
            // Revoke the old URL before updating to prevent memory leaks.
            URL.revokeObjectURL(currentFiles[existingIndex].previewUrl); 
            update(existingIndex, fileData);
        } else {
            append(fileData);
        }
        form.trigger("amendedFiles");

    }, [append, form, toast, update]);

    const handleFileRemoved = useCallback((amendmentRequestId: string) => {
        const fieldIndex = fields.findIndex(f => f.amendmentRequestId === amendmentRequestId);
        if (fieldIndex > -1) {
            const fileToRemove = fields[fieldIndex];
            URL.revokeObjectURL(fileToRemove.previewUrl); // Clean up the blob URL.
            remove(fieldIndex);
        }
    }, [fields, remove]);
    
    const handleAmendmentSubmit = async (data: FormValues) => {
      if (!submission || isSubmitting) return;
    
      setIsSubmitting(true);
    
      try {
        // `data.amendedFiles` contains the lightweight File objects.
        // The context function is responsible for handling them without overloading memory.
        await submitAmendment(submission.id, data.amendedFiles, data.responseComment, 'Fully Amended');
    
        toast({
          title: "Amendment Response Sent",
          description: "Your response has been sent for re-review. Redirecting...",
        });

        // CRITICAL: Delay navigation to allow React to flush state updates and prevent UI freeze.
        setTimeout(() => {
            router.push('/submissions');
        }, 1500);
    
      } catch (err) {
        console.error(err);
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: "Something went wrong, please try again.",
        });
        setIsSubmitting(false);
      }
    };
    
    if (isLoading) {
        return <Skeleton className="h-screen w-full" />;
    }

    if (!submission || !submission.pendingAmendments || submission.pendingAmendments.length === 0 || submission.status !== 'Action Required') {
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
                        {submission.pendingAmendments.map(request => {
                            const fileDataForThisRequest = amendedFiles.find(f => f.amendmentRequestId === request.id);
                            return (
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
                                        uploadedFile={fileDataForThisRequest?.file}
                                        previewUrl={fileDataForThisRequest?.previewUrl}
                                        onFileUploaded={(file) => handleFileUploaded(request, file)}
                                        onFileRemoved={() => handleFileRemoved(request.id)}
                                    />
                                </div>
                            )
                        })}
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
