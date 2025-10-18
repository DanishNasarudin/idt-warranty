/**
 * Server Actions for Field Locking
 * These actions handle acquiring and releasing field locks for collaborative editing
 */

"use server";

import { FieldLock } from "@/lib/types/realtime";
import { sseManager } from "@/lib/utils/sse-manager";
import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Acquire a field lock for editing
 */
export async function acquireFieldLock(
  caseId: number,
  field: string,
  branchId: number
): Promise<{ success: boolean; lock?: FieldLock; existingLock?: FieldLock }> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Get user details from Clerk
  const user = await currentUser();

  if (!user) {
    throw new Error("User not found");
  }

  // Get user name from Clerk (first name + last name, or username, or email)
  const userName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username || user.emailAddresses[0]?.emailAddress || userId;

  const lock: FieldLock = {
    caseId,
    field,
    userId,
    userName,
    timestamp: Date.now(),
    expiresAt: Date.now() + 30000, // 30 seconds
  };

  const acquired = sseManager.acquireFieldLock(lock);

  if (acquired) {
    // Broadcast lock to other users
    sseManager.broadcast(
      branchId,
      {
        type: "field-locked",
        data: lock,
      },
      userId
    );

    return { success: true, lock };
  } else {
    // Return existing lock information
    const existingLock = sseManager.getFieldLock(caseId, field);
    return { success: false, existingLock };
  }
}

/**
 * Release a field lock
 */
export async function releaseFieldLock(
  caseId: number,
  field: string,
  branchId: number
): Promise<{ success: boolean }> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const released = sseManager.releaseFieldLock(caseId, field, userId);

  if (released) {
    // Broadcast unlock to other users
    sseManager.broadcast(
      branchId,
      {
        type: "field-unlocked",
        data: { caseId, field, userId },
      },
      userId
    );
  }

  return { success: released };
}

/**
 * Refresh/extend a field lock
 */
export async function refreshFieldLock(
  caseId: number,
  field: string,
  branchId: number
): Promise<{ success: boolean; lock?: FieldLock }> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Get user details from Clerk
  const user = await currentUser();

  if (!user) {
    throw new Error("User not found");
  }

  // Get user name from Clerk (first name + last name, or username, or email)
  const userName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username || user.emailAddresses[0]?.emailAddress || userId;

  const lock: FieldLock = {
    caseId,
    field,
    userId,
    userName,
    timestamp: Date.now(),
    expiresAt: Date.now() + 30000, // 30 seconds
  };

  const acquired = sseManager.acquireFieldLock(lock);

  return { success: acquired, lock: acquired ? lock : undefined };
}
