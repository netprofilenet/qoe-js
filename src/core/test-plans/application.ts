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
export const streamingTestPlan: TestPlan = {
  name: 'Video Streaming Test',
  description: 'Progressive bitrate testing (480p → 720p → 1080p → 4K)',
  steps: [
    // 480p quality (~1.5 Mbps)
    {
      id: 'bitrate-480p',
      name: '480p quality test',
      primitive: 'httpDownload',
      execution: { mode: 'sequential', repeat: { count: 5, interval: 100 } },
      config: {
        type: 'httpDownload',
        url: '/__down',
        size: 1_500_000  // ~1.5 Mbps for 8 seconds
      }
    },

    // 720p quality (~3 Mbps)
    {
      id: 'bitrate-720p',
      name: '720p quality test',
      primitive: 'httpDownload',
      execution: { mode: 'sequential', repeat: { count: 5, interval: 100 } },
      config: {
        type: 'httpDownload',
        url: '/__down',
        size: 3_000_000  // ~3 Mbps for 8 seconds
      },
      condition: { type: 'ifSuccess' },
      dependsOn: ['bitrate-480p']
    },

    // 1080p quality (~5 Mbps)
    {
      id: 'bitrate-1080p',
      name: '1080p quality test',
      primitive: 'httpDownload',
      execution: { mode: 'sequential', repeat: { count: 5, interval: 100 } },
      config: {
        type: 'httpDownload',
        url: '/__down',
        size: 5_000_000  // ~5 Mbps for 8 seconds
      },
      condition: { type: 'ifSuccess' },
      dependsOn: ['bitrate-720p']
    },

    // 4K quality (~15 Mbps)
    {
      id: 'bitrate-4k',
      name: '4K quality test',
      primitive: 'httpDownload',
      execution: { mode: 'sequential', repeat: { count: 5, interval: 100 } },
      config: {
        type: 'httpDownload',
        url: '/__down',
        size: 15_000_000  // ~15 Mbps for 8 seconds
      },
      condition: { type: 'ifSuccess' },
      dependsOn: ['bitrate-1080p']
    }
  ]
};

/**
 * 2. Gaming Performance Test
 * High-frequency latency probes to measure p99 latency and jitter
 */
export const gamingTestPlan: TestPlan = {
  name: 'Gaming Performance Test',
  description: 'Low-latency ping test with jitter measurement',
  steps: [
    // WebRTC connection for low-latency probes
    {
      id: 'webrtc-connect',
      name: 'Connect WebRTC',
      primitive: 'webrtcConnect',
      execution: { mode: 'sequential' },
      config: {
        type: 'webrtcConnect',
        signalingUrl: '/signaling',
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      }
    },

    // High-frequency latency probes (1000 samples @ 50 Hz = 20ms interval)
    {
      id: 'gaming-latency',
      name: 'Gaming latency test',
      primitive: 'webrtcLatencyProbe',
      execution: {
        mode: 'sequential',
        repeat: { count: 1000, interval: 20 }  // 50 Hz
      },
      config: {
        type: 'webrtcLatencyProbe',
        connectionRef: 'webrtc-connect'
      },
      dependsOn: ['webrtc-connect']
    }
  ]
};

/**
 * 3. Video Conferencing Test
 * Bidirectional bursty packet streams simulating 720p video call
 */
export const conferenceTestPlan: TestPlan = {
  name: 'Video Conferencing Test',
  description: 'Bidirectional bursty traffic simulating 720p video call',
  steps: [
    // WebRTC connection
    {
      id: 'webrtc-connect',
      name: 'Connect WebRTC',
      primitive: 'webrtcConnect',
      execution: { mode: 'sequential' },
      config: {
        type: 'webrtcConnect',
        signalingUrl: '/signaling',
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      }
    },

    // Upstream video (52 packets every 10ms = ~2 Mbps for 720p)
    {
      id: 'upstream-video',
      name: 'Upstream video stream',
      primitive: 'packetStream',
      execution: {
        mode: 'burst',
        burst: { size: 52, interval: 10 },
        repeat: { duration: 30000 }  // 30 seconds
      },
      config: {
        type: 'packetStream',
        connectionRef: 'webrtc-connect',
        packetCount: 156000,  // 52 packets * 100 bursts/sec * 30 sec
        interval: 10,
        packetSize: 48
      },
      dependsOn: ['webrtc-connect']
    },

    // Background latency probes (for jitter measurement)
    {
      id: 'jitter-measurement',
      name: 'Jitter measurement',
      primitive: 'webrtcLatencyProbe',
      execution: {
        mode: 'sequential',
        repeat: { count: 300, interval: 100 }
      },
      config: {
        type: 'webrtcLatencyProbe',
        connectionRef: 'webrtc-connect'
      },
      dependsOn: ['webrtc-connect']
    }
  ]
};

/**
 * 4. VoIP Call Quality Test
 * Sequential packet stream simulating G.711 codec (64kbps, 20ms packets)
 */
export const voipTestPlan: TestPlan = {
  name: 'VoIP Call Quality Test',
  description: 'G.711 codec simulation (64kbps, 20ms packets)',
  steps: [
    // WebRTC connection
    {
      id: 'webrtc-connect',
      name: 'Connect WebRTC',
      primitive: 'webrtcConnect',
      execution: { mode: 'sequential' },
      config: {
        type: 'webrtcConnect',
        signalingUrl: '/signaling',
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      }
    },

    // VoIP packet stream (G.711: 64kbps, 20ms packets = 160 bytes per packet)
    {
      id: 'voip-stream',
      name: 'VoIP packet stream',
      primitive: 'packetStream',
      execution: {
        mode: 'sequential',
        repeat: { count: 3000, interval: 20 }  // 60 seconds of voice
      },
      config: {
        type: 'packetStream',
        connectionRef: 'webrtc-connect',
        packetCount: 3000,
        interval: 20,
        packetSize: 48  // Simplified packet size
      },
      dependsOn: ['webrtc-connect']
    }
  ]
};

/**
 * 5. Web Browsing Performance Test
 * Simulates typical webpage load pattern
 */
export const browsingTestPlan: TestPlan = {
  name: 'Web Browsing Performance Test',
  description: 'Typical webpage load pattern',
  steps: [
    // Initial HTML fetch (single connection)
    {
      id: 'html-fetch',
      name: 'HTML fetch',
      primitive: 'httpDownload',
      execution: { mode: 'sequential' },
      config: {
        type: 'httpDownload',
        url: '/__down',
        size: 50_000  // 50KB HTML
      }
    },

    // Parallel resource fetching (CSS, JS, images)
    // 6 parallel connections (typical browser limit)
    {
      id: 'resource-fetch',
      name: 'Resource fetch',
      primitive: 'httpDownload',
      execution: {
        mode: 'parallel',
        concurrency: 6,
        repeat: { count: 20 }  // 20 resources
      },
      config: {
        type: 'httpDownload',
        url: '/__down',
        size: 100_000  // 100KB average resource size
      },
      dependsOn: ['html-fetch']
    },

    // Measure latency during page load
    {
      id: 'page-load-latency',
      name: 'Page load latency',
      primitive: 'latencyProbe',
      execution: {
        mode: 'sequential',
        repeat: { count: 10, interval: 100 }
      },
      config: {
        type: 'latencyProbe',
        url: '/__latency'
      },
      dependsOn: ['html-fetch']
    }
  ]
};
