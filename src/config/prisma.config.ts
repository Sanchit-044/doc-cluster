import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

export const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"]
});

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to PostgreSQL database");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};
