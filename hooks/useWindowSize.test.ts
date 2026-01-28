import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWindowSize } from './useWindowSize';

describe('useWindowSize', () => {
  let originalWidth: number;
  let originalHeight: number;

  beforeEach(() => {
    originalWidth = window.innerWidth;
    originalHeight = window.innerHeight;
  });

  afterEach(() => {
    // Restore original window dimensions to prevent test pollution
    window.innerWidth = originalWidth;
    window.innerHeight = originalHeight;
    vi.restoreAllMocks();
  });

  it('should return the current window size', () => {
    const { result } = renderHook(() => useWindowSize());
    expect(result.current.width).toBe(window.innerWidth);
    expect(result.current.height).toBe(window.innerHeight);
  });

  it('should update size when window is resized', () => {
    const { result } = renderHook(() => useWindowSize());

    act(() => {
      window.innerWidth = 500;
      window.innerHeight = 500;
      window.dispatchEvent(new Event('resize'));
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

  it('should not update size when enabled is false', () => {
    const { result } = renderHook(() => useWindowSize(false));
    const initialWidth = result.current.width;

    act(() => {
      window.innerWidth = 999;
      window.innerHeight = 999;
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.width).toBe(initialWidth);
    expect(result.current.width).not.toBe(999);
  });

  it('should resume updating when enabled becomes true', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useWindowSize(enabled),
      { initialProps: { enabled: false } }
    );

    // Resize while disabled
    act(() => {
      window.innerWidth = 888;
      window.dispatchEvent(new Event('resize'));
    });
    // Should ignore
    expect(result.current.width).not.toBe(888);

    // Enable
    rerender({ enabled: true });

    // Should update immediately on enable (because useEffect calls handleResize)
    expect(result.current.width).toBe(888);
  });
});
