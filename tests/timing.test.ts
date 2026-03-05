import { describe, it, expect } from 'vitest';
import { msToMicroseconds, microsecondsToMs, requestId, sleep } from '../src/core/utils/timing';

describe('msToMicroseconds', () => {
  it('converts milliseconds to microseconds', () => {
    expect(msToMicroseconds(1)).toBe(1000);
    expect(msToMicroseconds(0)).toBe(0);
    expect(msToMicroseconds(2.5)).toBe(2500);
  });

  it('floors the result', () => {
    expect(msToMicroseconds(1.1)).toBe(1100);
    expect(msToMicroseconds(0.001)).toBe(1);
    expect(msToMicroseconds(0.0001)).toBe(0);
  });
});

describe('microsecondsToMs', () => {
  it('converts microseconds to milliseconds', () => {
    expect(microsecondsToMs(1000)).toBe(1);
    expect(microsecondsToMs(0)).toBe(0);
    expect(microsecondsToMs(500)).toBe(0.5);
  });
});

describe('requestId', () => {
  it('returns a non-empty string', () => {
    const id = requestId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns unique values on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => requestId()));
    // With 100 random IDs of 8 chars (base36), collisions should be extremely rare
    expect(ids.size).toBeGreaterThan(95);
  });
});

describe('sleep', () => {
  it('resolves after approximately the given duration', async () => {
    const start = performance.now();
    await sleep(50);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40); // Allow some timing slack
    expect(elapsed).toBeLessThan(200);
  });

  it('returns a promise', () => {
    const result = sleep(0);
    expect(result).toBeInstanceOf(Promise);
  });
});
