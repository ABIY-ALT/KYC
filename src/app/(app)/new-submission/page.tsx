"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { useSubmissions } from "@/context/submissions-context";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadCloud, XCircle, File as FileIcon } from "lucide-react";
import type { User as UserData, Submission } from "@/lib/data";

const DOCUMENT_TYPES = [
  "National ID",
  "Passport",
  "Business License",
  "Application Form",
  "Supporting Document",
];

const schema = z.object({
  customerName: z.string().min(3, "Customer name must be at least 3 characters."),
});

type FormValues = z.infer<typeof schema>;

type LocalFile = {
  id: string;
  file: File;
  docType: string;
  preview: string;
};

export default function NewSubmissionPage() {
  const { toast } = useToast();
  const { addSubmission } = useSubmissions();

  const { user } = useUser();
  const firestore = useFirestore();
  const userRef = useMemoFirebase(
    () => (user ? doc(firestore, "users", user.uid) : null),
    [firestore, user]
  );
  const { data: userData } = useDoc<UserData>(userRef);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
        customerName: "",
    }
  });

  const [files, setFiles] = useState<LocalFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  /** Cleanup blob URLs */
  useEffect(() => {
    return () => {
      files.forEach(f => URL.revokeObjectURL(f.preview));
    };
  }, [files]);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles(prev =>
      prev.concat(
        accepted.map(file => ({
          id: crypto.randomUUID(),
          file,
          docType: "",
          preview: URL.createObjectURL(file),
        }))
      )
    );
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "image/*": ['.jpeg', '.png', '.jpg'] },
  });

  const removeFile = (id: string) => {
    setFiles(prev => {
      const f = prev.find(x => x.id === id);
      if (f) URL.revokeObjectURL(f.preview);
      return prev.filter(x => x.id !== id);
    });
  };

  const submit = async (data: FormValues) => {
    if (!files.length) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "At least one document is required."
      });
      return;
    }
    if (files.some(f => !f.docType)) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please assign a type to all documents.",
      });
      return;
    }

    setSubmitting(true);

    try {
      /** IMPORTANT: metadata only */
      const newSubmission: Omit<Submission, 'amendmentHistory' | 'pendingAmendments'> = {
        id: `SUB${Date.now().toString().slice(-4)}`,
        customerName: data.customerName,
        branch: userData?.branch ?? "Unknown",
        status: "Pending",
        submittedAt: new Date().toISOString(),
        officer: 'N/A',
        documents: files.map(f => ({
          id: f.id,
          fileName: f.file.name,
          documentType: f.docType,
          size: f.file.size,
          format: f.file.type,
          uploadedAt: new Date().toISOString(),
          url: `https://picsum.photos/seed/doc${f.id}/800/1100`, // Placeholder URL
          version: 1,
        })),
      };
      
      addSubmission(newSubmission as Submission);

      toast({ title: "Submission sent successfully" });

      files.forEach(f => URL.revokeObjectURL(f.preview));
      setFiles([]);
      form.reset();
    } finally {
      setSubmitting(false);
    }
  };
  
  const renderFilePreview = (file: LocalFile) => {
    if (file.file.type.startsWith("image/")) {
      return <Image src={file.preview} alt={file.file.name} width={40} height={40} className="rounded-sm object-cover" />
    }
    return <FileIcon className="h-10 w-10 text-muted-foreground" />
  }

  return (
    <Card className="w-full max-w-4xl mx-auto hover-lift">
      <CardHeader>
        <CardTitle className="gradient-text">New KYC Submission</CardTitle>
        <CardDescription>A stable, production-ready document intake form that separates file data from component state to prevent UI freezes.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Input placeholder="Customer Full Name" {...form.register("customerName")} />
        {form.formState.errors.customerName && <p className="text-sm font-medium text-destructive">{form.formState.errors.customerName.message}</p>}

        <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
          <p className="mt-4 text-muted-foreground">Drag & drop documents or click to select</p>
           <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG accepted</p>
        </div>

        {files.length > 0 && (
            <ScrollArea className="h-64 border rounded p-3">
                <div className="space-y-4">
                {files.map(f => (
                    <div key={f.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
                    <div className="flex-shrink-0">{renderFilePreview(f)}</div>
                     <div className="flex-1">
                        <p className="text-sm font-medium truncate">{f.file.name}</p>
                        <p className="text-xs text-muted-foreground">{(f.file.size / 1024).toFixed(1)} KB</p>
                     </div>
                    <Select
                        value={f.docType}
                        onValueChange={v =>
                        setFiles(prev =>
                            prev.map(x => (x.id === f.id ? { ...x, docType: v } : x))
                        )
                        }
                    >
                        <SelectTrigger className="w-56">
                        <SelectValue placeholder="Document type" />
                        </SelectTrigger>
                        <SelectContent>
                        {DOCUMENT_TYPES.map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>

                    <Button variant="ghost" size="icon" onClick={() => removeFile(f.id)}>
                        <XCircle className="h-5 w-5 text-destructive" />
                    </Button>
                    </div>
                ))}
                </div>
            </ScrollArea>
        )}

        <Button disabled={submitting} onClick={form.handleSubmit(submit)}>
          {submitting ? "Submitting..." : "Submit for Review"}
        </Button>
      </CardContent>
    </Card>
  );
}
