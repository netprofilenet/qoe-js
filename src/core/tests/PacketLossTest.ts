/**
 * Packet loss measurement using WebRTC DataChannels
 */

import { EventEmitter } from '../utils/events';
import { sleep } from '../utils/timing';
import { serializeWebRTCPacket, deserializeWebRTCPacket } from '../webrtc/PacketProtocol';
import { PacketLossResult } from '../types/results';

export interface PacketLossTestConfig {
  webrtcSignalingUrl: string;
  iceServers: RTCIceServer[];
  packetLossCount: number;      // number of packets to send
  packetLossDuration: number;   // ms - total test duration
}

export class PacketLossTest {
  private config: PacketLossTestConfig;
  private eventEmitter: EventEmitter;
  private stopRequested: boolean = false;

  constructor(config: PacketLossTestConfig, eventEmitter: EventEmitter) {
    this.config = config;
    this.eventEmitter = eventEmitter;
  }

  /**
   * Request the test to stop gracefully
   */
  stop(): void {
    this.stopRequested = true;
  }

  /**
   * Measure packet loss using unreliable WebRTC DataChannels
   * @returns PacketLossResult with loss ratio and lost packet sequences
   */
  async measure(): Promise<PacketLossResult> {
    this.stopRequested = false;

    try {
      // Create WebSocket for signaling
      const ws = new WebSocket(this.config.webrtcSignalingUrl);

      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = () => reject(new Error('WebSocket connection failed'));
        setTimeout(() => reject(new Error('WebSocket timeout')), 5000);
      });

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: this.config.iceServers
      });

      // Create unreliable data channel for packet loss testing
      const dc = pc.createDataChannel('packet-loss', {
        ordered: false,        // No ordering
        maxRetransmits: 0      // No retransmissions (unreliable)
      });

      dc.binaryType = 'arraybuffer';

      let dataChannelOpen = false;
      dc.onopen = () => {
        dataChannelOpen = true;
        this.eventEmitter.emit('debug', {
          type: 'debug',
          message: 'Packet loss DataChannel opened'
        });
      };

      const packetsSent: number[] = [];
      const packetsReceived = new Set<number>();

      dc.onmessage = (event) => {
        const packet = deserializeWebRTCPacket(event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : event.data);
        if (packet) {
          packetsReceived.add(packet.sequence);

          // Emit progress event
          this.eventEmitter.emit('progress', {
            type: 'progress',
            testMode: 'quality',
            currentPhase: 'Packet Loss Test',
            percentage: Math.round((packetsReceived.size / this.config.packetLossCount) * 100),
            currentTest: `Received ${packetsReceived.size}/${packetsSent.length} packets`
          });
        }
      };

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      ws.send(JSON.stringify({
        type: 'offer',
        sdp: offer.sdp
      }));

      // Wait for answer and handle ICE candidates
      const answer = await new Promise<any>((resolve) => {
        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.type === 'answer') {
            resolve(msg);
          } else if (msg.type === 'ice') {
            // Handle ICE candidate
            const candidateInit: RTCIceCandidateInit = { candidate: msg.candidate };
            if (msg.sdpMid != null) candidateInit.sdpMid = msg.sdpMid;
            if (msg.sdpMLineIndex != null) candidateInit.sdpMLineIndex = msg.sdpMLineIndex;
            if (candidateInit.sdpMid != null || candidateInit.sdpMLineIndex != null) {
              pc.addIceCandidate(new RTCIceCandidate(candidateInit)).catch(err => {
                this.eventEmitter.emit('debug', {
                  type: 'debug',
                  message: `Failed to add ICE candidate: ${err}`
                });
              });
            }
          }
        };
      });

      await pc.setRemoteDescription({ type: 'answer', sdp: answer.sdp });

      // Send ICE candidates to server
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          ws.send(JSON.stringify({
            type: 'ice',
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex
          }));
        }
      };

      // Wait for data channel to open
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (dataChannelOpen) {
            clearInterval(check);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(check);
          resolve();
        }, 5000);
      });

      // Send packets at regular intervals
      const interval = this.config.packetLossDuration / this.config.packetLossCount;
      for (let i = 0; i < this.config.packetLossCount; i++) {
        if (this.stopRequested) break;

        if (dc.readyState === 'open') {
          const binaryPacket = serializeWebRTCPacket(i, performance.now());
          dc.send(binaryPacket);
          packetsSent.push(i);

          // Emit progress event
          this.eventEmitter.emit('progress', {
            type: 'progress',
            testMode: 'quality',
            currentPhase: 'Packet Loss Test',
            percentage: Math.round((i / this.config.packetLossCount) * 100),
            currentTest: `Sent ${packetsSent.length}/${this.config.packetLossCount} packets`
          });
        }

        await sleep(interval);
      }

      // Wait for final packets to arrive
      await sleep(2000);

      // Clean up
      ws.close();
      pc.close();

      // Calculate results
      const sent = packetsSent.length;
      const received = packetsReceived.size;
      const lossRatio = sent > 0 ? 1 - (received / sent) : 0;
      const lostSequences = packetsSent.filter(seq => !packetsReceived.has(seq));

      return {
        sent,
        received,
        lossRatio,
        lossPercent: lossRatio * 100,
        lostSequences
      };

    } catch (err) {
      this.eventEmitter.emit('error', {
        type: 'error',
        error: err instanceof Error ? err : new Error(String(err)),
        context: 'Packet loss test'
      });

      // Return zero results on error
      return {
        sent: 0,
        received: 0,
        lossRatio: 0,
        lossPercent: 0,
        lostSequences: []
      };
    }
  }
}
