// Common type definitions for the application

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FormData {
  [key: string]: string | number | boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: Record<string, unknown>;
}

export interface OpportunityData {
  estimated_value_min?: number;
  estimated_value_max?: number;
  title?: string;
  description?: string;
  agency?: string;
  due_date?: string;
  solicitation_number?: string;
  naics_codes?: string[];
  requirements?: string[];
}

export interface ApplicationData {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  form_data?: Record<string, unknown>;
  opportunities?: OpportunityData;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}
