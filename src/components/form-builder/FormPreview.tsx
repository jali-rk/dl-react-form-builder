import { Upload } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FormField } from '@/types/form';

interface FormPreviewProps {
  fields: FormField[];
}

export function FormPreview({ fields }: FormPreviewProps) {
  if (fields.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-60 text-sm text-gray-400">
        No fields added yet. Switch to Builder to add fields.
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      {fields.map((field) => {
        switch (field.type) {
          case 'title':
            return (
              <h1 key={field.id} className="text-2xl font-bold text-gray-900">
                {field.label || 'Form Title'}
              </h1>
            );

          case 'h2':
            return (
              <h2 key={field.id} className="text-xl font-semibold text-gray-800">
                {field.label || 'Section Heading'}
              </h2>
            );

          case 'h3':
            return (
              <h3 key={field.id} className="text-base font-semibold text-gray-700">
                {field.label || 'Sub-heading'}
              </h3>
            );

          case 'description':
            return (
              <p key={field.id} className="text-sm text-gray-500">
                {field.label || 'Add a description here'}
              </p>
            );

          case 'divider':
            return <hr key={field.id} className="border-t border-gray-200" />;

          case 'text':
            return (
              <div key={field.id} className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="ml-1 text-red-500">*</span>}
                </Label>
                <Input placeholder={field.placeholder} />
              </div>
            );

          case 'textarea':
            return (
              <div key={field.id} className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="ml-1 text-red-500">*</span>}
                </Label>
                <Textarea placeholder={field.placeholder} />
              </div>
            );

          case 'radio':
            return (
              <div key={field.id} className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="ml-1 text-red-500">*</span>}
                </Label>
                <div className="space-y-2">
                  {(field.options ?? []).map((opt) => (
                    <label key={opt.id} className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer">
                      <input type="radio" name={field.id} className="h-4 w-4 accent-gray-900" />
                      {opt.label}
                    </label>
                  ))}
                  {(field.options ?? []).length === 0 && (
                    <p className="text-xs text-gray-400 italic">No options added</p>
                  )}
                </div>
              </div>
            );

          case 'checkbox':
            return (
              <div key={field.id} className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="ml-1 text-red-500">*</span>}
                </Label>
                <div className="space-y-2">
                  {(field.options ?? []).map((opt) => (
                    <label key={opt.id} className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" className="h-4 w-4 rounded accent-gray-900" />
                      {opt.label}
                    </label>
                  ))}
                  {(field.options ?? []).length === 0 && (
                    <p className="text-xs text-gray-400 italic">No options added</p>
                  )}
                </div>
              </div>
            );

          case 'file_upload': {
            const acceptLabel =
              field.acceptedFileTypes === 'images' ? 'Images (JPG, PNG, WebP, GIF)'
              : field.acceptedFileTypes === 'pdfs' ? 'PDFs only'
              : 'Images & PDFs';
            return (
              <div key={field.id} className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="ml-1 text-red-500">*</span>}
                </Label>
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-8">
                  <Upload className="h-6 w-6 text-gray-400" />
                  <p className="text-sm text-gray-500">Click or drag to upload</p>
                  <p className="text-xs text-gray-400">{acceptLabel} · max {field.maxFileSizeMB ?? 10} MB</p>
                  <input type="file" className="hidden" />
                </div>
              </div>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}

