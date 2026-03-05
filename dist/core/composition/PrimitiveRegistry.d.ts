/**
 * Primitive Registry
 *
 * Maps primitive names to their implementations, enabling dynamic primitive execution
 * and extensibility via custom primitive registration
 */
import { PrimitiveType, PrimitiveFunction, PrimitiveConfig, PrimitiveResult, ExecutionContext } from '../types/primitives';
/**
 * Registry for mapping primitive types to their implementations
 */
export declare class PrimitiveRegistry {
    private primitives;
    constructor();
    /**
     * Register a primitive function
     * @param type - Primitive type name
     * @param fn - Primitive function implementation
     */
    register(type: PrimitiveType, fn: PrimitiveFunction): void;
    /**
     * Check if a primitive is registered
     * @param type - Primitive type name
     * @returns True if registered
     */
    has(type: PrimitiveType): boolean;
    /**
     * Execute a primitive function
     * @param type - Primitive type to execute
     * @param config - Primitive configuration
     * @param context - Execution context
     * @returns Promise with primitive result
     */
    execute(type: PrimitiveType, config: PrimitiveConfig, context: ExecutionContext): Promise<PrimitiveResult>;
    /**
     * Get all registered primitive types
     * @returns Array of primitive type names
     */
    getTypes(): PrimitiveType[];
    /**
     * Clear all registered primitives (useful for testing)
     */
    clear(): void;
}
//# sourceMappingURL=PrimitiveRegistry.d.ts.map