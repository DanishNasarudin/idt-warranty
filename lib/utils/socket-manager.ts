/**
 * Socket.IO Connection Manager
 * Server-side manager for WebSocket connections, field locks, and broadcasting
 */

import { FieldLock, SocketConnection } from "@/lib/types/socket";

class SocketConnectionManager {
  private connections: Map<string, SocketConnection> = new Map();
  private fieldLocks: Map<string, FieldLock> = new Map();
  private lockCleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startLockCleanup();
  }

  /**
   * Add a new Socket.IO connection
   */
  addConnection(connection: SocketConnection): void {
    this.connections.set(connection.socketId, connection);
    console.log(
      `[Socket Manager] Connection added: ${connection.socketId} (user: ${connection.userId}, branch: ${connection.branchId})`
    );
  }

  /**
   * Remove a Socket.IO connection and release all its locks
   */
  removeConnection(socketId: string): void {
    const connection = this.connections.get(socketId);
    if (connection) {
      this.connections.delete(socketId);
      this.releaseAllUserLocks(connection.userId);
      console.log(
        `[Socket Manager] Connection removed: ${socketId} (user: ${connection.userId}, branch: ${connection.branchId})`
      );
    }
  }

  /**
   * Get all connections for a specific branch
   */
  getConnectionsByBranch(branchId: number): SocketConnection[] {
    return Array.from(this.connections.values()).filter(
      (conn) => conn.branchId === branchId
    );
  }

  /**
   * Get connection by socket ID
   */
  getConnection(socketId: string): SocketConnection | undefined {
    return this.connections.get(socketId);
  }

  /**
   * Acquire a field lock
   */
  acquireFieldLock(lock: FieldLock): boolean {
    const lockKey = this.getLockKey(lock.caseId, lock.field);
    const existingLock = this.fieldLocks.get(lockKey);

    // Check if lock exists and hasn't expired
    if (existingLock && existingLock.expiresAt > Date.now()) {
      // Lock already held by another user
      if (existingLock.userId !== lock.userId) {
        return false;
      }
      // Same user, refresh the lock
      this.fieldLocks.set(lockKey, lock);
      return true;
    }

    // Acquire new lock
    this.fieldLocks.set(lockKey, lock);
    return true;
  }

  /**
   * Release a specific field lock
   */
  releaseFieldLock(caseId: number, field: string, userId: string): boolean {
    const lockKey = this.getLockKey(caseId, field);
    const existingLock = this.fieldLocks.get(lockKey);

    if (existingLock && existingLock.userId === userId) {
      this.fieldLocks.delete(lockKey);
      return true;
    }

    return false;
  }

  /**
   * Release all locks held by a user
   */
  releaseAllUserLocks(userId: string): void {
    const locksToRemove: string[] = [];

    this.fieldLocks.forEach((lock, key) => {
      if (lock.userId === userId) {
        locksToRemove.push(key);
      }
    });

    locksToRemove.forEach((key) => this.fieldLocks.delete(key));

    if (locksToRemove.length > 0) {
      console.log(
        `[Socket Manager] Released ${locksToRemove.length} locks for ${userId}`
      );
    }
  }

  /**
   * Get field lock information
   */
  getFieldLock(caseId: number, field: string): FieldLock | undefined {
    const lockKey = this.getLockKey(caseId, field);
    const lock = this.fieldLocks.get(lockKey);

    // Check if lock has expired
    if (lock && lock.expiresAt <= Date.now()) {
      this.fieldLocks.delete(lockKey);
      return undefined;
    }

    return lock;
  }

  /**
   * Check if a field is locked by another user
   */
  isFieldLocked(caseId: number, field: string, userId: string): boolean {
    const lock = this.getFieldLock(caseId, field);
    return lock !== undefined && lock.userId !== userId;
  }

  /**
   * Get all active connections count
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Get all active locks count
   */
  getLockCount(): number {
    return this.fieldLocks.size;
  }

  /**
   * Private helper to create lock key
   */
  private getLockKey(caseId: number, field: string): string {
    return `${caseId}:${field}`;
  }

  /**
   * Clean up expired locks
   */
  private startLockCleanup(): void {
    this.lockCleanupInterval = setInterval(() => {
      const now = Date.now();
      const expiredLocks: string[] = [];

      this.fieldLocks.forEach((lock, key) => {
        if (lock.expiresAt <= now) {
          expiredLocks.push(key);
        }
      });

      expiredLocks.forEach((key) => this.fieldLocks.delete(key));

      if (expiredLocks.length > 0) {
        console.log(
          `[Socket Manager] Cleaned up ${expiredLocks.length} expired locks`
        );
      }
    }, 10000); // Every 10 seconds
  }

  /**
   * Cleanup when shutting down
   */
  destroy(): void {
    if (this.lockCleanupInterval) {
      clearInterval(this.lockCleanupInterval);
    }
    this.connections.clear();
    this.fieldLocks.clear();
  }
}

// Singleton instance
export const socketManager = new SocketConnectionManager();
