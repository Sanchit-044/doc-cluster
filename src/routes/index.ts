import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes";
import { redisClient } from "../config/redis";
import { prisma } from "../config/prisma";
import { combinedLimiter } from "../utils/limiter";

const router = Router();

//health check route
router.get("/health", async (_req: Request, res: Response) => {
  let redisStatus = "down";
  let dbStatus = "down";

  try {
    const pong = await redisClient.ping();
    if (pong === "PONG") redisStatus = "up";
  } catch {}

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "up";
  } catch {}

  res.status(200).json({
    success: true,
    status: "ok",
    services: {
      api: "up",
      redis: redisStatus,
      database: dbStatus,
    },
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", combinedLimiter, authRoutes);

export default router;
