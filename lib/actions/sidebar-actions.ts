"use server";

import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

export async function getBranchesForSidebar() {
  try {
    const branches = await prisma.branch.findMany({
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return branches;
  } catch (error) {
    console.error("Error fetching branches for sidebar:", error);
    return [];
  }
}
