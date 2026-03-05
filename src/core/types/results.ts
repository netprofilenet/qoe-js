/**
 * Result type definitions for QOE tests
 */

import { Statistics } from '../utils/stats';

export interface BandwidthSample {
  timestamp: number;  // milliseconds since test start
  bandwidth: number;  // bits per second
  size: number;       // bytes transferred
  duration: number;   // milliseconds
}

export interface TestSizeResult {
  size: number;
  label: string;
  samples: BandwidthSample[];
  stats: Statistics | null;
}

export interface BandwidthResult {
  bandwidth: number;      // bits per second (p90 for quality, max for speed)
  bandwidthMbps: number;  // megabits per second
  stats: Statistics;
  samples: BandwidthSample[];
  testsBySize: TestSizeResult[];
}

export interface LatencySample {
  timestamp: number;  // milliseconds since test start
  latency: number;    // milliseconds
}

export interface LatencyResult {
  median: number;     // milliseconds
  stats: Statistics;
  samples: LatencySample[];
}

export interface PacketLossResult {
  sent: number;
  received: number;
  lossRatio: number;      // 0-1
  lossPercent: number;    // 0-100
  lostSequences: number[];
}

export interface ActivityRating {
  videoStreaming: 'Good' | 'Fair' | 'Poor';
  gaming: 'Good' | 'Fair' | 'Poor';
  videoChat: 'Good' | 'Fair' | 'Poor';
}

export interface QualityResults {
  download: BandwidthResult;
  upload: BandwidthResult;
  idleLatency: LatencyResult;
  downloadLatency?: LatencyResult;
  uploadLatency?: LatencyResult;
  packetLoss: PacketLossResult;
  bufferbloat?: number;   // milliseconds
  qualityScore?: number;  // 0-100
  activityRatings?: ActivityRating;
}

export interface SpeedResults {
  download: BandwidthResult;
  upload: BandwidthResult;
  idleLatency: LatencyResult;
  packetLoss: PacketLossResult;
}

export interface StreamingResult {
  maxSustainedBitrate: number;  // Mbps
  startupLatency: number;       // milliseconds
  rebufferEvents: number;
  qualityPrediction: string;    // "480p", "720p", "1080p", "4K", "4K+"
}

export interface GamingResult {
  latencyMin: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  latencyMax: number;
  jitterSpikes: number;
  packetLossPercent: number;
  gamingScore: number;  // 0-100
}

export interface ConferenceResult {
  uploadSustained: number;        // Mbps
  downloadSustained: number;      // Mbps
  bidirectionalLatency: number;   // milliseconds
  jitter: number;                 // milliseconds
  packetLoss: number;             // percent
  symmetryRatio: number;          // upload/download ratio
  score: number;                  // 0-100
}

export interface VoIPResult {
  score: number;              // 0-100
  mos: number;                // Mean Opinion Score (1-5)
  rfactor: number;            // R-factor (0-100)
  delayMs: number;
  jitterMs: number;
  packetLossPercent: number;
}

export interface BrowsingResult {
  lcp: number;            // Largest Contentful Paint (ms)
  ttfb: number;           // Time To First Byte (ms)
  fcp: number;            // First Contentful Paint (ms)
  pageLoadMs: number;
  interactiveMs: number;
  connectionMs: number;
  bytesDownloaded: number;
}

export interface ApplicationResults {
  streaming?: StreamingResult;
  gaming?: GamingResult;
  conference?: ConferenceResult;
  voip?: VoIPResult;
  browsing?: BrowsingResult;
}
