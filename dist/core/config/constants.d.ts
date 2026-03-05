/**
 * Default configuration constants matching Go server implementation
 * See pkg/protocol/config.go for server-side equivalents
 */
export interface TestSize {
    size: number;
    samples: number;
    label: string;
}
export declare const QUALITY_MODE_DOWNLOAD_TESTS: TestSize[];
export declare const QUALITY_MODE_UPLOAD_TESTS: TestSize[];
export declare const SPEED_MODE_DOWNLOAD_TESTS: TestSize[];
export declare const SPEED_MODE_UPLOAD_TESTS: TestSize[];
export declare const BANDWIDTH_FINISH_DURATION = 1000;
export declare const IDLE_LATENCY_COUNT = 20;
export declare const IDLE_LATENCY_INTERVAL = 100;
export declare const LOADED_LATENCY_INTERVAL = 400;
export declare const PACKET_LOSS_COUNT = 1000;
export declare const PACKET_LOSS_DURATION = 10000;
export declare const SPEED_TEST_DURATION = 15000;
export declare const SPEED_TEST_MIN_CONNECTIONS = 10;
export declare const SPEED_TEST_CHUNK_SIZE = 25000000;
export declare const QUALITY_BANDWIDTH_PERCENTILE = 90;
export declare const SPEED_BANDWIDTH_PERCENTILE = 100;
export declare const LATENCY_PERCENTILE = 50;
export declare const STREAMING_BITRATES: number[];
export declare const GAMING_LATENCY_COUNT = 200;
export declare const GAMING_DURATION = 20000;
export declare const CONFERENCE_DURATION = 30000;
export declare const CONFERENCE_BURST_INTERVAL = 10;
export declare const CONFERENCE_BURST_PACKETS = 52;
export declare const CONFERENCE_TARGET_BITRATE = 2000000;
//# sourceMappingURL=constants.d.ts.map