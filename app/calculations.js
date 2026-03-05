/**
 * Calculation Helper Functions
 *
 * Derived metric calculations for Quality Mode:
 * - Bufferbloat: Difference between loaded and idle latency
 * - Quality Score: 0-100 score based on bandwidth, latency, packet loss
 * - Activity Ratings: Suitability for streaming, gaming, video chat
 */

/**
 * Calculate bufferbloat (loaded latency - idle latency)
 * Returns the maximum of download or upload bufferbloat
 *
 * @param {Object} stats - Statistics from StatsAdapter
 * @returns {number} Bufferbloat in milliseconds
 */
export function calculateBufferbloat(stats) {
  // Get latency values from stats (these would come from loaded latency probes)
  // For now, we'll need to extract this from the raw metrics
  // This is a simplified version - the actual implementation would track
  // loaded latency separately during download vs upload

  const idleLatency = stats.latency?.stats?.median || 0;

  // In a full implementation, we'd have separate loaded latency tracking
  // For now, return 0 as placeholder
  // TODO: Track loaded latency separately in a custom adapter
  return 0;
}

/**
 * Calculate quality score (0-100)
 * Based on bandwidth, latency, and packet loss
 *
 * @param {Object} stats - Statistics from StatsAdapter
 * @returns {number} Quality score (0-100)
 */
export function calculateQualityScore(stats) {
  const downloadMbps = (stats.downloadBandwidth?.stats?.p90 || 0) / 1_000_000;
  const uploadMbps = (stats.uploadBandwidth?.stats?.p90 || 0) / 1_000_000;
  const latency = stats.latency?.stats?.median || 0;
  const packetLoss = 0; // TODO: Extract from packet loss metrics

  let score = 0;

  // Bandwidth score (40 points max)
  // Download: 20 points for 100+ Mbps
  score += Math.min(downloadMbps / 100 * 20, 20);
  // Upload: 20 points for 50+ Mbps
  score += Math.min(uploadMbps / 50 * 20, 20);

  // Latency score (30 points max)
  // 0ms = 30 points, 300ms = 0 points
  score += Math.max(30 - latency / 10, 0);

  // Packet loss score (30 points max)
  // 0% = 30 points, 10% = 0 points
  score += Math.max(30 - packetLoss * 3, 0);

  return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculate activity ratings
 * Determines suitability for different activities
 *
 * @param {Object} stats - Statistics from StatsAdapter
 * @returns {Object} Activity ratings (streaming, gaming, videoChat)
 */
export function calculateActivityRatings(stats) {
  const downloadMbps = (stats.downloadBandwidth?.stats?.p90 || 0) / 1_000_000;
  const uploadMbps = (stats.uploadBandwidth?.stats?.p90 || 0) / 1_000_000;
  const latency = stats.latency?.stats?.median || 0;
  const packetLoss = 0; // TODO: Extract from packet loss metrics

  return {
    streaming: rateActivity(
      downloadMbps >= 25 && packetLoss < 1,
      downloadMbps >= 10 && packetLoss < 2,
      'Excellent',
      'Good',
      'Fair',
      'Poor'
    ),
    gaming: rateActivity(
      latency < 20 && packetLoss < 0.5,
      latency < 50 && packetLoss < 1,
      'Excellent',
      'Good',
      'Fair',
      'Poor'
    ),
    videoChat: rateActivity(
      uploadMbps >= 5 && downloadMbps >= 5 && latency < 50,
      uploadMbps >= 2 && downloadMbps >= 2 && latency < 100,
      'Excellent',
      'Good',
      'Fair',
      'Poor'
    )
  };
}

/**
 * Helper function to determine activity rating
 *
 * @param {boolean} excellentCondition - Condition for excellent rating
 * @param {boolean} goodCondition - Condition for good rating
 * @param {string} excellentLabel - Label for excellent
 * @param {string} goodLabel - Label for good
 * @param {string} fairLabel - Label for fair
 * @param {string} poorLabel - Label for poor
 * @returns {string} Activity rating
 */
function rateActivity(excellentCondition, goodCondition, excellentLabel, goodLabel, fairLabel, poorLabel) {
  if (excellentCondition) return excellentLabel;
  if (goodCondition) return goodLabel;
  return poorLabel;
}

/**
 * Format bandwidth value for display
 *
 * @param {number} bps - Bandwidth in bits per second
 * @returns {string} Formatted bandwidth (e.g., "123.45 Mbps")
 */
export function formatBandwidth(bps) {
  const mbps = bps / 1_000_000;
  return `${mbps.toFixed(2)} Mbps`;
}

/**
 * Format latency value for display
 *
 * @param {number} ms - Latency in milliseconds
 * @returns {string} Formatted latency (e.g., "12.3 ms")
 */
export function formatLatency(ms) {
  return `${ms.toFixed(1)} ms`;
}

/**
 * Format packet loss for display
 *
 * @param {number} ratio - Packet loss ratio (0-1)
 * @returns {string} Formatted packet loss (e.g., "1.2%")
 */
export function formatPacketLoss(ratio) {
  return `${(ratio * 100).toFixed(2)}%`;
}
