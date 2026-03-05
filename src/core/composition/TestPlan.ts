/**
 * Test Plan configuration schema
 *
 * Defines the declarative configuration format for test plans
 */

// Re-export all test plan related types from primitives
export type {
  TestPlan,
  TestPlanOptions,
  TestStep,
  PrimitiveType,
  ExecutionMode,
  StepCondition,
  PrimitiveConfig,
  HttpDownloadConfig,
  HttpUploadConfig,
  LatencyProbeConfig,
  WebRTCConnectConfig,
  WebRTCLatencyProbeConfig,
  PacketStreamConfig,
  ExecutionContext,
  ExecutionResult,
  StepResult,
  PrimitiveResult,
  PrimitiveFunction
} from '../types/primitives';

/**
 * Helper function to create a test plan with type safety
 */
export function createTestPlan(plan: import('../types/primitives').TestPlan): import('../types/primitives').TestPlan {
  return plan;
}

/**
 * Helper function to validate a test step
 */
export function validateTestStep(step: import('../types/primitives').TestStep): void {
  if (!step.primitive) {
    throw new Error('Step must specify a primitive');
  }
  if (!step.execution) {
    throw new Error('Step must specify an execution mode');
  }
  if (!step.config) {
    throw new Error('Step must specify a config');
  }

  // Validate execution mode
  const validModes = ['sequential', 'parallel', 'burst', 'timed'];
  if (!validModes.includes(step.execution.mode)) {
    throw new Error(`Invalid execution mode: ${step.execution.mode}`);
  }

  // Validate mode-specific requirements
  if (step.execution.mode === 'parallel' && !step.execution.concurrency) {
    throw new Error('Parallel mode requires concurrency to be specified');
  }

  if (step.execution.mode === 'burst' && !step.execution.burst) {
    throw new Error('Burst mode requires burst configuration');
  }

  // Validate repeat configuration
  if (step.execution.repeat) {
    if (step.execution.repeat.count === undefined && step.execution.repeat.duration === undefined) {
      throw new Error('Repeat must specify either count or duration');
    }
  }
}

/**
 * Helper function to validate a test plan
 */
export function validateTestPlan(plan: import('../types/primitives').TestPlan): void {
  if (!plan.name) {
    throw new Error('Test plan must have a name');
  }
  if (!plan.steps || plan.steps.length === 0) {
    throw new Error('Test plan must have at least one step');
  }

  // Validate all steps
  plan.steps.forEach((step, index) => {
    try {
      validateTestStep(step);
    } catch (err) {
      throw new Error(`Step ${index} validation failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  // Validate step dependencies
  const stepIds = new Set(plan.steps.map(s => s.id).filter(Boolean));
  plan.steps.forEach((step, index) => {
    if (step.dependsOn) {
      step.dependsOn.forEach(depId => {
        if (!stepIds.has(depId)) {
          throw new Error(`Step ${index} depends on unknown step: ${depId}`);
        }
      });
    }
  });

  // Check for circular dependencies
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(stepId: string): boolean {
    if (recursionStack.has(stepId)) return true;
    if (visited.has(stepId)) return false;

    visited.add(stepId);
    recursionStack.add(stepId);

    const step = plan.steps.find(s => s.id === stepId);
    if (step?.dependsOn) {
      for (const depId of step.dependsOn) {
        if (hasCycle(depId)) return true;
      }
    }

    recursionStack.delete(stepId);
    return false;
  }

  for (const step of plan.steps) {
    if (step.id && hasCycle(step.id)) {
      throw new Error(`Circular dependency detected involving step: ${step.id}`);
    }
  }
}
