import { describe, expect, it, vi } from 'vitest';
import {
  getPan,
  isPanSetterRegistered,
  registerPanGetter,
  registerPanSetter,
  requestPan,
} from '@/components/settings/panSetterRegistry';

describe('panSetterRegistry', () => {
  it('is a no-op when nothing is registered', () => {
    expect(isPanSetterRegistered()).toBe(false);
    expect(requestPan({ x: 10, y: 10 })).toBe(false);
  });

  it('forwards pans to the registered setter until unregistered', () => {
    const setter = vi.fn();
    const unregister = registerPanSetter(setter);
    expect(isPanSetterRegistered()).toBe(true);

    expect(requestPan({ x: 4, y: 5 })).toBe(true);
    expect(setter).toHaveBeenCalledWith({ x: 4, y: 5 });

    unregister();
    expect(isPanSetterRegistered()).toBe(false);
    expect(requestPan({ x: 1, y: 1 })).toBe(false);
    expect(setter).toHaveBeenCalledTimes(1);
  });

  it('supports functional updaters for reading the current pan', () => {
    const unregister = registerPanSetter((next) => {
      if (typeof next === 'function') next({ x: 7, y: 8 });
    });
    let seen = { x: 0, y: 0 };
    requestPan((prev) => {
      seen = prev;
      return prev;
    });
    expect(seen).toEqual({ x: 7, y: 8 });
    unregister();
  });

  it('unregistering a stale setter does not clear a newer one', () => {
    const first = vi.fn();
    const second = vi.fn();
    const unregisterFirst = registerPanSetter(first);
    registerPanSetter(second);
    unregisterFirst();
    expect(isPanSetterRegistered()).toBe(true);
    requestPan({ x: 0, y: 0 });
    expect(second).toHaveBeenCalled();
    expect(first).not.toHaveBeenCalled();
    registerPanSetter(second)();
  });

  it('getPan is null when no getter is registered', () => {
    expect(getPan()).toBeNull();
  });

  it('getPan reads from the registered getter without calling the setter', () => {
    const setter = vi.fn();
    const unregisterSetter = registerPanSetter(setter);
    const unregisterGetter = registerPanGetter(() => ({ x: 3, y: 9 }));

    expect(getPan()).toEqual({ x: 3, y: 9 });
    expect(setter).not.toHaveBeenCalled();

    unregisterGetter();
    expect(getPan()).toBeNull();
    unregisterSetter();
  });

  it('unregistering a stale getter does not clear a newer one', () => {
    const unregisterFirst = registerPanGetter(() => ({ x: 1, y: 1 }));
    const unregisterSecond = registerPanGetter(() => ({ x: 2, y: 2 }));
    unregisterFirst();
    expect(getPan()).toEqual({ x: 2, y: 2 });
    unregisterSecond();
  });
});
