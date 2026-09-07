/**
 * Task-specific context — prefer profile report + daily report, not full DB dump.
 */
import { getProfileReport } from "@/lib/profile-report";

export async function buildAthleteContext(userId: string, extra?: string): Promise<string> {
  const report = await getProfileReport(userId).catch(() => "No profile report.");
  return [report, extra].filter(Boolean).join("\n\n");
}
