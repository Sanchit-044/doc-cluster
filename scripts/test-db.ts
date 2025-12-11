import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    const res = await prisma.$queryRaw`SELECT 1 as result`;
    console.log("DB query result:", res);
  } catch (err) {
    console.error("DB connection/test query failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
