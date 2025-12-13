import express, { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ZodError } from "zod";

import allRoutes from "./routes";
import { ApiError } from "./utils/ApiError";
import { connectDB } from "./config/prisma";
import { connectRedis, redisClient } from "./config/redis";

dotenv.config();

const app: Application = express();

//middlewares and cors settings
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

//proxy settings

app.set("trust proxy", 1);

app.use(express.json({ limit: "1gb" }));
app.use(express.urlencoded({ limit: "1gb", extended: true }));
app.use(cookieParser());

//health check route
app.get("/health", async (_req: Request, res: Response) => {
  let redisStatus = "down";

  try {
    const pong = await redisClient.ping();
    if (pong === "PONG") redisStatus = "up";
  } catch {}

  res.status(200).json({
    success: true,
    status: "ok",
    services: {
      api: "up",
      redis: redisStatus,
      database: "up",
    },
    timestamp: new Date().toISOString(),
  });
});

//api routes

app.use("/api", allRoutes);

//error handlers
app.use(
  (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
  ): Response => {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: err.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    if (err instanceof ApiError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        errors: err.errors ?? [],
      });
    }

    return res.status(500).json({
      success: false,
      message:
        err instanceof Error ? err.message : "Internal Server Error",
      errors: [],
      stack:
        process.env.NODE_ENV === "development" && err instanceof Error
          ? err.stack
          : undefined,
    });
  }
);

//for server port
const PORT = Number(process.env.PORT) || 3000;

const startServer = async () => {
  await connectDB();
  await connectRedis();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
