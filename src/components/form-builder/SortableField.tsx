import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Settings2,
  Trash2,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { FormField } from '@/types/form';
import { FieldEditorPanel } from './FieldEditorPanel';

interface SortableFieldProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onChange: (updates: Partial<FormField>) => void;
}

function FieldPreview({ field }: { field: FormField }) {
  switch (field.type) {
    case 'title':
      return <h1 className="text-2xl font-bold text-gray-900">{field.label || 'Form Title'}</h1>;

    case 'h2':
      return <h2 className="text-xl font-semibold text-gray-800">{field.label || 'Section Heading'}</h2>;

    case 'h3':
      return <h3 className="text-base font-semibold text-gray-700">{field.label || 'Sub-heading'}</h3>;

    case 'description':
      return <p className="text-sm text-gray-500">{field.label || 'Add a description here'}</p>;

    case 'divider':
      return <hr className="border-t border-gray-200 my-1" />;

    case 'text':
      return (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <Input placeholder={field.placeholder} className="pointer-events-none" readOnly />
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <Textarea placeholder={field.placeholder} className="pointer-events-none" readOnly />
        </div>
      );

    case 'radio':
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <div className="space-y-1.5">
            {(field.options ?? [{ id: '1', label: 'Option 1' }]).map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 text-sm text-gray-600">
                <input type="radio" className="h-4 w-4" readOnly />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      );

    case 'checkbox':
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <div className="space-y-1.5">
            {(field.options ?? [{ id: '1', label: 'Option 1' }]).map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="h-4 w-4 rounded" readOnly />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      );

    case 'file':
      return (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="ml-1 text-red-500">*</span>}
          </label>
          <div className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
            <p className="text-xs text-gray-400">
              {field.accept ? `Accepted: ${field.accept}` : 'Click to upload or drag and drop'}
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
}

export function SortableField({ field, isSelected, onSelect, onDelete, onChange }: SortableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-lg border bg-white shadow-sm transition-all',
        isSelected ? 'border-gray-400 ring-1 ring-gray-300' : 'border-gray-200 hover:border-gray-300',
        isDragging && 'opacity-50 shadow-lg',
      )}
    >
      {/* Field content */}
      <div
        className="p-4 cursor-pointer"
        onClick={onSelect}
      >
        <FieldPreview field={field} />
      </div>

      {/* Action buttons */}
      <div
        className={cn(
          'absolute right-2 top-2 flex items-center gap-1 transition-opacity',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
      >
        <button
          {...listeners}
          {...attributes}
          className="flex h-7 w-7 cursor-grab items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600',
            isSelected && 'bg-gray-100 text-gray-600',
          )}
        >
          <Settings2 className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Inline editor panel */}
      {isSelected && (
        <FieldEditorPanel field={field} onChange={onChange} />
      )}
    </div>
  );
}
