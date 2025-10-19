"use server";

import { Prisma } from "@/lib/generated/prisma";
import prisma from "@/lib/prisma";
import { WarrantyCaseFilters } from "@/lib/types/search-params";
import {
  WarrantyCaseUpdate,
  WarrantyCaseWithRelations,
} from "@/lib/types/warranty";
import {
  generateServiceNumber,
  getNextSequenceNumber,
} from "@/lib/utils/service-number";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";

export async function getWarrantyCasesByBranch(
  branchId: number,
  filters?: WarrantyCaseFilters
): Promise<{
  cases: WarrantyCaseWithRelations[];
  totalCount: number;
}> {
  try {
    // Build where clause for search
    const whereClause: Prisma.WarrantyCaseWhereInput = {
      branchId,
    };

    // Add search filters
    if (filters?.search && filters.search.trim() !== "") {
      const searchTerm = filters.search.trim();

      if (filters.searchField === "all") {
        // Search across all fields
        whereClause.OR = [
          { serviceNo: { contains: searchTerm } },
          { customerName: { contains: searchTerm } },
          { customerContact: { contains: searchTerm } },
          { customerEmail: { contains: searchTerm } },
        ];
      } else {
        // Search specific field
        switch (filters.searchField) {
          case "serviceNo":
            whereClause.serviceNo = { contains: searchTerm };
            break;
          case "customerName":
            whereClause.customerName = { contains: searchTerm };
            break;
          case "customerContact":
            whereClause.customerContact = { contains: searchTerm };
            break;
          case "customerEmail":
            whereClause.customerEmail = { contains: searchTerm };
            break;
        }
      }
    }

    // Build order by clause
    const orderBy: Prisma.WarrantyCaseOrderByWithRelationInput[] = [];

    if (filters?.sort && filters.sort.length > 0) {
      // Apply multi-column sorting
      filters.sort.forEach((sortColumn) => {
        orderBy.push({
          [sortColumn.field]: sortColumn.direction,
        });
      });
    } else {
      // Default sorting
      orderBy.push({ createdAt: "desc" });
    }

    // Calculate pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await prisma.warrantyCase.count({
      where: whereClause,
    });

    const cases = await prisma.warrantyCase.findMany({
      where: whereClause,
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
            address: true,
            officePhone: true,
            whatsappPhone: true,
          },
        },
        scope: {
          select: {
            id: true,
            code: true,
          },
        },
        originBranch: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        _count: {
          select: {
            files: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Convert Decimal to number for serialization
    return {
      cases: cases.map((c) => ({
        ...c,
        cost: Number(c.cost),
      })) as WarrantyCaseWithRelations[],
      totalCount,
    };
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

    // Get current user's staff ID if available
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();

    // Find staff by clerk user ID (assuming staff might have a relation to clerk user)
    // For now, we'll pass undefined if we can't determine the staff ID
    // You may need to add a mapping between Clerk users and Staff records

    // Create snapshot of the changes
    const snapshot = JSON.stringify(updateData);

    await prisma.warrantyCase.update({
      where: {
        id: caseId,
      },
      data: updateData,
    });

    // Create history entry after successful update
    await createWarrantyHistory(caseId, "UPDATE", undefined, snapshot);

    // Import sseManager dynamically to avoid initialization issues
    const { sseManager } = await import("@/lib/utils/sse-manager");

    // Broadcast update to other users via SSE
    if (userId) {
      sseManager.broadcast(
        branchId,
        {
          type: "case-updated",
          data: { caseId, updates },
        },
        userId // Exclude the user who made the update
      );
    }

    // Revalidate the page to reflect changes
    revalidatePath(`/branch/${branchId}`);
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
    // Ensure Prisma client is connected (especially important in serverless/edge environments)
    await prisma.$connect();

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: {
        id: true,
        code: true,
        name: true,
        address: true,
        officePhone: true,
        whatsappPhone: true,
      },
    });

    return branch;
  } catch (error) {
    console.error("Error fetching branch details:", error);
    // Log more details for production debugging
    console.error("Branch ID:", branchId);
    console.error("Error type:", error?.constructor?.name);

    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Failed to fetch branch details: ${error.message}`);
    }
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
        originBranchId: branchId, // Set origin branch when creating new case
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
        originBranch: {
          select: {
            id: true,
            code: true,
            name: true,
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

export async function deleteWarrantyCase(
  caseId: number,
  branchId: number
): Promise<void> {
  try {
    // Create history entry before deletion
    await createWarrantyHistory(caseId, "DELETE");

    // Delete the warranty case
    await prisma.warrantyCase.delete({
      where: {
        id: caseId,
      },
    });

    // Revalidate the page to reflect changes
    revalidatePath(`/branch/${branchId}`);

    // TODO: Emit socket.io event here for real-time updates
    // Example: socketServer.to(`branch-${branchId}`).emit('caseDeleted', { caseId });
  } catch (error: any) {
    console.error("Error deleting warranty case:", error);

    // Handle foreign key constraint violations
    if (error.code === "P2003") {
      throw new Error(
        "Cannot delete warranty case. It has related history records."
      );
    }

    throw new Error(error.message || "Failed to delete warranty case");
  }
}

/**
 * Sends an email with warranty case details and PDF attachment
 * @param warrantyCase - The warranty case to send
 * @param pdfBase64 - The PDF as a base64 encoded string
 * @returns void
 */
export async function sendWarrantyCaseEmail(
  warrantyCase: WarrantyCaseWithRelations,
  pdfBase64: string
): Promise<void> {
  try {
    // Validate customer email
    if (!warrantyCase.customerEmail) {
      throw new Error("Customer email is not available");
    }

    // Get email configuration from environment variables
    const emailHost = process.env.SMTP_HOST;
    const emailPort = parseInt(process.env.SMTP_PORT || "587");
    const emailSecure = process.env.SMTP_SECURE === "true";
    const emailUser = process.env.SMTP_USER;
    const emailPass = process.env.SMTP_PASS;
    const emailFrom = process.env.SMTP_FROM || emailUser;

    if (!emailHost || !emailUser || !emailPass) {
      throw new Error(
        "Email configuration is missing. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in environment variables."
      );
    }

    // Convert base64 string to Buffer
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailSecure,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      pool: true,
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Create filename with format: [serviceNo]_IdealTechPC_Service_YYYYMMDD.pdf
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const filename = `${warrantyCase.serviceNo}_IdealTechPC_Service_${year}${month}${day}.pdf`;

    // Create email content
    const statusText = warrantyCase.status.replace(/_/g, " ");
    const mailOptions = {
      from: `Ideal Tech PC Service <${emailFrom}>`,
      to: warrantyCase.customerEmail,
      cc: emailFrom,
      replyTo: emailFrom,
      subject: `Warranty Case ${warrantyCase.serviceNo} - ${warrantyCase.customerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Warranty Case Details</h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Service Number:</strong> ${warrantyCase.serviceNo}</p>
            <p><strong>Customer Name:</strong> ${warrantyCase.customerName}</p>
            <p><strong>Status:</strong> ${statusText}</p>
            ${
              warrantyCase.receivedItems
                ? `<p><strong>Received Items:</strong> ${warrantyCase.receivedItems}</p>`
                : ""
            }
            ${
              warrantyCase.issues
                ? `<p><strong>Issues:</strong> ${warrantyCase.issues}</p>`
                : ""
            }
            ${
              warrantyCase.solutions
                ? `<p><strong>Solutions:</strong> ${warrantyCase.solutions}</p>`
                : ""
            }
          </div>

          <p>Please find attached the detailed warranty case receipt.</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated email. Please do not reply directly to this message.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: filename,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    // Send email
    await transporter.sendMail(mailOptions);

    console.log(`Email sent successfully to ${warrantyCase.customerEmail}`);
  } catch (error: any) {
    console.error("Error sending warranty case email:", error);
    throw new Error(error.message || "Failed to send email");
  }
}

/**
 * Fetches warranty history for a specific branch with pagination
 * @param branchId - The branch ID to fetch history for
 * @param page - Page number (1-indexed, default: 1)
 * @param pageSize - Number of records per page (default: 50, min: 1, max: 200)
 * @returns Paginated warranty history records
 */
export async function getWarrantyHistoryByBranch(
  branchId: number,
  page: number = 1,
  pageSize: number = 50
) {
  try {
    // Validate and sanitize inputs
    const validPage = Math.max(1, Math.floor(page));
    const validPageSize = Math.max(1, Math.min(200, Math.floor(pageSize)));

    const skip = (validPage - 1) * validPageSize;

    // Get total count for pagination
    const totalCount = await prisma.warrantyHistory.count({
      where: {
        case: {
          branchId,
        },
      },
    });

    // Fetch history records with relations
    const historyRecords = await prisma.warrantyHistory.findMany({
      where: {
        case: {
          branchId,
        },
      },
      include: {
        case: {
          select: {
            id: true,
            serviceNo: true,
            customerName: true,
            status: true,
          },
        },
        changedBy: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        changeTs: "desc",
      },
      skip,
      take: validPageSize,
    });

    return {
      records: historyRecords,
      pagination: {
        page: validPage,
        pageSize: validPageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / validPageSize),
      },
    };
  } catch (error) {
    console.error("Error fetching warranty history:", error);
    throw new Error("Failed to fetch warranty history");
  }
}
