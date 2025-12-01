import { z } from "zod";

export const registerUserSchema = z.object({
  fullName: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name too large")
    .optional(),

  email: z
    .string()
    .email("Invalid email format")
    .min(5)
    .max(100)
    .transform((v) => v.toLowerCase().trim()),

  phoneNumber: z
    .string()
    .min(10, "Phone number must be 10 digits")
    .max(15)
    .optional(),

  username: z
    .string()
    .min(3, "Username must be at least 3 chars")
    .max(30)
    .transform((v) => v.toLowerCase().trim()),

  DOB: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "DOB must be YYYY-MM-DD")
    .optional(),

  password: z
    .string()
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/,
      "Password must be 8+ chars, 1 letter, 1 number, 1 special character"
    ),
});
