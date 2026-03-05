/**
 * Quality Mode Test Plan (Cloudflare-style)
 *
 * Interleaved download/upload tests with loaded latency measurement.
 * Progressive file sizes: 100kB, 1MB, 10MB, 25MB, 100MB
 * Pattern for each size: download → loaded latency → upload → loaded latency
 */
import { TestPlan } from '../types/primitives';
export declare const qualityModePlan: TestPlan;
//# sourceMappingURL=quality.d.ts.map