/**
 * Speed Mode Test Plan (Ookla-style)
 *
 * Maximum bandwidth test with 10+ parallel connections.
 * Continuous downloads/uploads for 15 seconds each.
 */

import { TestPlan } from '../types/primitives';

export const speedModePlan: TestPlan = {
  name: 'Speed Mode Test (Ookla-style)',
  description: 'Maximum bandwidth with parallel connections',
  steps: [
    // 1. Idle latency (10 probes, 100ms interval)
    {
      id: 'idle-latency',
      name: 'Measure idle latency',
      primitive: 'latencyProbe',
      execution: {
        mode: 'sequential',
        repeat: { count: 10, interval: 100 }
      },
      config: {
        type: 'latencyProbe',
        url: '/__latency'
      }
    },

    // 2. Download speed test (10 parallel connections, 15 seconds, 25MB chunks)
    {
      id: 'download-speed',
      name: 'Maximum download speed',
      primitive: 'httpDownload',
      execution: {
        mode: 'parallel',
        concurrency: 10,
        repeat: { duration: 15000 }
      },
      config: {
        type: 'httpDownload',
        url: '/__down',
        size: 25_000_000
      },
      dependsOn: ['idle-latency']
    },

    // 3. Upload speed test (10 parallel connections, 15 seconds, 25MB chunks)
    {
      id: 'upload-speed',
      name: 'Maximum upload speed',
      primitive: 'httpUpload',
      execution: {
        mode: 'parallel',
        concurrency: 10,
        repeat: { duration: 15000 }
      },
      config: {
        type: 'httpUpload',
        url: '/__up',
        size: 25_000_000
      },
      dependsOn: ['download-speed']
    },

    // 4. WebRTC connection for packet loss
    {
      id: 'webrtc-connect',
      name: 'Connect WebRTC',
      primitive: 'webrtcConnect',
      execution: { mode: 'sequential' },
      config: {
        type: 'webrtcConnect',
        signalingUrl: '/signaling',
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      },
      dependsOn: ['upload-speed']
    },

    // 5. Packet loss test (500 packets, 20ms interval)
    {
      id: 'packet-loss',
      name: 'Packet loss measurement',
      primitive: 'packetStream',
      execution: { mode: 'timed' },
      config: {
        type: 'packetStream',
        connectionRef: 'webrtc-connect',
        packetCount: 500,
        interval: 20,
        packetSize: 48
      },
      dependsOn: ['webrtc-connect']
    }
  ]
};
