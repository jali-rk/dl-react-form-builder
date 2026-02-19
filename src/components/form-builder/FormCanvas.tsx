import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableField } from './SortableField';
import type { FormField } from '@/types/form';

interface FormCanvasProps {
  fields: FormField[];
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onFieldChange: (id: string, updates: Partial<FormField>) => void;
  onDeleteField: (id: string) => void;
  onReorder: (fields: FormField[]) => void;
}

export function FormCanvas({
  fields,
  selectedFieldId,
  onSelectField,
  onFieldChange,
  onDeleteField,
  onReorder,
}: FormCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      onReorder(arrayMove(fields, oldIndex, newIndex));
    }
  }

  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-60 rounded-lg border-2 border-dashed border-gray-200 p-8">
        <p className="text-sm text-gray-400 text-center">
          Click a block from the palette to add fields to your form
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <div
          className="space-y-3"
          onClick={(e) => {
            if (e.target === e.currentTarget) onSelectField(null);
          }}
        >
          {fields.map((field) => (
            <SortableField
              key={field.id}
              field={field}
              isSelected={selectedFieldId === field.id}
              onSelect={() => onSelectField(selectedFieldId === field.id ? null : field.id)}
              onDelete={() => {
                onDeleteField(field.id);
                if (selectedFieldId === field.id) onSelectField(null);
              }}
              onChange={(updates) => onFieldChange(field.id, updates)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
