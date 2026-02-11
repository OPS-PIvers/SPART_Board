import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useWindowSize } from './useWindowSize';

describe('useWindowSize', () => {
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

  it('should not update size when disabled', () => {
    // Reset window size first
    window.innerWidth = 1024;
    window.innerHeight = 768;

    const { result } = renderHook(() => useWindowSize(false));

    // Should start with current size
    expect(result.current.width).toBe(1024);

    act(() => {
      window.innerWidth = 500;
      window.innerHeight = 500;
      window.dispatchEvent(new Event('resize'));
    });

    // Should NOT update
    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  it('should update size when enabled toggles to true', () => {
    window.innerWidth = 1024;
    window.innerHeight = 768;

    const { result, rerender } = renderHook((props) => useWindowSize(props), {
      initialProps: false,
    });

    // Change window size while disabled
    act(() => {
      window.innerWidth = 500;
      window.innerHeight = 500;
      window.dispatchEvent(new Event('resize'));
    });

    // Should still be old size
    expect(result.current.width).toBe(1024);

    // Enable it
    rerender(true);

    // Should update to new size
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
    removeEventListenerSpy.mockRestore();
  });
});
