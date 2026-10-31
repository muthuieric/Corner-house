/**
 * Stub for the in-progress Karibu VMS verification module.
 *
 * Real implementation depends on the visitor-verification strategy used by the
 * company. The dashboard scaffold is incomplete, so this is a permissive stub
 * that satisfies TypeScript/bundling while the VMS is connected.
 */
export type VisitorVerificationMethod = "phone" | "email" | "qr" | "manual" | string;

export function canChooseVerificationMethod(..._args: unknown[]): boolean {
  return false;
}
