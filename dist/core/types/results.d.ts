/**
 * Result type definitions for QOE tests
 */
import { Statistics } from '../utils/stats';
export interface BandwidthSample {
    timestamp: number;
    bandwidth: number;
    size: number;
    duration: number;
}
export interface TestSizeResult {
    size: number;
    label: string;
    samples: BandwidthSample[];
    stats: Statistics | null;
}
export interface BandwidthResult {
    bandwidth: number;
    bandwidthMbps: number;
    stats: Statistics;
    samples: BandwidthSample[];
    testsBySize: TestSizeResult[];
}
export interface LatencySample {
    timestamp: number;
    latency: number;
}
export interface LatencyResult {
    median: number;
    stats: Statistics;
    samples: LatencySample[];
}
export interface PacketLossResult {
    sent: number;
    received: number;
    lossRatio: number;
    lossPercent: number;
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
    bufferbloat?: number;
    qualityScore?: number;
    activityRatings?: ActivityRating;
}
export interface SpeedResults {
    download: BandwidthResult;
    upload: BandwidthResult;
    idleLatency: LatencyResult;
    packetLoss: PacketLossResult;
}
export interface StreamingResult {
    maxSustainedBitrate: number;
    startupLatency: number;
    rebufferEvents: number;
    qualityPrediction: string;
}
export interface GamingResult {
    latencyMin: number;
    latencyP50: number;
    latencyP95: number;
    latencyP99: number;
    latencyMax: number;
    jitterSpikes: number;
    packetLossPercent: number;
    gamingScore: number;
}
export interface ConferenceResult {
    uploadSustained: number;
    downloadSustained: number;
    bidirectionalLatency: number;
    jitter: number;
    packetLoss: number;
    symmetryRatio: number;
    score: number;
}
export interface VoIPResult {
    score: number;
    mos: number;
    rfactor: number;
    delayMs: number;
    jitterMs: number;
    packetLossPercent: number;
}
export interface BrowsingResult {
    lcp: number;
    ttfb: number;
    fcp: number;
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
//# sourceMappingURL=results.d.ts.map