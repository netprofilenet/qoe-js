# QOE Client Library

A modern, tree-shakeable JavaScript library for measuring network quality of experience (QOE). Measure bandwidth, latency, jitter, and packet loss with WebRTC and HTTP-based tests.

## Features

- **Three Test Modes**: Quality (Cloudflare-style), Speed (Ookla-style), and Application-specific
- **Headless Core**: No UI dependencies, bring your own interface
- **Optional UI Helpers**: Chart.js integration and formatters
- **WebRTC Support**: Low-latency measurements with WebRTC DataChannels
- **Tree-shakeable**: Import only what you need (~45KB core, ~25KB UI)
- **TypeScript**: Full type definitions included
- **Customizable**: Full control over test parameters and server endpoints

## Installation

```bash
npm install @netprofile/qoe-js
```

Or build from source:
```bash
cd qoe-js
npm install
npm run build
```

## Quick Start

### Basic Usage (Headless)

```typescript
import { QOEClient } from '@netprofile/qoe-js/core';

const client = new QOEClient();

// Run quality test (Cloudflare-style)
const results = await client.runQualityTest();

console.log(`Download: ${results.download.bandwidthMbps} Mbps`);
console.log(`Upload: ${results.upload.bandwidthMbps} Mbps`);
console.log(`Idle Latency: ${results.idleLatency.median} ms`);
console.log(`Bufferbloat: ${results.bufferbloat} ms`);
console.log(`Packet Loss: ${results.packetLoss.lossPercent}%`);
console.log(`Quality Score: ${results.qualityScore}/100`);
```

### With Real-time Updates

```typescript
import { QOEClient } from '@netprofile/qoe-js/core';

const client = new QOEClient();

// Listen to progress events
client.on('progress', (event) => {
  console.log(`${event.currentPhase}: ${event.percentage}%`);
});

// Listen to sample events (real-time bandwidth/latency samples)
client.on('sample', (event) => {
  if (event.sampleType === 'download') {
    const mbps = event.sample.bandwidth / 1_000_000;
    console.log(`Download sample: ${mbps.toFixed(2)} Mbps`);
  }
});

// Run test
const results = await client.runQualityTest();
```

### Custom Configuration

```typescript
import { QOEClient } from '@netprofile/qoe-js/core';

const client = new QOEClient({
  // Customize download test sizes
  downloadTests: [
    { size: 100_000, samples: 5, label: '100kB' },
    { size: 1_000_000, samples: 3, label: '1MB' },
    { size: 10_000_000, samples: 2, label: '10MB' }
  ],

  // Customize upload test sizes
  uploadTests: [
    { size: 100_000, samples: 5, label: '100kB' },
    { size: 1_000_000, samples: 3, label: '1MB' }
  ],

  // Adjust latency measurement
  idleLatencyCount: 10,  // Number of samples

  // Adjust packet loss test
  packetLossCount: 500   // Number of packets
});

const results = await client.runQualityTest();
```

### Custom Server

```typescript
import { QOEClient } from '@netprofile/qoe-js/core';

const client = new QOEClient();

// Set custom server
client.setServer({
  id: 'my-server',
  name: 'My QOE Server',
  country: 'US',
  httpUrl: 'https://qoe.example.com',
  webrtcSignalingUrl: 'wss://qoe.example.com/signaling',
  stunServers: ['stun:stun.l.google.com:19302'],
  turnServers: [],
  enabled: true
});

const results = await client.runQualityTest();
```

### Speed Mode Test

```typescript
import { QOEClient } from '@netprofile/qoe-js/core';

const client = new QOEClient();
const results = await client.runSpeedTest();

console.log(`Max Download: ${results.download.bandwidthMbps} Mbps`);
console.log(`Max Upload: ${results.upload.bandwidthMbps} Mbps`);
```

## API Reference

### QOEClient

Main client class for running network quality tests.

#### Constructor

```typescript
new QOEClient(config?: TestConfig)
```

#### Methods

- `runQualityTest(): Promise<QualityResults>` - Run quality mode test
- `runSpeedTest(): Promise<SpeedResults>` - Run speed mode test
- `runApplicationTest(): Promise<ApplicationResults>` - Run application-specific tests
- `setServer(server: ServerInfo): void` - Set the test server
- `getServer(): ServerInfo` - Get the current test server
- `discoverBestServer(registryUrl: string): Promise<ServerInfo>` - Auto-discover best server
- `on(event: string, callback: Function): void` - Register event listener
- `off(event: string, callback: Function): void` - Unregister event listener
- `stop(): void` - Stop running tests
- `isRunning(): boolean` - Check if tests are running

#### Events

- `progress` - Test progress updates
- `sample` - Real-time bandwidth/latency samples
- `complete` - Test completed
- `error` - Error occurred
- `debug` - Debug information (WebRTC, signaling, etc.)

### Test Results

#### QualityResults

```typescript
{
  download: BandwidthResult;
  upload: BandwidthResult;
  idleLatency: LatencyResult;
  downloadLatency?: LatencyResult;
  uploadLatency?: LatencyResult;
  packetLoss: PacketLossResult;
  bufferbloat?: number;      // ms
  qualityScore?: number;     // 0-100
}
```

#### SpeedResults

```typescript
{
  download: BandwidthResult;
  upload: BandwidthResult;
  idleLatency: LatencyResult;
  packetLoss: PacketLossResult;
}
```

## Server Requirements

The library requires a compatible [qoe-go-server](https://github.com/netprofilenet/qoe-go-server) backend:

```bash
docker run -p 3000:3000 ghcr.io/netprofilenet/qoe-go-server:latest
```

Server endpoints:
- `GET /__down?bytes=N` — Download test
- `POST /__up` — Upload test
- `GET /__latency` — Latency probe
- `WS /signaling` — WebRTC signaling

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires WebRTC support for packet loss testing and low-latency measurements.

## Examples

Check the [examples](./examples) directory:
- `basic-headless.html` — Simple quality test

## Development

Build the library:
```bash
npm install
npm run build
```

Run tests:
```bash
npm test
```

## License

MIT
