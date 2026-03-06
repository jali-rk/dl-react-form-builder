import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { formsApi } from '@/api/formsApi';
import { BlockPalette, BLOCK_DEFINITIONS } from '@/components/form-builder/BlockPalette';
import { FormCanvas } from '@/components/form-builder/FormCanvas';
import { FormPreview } from '@/components/form-builder/FormPreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { FormField, FieldType, FormType } from '@/types/form';

export function FormBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);

  /* ---- Form meta state ---- */
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<FormType>('Public');

  /* ---- Fields state ---- */
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  /* ---- Loading / saving ---- */
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  /* ---- Load existing form for editing ---- */
  useEffect(() => {
    if (!id) return;
    formsApi
      .getById(id)
      .then((form) => {
        setFormName(form.name);
        setFormType(form.type);
        setFields(form.fields);
      })
      .catch(() => navigate('/admin/forms'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  /* ---- Add field from palette ---- */
  const handleAddField = (type: FieldType) => {
    const def = BLOCK_DEFINITIONS.find((b) => b.type === type);
    const newField: FormField = {
      id: uuidv4(),
      type,
      label: def?.defaultLabel ?? type,
      placeholder: def?.defaultPlaceholder,
      required: false,
      options:
        type === 'radio' || type === 'checkbox'
          ? [
              { id: uuidv4(), label: 'Option 1' },
              { id: uuidv4(), label: 'Option 2' },
            ]
          : undefined,
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  };

  /* ---- Update a field ---- */
  const handleFieldChange = (fieldId: string, updates: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
    );
  };

  /* ---- Delete a field ---- */
  const handleDeleteField = (fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  /* ---- Save ---- */
  const handleSave = async () => {
    if (!formName.trim()) {
      alert('Please enter a form name.');
      return;
    }
    setSaving(true);
    try {
      if (isEditing && id) {
        await formsApi.update(id, { name: formName, type: formType, fields });
      } else {
        await formsApi.create({ name: formName, type: formType, fields });
      }
      navigate('/admin/forms');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading form...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Form Builder</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/forms')} disabled={saving}>
            Discard
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Form'}
          </Button>
        </div>
      </div>

      {/* Form meta */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Form name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Form Template Name</Label>
            <Input
              placeholder="Example Template 1"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          {/* Form type */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Form Type</Label>
            <Select value={formType} onValueChange={(v) => setFormType(v as FormType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Public">Public</SelectItem>
                <SelectItem value="Private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Use existing template */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Use Existing Form Template</Label>
            <Select onValueChange={async (templateId) => {
              try {
                const form = await formsApi.getById(templateId);
                setFields(form.fields.map((f) => ({ ...f, id: uuidv4() })));
              } catch {
                // ignore
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none" disabled>
                  — select a template —
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Builder area */}
      <div className="grid grid-cols-[280px_1fr] gap-6">
        {/* Left: Block palette */}
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Drag and drop blocks to create your form</p>
          <BlockPalette onAddField={handleAddField} />
        </div>

        {/* Right: Canvas + Preview */}
        <div className="space-y-4">
          <Tabs defaultValue="builder">
            <div className="flex justify-end">
              <TabsList>
                <TabsTrigger value="builder">Builder</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="builder">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm min-h-[500px]">
                <FormCanvas
                  fields={fields}
                  selectedFieldId={selectedFieldId}
                  onSelectField={setSelectedFieldId}
                  onFieldChange={handleFieldChange}
                  onDeleteField={handleDeleteField}
                  onReorder={setFields}
                />
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm min-h-[500px]">
                <FormPreview fields={fields} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
