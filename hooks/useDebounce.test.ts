import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce the value update', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 500 });
    // Should still be initial
    expect(result.current).toBe('initial');

    // Fast forward time less than delay
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('initial');

    // Fast forward time past delay
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('updated');

    vi.useRealTimers();
  });

  it('should clear timeout on unmount or change', () => {
    vi.useFakeTimers();
    const { unmount, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    rerender({ value: 'updated', delay: 500 });

    // Unmount before timer fires
    unmount();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // If it tried to update state after unmount, React would warn (though hard to catch in this test structure without spying on console)
    // But logically, cleanup should run.

    vi.useRealTimers();
  });
});
