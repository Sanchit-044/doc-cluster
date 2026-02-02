import { redisClient } from "../../config/redis";
import bcrypt from "bcrypt"
export const verifyOtp = async (
  email: string,
  purpose: string,
  otp: string
): Promise<boolean> => {
  email = email.toLowerCase();
  const key = `otp:data:${purpose}:${email}`;

  const hashedOtp:any = await redisClient.get(key);
  if (!hashedOtp) return false;

  const isCorrect = await bcrypt.compare(otp, hashedOtp);
  if (isCorrect) await redisClient.del(key);

  return isCorrect;
};
