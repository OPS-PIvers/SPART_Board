import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from './security';

describe('sanitizeHtml', () => {
  it('should pass through safe HTML', () => {
    const input = '<b>Hello</b> <i>World</i><br/>';
    // DOMParser normalizes <br/> to <br>
    expect(sanitizeHtml(input)).toBe('<b>Hello</b> <i>World</i><br>');
  });

  it('should remove script tags', () => {
    const input = 'Hello <script>alert(1)</script> World';
    expect(sanitizeHtml(input)).toBe('Hello  World');
  });

  it('should remove event handlers', () => {
    const input = '<div onclick="alert(1)">Click me</div>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('onclick');
    expect(output).toContain('Click me');
  });

  it('should remove javascript: links', () => {
    const input = '<a href="javascript:alert(1)">Link</a>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('javascript:');
    expect(output).toContain('Link');
  });

  it('should remove iframes', () => {
    const input = '<iframe src="http://evil.com"></iframe>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('<iframe');
  });

  it('should handle nested tags', () => {
    const input = '<div><b><script>alert(1)</script>Safe</b></div>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('script');
    expect(output).toContain('<b>Safe</b>');
  });

  it('should remove data: URIs', () => {
    const input = '<img src="data:image/svg+xml;base64,...">';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('data:');
  });
});
