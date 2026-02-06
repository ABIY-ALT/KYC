"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { useSubmissions } from "@/context/submissions-context";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { User as UserData, Submission, SubmittedDocument } from "@/lib/data";
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

const fileSchema = z.object({
  file: z.instanceof(File),
  docType: z.string().min(1, "Please select a document type."),
  id: z.string(),
  previewUrl: z.string(), // For temporary client-side preview
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
  
  // CRITICAL FIX: Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      const files = form.getValues('files');
      files.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, [form]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      if (!fields.some(field => field.file.name === file.name && field.file.size === file.size)) {
        const previewUrl = URL.createObjectURL(file);
        append({ file, docType: "", id: Math.random().toString(36).substring(7), previewUrl });
      }
    });
  }, [append, fields]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*': ['.jpeg', '.png'], 'application/pdf': ['.pdf']} });
  
  const handleRemoveFile = (index: number) => {
    const fileToRemove = fields[index];
    if (fileToRemove?.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
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
    // Data storage is disabled for now as requested for debugging.
    
    toast({
      title: "Submission Successful (Simulation)",
      description: `Package for ${data.customerName} was processed without saving data.`,
    });
    
    form.reset();
    setStep('upload');
    setIsDialogOpen(false);
  };
  
  const renderFilePreview = (file: File, previewUrl: string) => {
    if (file.type.startsWith("image/")) {
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
                           {renderFilePreview(f.file, f.previewUrl)}
                       </div>
                       <div className="flex-1">
                           <CardTitle className="text-lg">{f.docType}</CardTitle>
                           <CardDescription>{f.file.name}</CardDescription>
                           <p className="text-xs text-muted-foreground mt-1">
                               {(f.file.size / (1024 * 1024)).toFixed(2)} MB | {new Date().toLocaleDateString()}
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
                             <div className="flex-shrink-0">{renderFilePreview(field.file, field.previewUrl)}</div>
                             <div className="flex-1">
                               <p className="text-sm font-medium truncate">{field.file.name}</p>
                               <p className="text-xs text-muted-foreground">{(field.file.size / 1024).toFixed(1)} KB</p>
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
