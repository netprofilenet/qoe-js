/**
 * QOE Client - Main entry point for network quality measurements
 */
import { TestConfig } from './config/TestConfig';
import { ServerInfo } from './types/server';
import { QualityResults, SpeedResults, ApplicationResults } from './types/results';
import { TestRunner } from './composition/TestRunner';
import { MetricCollector, RawMetric } from './metrics/MetricCollector';
import { MetricObserver } from './observers/Observer';
import { TestPlan, ExecutionResult } from './types/primitives';
export declare class QOEClient {
    private config;
    private serverConfig;
    private eventEmitter;
    private stopRequested;
    private running;
    private testRunner;
    private metricCollector;
    private metricObservable;
    /**
     * Create a new QOE Client
     * @param config - Optional test configuration
     */
    constructor(config?: TestConfig);
    /**
     * Run quality mode test (Cloudflare-style)
     * @returns Promise with quality test results
     */
    runQualityTest(): Promise<QualityResults>;
    /**
     * Run speed mode test (Ookla-style)
     * @returns Promise with speed test results
     */
    runSpeedTest(): Promise<SpeedResults>;
    /**
     * Run application-specific tests
     * @returns Promise with application test results
     */
    runApplicationTest(): Promise<ApplicationResults>;
    /**
     * Set the server to use for testing
     * @param server - Server configuration
     */
    setServer(server: ServerInfo): void;
    /**
     * Get the current server
     */
    getServer(): ServerInfo;
    /**
     * Auto-discover and set the best server
     * @param registryUrl - URL to server registry JSON
     */
    discoverBestServer(registryUrl: string): Promise<ServerInfo>;
    /**
     * Register an event listener
     * @param event - Event name
     * @param callback - Callback function
     */
    on(event: string, callback: Function): void;
    /**
     * Unregister an event listener
     * @param event - Event name
     * @param callback - Callback function
     */
    off(event: string, callback: Function): void;
    /**
     * Request all running tests to stop gracefully
     */
    stop(): void;
    /**
     * Check if tests are currently running
     */
    isRunning(): boolean;
    /**
     * Calculate activity ratings based on network metrics
     * @private
     */
    private calculateActivityRatings;
    /**
     * Execute a test plan (NEW TOOLKIT API)
     * @param plan - Test plan to execute
     * @returns Promise with execution result
     */
    executeTestPlan(plan: TestPlan): Promise<ExecutionResult>;
    /**
     * Subscribe to metrics (NEW TOOLKIT API)
     * @param observer - Observer to subscribe
     * @returns Unsubscribe function
     */
    subscribe(observer: MetricObserver): () => void;
    /**
     * Get all collected metrics (NEW TOOLKIT API)
     * @returns Array of raw metrics
     */
    getMetrics(): RawMetric[];
    /**
     * Get the test runner instance (NEW TOOLKIT API)
     * @returns TestRunner instance
     */
    getTestRunner(): TestRunner;
    /**
     * Get the metric collector instance (NEW TOOLKIT API)
     * @returns MetricCollector instance
     */
    getMetricCollector(): MetricCollector;
    /**
     * Stop execution of current test plan (NEW TOOLKIT API)
     */
    stopTestPlan(): void;
}
//# sourceMappingURL=QOEClient.d.ts.map