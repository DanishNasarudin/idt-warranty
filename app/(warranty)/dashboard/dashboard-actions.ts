"use server";

import { CaseStatus } from "@/lib/generated/prisma";
import prisma from "@/lib/prisma";
import { DateRangeFilter } from "@/lib/types/search-params";
import { getDateRange } from "@/lib/utils/date-range";

type DateFilter = {
  gte?: Date;
  lte?: Date;
};

/**
 * Build date filter for Prisma queries
 */
function buildDateFilter(dateRange: DateRangeFilter): DateFilter | undefined {
  const { startDate, endDate } = getDateRange(dateRange);

  if (!startDate && !endDate) {
    return undefined;
  }

  const filter: DateFilter = {};
  if (startDate) filter.gte = startDate;
  if (endDate) filter.lte = endDate;

  return filter;
}

/**
 * Get staff service metrics - how many COMPLETED cases each staff member has serviced
 */
export async function getStaffServiceMetrics(dateRange: DateRangeFilter) {
  try {
    const dateFilter = buildDateFilter(dateRange);

    const staffMetrics = await prisma.staff.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        branches: {
          select: {
            branch: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Get completed cases count for each staff member
    const staffWithCompletedCounts = await Promise.all(
      staffMetrics.map(async (staff) => {
        const completedCount = await prisma.warrantyCase.count({
          where: {
            servicedByStaffId: staff.id,
            status: CaseStatus.COMPLETED,
            createdAt: dateFilter,
          },
        });

        return {
          id: staff.id,
          name: staff.name,
          color: staff.color,
          servicedCount: completedCount,
          branches: staff.branches.map((sb) => sb.branch),
        };
      })
    );

    // Sort by completed count descending
    return staffWithCompletedCounts.sort(
      (a, b) => b.servicedCount - a.servicedCount
    );
  } catch (error) {
    console.error("Error fetching staff metrics:", error);
    throw new Error("Failed to fetch staff service metrics");
  }
}

/**
 * Get status count for each branch
 */
export async function getBranchStatusCounts(dateRange: DateRangeFilter) {
  try {
    const dateFilter = buildDateFilter(dateRange);

    const branches = await prisma.branch.findMany({
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: {
        code: "asc",
      },
    });

    const branchStats = await Promise.all(
      branches.map(async (branch) => {
        const statusCounts = await prisma.warrantyCase.groupBy({
          by: ["status"],
          where: {
            branchId: branch.id,
            createdAt: dateFilter,
          },
          _count: true,
        });

        const countMap: Record<CaseStatus, number> = {
          IN_QUEUE: 0,
          IN_PROGRESS: 0,
          WAITING_FOR: 0,
          COMPLETED: 0,
        };

        statusCounts.forEach((item) => {
          countMap[item.status] = item._count;
        });

        const total = Object.values(countMap).reduce(
          (sum, count) => sum + count,
          0
        );

        return {
          branch,
          statusCounts: countMap,
          total,
        };
      })
    );

    return branchStats;
  } catch (error) {
    console.error("Error fetching branch status counts:", error);
    throw new Error("Failed to fetch branch status counts");
  }
}

/**
 * Get transfer statistics for each branch
 */
export async function getAllBranchTransferStats(dateRange: DateRangeFilter) {
  try {
    const dateFilter = buildDateFilter(dateRange);

    const branches = await prisma.branch.findMany({
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: {
        code: "asc",
      },
    });

    const transferStats = await Promise.all(
      branches.map(async (branch) => {
        const [sentCount, receivedCount] = await Promise.all([
          prisma.caseTransfer.count({
            where: {
              fromBranchId: branch.id,
              createdAt: dateFilter,
            },
          }),
          prisma.caseTransfer.count({
            where: {
              toBranchId: branch.id,
              createdAt: dateFilter,
            },
          }),
        ]);

        // Get breakdown by destination branch (sent to)
        const sentToBreakdown = await prisma.caseTransfer.groupBy({
          by: ["toBranchId"],
          where: {
            fromBranchId: branch.id,
            createdAt: dateFilter,
          },
          _count: true,
        });

        // Get breakdown by source branch (received from)
        const receivedFromBreakdown = await prisma.caseTransfer.groupBy({
          by: ["fromBranchId"],
          where: {
            toBranchId: branch.id,
            createdAt: dateFilter,
          },
          _count: true,
        });

        return {
          branch,
          sent: {
            total: sentCount,
            breakdown: sentToBreakdown,
          },
          received: {
            total: receivedCount,
            breakdown: receivedFromBreakdown,
          },
        };
      })
    );

    // Get all branch names for breakdown mapping
    const allBranches = await prisma.branch.findMany({
      select: { id: true, code: true, name: true },
    });
    const branchMap = new Map(allBranches.map((b) => [b.id, b]));

    // Enrich transfer stats with branch names
    return transferStats.map((stat) => ({
      ...stat,
      sent: {
        total: stat.sent.total,
        breakdown: stat.sent.breakdown.map((item) => ({
          branch: branchMap.get(item.toBranchId),
          count: item._count,
        })),
      },
      received: {
        total: stat.received.total,
        breakdown: stat.received.breakdown.map((item) => ({
          branch: branchMap.get(item.fromBranchId),
          count: item._count,
        })),
      },
    }));
  } catch (error) {
    console.error("Error fetching transfer stats:", error);
    throw new Error("Failed to fetch branch transfer statistics");
  }
}

/**
 * Get staff performance metrics broken down by branch
 */
export async function getStaffPerformanceByBranch(dateRange: DateRangeFilter) {
  try {
    const dateFilter = buildDateFilter(dateRange);

    const branches = await prisma.branch.findMany({
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: {
        code: "asc",
      },
    });

    const branchPerformance = await Promise.all(
      branches.map(async (branch) => {
        // Get all staff members assigned to this branch
        const staffInBranch = await prisma.staffOnBranch.findMany({
          where: {
            branchId: branch.id,
          },
          select: {
            staff: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        });

        // Get completed cases count for each staff member in this branch
        const staffMetrics = await Promise.all(
          staffInBranch.map(async (staffBranch) => {
            const completedCount = await prisma.warrantyCase.count({
              where: {
                servicedByStaffId: staffBranch.staff.id,
                branchId: branch.id,
                status: CaseStatus.COMPLETED,
                createdAt: dateFilter,
              },
            });

            return {
              id: staffBranch.staff.id,
              name: staffBranch.staff.name,
              color: staffBranch.staff.color,
              servicedCount: completedCount,
            };
          })
        );

        // Sort by serviced count and get top performer
        const sortedStaff = staffMetrics.sort(
          (a, b) => b.servicedCount - a.servicedCount
        );

        const topPerformer = sortedStaff[0] || null;
        const totalServices = staffMetrics.reduce(
          (sum, s) => sum + s.servicedCount,
          0
        );

        return {
          branch,
          topPerformer,
          totalServices,
          staffCount: staffMetrics.length,
          allStaff: sortedStaff,
        };
      })
    );

    return branchPerformance;
  } catch (error) {
    console.error("Error fetching staff performance by branch:", error);
    throw new Error("Failed to fetch staff performance by branch");
  }
}

/**
 * Get summary count of total cases at each branch
 */
export async function getBranchCaseSummary(dateRange: DateRangeFilter) {
  try {
    const dateFilter = buildDateFilter(dateRange);

    const branches = await prisma.branch.findMany({
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: {
        code: "asc",
      },
    });

    const branchesWithCounts = await Promise.all(
      branches.map(async (branch) => {
        const totalCases = await prisma.warrantyCase.count({
          where: {
            branchId: branch.id,
            createdAt: dateFilter,
          },
        });

        return {
          id: branch.id,
          code: branch.code,
          name: branch.name,
          totalCases,
        };
      })
    );

    return branchesWithCounts;
  } catch (error) {
    console.error("Error fetching branch case summary:", error);
    throw new Error("Failed to fetch branch case summary");
  }
}

/**
 * Get comprehensive dashboard statistics
 */
export async function getDashboardStats(
  dateRange: DateRangeFilter = { preset: "all" }
) {
  try {
    const [
      staffMetrics,
      branchStatusCounts,
      transferStats,
      caseSummary,
      staffPerformanceByBranch,
    ] = await Promise.all([
      getStaffServiceMetrics(dateRange),
      getBranchStatusCounts(dateRange),
      getAllBranchTransferStats(dateRange),
      getBranchCaseSummary(dateRange),
      getStaffPerformanceByBranch(dateRange),
    ]);

    // Calculate overall totals
    const totalCases = caseSummary.reduce((sum, b) => sum + b.totalCases, 0);
    const totalStaffServices = staffMetrics.reduce(
      (sum, s) => sum + s.servicedCount,
      0
    );

    return {
      staffMetrics,
      branchStatusCounts,
      transferStats,
      caseSummary,
      staffPerformanceByBranch,
      totals: {
        cases: totalCases,
        staffServices: totalStaffServices,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw new Error("Failed to fetch dashboard statistics");
  }
}
