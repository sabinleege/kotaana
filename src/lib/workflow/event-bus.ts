/**
 * Simple in-process event bus for workflow events.
 * Later can be replaced with Redis, Kafka, or Inngest events.
 */

type Handler = (payload: Record<string, unknown>) => void | Promise<void>;

const listeners = new Map<string, Set<Handler>>();

export function subscribe(event: string, handler: Handler): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(handler);
  return () => listeners.get(event)?.delete(handler);
}

export async function publish(event: string, payload: Record<string, unknown>): Promise<void> {
  const handlers = listeners.get(event);
  if (!handlers) return;

  for (const handler of handlers) {
    try {
      await handler(payload);
    } catch (err) {
      console.error(`[event-bus] handler error for ${event}:`, err);
    }
  }
}

/** Convenience: listen to all workflow.* events */
export function onWorkflowEvent(handler: Handler) {
  const events = ["workflow.started", "workflow.completed", "workflow.failed"];
  const unsubs = events.map((e) => subscribe(e, handler));
  return () => unsubs.forEach((u) => u());
}
