import { prisma } from "../config/prisma";

export const generateUniqueUsername = async (base: string) => {
  let username = base.toLowerCase().replace(/[^a-z0-9_]/g, "");
  let counter = 0;

  while (true) {
    const exists = await prisma.user.findUnique({
      where: { username },
    });

    if (!exists) return username;

    counter++;
    username = `${base}_${counter}`;
  }
};
