import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useDashboard } from '@/context/useDashboard';
import {
  WidgetData,
  TextConfig,
  DEFAULT_GLOBAL_STYLE,
  MiniAppConfig,
} from '@/types';
import { STICKY_NOTE_COLORS } from '@/config/colors';
import { sanitizeHtml } from '@/utils/security';
import { getFontClass } from '@/utils/styles';
import { Wand2, Loader2 } from 'lucide-react';

import { WidgetLayout } from '@/components/widgets/WidgetLayout';
import { PLACEHOLDER_TEXT } from './constants';
import { generateMiniAppCode } from '@/utils/ai';

const NEW_WIDGET_SPACING = 20;

export const TextWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget, addWidget, addToast, activeDashboard } = useDashboard();
  const [isGeneratingApp, setIsGeneratingApp] = useState(false);
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;
  const config = widget.config as TextConfig;
  const {
    content = '',
    bgColor = STICKY_NOTE_COLORS.yellow,
    fontSize = 18,
    fontFamily = 'global',
    fontColor = '#334155',
  } = config;

  const fontClass = getFontClass(fontFamily, globalStyle.fontFamily);

  const editorRef = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false);
  const lastExternalContent = useRef(content);
  const didInit = useRef(false);

  // On first render, set initial content. On subsequent renders, sync external
  // content changes into the DOM only when not actively editing and only when
  // the content actually changed externally (e.g. template applied).
  useEffect(() => {
    if (!editorRef.current) return;
    if (!didInit.current) {
      didInit.current = true;
      editorRef.current.innerHTML = content ? sanitizeHtml(content) : '';
      return;
    }
    if (!isEditingRef.current && content !== lastExternalContent.current) {
      lastExternalContent.current = content;
      editorRef.current.innerHTML = content ? sanitizeHtml(content) : '';
    }
  }, [content]);

  const isPlaceholder = !content || content === PLACEHOLDER_TEXT;

  const handleFocus = useCallback(() => {
    isEditingRef.current = true;
    // Clear placeholder content when user focuses
    if (editorRef.current && isPlaceholder) {
      editorRef.current.innerHTML = '';
    }
  }, [isPlaceholder]);

  /** Normalize browser empty-editor markup (<br>, <div><br></div>) to '' */
  const readEditorContent = useCallback((): string => {
    if (!editorRef.current) return '';
    const html = editorRef.current.innerHTML;
    // Browsers leave <br> or <div><br></div> when content is fully deleted
    const stripped = html
      .replace(/<br\s*\/?>/gi, '')
      .replace(/<div>\s*<\/div>/gi, '')
      .trim();
    return stripped === '' ? '' : sanitizeHtml(html);
  }, []);

  const handleBlur = useCallback(() => {
    isEditingRef.current = false;
    const content = readEditorContent();
    // Update the ref so the useEffect doesn't re-apply the same content
    lastExternalContent.current = content;
    updateWidget(widget.id, {
      config: {
        ...config,
        content,
      } as TextConfig,
    });
  }, [widget.id, config, updateWidget, readEditorContent]);

  const handleInput = useCallback(() => {
    // Save on every input for immediate persistence (debounced by DashboardContext)
    const content = readEditorContent();
    lastExternalContent.current = content;
    updateWidget(widget.id, {
      config: {
        ...config,
        content,
      } as TextConfig,
    });
  }, [widget.id, config, updateWidget, readEditorContent]);

  const handleGenerateMiniApp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentContent = readEditorContent();

    // Strip HTML tags for the prompt
    const plainText =
      new DOMParser().parseFromString(currentContent, 'text/html')
        .documentElement.textContent || '';

    if (isGeneratingApp || !plainText.trim() || plainText === PLACEHOLDER_TEXT)
      return;

    setIsGeneratingApp(true);
    try {
      addToast('Analyzing text and generating Mini App...', 'info');

      const prompt = `Create an interactive educational mini app based on this content/resource: ${plainText.substring(0, 500)}`;
      const result = await generateMiniAppCode(prompt);

      // Create new Mini App widget next to this text widget
      addWidget('miniApp', {
        x: widget.x + widget.w + NEW_WIDGET_SPACING,
        y: widget.y,
        config: {
          activeApp: {
            id: crypto.randomUUID(),
            title: result.title,
            html: result.html,
            createdAt: Date.now(),
          },
          activeAppUnsaved: true,
        } as Partial<MiniAppConfig>,
      });

      addToast('Mini App generated successfully!', 'success');
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Failed to generate app',
        'error'
      );
    } finally {
      setIsGeneratingApp(false);
    }
  };

  const plainText =
    new DOMParser().parseFromString(config.content || '', 'text/html')
      .documentElement.textContent || '';
  const hasText = plainText.trim().length > 0 && plainText !== PLACEHOLDER_TEXT;

  return (
    <WidgetLayout
      padding="p-0"
      content={
        <div
          className={`h-full w-full ${fontClass} outline-none transition-colors overflow-y-auto custom-scrollbar bg-transparent relative group/text-content`}
          style={{ padding: 'min(16px, 3.5cqmin)', color: fontColor }}
        >
          {/* Wand button for App Generation */}
          {hasText && (
            <div className="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-0 group-hover/text-content:opacity-100 focus-within:opacity-100 transition-opacity">
              <button
                onClick={handleGenerateMiniApp}
                disabled={isGeneratingApp}
                className="bg-white/80 backdrop-blur-sm hover:bg-indigo-50 text-indigo-500 shadow-sm border border-indigo-200/50 rounded-lg p-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                title="Generate Interactive Mini App"
                aria-label="Generate Interactive Mini App"
              >
                {isGeneratingApp ? (
                  <Loader2
                    className="animate-spin"
                    style={{
                      width: 'min(12px, 2.5cqmin)',
                      height: 'min(12px, 2.5cqmin)',
                    }}
                  />
                ) : (
                  <Wand2
                    style={{
                      width: 'min(12px, 2.5cqmin)',
                      height: 'min(12px, 2.5cqmin)',
                    }}
                  />
                )}
              </button>
            </div>
          )}
          {/* Background color overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20 z-0"
            style={{ backgroundColor: bgColor }}
          />
          <div
            ref={editorRef}
            className="relative z-10 h-full w-full outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400/60 empty:before:pointer-events-none"
            style={{
              fontSize: `min(${fontSize}px, ${fontSize * 0.5}cqmin)`,
              lineHeight: 1.5,
            }}
            data-placeholder={PLACEHOLDER_TEXT}
            contentEditable
            suppressContentEditableWarning
            onFocus={handleFocus}
            onBlur={handleBlur}
            onInput={handleInput}
          />
        </div>
      }
    />
  );
};
