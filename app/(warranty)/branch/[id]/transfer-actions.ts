"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Transfer a case from one branch to another
 */
export async function transferCaseToBranch(
  caseId: number,
  fromBranchId: number,
  toBranchId: number,
  transferredByStaffId?: number,
  reason?: string,
  notes?: string
): Promise<{ success: boolean; message: string; transferId?: number }> {
  try {
    // Validate that the case exists and belongs to fromBranch
    const warrantyCase = await prisma.warrantyCase.findFirst({
      where: {
        id: caseId,
        branchId: fromBranchId,
      },
      include: {
        originBranch: true,
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!warrantyCase) {
      return {
        success: false,
        message: "Case not found or does not belong to the specified branch",
      };
    }

    // Validate that toBranch exists
    const toBranch = await prisma.branch.findUnique({
      where: { id: toBranchId },
    });

    if (!toBranch) {
      return {
        success: false,
        message: "Destination branch not found",
      };
    }

    // Cannot transfer to the same branch
    if (fromBranchId === toBranchId) {
      return {
        success: false,
        message: "Cannot transfer case to the same branch",
      };
    }

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Set originBranchId if this is the first transfer
      const originBranchId =
        warrantyCase.originBranchId ?? warrantyCase.branchId;

      // Update the case's current branch
      await tx.warrantyCase.update({
        where: { id: caseId },
        data: {
          branchId: toBranchId,
          originBranchId,
          // Reset status to IN_QUEUE when transferred
          status: "IN_QUEUE",
        },
      });

      // Create transfer record
      const transfer = await tx.caseTransfer.create({
        data: {
          caseId,
          fromBranchId,
          toBranchId,
          transferredByStaffId,
          reason,
          notes,
          status: "COMPLETED", // Immediate transfer
          acceptedAt: new Date(),
          completedAt: new Date(),
        },
      });

      // Create history record
      await tx.warrantyHistory.create({
        data: {
          caseId,
          changeType: "UPDATE",
          changedByStaffId: transferredByStaffId,
          snapshotJson: JSON.stringify({
            action: "TRANSFER",
            fromBranch: fromBranchId,
            toBranch: toBranchId,
            reason,
          }),
        },
      });

      return transfer;
    });

    // Broadcast update to both branches
    const { sseManager } = await import("@/lib/utils/sse-manager");
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();

    if (userId) {
      // Notify from branch
      sseManager.broadcast(
        fromBranchId,
        {
          type: "case-transferred-out",
          data: { caseId, toBranchId, transferId: result.id },
        },
        userId
      );

      // Notify to branch
      sseManager.broadcast(
        toBranchId,
        {
          type: "case-transferred-in",
          data: { caseId, fromBranchId, transferId: result.id },
        },
        userId
      );
    }

    // Revalidate both branch pages
    revalidatePath(`/branch/${fromBranchId}`);
    revalidatePath(`/branch/${toBranchId}`);
    // Also revalidate settings page since it shows case counts per branch
    revalidatePath("/settings");

    return {
      success: true,
      message: `Case successfully transferred from ${warrantyCase.branch.name} to ${toBranch.name}`,
      transferId: result.id,
    };
  } catch (error) {
    console.error("Error transferring case:", error);
    return {
      success: false,
      message: "Failed to transfer case. Please try again.",
    };
  }
}

/**
 * Get transfer history for a specific case
 */
export async function getCaseTransferHistory(caseId: number) {
  try {
    const transfers = await prisma.caseTransfer.findMany({
      where: { caseId },
      include: {
        fromBranch: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        toBranch: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        transferredBy: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        transferredAt: "desc",
      },
    });

    return transfers;
  } catch (error) {
    console.error("Error fetching transfer history:", error);
    throw new Error("Failed to fetch transfer history");
  }
}

/**
 * Get all transfers for a specific branch (both incoming and outgoing)
 */
export async function getBranchTransfers(
  branchId: number,
  direction?: "incoming" | "outgoing"
) {
  try {
    const whereClause: any = {};

    if (direction === "incoming") {
      whereClause.toBranchId = branchId;
    } else if (direction === "outgoing") {
      whereClause.fromBranchId = branchId;
    } else {
      // Both directions
      whereClause.OR = [{ fromBranchId: branchId }, { toBranchId: branchId }];
    }

    const transfers = await prisma.caseTransfer.findMany({
      where: whereClause,
      include: {
        case: {
          select: {
            id: true,
            serviceNo: true,
            customerName: true,
            status: true,
          },
        },
        fromBranch: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        toBranch: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        transferredBy: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        transferredAt: "desc",
      },
    });

    return transfers;
  } catch (error) {
    console.error("Error fetching branch transfers:", error);
    throw new Error("Failed to fetch branch transfers");
  }
}

/**
 * Get transfer statistics for branches
 */
export async function getBranchTransferStats(branchId?: number) {
  try {
    // If branchId is provided, get stats for that branch only
    if (branchId) {
      const [sentCount, receivedCount, totalCases] = await Promise.all([
        prisma.caseTransfer.count({
          where: { fromBranchId: branchId },
        }),
        prisma.caseTransfer.count({
          where: { toBranchId: branchId },
        }),
        prisma.warrantyCase.count({
          where: { branchId },
        }),
      ]);

      // Get breakdown by destination branch
      const sentToBreakdown = await prisma.caseTransfer.groupBy({
        by: ["toBranchId"],
        where: { fromBranchId: branchId },
        _count: true,
      });

      // Get breakdown by source branch
      const receivedFromBreakdown = await prisma.caseTransfer.groupBy({
        by: ["fromBranchId"],
        where: { toBranchId: branchId },
        _count: true,
      });

      // Get branch names for breakdown
      const branchIds = [
        ...sentToBreakdown.map((b) => b.toBranchId),
        ...receivedFromBreakdown.map((b) => b.fromBranchId),
      ];
      const branches = await prisma.branch.findMany({
        where: { id: { in: branchIds } },
        select: { id: true, code: true, name: true },
      });

      const branchMap = new Map(branches.map((b) => [b.id, b]));

      return {
        branchId,
        totalCases,
        sent: {
          total: sentCount,
          breakdown: sentToBreakdown.map((item) => ({
            branch: branchMap.get(item.toBranchId),
            count: item._count,
          })),
        },
        received: {
          total: receivedCount,
          breakdown: receivedFromBreakdown.map((item) => ({
            branch: branchMap.get(item.fromBranchId),
            count: item._count,
          })),
        },
      };
    }

    // Get stats for all branches
    const branches = await prisma.branch.findMany({
      select: { id: true, code: true, name: true },
    });

    const stats = await Promise.all(
      branches.map(async (branch) => {
        const [sentCount, receivedCount, totalCases] = await Promise.all([
          prisma.caseTransfer.count({
            where: { fromBranchId: branch.id },
          }),
          prisma.caseTransfer.count({
            where: { toBranchId: branch.id },
          }),
          prisma.warrantyCase.count({
            where: { branchId: branch.id },
          }),
        ]);

        return {
          branch,
          totalCases,
          sentCount,
          receivedCount,
        };
      })
    );

    return stats;
  } catch (error) {
    console.error("Error fetching transfer statistics:", error);
    throw new Error("Failed to fetch transfer statistics");
  }
}

/**
 * Get all available branches for transfer (excluding current branch)
 */
export async function getAvailableTransferBranches(currentBranchId: number) {
  try {
    const branches = await prisma.branch.findMany({
      where: {
        id: { not: currentBranchId },
      },
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
    console.error("Error fetching available branches:", error);
    throw new Error("Failed to fetch available branches");
  }
}
