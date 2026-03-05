/**
 * Sleep for a specified duration
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the specified duration
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Convert milliseconds to microseconds
 * @param ms - Duration in milliseconds
 * @returns Duration in microseconds
 */
export declare function msToMicroseconds(ms: number): number;
/**
 * Convert microseconds to milliseconds
 * @param us - Duration in microseconds
 * @returns Duration in milliseconds
 */
export declare function microsecondsToMs(us: number): number;
/**
 * Generate a short random ID for unique request URLs
 */
export declare function requestId(): string;
/**
 * Look up PerformanceResourceTiming for a URL and return download body duration.
 * Returns `responseEnd - responseStart` (body transfer only, excludes TTFB).
 * Returns null if ResourceTiming is unavailable or fields are zeroed (cross-origin without TAO).
 */
export declare function getDownloadDuration(url: string): number | null;
/**
 * Look up PerformanceResourceTiming for a URL and return upload transfer duration.
 * Returns `responseStart - requestStart` (request send + server processing, no JS jitter).
 * Returns null if ResourceTiming is unavailable or fields are zeroed.
 */
export declare function getUploadDuration(url: string): number | null;
/**
 * Clear all resource timing entries to prevent buffer overflow.
 * Call periodically during long test runs.
 */
export declare function clearResourceTimings(): void;
//# sourceMappingURL=timing.d.ts.map