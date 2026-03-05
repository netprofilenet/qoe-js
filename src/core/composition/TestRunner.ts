/**
 * Test Runner - Execution engine for test plans
 *
 * Orchestrates the execution of test plans by:
 * 1. Building dependency graphs
 * 2. Executing steps in topological order
 * 3. Handling sequential/parallel/burst/timed execution modes
 * 4. Emitting events for metric collection
 * 5. Managing execution context and results
 */

import { EventEmitter } from '../utils/events';
import { sleep } from '../utils/timing';
import { PrimitiveRegistry } from './PrimitiveRegistry';
import {
  TestPlan,
  TestStep,
  ExecutionResult,
  StepResult,
  PrimitiveResult,
  ExecutionContext,
  StepCondition
} from '../types/primitives';

/**
 * Test Runner executes test plans
 */
export class TestRunner {
  private primitiveRegistry: PrimitiveRegistry;
  private eventEmitter: EventEmitter;
  private abortController: AbortController | null = null;

  constructor(eventEmitter: EventEmitter) {
    this.primitiveRegistry = new PrimitiveRegistry();
    this.eventEmitter = eventEmitter;
  }

  /**
   * Execute a test plan
   * @param plan - Test plan to execute
   * @returns Promise with execution result
   */
  async execute(plan: TestPlan): Promise<ExecutionResult> {
    const startTime = performance.now();
    this.abortController = new AbortController();

    // Initialize execution context
    const context: ExecutionContext = {
      results: new Map(),
      state: new Map(),
      server: plan.options?.server || {
        id: 'default',
        name: 'Default Server',
        country: 'US',
        httpUrl: 'http://localhost:3000',
        webrtcSignalingUrl: 'ws://localhost:3000/signaling',
        stunServers: ['stun:stun.l.google.com:19302'],
        turnServers: [],
        enabled: true
      },
      signal: this.abortController.signal
    };

    const stepResults: StepResult[] = [];
    let success = true;
    let error: Error | undefined;

    try {
      // Build dependency graph
      const batches = this.buildDependencyGraph(plan.steps);

      // Execute each batch (steps in a batch can run in parallel)
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        if (context.signal.aborted) break;

        // Execute all steps in batch in parallel
        const batchPromises = batch.map(step =>
          this.executeStep(step, context, plan.options?.timeout)
        );

        const batchResults = await Promise.allSettled(batchPromises);

        // Process batch results
        for (let i = 0; i < batchResults.length; i++) {
          const result = batchResults[i];
          const step = batch[i];

          if (result.status === 'fulfilled') {
            stepResults.push(result.value);
            // Store in context for dependencies
            if (step.id) {
              context.results.set(step.id, result.value);
            }
          } else {
            // Step failed
            success = false;
            error = result.reason;
            stepResults.push({
              step,
              skipped: false,
              primitiveResults: [],
              duration: 0
            });
          }
        }

        // Stop if any step in batch failed and has dependents
        if (!success && this.hasDependents(batch, plan.steps)) {
          break;
        }
      }
    } catch (err) {
      success = false;
      error = err instanceof Error ? err : new Error(String(err));
    }

    const duration = performance.now() - startTime;

    return {
      success,
      duration,
      stepResults,
      error,
      context
    };
  }

  /**
   * Stop execution gracefully
   */
  stop(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Execute a single step
   * @param step - Test step to execute
   * @param context - Execution context
   * @param _timeout - Optional timeout in ms (reserved for future use)
   * @returns Promise with step result
   */
  private async executeStep(
    step: TestStep,
    context: ExecutionContext,
    _timeout?: number
  ): Promise<StepResult> {
    const stepStart = performance.now();

    // Check condition
    if (step.condition && !this.evaluateCondition(step.condition, context)) {
      return {
        step,
        skipped: true,
        primitiveResults: []
      };
    }

    // Execute based on mode
    let primitiveResults: PrimitiveResult[];

    switch (step.execution.mode) {
      case 'sequential':
        primitiveResults = await this.executeSequential(step, context);
        break;
      case 'parallel':
        primitiveResults = await this.executeParallel(step, context);
        break;
      case 'burst':
        primitiveResults = await this.executeBurst(step, context);
        break;
      case 'timed':
        primitiveResults = await this.executeTimed(step, context);
        break;
      default:
        throw new Error(`Unknown execution mode: ${(step.execution as any).mode}`);
    }

    const duration = performance.now() - stepStart;

    return {
      step,
      skipped: false,
      duration,
      primitiveResults
    };
  }

  /**
   * Execute step in sequential mode
   */
  private async executeSequential(
    step: TestStep,
    context: ExecutionContext
  ): Promise<PrimitiveResult[]> {
    const results: PrimitiveResult[] = [];
    const repeat = step.execution.repeat || { count: 1 };
    const count = repeat.count || 1;
    const interval = repeat.interval || 0;

    for (let i = 0; i < count; i++) {
      if (context.signal.aborted) break;

      const result = await this.primitiveRegistry.execute(
        step.primitive,
        step.config,
        context
      );

      results.push(result);

      // Emit metric event
      this.eventEmitter.emit('metric', {
        type: 'metric',
        source: 'primitive',
        primitive: step.primitive,
        stepId: step.id,
        result
      });

      if (interval > 0 && i < count - 1) {
        await sleep(interval);
      }
    }

    return results;
  }

  /**
   * Execute step in parallel mode
   */
  private async executeParallel(
    step: TestStep,
    context: ExecutionContext
  ): Promise<PrimitiveResult[]> {
    const results: PrimitiveResult[] = [];
    const repeat = step.execution.repeat || {};
    const concurrency = step.execution.concurrency || 1;
    const duration = repeat.duration;
    const count = repeat.count;

    if (duration) {
      // Time-based parallel execution
      const endTime = performance.now() + duration;

      while (performance.now() < endTime && !context.signal.aborted) {
        // Launch N parallel operations
        const batch = Array(concurrency).fill(null).map(() =>
          this.primitiveRegistry.execute(step.primitive, step.config, context)
        );

        const batchResults = await Promise.allSettled(batch);

        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            results.push(result.value);

            // Emit metric event
            this.eventEmitter.emit('metric', {
              type: 'metric',
              source: 'primitive',
              primitive: step.primitive,
              stepId: step.id,
              result: result.value
            });
          }
        }
      }
    } else if (count) {
      // Count-based parallel execution
      const batches = Math.ceil(count / concurrency);

      for (let b = 0; b < batches; b++) {
        if (context.signal.aborted) break;

        const batchSize = Math.min(concurrency, count - b * concurrency);
        const batch = Array(batchSize).fill(null).map(() =>
          this.primitiveRegistry.execute(step.primitive, step.config, context)
        );

        const batchResults = await Promise.allSettled(batch);

        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            results.push(result.value);

            // Emit metric event
            this.eventEmitter.emit('metric', {
              type: 'metric',
              source: 'primitive',
              primitive: step.primitive,
              stepId: step.id,
              result: result.value
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * Execute step in burst mode
   */
  private async executeBurst(
    step: TestStep,
    context: ExecutionContext
  ): Promise<PrimitiveResult[]> {
    const results: PrimitiveResult[] = [];
    const repeat = step.execution.repeat || {};
    const burst = step.execution.burst;

    if (!burst) {
      throw new Error('Burst mode requires burst configuration');
    }

    const burstCount = repeat.count || 1;
    const burstDuration = repeat.duration;

    if (burstDuration) {
      // Time-based bursts
      const endTime = performance.now() + burstDuration;

      while (performance.now() < endTime && !context.signal.aborted) {
        // Execute burst
        const burstBatch = Array(burst.size).fill(null).map(() =>
          this.primitiveRegistry.execute(step.primitive, step.config, context)
        );

        const burstResults = await Promise.allSettled(burstBatch);

        for (const result of burstResults) {
          if (result.status === 'fulfilled') {
            results.push(result.value);

            // Emit metric event
            this.eventEmitter.emit('metric', {
              type: 'metric',
              source: 'primitive',
              primitive: step.primitive,
              stepId: step.id,
              result: result.value
            });
          }
        }

        // Wait before next burst
        if (performance.now() < endTime) {
          await sleep(burst.interval);
        }
      }
    } else {
      // Count-based bursts
      for (let i = 0; i < burstCount; i++) {
        if (context.signal.aborted) break;

        // Execute burst
        const burstBatch = Array(burst.size).fill(null).map(() =>
          this.primitiveRegistry.execute(step.primitive, step.config, context)
        );

        const burstResults = await Promise.allSettled(burstBatch);

        for (const result of burstResults) {
          if (result.status === 'fulfilled') {
            results.push(result.value);

            // Emit metric event
            this.eventEmitter.emit('metric', {
              type: 'metric',
              source: 'primitive',
              primitive: step.primitive,
              stepId: step.id,
              result: result.value
            });
          }
        }

        // Wait before next burst
        if (i < burstCount - 1) {
          await sleep(burst.interval);
        }
      }
    }

    return results;
  }

  /**
   * Execute step in timed mode
   */
  private async executeTimed(
    step: TestStep,
    context: ExecutionContext
  ): Promise<PrimitiveResult[]> {
    // Timed mode is just sequential with duration
    const results: PrimitiveResult[] = [];
    const repeat = step.execution.repeat || {};
    const duration = repeat.duration || 1000;
    const interval = repeat.interval || 0;
    const endTime = performance.now() + duration;

    while (performance.now() < endTime && !context.signal.aborted) {
      const result = await this.primitiveRegistry.execute(
        step.primitive,
        step.config,
        context
      );

      results.push(result);

      // Emit metric event
      this.eventEmitter.emit('metric', {
        type: 'metric',
        source: 'primitive',
        primitive: step.primitive,
        stepId: step.id,
        result
      });

      if (interval > 0 && performance.now() < endTime) {
        await sleep(interval);
      }
    }

    return results;
  }

  /**
   * Build dependency graph and return batches of steps that can run in parallel
   * @param steps - Test steps
   * @returns Array of batches (each batch contains steps that can run in parallel)
   */
  private buildDependencyGraph(steps: TestStep[]): TestStep[][] {
    const batches: TestStep[][] = [];
    const processed = new Set<string>();
    const remaining = new Set(steps.map((s, i) => s.id || `step-${i}`));

    // Assign IDs to steps without them
    const stepsWithIds = steps.map((step, i) => ({
      ...step,
      id: step.id || `step-${i}`
    }));

    while (remaining.size > 0) {
      const batch: TestStep[] = [];

      // Find all steps whose dependencies are satisfied
      for (const step of stepsWithIds) {
        if (!remaining.has(step.id!)) continue;

        const dependenciesSatisfied = !step.dependsOn ||
          step.dependsOn.every(depId => processed.has(depId));

        if (dependenciesSatisfied) {
          batch.push(step);
        }
      }

      if (batch.length === 0) {
        // No progress - circular dependency or missing dependency
        throw new Error('Circular or missing dependencies detected');
      }

      batches.push(batch);

      // Mark batch as processed
      for (const step of batch) {
        processed.add(step.id!);
        remaining.delete(step.id!);
      }
    }

    return batches;
  }

  /**
   * Check if any step depends on steps in the given batch
   */
  private hasDependents(batch: TestStep[], allSteps: TestStep[]): boolean {
    const batchIds = new Set(batch.map(s => s.id).filter(Boolean));

    for (const step of allSteps) {
      if (step.dependsOn && step.dependsOn.some(depId => batchIds.has(depId))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Evaluate a step condition
   */
  private evaluateCondition(
    condition: StepCondition,
    context: ExecutionContext
  ): boolean {
    switch (condition.type) {
      case 'always':
        return true;

      case 'ifSuccess':
        // Check if all previous steps succeeded
        for (const result of context.results.values()) {
          if (result.primitiveResults.some(pr => !pr.success)) {
            return false;
          }
        }
        return true;

      case 'ifFailure':
        // Check if any previous step failed
        for (const result of context.results.values()) {
          if (result.primitiveResults.some(pr => !pr.success)) {
            return true;
          }
        }
        return false;

      case 'ifFast':
        // Check if previous step was fast enough
        if (!condition.maxDuration) return true;

        for (const result of context.results.values()) {
          if (result.duration && result.duration > condition.maxDuration) {
            return false;
          }
        }
        return true;

      case 'custom':
        // Use custom evaluation function
        if (condition.evaluate) {
          return condition.evaluate(context);
        }
        return true;

      default:
        return true;
    }
  }
}
