import { Router } from "express";
import { loginUser } from "../controllers/auth/login.controller";
import { registerUser } from "../controllers/auth/register";
import { sendOTP } from "../controllers/verification/sendOtp.controller";
import { checkOtp } from "../controllers/verification/checkOtp.controller";
import { verifyEmail } from "../controllers/auth/verifyRegisterEmail";



const router = Router();





router.post("/login",loginUser)
router.post("/register",registerUser)
router.post("/sendOtp/:purpose",sendOTP);
router.post("/verifyEmail",verifyEmail);
router.post("/verifyOtp",checkOtp)


export default router;