import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from '../src/core/utils/events';

// Helper to flush microtasks (emit uses queueMicrotask)
async function flush() {
  await new Promise<void>(resolve => queueMicrotask(resolve));
}

describe('EventEmitter', () => {
  it('calls listener when event is emitted', async () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    emitter.on('test', handler);
    emitter.emit('test', 'data');
    await flush();
    expect(handler).toHaveBeenCalledWith('data');
  });

  it('supports multiple listeners on the same event', async () => {
    const emitter = new EventEmitter();
    const a = vi.fn();
    const b = vi.fn();
    emitter.on('test', a);
    emitter.on('test', b);
    emitter.emit('test', 42);
    await flush();
    expect(a).toHaveBeenCalledWith(42);
    expect(b).toHaveBeenCalledWith(42);
  });

  it('does not call listeners for other events', async () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    emitter.on('a', handler);
    emitter.emit('b', 'data');
    await flush();
    expect(handler).not.toHaveBeenCalled();
  });

  it('removes a listener with off()', async () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    emitter.on('test', handler);
    emitter.off('test', handler);
    emitter.emit('test');
    await flush();
    expect(handler).not.toHaveBeenCalled();
  });

  it('once() fires listener exactly once', async () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    emitter.once('test', handler);

    emitter.emit('test', 'first');
    await flush();
    emitter.emit('test', 'second');
    await flush();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('first');
  });

  it('removeAllListeners(event) removes only that event', async () => {
    const emitter = new EventEmitter();
    const a = vi.fn();
    const b = vi.fn();
    emitter.on('x', a);
    emitter.on('y', b);
    emitter.removeAllListeners('x');

    emitter.emit('x');
    emitter.emit('y', 'ok');
    await flush();

    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledWith('ok');
  });

  it('removeAllListeners() with no args removes everything', async () => {
    const emitter = new EventEmitter();
    const a = vi.fn();
    const b = vi.fn();
    emitter.on('x', a);
    emitter.on('y', b);
    emitter.removeAllListeners();

    emitter.emit('x');
    emitter.emit('y');
    await flush();

    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });

  it('listenerCount returns correct count', () => {
    const emitter = new EventEmitter();
    expect(emitter.listenerCount('test')).toBe(0);

    const handler = vi.fn();
    emitter.on('test', handler);
    expect(emitter.listenerCount('test')).toBe(1);

    emitter.on('test', vi.fn());
    expect(emitter.listenerCount('test')).toBe(2);

    emitter.off('test', handler);
    expect(emitter.listenerCount('test')).toBe(1);
  });

  it('listener errors do not prevent other listeners from running', async () => {
    const emitter = new EventEmitter();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const bad = vi.fn(() => { throw new Error('boom'); });
    const good = vi.fn();

    emitter.on('test', bad);
    emitter.on('test', good);
    emitter.emit('test', 'data');
    await flush();

    expect(bad).toHaveBeenCalled();
    expect(good).toHaveBeenCalledWith('data');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('emit with no listeners does not throw', () => {
    const emitter = new EventEmitter();
    expect(() => emitter.emit('nonexistent', 'data')).not.toThrow();
  });
});
