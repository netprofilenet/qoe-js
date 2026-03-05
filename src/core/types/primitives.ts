/**
 * Type definitions for primitive functions and execution engine
 */

import { ServerInfo } from './server';

/**
 * Result from a primitive function execution
 */
export interface PrimitiveResult {
  timestamp: number;    // When the primitive started (performance.now())
  duration: number;     // How long it took (ms)
  success: boolean;     // Whether it succeeded
  data?: any;          // Primitive-specific result data
  error?: Error;       // Error if failed
}

/**
 * Execution context shared across all steps
 */
export interface ExecutionContext {
  results: Map<string, StepResult>;  // Results from previous steps (by step ID)
  state: Map<string, any>;           // Shared state across steps
  server: ServerInfo;                // Server configuration
  signal: AbortSignal;               // For cancellation
}

/**
 * Result from a single test step
 */
export interface StepResult {
  step: TestStep;                    // The step configuration
  skipped: boolean;                  // Whether it was skipped (conditional)
  duration?: number;                 // Total duration (ms)
  primitiveResults: PrimitiveResult[]; // Results from all primitive executions
}

/**
 * Final result from executing a test plan
 */
export interface ExecutionResult {
  success: boolean;                  // Whether all steps succeeded
  duration: number;                  // Total execution time (ms)
  stepResults: StepResult[];         // Results from each step
  error?: Error;                     // Error if failed
  context: ExecutionContext;         // Final execution context
}

/**
 * Test plan defining a series of test steps
 */
export interface TestPlan {
  name: string;
  description?: string;
  steps: TestStep[];
  options?: TestPlanOptions;
}

/**
 * Options for a test plan
 */
export interface TestPlanOptions {
  server?: ServerInfo;
  timeout?: number;  // Maximum test duration (ms)
}

/**
 * A single step in a test plan
 */
export interface TestStep {
  id?: string;                    // Optional ID for referencing
  name?: string;                  // Optional display name
  primitive: PrimitiveType;       // Which primitive to execute
  execution: ExecutionMode;       // How to execute it
  config: PrimitiveConfig;        // Primitive-specific configuration
  condition?: StepCondition;      // When to run this step
  dependsOn?: string[];           // Step IDs this depends on
}

/**
 * Primitive function types
 */
export type PrimitiveType =
  | 'httpDownload'
  | 'httpUpload'
  | 'latencyProbe'
  | 'webrtcConnect'
  | 'webrtcLatencyProbe'
  | 'packetStream';

/**
 * Execution mode for a step
 */
export interface ExecutionMode {
  mode: 'sequential' | 'parallel' | 'burst' | 'timed';
  repeat?: {
    count?: number;      // Repeat N times
    duration?: number;   // Repeat for N ms
    interval?: number;   // ms between repetitions
  };
  concurrency?: number;  // For parallel mode
  burst?: {              // For burst mode
    size: number;        // Burst size
    interval: number;    // ms between bursts
  };
  background?: boolean;  // Run in background (future)
}

/**
 * Condition for when to run a step
 */
export interface StepCondition {
  type: 'always' | 'ifSuccess' | 'ifFailure' | 'ifFast' | 'custom';
  maxDuration?: number;  // For 'ifFast'
  evaluate?: (context: ExecutionContext) => boolean;  // For 'custom'
}

/**
 * Configuration for primitive functions
 */
export type PrimitiveConfig =
  | HttpDownloadConfig
  | HttpUploadConfig
  | LatencyProbeConfig
  | WebRTCConnectConfig
  | WebRTCLatencyProbeConfig
  | PacketStreamConfig;

/**
 * Configuration for HTTP download primitive
 */
export interface HttpDownloadConfig {
  type: 'httpDownload';
  url: string;          // Endpoint URL (e.g., '/__down')
  size: number;         // Bytes to download
  baseUrl?: string;     // Base URL (if not included in url)
}

/**
 * Configuration for HTTP upload primitive
 */
export interface HttpUploadConfig {
  type: 'httpUpload';
  url: string;          // Endpoint URL (e.g., '/__up')
  size: number;         // Bytes to upload
  baseUrl?: string;     // Base URL (if not included in url)
}

/**
 * Configuration for latency probe primitive
 */
export interface LatencyProbeConfig {
  type: 'latencyProbe';
  url: string;          // Endpoint URL (e.g., '/__latency')
  baseUrl?: string;     // Base URL (if not included in url)
  useWebRTC?: boolean;  // Use WebRTC instead of HTTP (requires connection)
  connectionRef?: string; // Reference to WebRTC connection step ID
}

/**
 * Configuration for WebRTC connection primitive
 */
export interface WebRTCConnectConfig {
  type: 'webrtcConnect';
  signalingUrl: string;    // WebSocket signaling URL
  iceServers: RTCIceServer[]; // ICE servers for NAT traversal
}

/**
 * Configuration for WebRTC latency probe primitive
 */
export interface WebRTCLatencyProbeConfig {
  type: 'webrtcLatencyProbe';
  connectionRef: string;  // Reference to WebRTC connection step ID
}

/**
 * Configuration for packet stream primitive
 */
export interface PacketStreamConfig {
  type: 'packetStream';
  connectionRef: string;  // Reference to WebRTC connection step ID
  packetCount: number;    // Number of packets to send
  interval: number;       // ms between packets
  packetSize: number;     // Size of each packet (bytes)
  receiveOnly?: boolean;  // Only receive (for bidirectional)
}

/**
 * Primitive function signature
 */
export type PrimitiveFunction = (
  config: PrimitiveConfig,
  context: ExecutionContext
) => Promise<PrimitiveResult>;
