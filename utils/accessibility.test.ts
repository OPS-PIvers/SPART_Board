import { describe, it, expect, vi } from 'vitest';
import { getButtonAccessibilityProps } from './accessibility';
import React from 'react';

describe('accessibility', () => {
  describe('getButtonAccessibilityProps', () => {
    it('returns correct static properties', () => {
      const onClick = vi.fn();
      const props = getButtonAccessibilityProps(onClick);
      expect(props.role).toBe('button');
      expect(props.tabIndex).toBe(0);
      expect(props.onClick).toBe(onClick);
    });

    it('calls onClick when clicked', () => {
      const onClick = vi.fn();
      const props = getButtonAccessibilityProps(onClick);
      // specific call to verify it's the right function, although redundant with toBe(onClick)
      props.onClick();
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick and prevents default on Enter key', () => {
      const onClick = vi.fn();
      const preventDefault = vi.fn();
      const props = getButtonAccessibilityProps(onClick);

      const event = {
        key: 'Enter',
        preventDefault,
      } as unknown as React.KeyboardEvent;

      props.onKeyDown(event);

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(preventDefault).toHaveBeenCalledTimes(1);
    });

    it('calls onClick and prevents default on Space key', () => {
      const onClick = vi.fn();
      const preventDefault = vi.fn();
      const props = getButtonAccessibilityProps(onClick);

      const event = {
        key: ' ',
        preventDefault,
      } as unknown as React.KeyboardEvent;

      props.onKeyDown(event);

      expect(onClick).toHaveBeenCalledTimes(1);
      expect(preventDefault).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick for other keys', () => {
      const onClick = vi.fn();
      const preventDefault = vi.fn();
      const props = getButtonAccessibilityProps(onClick);

      const event = {
        key: 'a',
        preventDefault,
      } as unknown as React.KeyboardEvent;

      props.onKeyDown(event);

      expect(onClick).not.toHaveBeenCalled();
      expect(preventDefault).not.toHaveBeenCalled();
    });
  });
});
