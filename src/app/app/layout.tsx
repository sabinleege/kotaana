import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { AthleteShell } from "@/components/athlete/AthleteShell";
import { LegalGate } from "@/components/LegalGate";
import { Onboarding } from "@/components/athlete/Onboarding";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth?callbackUrl=/app");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { fullName: true, tosAccepted: true, medicalDisclaimerAccepted: true, onboardingCompleted: true },
  });
  const name = profile?.fullName || session.user.name || "Athlete";

  if (!profile?.tosAccepted || !profile?.medicalDisclaimerAccepted) {
    return <LegalGate />;
  }
  if (!profile?.onboardingCompleted) {
    return <Onboarding name={name} />;
  }

  return <AthleteShell name={name}>{children}</AthleteShell>;
}
