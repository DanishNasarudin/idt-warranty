/**
 * Performance measurement utilities for load testing
 */

export interface PerformanceMetrics {
  min: number;
  max: number;
  mean: number;
  median: number;
  p95: number;
  p99: number;
  total: number;
}

/**
 * Measure execution time of async function
 */
export async function measureTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArray: number[], p: number): number {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((sortedArray.length * p) / 100) - 1;
  return sortedArray[Math.max(0, index)];
}

/**
 * Calculate performance metrics from duration array
 */
export function calculateMetrics(durations: number[]): PerformanceMetrics {
  if (durations.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, p95: 0, p99: 0, total: 0 };
  }

  const sorted = [...durations].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: sum / sorted.length,
    median: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    total: sum,
  };
}

/**
 * Run function N times concurrently and measure performance
 */
export async function runConcurrent<T>(
  fn: () => Promise<T>,
  count: number
): Promise<{
  results: T[];
  durations: number[];
  metrics: PerformanceMetrics;
}> {
  const promises = Array.from({ length: count }, async () => measureTime(fn));
  const measurements = await Promise.all(promises);

  const results = measurements.map((m) => m.result);
  const durations = measurements.map((m) => m.duration);
  const metrics = calculateMetrics(durations);

  return { results, durations, metrics };
}

/**
 * Run function N times sequentially and measure performance
 */
export async function runSequential<T>(
  fn: () => Promise<T>,
  count: number
): Promise<{
  results: T[];
  durations: number[];
  metrics: PerformanceMetrics;
}> {
  const results: T[] = [];
  const durations: number[] = [];

  for (let i = 0; i < count; i++) {
    const { result, duration } = await measureTime(fn);
    results.push(result);
    durations.push(duration);
  }

  const metrics = calculateMetrics(durations);
  return { results, durations, metrics };
}

/**
 * Assert performance metrics meet targets
 */
export function assertPerformance(
  metrics: PerformanceMetrics,
  targets: Partial<PerformanceMetrics>,
  label: string = "Operation"
) {
  const failures: string[] = [];

  if (targets.p95 !== undefined && metrics.p95 > targets.p95) {
    failures.push(`P95: ${metrics.p95.toFixed(2)}ms > ${targets.p95}ms`);
  }

  if (targets.p99 !== undefined && metrics.p99 > targets.p99) {
    failures.push(`P99: ${metrics.p99.toFixed(2)}ms > ${targets.p99}ms`);
  }

  if (targets.mean !== undefined && metrics.mean > targets.mean) {
    failures.push(`Mean: ${metrics.mean.toFixed(2)}ms > ${targets.mean}ms`);
  }

  if (targets.max !== undefined && metrics.max > targets.max) {
    failures.push(`Max: ${metrics.max.toFixed(2)}ms > ${targets.max}ms`);
  }

  if (failures.length > 0) {
    throw new Error(
      `${label} performance targets not met:\n${failures.join("\n")}`
    );
  }
}

/**
 * Format metrics for logging
 */
export function formatMetrics(metrics: PerformanceMetrics): string {
  return `
Performance Metrics:
  Min:    ${metrics.min.toFixed(2)}ms
  Max:    ${metrics.max.toFixed(2)}ms
  Mean:   ${metrics.mean.toFixed(2)}ms
  Median: ${metrics.median.toFixed(2)}ms
  P95:    ${metrics.p95.toFixed(2)}ms
  P99:    ${metrics.p99.toFixed(2)}ms
  Total:  ${metrics.total.toFixed(2)}ms
  `.trim();
}

/**
 * Wait for specified duration
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        await wait(delay);
      }
    }
  }

  throw lastError!;
}
