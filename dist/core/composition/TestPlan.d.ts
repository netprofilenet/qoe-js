/**
 * Test Plan configuration schema
 *
 * Defines the declarative configuration format for test plans
 */
export type { TestPlan, TestPlanOptions, TestStep, PrimitiveType, ExecutionMode, StepCondition, PrimitiveConfig, HttpDownloadConfig, HttpUploadConfig, LatencyProbeConfig, WebRTCConnectConfig, WebRTCLatencyProbeConfig, PacketStreamConfig, ExecutionContext, ExecutionResult, StepResult, PrimitiveResult, PrimitiveFunction } from '../types/primitives';
/**
 * Helper function to create a test plan with type safety
 */
export declare function createTestPlan(plan: import('../types/primitives').TestPlan): import('../types/primitives').TestPlan;
/**
 * Helper function to validate a test step
 */
export declare function validateTestStep(step: import('../types/primitives').TestStep): void;
/**
 * Helper function to validate a test plan
 */
export declare function validateTestPlan(plan: import('../types/primitives').TestPlan): void;
//# sourceMappingURL=TestPlan.d.ts.map