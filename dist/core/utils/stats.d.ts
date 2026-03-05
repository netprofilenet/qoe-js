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
export declare function calculateMedian(values: number[]): number;
/**
 * Calculate a specific percentile of an array of numbers
 * @param values - Array of numeric values
 * @param p - Percentile (0-100)
 * @returns Percentile value
 */
export declare function calculatePercentile(values: number[], p: number): number;
/**
 * Calculate comprehensive statistics for an array of numbers
 * @param values - Array of numeric values
 * @returns Statistics object with min, max, mean, median, stddev, and percentiles
 */
export declare function calculateStats(values: number[]): Statistics;
//# sourceMappingURL=stats.d.ts.map