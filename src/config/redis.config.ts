import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err: Error) =>
  console.error("Redis Client Error", err)
);

await redisClient.connect();

const checkRedisConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pong = await redisClient.ping();
    if (pong !== "PONG") {
      throw new ApiError(
        500,
        "Redis is not responding. Please try again later."
      );
    }
    next();
  } catch (error) {
    console.error(" Redis check failed:", error);
    throw new ApiError(500, "Redis connection error. Please try again later.");
  }
};

export { redisClient, checkRedisConnection };
