
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { useSubmissions } from "@/context/submissions-context";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { User as UserData, Submission } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadCloud, File as FileIcon, XCircle, ArrowLeft, Eye } from "lucide-react";

const DOCUMENT_TYPES = [
  'National ID',
  'Passport',
  'Business License',
  'Memorandum of Association',
  'Application Form',
  'Supporting Document',
];

// This schema is for the form state. It does NOT include the File object to avoid performance issues.
const fileSchema = z.object({
  id: z.string(),
  docType: z.string().min(1, "Please select a document type."),
  previewUrl: z.string(),
  name: z.string(),
  size: z.number(),
});

const submissionSchema = z.object({
  customerName: z.string().min(3, "Customer name is required."),
  files: z.array(fileSchema).nonempty("At least one document is required."),
});

type FormValues = z.infer<typeof submissionSchema>;


export default function NewSubmissionPage() {
  const { toast } = useToast();
  const { addSubmission } = useSubmissions();
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Use a ref to store the actual File objects, keeping them out of the React Hook Form state.
  const fileStore = useRef<Map<string, File>>(new Map());

  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [firestore, authUser]);
  const { data: userData } = useDoc<UserData>(userDocRef);
  const userBranch = userData?.branch || 'Default Branch';

  const form = useForm<FormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      customerName: "",
      files: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "files",
  });
  
  // Cleanup blob URLs and the file store on unmount to prevent memory leaks.
  useEffect(() => {
    return () => {
      const files = form.getValues('files');
      files.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
      fileStore.current.clear();
    };
  }, [form]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      // Check for duplicates before adding
      if (!fields.some(field => field.name === file.name && field.size === file.size)) {
        const id = `${file.name}-${file.size}-${file.lastModified}`;
        const previewUrl = URL.createObjectURL(file);
        
        // Store the heavy File object in the ref.
        fileStore.current.set(id, file);

        // Append only lightweight, serializable data to the form state.
        append({
            id: id,
            docType: "",
            previewUrl: previewUrl,
            name: file.name,
            size: file.size,
        });
      }
    });
  }, [append, fields]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*': ['.jpeg', '.png'], 'application/pdf': ['.pdf']} });
  
  const handleRemoveFile = (index: number) => {
    const fileToRemove = fields[index];
    if (fileToRemove?.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    // Remove the file from the ref store.
    if (fileToRemove?.id) {
        fileStore.current.delete(fileToRemove.id);
    }
    remove(index);
  }

  const handleNext = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setStep('preview');
    } else {
       toast({
         variant: "destructive",
         title: "Incomplete Form",
         description: "Please fill out the customer name and assign a type to all documents.",
       });
    }
  };
  
  const onSubmit = (data: FormValues) => {
    const newSubmission: Submission = {
      id: `SUB${Date.now().toString().slice(-4)}`,
      customerName: data.customerName,
      branch: userBranch,
      submittedAt: new Date().toISOString(),
      status: 'Pending',
      officer: 'N/A', // Will be assigned later
      documents: data.files.map(formFile => {
        // Retrieve the actual File from the ref store
        const actualFile = fileStore.current.get(formFile.id);
        if (!actualFile) {
            // This should not happen if the logic is correct
            console.error(`File with id ${formFile.id} not found in store.`);
            // Return a dummy object or throw an error to avoid a crash
             return {
                id: `doc-${formFile.id}`,
                fileName: formFile.name,
                documentType: formFile.docType,
                url: '',
                size: formFile.size,
                format: 'unknown',
                uploadedAt: new Date().toISOString(),
                version: 1,
            };
        }
        return {
            id: `doc-${formFile.id}`,
            fileName: actualFile.name,
            documentType: formFile.docType,
            // In a real app, this URL would come from a storage service after upload.
            // For now, we'll use a placeholder.
            url: `https://picsum.photos/seed/doc${formFile.id}/800/1100`,
            size: actualFile.size,
            format: actualFile.type,
            uploadedAt: new Date().toISOString(),
            version: 1,
        };
      }).filter(doc => doc.url), // Filter out any potential errors
    };

    addSubmission(newSubmission);
    
    toast({
      title: "Submission Successful",
      description: `Package for ${data.customerName} has been submitted for review.`,
    });
    
    // Clear the file store ref manually as form.reset() doesn't affect it.
    fileStore.current.clear();
    form.reset();
    setStep('upload');
    setIsDialogOpen(false);
  };
  
  const renderFilePreview = (fileId: string, previewUrl: string) => {
    const file = fileStore.current.get(fileId);
    if (file?.type.startsWith("image/")) {
      return <Image src={previewUrl} alt={file.name} width={40} height={40} className="rounded-sm object-cover" />
    }
    return <FileIcon className="h-10 w-10 text-muted-foreground" />
  }

  if (step === 'preview') {
    const formData = form.getValues();
    return (
      <Card className="w-full max-w-4xl mx-auto hover-lift">
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
                <AlertDialogDescription>
                  Once submitted, this KYC package cannot be edited or withdrawn. Please review all documents carefully before proceeding.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={form.handleSubmit(onSubmit)}>Confirm & Submit</AlertDialogAction>
              </AlertDialogFooter>
        </AlertDialog>

        <CardHeader>
          <Button variant="outline" size="sm" onClick={() => setStep('upload')} className="w-fit mb-4">
              <ArrowLeft /> Back to Edit
          </Button>
          <CardTitle className="gradient-text">Preview Submission</CardTitle>
          <CardDescription>Review all documents for {formData.customerName} before final submission.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {formData.files.map((f) => (
                <Card key={f.id} className="bg-muted/30">
                    <CardHeader className="flex flex-row items-start gap-4">
                       <div className="w-16 h-16 bg-background rounded-md flex items-center justify-center border">
                           {renderFilePreview(f.id, f.previewUrl)}
                       </div>
                       <div className="flex-1">
                           <CardTitle className="text-lg">{f.docType}</CardTitle>
                           <CardDescription>{f.name}</CardDescription>
                           <p className="text-xs text-muted-foreground mt-1">
                               {(f.size / (1024 * 1024)).toFixed(2)} MB | {new Date().toLocaleDateString()}
                           </p>
                       </div>
                       <a href={f.previewUrl} target="_blank" rel="noopener noreferrer">
                         <Button variant="outline" size="sm"><Eye className="mr-2"/> View</Button>
                       </a>
                    </CardHeader>
                </Card>
            ))}
          </div>
        </CardContent>
        <div className="p-6 flex justify-end">
            <Button onClick={() => setIsDialogOpen(true)}>Submit for Review</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto hover-lift">
      <CardHeader>
        <CardTitle className="gradient-text">New KYC Submission</CardTitle>
        <CardDescription>
          Upload and categorize all required documents for a new KYC submission package.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-8">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
                <Label>Documents</Label>
                <div {...getRootProps()} className={cn("border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors", isDragActive && "border-primary bg-primary/10")}>
                    <input {...getInputProps()} />
                    <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">
                        {isDragActive ? 'Drop the files here...' : 'Drag & drop files here, or click to select'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG accepted</p>
                </div>
            </div>

            {fields.length > 0 && (
                <div className="space-y-4">
                    <Label>Uploaded Files</Label>
                    <ScrollArea className="h-72 w-full rounded-md border p-4">
                        <div className="space-y-4">
                        {fields.map((field, index) => (
                           <div key={field.id} className="flex items-center gap-4 p-2 rounded-md bg-muted/30">
                             <div className="flex-shrink-0">{renderFilePreview(field.id, field.previewUrl)}</div>
                             <div className="flex-1">
                               <p className="text-sm font-medium truncate">{field.name}</p>
                               <p className="text-xs text-muted-foreground">{(field.size / 1024).toFixed(1)} KB</p>
                             </div>
                             <FormField
                                control={form.control}
                                name={`files.${index}.docType`}
                                render={({ field: selectField }) => (
                                    <FormItem className="w-56">
                                        <Select onValueChange={selectField.onChange} defaultValue={selectField.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select document type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {DOCUMENT_TYPES.map(type => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                             />
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveFile(index)}>
                                <XCircle className="h-5 w-5 text-destructive" />
                              </Button>
                           </div>
                        ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
             <Button type="button" onClick={handleNext}>Preview Submission</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    