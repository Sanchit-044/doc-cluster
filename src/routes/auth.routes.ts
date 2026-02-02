import { Router } from "express";
import { loginUser } from "../controllers/auth/login.controller";
import { registerUser } from "../controllers/auth/register";
import { sendOTP } from "../controllers/verification/sendOtp.controller";
import { checkOtp } from "../controllers/verification/checkOtp.controller";
import { verifyEmail } from "../controllers/auth/verifyRegisterEmail";
import { resetPasswordWithOtp } from "../controllers/auth/resetPassword";


import {
  startGoogleOauth,
  googleOauthCallback,
  startGithubOauth,
  githubOauthCallback,
  generateTokens,
} from "../controllers/auth/oauth";

const router = Router();

router.post("/login", loginUser);
router.post("/register", registerUser);

router.post("/sendOtp/:purpose", sendOTP);
router.post("/verifyEmail", verifyEmail);
router.post("/verifyOtp", checkOtp);

router.post("/reset-password", resetPasswordWithOtp);

router.get("/google", startGoogleOauth);
router.get("/google/callback", googleOauthCallback);

router.get("/github", startGithubOauth);
router.get("/github/callback", githubOauthCallback);

router.post("/oauth/token", generateTokens);

export default router;
