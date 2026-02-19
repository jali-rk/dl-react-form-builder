import type { FieldType } from '@/types/form';
import {
  Type,
  AlignLeft,
  RadioIcon,
  CheckSquare,
  Upload,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Text,
} from 'lucide-react';

export interface BlockDefinition {
  type: FieldType;
  label: string;
  icon: React.ElementType;
  defaultLabel: string;
  defaultPlaceholder?: string;
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: 'title',
    label: 'Title (H1)',
    icon: Heading1,
    defaultLabel: 'Form Title',
  },
  {
    type: 'h2',
    label: 'Heading H2',
    icon: Heading2,
    defaultLabel: 'Section Heading',
  },
  {
    type: 'h3',
    label: 'Heading H3',
    icon: Heading3,
    defaultLabel: 'Sub-heading',
  },
  {
    type: 'description',
    label: 'Description',
    icon: Text,
    defaultLabel: 'Add a description here',
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: Minus,
    defaultLabel: 'divider',
  },
  {
    type: 'text',
    label: 'Text field',
    icon: Type,
    defaultLabel: 'Text field',
    defaultPlaceholder: 'Placeholder',
  },
  {
    type: 'textarea',
    label: 'Text area',
    icon: AlignLeft,
    defaultLabel: 'Text area',
    defaultPlaceholder: 'Placeholder',
  },
  {
    type: 'radio',
    label: 'Radio button',
    icon: RadioIcon,
    defaultLabel: 'Radio button',
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: CheckSquare,
    defaultLabel: 'Checkbox',
  },
  {
    type: 'file',
    label: 'File upload',
    icon: Upload,
    defaultLabel: 'File upload',
  },
];

interface BlockPaletteProps {
  onAddField: (type: FieldType) => void;
}

export function BlockPalette({ onAddField }: BlockPaletteProps) {
  return (
    <div className="grid grid-cols-2 gap-2" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
      {BLOCK_DEFINITIONS.map((block) => {
        const Icon = block.icon;
        return (
          <button
            key={block.type}
            onClick={() => onAddField(block.type)}
            className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer group"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white group-hover:border-gray-300">
              <Icon className="h-3.5 w-3.5 text-gray-600" />
            </div>
            <span className="text-xs leading-tight">{block.label}</span>
          </button>
        );
      })}
    </div>
  );
}
