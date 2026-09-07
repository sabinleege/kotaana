/**
 * Job: dispatch a notification to a user
 */

import { registerJob, enqueue } from "./queue";
import { prisma } from "@/lib/db";

registerJob("notification.dispatch", async (payload) => {
  const userId = String(payload.userId || "");
  const title = String(payload.title || "Notification");
  const message = String(payload.message || "");
  const type = String(payload.type || "tip");

  if (!userId) throw new Error("userId required");

  await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      data: (payload.data as object) || undefined,
    },
  });
});

export function scheduleNotification(input: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  data?: Record<string, unknown>;
  delayMs?: number;
}) {
  return enqueue(
    "notification.dispatch",
    {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      data: input.data,
    },
    { delayMs: input.delayMs },
  );
}
