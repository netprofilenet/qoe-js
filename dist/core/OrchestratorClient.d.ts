/**
 * OrchestratorClient - Manages test lifecycle through the orchestrator API
 *
 * Handles server discovery, test token acquisition, test execution,
 * and result submission via the orchestrator service.
 */
import { ServerInfo } from './types/server';
import { QualityResults, SpeedResults } from './types/results';
export interface TestTokenResponse {
    token: string;
    expiresAt: string;
    serverId: string;
    testId: string;
}
export declare class OrchestratorClient {
    private baseUrl;
    constructor(baseUrl: string);
    /**
     * Fetch the list of available test servers from the orchestrator
     */
    fetchServers(): Promise<ServerInfo[]>;
    /**
     * Request a test token for a specific server
     */
    requestTestToken(serverId: string): Promise<TestTokenResponse>;
    /**
     * Submit test results to the orchestrator
     */
    submitResults(token: string, results: Record<string, unknown>): Promise<void>;
    /**
     * Convenience: run a quality test through the orchestrator.
     * Discovers best server (or uses specified), acquires token, runs test, submits results.
     */
    runQualityTest(serverId?: string): Promise<{
        results: QualityResults;
        testId: string;
    }>;
    /**
     * Convenience: run a speed test through the orchestrator.
     * Discovers best server (or uses specified), acquires token, runs test, submits results.
     */
    runSpeedTest(serverId?: string): Promise<{
        results: SpeedResults;
        testId: string;
    }>;
    /**
     * Discover the best server by measuring latency to all enabled servers
     */
    private discoverBestServer;
}
//# sourceMappingURL=OrchestratorClient.d.ts.map