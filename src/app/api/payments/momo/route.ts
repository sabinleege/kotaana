/**
 * MoMo payment requests to platform (8787).
 * POST — create pending payment (athlete or coach)
 * GET — list my requests
 */
import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { prisma } from "@/lib/db";
import { PLATFORM_MOMO_CODE, planById } from "@/lib/payments/momo";

const postSchema = z.object({
  planType: z.string().min(1),
  payerNumber: z.string().min(5).max(20),
  payerName: z.string().min(1).max(80),
  note: z.string().max(300).optional(),
});

export const GET = route(async () => {
  const me = await requireUser();
  const rows = await prisma.paymentRequest.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return json({ requests: rows, platformCode: PLATFORM_MOMO_CODE });
});

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const body = postSchema.parse(await req.json());
  const plan = planById(body.planType);
  if (!plan) return json({ error: "Unknown plan" }, 400);

  const role = me.role === "coach" ? "coach" : "athlete";
  if (plan.forRole !== "both" && plan.forRole !== role) {
    return json({ error: `Plan ${plan.id} is not for ${role} accounts` }, 400);
  }

  // Save MoMo on profile for next time
  await prisma.profile.upsert({
    where: { userId: me.id },
    create: {
      userId: me.id,
      momoNumber: body.payerNumber.replace(/\s+/g, ""),
      momoName: body.payerName.trim(),
    },
    update: {
      momoNumber: body.payerNumber.replace(/\s+/g, ""),
      momoName: body.payerName.trim(),
    },
  });

  const row = await prisma.paymentRequest.create({
    data: {
      userId: me.id,
      role,
      planType: plan.id,
      amountLabel: plan.amountLabel,
      payerNumber: body.payerNumber.replace(/\s+/g, ""),
      payerName: body.payerName.trim(),
      payToCode: PLATFORM_MOMO_CODE,
      status: "pending",
      note: body.note,
    },
  });

  // Notify owners
  const owners = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
  await Promise.all(
    owners.map((o) =>
      prisma.notification.create({
        data: {
          userId: o.id,
          title: "MoMo payment pending",
          message: `${body.payerName} (${body.payerNumber}) paid ${plan.amountLabel} for ${plan.label}. Approve in Admin → Payments.`,
          type: "payment_pending",
          data: { paymentRequestId: row.id },
        },
      }).catch(() => null),
    ),
  );


  // Pending receipt to payer
  const { formatReceiptMessage, formatReceiptTitle } = await import("@/lib/payments/receipt");
  await prisma.notification.create({
    data: {
      userId: me.id,
      title: formatReceiptTitle("pending"),
      message: formatReceiptMessage({
        requestId: row.id,
        payerName: row.payerName,
        payerNumber: row.payerNumber,
        planType: row.planType,
        amountLabel: row.amountLabel,
        role: row.role,
        status: "pending",
      }),
      type: "payment_receipt",
      data: { paymentRequestId: row.id, status: "pending" },
    },
  }).catch(() => null);

  return json({ request: row, platformCode: PLATFORM_MOMO_CODE }, 201);
});
