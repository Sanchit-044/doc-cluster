import { Router } from "express";
import {  registerController, loginController } from "../controllers/auth.controller";
import { validateRequest } from "../middlewares/validate";
import { registerSchema,loginSchema } from "../middlewares/validate";
import loginUser from "../controllers/auth/login.controller";
import registerUser from "../controllers/auth/register";
import { registerOtp } from "../middlewares/otp";

const router = Router();


router.post('/register', validateRequest(registerSchema),registerOtp, registerUser);
router.post('/login', validateRequest(loginSchema), loginUser);

export default router;
