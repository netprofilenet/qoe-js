/**
 * WebRTC connection manager for low-latency network measurements
 * Uses WebSocket signaling and WebRTC DataChannels
 */
import { EventEmitter } from '../utils/events';
export interface LatencyMeasurement {
    rtt: number;
    serverTimestamp: bigint;
    sequence: number;
}
export declare class WebRTCConnection {
    private pc;
    private dataChannel;
    private ws;
    private connected;
    private messageHandlers;
    private sequence;
    private eventEmitter;
    private signalingUrl;
    private iceServers;
    private authToken?;
    /**
     * Create a new WebRTC connection
     * @param signalingUrl - WebSocket signaling server URL (ws:// or wss://)
     * @param iceServers - Array of STUN/TURN servers
     * @param eventEmitter - Optional event emitter for debug events
     * @param authToken - Optional bearer token for authenticated servers
     */
    constructor(signalingUrl: string, iceServers: RTCIceServer[], eventEmitter?: EventEmitter, authToken?: string);
    /**
     * Establish WebRTC connection via WebSocket signaling
     * @returns Promise that resolves when connection is established
     */
    connect(): Promise<void>;
    /**
     * Send a latency probe and measure round-trip time
     * @returns Promise with latency measurement result
     */
    measureLatency(): Promise<LatencyMeasurement>;
    /**
     * Handle incoming WebRTC packet
     * @param data - Packet data (ArrayBuffer)
     */
    private handleMessage;
    /**
     * Close WebRTC connection and clean up resources
     */
    close(): void;
    /**
     * Check if connection is established
     */
    get isConnected(): boolean;
}
//# sourceMappingURL=WebRTCConnection.d.ts.map