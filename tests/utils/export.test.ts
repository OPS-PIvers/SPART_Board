import { describe, it, expect, vi, afterEach } from 'vitest';
import { downloadCsv } from '../../utils/export';

describe('downloadCsv', () => {
  const createObjectURLMock = vi.fn();
  const revokeObjectURLMock = vi.fn();

  // Mock URL methods
  global.URL.createObjectURL = createObjectURLMock;
  global.URL.revokeObjectURL = revokeObjectURLMock;

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should create a blob and trigger download with correct content', () => {
    // We spy on document.createElement to intercept the link
    const createElementSpy = vi.spyOn(document, 'createElement');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    // We can't easily mock click() on a real element in JSDOM without it actually trying to navigate
    // So we will mock the return value of createElement partially
    const linkMock = document.createElement('a');
    vi.spyOn(linkMock, 'click').mockImplementation(() => {
      // noop to prevent navigation
    });
    createElementSpy.mockReturnValue(linkMock);

    createObjectURLMock.mockReturnValue('blob:url');

    const headers = ['Name', 'Score'];
    const rows = [
      ['Alice', 10],
      ['Bob', 20],
    ];

    downloadCsv('test.csv', headers, rows);

    // Check Blob creation
    expect(createObjectURLMock).toHaveBeenCalled();
    const blobArg = createObjectURLMock.mock.calls[0][0] as Blob;
    expect(blobArg).toBeInstanceOf(Blob);

    // Check Link creation and usage
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(linkMock.getAttribute('href')).toBe('blob:url');
    expect(linkMock.getAttribute('download')).toBe('test.csv');

    expect(appendChildSpy).toHaveBeenCalledWith(linkMock);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(linkMock.click).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalledWith(linkMock);
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:url');
  });

  it('should escape CSV values correctly', () => {
    const linkMock = document.createElement('a');
    vi.spyOn(linkMock, 'click').mockImplementation(() => {
      // noop
    });
    vi.spyOn(document, 'createElement').mockReturnValue(linkMock);

    // Capture Blob content
    let blobContent = '';

    // We mock the global Blob constructor.
    // We need to cast to any because we are replacing the global constructor with a mock/proxy.
    const OriginalBlob = global.Blob;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.Blob = function (content: any[], options: any) {
      if (Array.isArray(content) && typeof content[0] === 'string') {
        blobContent = content[0];
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return new OriginalBlob(content, options);
    } as unknown as typeof Blob;

    const headers = ['Name', 'Comment'];
    const rows = [
      ['Alice', 'Hello, world'],
      ['Bob', 'Quote "Test"'],
      ['Charlie', 'Line\nBreak'],
    ];

    downloadCsv('test.csv', headers, rows);

    // Expected CSV:
    // Name,Comment
    // Alice,"Hello, world"
    // Bob,"Quote ""Test"""
    // Charlie,"Line
    // Break"

    expect(blobContent).toContain('Name,Comment');
    expect(blobContent).toContain('Alice,"Hello, world"');
    expect(blobContent).toContain('Bob,"Quote ""Test"""');
    expect(blobContent).toContain('Charlie,"Line\nBreak"');

    // Restore Blob
    global.Blob = OriginalBlob;
  });
});
