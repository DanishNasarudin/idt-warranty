/**
 * Data factories for generating test data at scale
 */

let branchCounter = 0;
let staffCounter = 0;
let caseCounter = 0;

/**
 * Generate a unique branch code
 */
export function generateBranchCode(): string {
  branchCounter++;
  return `BR${branchCounter.toString().padStart(3, "0")}`;
}

/**
 * Create mock branch data
 */
export function createMockBranch(overrides?: Record<string, any>) {
  const code = generateBranchCode();
  return {
    code,
    name: `Branch ${code}`,
    address: null,
    officePhone: null,
    whatsappPhone: null,
    ...overrides,
  };
}

/**
 * Create multiple mock branches
 */
export function createMockBranches(
  count: number,
  overrides?: Record<string, any>
) {
  return Array.from({ length: count }, () => createMockBranch(overrides));
}

/**
 * Create mock staff data
 */
export function createMockStaff(overrides?: Record<string, any>) {
  staffCounter++;
  const colors = [
    "red",
    "blue",
    "green",
    "yellow",
    "purple",
    "orange",
    "pink",
    "cyan",
  ];

  return {
    name: `Staff ${staffCounter}`,
    color: colors[staffCounter % colors.length],
    ...overrides,
  };
}

/**
 * Create multiple mock staff members
 */
export function createMockStaffMembers(
  count: number,
  overrides?: Record<string, any>
) {
  return Array.from({ length: count }, () => createMockStaff(overrides));
}

/**
 * Create mock warranty case data
 */
export function createMockWarrantyCase(
  branchId: number,
  scopeId: number,
  overrides?: Record<string, any>
) {
  caseCounter++;

  return {
    branchId,
    scopeId,
    serviceNo: `WLD${Date.now()}${caseCounter}`,
    customerName: `Customer ${caseCounter}`,
    customerContact: `+60${Math.floor(Math.random() * 1000000000)
      .toString()
      .padStart(9, "0")}`,
    customerEmail: `customer${caseCounter}@example.com`,
    address: null,
    purchaseDate: null,
    invoice: null,
    receivedItems: null,
    pin: null,
    issues: `Issue description for case ${caseCounter}`,
    solutions: null,
    statusDesc: null,
    remarks: null,
    cost: 0,
    idtPc: null,
    status: "IN_QUEUE" as const,
    receivedByStaffId: null,
    servicedByStaffId: null,
    originBranchId: null,
    ...overrides,
  };
}

/**
 * Create multiple mock warranty cases
 */
export function createMockWarrantyCases(
  count: number,
  branchId: number,
  scopeId: number,
  overrides?: Record<string, any>
) {
  return Array.from({ length: count }, () =>
    createMockWarrantyCase(branchId, scopeId, overrides)
  );
}

/**
 * Reset all counters (useful between tests)
 */
export function resetCounters() {
  branchCounter = 0;
  staffCounter = 0;
  caseCounter = 0;
}

/**
 * Generate realistic Malaysian phone number
 */
export function generatePhoneNumber(): string {
  const prefixes = ["10", "11", "12", "13", "14", "16", "17", "18", "19"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 10000000)
    .toString()
    .padStart(7, "0");
  return `+60${prefix}${number}`;
}

/**
 * Generate random date within range
 */
export function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

/**
 * Generate random case status
 */
export function randomStatus(): string {
  const statuses = ["IN_QUEUE", "IN_PROGRESS", "WAITING_FOR", "COMPLETED"];
  return statuses[Math.floor(Math.random() * statuses.length)];
}
