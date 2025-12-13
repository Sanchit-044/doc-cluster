import { z, ZodSchema } from "zod";
import { NextFunction, Request, Response } from "express";
import { CustomError } from "../types/customError";

// Base schema with passthrough (allows extra fields)
const baseSchema = z
  .object({
    username: z.string().min(3, "Name should be more than 3 characters.").optional(),

    email: z
      .string()
      .min(6, "Email must be at least 6 characters long.")
      .email("Invalid email format.")
      .optional(),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/\d/, "Password must contain at least one number.")
      .regex(/[!@#$%^&*(),.?\":{}|<>]/, "Password must contain at least one special character.")
      .optional(),

    fullName: z.string().min(3, "Full name must be more than 3 characters.").optional(),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits long.").optional(),
    DOB: z.string().optional(),
  })
  .passthrough();

// Schemas for specific routes



export const sendOTPSchema = z.object({
  email: z.string().email().optional(),
});

export const checkOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(1),
  purpose: z.string().min(1),
});










export const registerSchema = baseSchema.pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
  phoneNumber: true,
  DOB: true,
});

export const loginSchema = baseSchema.pick({
  email: true,
  password: true,
});

export const resetPasswordSchema = baseSchema.pick({
  password: true,
});

export const changePasswordSchema = z.object({
  oldPassword: baseSchema.shape.password,
  newPassword: baseSchema.shape.password,
});

// Middleware to validate request
export const validateRequest = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Here is the body", req.body);

      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error?.message;
        next(new CustomError(firstError, 400));
      } else {
        next(new CustomError("Validation failed", 400));
      }
    }
  };
};
