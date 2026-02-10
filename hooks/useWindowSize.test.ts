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

  it('should clean up event listener on unmount', () => {
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
});
