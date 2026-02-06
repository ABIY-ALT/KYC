"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { useSubmissions } from "@/context/submissions-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Submission, AmendmentRequest } from "@/lib/data";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, UploadCloud, File as FileIcon, XCircle, Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

// This is the lightweight file object that will be passed to the context.
type LocalAmendedFile = {
    file: File;
    documentType: string;
    originalDocumentId?: string;
    amendmentRequestId: string;
};

// Form schema now only validates the comment. File validation is manual.
const responseSchema = z.object({
  responseComment: z.string().min(10, "A response comment of at least 10 characters is required."),
});

type FormValues = z.infer<typeof responseSchema>;

interface AmendmentResponseModalProps {
  submission: Submission | null;
  request: AmendmentRequest | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AmendmentRequestInfoModal({ submission, request, isOpen, onOpenChange }: AmendmentResponseModalProps) {
  const { submitAmendment } = useSubmissions();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File is held in local state, NOT form state.
  const [localFile, setLocalFile] = useState<{ file: File; previewUrl: string } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(responseSchema),
    defaultValues: { responseComment: "" },
  });
  
  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      const file = accepted[0];
      if (localFile?.previewUrl) {
          URL.revokeObjectURL(localFile.previewUrl); // Clean up old preview
      }
      const previewUrl = URL.createObjectURL(file);
      setLocalFile({ file, previewUrl });
    }
  }, [localFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png'], 'application/pdf': ['.pdf'] }
  });

  const removeFile = useCallback(() => {
    if (localFile) {
      URL.revokeObjectURL(localFile.previewUrl);
    }
    setLocalFile(null);
  }, [localFile]);

  const isUploadingFile = request?.type === 'ADD_NEW' || request?.type === 'REPLACE_EXISTING';

  const onSubmit = async (data: FormValues) => {
    if (!submission || !request || isSubmitting) return;

    if (isUploadingFile && !localFile) {
      toast({ variant: "destructive", title: "File Required", description: "A file must be uploaded for this type of request." });
      return;
    }

    setIsSubmitting(true);
    
    const amendedFiles: LocalAmendedFile[] = [];
    if (localFile) {
        amendedFiles.push({
            file: localFile.file,
            documentType: request.targetDocumentType,
            originalDocumentId: request.targetDocumentId,
            amendmentRequestId: request.id,
        });
    }

    try {
      await submitAmendment(submission.id, amendedFiles, data.responseComment, 'Response Provided');
      
      toast({
        title: "Amendment Response Sent",
        description: "Your response has been sent for re-review.",
      });
      onOpenChange(false); // This will trigger the cleanup
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Submission Failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFilePreview = (file: {previewUrl: string, file: File}) => {
    if (file.file.type.startsWith("image/")) {
      return <Image src={file.previewUrl} alt={file.file.name} width={40} height={40} className="rounded-sm object-cover" />
    }
    return <FileIcon className="h-10 w-10 text-muted-foreground" />
  }

  // Cleanup effect
  useEffect(() => {
    // This effect runs when the component unmounts or when the dialog is hidden
    return () => {
        removeFile();
    }
  }, [removeFile]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        // Explicitly clean up and reset when dialog is closed.
        removeFile();
        form.reset();
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Amendment Request Details</DialogTitle>
          <DialogDescription>
            Respond to the KYC Officer's request for submission ID: {submission?.id}.
          </DialogDescription>
        </DialogHeader>

        {request && (
          <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Officer's Comment</AlertTitle>
              <AlertDescription>
                  "{request.comment}"
              </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {isUploadingFile && (
                <FormItem>
                    <FormLabel>
                        {request?.type === 'REPLACE_EXISTING' ? `Upload New Version of ${request.targetDocumentType}` : `Upload New ${request.targetDocumentType}`}
                    </FormLabel>
                    {localFile ? (
                        <div className="flex items-center gap-4 p-2 rounded-md border bg-muted/50">
                            <div className="flex-shrink-0">{renderFilePreview(localFile)}</div>
                            <div className="flex-1">
                            <p className="text-sm font-medium truncate">{localFile.file.name}</p>
                            <p className="text-xs text-muted-foreground">{(localFile.file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={removeFile}>
                                <XCircle className="h-5 w-5 text-destructive" />
                            </Button>
                        </div>
                    ) : (
                        <div {...getRootProps()} className={cn("border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors", isDragActive && "border-primary bg-primary/10")}>
                            <input {...getInputProps()} />
                            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">
                                {isDragActive ? 'Drop file here...' : 'Drag & drop or click to upload'}
                            </p>
                        </div>
                    )}
                </FormItem>
              )}

              <FormField
                control={form.control}
                name="responseComment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Response Comment</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Explain the changes you made..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Amendment Response
                  </Button>
              </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
