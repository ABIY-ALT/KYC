"use client";

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
import { AlertTriangle, UploadCloud, File as FileIcon, XCircle } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const responseSchema = z.object({
  responseComment: z.string().min(1, "A response comment is required."),
  file: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof responseSchema>;

interface AmendmentResponseModalProps {
  submission: Submission | null;
  request: AmendmentRequest | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AmendmentRequestInfoModal({ submission, request, isOpen, onOpenChange }: AmendmentResponseModalProps) {
  const { resolveAmendmentRequest } = useSubmissions();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(responseSchema),
    defaultValues: { responseComment: "", file: undefined },
  });
  
  const { getRootProps, getInputProps, isDragActive, acceptedFiles, fileRejections } = useDropzone({
    multiple: false,
    onDrop: (accepted, rejected) => {
      if (rejected.length > 0) {
        toast({ variant: "destructive", title: "File upload failed", description: rejected[0].errors[0].message });
      } else if (accepted.length > 0) {
        form.setValue('file', accepted[0]);
        form.trigger('file');
      }
    },
    accept: { 'image/*': ['.jpeg', '.png'], 'application/pdf': ['.pdf'] }
  });

  const removeFile = () => {
      form.setValue('file', undefined);
      form.trigger('file');
  }

  const onSubmit = (data: FormValues) => {
    if (!submission || !request) return;

    // A file is required if the request is ADD_NEW or REPLACE_EXISTING
    if ((request.type === 'ADD_NEW' || request.type === 'REPLACE_EXISTING') && !data.file) {
      form.setError('file', { type: 'manual', message: 'A file must be uploaded for this type of request.' });
      return;
    }

    resolveAmendmentRequest(submission.id, request.id, data.responseComment, data.file);
    toast({
      title: "Amendment Response Sent",
      description: "Your response has been sent to the KYC officer for review.",
    });
    onOpenChange(false);
    form.reset();
  };

  const renderFilePreview = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <Image src={URL.createObjectURL(file)} alt={file.name} width={40} height={40} className="rounded-sm object-cover" />
    }
    return <FileIcon className="h-10 w-10 text-muted-foreground" />
  }
  
  const isUploadingFile = request?.type === 'ADD_NEW' || request?.type === 'REPLACE_EXISTING';


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                       <FormLabel>
                          {request?.type === 'REPLACE_EXISTING' ? `Upload New Version of ${request.targetDocumentType}` : `Upload New ${request.targetDocumentType}`}
                      </FormLabel>
                      {field.value ? (
                          <div className="flex items-center gap-4 p-2 rounded-md border bg-muted/50">
                             <div className="flex-shrink-0">{renderFilePreview(field.value)}</div>
                             <div className="flex-1">
                               <p className="text-sm font-medium truncate">{field.value.name}</p>
                               <p className="text-xs text-muted-foreground">{(field.value.size / 1024).toFixed(1)} KB</p>
                             </div>
                              <Button variant="ghost" size="icon" onClick={removeFile}>
                                <XCircle className="h-5 w-5 text-destructive" />
                              </Button>
                           </div>
                      ) : (
                        <FormControl>
                          <div {...getRootProps()} className={cn("border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors", isDragActive && "border-primary bg-primary/10")}>
                            <input {...getInputProps()} />
                            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">
                                {isDragActive ? 'Drop file here...' : 'Drag & drop or click to upload'}
                            </p>
                          </div>
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                  <Button type="submit">
                      Send Amendment Response
                  </Button>
              </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
