"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = exports.changePasswordSchema = exports.resetPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const customError_1 = require("../types/customError");
// Base schema with passthrough (allows extra fields)
const baseSchema = zod_1.z
    .object({
    username: zod_1.z.string().min(3, "Name should be more than 3 characters.").optional(),
    email: zod_1.z
        .string()
        .min(6, "Email must be at least 6 characters long.")
        .email("Invalid email format.")
        .optional(),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters long.")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
        .regex(/\d/, "Password must contain at least one number.")
        .regex(/[!@#$%^&*(),.?\":{}|<>]/, "Password must contain at least one special character.")
        .optional(),
    fullName: zod_1.z.string().min(3, "Full name must be more than 3 characters.").optional(),
    phoneNumber: zod_1.z.string().min(10, "Phone number must be at least 10 digits long.").optional(),
    DOB: zod_1.z.string().optional(),
})
    .passthrough(); // <-- FIX: allows extra fields
// Schemas for specific routes
exports.registerSchema = baseSchema.pick({
    username: true,
    email: true,
    password: true,
    fullName: true,
    phoneNumber: true,
    DOB: true,
});
exports.loginSchema = baseSchema.pick({
    email: true,
    password: true,
});
exports.resetPasswordSchema = baseSchema.pick({
    password: true,
});
exports.changePasswordSchema = zod_1.z.object({
    oldPassword: baseSchema.shape.password,
    newPassword: baseSchema.shape.password,
});
// Middleware to validate request
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            console.log("Here is the body", req.body);
            schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const firstError = error?.message;
                next(new customError_1.CustomError(firstError, 400));
            }
            else {
                next(new customError_1.CustomError("Validation failed", 400));
            }
        }
    };
};
exports.validateRequest = validateRequest;
