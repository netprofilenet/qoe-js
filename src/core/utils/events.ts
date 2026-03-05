/**
 * Lightweight event emitter for handling asynchronous events
 */
export class EventEmitter {
  private listeners: Map<string, Set<Function>>;

  constructor() {
    this.listeners = new Map();
  }

  /**
   * Register an event listener
   * @param event - Event name
   * @param callback - Callback function to invoke when event is emitted
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Unregister an event listener
   * @param event - Event name
   * @param callback - Callback function to remove
   */
  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit an event with data
   * @param event - Event name
   * @param data - Data to pass to event listeners
   *
   * CRITICAL: Uses queueMicrotask to defer observer callbacks to prevent
   * blocking the test execution. Observers run asynchronously so they don't
   * slow down bandwidth measurements.
   */
  emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      // Defer observer callbacks to next microtask to avoid blocking
      queueMicrotask(() => {
        callbacks.forEach(cb => {
          try {
            cb(data);
          } catch (error) {
            console.error(`Error in event listener for '${event}':`, error);
          }
        });
      });
    }
  }

  /**
   * Register a one-time event listener
   * @param event - Event name
   * @param callback - Callback function to invoke once
   */
  once(event: string, callback: Function): void {
    const wrapper = (data: any) => {
      callback(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  /**
   * Remove all listeners for a specific event or all events
   * @param event - Optional event name (if not provided, removes all listeners)
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   * @param event - Event name
   * @returns Number of listeners
   */
  listenerCount(event: string): number {
    const callbacks = this.listeners.get(event);
    return callbacks ? callbacks.size : 0;
  }
}
