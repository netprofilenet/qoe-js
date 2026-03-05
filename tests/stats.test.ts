import { describe, it, expect } from 'vitest';
import { calculateMedian, calculatePercentile, calculateStats } from '../src/core/utils/stats';

describe('calculateMedian', () => {
  it('returns 0 for empty array', () => {
    expect(calculateMedian([])).toBe(0);
  });

  it('returns the single value for array of one', () => {
    expect(calculateMedian([42])).toBe(42);
  });

  it('returns middle value for odd-length array', () => {
    expect(calculateMedian([3, 1, 2])).toBe(2);
  });

  it('returns average of two middle values for even-length array', () => {
    expect(calculateMedian([4, 1, 3, 2])).toBe(2.5);
  });

  it('does not mutate the input array', () => {
    const input = [5, 3, 1, 4, 2];
    const copy = [...input];
    calculateMedian(input);
    expect(input).toEqual(copy);
  });

  it('handles duplicate values', () => {
    expect(calculateMedian([5, 5, 5, 5])).toBe(5);
  });
});

describe('calculatePercentile', () => {
  it('returns 0 for empty array', () => {
    expect(calculatePercentile([], 50)).toBe(0);
  });

  it('returns the single value for any percentile on array of one', () => {
    expect(calculatePercentile([10], 10)).toBe(10);
    expect(calculatePercentile([10], 90)).toBe(10);
  });

  it('returns min for p0-ish', () => {
    const values = [10, 20, 30, 40, 50];
    expect(calculatePercentile(values, 1)).toBe(10);
  });

  it('returns max for p100', () => {
    const values = [10, 20, 30, 40, 50];
    expect(calculatePercentile(values, 100)).toBe(50);
  });

  it('computes p50 close to median', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const p50 = calculatePercentile(values, 50);
    expect(p50).toBe(5);
  });

  it('does not mutate the input array', () => {
    const input = [50, 30, 10, 40, 20];
    const copy = [...input];
    calculatePercentile(input, 75);
    expect(input).toEqual(copy);
  });
});

describe('calculateStats', () => {
  it('returns zeros for empty array', () => {
    const stats = calculateStats([]);
    expect(stats.min).toBe(0);
    expect(stats.max).toBe(0);
    expect(stats.mean).toBe(0);
    expect(stats.median).toBe(0);
    expect(stats.stddev).toBe(0);
    expect(stats.p10).toBe(0);
    expect(stats.p90).toBe(0);
  });

  it('computes correct stats for single value', () => {
    const stats = calculateStats([7]);
    expect(stats.min).toBe(7);
    expect(stats.max).toBe(7);
    expect(stats.mean).toBe(7);
    expect(stats.median).toBe(7);
    expect(stats.stddev).toBe(0);
  });

  it('computes correct min/max/mean', () => {
    const stats = calculateStats([2, 4, 6, 8, 10]);
    expect(stats.min).toBe(2);
    expect(stats.max).toBe(10);
    expect(stats.mean).toBe(6);
  });

  it('computes correct median', () => {
    const stats = calculateStats([1, 3, 5, 7, 9]);
    expect(stats.median).toBe(5);
  });

  it('computes stddev correctly', () => {
    // [2, 4, 4, 4, 5, 5, 7, 9] → mean=5, variance=4, stddev=2
    const stats = calculateStats([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(stats.stddev).toBeCloseTo(2, 5);
  });

  it('includes all percentile fields', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    const stats = calculateStats(values);
    expect(stats.p10).toBeDefined();
    expect(stats.p25).toBeDefined();
    expect(stats.p50).toBeDefined();
    expect(stats.p75).toBeDefined();
    expect(stats.p90).toBeDefined();
    // p50 uses index-based lookup, median interpolates for even arrays
    // For 1..100: median = (50+51)/2 = 50.5, p50 = 50
    expect(stats.p50).toBe(50);
    expect(stats.median).toBe(50.5);
  });
});
