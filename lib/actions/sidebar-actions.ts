"use server";

import prisma from "../prisma";

export async function getBranchesForSidebar() {
  try {
    const branches = await prisma.branch.findMany({
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: {
        id: "asc",
      },
    });
    return branches;
  } catch (error) {
    console.error("Error fetching branches for sidebar:", error);
    return [];
  }
}
