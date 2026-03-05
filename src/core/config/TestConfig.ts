/**
 * Test configuration interface and defaults
 */

import {
  TestSize,
  QUALITY_MODE_DOWNLOAD_TESTS,
  QUALITY_MODE_UPLOAD_TESTS,
  SPEED_MODE_DOWNLOAD_TESTS,
  SPEED_MODE_UPLOAD_TESTS,
  BANDWIDTH_FINISH_DURATION,
  IDLE_LATENCY_COUNT,
  IDLE_LATENCY_INTERVAL,
  LOADED_LATENCY_INTERVAL,
  PACKET_LOSS_COUNT,
  PACKET_LOSS_DURATION,
  SPEED_TEST_DURATION,
  SPEED_TEST_MIN_CONNECTIONS,
  SPEED_TEST_CHUNK_SIZE
} from './constants';

export type TestMode = 'quality' | 'speed' | 'application';
export type AppTest = 'streaming' | 'gaming' | 'conference' | 'voip' | 'browsing';

export interface TestConfig {
  // Test mode
  mode?: TestMode;
  appTests?: AppTest[];

  // Bandwidth test configuration
  downloadTests?: TestSize[];
  uploadTests?: TestSize[];
  bandwidthFinishDuration?: number;  // ms

  // Speed mode specific
  speedTestDuration?: number;        // ms
  speedTestMinConnections?: number;
  speedTestChunkSize?: number;       // bytes

  // Latency test configuration
  idleLatencyCount?: number;
  idleLatencyInterval?: number;      // ms
  loadedLatencyInterval?: number;    // ms

  // Packet loss configuration
  packetLossCount?: number;
  packetLossDuration?: number;       // ms

  // Server configuration
  serverConfig?: {
    useSharedServers?: boolean;
    sharedServerRegistryUrl?: string;
    customServer?: any; // ServerInfo type
    autoDiscover?: boolean;
  };
}

/**
 * Get default configuration for quality mode
 */
export function getQualityModeConfig(): Required<Omit<TestConfig, 'mode' | 'appTests' | 'serverConfig'>> {
  return {
    downloadTests: QUALITY_MODE_DOWNLOAD_TESTS,
    uploadTests: QUALITY_MODE_UPLOAD_TESTS,
    bandwidthFinishDuration: BANDWIDTH_FINISH_DURATION,
    speedTestDuration: 0,              // Not used in quality mode
    speedTestMinConnections: 1,         // Not used in quality mode
    speedTestChunkSize: 0,              // Not used in quality mode
    idleLatencyCount: IDLE_LATENCY_COUNT,
    idleLatencyInterval: IDLE_LATENCY_INTERVAL,
    loadedLatencyInterval: LOADED_LATENCY_INTERVAL,
    packetLossCount: PACKET_LOSS_COUNT,
    packetLossDuration: PACKET_LOSS_DURATION
  };
}

/**
 * Get default configuration for speed mode
 */
export function getSpeedModeConfig(): Required<Omit<TestConfig, 'mode' | 'appTests' | 'serverConfig'>> {
  return {
    downloadTests: SPEED_MODE_DOWNLOAD_TESTS,
    uploadTests: SPEED_MODE_UPLOAD_TESTS,
    bandwidthFinishDuration: BANDWIDTH_FINISH_DURATION * 5, // Longer for speed mode
    speedTestDuration: SPEED_TEST_DURATION,
    speedTestMinConnections: SPEED_TEST_MIN_CONNECTIONS,
    speedTestChunkSize: SPEED_TEST_CHUNK_SIZE,
    idleLatencyCount: 10,               // Fewer samples for speed mode
    idleLatencyInterval: IDLE_LATENCY_INTERVAL,
    loadedLatencyInterval: 500,         // Not typically used in speed mode
    packetLossCount: 500,               // Fewer packets for speed mode
    packetLossDuration: 10000
  };
}

/**
 * Merge user config with defaults
 */
export function mergeConfig(userConfig: TestConfig = {}, mode: TestMode = 'quality'): TestConfig {
  const defaults = mode === 'speed' ? getSpeedModeConfig() : getQualityModeConfig();

  return {
    mode,
    downloadTests: userConfig.downloadTests || defaults.downloadTests,
    uploadTests: userConfig.uploadTests || defaults.uploadTests,
    bandwidthFinishDuration: userConfig.bandwidthFinishDuration ?? defaults.bandwidthFinishDuration,
    speedTestDuration: userConfig.speedTestDuration ?? defaults.speedTestDuration,
    speedTestMinConnections: userConfig.speedTestMinConnections ?? defaults.speedTestMinConnections,
    speedTestChunkSize: userConfig.speedTestChunkSize ?? defaults.speedTestChunkSize,
    idleLatencyCount: userConfig.idleLatencyCount ?? defaults.idleLatencyCount,
    idleLatencyInterval: userConfig.idleLatencyInterval ?? defaults.idleLatencyInterval,
    loadedLatencyInterval: userConfig.loadedLatencyInterval ?? defaults.loadedLatencyInterval,
    packetLossCount: userConfig.packetLossCount ?? defaults.packetLossCount,
    packetLossDuration: userConfig.packetLossDuration ?? defaults.packetLossDuration,
    appTests: userConfig.appTests,
    serverConfig: userConfig.serverConfig
  };
}
