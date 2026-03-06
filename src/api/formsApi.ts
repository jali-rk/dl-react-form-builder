/**
 * Forms API
 *
 * Firestore-backed API layer for form CRUD operations.
 */

import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

import type {
  CreateFormDto,
  FormField,
  FormListParams,
  FormTemplate,
  PaginatedResponse,
  UpdateFormDto,
} from '@/types/form';

const FORMS_COLLECTION = 'forms';

/**
 * Recursively remove all `undefined` values from an object/array.
 * Firestore does not accept `undefined` in any field.
 */
function stripUndefined<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(stripUndefined) as T;
  if (typeof value === 'object' && !(value instanceof Timestamp)) {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        cleaned[k] = stripUndefined(v);
      }
    }
    return cleaned as T;
  }
  return value;
}

/** Convert a Firestore document snapshot to a FormTemplate */
function docToForm(id: string, data: Record<string, unknown>): FormTemplate {
  return {
    id,
    name: data.form_name as string,
    type: data.type as FormTemplate['type'],
    status: (data.status as FormTemplate['status']) ?? 'draft',
    fields: (data.blocks as FormField[]) ?? [],
    creator_id: data.creator_id as string,
    createdAt:
      data.created_at instanceof Timestamp
        ? data.created_at.toDate().toISOString()
        : (data.created_at as string) ?? new Date().toISOString(),
    updatedAt:
      data.updated_at instanceof Timestamp
        ? data.updated_at.toDate().toISOString()
        : (data.updated_at as string) ?? new Date().toISOString(),
  };
}

export const formsApi = {
  /**
   * List all forms with optional search, status filter, and pagination.
   */
  async list(params: FormListParams = {}): Promise<PaginatedResponse<FormTemplate>> {
    const { search = '', status = 'all', page = 1, pageSize = 10 } = params;

    let snapshot;
    try {
      const q = query(collection(db, FORMS_COLLECTION), orderBy('created_at', 'desc'));
      snapshot = await getDocs(q);
    } catch {
      // Fallback: fetch without ordering if index is not yet created
      snapshot = await getDocs(collection(db, FORMS_COLLECTION));
    }

    let forms: FormTemplate[] = snapshot.docs.map((d) =>
      docToForm(d.id, d.data() as Record<string, unknown>),
    );

    if (search.trim()) {
      const s = search.toLowerCase();
      forms = forms.filter((f) => f.name.toLowerCase().includes(s));
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
    const snap = await getDoc(doc(db, FORMS_COLLECTION, id));
    if (!snap.exists()) throw new Error(`Form with id "${id}" not found`);
    return docToForm(snap.id, snap.data() as Record<string, unknown>);
  },

  /**
   * Create a new form.
   */
  async create(dto: CreateFormDto): Promise<FormTemplate> {
    if (!dto.creator_id) {
      throw new Error('You must be logged in to create a form.');
    }

    const fields: FormField[] = dto.fields.map((f) => ({ ...f, id: uuidv4() }));
    const now = Timestamp.now();

    const docData = {
      form_name: dto.name,
      type: dto.type,
      status: 'draft',
      blocks: stripUndefined(fields),
      creator_id: dto.creator_id,
      created_at: now,
      updated_at: now,
    };

    const docRef = await addDoc(collection(db, FORMS_COLLECTION), docData);

    return {
      id: docRef.id,
      name: dto.name,
      type: dto.type,
      status: 'draft',
      fields,
      creator_id: dto.creator_id,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    };
  },

  /**
   * Update an existing form.
   */
  async update(id: string, dto: UpdateFormDto): Promise<FormTemplate> {
    const ref = doc(db, FORMS_COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Form with id "${id}" not found`);

    const updateData: Record<string, unknown> = { updated_at: Timestamp.now() };
    if (dto.name !== undefined) updateData.form_name = dto.name;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.fields !== undefined) updateData.blocks = stripUndefined(dto.fields);

    await updateDoc(ref, updateData);

    const updated = await getDoc(ref);
    return docToForm(updated.id, updated.data() as Record<string, unknown>);
  },

  /**
   * Delete a form by ID.
   */
  async delete(id: string): Promise<void> {
    const ref = doc(db, FORMS_COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Form with id "${id}" not found`);
    await deleteDoc(ref);
  },

  /**
   * Toggle the published/draft status of a form.
   */
  async toggleStatus(id: string): Promise<FormTemplate> {
    const ref = doc(db, FORMS_COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Form with id "${id}" not found`);

    const data = snap.data() as Record<string, unknown>;
    const newStatus = data.status === 'published' ? 'draft' : 'published';

    await updateDoc(ref, { status: newStatus, updated_at: Timestamp.now() });

    const updated = await getDoc(ref);
    return docToForm(updated.id, updated.data() as Record<string, unknown>);
  },

  /**
   * Duplicate a form.
   */
  async duplicate(id: string): Promise<FormTemplate> {
    const source = await this.getById(id);
    const fields: FormField[] = source.fields.map((f) => ({ ...f, id: uuidv4() }));
    const now = Timestamp.now();

    const docData = {
      form_name: `${source.name} (Copy)`,
      type: source.type,
      status: 'draft' as const,
      blocks: stripUndefined(fields),
      creator_id: source.creator_id,
      created_at: now,
      updated_at: now,
    };

    const docRef = await addDoc(collection(db, FORMS_COLLECTION), docData);

    return {
      id: docRef.id,
      name: docData.form_name,
      type: source.type,
      status: 'draft',
      fields,
      creator_id: source.creator_id,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    };
  },
};
