"use server";

import prisma from "@/lib/prisma";
import {
  WarrantyCaseUpdate,
  WarrantyCaseWithRelations,
} from "@/lib/types/warranty";
import {
  generateServiceNumber,
  getNextSequenceNumber,
} from "@/lib/utils/service-number";
import { revalidatePath } from "next/cache";

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

export async function getBranch(branchId: number) {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    return branch;
  } catch (error) {
    console.error("Error fetching branch details:", error);
    throw new Error("Failed to fetch branch details");
  }
}

/**
 * Generates the next service number for a branch
 * Format: W[CODE][YYMM][###]
 * @param branchId - The branch ID to generate service number for
 * @returns The next service number in the format W[CODE][YYMM][###]
 */
export async function generateNextServiceNumber(
  branchId: number
): Promise<string> {
  try {
    // Get the branch to get its code
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { code: true },
    });

    if (!branch) {
      throw new Error("Branch not found");
    }

    // Get all service numbers for this branch
    const cases = await prisma.warrantyCase.findMany({
      where: { branchId },
      select: { serviceNo: true },
    });

    const existingServiceNumbers = cases.map((c) => c.serviceNo);

    // Get the next sequence number for current month
    const nextSequence = getNextSequenceNumber(
      existingServiceNumbers,
      branch.code
    );

    // Generate the service number
    return generateServiceNumber(branch.code, nextSequence);
  } catch (error) {
    console.error("Error generating next service number:", error);
    throw new Error("Failed to generate next service number");
  }
}

export async function createWarrantyCase(
  branchId: number,
  data: {
    customerName: string;
    customerContact?: string;
    customerEmail?: string;
    address?: string;
    purchaseDate?: string;
    invoice?: string;
    receivedItems?: string;
    pin?: string;
    issues?: string;
    receivedByStaffId?: number;
    locker?: number;
    idtPc?: boolean;
  }
): Promise<WarrantyCaseWithRelations> {
  try {
    // Validate required fields
    if (!data.customerName) {
      throw new Error("Customer name is required");
    }

    // Generate the next service number automatically
    const serviceNo = await generateNextServiceNumber(branchId);

    // Get default scope (you might want to make this configurable)
    const defaultScope = await prisma.caseScope.findFirst({
      orderBy: { id: "asc" },
    });

    if (!defaultScope) {
      throw new Error("No scope found. Please set up scopes first.");
    }

    // Create the warranty case
    const newCase = await prisma.warrantyCase.create({
      data: {
        serviceNo,
        branchId,
        scopeId: defaultScope.id,
        customerName: data.customerName,
        customerContact: data.customerContact || null,
        customerEmail: data.customerEmail || null,
        address: data.address || null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        invoice: data.invoice || null,
        receivedItems: data.receivedItems || null,
        pin: data.pin || null,
        issues: data.issues || null,
        receivedByStaffId: data.receivedByStaffId || null,
        locker: data.locker || null,
        idtPc: data.idtPc ?? null,
        status: "IN_QUEUE",
        cost: 0,
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
    });

    // Create history entry
    await createWarrantyHistory(newCase.id, "INSERT");

    // Revalidate the page to reflect changes
    revalidatePath(`/branch/${branchId}`);

    // Convert Decimal to number for serialization
    return {
      ...newCase,
      cost: Number(newCase.cost),
    } as WarrantyCaseWithRelations;
  } catch (error: any) {
    console.error("Error creating warranty case:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      throw new Error(
        "A warranty case with this service number already exists in this branch and scope"
      );
    }

    throw new Error(error.message || "Failed to create warranty case");
  }
}
