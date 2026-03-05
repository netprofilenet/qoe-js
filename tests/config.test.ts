import { describe, it, expect } from 'vitest';
import { mergeConfig, getQualityModeConfig, getSpeedModeConfig } from '../src/core/config/TestConfig';

describe('getQualityModeConfig', () => {
  it('returns quality mode defaults', () => {
    const config = getQualityModeConfig();
    expect(config.downloadTests.length).toBeGreaterThan(0);
    expect(config.uploadTests.length).toBeGreaterThan(0);
    expect(config.idleLatencyCount).toBe(20);
    expect(config.bandwidthFinishDuration).toBe(1000);
  });
});

describe('getSpeedModeConfig', () => {
  it('returns speed mode defaults', () => {
    const config = getSpeedModeConfig();
    expect(config.downloadTests.length).toBeGreaterThan(0);
    expect(config.uploadTests.length).toBeGreaterThan(0);
    expect(config.speedTestDuration).toBe(15000);
    expect(config.speedTestMinConnections).toBe(10);
    expect(config.speedTestChunkSize).toBe(25_000_000);
  });

  it('has longer bandwidthFinishDuration than quality mode', () => {
    const quality = getQualityModeConfig();
    const speed = getSpeedModeConfig();
    expect(speed.bandwidthFinishDuration).toBeGreaterThan(quality.bandwidthFinishDuration);
  });
});

describe('mergeConfig', () => {
  it('returns quality defaults when called with no args', () => {
    const config = mergeConfig();
    expect(config.mode).toBe('quality');
    expect(config.idleLatencyCount).toBe(20);
  });

  it('returns speed defaults when mode is speed', () => {
    const config = mergeConfig({}, 'speed');
    expect(config.mode).toBe('speed');
    expect(config.speedTestDuration).toBe(15000);
  });

  it('overrides specific fields from user config', () => {
    const config = mergeConfig({ idleLatencyCount: 5 }, 'quality');
    expect(config.idleLatencyCount).toBe(5);
    // Other fields should still be defaults
    expect(config.bandwidthFinishDuration).toBe(1000);
  });

  it('preserves user downloadTests when provided', () => {
    const custom = [{ size: 500_000, samples: 3, label: '500kB' }];
    const config = mergeConfig({ downloadTests: custom }, 'quality');
    expect(config.downloadTests).toEqual(custom);
  });

  it('preserves appTests and serverConfig passthrough', () => {
    const config = mergeConfig({
      appTests: ['streaming', 'gaming'],
      serverConfig: { autoDiscover: true },
    }, 'quality');
    expect(config.appTests).toEqual(['streaming', 'gaming']);
    expect(config.serverConfig?.autoDiscover).toBe(true);
  });

  it('uses nullish coalescing (0 is a valid override)', () => {
    const config = mergeConfig({ packetLossCount: 0 }, 'quality');
    expect(config.packetLossCount).toBe(0);
  });
});
