/**
 * Statistical analysis utilities
 */

export interface Statistics {
  min: number;
  max: number;
  mean: number;
  median: number;
  stddev: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

/**
 * Calculate the median of an array of numbers
 * @param values - Array of numeric values
 * @returns Median value
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate a specific percentile of an array of numbers
 * @param values - Array of numeric values
 * @param p - Percentile (0-100)
 * @returns Percentile value
 */
export function calculatePercentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(Math.ceil((p / 100) * sorted.length), sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Calculate comprehensive statistics for an array of numbers
 * @param values - Array of numeric values
 * @returns Statistics object with min, max, mean, median, stddev, and percentiles
 */
export function calculateStats(values: number[]): Statistics {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, stddev: 0, p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 };
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stddev = Math.sqrt(variance);

  return {
    min: Math.min(...values),
    max: Math.max(...values),
    mean,
    median: calculateMedian(values),
    stddev,
    p10: calculatePercentile(values, 10),
    p25: calculatePercentile(values, 25),
    p50: calculatePercentile(values, 50),
    p75: calculatePercentile(values, 75),
    p90: calculatePercentile(values, 90),
  };
}
