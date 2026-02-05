
"use client";

import { File as FileIcon } from "lucide-react";

type UploadedFile = {
  name: string;
  size: number;
  type: string;
  url: string; // Data URL for preview
};

type InlineUploaderProps = {
  mode: 'REPLACE' | 'ADD';
  documentType: string;
  uploadedFile?: UploadedFile;
  onFileUploaded: (file: File) => void;
  onFileRemoved: () => void;
};

export function InlineUploader({
  mode,
  documentType,
  uploadedFile,
  onFileUploaded,
  onFileRemoved,
}: InlineUploaderProps) {
  return (
    <div className="border rounded-md p-3 bg-muted/40 space-y-2">
      <div>
        <p className="font-medium">{documentType}</p>
        <p className="text-xs text-muted-foreground">
          {mode === 'REPLACE'
            ? 'Replace existing document'
            : 'Upload new required document'}
        </p>
      </div>

      {!uploadedFile ? (
        <label className="flex justify-center items-center border-2 border-dashed rounded-md p-4 cursor-pointer hover:bg-muted">
          <input
            type="file"
            className="hidden"
            onChange={(e) => e.target.files && onFileUploaded(e.target.files[0])}
          />
          <span className="text-sm text-muted-foreground">Click to upload</span>
        </label>
      ) : (
        <div className="flex justify-between items-center bg-background p-2 rounded">
          <div className="flex items-center gap-2">
             {uploadedFile.type.startsWith("image/") ? (
                <img src={uploadedFile.url} alt={uploadedFile.name} className="h-10 w-10 object-cover rounded-sm" />
             ) : (
                <FileIcon className="h-10 w-10 text-muted-foreground" />
             )}
             <div>
                <p className="text-sm font-medium">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
             </div>
          </div>
          <button
            type="button"
            onClick={onFileRemoved}
            className="text-xs text-destructive hover:underline"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
