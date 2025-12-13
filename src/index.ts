import express, {
  Application,
  Request,
  Response,
  NextFunction,
} from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ZodError } from "zod";

import allRoutes from "./routes";
import { ApiError } from "./utils/ApiError";

dotenv.config();

const app: Application = express();

/* -------------------- Core Middleware -------------------- */

app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "1gb" }));
app.use(express.urlencoded({ limit: "1gb", extended: true }));
app.use(cookieParser());

/* -------------------- Routes -------------------- */

app.use("/api", allRoutes);

/* -------------------- Error Handler -------------------- */

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

    const statusCode =
      err instanceof Error && "statusCode" in err
        ? (err as any).statusCode
        : 500;

    return res.status(statusCode).json({
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


const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
