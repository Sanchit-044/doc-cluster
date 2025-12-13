import crypto from "crypto"
import { asyncHandler } from "../../utils/asyncHandler";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { hashPassword } from "../../utils/hash";
import { ApiResponse } from "../../utils/ApiResponse";









export const changePasswordViaLink = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  const reset = await prisma.resetLink.findFirst({
    where: { token: hashed },
  });

  if (!reset || reset.expiresAt < new Date())
    throw new ApiError(400, "Invalid or expired token");

  await prisma.user.update({
    where: { email: reset.email },
    data: { password: await hashPassword(newPassword) },
  });

  await prisma.resetLink.deleteMany({ where: { email: reset.email } });

  res.json(new ApiResponse(200, {}, "Password updated"));
});
