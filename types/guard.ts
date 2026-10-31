/**
 * Permissive types for the in-progress Karibu VMS guard module.
 *
 * The real schema lives in Supabase; these stubs let the dashboard scaffold
 * compile before the workspace is connected.
 */
export type Visitor = {
  id?: string;
  [key: string]: unknown;
};

export type Guard = {
  id?: string;
  [key: string]: unknown;
};
