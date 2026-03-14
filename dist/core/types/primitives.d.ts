/**
 * Type definitions for primitive functions and execution engine
 */
import { ServerInfo } from './server';
/**
 * Result from a primitive function execution
 */
export interface PrimitiveResult {
    timestamp: number;
    duration: number;
    success: boolean;
    data?: any;
    error?: Error;
}
/**
 * Execution context shared across all steps
 */
export interface ExecutionContext {
    results: Map<string, StepResult>;
    state: Map<string, any>;
    server: ServerInfo;
    signal: AbortSignal;
}
/**
 * Result from a single test step
 */
export interface StepResult {
    step: TestStep;
    skipped: boolean;
    duration?: number;
    primitiveResults: PrimitiveResult[];
}
/**
 * Final result from executing a test plan
 */
export interface ExecutionResult {
    success: boolean;
    duration: number;
    stepResults: StepResult[];
    error?: Error;
    context: ExecutionContext;
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
    timeout?: number;
}
/**
 * A single step in a test plan
 */
export interface TestStep {
    id?: string;
    name?: string;
    primitive: PrimitiveType;
    execution: ExecutionMode;
    config: PrimitiveConfig;
    condition?: StepCondition;
    dependsOn?: string[];
}
/**
 * Primitive function types
 */
export type PrimitiveType = 'httpDownload' | 'httpUpload' | 'latencyProbe' | 'webrtcConnect' | 'webrtcLatencyProbe' | 'packetStream';
/**
 * Execution mode for a step
 */
export interface ExecutionMode {
    mode: 'sequential' | 'parallel' | 'burst' | 'timed';
    repeat?: {
        count?: number;
        duration?: number;
        interval?: number;
    };
    concurrency?: number;
    burst?: {
        size: number;
        interval: number;
    };
    background?: boolean;
}
/**
 * Condition for when to run a step
 */
export interface StepCondition {
    type: 'always' | 'ifSuccess' | 'ifFailure' | 'ifFast' | 'custom';
    maxDuration?: number;
    evaluate?: (context: ExecutionContext) => boolean;
}
/**
 * Configuration for primitive functions
 */
export type PrimitiveConfig = HttpDownloadConfig | HttpUploadConfig | LatencyProbeConfig | WebRTCConnectConfig | WebRTCLatencyProbeConfig | PacketStreamConfig;
/**
 * Configuration for HTTP download primitive
 */
export interface HttpDownloadConfig {
    type: 'httpDownload';
    url: string;
    size: number;
    baseUrl?: string;
    authToken?: string;
}
/**
 * Configuration for HTTP upload primitive
 */
export interface HttpUploadConfig {
    type: 'httpUpload';
    url: string;
    size: number;
    baseUrl?: string;
    authToken?: string;
}
/**
 * Configuration for latency probe primitive
 */
export interface LatencyProbeConfig {
    type: 'latencyProbe';
    url: string;
    baseUrl?: string;
    authToken?: string;
    useWebRTC?: boolean;
    connectionRef?: string;
}
/**
 * Configuration for WebRTC connection primitive
 */
export interface WebRTCConnectConfig {
    type: 'webrtcConnect';
    signalingUrl: string;
    iceServers: RTCIceServer[];
    authToken?: string;
}
/**
 * Configuration for WebRTC latency probe primitive
 */
export interface WebRTCLatencyProbeConfig {
    type: 'webrtcLatencyProbe';
    connectionRef: string;
}
/**
 * Configuration for packet stream primitive
 */
export interface PacketStreamConfig {
    type: 'packetStream';
    connectionRef: string;
    packetCount: number;
    interval: number;
    packetSize: number;
    receiveOnly?: boolean;
}
/**
 * Primitive function signature
 */
export type PrimitiveFunction = (config: PrimitiveConfig, context: ExecutionContext) => Promise<PrimitiveResult>;
//# sourceMappingURL=primitives.d.ts.map