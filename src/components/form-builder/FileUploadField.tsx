import { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '@/lib/firebase';
import { UploadCloud, FileText, Trash2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface FileUploadFieldProps {
  formId: string;
  fieldId: string;
  userEmail: string;
  label: string;
  required: boolean;
  value: string; // Firebase storage download URL
  onChange: (value: string) => void;
  onUploadStateChange: (uploading: boolean) => void;
}

// 5MB limit in bytes
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

// Allowed file extensions as fallback
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx']);

export function FileUploadField({
  formId,
  fieldId,
  userEmail,
  label,
  required,
  value,
  onChange,
  onUploadStateChange,
}: FileUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to extract filename from URL
  const getFileNameFromUrl = (url: string): string => {
    if (!url) return '';
    try {
      const decoded = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
      const parts = decoded.split('/');
      const fullName = parts[parts.length - 1];
      const firstUnderscore = fullName.indexOf('_');
      return firstUnderscore !== -1 ? fullName.substring(firstUnderscore + 1) : fullName;
    } catch {
      return 'uploaded_file';
    }
  };

  const currentFileName = fileName || getFileNameFromUrl(value);

  const validateFile = (file: File): boolean => {
    setError(null);

    // 1. File Size Validation
    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size allowed is 5MB.');
      return false;
    }

    // 2. File Type Validation
    const extension = file.name.split('.').pop()?.toLowerCase();
    const hasValidType = ALLOWED_MIME_TYPES.has(file.type) || 
      (extension && ALLOWED_EXTENSIONS.has(extension));

    if (!hasValidType) {
      setError('Invalid file type. Only images, PDFs, and Word documents are allowed.');
      return false;
    }

    return true;
  };

  const handleUpload = (file: File) => {
    if (!validateFile(file)) return;

    setUploading(true);
    setProgress(0);
    setError(null);
    onUploadStateChange(true);

    const safeEmail = userEmail.replace(/[^a-zA-Z0-9.@_-]/g, '_');
    const safeFileName = `${uuidv4()}_${file.name}`;
    const storagePath = `form_uploads/${formId}/${fieldId}/${safeEmail}/${safeFileName}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress(pct);
      },
      (err) => {
        console.error('Firebase upload error:', err);
        setError('Upload failed. Please try again.');
        setUploading(false);
        onUploadStateChange(false);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setFileName(file.name);
          onChange(downloadUrl);
        } catch (err) {
          console.error('Failed to get download URL:', err);
          setError('Failed to retrieve uploaded file link.');
        } finally {
          setUploading(false);
          onUploadStateChange(false);
        }
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleUpload(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleUpload(droppedFile);
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    setUploading(true);
    setError(null);
    onUploadStateChange(true);

    try {
      const fileRef = ref(storage, value);
      await deleteObject(fileRef);
    } catch (err) {
      // If file doesn't exist or deletion is blocked, we still proceed with clearing state
      console.warn('Could not delete file from storage:', err);
    } finally {
      onChange('');
      setFileName('');
      setUploading(false);
      onUploadStateChange(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      </div>

      {/* Input container */}
      <div className="relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={uploading}
        />

        {/* 1. Normal State (Waiting for upload) */}
        {!value && !uploading && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 min-h-36 ${
              isDragging
                ? 'border-gray-900 bg-gray-50/80 scale-[0.99]'
                : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 border border-gray-100 mb-3 group-hover:scale-105 transition-transform">
              <UploadCloud className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              Drag & drop a file here, or{' '}
              <span className="text-gray-900 underline decoration-1 underline-offset-2">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1.5 font-normal">
              Images, PDFs, Word docs (up to 5MB)
            </p>
          </div>
        )}

        {/* 2. Uploading State */}
        {uploading && !value && (
          <div className="flex flex-col justify-center rounded-xl border border-gray-200 bg-white p-5 shadow-sm min-h-32">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
                <Loader2 className="h-4.5 w-4.5 animate-spin text-gray-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  Uploading file...
                </p>
                <p className="text-xs text-gray-400">Please do not submit or close this page</p>
              </div>
              <span className="text-sm font-bold text-gray-900 tabular-nums shrink-0">
                {progress}%
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gray-900 h-1.5 rounded-full transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 3. Successful Upload State */}
        {value && (
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:border-gray-300 transition-all">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 border border-green-100">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate pr-2 max-w-[200px] sm:max-w-[360px]" title={currentFileName}>
                  {currentFileName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Uploaded</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              title="Remove uploaded file"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-1.5 mt-1.5 text-red-600 animate-fadeIn">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="text-xs font-medium leading-relaxed">{error}</span>
        </div>
      )}
    </div>
  );
}
