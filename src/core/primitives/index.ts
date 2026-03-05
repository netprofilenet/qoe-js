/**
 * Primitive network operation functions
 *
 * These are stateless, single-purpose functions that perform atomic network operations.
 * They accept configuration and context, execute the operation, and return results.
 */

import { generateRandomData } from '../utils/random';
import { serializeWebRTCPacket, deserializeWebRTCPacket } from '../webrtc/PacketProtocol';
import { sleep, requestId, getUploadDuration, clearResourceTimings } from '../utils/timing';
import {
  PrimitiveResult,
  ExecutionContext,
  PrimitiveConfig
} from '../types/primitives';

/**
 * HTTP Download Primitive
 * Downloads data from an HTTP endpoint and measures bandwidth
 */
export async function httpDownload(
  config: PrimitiveConfig,
  context: ExecutionContext
): Promise<PrimitiveResult> {
  // Type guard
  if (config.type !== 'httpDownload') {
    throw new Error('Invalid config type for httpDownload');
  }
  const timestamp = performance.now();
  const url = config.baseUrl ? `${config.baseUrl}${config.url}` : config.url;

  try {
    const fullUrl = `${url}?bytes=${config.size}`;

    // Time the full fetch cycle: request send + TTFB + body download.
    // TTFB is tiny (GET request), so duration ≈ body transfer time.
    // arrayBuffer() blocks until the browser has received all bytes
    // through the network (including any throttle), giving accurate timing.
    const start = performance.now();
    const response = await fetch(fullUrl, { signal: context.signal });
    const buffer = await response.arrayBuffer();
    const totalBytes = buffer.byteLength;
    const duration = Math.max(performance.now() - start, 0.001);

    const bandwidth = (totalBytes * 8) / (duration / 1000);  // bits per second

    return {
      timestamp,
      duration,
      success: true,
      data: {
        bytesReceived: totalBytes,
        bandwidth
      }
    };
  } catch (error) {
    return {
      timestamp,
      duration: performance.now() - timestamp,
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * HTTP Upload Primitive
 * Uploads data to an HTTP endpoint and measures bandwidth
 */
export async function httpUpload(
  config: PrimitiveConfig,
  context: ExecutionContext
): Promise<PrimitiveResult> {
  // Type guard
  if (config.type !== 'httpUpload') {
    throw new Error('Invalid config type for httpUpload');
  }
  const timestamp = performance.now();
  const url = config.baseUrl ? `${config.baseUrl}${config.url}` : config.url;

  try {
    // Generate random data for upload (outside timing window)
    const data = generateRandomData(config.size);

    const rid = requestId();
    const fullUrl = `${url}?_rid=${rid}`;

    // Start timing after data is ready — only measure the actual transfer
    const transferStart = performance.now();
    const response = await fetch(fullUrl, {
      method: 'POST',
      body: data,
      headers: { 'Content-Type': 'application/octet-stream' },
      signal: context.signal
    });

    // Consume response body so ResourceTiming entry finalizes
    await response.text();
    const fallbackDuration = performance.now() - transferStart;

    // Prefer PerformanceResourceTiming (browser-internal, no JS jitter)
    const rtDuration = getUploadDuration(fullUrl);
    const duration = Math.max((rtDuration ?? fallbackDuration), 0.001);
    clearResourceTimings();

    const bandwidth = (config.size * 8) / (duration / 1000);  // bits per second

    return {
      timestamp,
      duration,
      success: true,
      data: {
        bytesUploaded: config.size,
        bandwidth,
        timingSource: rtDuration !== null ? 'resource-timing' : 'fallback'
      }
    };
  } catch (error) {
    return {
      timestamp,
      duration: performance.now() - timestamp,
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Latency Probe Primitive
 * Measures round-trip latency using HTTP or WebRTC
 */
export async function latencyProbe(
  config: PrimitiveConfig,
  context: ExecutionContext
): Promise<PrimitiveResult> {
  // Type guard
  if (config.type !== 'latencyProbe') {
    throw new Error('Invalid config type for latencyProbe');
  }
  const timestamp = performance.now();

  try {
    let rtt: number;

    if (config.useWebRTC && config.connectionRef) {
      // Use WebRTC connection from context
      const connectionResult = context.results.get(config.connectionRef);
      if (!connectionResult || !connectionResult.primitiveResults[0]?.data?.connection) {
        throw new Error(`WebRTC connection not found: ${config.connectionRef}`);
      }

      const webrtcConn = connectionResult.primitiveResults[0].data.connection;
      const result = await webrtcConn.measureLatency();
      rtt = result.rtt;

      if (rtt < 0) {
        // Packet loss indicated by negative RTT
        throw new Error('Packet loss detected');
      }
    } else {
      // Use HTTP
      const url = config.baseUrl ? `${config.baseUrl}${config.url}` : config.url;
      const start = performance.now();
      await fetch(url, { signal: context.signal });
      rtt = performance.now() - start;
    }

    return {
      timestamp,
      duration: rtt,
      success: true,
      data: {
        latency: rtt
      }
    };
  } catch (error) {
    return {
      timestamp,
      duration: performance.now() - timestamp,
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * WebRTC Connection Primitive
 * Establishes a WebRTC connection via WebSocket signaling
 */
export async function webrtcConnect(
  config: PrimitiveConfig,
  _context: ExecutionContext
): Promise<PrimitiveResult> {
  // Type guard
  if (config.type !== 'webrtcConnect') {
    throw new Error('Invalid config type for webrtcConnect');
  }
  const timestamp = performance.now();

  try {
    // Create WebSocket for signaling
    const ws = new WebSocket(config.signalingUrl);

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error('WebSocket connection failed'));
      setTimeout(() => reject(new Error('WebSocket timeout')), 5000);
    });

    // Create peer connection
    const pc = new RTCPeerConnection({
      iceServers: config.iceServers
    });

    // Create data channel
    const dc = pc.createDataChannel('qoe-data', {
      ordered: false,
      maxRetransmits: 0
    });

    dc.binaryType = 'arraybuffer';

    // Promise that resolves when DataChannel opens (event-based, no polling)
    const dataChannelReady = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('DataChannel timeout after 3 seconds'));
      }, 3000);

      dc.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };

      dc.onerror = (err) => {
        clearTimeout(timeout);
        reject(new Error('DataChannel error: ' + err));
      };

      // If already open, resolve immediately
      if (dc.readyState === 'open') {
        clearTimeout(timeout);
        resolve();
      }
    });

    // Set up ICE candidate handling BEFORE sending offer
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

    // Set up message handler for answer and ICE candidates
    const answerPromise = new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Answer timeout after 3 seconds'));
      }, 3000);

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'answer') {
          clearTimeout(timeout);
          resolve(msg);
        } else if (msg.type === 'ice') {
          // Handle ICE candidate
          if (!msg.candidate) {
            // End-of-candidates signal
            return;
          }

          const candidateInit: RTCIceCandidateInit = { candidate: msg.candidate };
          if (msg.sdpMid != null) candidateInit.sdpMid = msg.sdpMid;
          if (msg.sdpMLineIndex != null) candidateInit.sdpMLineIndex = msg.sdpMLineIndex;
          if (candidateInit.sdpMid != null || candidateInit.sdpMLineIndex != null) {
            pc.addIceCandidate(new RTCIceCandidate(candidateInit)).catch(() => {});
          }
        }
      };
    });

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    ws.send(JSON.stringify({
      type: 'offer',
      sdp: offer.sdp
    }));

    // Wait for answer with timeout
    const answer = await answerPromise;
    await pc.setRemoteDescription({ type: 'answer', sdp: answer.sdp });

    // Wait for data channel to open (event-based, no polling)
    await dataChannelReady;

    const duration = performance.now() - timestamp;

    // Return connection object for future use
    return {
      timestamp,
      duration,
      success: true,
      data: {
        connection: {
          ws,
          pc,
          dc,
          measureLatency: async () => {
            // Simple ping-pong latency measurement using addEventListener to support concurrent probes
            const start = performance.now();

            return new Promise<{ rtt: number }>((resolve) => {
              const timeout = setTimeout(() => {
                dc.removeEventListener('message', handler);
                resolve({ rtt: -1 });  // Timeout indicates packet loss
              }, 1000);

              const handler = () => {
                // Any response completes the probe (server echoes packets)
                clearTimeout(timeout);
                dc.removeEventListener('message', handler);
                const rtt = performance.now() - start;
                resolve({ rtt });
              };

              dc.addEventListener('message', handler);

              // Send ping packet
              const pingPacket = new Uint8Array(48);
              dc.send(pingPacket);
            });
          },
          close: () => {
            ws.close();
            pc.close();
          }
        }
      }
    };
  } catch (error) {
    return {
      timestamp,
      duration: performance.now() - timestamp,
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * WebRTC Latency Probe Primitive
 * Measures latency using an existing WebRTC connection
 */
export async function webrtcLatencyProbe(
  config: PrimitiveConfig,
  context: ExecutionContext
): Promise<PrimitiveResult> {
  // Type guard
  if (config.type !== 'webrtcLatencyProbe') {
    throw new Error('Invalid config type for webrtcLatencyProbe');
  }
  const timestamp = performance.now();

  try {
    // Get WebRTC connection from context
    const connectionResult = context.results.get(config.connectionRef);
    if (!connectionResult || !connectionResult.primitiveResults[0]?.data?.connection) {
      throw new Error(`WebRTC connection not found: ${config.connectionRef}`);
    }

    const webrtcConn = connectionResult.primitiveResults[0].data.connection;
    const result = await webrtcConn.measureLatency();

    if (result.rtt < 0) {
      throw new Error('Latency measurement failed (packet loss)');
    }

    return {
      timestamp,
      duration: result.rtt,
      success: true,
      data: {
        latency: result.rtt
      }
    };
  } catch (error) {
    return {
      timestamp,
      duration: performance.now() - timestamp,
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Packet Stream Primitive
 * Sends/receives packet stream for packet loss measurement or bidirectional traffic
 */
export async function packetStream(
  config: PrimitiveConfig,
  context: ExecutionContext
): Promise<PrimitiveResult> {
  // Type guard
  if (config.type !== 'packetStream') {
    throw new Error('Invalid config type for packetStream');
  }
  const timestamp = performance.now();

  try {
    // Get WebRTC connection from context
    const connectionResult = context.results.get(config.connectionRef);
    if (!connectionResult || !connectionResult.primitiveResults[0]?.data?.connection) {
      throw new Error(`WebRTC connection not found: ${config.connectionRef}`);
    }

    const webrtcConn = connectionResult.primitiveResults[0].data.connection;
    const dc = webrtcConn.dc;

    const packetsSent: number[] = [];
    const packetsReceived = new Set<number>();

    // Set up receive handler
    dc.onmessage = (evt: MessageEvent) => {
      const packet = deserializeWebRTCPacket(
        evt.data instanceof ArrayBuffer ? new Uint8Array(evt.data) : evt.data
      );
      if (packet) {
        packetsReceived.add(packet.sequence);
      }
    };

    if (!config.receiveOnly) {
      // Send packets at regular intervals
      for (let i = 0; i < config.packetCount; i++) {
        if (context.signal.aborted) break;

        if (dc.readyState === 'open') {
          const binaryPacket = serializeWebRTCPacket(i, performance.now());
          dc.send(binaryPacket);
          packetsSent.push(i);
        }

        await sleep(config.interval);
      }

      // Wait for final packets to arrive
      await sleep(2000);
    } else {
      // Receive-only mode (for bidirectional tests)
      const duration = config.packetCount * config.interval + 2000;
      await sleep(duration);
    }

    const finalDuration = performance.now() - timestamp;

    // Calculate results
    const sent = packetsSent.length;
    const received = packetsReceived.size;
    const lossRatio = sent > 0 ? 1 - (received / sent) : 0;
    const lostSequences = packetsSent.filter(seq => !packetsReceived.has(seq));

    return {
      timestamp,
      duration: finalDuration,
      success: true,
      data: {
        sent,
        received,
        lossRatio,
        lossPercent: lossRatio * 100,
        lostSequences
      }
    };
  } catch (error) {
    return {
      timestamp,
      duration: performance.now() - timestamp,
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Export all primitives as a registry for easy lookup
 */
export const PRIMITIVES = {
  httpDownload,
  httpUpload,
  latencyProbe,
  webrtcConnect,
  webrtcLatencyProbe,
  packetStream
};
