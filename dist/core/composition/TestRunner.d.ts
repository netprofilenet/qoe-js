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
import { TestPlan, ExecutionResult } from '../types/primitives';
/**
 * Test Runner executes test plans
 */
export declare class TestRunner {
    private primitiveRegistry;
    private eventEmitter;
    private abortController;
    constructor(eventEmitter: EventEmitter);
    /**
     * Execute a test plan
     * @param plan - Test plan to execute
     * @returns Promise with execution result
     */
    execute(plan: TestPlan): Promise<ExecutionResult>;
    /**
     * Stop execution gracefully
     */
    stop(): void;
    /**
     * Execute a single step
     * @param step - Test step to execute
     * @param context - Execution context
     * @param _timeout - Optional timeout in ms (reserved for future use)
     * @returns Promise with step result
     */
    private executeStep;
    /**
     * Execute step in sequential mode
     */
    private executeSequential;
    /**
     * Execute step in parallel mode
     */
    private executeParallel;
    /**
     * Execute step in burst mode
     */
    private executeBurst;
    /**
     * Execute step in timed mode
     */
    private executeTimed;
    /**
     * Build dependency graph and return batches of steps that can run in parallel
     * @param steps - Test steps
     * @returns Array of batches (each batch contains steps that can run in parallel)
     */
    private buildDependencyGraph;
    /**
     * Check if any step depends on steps in the given batch
     */
    private hasDependents;
    /**
     * Evaluate a step condition
     */
    private evaluateCondition;
}
//# sourceMappingURL=TestRunner.d.ts.map