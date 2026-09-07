/**
 * Seed — NO demo accounts.
 * Optionally bootstraps a single app OWNER from env:
 *   OWNER_EMAIL / OWNER_PASSWORD / OWNER_NAME
 * If those are unset, seed does nothing (users register via athlete / coach / owner portals).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD;
  const name = process.env.OWNER_NAME?.trim() || "App Owner";

  if (!email || !password) {
    console.log("Seed: no demo data. Set OWNER_EMAIL + OWNER_PASSWORD to create the app owner account.");
    return;
  }

  if (password.length < 8) {
    throw new Error("OWNER_PASSWORD must be at least 8 characters");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "admin", passwordHash, name },
    create: {
      email,
      name,
      passwordHash,
      role: "admin",
    },
  });

  console.log(`Seed: app owner ready → ${user.email} (role=admin). Use /owner-auth to sign in.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
