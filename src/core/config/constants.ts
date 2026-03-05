/**
 * Default configuration constants matching Go server implementation
 * See pkg/protocol/config.go for server-side equivalents
 */

export interface TestSize {
  size: number;
  samples: number;
  label: string;
}

// Quality Mode (Cloudflare-style) Configuration
export const QUALITY_MODE_DOWNLOAD_TESTS: TestSize[] = [
  { size: 100_000, samples: 10, label: '100kB' },
  { size: 1_000_000, samples: 8, label: '1MB' },
  { size: 10_000_000, samples: 6, label: '10MB' },
  { size: 25_000_000, samples: 4, label: '25MB' },
  { size: 100_000_000, samples: 3, label: '100MB' },
];

export const QUALITY_MODE_UPLOAD_TESTS: TestSize[] = [
  { size: 100_000, samples: 10, label: '100kB' },
  { size: 1_000_000, samples: 8, label: '1MB' },
  { size: 10_000_000, samples: 6, label: '10MB' },
  { size: 25_000_000, samples: 4, label: '25MB' },
  { size: 50_000_000, samples: 3, label: '50MB' },
];

// Speed Mode (Ookla-style) Configuration
export const SPEED_MODE_DOWNLOAD_TESTS: TestSize[] = [
  { size: 10_000_000, samples: 1, label: '10MB' },
  { size: 25_000_000, samples: 1, label: '25MB' },
  { size: 100_000_000, samples: 1, label: '100MB' },
  { size: 250_000_000, samples: 1, label: '250MB' },
];

export const SPEED_MODE_UPLOAD_TESTS: TestSize[] = [
  { size: 10_000_000, samples: 1, label: '10MB' },
  { size: 25_000_000, samples: 1, label: '25MB' },
  { size: 100_000_000, samples: 1, label: '100MB' },
  { size: 150_000_000, samples: 1, label: '150MB' },
];

// Timing Constants
export const BANDWIDTH_FINISH_DURATION = 1000;  // ms - stop test if single request exceeds this
export const IDLE_LATENCY_COUNT = 20;           // number of samples
export const IDLE_LATENCY_INTERVAL = 100;       // ms between probes
export const LOADED_LATENCY_INTERVAL = 400;     // ms between probes during bandwidth tests

// Packet Loss Configuration
export const PACKET_LOSS_COUNT = 1000;          // number of packets to send
export const PACKET_LOSS_DURATION = 10000;      // ms - duration of packet loss test

// Speed Mode Configuration
export const SPEED_TEST_DURATION = 15000;       // ms - duration for speed mode tests
export const SPEED_TEST_MIN_CONNECTIONS = 10;   // minimum parallel connections
export const SPEED_TEST_CHUNK_SIZE = 25000000;  // 25MB chunks

// Statistical Percentiles
export const QUALITY_BANDWIDTH_PERCENTILE = 90; // p90 for quality mode
export const SPEED_BANDWIDTH_PERCENTILE = 100;  // max for speed mode
export const LATENCY_PERCENTILE = 50;           // median (p50)

// Application Mode Configuration
export const STREAMING_BITRATES = [5, 10, 25, 50, 100]; // Mbps
export const GAMING_LATENCY_COUNT = 200;        // number of latency samples
export const GAMING_DURATION = 20000;           // ms
export const CONFERENCE_DURATION = 30000;       // ms
export const CONFERENCE_BURST_INTERVAL = 10;    // ms
export const CONFERENCE_BURST_PACKETS = 52;     // packets per burst
export const CONFERENCE_TARGET_BITRATE = 2_000_000; // 2 Mbps
