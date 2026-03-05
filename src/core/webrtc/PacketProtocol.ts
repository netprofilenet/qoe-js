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
export function serializeWebRTCPacket(sequence: number, timestamp: number): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(48);
  const view = new DataView(buffer);

  // Sequence number (4 bytes, uint32, little-endian)
  view.setUint32(0, sequence, true);

  // Client timestamp in microseconds (8 bytes, uint64, little-endian)
  const timestampUs = BigInt(Math.floor(timestamp * 1000));
  view.setBigUint64(4, timestampUs, true);

  // Server timestamp placeholder (8 bytes, uint64, little-endian)
  view.setBigUint64(12, 0n, true);

  // Payload (32 bytes) - left as zeros
  // Bytes 20-47 remain zero-filled

  return new Uint8Array(buffer) as Uint8Array<ArrayBuffer>;
}

/**
 * Deserialize a 48-byte WebRTC packet
 * @param data - ArrayBuffer or Uint8Array containing packet data
 * @returns Parsed packet object or null if invalid
 */
export function deserializeWebRTCPacket(data: ArrayBuffer | Uint8Array): WebRTCPacket | null {
  if (data.byteLength !== 48) {
    console.error('Invalid packet size:', data.byteLength);
    return null;
  }

  const buffer = data instanceof ArrayBuffer ? data : data.buffer as ArrayBuffer;
  const view = new DataView(buffer);

  return {
    sequence: view.getUint32(0, true),
    clientTimestamp: Number(view.getBigUint64(4, true)),
    serverTimestamp: Number(view.getBigUint64(12, true))
  };
}
