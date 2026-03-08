/**
 * QOE Client - Core Library Exports
 */

// Main client
export { QOEClient } from './QOEClient';

// Orchestrator
export { OrchestratorClient } from './OrchestratorClient';
export type { TestTokenResponse } from './OrchestratorClient';

// Configuration
export type { TestConfig, TestMode, AppTest } from './config/TestConfig';
export { mergeConfig, getQualityModeConfig, getSpeedModeConfig } from './config/TestConfig';
export { ServerConfig } from './config/ServerConfig';
export * from './config/constants';

// Types
export * from './types/results';
export * from './types/events';
export * from './types/server';

// Utilities
export { EventEmitter } from './utils/events';
export { calculateStats, calculateMedian, calculatePercentile } from './utils/stats';
export type { Statistics } from './utils/stats';
export { sleep, msToMicroseconds, microsecondsToMs } from './utils/timing';
export { generateRandomData } from './utils/random';

// WebRTC
export { WebRTCConnection } from './webrtc/WebRTCConnection';
export type { LatencyMeasurement } from './webrtc/WebRTCConnection';
export { serializeWebRTCPacket, deserializeWebRTCPacket } from './webrtc/PacketProtocol';
export type { WebRTCPacket } from './webrtc/PacketProtocol';

// Test Modules (for advanced usage)
export { BandwidthTest } from './tests/BandwidthTest';
export { LatencyTest } from './tests/LatencyTest';
export { PacketLossTest } from './tests/PacketLossTest';

// ============================================================
// NEW TOOLKIT API
// ============================================================

// Primitives
export * from './primitives';

// Configuration Schema
export * from './composition/TestPlan';

// Execution Engine
export { TestRunner } from './composition/TestRunner';
export { PrimitiveRegistry } from './composition/PrimitiveRegistry';

// Type Definitions
export * from './types/primitives';

// Metrics
export { MetricCollector } from './metrics/MetricCollector';
export type { RawMetric, MetricTransformer, BandwidthMetrics, LatencyMetrics } from './metrics/MetricCollector';

// Observers
export { MetricObservable, MetricAdapter, ConsoleLoggerAdapter } from './observers/Observer';
export type { MetricObserver } from './observers/Observer';

// Adapters
export { ChartAdapter } from './observers/adapters/ChartAdapter';
export type { ChartData } from './observers/adapters/ChartAdapter';
export { StatsAdapter } from './observers/adapters/StatsAdapter';
export type { StatsData } from './observers/adapters/StatsAdapter';

// Test Plans (pre-built configurations)
export * from './test-plans';
