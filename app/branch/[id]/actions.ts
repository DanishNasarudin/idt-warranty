"use server";

import { PrismaClient } from "@/lib/generated/prisma";
import {
  WarrantyCaseUpdate,
  WarrantyCaseWithRelations,
} from "@/lib/types/warranty";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function getWarrantyCasesByBranch(
  branchId: number
): Promise<WarrantyCaseWithRelations[]> {
  try {
    const cases = await prisma.warrantyCase.findMany({
      where: {
        branchId,
      },
      include: {
        receivedBy: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        servicedBy: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        branch: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        scope: {
          select: {
            id: true,
            code: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    // Convert Decimal to number for serialization
    return cases.map((c) => ({
      ...c,
      cost: Number(c.cost),
    })) as WarrantyCaseWithRelations[];
  } catch (error) {
    console.error("Error fetching warranty cases:", error);
    throw new Error("Failed to fetch warranty cases");
  }
}

export async function getStaffByBranch(branchId: number) {
  try {
    const staffOnBranch = await prisma.staffOnBranch.findMany({
      where: {
        branchId,
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return staffOnBranch.map((s) => s.staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    throw new Error("Failed to fetch staff");
  }
}

export async function updateWarrantyCase(
  caseId: number,
  branchId: number,
  updates: WarrantyCaseUpdate
): Promise<void> {
  try {
    // Prepare the data for Prisma update
    const updateData: any = { ...updates };

    // Remove relation fields that shouldn't be updated directly
    delete updateData.receivedBy;
    delete updateData.servicedBy;
    delete updateData.branch;
    delete updateData.scope;

    await prisma.warrantyCase.update({
      where: {
        id: caseId,
      },
      data: updateData,
    });

    // Revalidate the page to reflect changes
    revalidatePath(`/branch/${branchId}`);

    // TODO: Emit socket.io event here for real-time updates
    // Example: socketServer.to(`branch-${branchId}`).emit('caseUpdated', { caseId, updates });
  } catch (error) {
    console.error("Error updating warranty case:", error);
    throw new Error("Failed to update warranty case");
  }
}

export async function createWarrantyHistory(
  caseId: number,
  changeType: "INSERT" | "UPDATE" | "DELETE",
  changedByStaffId?: number,
  snapshotJson?: string
): Promise<void> {
  try {
    await prisma.warrantyHistory.create({
      data: {
        caseId,
        changeType,
        changedByStaffId,
        snapshotJson,
      },
    });
  } catch (error) {
    console.error("Error creating warranty history:", error);
    throw new Error("Failed to create warranty history");
  }
}
