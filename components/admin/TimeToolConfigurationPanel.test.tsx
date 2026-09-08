import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TimeToolConfigurationPanel } from './TimeToolConfigurationPanel';
import { TimeToolGlobalConfig } from '@/types';
import type { Building } from '@/config/buildings';

// The panel reads its building list from useAdminBuildings(), which for a
// real org can hand back a legacy long-form building doc id (e.g.
// `schumann-elementary`) when that org's building record predates the
// short-id migration — see config/buildings.ts's BUILDING_ID_ALIASES.
const mockUseAdminBuildings = vi.fn<() => Building[]>();
vi.mock('@/hooks/useAdminBuildings', () => ({
  useAdminBuildings: () => mockUseAdminBuildings(),
}));

describe('TimeToolConfigurationPanel', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('finds a buildingDefaults entry keyed by the canonical id when the org building record resolves to a legacy raw id', () => {
    // Saved config is canonically keyed ('schumann'), but this org's
    // building doc still resolves to the legacy long-form id.
    mockUseAdminBuildings.mockReturnValue([
      {
        id: 'schumann-elementary',
        name: 'Schumann Elementary',
        gradeLevels: ['k-2'],
        gradeLabel: 'K-2',
      },
    ]);

    const config: TimeToolGlobalConfig = {
      buildingDefaults: {
        schumann: {
          buildingId: 'schumann',
          mode: 'stopwatch',
        },
      },
    };

    render(
      <TimeToolConfigurationPanel config={config} onChange={mockOnChange} />
    );

    // If the lookup missed (raw-id bug), the default mode radio would fall
    // back to 'timer' (the widget default), not the saved 'stopwatch'.
    const stopwatchRadio = screen.getByRole('radio', { name: 'Stopwatch' });
    expect(stopwatchRadio).toHaveAttribute('aria-checked', 'true');
    const timerRadio = screen.getByRole('radio', { name: 'Timer' });
    expect(timerRadio).toHaveAttribute('aria-checked', 'false');
  });

  it('saves building defaults under the canonical building id, not the legacy raw id', () => {
    mockUseAdminBuildings.mockReturnValue([
      {
        id: 'schumann-elementary',
        name: 'Schumann Elementary',
        gradeLevels: ['k-2'],
        gradeLabel: 'K-2',
      },
    ]);

    const config: TimeToolGlobalConfig = { buildingDefaults: {} };

    render(
      <TimeToolConfigurationPanel config={config} onChange={mockOnChange} />
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Stopwatch' }));

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const updated = mockOnChange.mock.calls[0][0] as TimeToolGlobalConfig;
    expect(updated.buildingDefaults?.schumann?.mode).toBe('stopwatch');
    expect(updated.buildingDefaults?.['schumann-elementary']).toBeUndefined();
  });
});
