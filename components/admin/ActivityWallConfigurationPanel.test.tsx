import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityWallConfigurationPanel } from './ActivityWallConfigurationPanel';
import { ActivityWallGlobalConfig } from '@/types';
import type { Building } from '@/config/buildings';

// The panel reads its building list from useAdminBuildings(), which for a
// real org can hand back a legacy long-form building doc id (e.g.
// `schumann-elementary`) when that org's building record predates the
// short-id migration — see config/buildings.ts's BUILDING_ID_ALIASES.
const mockUseAdminBuildings = vi.fn<() => Building[]>();
vi.mock('@/hooks/useAdminBuildings', () => ({
  useAdminBuildings: () => mockUseAdminBuildings(),
}));

describe('ActivityWallConfigurationPanel', () => {
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

    const config: ActivityWallGlobalConfig = {
      buildingDefaults: {
        schumann: {
          defaultMode: 'text',
          defaultIdentificationMode: 'anonymous',
          defaultModerationEnabled: false,
          defaultMaxPostsPerStudent: 7,
        },
      },
    };

    render(
      <ActivityWallConfigurationPanel
        config={config as unknown as Record<string, unknown>}
        onChange={mockOnChange}
      />
    );

    // If the lookup missed (raw-id bug), the input would fall back to the
    // widget default of 0, not the saved value of 7.
    expect(screen.getByLabelText('Default Max Posts Per Student')).toHaveValue(
      7
    );
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

    const config: ActivityWallGlobalConfig = { buildingDefaults: {} };

    render(
      <ActivityWallConfigurationPanel
        config={config as unknown as Record<string, unknown>}
        onChange={mockOnChange}
      />
    );

    fireEvent.click(screen.getByText('Show Student Names by Default'));

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const updated = mockOnChange.mock
      .calls[0][0] as unknown as ActivityWallGlobalConfig;
    expect(updated.buildingDefaults?.schumann?.defaultShowNames).toBe(true);
    expect(updated.buildingDefaults?.['schumann-elementary']).toBeUndefined();
  });
});
