import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { useWindowSize } from './useWindowSize';

describe('useWindowSize', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should return the current window size', () => {
    const { result } = renderHook(() => useWindowSize());
    expect(result.current.width).toBe(window.innerWidth);
    expect(result.current.height).toBe(window.innerHeight);
  });

  it('should update size when window is resized (throttled)', () => {
    const { result } = renderHook(() => useWindowSize());

    act(() => {
      window.innerWidth = 500;
      window.innerHeight = 500;
      window.dispatchEvent(new Event('resize'));
    });

    // Should NOT update immediately due to throttle
    expect(result.current.width).not.toBe(500);

    // Fast-forward time by 100ms
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.width).toBe(500);
    expect(result.current.height).toBe(500);
  });

  it('should clean up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useWindowSize());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    );
  });

  it('should share the event listener across multiple hooks', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const hook1 = renderHook(() => useWindowSize());
    const hook2 = renderHook(() => useWindowSize());

    // Should only add one listener
    expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

    hook1.unmount();
    // Should NOT remove listener yet
    expect(removeEventListenerSpy).not.toHaveBeenCalled();

    hook2.unmount();
    // Should remove listener now
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
  });
});
