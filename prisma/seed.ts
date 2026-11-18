import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

import { PrismaClient } from "@/generated/prisma/client";
import { hashPassword } from "@/helpers/password.helper";

config({ path: [".env.local", ".env"], quiet: true });

// Seed idempoten untuk branch Neon `dev`: akun admin awal (role admin) dari env.
// Jangan dijalankan ke branch `production`.

if (process.env.VERCEL_ENV === "production") {
  throw new Error("Refusing to seed a production environment");
}

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DIRECT_URL }) });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

async function seedAdmin() {
  const email = requireEnv("ADMIN_EMAIL").trim().toLowerCase();
  const passwordHash = await hashPassword(requireEnv("ADMIN_PASSWORD"));
  await prisma.user.upsert({
    where: { email },
    create: { email, name: "Admin", passwordHash, role: "admin", mustChangePassword: false },
    // Seed ulang mengembalikan akun ke kondisi awal (termasuk password).
    update: { passwordHash, role: "admin", status: "active", failedLoginAttempts: 0, lockUntil: null },
  });
  return email;
}

async function main() {
  const email = await seedAdmin();
  console.log(`Seeded admin account ${email}.`);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
