import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { FieldOption, FormField } from '@/types/form';

interface FieldEditorPanelProps {
  field: FormField;
  onChange: (updates: Partial<FormField>) => void;
}

export function FieldEditorPanel({ field, onChange }: FieldEditorPanelProps) {
  const isStructural = field.type === 'title' || field.type === 'h2' || field.type === 'h3' || field.type === 'description';
  const isDivider = field.type === 'divider';
  const hasOptions = field.type === 'radio' || field.type === 'checkbox';
  const hasPlaceholder = field.type === 'text' || field.type === 'textarea';
  const isFileUpload = field.type === 'file_upload';

  const addOption = () => {
    const options: FieldOption[] = [
      ...(field.options ?? []),
      { id: uuidv4(), label: `Option ${(field.options?.length ?? 0) + 1}` },
    ];
    onChange({ options });
  };

  const updateOption = (id: string, label: string) => {
    const options = (field.options ?? []).map((o) => (o.id === id ? { ...o, label } : o));
    onChange({ options });
  };

  const removeOption = (id: string) => {
    const options = (field.options ?? []).filter((o) => o.id !== id);
    onChange({ options });
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
      {/* Divider has no editable content */}
      {isDivider && (
        <p className="text-xs text-gray-400 italic">Horizontal rule — no settings.</p>
      )}

      {/* Label / heading text */}
      {!isDivider && (
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">
            {field.type === 'title' ? 'Title text'
              : field.type === 'h2' ? 'Heading text'
              : field.type === 'h3' ? 'Sub-heading text'
              : field.type === 'description' ? 'Description text'
              : 'Label'}
          </Label>
          <Input
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder={
              field.type === 'title' ? 'Enter form title'
              : field.type === 'h2' ? 'Enter section heading'
              : field.type === 'h3' ? 'Enter sub-heading'
              : field.type === 'description' ? 'Enter description'
              : 'Field label'
            }
            className="h-8 text-xs"
          />
        </div>
      )}

      {/* Placeholder */}
      {hasPlaceholder && (
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">Placeholder</Label>
          <Input
            value={field.placeholder ?? ''}
            onChange={(e) => onChange({ placeholder: e.target.value })}
            placeholder="Placeholder text"
            className="h-8 text-xs"
          />
        </div>
      )}

      {/* Options for Radio / Checkbox */}
      {hasOptions && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Options</Label>
          <div className="space-y-1.5">
            {(field.options ?? []).map((opt) => (
              <div key={opt.id} className="flex items-center gap-2">
                <Input
                  value={opt.label}
                  onChange={(e) => updateOption(opt.id, e.target.value)}
                  className="h-7 text-xs flex-1"
                />
                <button
                  onClick={() => removeOption(opt.id)}
                  className="h-7 w-7 flex items-center justify-center rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addOption}
            className="h-7 gap-1 text-xs w-full"
          >
            <Plus className="h-3 w-3" />
            Add option
          </Button>
        </div>
      )}

      {/* File upload config */}
      {isFileUpload && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Accepted file types</Label>
            <Select
              value={field.acceptedFileTypes ?? 'both'}
              onValueChange={(v) => onChange({ acceptedFileTypes: v as FormField['acceptedFileTypes'] })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="images">Images only (JPG, PNG, WebP, GIF)</SelectItem>
                <SelectItem value="pdfs">PDFs only</SelectItem>
                <SelectItem value="both">Images & PDFs</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Max file size (MB)</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={field.maxFileSizeMB ?? 10}
              onChange={(e) => onChange({ maxFileSizeMB: Math.min(50, Math.max(1, Number(e.target.value))) })}
              className="h-8 text-xs"
            />
          </div>
        </>
      )}

      {/* Required toggle — not applicable for structural / divider fields */}
      {!isStructural && !isDivider && (
        <div className="flex items-center justify-between pt-1">
          <Label className="text-xs text-gray-600 font-medium">Required</Label>
          <Switch
            checked={field.required}
            onCheckedChange={(checked) => onChange({ required: checked })}
          />
        </div>
      )}
    </div>
  );
}
