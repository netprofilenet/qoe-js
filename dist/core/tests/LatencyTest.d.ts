/**
 * Latency measurement for idle and loaded conditions
 */
import { EventEmitter } from '../utils/events';
import { LatencyResult } from '../types/results';
export interface LatencyTestConfig {
    apiBaseUrl: string;
    webrtcSignalingUrl: string;
    iceServers: RTCIceServer[];
    idleLatencyCount: number;
    idleLatencyInterval: number;
    loadedLatencyInterval: number;
}
export declare class LatencyTest {
    private config;
    private eventEmitter;
    private webrtcConnection;
    private stopRequested;
    private loadedLatencyWorker;
    private loadedLatencyPromise;
    private testStart;
    private downloadLatencySamples;
    private uploadLatencySamples;
    constructor(config: LatencyTestConfig, eventEmitter: EventEmitter);
    /**
     * Request the test to stop gracefully
     */
    stop(): void;
    /**
     * Measure idle latency (without concurrent data transfer)
     * @returns LatencyResult with median latency and all samples
     */
    measureIdleLatency(): Promise<LatencyResult>;
    /**
     * Start background latency measurement during bandwidth tests
     * @param type - 'download' or 'upload'
     */
    startLoadedLatencyMeasurement(type: 'download' | 'upload'): Promise<void>;
    /**
     * Stop loaded latency measurement and return accumulated results
     * @returns Object with download and upload latency results
     */
    stopLoadedLatencyMeasurement(): Promise<{
        downloadLatency: LatencyResult | null;
        uploadLatency: LatencyResult | null;
    }>;
    /**
     * Close WebRTC connection and clean up resources
     */
    close(): void;
}
//# sourceMappingURL=LatencyTest.d.ts.map