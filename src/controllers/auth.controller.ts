import { Request, Response } from "express";
import {
  registerService,
  loginService,
  refreshTokenService,
  changePasswordService,
} from "../services/auth.service";
import { registerUserSchema } from "../validations/auth.schema";
import { z } from "zod";



interface AuthRequest extends Request {
  user?:{
    _id:string
  }

}


export const registerController = async (req: Request, res: Response) => {
  try {
    console.log("her is ",req.body)
    const validated = registerUserSchema.parse(req.body);
    const result = await registerService(validated);
  
    console.log("Here is result after validation")
    if (result.error)
      return res.status(400).json({ success: false, message: result.error });

    return res.status(201).json({
      success: true,
      user: result.user,
      message: "Registration successful. Verify your email.",
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, errors: err.errors });
  }
};

export const loginController = async (req: Request, res: Response) => {
  const loginSchema = z.object({
    identifier: z.string().min(3),
    password: z.string(),
  });

  try {
    const { identifier, password } = loginSchema.parse(req.body);

    const result = await loginService(identifier, password);

    if (result.error)
      return res.status(400).json({ success: false, message: result.error });

    res
      .cookie("accessToken", result.accessToken)
      .cookie("refreshToken", result.refreshToken);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: result.user,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, errors: err.errors });
  }
};

export const refreshTokenController = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;

  if (!token)
    return res.status(400).json({ success: false, message: "Token missing" });

  const result = await refreshTokenService(token);

  if (result.error)
    return res.status(401).json({ success: false, message: result.error });

  res
    .cookie("accessToken", result.accessToken)
    .cookie("refreshToken", result.newRefreshToken)
    .json({ success: true, message: "Token refreshed" });
};

export const changePasswordController = async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    oldPassword: z.string(),
    newPassword: z.string(),
  });

  const { oldPassword, newPassword } = schema.parse(req.body);

  const userId = req?.user?._id as string;
  if (!userId)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  const result = await changePasswordService(userId, oldPassword, newPassword);

  if (result.error)
    return res.status(400).json({ success: false, message: result.error });

  return res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
};  