import { PLATFORM_MOMO_CODE } from "./momo";

export type ReceiptInput = {
  requestId: string;
  payerName: string;
  payerNumber: string;
  planType: string;
  amountLabel?: string | null;
  role: string;
  status: "pending" | "approved" | "rejected";
  approvedAt?: Date | string;
};

export function formatReceiptMessage(r: ReceiptInput): string {
  const lines = [
    "——— Kotaana MoMo receipt ———",
    `Status: ${r.status.toUpperCase()}`,
    `Ref: ${r.requestId.slice(0, 8).toUpperCase()}`,
    `Plan: ${r.planType}${r.amountLabel ? ` (${r.amountLabel})` : ""}`,
    `Payer: ${r.payerName}`,
    `MoMo: ${r.payerNumber}`,
    `Paid to: ${PLATFORM_MOMO_CODE}`,
    `Role: ${r.role}`,
  ];
  if (r.status === "approved" && r.approvedAt) {
    lines.push(`Approved: ${new Date(r.approvedAt).toLocaleString()}`);
    lines.push("Access: ACTIVE — your plan is unlocked.");
  }
  if (r.status === "pending") {
    lines.push("Waiting for owner/coach approval after your MoMo transfer.");
  }
  if (r.status === "rejected") {
    lines.push("This request was not approved. Contact support or resubmit.");
  }
  lines.push("——————————————————");
  return lines.join("\n");
}

export function formatReceiptTitle(status: string): string {
  if (status === "approved") return "MoMo payment approved — receipt";
  if (status === "rejected") return "MoMo payment rejected";
  return "MoMo payment pending";
}
