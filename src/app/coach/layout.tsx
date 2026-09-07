import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CoachShell } from "@/components/coach/CoachShell";
import { LegalGate } from "@/components/LegalGate";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/coach-auth?callbackUrl=/coach");
  // Roles stay in their own area — owners belong in /admin, athletes in /app.
  if (session.user.role !== "coach") {
    redirect(session.user.role === "admin" ? "/admin" : "/app");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { fullName: true, tosAccepted: true, medicalDisclaimerAccepted: true },
  });

  if (!profile?.tosAccepted || !profile?.medicalDisclaimerAccepted) {
    return <LegalGate />;
  }

  return (
    <CoachShell coachName={profile?.fullName || session.user.name || "Coach"}>
      {children}
    </CoachShell>
  );
}
