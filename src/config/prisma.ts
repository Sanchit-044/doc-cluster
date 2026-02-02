import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("PostgreSQL connected");
  } catch (error) {
    console.error("Unable to connect PostgreSQL", error);
    process.exit(1);
  }
};
