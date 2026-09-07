/**
 * Platform (owner) MoMo details — visible to athletes & coaches once set.
 * Defaults to 8787 until owner overrides in admin settings.
 */
import { prisma } from "@/lib/db";

export const DEFAULT_PLATFORM_MOMO_CODE = "8787";
export const DEFAULT_PLATFORM_MOMO_NAME = "Kotaana";

export type PlatformMomo = {
  code: string;
  name: string;
  instructions: string;
};

export async function getPlatformMomo(): Promise<PlatformMomo> {
  try {
    const rows = await prisma.appConfig.findMany({
      where: { key: { in: ["platform_momo_code", "platform_momo_name", "platform_momo_instructions"] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const code = map.platform_momo_code?.trim() || process.env.PLATFORM_MOMO_CODE || DEFAULT_PLATFORM_MOMO_CODE;
    const name = map.platform_momo_name?.trim() || process.env.PLATFORM_MOMO_NAME || DEFAULT_PLATFORM_MOMO_NAME;
    const instructions =
      map.platform_momo_instructions?.trim() ||
      `Send MoMo to code ${code} (${name}), then submit your number + name in the app for approval.`;
    return { code, name, instructions };
  } catch {
    return {
      code: process.env.PLATFORM_MOMO_CODE || DEFAULT_PLATFORM_MOMO_CODE,
      name: process.env.PLATFORM_MOMO_NAME || DEFAULT_PLATFORM_MOMO_NAME,
      instructions: `Send MoMo to ${DEFAULT_PLATFORM_MOMO_CODE}.`,
    };
  }
}

export async function setPlatformMomo(input: {
  code: string;
  name: string;
  instructions?: string;
}) {
  const pairs: [string, string][] = [
    ["platform_momo_code", input.code.replace(/\s+/g, "")],
    ["platform_momo_name", input.name.trim()],
  ];
  if (input.instructions != null) {
    pairs.push(["platform_momo_instructions", input.instructions.trim()]);
  }
  for (const [key, value] of pairs) {
    await prisma.appConfig.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
  return getPlatformMomo();
}
