import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
dotenv.config();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);
async function main() {
  // Rename sarah@acme.com display name to Melissa Chen
  const r1 = await prisma.user.updateMany({
    where: { email: "sarah@acme.com" },
    data: { name: "Melissa Chen" },
  });
  console.log("Renamed sarah@acme.com →", r1.count);

  // Also fix the duplicate melissa@acme.com that got created
  const r2 = await prisma.user.updateMany({
    where: { email: "melissa@acme.com" },
    data: { name: "Melissa Chen" },
  });
  console.log("Updated melissa@acme.com →", r2.count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
