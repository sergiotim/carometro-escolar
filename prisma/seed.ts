import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/lib/auth/password";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run seed.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

async function main() {
  const passwordHash = await hashPassword("demo123");

  await prisma.user.upsert({
    where: { email: "demo@escola.com" },
    update: {
      passwordHash,
      active: true,
    },
    create: {
      email: "demo@escola.com",
      passwordHash,
      active: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
