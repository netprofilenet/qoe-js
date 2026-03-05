/**
 * Primitive Registry
 *
 * Maps primitive names to their implementations, enabling dynamic primitive execution
 * and extensibility via custom primitive registration
 */

import {
  PrimitiveType,
  PrimitiveFunction,
  PrimitiveConfig,
  PrimitiveResult,
  ExecutionContext
} from '../types/primitives';
import {
  PRIMITIVES
} from '../primitives';

/**
 * Registry for mapping primitive types to their implementations
 */
export class PrimitiveRegistry {
  private primitives: Map<PrimitiveType, PrimitiveFunction>;

  constructor() {
    this.primitives = new Map();

    // Register built-in primitives
    this.register('httpDownload', PRIMITIVES.httpDownload);
    this.register('httpUpload', PRIMITIVES.httpUpload);
    this.register('latencyProbe', PRIMITIVES.latencyProbe);
    this.register('webrtcConnect', PRIMITIVES.webrtcConnect);
    this.register('webrtcLatencyProbe', PRIMITIVES.webrtcLatencyProbe);
    this.register('packetStream', PRIMITIVES.packetStream);
  }

  /**
   * Register a primitive function
   * @param type - Primitive type name
   * @param fn - Primitive function implementation
   */
  register(type: PrimitiveType, fn: PrimitiveFunction): void {
    this.primitives.set(type, fn);
  }

  /**
   * Check if a primitive is registered
   * @param type - Primitive type name
   * @returns True if registered
   */
  has(type: PrimitiveType): boolean {
    return this.primitives.has(type);
  }

  /**
   * Execute a primitive function
   * @param type - Primitive type to execute
   * @param config - Primitive configuration
   * @param context - Execution context
   * @returns Promise with primitive result
   */
  async execute(
    type: PrimitiveType,
    config: PrimitiveConfig,
    context: ExecutionContext
  ): Promise<PrimitiveResult> {
    const primitive = this.primitives.get(type);

    if (!primitive) {
      throw new Error(`Unknown primitive type: ${type}`);
    }

    return await primitive(config, context);
  }

  /**
   * Get all registered primitive types
   * @returns Array of primitive type names
   */
  getTypes(): PrimitiveType[] {
    return Array.from(this.primitives.keys());
  }

  /**
   * Clear all registered primitives (useful for testing)
   */
  clear(): void {
    this.primitives.clear();
  }
}
