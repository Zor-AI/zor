type PendingConfirmation = {
  resolve: (approved: boolean) => void;
  toolName: string;
  args: Record<string, unknown>;
};

const pending = new Map<string, PendingConfirmation>();
let onChangeCallback: ((info: PendingConfirmation | null) => void) | null = null;

export function setConfirmationCallback(cb: (info: PendingConfirmation | null) => void) {
  onChangeCallback = cb;
}

function notifyChange(info: PendingConfirmation | null) {
  if (onChangeCallback) onChangeCallback(info);
}

export async function requestToolConfirmation(toolName: string, args: Record<string, unknown>): Promise<boolean> {
  const callId = Math.random().toString(36).slice(2);
  return new Promise((resolve) => {
    pending.set(callId, { resolve, toolName, args });
    // notify with the newest pending (UI shows last requested)
    const entries = Array.from(pending.entries());
    notifyChange(entries.length > 0 ? entries[entries.length - 1][1] : null);
  });
}

export function getPendingConfirmation(): PendingConfirmation | null {
  const entries = Array.from(pending.entries());
  return entries.length > 0 ? entries[entries.length - 1][1] : null;
}

export function resolveConfirmation(approved: boolean, callId?: string) {
  if (callId && pending.has(callId)) {
    const entry = pending.get(callId)!;
    entry.resolve(approved);
    pending.delete(callId);
  } else if (pending.size > 0) {
    // fallback: resolve the most recent if no ID provided
    const entries = Array.from(pending.entries());
    entries[entries.length - 1][1].resolve(approved);
    pending.delete(entries[entries.length - 1][0]);
  }
  const entries = Array.from(pending.entries());
  notifyChange(entries.length > 0 ? entries[entries.length - 1][1] : null);
}
