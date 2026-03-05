/**
 * Sleep for a specified duration
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Convert milliseconds to microseconds
 * @param ms - Duration in milliseconds
 * @returns Duration in microseconds
 */
export function msToMicroseconds(ms: number): number {
  return Math.floor(ms * 1000);
}

/**
 * Convert microseconds to milliseconds
 * @param us - Duration in microseconds
 * @returns Duration in milliseconds
 */
export function microsecondsToMs(us: number): number {
  return us / 1000;
}

/**
 * Generate a short random ID for unique request URLs
 */
export function requestId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Look up PerformanceResourceTiming for a URL and return download body duration.
 * Returns `responseEnd - responseStart` (body transfer only, excludes TTFB).
 * Returns null if ResourceTiming is unavailable or fields are zeroed (cross-origin without TAO).
 */
export function getDownloadDuration(url: string): number | null {
  try {
    const entries = performance.getEntriesByName(url, 'resource') as PerformanceResourceTiming[];
    if (entries.length === 0) return null;
    const entry = entries[entries.length - 1];
    if (entry.responseStart > 0 && entry.responseEnd > 0) {
      const duration = entry.responseEnd - entry.responseStart;
      if (duration > 0) return duration;
    }
  } catch { /* ResourceTiming not supported */ }
  return null;
}

/**
 * Look up PerformanceResourceTiming for a URL and return upload transfer duration.
 * Returns `responseStart - requestStart` (request send + server processing, no JS jitter).
 * Returns null if ResourceTiming is unavailable or fields are zeroed.
 */
export function getUploadDuration(url: string): number | null {
  try {
    const entries = performance.getEntriesByName(url, 'resource') as PerformanceResourceTiming[];
    if (entries.length === 0) return null;
    const entry = entries[entries.length - 1];
    if (entry.requestStart > 0 && entry.responseStart > 0) {
      const duration = entry.responseStart - entry.requestStart;
      if (duration > 0) return duration;
    }
  } catch { /* ResourceTiming not supported */ }
  return null;
}

/**
 * Clear all resource timing entries to prevent buffer overflow.
 * Call periodically during long test runs.
 */
export function clearResourceTimings(): void {
  try { performance.clearResourceTimings(); } catch { /* noop */ }
}
