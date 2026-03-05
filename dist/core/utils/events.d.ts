/**
 * Lightweight event emitter for handling asynchronous events
 */
export declare class EventEmitter {
    private listeners;
    constructor();
    /**
     * Register an event listener
     * @param event - Event name
     * @param callback - Callback function to invoke when event is emitted
     */
    on(event: string, callback: Function): void;
    /**
     * Unregister an event listener
     * @param event - Event name
     * @param callback - Callback function to remove
     */
    off(event: string, callback: Function): void;
    /**
     * Emit an event with data
     * @param event - Event name
     * @param data - Data to pass to event listeners
     *
     * CRITICAL: Uses queueMicrotask to defer observer callbacks to prevent
     * blocking the test execution. Observers run asynchronously so they don't
     * slow down bandwidth measurements.
     */
    emit(event: string, data?: any): void;
    /**
     * Register a one-time event listener
     * @param event - Event name
     * @param callback - Callback function to invoke once
     */
    once(event: string, callback: Function): void;
    /**
     * Remove all listeners for a specific event or all events
     * @param event - Optional event name (if not provided, removes all listeners)
     */
    removeAllListeners(event?: string): void;
    /**
     * Get the number of listeners for an event
     * @param event - Event name
     * @returns Number of listeners
     */
    listenerCount(event: string): number;
}
//# sourceMappingURL=events.d.ts.map