import express, { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ZodError } from "zod";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

import allRoutes from "./routes";
import { ApiError } from "./utils/ApiError";
import { connectDB } from "./config/prisma";
import { connectRedis, redisClient } from "./config/redis";

dotenv.config();

const app: Application = express();

//middlewares and cors settings
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, process.env.BASE_URL, process.env.ADMIN_URL],
    credentials: true,
  })
);

//proxy settings

app.set("trust proxy", 1);

app.use(express.json({ limit: "1gb" }));
app.use(express.urlencoded({ limit: "1gb", extended: true }));
app.use(cookieParser());


//api routes

app.use("/api", allRoutes);

//swagger docs setup
const swaggerDocument = YAML.load("./src/swagger.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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
