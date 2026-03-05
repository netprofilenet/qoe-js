/**
 * Event type definitions for real-time test updates
 */
import { BandwidthSample, LatencySample, QualityResults, SpeedResults, ApplicationResults } from './results';
export type QOEEventType = 'progress' | 'sample' | 'complete' | 'error' | 'debug';
export interface ProgressEvent {
    type: 'progress';
    testMode: 'quality' | 'speed' | 'application';
    currentPhase: string;
    percentage: number;
    currentTest?: string;
}
export type SampleType = 'download' | 'upload' | 'latency' | 'packet loss';
export interface SampleEvent {
    type: 'sample';
    sampleType: SampleType;
    sample: BandwidthSample | LatencySample;
    timestamp: number;
}
export interface ResultEvent {
    type: 'complete';
    testMode: 'quality' | 'speed' | 'application';
    results: QualityResults | SpeedResults | ApplicationResults;
}
export interface ErrorEvent {
    type: 'error';
    error: Error;
    context?: string;
}
export interface DebugEvent {
    type: 'debug';
    message: string;
    data?: any;
}
//# sourceMappingURL=events.d.ts.map