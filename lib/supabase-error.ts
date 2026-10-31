/**
 * Best-effort human-readable message from a Supabase/PostgREST error.
 * Permissive stub for the in-progress scaffold.
 */
export function getSupabaseErrorMessage(
  error: unknown,
  fallback = "Something went wrong."
): string {
  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return fallback;
}