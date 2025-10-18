"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ============= BRANCH ACTIONS =============

export async function getAllBranches() {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            staff: true,
            cases: true,
          },
        },
      },
    });
    return branches;
  } catch (error) {
    console.error("Error fetching branches:", error);
    throw new Error("Failed to fetch branches");
  }
}

export async function getBranchesForSelect() {
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
    console.error("Error fetching branches for select:", error);
    throw new Error("Failed to fetch branches");
  }
}

export async function createBranch(data: {
  code: string;
  name: string;
  address?: string;
  officePhone?: string;
  whatsappPhone?: string;
}) {
  try {
    const branch = await prisma.branch.create({
      data: {
        code: data.code,
        name: data.name,
        address: data.address,
        officePhone: data.officePhone,
        whatsappPhone: data.whatsappPhone,
      },
      include: {
        _count: {
          select: {
            staff: true,
            cases: true,
          },
        },
      },
    });
    revalidatePath("/settings");
    revalidatePath("/", "layout"); // Revalidate sidebar
    return branch;
  } catch (error) {
    console.error("Error creating branch:", error);
    throw new Error("Failed to create branch");
  }
}

export async function updateBranch(
  id: number,
  data: {
    code?: string;
    name?: string;
    address?: string;
    officePhone?: string;
    whatsappPhone?: string;
  }
) {
  try {
    const branch = await prisma.branch.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            staff: true,
            cases: true,
          },
        },
      },
    });
    revalidatePath("/settings");
    revalidatePath("/", "layout"); // Revalidate sidebar
    return branch;
  } catch (error) {
    console.error("Error updating branch:", error);
    throw new Error("Failed to update branch");
  }
}

export async function deleteBranch(id: number) {
  try {
    await prisma.branch.delete({
      where: { id },
    });
    revalidatePath("/settings");
    revalidatePath("/", "layout"); // Revalidate sidebar
  } catch (error) {
    console.error("Error deleting branch:", error);
    throw new Error("Failed to delete branch. It may have associated data.");
  }
}

// ============= STAFF ACTIONS =============

export async function getAllStaff() {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        branches: {
          include: {
            branch: true,
          },
        },
        _count: {
          select: {
            receivedCases: true,
            servicedCases: true,
          },
        },
      },
    });
    return staff;
  } catch (error) {
    console.error("Error fetching staff:", error);
    throw new Error("Failed to fetch staff");
  }
}

export async function createStaff(data: {
  name: string;
  color?: string;
  branchIds: number[];
}) {
  try {
    const staff = await prisma.staff.create({
      data: {
        name: data.name,
        color: data.color,
        branches: {
          create: data.branchIds.map((branchId) => ({
            branchId,
          })),
        },
      },
      include: {
        branches: {
          include: {
            branch: true,
          },
        },
        _count: {
          select: {
            receivedCases: true,
            servicedCases: true,
          },
        },
      },
    });
    revalidatePath("/settings");
    return staff;
  } catch (error) {
    console.error("Error creating staff:", error);
    throw new Error("Failed to create staff");
  }
}

export async function updateStaff(
  id: number,
  data: {
    name?: string;
    color?: string;
    branchIds?: number[];
  }
) {
  try {
    // If branchIds are provided, update the associations
    if (data.branchIds !== undefined) {
      // Delete existing associations
      await prisma.staffOnBranch.deleteMany({
        where: { staffId: id },
      });

      // Create new associations
      await prisma.staffOnBranch.createMany({
        data: data.branchIds.map((branchId) => ({
          staffId: id,
          branchId,
        })),
      });
    }

    // Update staff info
    const staff = await prisma.staff.update({
      where: { id },
      data: {
        name: data.name,
        color: data.color,
      },
      include: {
        branches: {
          include: {
            branch: true,
          },
        },
        _count: {
          select: {
            receivedCases: true,
            servicedCases: true,
          },
        },
      },
    });

    revalidatePath("/settings");
    return staff;
  } catch (error) {
    console.error("Error updating staff:", error);
    throw new Error("Failed to update staff");
  }
}

export async function deleteStaff(id: number) {
  try {
    await prisma.staff.delete({
      where: { id },
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error deleting staff:", error);
    throw new Error(
      "Failed to delete staff. They may be assigned to warranty cases."
    );
  }
}

// ============= CASE SCOPE ACTIONS =============

export async function getAllCaseScopes() {
  try {
    const caseScopes = await prisma.caseScope.findMany({
      orderBy: {
        code: "asc",
      },
      include: {
        _count: {
          select: {
            cases: true,
          },
        },
      },
    });
    return caseScopes;
  } catch (error) {
    console.error("Error fetching case scopes:", error);
    throw new Error("Failed to fetch case scopes");
  }
}

export async function createCaseScope(data: { code: string }) {
  try {
    const caseScope = await prisma.caseScope.create({
      data: {
        code: data.code,
      },
      include: {
        _count: {
          select: {
            cases: true,
          },
        },
      },
    });
    revalidatePath("/settings");
    return caseScope;
  } catch (error) {
    console.error("Error creating case scope:", error);
    throw new Error("Failed to create case scope");
  }
}

export async function updateCaseScope(id: number, data: { code?: string }) {
  try {
    const caseScope = await prisma.caseScope.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            cases: true,
          },
        },
      },
    });
    revalidatePath("/settings");
    return caseScope;
  } catch (error) {
    console.error("Error updating case scope:", error);
    throw new Error("Failed to update case scope");
  }
}

export async function deleteCaseScope(id: number) {
  try {
    await prisma.caseScope.delete({
      where: { id },
    });
    revalidatePath("/settings");
  } catch (error) {
    console.error("Error deleting case scope:", error);
    throw new Error(
      "Failed to delete case scope. It may have associated data."
    );
  }
}
