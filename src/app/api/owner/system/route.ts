/**
 * GET /api/owner/system — deployment health for the app owner.
 *
 * Reports whether each integration is CONFIGURED, never what it is configured
 * with: only booleans leave this route, never a key, a value or a fragment of one.
 */
import { requireRole } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { prisma } from "@/lib/db";

const has = (v?: string | null) => Boolean(v && v.trim().length > 0);

export const GET = route(async () => {
  await requireRole("admin");

  // Database round-trip — the one check that proves the app can actually serve.
  const startedAt = Date.now();
  let dbOk = true;
  let dbError: string | null = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbOk = false;
    dbError = err instanceof Error ? err.message.split("\n")[0] : "Unreachable";
  }
  const dbLatencyMs = Date.now() - startedAt;

  const [tables, storagePending] = await Promise.all([
    dbOk
      ? Promise.all([
          prisma.user.count(),
          prisma.profile.count(),
          prisma.workoutLog.count(),
          prisma.aiUsage.count(),
          prisma.injury.count(),
          prisma.notification.count(),
          prisma.medicalDocument.count(),
          prisma.paymentRequest.count(),
        ])
      : Promise.resolve([0, 0, 0, 0, 0, 0, 0, 0]),
    dbOk
      ? prisma.paymentRequest.count({ where: { status: "pending" } }).catch(() => 0)
      : Promise.resolve(0),
  ]);

  const groups = [
    {
      group: "Core",
      items: [
        { key: "DATABASE_URL", label: "Database", ok: has(process.env.DATABASE_URL), required: true },
        { key: "AUTH_SECRET", label: "Auth secret", ok: has(process.env.AUTH_SECRET), required: true },
        { key: "AUTH_URL", label: "Auth URL", ok: has(process.env.AUTH_URL), required: false },
        { key: "NEXT_PUBLIC_APP_URL", label: "Public app URL", ok: has(process.env.NEXT_PUBLIC_APP_URL), required: false },
      ],
    },
    {
      group: "AI",
      items: [
        { key: "GEMINI_API_KEY", label: "Gemini (everyday + vision)", ok: has(process.env.GEMINI_API_KEY), required: false },
        { key: "OPENROUTER_API_KEY", label: "OpenRouter (agent + reasoning)", ok: has(process.env.OPENROUTER_API_KEY), required: false },
      ],
    },
    {
      group: "Sign-in",
      items: [
        { key: "AUTH_GOOGLE_ID", label: "Google client ID", ok: has(process.env.AUTH_GOOGLE_ID), required: false },
        { key: "AUTH_GOOGLE_SECRET", label: "Google client secret", ok: has(process.env.AUTH_GOOGLE_SECRET), required: false },
      ],
    },
    {
      group: "Jobs & payments",
      items: [
        { key: "CRON_SECRET", label: "Cron secret", ok: has(process.env.CRON_SECRET), required: false },
        { key: "PLATFORM_MOMO_CODE", label: "Platform MoMo code", ok: has(process.env.PLATFORM_MOMO_CODE), required: false },
      ],
    },
    {
      group: "Storage",
      items: [
        { key: "S3_BUCKET", label: "S3 bucket (falls back to local disk)", ok: has(process.env.S3_BUCKET), required: false },
        { key: "S3_ACCESS_KEY", label: "S3 access key", ok: has(process.env.S3_ACCESS_KEY), required: false },
      ],
    },
  ];

  const [users, profiles, workoutLogs, aiUsage, injuries, notifications, medicalDocs, payments] = tables;

  return json({
    runtime: {
      env: process.env.NODE_ENV ?? "development",
      node: process.version,
      storage: has(process.env.S3_BUCKET) ? "s3" : "local disk",
      aiConfigured: has(process.env.GEMINI_API_KEY) || has(process.env.OPENROUTER_API_KEY),
      generatedAt: new Date().toISOString(),
    },
    database: { ok: dbOk, latencyMs: dbLatencyMs, error: dbError },
    config: groups,
    tables: [
      { name: "users", rows: users },
      { name: "profiles", rows: profiles },
      { name: "workout_logs", rows: workoutLogs },
      { name: "ai_usage", rows: aiUsage },
      { name: "injuries", rows: injuries },
      { name: "notifications", rows: notifications },
      { name: "medical_documents", rows: medicalDocs },
      { name: "payment_requests", rows: payments },
    ],
    attention: {
      pendingPayments: storagePending,
    },
  });
});
