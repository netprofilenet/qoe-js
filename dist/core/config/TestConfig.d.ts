/**
 * Test configuration interface and defaults
 */
import { TestSize } from './constants';
export type TestMode = 'quality' | 'speed' | 'application';
export type AppTest = 'streaming' | 'gaming' | 'conference' | 'voip' | 'browsing';
export interface TestConfig {
    authToken?: string;
    mode?: TestMode;
    appTests?: AppTest[];
    downloadTests?: TestSize[];
    uploadTests?: TestSize[];
    bandwidthFinishDuration?: number;
    speedTestDuration?: number;
    speedTestMinConnections?: number;
    speedTestChunkSize?: number;
    idleLatencyCount?: number;
    idleLatencyInterval?: number;
    loadedLatencyInterval?: number;
    packetLossCount?: number;
    packetLossDuration?: number;
    serverConfig?: {
        useSharedServers?: boolean;
        sharedServerRegistryUrl?: string;
        customServer?: any;
        autoDiscover?: boolean;
    };
}
/**
 * Get default configuration for quality mode
 */
export declare function getQualityModeConfig(): Required<Omit<TestConfig, 'mode' | 'appTests' | 'serverConfig' | 'authToken'>>;
/**
 * Get default configuration for speed mode
 */
export declare function getSpeedModeConfig(): Required<Omit<TestConfig, 'mode' | 'appTests' | 'serverConfig' | 'authToken'>>;
/**
 * Merge user config with defaults
 */
export declare function mergeConfig(userConfig?: TestConfig, mode?: TestMode): TestConfig;
//# sourceMappingURL=TestConfig.d.ts.map