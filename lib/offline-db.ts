/**
 * Stub for the in-progress Karibu VMS offline database module.
 *
 * These helpers persist visitor check-ins while offline and enqueue sync actions
 * for when connectivity is restored. They are stubs so the dashboard scaffold
 * still compiles without the offline store wired up.
 */
export type OfflineVisitorInput = unknown;
export type SyncActionInput = unknown;

export async function saveOfflineWalkInVisitor(_input: OfflineVisitorInput): Promise<unknown> {
  return null;
}

export async function enqueueSyncAction(_input: SyncActionInput): Promise<unknown> {
  return null;
}
