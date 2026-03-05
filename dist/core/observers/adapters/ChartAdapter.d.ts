/**
 * Chart Adapter
 *
 * Transforms raw metrics into Chart.js compatible data format
 */
import { MetricAdapter } from '../Observer';
import { RawMetric } from '../../metrics/MetricCollector';
/**
 * Chart data format (Chart.js compatible)
 */
export interface ChartData {
    downloadSamples: Array<{
        x: number;
        y: number;
    }>;
    uploadSamples: Array<{
        x: number;
        y: number;
    }>;
    latencySamples: Array<{
        x: number;
        y: number;
    }>;
}
/**
 * Chart Adapter - converts metrics to Chart.js format
 */
export declare class ChartAdapter extends MetricAdapter<ChartData> {
    constructor();
    onMetric(metric: RawMetric): void;
    reset(): void;
}
//# sourceMappingURL=ChartAdapter.d.ts.map