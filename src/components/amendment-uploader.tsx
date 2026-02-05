"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FileText, FileUp, XCircle } from "lucide-react";
import type { SubmittedDocument } from "@/lib/data";

export const fileSchema = z.object({
  originalDocId: z.string(),
  file: z.instanceof(File),
  docType: z.string().min(1, "Please select a document type."),
});

export const renderFilePreviewIcon = (file: File | SubmittedDocument) => {
    const isFileInstance = file instanceof File;
    const fileType = isFileInstance ? file.type : file.format;
    const fileUrl = isFileInstance ? URL.createObjectURL(file) : file.url;

    if (fileType.startsWith("image/")) {
      return <Image src={fileUrl} alt={file.name || file.fileName} width={40} height={40} className="rounded-sm object-cover" />
    }
    return <FileText className="h-10 w-10 text-muted-foreground" />
}

interface InlineUploaderProps {
    originalDoc: SubmittedDocument;
    onFileUploaded: (file: File) => void;
    uploadedFile: File | undefined;
    onFileRemoved: () => void;
}

export function InlineUploader({ originalDoc, onFileUploaded, uploadedFile, onFileRemoved }: InlineUploaderProps) {
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
    
    if (uploadedFile) {
        return (
            <div className="flex items-center gap-2 p-1 rounded-md border bg-muted/50">
                <FileText className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm truncate flex-1">{uploadedFile.name}</p>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onFileRemoved}>
                    <XCircle className="h-4 w-4 text-destructive" />
                </Button>
            </div>
        );
    }

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
                {isDragActive ? 'Drop New Version' : 'Upload New Version'}
            </Button>
        </div>
    );
}
