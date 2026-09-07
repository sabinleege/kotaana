/**
 * Medical document AI — OCR text (if provided) + summary → profile memory hints.
 * Not a diagnostic system — coaching adaptations only.
 */
import { prisma } from "@/lib/db";
import { generateText } from "@/lib/ai";
import { invalidateProfileReport } from "@/lib/profile-report";

export async function analyzeMedicalDocument(opts: {
  userId: string;
  docType: string;
  title?: string;
  fileUrl: string;
  ocrText?: string;
}) {
  const base = opts.ocrText?.slice(0, 6000) || `Document type ${opts.docType} uploaded. No OCR text provided — summarize limitations only.`;
  let aiSummary: string;
  try {
    aiSummary = await generateText(
      `Summarize this medical document for a fitness coach (NOT a diagnosis). Extract: relevant findings, exercise precautions, nutrition notes.\n\n${base}`,
      "You assist fitness coaching. Never diagnose. Recommend clinician follow-up when appropriate.",
    );
  } catch {
    aiSummary = "Document stored. AI summary unavailable — coach/athlete should review with clinician.";
  }

  const findings = {
    precautions: [] as string[],
    rawLength: base.length,
  };

  const doc = await prisma.medicalDocument.create({
    data: {
      userId: opts.userId,
      docType: opts.docType,
      title: opts.title || opts.docType,
      fileUrl: opts.fileUrl,
      ocrText: opts.ocrText,
      aiSummary,
      findings,
    },
  });

  await invalidateProfileReport(opts.userId);
  return doc;
}
