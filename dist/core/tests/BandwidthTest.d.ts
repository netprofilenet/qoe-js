/**
 * Bandwidth measurement for download and upload tests
 */
import { EventEmitter } from '../utils/events';
import { BandwidthResult, BandwidthSample } from '../types/results';
import { TestSize } from '../config/constants';
export interface BandwidthTestConfig {
    apiBaseUrl: string;
    downloadTests: TestSize[];
    uploadTests: TestSize[];
    bandwidthFinishDuration: number;
}
export declare class BandwidthTest {
    private config;
    private eventEmitter;
    private stopRequested;
    constructor(config: BandwidthTestConfig, eventEmitter: EventEmitter);
    /**
     * Request the test to stop gracefully
     */
    stop(): void;
    /**
     * Reset stop flag (call before starting a new test)
     */
    private resetStop;
    /**
     * Measure download bandwidth for a single test size
     * @param test - Test configuration (size, label, samples)
     * @param testStart - Reference timestamp for relative timing
     * @returns Array of bandwidth samples for this size
     */
    measureDownloadSize(test: TestSize, testStart: number): Promise<BandwidthSample[]>;
    /**
     * Measure upload bandwidth for a single test size
     * @param test - Test configuration (size, label, samples)
     * @param testStart - Reference timestamp for relative timing
     * @returns Array of bandwidth samples for this size
     */
    measureUploadSize(test: TestSize, testStart: number): Promise<BandwidthSample[]>;
    /**
     * Measure download bandwidth across all configured test sizes
     * @returns BandwidthResult with p90 bandwidth and all samples
     */
    measureDownload(): Promise<BandwidthResult>;
    /**
     * Measure upload bandwidth across all configured test sizes
     * @returns BandwidthResult with p90 bandwidth and all samples
     */
    measureUpload(): Promise<BandwidthResult>;
    /**
     * Measure upload bandwidth using N parallel connections (speed mode / Ookla-style)
     *
     * Each worker continuously sends requests for the full durationMs window.
     * Aggregate throughput = total bytes across all connections / total wall-clock time.
     *
     * Note: no server timing correction for upload — the server drain time completely
     * overlaps with the client transfer time (TCP flow control), so subtracting it
     * would undercount transfer duration and inflate results.
     */
    measureUploadParallel(concurrency: number, durationMs: number, chunkSize: number): Promise<BandwidthResult>;
}
//# sourceMappingURL=BandwidthTest.d.ts.map