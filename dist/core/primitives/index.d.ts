/**
 * Primitive network operation functions
 *
 * These are stateless, single-purpose functions that perform atomic network operations.
 * They accept configuration and context, execute the operation, and return results.
 */
import { PrimitiveResult, ExecutionContext, PrimitiveConfig } from '../types/primitives';
/**
 * HTTP Download Primitive
 * Downloads data from an HTTP endpoint and measures bandwidth
 */
export declare function httpDownload(config: PrimitiveConfig, context: ExecutionContext): Promise<PrimitiveResult>;
/**
 * HTTP Upload Primitive
 * Uploads data to an HTTP endpoint and measures bandwidth
 */
export declare function httpUpload(config: PrimitiveConfig, context: ExecutionContext): Promise<PrimitiveResult>;
/**
 * Latency Probe Primitive
 * Measures round-trip latency using HTTP or WebRTC
 */
export declare function latencyProbe(config: PrimitiveConfig, context: ExecutionContext): Promise<PrimitiveResult>;
/**
 * WebRTC Connection Primitive
 * Establishes a WebRTC connection via WebSocket signaling
 */
export declare function webrtcConnect(config: PrimitiveConfig, _context: ExecutionContext): Promise<PrimitiveResult>;
/**
 * WebRTC Latency Probe Primitive
 * Measures latency using an existing WebRTC connection
 */
export declare function webrtcLatencyProbe(config: PrimitiveConfig, context: ExecutionContext): Promise<PrimitiveResult>;
/**
 * Packet Stream Primitive
 * Sends/receives packet stream for packet loss measurement or bidirectional traffic
 */
export declare function packetStream(config: PrimitiveConfig, context: ExecutionContext): Promise<PrimitiveResult>;
/**
 * Export all primitives as a registry for easy lookup
 */
export declare const PRIMITIVES: {
    httpDownload: typeof httpDownload;
    httpUpload: typeof httpUpload;
    latencyProbe: typeof latencyProbe;
    webrtcConnect: typeof webrtcConnect;
    webrtcLatencyProbe: typeof webrtcLatencyProbe;
    packetStream: typeof packetStream;
};
//# sourceMappingURL=index.d.ts.map