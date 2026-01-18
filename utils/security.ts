/**
 * Basic HTML sanitizer to prevent XSS in contentEditable widgets.
 * Removes script tags, iframes, objects, embeds, and event handlers.
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';

  // 1. Remove script tags and their content
  let clean = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '');

  // 2. Remove other dangerous tags (iframe, object, embed, form)
  clean = clean.replace(
    /<\/?(iframe|object|embed|form|input|button|textarea|select|option)[^>]*>/gim,
    ''
  );

  // 3. Remove event handlers (on*) and javascript: protocols
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(clean, 'text/html');

    // Remove dangerous elements that might have slipped through regex
    const dangerousTags = [
      'script',
      'iframe',
      'object',
      'embed',
      'form',
      'link',
      'style',
      'meta',
    ];
    dangerousTags.forEach((tag) => {
      const elements = doc.querySelectorAll(tag);
      elements.forEach((el) => el.remove());
    });

    // Remove dangerous attributes
    const allElements = doc.querySelectorAll('*');
    allElements.forEach((el) => {
      const attributes = Array.from(el.attributes);
      attributes.forEach((attr) => {
        if (
          attr.name.startsWith('on') ||
          attr.value.toLowerCase().includes('javascript:') ||
          attr.value.toLowerCase().includes('data:')
        ) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return doc.body.innerHTML;
  }

  return clean;
};
