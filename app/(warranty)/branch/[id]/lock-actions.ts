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
    console.log(
      `[Lock] Acquired lock for case ${caseId}, field ${field}, broadcasting to branch ${branchId}`
    );
    // Broadcast lock to ALL connections (client will ignore if it's their own lock via optimistic updates)
    sseManager.broadcast(
      branchId,
      {
        type: "field-locked",
        data: lock,
      }
      // No exclusion - broadcast to everyone including same user on different windows
    );
    console.log(
      `[Lock] Broadcast complete, active connections: ${sseManager.getConnectionCount()}`
    );

    return { success: true, lock };
  } else {
    // Return existing lock information
    const existingLock = sseManager.getFieldLock(caseId, field);
    console.log(
      `[Lock] Failed to acquire lock for case ${caseId}, field ${field}, held by: ${existingLock?.userName}`
    );
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
    console.log(
      `[Lock] Released lock for case ${caseId}, field ${field}, broadcasting to branch ${branchId}`
    );
    // Broadcast unlock to ALL connections (client will ignore if needed via optimistic updates)
    sseManager.broadcast(
      branchId,
      {
        type: "field-unlocked",
        data: { caseId, field, userId },
      }
      // No exclusion - broadcast to everyone including same user on different windows
    );
    console.log(
      `[Lock] Unlock broadcast complete, active connections: ${sseManager.getConnectionCount()}`
    );
  } else {
    console.log(
      `[Lock] Failed to release lock for case ${caseId}, field ${field}`
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
