/**
 * Utility functions for generating warranty service numbers
 * Format: W[CODE][YYMM][###]
 * Examples: WSA2510001, WAP2510001
 */

/**
 * Generates a service number based on branch code, current date, and sequence number
 * @param branchCode - The branch code (e.g., "SA", "AP")
 * @param sequenceNumber - The sequence number (e.g., 1, 2, 3...)
 * @param date - Optional date to use for YYMM (defaults to current date)
 * @returns Formatted service number (e.g., "WSA2510001")
 */
export function generateServiceNumber(
  branchCode: string,
  sequenceNumber: number,
  date: Date = new Date()
): string {
  // Format: W[CODE][YYMM][###]
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const seq = sequenceNumber.toString().padStart(3, "0");

  return `W${branchCode.toUpperCase()}${yy}${mm}${seq}`;
}

/**
 * Parses a service number to extract its components
 * @param serviceNo - The service number to parse (e.g., "WSA2510001")
 * @returns Object containing branch code, year, month, and sequence number, or null if invalid
 */
export function parseServiceNumber(serviceNo: string): {
  branchCode: string;
  year: string;
  month: string;
  sequence: number;
} | null {
  // Match pattern: W + (branch code) + YY + MM + ###
  const match = serviceNo.match(/^W([A-Z0-9]+)(\d{2})(\d{2})(\d{3})$/);

  if (!match) {
    return null;
  }

  return {
    branchCode: match[1],
    year: match[2],
    month: match[3],
    sequence: parseInt(match[4], 10),
  };
}

/**
 * Extracts the current month key from a date (YYMM format)
 * @param date - The date to extract from
 * @returns String in YYMM format (e.g., "2510" for October 2025)
 */
export function getCurrentMonthKey(date: Date = new Date()): string {
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${yy}${mm}`;
}

/**
 * Determines if a service number belongs to the current month
 * @param serviceNo - The service number to check
 * @param date - Optional date to compare against (defaults to current date)
 * @returns true if the service number is from the current month
 */
export function isCurrentMonth(
  serviceNo: string,
  date: Date = new Date()
): boolean {
  const parsed = parseServiceNumber(serviceNo);
  if (!parsed) return false;

  const currentMonthKey = getCurrentMonthKey(date);
  const serviceMonthKey = `${parsed.year}${parsed.month}`;

  return currentMonthKey === serviceMonthKey;
}

/**
 * Gets the next sequence number for a branch in the current month
 * @param existingServiceNumbers - Array of existing service numbers for the branch
 * @param branchCode - The branch code to filter by
 * @param date - Optional date to use for current month check (defaults to current date)
 * @returns The next sequence number to use
 */
export function getNextSequenceNumber(
  existingServiceNumbers: string[],
  branchCode: string,
  date: Date = new Date()
): number {
  const currentMonthKey = getCurrentMonthKey(date);

  // Filter service numbers for current branch and current month
  const currentMonthNumbers = existingServiceNumbers
    .map(parseServiceNumber)
    .filter(
      (parsed) =>
        parsed &&
        parsed.branchCode === branchCode.toUpperCase() &&
        `${parsed.year}${parsed.month}` === currentMonthKey
    )
    .map((parsed) => parsed!.sequence);

  // If no numbers exist for current month, start at 1
  if (currentMonthNumbers.length === 0) {
    return 1;
  }

  // Find the maximum sequence number and increment
  const maxSequence = Math.max(...currentMonthNumbers);
  return maxSequence + 1;
}
