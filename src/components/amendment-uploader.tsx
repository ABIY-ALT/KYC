
"use client";

type InlineUploaderProps = {
  mode: 'REPLACE' | 'ADD';
  documentType: string;
  uploadedFile?: any;
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
          <div>
            <p className="text-sm font-medium">{uploadedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(uploadedFile.size / 1024).toFixed(1)} KB
            </p>
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
