import { useRef, useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Upload, X, FileText, ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';

import { storage } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import type { FormField } from '@/types/form';

interface FileUploadFieldProps {
  field: FormField;
  formId: string;
  userEmail: string;
  value: string; // download URL once uploaded
  onChange: (url: string) => void;
}

function getAcceptAttr(acceptedFileTypes: FormField['acceptedFileTypes']): string {
  switch (acceptedFileTypes) {
    case 'images': return 'image/jpeg,image/png,image/gif,image/webp';
    case 'pdfs': return 'application/pdf';
    default: return 'image/jpeg,image/png,image/gif,image/webp,application/pdf';
  }
}

function isFileAllowed(file: File, acceptedFileTypes: FormField['acceptedFileTypes']): boolean {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const pdfType = 'application/pdf';
  switch (acceptedFileTypes) {
    case 'images': return imageTypes.includes(file.type);
    case 'pdfs': return file.type === pdfType;
    default: return imageTypes.includes(file.type) || file.type === pdfType;
  }
}

export function FileUploadField({ field, formId, userEmail, value, onChange }: FileUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxBytes = (field.maxFileSizeMB ?? 10) * 1024 * 1024;

  const handleFile = (file: File) => {
    setError(null);

    if (!isFileAllowed(file, field.acceptedFileTypes)) {
      const label =
        field.acceptedFileTypes === 'images' ? 'images (JPG, PNG, WebP, GIF)'
        : field.acceptedFileTypes === 'pdfs' ? 'PDFs'
        : 'images or PDFs';
      setError(`Only ${label} are accepted.`);
      return;
    }

    if (file.size > maxBytes) {
      setError(`File exceeds the ${field.maxFileSizeMB ?? 10} MB limit.`);
      return;
    }

    // Sanitize filename to avoid path injection
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `form_uploads/${formId}/${field.id}/${encodeURIComponent(userEmail)}/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading(true);
    setProgress(0);
    setFileName(file.name);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
      },
      (err) => {
        setUploading(false);
        setError(err.message);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          setUploading(false);
          onChange(url);
        });
      },
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    onChange('');
    setFileName(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  const acceptLabel =
    field.acceptedFileTypes === 'images' ? 'JPG, PNG, WebP, GIF'
    : field.acceptedFileTypes === 'pdfs' ? 'PDF'
    : 'JPG, PNG, WebP, GIF, PDF';

  const isImage = fileName && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {value ? (
        // Uploaded state
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800 truncate">{fileName ?? 'File uploaded'}</p>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 underline hover:text-green-800"
            >
              View file
            </a>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="shrink-0 rounded-md p-1 text-green-600 hover:bg-green-100 hover:text-green-800 transition-colors"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : uploading ? (
        // Uploading state
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            <span className="truncate">{fileName}</span>
            <span className="ml-auto text-xs text-gray-400">{progress}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gray-800 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        // Drop zone
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 cursor-pointer transition-colors',
            isDragOver
              ? 'border-gray-400 bg-gray-100'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100',
          )}
        >
          <div className="flex items-center gap-2 text-gray-400">
            {field.acceptedFileTypes === 'pdfs' ? (
              <FileText className="h-6 w-6" />
            ) : field.acceptedFileTypes === 'images' ? (
              <ImageIcon className="h-6 w-6" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
          </div>
          <p className="text-sm text-gray-500 font-medium">Click to browse or drag & drop</p>
          <p className="text-xs text-gray-400">{acceptLabel} · max {field.maxFileSizeMB ?? 10} MB</p>
          <input
            ref={inputRef}
            type="file"
            accept={getAcceptAttr(field.acceptedFileTypes)}
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
