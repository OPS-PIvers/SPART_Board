import {
  WidgetType,
  WidgetConfig,
  GridPosition,
  PollOption,
  MiniAppConfig,
  EmbedConfig,
  TextConfig,
  PollConfig,
} from '@/types';

/** Validates and clamps grid coordinates to the 12x12 system */
export const validateGridConfig = (pos: GridPosition): GridPosition | null => {
  if (!pos) return null;
  const col = Number(pos.col);
  const row = Number(pos.row);
  const colSpan = Number(pos.colSpan);
  const rowSpan = Number(pos.rowSpan);

  if (isNaN(col) || isNaN(row) || isNaN(colSpan) || isNaN(rowSpan)) {
    return null;
  }

  // Clamp starting points to 0-11
  const vCol = Math.max(0, Math.min(11, Math.floor(col)));
  const vRow = Math.max(0, Math.min(11, Math.floor(row)));

  // Clamp spans to at least 1, and ensure they don't exceed the grid boundary
  const vColSpan = Math.max(1, Math.min(12 - vCol, Math.floor(colSpan)));
  const vRowSpan = Math.max(1, Math.min(12 - vRow, Math.floor(rowSpan)));

  return { col: vCol, row: vRow, colSpan: vColSpan, rowSpan: vRowSpan };
};

/** Basic sanitization for AI-generated widget configurations to prevent XSS/Injection */
export const sanitizeAIConfig = (
  type: WidgetType,
  config: Partial<WidgetConfig> | undefined
): Partial<WidgetConfig> => {
  if (!config || typeof config !== 'object') return {};

  // Deep clone to avoid mutating original
  const sanitized = JSON.parse(JSON.stringify(config)) as Record<
    string,
    unknown
  >;

  // 1. Critical XSS prevention for widgets with HTML/Script capability
  // AI is not intended to generate executable code via the layout tool.
  if (type === 'miniApp') {
    const c = sanitized as unknown as Partial<MiniAppConfig>;
    delete c.activeApp;
  }

  if (type === 'miniApp' || type === 'embed') {
    const c = sanitized as unknown as Record<string, unknown>;
    delete c.html;
  }

  // 2. URL validation for widgets that load external content
  if (type === 'embed' || type === 'qr') {
    const c = sanitized as unknown as Partial<EmbedConfig>;
    if (typeof c.url === 'string' && c.url.trim() !== '') {
      try {
        const url = new URL(c.url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          c.url = '';
        }
      } catch {
        c.url = '';
      }
    }
  }

  // 3. Type-safe content checks for common widgets
  if (type === 'text') {
    const c = sanitized as unknown as Partial<TextConfig>;
    if (typeof c.content !== 'string') c.content = '';
    if (typeof c.fontSize === 'number') {
      c.fontSize = Math.max(8, Math.min(120, c.fontSize));
    }
  }

  if (type === 'poll') {
    const c = sanitized as unknown as Partial<PollConfig>;
    if (typeof c.question !== 'string') c.question = '';
    if (Array.isArray(c.options)) {
      c.options = (c.options as unknown[]).map((opt: unknown) => {
        let label = '';
        if (typeof opt === 'string') {
          label = opt;
        } else if (opt && typeof opt === 'object') {
          const o = opt as Record<string, unknown>;
          const rawLabel = o.label;
          if (typeof rawLabel === 'string') {
            label = rawLabel;
          } else if (
            typeof rawLabel === 'number' ||
            typeof rawLabel === 'boolean'
          ) {
            label = String(rawLabel);
          }
        }

        const pollOpt: PollOption = {
          label,
          votes: 0,
        };
        return pollOpt;
      });
    }
  }

  return sanitized as Partial<WidgetConfig>;
};
