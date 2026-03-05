# QOE Network Quality Test - Demo Application

This is a demonstration web application that uses the new qoe-js toolkit API with pre-built test plans.

## Features

- **Quality Mode (Cloudflare-style)**: Interleaved download/upload tests with loaded latency measurement
- **Speed Mode (Ookla-style)**: Maximum bandwidth test with 10+ parallel connections
- **Application Mode**: 5 application-specific test scenarios (Streaming, Gaming, Conference, VoIP, Browsing)

## How It Works

The application demonstrates the power of the new toolkit architecture:

1. **Pre-built Test Plans**: Imports `qualityModePlan`, `speedModePlan`, and application test plans directly from the library
2. **Configuration-Driven**: No manual HTTP/WebRTC calls - everything is declarative
3. **Observer Pattern**: Uses custom adapters to transform raw metrics for the UI:
   - `ChartUpdateAdapter` - Updates Chart.js instances in real-time
   - `MetricsDisplayAdapter` - Updates metric display elements
   - `ProgressAdapter` - Updates progress bar and status
   - `StatsAdapter` - Calculates statistics for box plots

## Running the Application

### Prerequisites

1. **Start the Go server** (in the parent directory):
   ```bash
   cd ..
   ./bin/qoe-server
   ```
   The server should be running at `http://localhost:3000`

2. **Serve the app** (from the qoe-js directory):
   ```bash
   cd app
   python3 -m http.server 8080
   ```
   Or use any other static file server

3. **Open in browser**:
   ```
   http://localhost:8080
   ```

### Testing

1. Select one or more test modes (Quality, Speed, Application)
2. Click "Start Test"
3. Watch real-time charts and metrics update
4. View final results with statistics and box plots

## File Structure

```
app/
├── index.html         # Main application (single-file, ~500 lines)
├── adapters.js        # Custom adapters for UI updates
├── calculations.js    # Helper functions (bufferbloat, quality score, activity ratings)
├── boxplot.js         # Box plot renderer
└── README.md          # This file
```

## How to Use the Toolkit in Your Own App

```javascript
// 1. Import library components (including pre-built test plans)
import {
    QOEClient,
    StatsAdapter,
    qualityModePlan,
    speedModePlan,
    gamingTestPlan
} from '@qoe/client/core';

// 2. Create QOE client
const client = new QOEClient();

// 3. Subscribe to metrics (optional)
const statsAdapter = new StatsAdapter();
client.subscribe(statsAdapter);

// 4. Execute a pre-built test plan
const result = await client.executeTestPlan(qualityModePlan);

// 5. Get transformed statistics
const stats = statsAdapter.getData();
console.log(stats.downloadBandwidth.stats.p90); // p90 download bandwidth
```

## Creating Custom Test Plans

You can also create your own test plans using the primitives:

```javascript
const myCustomPlan = {
  name: 'My Custom Test',
  description: 'Custom traffic pattern',
  steps: [
    {
      id: 'download-test',
      primitive: 'httpDownload',
      execution: { mode: 'sequential', repeat: { count: 5 } },
      config: { type: 'httpDownload', url: '/__down', size: 1_000_000 }
    },
    {
      id: 'upload-test',
      primitive: 'httpUpload',
      execution: { mode: 'parallel', concurrency: 3, repeat: { duration: 10000 } },
      config: { type: 'httpUpload', url: '/__up', size: 500_000 }
    }
  ]
};

await client.executeTestPlan(myCustomPlan);
```

## Primitives Available

- `httpDownload` - HTTP download with bandwidth measurement
- `httpUpload` - HTTP upload with bandwidth measurement
- `latencyProbe` - HTTP or WebRTC latency measurement
- `webrtcConnect` - Establish WebRTC connection
- `webrtcLatencyProbe` - WebRTC latency via DataChannel
- `packetStream` - Send/receive packet stream for packet loss

## Execution Modes

- `sequential` - One operation at a time
- `parallel` - N concurrent operations
- `burst` - Groups of N operations with intervals
- `timed` - Run for specified duration

## Pre-built Test Plans in the Library

All available from `@qoe/client/core`:

- `qualityModePlan` - Quality Mode (Cloudflare-style)
- `speedModePlan` - Speed Mode (Ookla-style)
- `streamingTestPlan` - Video Streaming test
- `gamingTestPlan` - Gaming Performance test
- `conferenceTestPlan` - Video Conferencing test
- `voipTestPlan` - VoIP Call Quality test
- `browsingTestPlan` - Web Browsing Performance test

## Next Steps

1. Integrate with React/Vue/Angular
2. Create custom test plan builder UI
3. Add test result export/import
4. Implement server discovery
5. Add more application-specific tests
