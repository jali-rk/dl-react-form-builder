import { v4 as uuidv4 } from 'uuid';
import type { FormTemplate } from '../types/form';

const STORAGE_KEY = 'form_builder_forms';

const SAMPLE_FORMS: FormTemplate[] = Array.from({ length: 17 }, (_, i) => ({
  id: uuidv4(),
  name: 'Form Example 1',
  type: 'Public',
  status: 'draft',
  fields: [
    {
      id: uuidv4(),
      type: 'text',
      label: 'Full Name',
      placeholder: 'Enter your full name',
      required: true,
    },
    {
      id: uuidv4(),
      type: 'textarea',
      label: 'Message',
      placeholder: 'Type your message here',
      required: false,
    },
  ],
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
}));

function getForms(): FormTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with sample data on first load
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_FORMS));
      return SAMPLE_FORMS;
    }
    return JSON.parse(raw) as FormTemplate[];
  } catch {
    return [];
  }
}

function saveForms(forms: FormTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
}

export const storage = {
  getAll(): FormTemplate[] {
    return getForms();
  },

  getById(id: string): FormTemplate | undefined {
    return getForms().find((f) => f.id === id);
  },

  create(form: Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt'>): FormTemplate {
    const forms = getForms();
    const newForm: FormTemplate = {
      ...form,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveForms([...forms, newForm]);
    return newForm;
  },

  update(id: string, updates: Partial<FormTemplate>): FormTemplate | null {
    const forms = getForms();
    const index = forms.findIndex((f) => f.id === id);
    if (index === -1) return null;
    const updated: FormTemplate = {
      ...forms[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };
    forms[index] = updated;
    saveForms(forms);
    return updated;
  },

  delete(id: string): boolean {
    const forms = getForms();
    const filtered = forms.filter((f) => f.id !== id);
    if (filtered.length === forms.length) return false;
    saveForms(filtered);
    return true;
  },
};
