import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { LegalGate } from "@/components/LegalGate";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/owner-auth?callbackUrl=/admin");
  if (session.user.role !== "admin") {
    redirect(session.user.role === "coach" ? "/coach" : "/app");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { fullName: true, tosAccepted: true, medicalDisclaimerAccepted: true },
  });

  // Owners accept the same terms as everyone else before reaching platform data.
  if (!profile?.tosAccepted || !profile?.medicalDisclaimerAccepted) {
    return <LegalGate />;
  }

  return (
    <OwnerShell name={profile?.fullName || session.user.name || "Owner"}>
      {children}
    </OwnerShell>
  );
}
