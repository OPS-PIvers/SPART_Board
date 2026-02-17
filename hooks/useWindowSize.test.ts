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
    vi.useRealTimers();
  });

  it('should return the current window size initially', () => {
    const { result } = renderHook(() => useWindowSize());
    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  it('should update size when window is resized and enabled (default)', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useWindowSize());

    // Advance time to clear the throttle window from the initial mount call
    act(() => {
      vi.advanceTimersByTime(150);
    });

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
    const { result } = renderHook(() => useWindowSize(false));

    act(() => {
      window.innerWidth = 500;
      window.innerHeight = 500;
      window.dispatchEvent(new Event('resize'));
    });

    // Should remain at initial size
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
      window.dispatchEvent(new Event('resize'));
    });

    // Still old value because disabled
    expect(result.current.width).toBe(1024);

    // Enable it
    rerender({ enabled: true });

    // Should sync to current window size immediately
    expect(result.current.width).toBe(500);
    expect(result.current.height).toBe(500);
  });

  it('should throttle rapid resize events', () => {
    vi.useFakeTimers();
    // Use a specific throttle time to test
    const throttleMs = 100;
    const { result } = renderHook(() => useWindowSize(true, throttleMs));

    // Advance time to clear the throttle window from the initial mount call
    act(() => {
      vi.advanceTimersByTime(150);
    });

    act(() => {
      // First event - should trigger immediate update (leading edge)
      // because lastRun starts as null
      window.innerWidth = 500;
      window.innerHeight = 500;
      window.dispatchEvent(new Event('resize'));
    });

    // Should update immediately
    expect(result.current.width).toBe(500);

    act(() => {
      // Second event - within throttle window (e.g. 50ms later)
      vi.advanceTimersByTime(50);
      window.innerWidth = 600;
      window.innerHeight = 600;
      window.dispatchEvent(new Event('resize'));
    });

    // Should NOT update yet (still 500)
    expect(result.current.width).toBe(500);

    act(() => {
      // Advance past throttle window (another 60ms => total 110ms from previous run)
      vi.advanceTimersByTime(60);
    });

    // Should update now (trailing edge)
    expect(result.current.width).toBe(600);
  });
});
