/**
 * Application Mode Test Plans
 *
 * Five application-specific test scenarios:
 * 1. Video Streaming - Progressive bitrate testing
 * 2. Gaming - Low-latency ping test with jitter measurement
 * 3. Video Conferencing - Bidirectional bursty traffic
 * 4. VoIP Call Quality - Sequential packet stream (G.711 codec)
 * 5. Web Browsing - Page load simulation
 */
import { TestPlan } from '../types/primitives';
/**
 * 1. Video Streaming Test
 * Progressive bitrate ladder: 480p → 720p → 1080p → 4K
 * Skip higher bitrates if lower ones fail
 */
export declare const streamingTestPlan: TestPlan;
/**
 * 2. Gaming Performance Test
 * High-frequency latency probes to measure p99 latency and jitter
 */
export declare const gamingTestPlan: TestPlan;
/**
 * 3. Video Conferencing Test
 * Bidirectional bursty packet streams simulating 720p video call
 */
export declare const conferenceTestPlan: TestPlan;
/**
 * 4. VoIP Call Quality Test
 * Sequential packet stream simulating G.711 codec (64kbps, 20ms packets)
 */
export declare const voipTestPlan: TestPlan;
/**
 * 5. Web Browsing Performance Test
 * Simulates typical webpage load pattern
 */
export declare const browsingTestPlan: TestPlan;
//# sourceMappingURL=application.d.ts.map