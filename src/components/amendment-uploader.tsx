
"use client";

import Image from "next/image";
import { File as FileIcon, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

type UploadedFile = File;

type InlineUploaderProps = {
  mode: 'REPLACE' | 'ADD';
  documentType: string;
  uploadedFile?: UploadedFile;
  previewUrl?: string;
  onFileUploaded: (file: File) => void;
  onFileRemoved: () => void;
};

export function InlineUploader({
  mode,
  documentType,
  uploadedFile,
  previewUrl,
  onFileUploaded,
  onFileRemoved,
}: InlineUploaderProps) {
  return (
    <div className="border rounded-md p-3 bg-muted/40 space-y-2 hover-lift">
      <div>
        <p className="font-medium">{documentType}</p>
        <p className="text-xs text-muted-foreground">
          {mode === 'REPLACE'
            ? 'Replace existing document'
            : 'Upload new required document'}
        </p>
      </div>

      {!uploadedFile ? (
        <label className="flex flex-col justify-center items-center border-2 border-dashed rounded-md p-4 cursor-pointer hover:bg-muted transition-colors">
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <input
            type="file"
            className="hidden"
            onChange={(e) => e.target.files && onFileUploaded(e.target.files[0])}
          />
          <span className="mt-2 text-sm text-muted-foreground">Click or drag file to upload</span>
        </label>
      ) : (
        <div className="flex justify-between items-center bg-background p-2 rounded border">
          <div className="flex items-center gap-2 overflow-hidden">
             {uploadedFile.type.startsWith("image/") && previewUrl ? (
                <Image src={previewUrl} alt={uploadedFile.name} width={40} height={40} className="h-10 w-10 object-cover rounded-sm flex-shrink-0" />
             ) : (
                <FileIcon className="h-10 w-10 text-muted-foreground flex-shrink-0" />
             )}
             <div className="truncate">
                <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
             </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onFileRemoved}
            className="text-destructive hover:text-destructive"
          >
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}
