/**
 * POST — owner (admin) or coach approves/rejects pending MoMo payment.
 * GET — list pending for approver role.
 * On approve: activate subscription + send receipt notification.
 */
import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { prisma } from "@/lib/db";
import { planById } from "@/lib/payments/momo";
import { formatReceiptMessage, formatReceiptTitle } from "@/lib/payments/receipt";

const schema = z.object({
  paymentRequestId: z.string(),
  action: z.enum(["approve", "reject"]),
  note: z.string().max(300).optional(),
});

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const body = schema.parse(await req.json());
  const row = await prisma.paymentRequest.findUnique({ where: { id: body.paymentRequestId } });
  if (!row) return json({ error: "Not found" }, 404);
  if (row.status !== "pending") return json({ error: "Already processed" }, 400);

  const isAdmin = me.role === "admin";
  const isCoach = me.role === "coach";
  if (!isAdmin && !isCoach) return json({ error: "Forbidden" }, 403);

  if (isCoach && !isAdmin) {
    if (row.role !== "athlete") return json({ error: "Coaches can only approve athlete payments" }, 403);
    const rel = await prisma.coachAthleteRelation.findFirst({
      where: { coachId: me.id, athleteId: row.userId, status: "active" },
    });
    if (!rel) return json({ error: "You do not manage this athlete" }, 403);
  }

  if (body.action === "reject") {
    const updated = await prisma.paymentRequest.update({
      where: { id: row.id },
      data: { status: "rejected", approvedById: me.id, note: body.note || row.note },
    });
    await prisma.notification.create({
      data: {
        userId: row.userId,
        title: formatReceiptTitle("rejected"),
        message: formatReceiptMessage({
          requestId: updated.id,
          payerName: updated.payerName,
          payerNumber: updated.payerNumber,
          planType: updated.planType,
          amountLabel: updated.amountLabel,
          role: updated.role,
          status: "rejected",
        }),
        type: "payment_receipt",
        data: { paymentRequestId: updated.id, status: "rejected" },
      },
    }).catch(() => null);
    return json({ request: updated });
  }

  const plan = planById(row.planType);
  const updated = await prisma.paymentRequest.update({
    where: { id: row.id },
    data: { status: "approved", approvedById: me.id, note: body.note || row.note },
  });

  await prisma.subscription.upsert({
    where: { userId: row.userId },
    create: {
      userId: row.userId,
      planType: row.planType,
      status: "active",
      coversAthletes: row.role === "coach",
      seatLimit: plan?.seatLimit ?? null,
    },
    update: {
      planType: row.planType,
      status: "active",
      coversAthletes: row.role === "coach",
      seatLimit: plan?.seatLimit ?? null,
    },
  });

  const receipt = formatReceiptMessage({
    requestId: updated.id,
    payerName: updated.payerName,
    payerNumber: updated.payerNumber,
    planType: updated.planType,
    amountLabel: updated.amountLabel,
    role: updated.role,
    status: "approved",
    approvedAt: new Date(),
  });

  await prisma.notification.create({
    data: {
      userId: row.userId,
      title: formatReceiptTitle("approved"),
      message: receipt,
      type: "payment_receipt",
      data: {
        paymentRequestId: updated.id,
        status: "approved",
        planType: updated.planType,
        amountLabel: updated.amountLabel,
        payToCode: updated.payToCode,
      },
    },
  }).catch(() => null);

  return json({ request: updated, subscription: "active", receipt });
});

export const GET = route(async () => {
  const me = await requireUser();
  if (me.role === "admin") {
    const [pending, recent] = await Promise.all([
      prisma.paymentRequest.findMany({ where: { status: "pending" }, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.paymentRequest.findMany({
        where: { status: { in: ["approved", "rejected"] } },
        orderBy: { updatedAt: "desc" },
        take: 30,
      }),
    ]);
    return json({ pending, recent });
  }
  if (me.role === "coach") {
    const rels = await prisma.coachAthleteRelation.findMany({
      where: { coachId: me.id, status: "active" },
      select: { athleteId: true },
    });
    const ids = rels.map((r) => r.athleteId);
    const [pending, recent] = await Promise.all([
      prisma.paymentRequest.findMany({
        where: { status: "pending", role: "athlete", userId: { in: ids } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.paymentRequest.findMany({
        where: { status: { in: ["approved", "rejected"] }, role: "athlete", userId: { in: ids } },
        orderBy: { updatedAt: "desc" },
        take: 30,
      }),
    ]);
    return json({ pending, recent });
  }
  return json({ error: "Forbidden" }, 403);
});
