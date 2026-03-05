/**
 * QOE Client - UI Helpers
 *
 * Optional UI utilities for visualization and formatting.
 * Requires Chart.js as a peer dependency.
 */

// TODO: Implement UI helpers
// For now, this is a placeholder for future UI helper implementations

export class MetricFormatter {
  static formatBandwidth(bps: number, decimals: number = 1): string {
    const mbps = bps / 1_000_000;
    return `${mbps.toFixed(decimals)} Mbps`;
  }

  static formatLatency(ms: number, decimals: number = 1): string {
    return `${ms.toFixed(decimals)} ms`;
  }

  static formatPercent(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}%`;
  }

  static formatDuration(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(0)} ms`;
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(1)} s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }
}
