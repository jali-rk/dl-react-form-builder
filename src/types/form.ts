export type FieldType =
  | 'title'
  | 'h2'
  | 'h3'
  | 'description'
  | 'divider'
  | 'text'
  | 'textarea'
  | 'radio'
  | 'checkbox'
  | 'file';

export type FormType = 'Public' | 'Private';
export type FormStatus = 'published' | 'draft';

export interface FieldOption {
  id: string;
  label: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: FieldOption[]; // for radio and checkbox
  accept?: string; // for file upload
}

export interface FormTemplate {
  id: string;
  name: string;
  type: FormType;
  status: FormStatus;
  fields: FormField[];
  creator_id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFormDto {
  name: string;
  type: FormType;
  fields: Omit<FormField, 'id'>[];
  creator_id: string;
}

export interface UpdateFormDto {
  name?: string;
  type?: FormType;
  status?: FormStatus;
  fields?: FormField[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FormListParams {
  search?: string;
  status?: FormStatus | 'all';
  page?: number;
  pageSize?: number;
}

export interface FormAnswer {
  field_id: string;
  field_label: string;
  field_type: FieldType;
  value: string | string[];
}

export interface FormResponse {
  id: string;
  form_id: string;
  user_id: string;
  user_name: string;
  submitted_at: string;
  answers: FormAnswer[];
}
