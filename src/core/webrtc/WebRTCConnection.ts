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

export class WebRTCConnection {
  private pc: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private ws: WebSocket | null = null;
  private connected: boolean = false;
  private messageHandlers: Map<number, Function> = new Map();
  private sequence: number = 0;
  private eventEmitter: EventEmitter;

  private signalingUrl: string;
  private iceServers: RTCIceServer[];

  /**
   * Create a new WebRTC connection
   * @param signalingUrl - WebSocket signaling server URL (ws:// or wss://)
   * @param iceServers - Array of STUN/TURN servers
   * @param eventEmitter - Optional event emitter for debug events
   */
  constructor(signalingUrl: string, iceServers: RTCIceServer[], eventEmitter?: EventEmitter) {
    this.signalingUrl = signalingUrl;
    this.iceServers = iceServers;
    this.eventEmitter = eventEmitter || new EventEmitter();
  }

  /**
   * Establish WebRTC connection via WebSocket signaling
   * @returns Promise that resolves when connection is established
   */
  async connect(): Promise<void> {
    if (this.connected) return;

    return new Promise((resolve, reject) => {
      // Create WebSocket for signaling
      this.ws = new WebSocket(this.signalingUrl);

      this.ws.onopen = async () => {
        this.eventEmitter.emit('debug', { type: 'websocket', message: 'WebSocket connected' });

        // Create peer connection
        this.pc = new RTCPeerConnection({
          iceServers: this.iceServers
        });

        // Handle ICE candidates
        this.pc.onicecandidate = (event) => {
          if (event.candidate && this.ws) {
            this.eventEmitter.emit('debug', { type: 'ice', message: 'Sending ICE candidate' });
            this.ws.send(JSON.stringify({
              type: 'ice',
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex
            }));
          }
        };

        // Monitor connection state
        this.pc.onconnectionstatechange = () => {
          if (this.pc) {
            this.eventEmitter.emit('debug', {
              type: 'connection',
              message: `Peer connection state: ${this.pc.connectionState}`
            });
            if (this.pc.connectionState === 'failed') {
              reject(new Error('Peer connection failed'));
            }
          }
        };

        // Create data channel for latency measurements
        this.dataChannel = this.pc.createDataChannel('latency', {
          ordered: false,
          maxRetransmits: 0
        });

        // Handle data channel events
        this.dataChannel.onopen = () => {
          this.eventEmitter.emit('debug', { type: 'datachannel', message: 'Data channel opened - WebRTC ready!' });
          this.connected = true;
          resolve();
        };

        this.dataChannel.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.dataChannel.onerror = (error) => {
          this.eventEmitter.emit('debug', { type: 'error', message: 'Data channel error', error });
          reject(error);
        };

        this.dataChannel.onclose = () => {
          this.eventEmitter.emit('debug', { type: 'datachannel', message: 'Data channel closed' });
          this.connected = false;
        };

        // Create and send offer
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);

        this.eventEmitter.emit('debug', { type: 'signaling', message: 'Sending WebRTC offer' });
        this.ws!.send(JSON.stringify({
          type: 'offer',
          sdp: offer.sdp
        }));
      };

      this.ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === 'answer') {
          this.eventEmitter.emit('debug', { type: 'signaling', message: 'Received answer from server' });
          if (this.pc) {
            await this.pc.setRemoteDescription({
              type: 'answer',
              sdp: msg.sdp
            });
          }
        } else if (msg.type === 'ice') {
          this.eventEmitter.emit('debug', { type: 'ice', message: 'Received ICE candidate from server' });
          if (msg.candidate && this.pc) {
            try {
              const candidateInit: RTCIceCandidateInit = { candidate: msg.candidate };
              if (msg.sdpMid != null) candidateInit.sdpMid = msg.sdpMid;
              if (msg.sdpMLineIndex != null) candidateInit.sdpMLineIndex = msg.sdpMLineIndex;
              await this.pc.addIceCandidate(candidateInit);
            } catch (err) {
              this.eventEmitter.emit('debug', { type: 'error', message: 'Error adding ICE candidate', error: err });
            }
          }
        } else if (msg.type === 'error') {
          this.eventEmitter.emit('debug', { type: 'error', message: `Signaling error: ${msg.message}` });
          reject(new Error(msg.message));
        }
      };

      this.ws.onerror = (error) => {
        this.eventEmitter.emit('debug', { type: 'error', message: 'WebSocket error', error });
        reject(error);
      };

      this.ws.onclose = () => {
        this.eventEmitter.emit('debug', { type: 'websocket', message: 'WebSocket closed' });
        if (!this.connected) {
          reject(new Error('WebSocket closed before connection established'));
        }
      };

      // Timeout after 15 seconds (ICE negotiation can take time)
      setTimeout(() => {
        if (!this.connected) {
          this.eventEmitter.emit('debug', { type: 'error', message: 'WebRTC connection timeout' });
          reject(new Error('WebRTC connection timeout'));
        }
      }, 15000);
    });
  }

  /**
   * Send a latency probe and measure round-trip time
   * @returns Promise with latency measurement result
   */
  async measureLatency(): Promise<LatencyMeasurement> {
    if (!this.connected || !this.dataChannel) {
      throw new Error('WebRTC not connected');
    }

    return new Promise((resolve) => {
      const sequence = this.sequence++;
      const clientTimestamp = performance.now() * 1000; // Convert to microseconds

      // Create packet (48 bytes total)
      const packet = new ArrayBuffer(48);
      const view = new DataView(packet);

      // Sequence (4 bytes)
      view.setUint32(0, sequence, true);

      // Client timestamp (8 bytes)
      const timestampBigInt = BigInt(Math.floor(clientTimestamp));
      view.setBigUint64(4, timestampBigInt, true);

      // Send packet
      const sendTime = performance.now();
      this.dataChannel!.send(packet);

      // Register handler for response
      this.messageHandlers.set(sequence, (serverTimestamp: bigint) => {
        const receiveTime = performance.now();
        const rtt = receiveTime - sendTime;

        resolve({
          rtt: rtt,
          serverTimestamp: serverTimestamp,
          sequence: sequence
        });
      });

      // Timeout after 2 seconds
      setTimeout(() => {
        if (this.messageHandlers.has(sequence)) {
          this.messageHandlers.delete(sequence);
          resolve({ rtt: -1, serverTimestamp: 0n, sequence: sequence }); // Packet lost
        }
      }, 2000);
    });
  }

  /**
   * Handle incoming WebRTC packet
   * @param data - Packet data (ArrayBuffer)
   */
  private handleMessage(data: ArrayBuffer): void {
    // Parse received packet
    const view = new DataView(data);
    const sequence = view.getUint32(0, true);
    const serverTimestamp = view.getBigUint64(12, true);

    // Call handler if registered
    const handler = this.messageHandlers.get(sequence);
    if (handler) {
      handler(serverTimestamp);
      this.messageHandlers.delete(sequence);
    }
  }

  /**
   * Close WebRTC connection and clean up resources
   */
  close(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.messageHandlers.clear();
  }

  /**
   * Check if connection is established
   */
  get isConnected(): boolean {
    return this.connected;
  }
}
