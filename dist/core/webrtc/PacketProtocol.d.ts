/**
 * WebRTC packet protocol for network quality measurements
 *
 * Packet format (48 bytes total):
 * - Bytes 0-3: Sequence number (uint32, little-endian)
 * - Bytes 4-11: Client timestamp in microseconds (uint64, little-endian)
 * - Bytes 12-19: Server timestamp in microseconds (uint64, little-endian)
 * - Bytes 20-47: Payload (32 bytes)
 *
 * This format must match the Go server implementation in pkg/protocol/message.go
 */
export interface WebRTCPacket {
    sequence: number;
    clientTimestamp: number;
    serverTimestamp: number;
}
/**
 * Serialize a WebRTC packet to 48 bytes
 * @param sequence - Packet sequence number
 * @param timestamp - Client timestamp in milliseconds
 * @returns Uint8Array of exactly 48 bytes
 */
export declare function serializeWebRTCPacket(sequence: number, timestamp: number): Uint8Array<ArrayBuffer>;
/**
 * Deserialize a 48-byte WebRTC packet
 * @param data - ArrayBuffer or Uint8Array containing packet data
 * @returns Parsed packet object or null if invalid
 */
export declare function deserializeWebRTCPacket(data: ArrayBuffer | Uint8Array): WebRTCPacket | null;
//# sourceMappingURL=PacketProtocol.d.ts.map