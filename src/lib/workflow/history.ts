/**
 * Workflow history / audit trail.
 * In-memory for now — replace with Prisma WorkflowHistory model later.
 */

export type HistoryEntry = {
  id: string;
  instanceId: string;
  event: string;
  data?: Record<string, unknown>;
  createdAt: Date;
};

const history: HistoryEntry[] = [];

function uid() {
  return `hist_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export async function recordHistory(
  instanceId: string,
  event: string,
  data?: Record<string, unknown>,
): Promise<void> {
  history.push({
    id: uid(),
    instanceId,
    event,
    data,
    createdAt: new Date(),
  });
}

export async function getHistory(instanceId: string): Promise<HistoryEntry[]> {
  return history
    .filter((h) => h.instanceId === instanceId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
