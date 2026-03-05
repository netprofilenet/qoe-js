/**
 * Packet loss measurement using WebRTC DataChannels
 */
import { EventEmitter } from '../utils/events';
import { PacketLossResult } from '../types/results';
export interface PacketLossTestConfig {
    webrtcSignalingUrl: string;
    iceServers: RTCIceServer[];
    packetLossCount: number;
    packetLossDuration: number;
}
export declare class PacketLossTest {
    private config;
    private eventEmitter;
    private stopRequested;
    constructor(config: PacketLossTestConfig, eventEmitter: EventEmitter);
    /**
     * Request the test to stop gracefully
     */
    stop(): void;
    /**
     * Measure packet loss using unreliable WebRTC DataChannels
     * @returns PacketLossResult with loss ratio and lost packet sequences
     */
    measure(): Promise<PacketLossResult>;
}
//# sourceMappingURL=PacketLossTest.d.ts.map