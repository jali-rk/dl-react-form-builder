/**
 * Forms API
 *
 * Clean API layer for form CRUD operations.
 * Currently backed by localStorage for demo purposes.
 * Replace `storage.*` calls with real HTTP requests (fetch/axios) to integrate with a backend.
 */

import { v4 as uuidv4 } from 'uuid';

import { storage } from '../lib/storage';
import type {
  FormTemplate,
  CreateFormDto,
  UpdateFormDto,
  PaginatedResponse,
  FormListParams,
  FormField,
} from '../types/form';

/** Simulates network latency in development */
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const formsApi = {
  /**
   * List all forms with optional search, status filter, and pagination.
   */
  async list(params: FormListParams = {}): Promise<PaginatedResponse<FormTemplate>> {
    await delay();
    const { search = '', status = 'all', page = 1, pageSize = 10 } = params;

    let forms = storage.getAll();

    if (search.trim()) {
      const q = search.toLowerCase();
      forms = forms.filter((f) => f.name.toLowerCase().includes(q));
    }

    if (status !== 'all') {
      forms = forms.filter((f) => f.status === status);
    }

    const total = forms.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    const data = forms.slice(start, start + pageSize);

    return { data, total, page: currentPage, pageSize, totalPages };
  },

  /**
   * Get a single form by ID.
   */
  async getById(id: string): Promise<FormTemplate> {
    await delay();
    const form = storage.getById(id);
    if (!form) throw new Error(`Form with id "${id}" not found`);
    return form;
  },

  /**
   * Create a new form.
   */
  async create(dto: CreateFormDto): Promise<FormTemplate> {
    await delay();
    const fields: FormField[] = dto.fields.map((f) => ({ ...f, id: uuidv4() }));
    return storage.create({
      name: dto.name,
      type: dto.type,
      status: 'draft',
      fields,
    });
  },

  /**
   * Update an existing form.
   */
  async update(id: string, dto: UpdateFormDto): Promise<FormTemplate> {
    await delay();
    const updated = storage.update(id, dto);
    if (!updated) throw new Error(`Form with id "${id}" not found`);
    return updated;
  },

  /**
   * Delete a form by ID.
   */
  async delete(id: string): Promise<void> {
    await delay();
    const success = storage.delete(id);
    if (!success) throw new Error(`Form with id "${id}" not found`);
  },

  /**
   * Toggle the published/draft status of a form.
   */
  async toggleStatus(id: string): Promise<FormTemplate> {
    await delay();
    const form = storage.getById(id);
    if (!form) throw new Error(`Form with id "${id}" not found`);
    const newStatus = form.status === 'published' ? 'draft' : 'published';
    const updated = storage.update(id, { status: newStatus });
    if (!updated) throw new Error(`Failed to update form "${id}"`);
    return updated;
  },

  /**
   * Duplicate a form.
   */
  async duplicate(id: string): Promise<FormTemplate> {
    await delay();
    const source = storage.getById(id);
    if (!source) throw new Error(`Form with id "${id}" not found`);
    const fields: FormField[] = source.fields.map((f) => ({ ...f, id: uuidv4() }));
    return storage.create({
      name: `${source.name} (Copy)`,
      type: source.type,
      status: 'draft',
      fields,
    });
  },
};
