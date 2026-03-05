class MetricFormatter {
  static formatBandwidth(bps, decimals = 1) {
    const mbps = bps / 1e6;
    return `${mbps.toFixed(decimals)} Mbps`;
  }
  static formatLatency(ms, decimals = 1) {
    return `${ms.toFixed(decimals)} ms`;
  }
  static formatPercent(value, decimals = 2) {
    return `${value.toFixed(decimals)}%`;
  }
  static formatDuration(ms) {
    if (ms < 1e3) return `${ms.toFixed(0)} ms`;
    const seconds = ms / 1e3;
    if (seconds < 60) return `${seconds.toFixed(1)} s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }
}
export {
  MetricFormatter
};
