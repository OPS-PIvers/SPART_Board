import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWindowSize } from './useWindowSize';

describe('useWindowSize', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    // Reset window size before each test
    window.innerWidth = 1024;
    window.innerHeight = 768;
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.innerWidth = originalInnerWidth;
    window.innerHeight = originalInnerHeight;
    vi.restoreAllMocks();
  });

  it('should return the current window size initially', () => {
    const { result } = renderHook(() => useWindowSize());
    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  it('should update size when window is resized and enabled (default)', () => {
    const { result } = renderHook(() => useWindowSize());

    act(() => {
      window.innerWidth = 500;
      window.innerHeight = 500;
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.width).toBe(500);
    expect(result.current.height).toBe(500);
  });

  it('should cleanup event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useWindowSize());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );
  });

  it('should NOT update size when disabled', () => {
    // We expect useWindowSize to pull the latest snapshot on mount (or first render),
    // but if we resize WHILE disabled, and useSyncExternalStore does not subscribe,
    // will it update? Actually, useSyncExternalStore calls getSnapshot during render.
    // If the component re-renders for some other reason, it WILL get the new size.
    // But if we just dispatch an event, it won't force a re-render.

    // First let's render it
    const { result } = renderHook(() => useWindowSize(false));

    act(() => {
      window.innerWidth = 500;
      window.innerHeight = 500;
      window.dispatchEvent(new Event('resize'));
    });

    // Since it's disabled, no event listener was attached, so it shouldn't have re-rendered!
    // However, in our test environment, act() might not behave exactly like a real browser
    // in terms of NOT re-rendering. But we expect result.current to remain the old value
    // because no state update was triggered.
    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  it('should attach listener when enabled becomes true', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const { rerender } = renderHook(({ enabled }) => useWindowSize(enabled), {
      initialProps: { enabled: false },
    });

    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );

    // Enable
    rerender({ enabled: true });

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );
  });

  it('should update immediately when enabled is toggled to true', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useWindowSize(enabled),
      {
        initialProps: { enabled: false },
      }
    );

    // Resize while disabled
    act(() => {
      window.innerWidth = 500;
      window.innerHeight = 500;
      // In a real browser, the window dimensions might change but we don't dispatch an event,
      // or we do dispatch an event.
      // useSyncExternalStore will pull the latest snapshot when it re-subscribes or re-renders.
    });

    // Enable it
    rerender({ enabled: true });

    // Should sync to current window size immediately since getSnapshot will pull the new values.
    expect(result.current.width).toBe(500);
    expect(result.current.height).toBe(500);
  });
});
