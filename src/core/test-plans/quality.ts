/**
 * Quality Mode Test Plan (Cloudflare-style)
 *
 * Interleaved download/upload tests with loaded latency measurement.
 * Progressive file sizes: 100kB, 1MB, 10MB, 25MB, 100MB
 * Pattern for each size: download → loaded latency → upload → loaded latency
 */

import { TestPlan } from '../types/primitives';

export const qualityModePlan: TestPlan = {
  name: 'Quality Mode Test (Cloudflare-style)',
  description: 'Interleaved bandwidth with loaded latency measurement',
  steps: [
    // 1. WebRTC connection for all latency tests
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

    // 2. Idle latency measurement via WebRTC (20 probes, no artificial delay)
    {
      id: 'idle-latency',
      name: 'Measure idle latency',
      primitive: 'webrtcLatencyProbe',
      execution: {
        mode: 'sequential',
        repeat: { count: 20 }
      },
      config: {
        type: 'webrtcLatencyProbe',
        connectionRef: 'webrtc-connect'
      },
      dependsOn: ['webrtc-connect']
    },

    // === 100kB SIZE ===
    // 3. Download 100kB
    {
      id: 'download-100kb',
      name: 'Download 100kB',
      primitive: 'httpDownload',
      execution: { mode: 'sequential', repeat: { count: 10 } },
      config: { type: 'httpDownload', url: '/__down', size: 100_000 },
      dependsOn: ['idle-latency']
    },
    // 4. Loaded latency during 100kB download
    {
      id: 'loaded-latency-download-100kb',
      name: 'Loaded latency (100kB download)',
      primitive: 'webrtcLatencyProbe',
      execution: { mode: 'sequential', repeat: { count: 5 } },
      config: { type: 'webrtcLatencyProbe', connectionRef: 'webrtc-connect' },
      dependsOn: ['webrtc-connect']
    },
    // 5. Upload 100kB
    {
      id: 'upload-100kb',
      name: 'Upload 100kB',
      primitive: 'httpUpload',
      execution: { mode: 'sequential', repeat: { count: 10 } },
      config: { type: 'httpUpload', url: '/__up', size: 100_000 },
      dependsOn: ['download-100kb']
    },
    // 6. Loaded latency during 100kB upload
    {
      id: 'loaded-latency-upload-100kb',
      name: 'Loaded latency (100kB upload)',
      primitive: 'webrtcLatencyProbe',
      execution: { mode: 'sequential', repeat: { count: 5 } },
      config: { type: 'webrtcLatencyProbe', connectionRef: 'webrtc-connect' },
      dependsOn: ['upload-100kb']
    },

    // === 1MB SIZE ===
    // 7. Download 1MB
    {
      id: 'download-1mb',
      name: 'Download 1MB',
      primitive: 'httpDownload',
      execution: { mode: 'sequential', repeat: { count: 10 } },
      config: { type: 'httpDownload', url: '/__down', size: 1_000_000 },
      dependsOn: ['loaded-latency-upload-100kb']
    },
    // 8. Loaded latency during 1MB download
    {
      id: 'loaded-latency-download-1mb',
      name: 'Loaded latency (1MB download)',
      primitive: 'webrtcLatencyProbe',
      execution: { mode: 'sequential', repeat: { count: 5 } },
      config: { type: 'webrtcLatencyProbe', connectionRef: 'webrtc-connect' },
      dependsOn: ['webrtc-connect']
    },
    // 9. Upload 1MB
    {
      id: 'upload-1mb',
      name: 'Upload 1MB',
      primitive: 'httpUpload',
      execution: { mode: 'sequential', repeat: { count: 10 } },
      config: { type: 'httpUpload', url: '/__up', size: 1_000_000 },
      dependsOn: ['download-1mb']
    },
    // 10. Loaded latency during 1MB upload
    {
      id: 'loaded-latency-upload-1mb',
      name: 'Loaded latency (1MB upload)',
      primitive: 'webrtcLatencyProbe',
      execution: { mode: 'sequential', repeat: { count: 5 } },
      config: { type: 'webrtcLatencyProbe', connectionRef: 'webrtc-connect' },
      dependsOn: ['upload-1mb']
    },

    // === 10MB SIZE ===
    // 11. Download 10MB
    {
      id: 'download-10mb',
      name: 'Download 10MB',
      primitive: 'httpDownload',
      execution: { mode: 'sequential', repeat: { count: 10 } },
      config: { type: 'httpDownload', url: '/__down', size: 10_000_000 },
      dependsOn: ['loaded-latency-upload-1mb']
    },
    // 12. Loaded latency during 10MB download
    {
      id: 'loaded-latency-download-10mb',
      name: 'Loaded latency (10MB download)',
      primitive: 'webrtcLatencyProbe',
      execution: { mode: 'sequential', repeat: { count: 5 } },
      config: { type: 'webrtcLatencyProbe', connectionRef: 'webrtc-connect' },
      dependsOn: ['webrtc-connect']
    },
    // 13. Upload 10MB
    {
      id: 'upload-10mb',
      name: 'Upload 10MB',
      primitive: 'httpUpload',
      execution: { mode: 'sequential', repeat: { count: 10 } },
      config: { type: 'httpUpload', url: '/__up', size: 10_000_000 },
      dependsOn: ['download-10mb']
    },
    // 14. Loaded latency during 10MB upload
    {
      id: 'loaded-latency-upload-10mb',
      name: 'Loaded latency (10MB upload)',
      primitive: 'webrtcLatencyProbe',
      execution: { mode: 'sequential', repeat: { count: 5 } },
      config: { type: 'webrtcLatencyProbe', connectionRef: 'webrtc-connect' },
      dependsOn: ['upload-10mb']
    },

    // === 25MB SIZE ===
    // 15. Download 25MB
    {
      id: 'download-25mb',
      name: 'Download 25MB',
      primitive: 'httpDownload',
      execution: { mode: 'sequential', repeat: { count: 10 } },
      config: { type: 'httpDownload', url: '/__down', size: 25_000_000 },
      dependsOn: ['loaded-latency-upload-10mb']
    },
    // 16. Loaded latency during 25MB download
    {
      id: 'loaded-latency-download-25mb',
      name: 'Loaded latency (25MB download)',
      primitive: 'webrtcLatencyProbe',
      execution: { mode: 'sequential', repeat: { count: 5 } },
      config: { type: 'webrtcLatencyProbe', connectionRef: 'webrtc-connect' },
      dependsOn: ['webrtc-connect']
    },
    // 17. Upload 25MB
    {
      id: 'upload-25mb',
      name: 'Upload 25MB',
      primitive: 'httpUpload',
      execution: { mode: 'sequential', repeat: { count: 10 } },
      config: { type: 'httpUpload', url: '/__up', size: 25_000_000 },
      dependsOn: ['download-25mb']
    },
    // 18. Loaded latency during 25MB upload
    {
      id: 'loaded-latency-upload-25mb',
      name: 'Loaded latency (25MB upload)',
      primitive: 'webrtcLatencyProbe',
      execution: { mode: 'sequential', repeat: { count: 5 } },
      config: { type: 'webrtcLatencyProbe', connectionRef: 'webrtc-connect' },
      dependsOn: ['upload-25mb']
    },

    // === 100MB SIZE ===
    // 19. Download 100MB
    {
      id: 'download-100mb',
      name: 'Download 100MB',
      primitive: 'httpDownload',
      execution: { mode: 'sequential', repeat: { count: 10 } },
      config: { type: 'httpDownload', url: '/__down', size: 100_000_000 },
      dependsOn: ['loaded-latency-upload-25mb']
    },
    // 20. Loaded latency during 100MB download
    {
      id: 'loaded-latency-download-100mb',
      name: 'Loaded latency (100MB download)',
      primitive: 'webrtcLatencyProbe',
      execution: { mode: 'sequential', repeat: { count: 5 } },
      config: { type: 'webrtcLatencyProbe', connectionRef: 'webrtc-connect' },
      dependsOn: ['webrtc-connect']
    },
    // 21. Upload 50MB (reduced from 100MB to match original implementation)
    {
      id: 'upload-50mb',
      name: 'Upload 50MB',
      primitive: 'httpUpload',
      execution: { mode: 'sequential', repeat: { count: 10 } },
      config: { type: 'httpUpload', url: '/__up', size: 50_000_000 },
      dependsOn: ['download-100mb']
    },
    // 22. Loaded latency during 50MB upload
    {
      id: 'loaded-latency-upload-50mb',
      name: 'Loaded latency (50MB upload)',
      primitive: 'webrtcLatencyProbe',
      execution: { mode: 'sequential', repeat: { count: 5 } },
      config: { type: 'webrtcLatencyProbe', connectionRef: 'webrtc-connect' },
      dependsOn: ['upload-50mb']
    },

    // 23. Packet loss test
    {
      id: 'packet-loss',
      name: 'Packet loss measurement',
      primitive: 'packetStream',
      execution: { mode: 'timed' },
      config: {
        type: 'packetStream',
        connectionRef: 'webrtc-connect',
        packetCount: 1000,
        interval: 10,
        packetSize: 48
      },
      dependsOn: ['webrtc-connect', 'loaded-latency-upload-50mb']
    }
  ]
};
