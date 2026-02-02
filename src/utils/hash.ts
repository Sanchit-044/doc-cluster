import bcrypt from "bcrypt";

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};
export const verifyPassword = async (password: string, hash: string) =>
  bcrypt.compare(password, hash);