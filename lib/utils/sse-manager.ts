/**
 * Server-side connection manager for SSE real-time updates
 * Manages connections, field locks, and broadcasts updates to clients
 */

import { FieldLock, SSEConnection, SSEMessage } from "@/lib/types/realtime";

class SSEConnectionManager {
  private connections: Map<string, SSEConnection> = new Map();
  private fieldLocks: Map<string, FieldLock> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lockCleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
    this.startLockCleanup();
  }

  /**
   * Add a new SSE connection
   */
  addConnection(connection: SSEConnection): void {
    this.connections.set(connection.userId, connection);
    console.log(
      `[SSE] Connection added: ${connection.userId} (branch: ${connection.branchId})`
    );
  }

  /**
   * Remove an SSE connection and release all its locks
   */
  removeConnection(userId: string): void {
    const connection = this.connections.get(userId);
    if (connection) {
      this.connections.delete(userId);
      this.releaseAllUserLocks(userId);
      console.log(`[SSE] Connection removed: ${userId}`);
    }
  }

  /**
   * Get all connections for a specific branch
   */
  getConnectionsByBranch(branchId: number): SSEConnection[] {
    return Array.from(this.connections.values()).filter(
      (conn) => conn.branchId === branchId
    );
  }

  /**
   * Broadcast a message to all connections in a branch (except sender)
   */
  broadcast(
    branchId: number,
    message: SSEMessage,
    excludeUserId?: string
  ): void {
    const connections = this.getConnectionsByBranch(branchId);

    connections.forEach((conn) => {
      if (conn.userId !== excludeUserId) {
        try {
          const data = `data: ${JSON.stringify(message)}\n\n`;
          conn.controller.enqueue(new TextEncoder().encode(data));
        } catch (error) {
          console.error(
            `[SSE] Failed to send message to ${conn.userId}:`,
            error
          );
          this.removeConnection(conn.userId);
        }
      }
    });
  }

  /**
   * Broadcast a message to all connected users (across all branches)
   * Used for global events like app version updates
   */
  broadcastToAll(message: SSEMessage, excludeUserId?: string): void {
    this.connections.forEach((conn) => {
      if (conn.userId !== excludeUserId) {
        try {
          const data = `data: ${JSON.stringify(message)}\n\n`;
          conn.controller.enqueue(new TextEncoder().encode(data));
        } catch (error) {
          console.error(
            `[SSE] Failed to send global message to ${conn.userId}:`,
            error
          );
          this.removeConnection(conn.userId);
        }
      }
    });
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
      console.log(`[SSE] Released ${locksToRemove.length} locks for ${userId}`);
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
   * Send heartbeat to all connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const message: SSEMessage = {
        type: "heartbeat",
        data: { timestamp: now },
      };

      this.connections.forEach((conn) => {
        try {
          const data = `data: ${JSON.stringify(message)}\n\n`;
          conn.controller.enqueue(new TextEncoder().encode(data));
          conn.lastHeartbeat = now;
        } catch (error) {
          console.error(`[SSE] Heartbeat failed for ${conn.userId}:`, error);
          this.removeConnection(conn.userId);
        }
      });
    }, 30000); // Every 30 seconds
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
        console.log(`[SSE] Cleaned up ${expiredLocks.length} expired locks`);
      }
    }, 10000); // Every 10 seconds
  }

  /**
   * Cleanup when shutting down
   */
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.lockCleanupInterval) {
      clearInterval(this.lockCleanupInterval);
    }
    this.connections.clear();
    this.fieldLocks.clear();
  }
}

// Singleton instance
export const sseManager = new SSEConnectionManager();
