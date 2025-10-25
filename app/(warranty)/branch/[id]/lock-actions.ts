/**
 * Server Actions for Field Locking
 * These actions handle acquiring and releasing field locks for collaborative editing
 */

"use server";

import { FieldLock } from "@/lib/types/realtime";
import { emitToBranch } from "@/lib/utils/socket-emitter";
import { socketManager } from "@/lib/utils/socket-manager";
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

  const acquired = socketManager.acquireFieldLock(lock);

  if (acquired) {
    console.log(
      `[Lock] Acquired lock for case ${caseId}, field ${field}, broadcasting to branch ${branchId}`
    );
    // Broadcast lock to ALL connections via Socket.IO
    await emitToBranch(branchId, "field-lock-acquired", lock);
    console.log(
      `[Lock] Broadcast complete, active connections: ${socketManager.getConnectionCount()}`
    );

    return { success: true, lock };
  } else {
    // Return existing lock information
    const existingLock = socketManager.getFieldLock(caseId, field);
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

  const released = socketManager.releaseFieldLock(caseId, field, userId);

  if (released) {
    console.log(
      `[Lock] Released lock for case ${caseId}, field ${field}, broadcasting to branch ${branchId}`
    );
    // Broadcast unlock to ALL connections via Socket.IO
    await emitToBranch(branchId, "field-lock-released", { caseId, field });
    console.log(
      `[Lock] Unlock broadcast complete, active connections: ${socketManager.getConnectionCount()}`
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

  const acquired = socketManager.acquireFieldLock(lock);

  return { success: acquired, lock: acquired ? lock : undefined };
}
