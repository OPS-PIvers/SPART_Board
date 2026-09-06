import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UrlConfigurationPanel } from './UrlConfigurationPanel';
import { UrlGlobalConfig } from '@/types';
import type { Building } from '@/config/buildings';

// The panel reads its building list from useAdminBuildings(), which for a
// real org can hand back a legacy long-form building doc id (e.g.
// `schumann-elementary`) when that org's building record predates the
// short-id migration — see config/buildings.ts's BUILDING_ID_ALIASES.
const mockUseAdminBuildings = vi.fn<() => Building[]>();
vi.mock('@/hooks/useAdminBuildings', () => ({
  useAdminBuildings: () => mockUseAdminBuildings(),
}));

describe('UrlConfigurationPanel', () => {
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

    const config: UrlGlobalConfig = {
      buildingDefaults: {
        schumann: {
          buildingId: 'schumann',
          urls: [{ id: 'link-1', url: 'https://example.com', title: 'Math' }],
        },
      },
    };

    render(<UrlConfigurationPanel config={config} onChange={mockOnChange} />);

    // If the lookup missed (raw-id bug), the saved link would not render
    // and the "Active Default Links" section would be omitted entirely.
    expect(screen.getByText('Math')).toBeInTheDocument();
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

    const config: UrlGlobalConfig = { buildingDefaults: {} };

    render(<UrlConfigurationPanel config={config} onChange={mockOnChange} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. google.com'), {
      target: { value: 'khanacademy.org' },
    });
    fireEvent.click(screen.getByText('Add Link'));

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const updated = mockOnChange.mock.calls[0][0] as UrlGlobalConfig;
    expect(updated.buildingDefaults?.schumann?.urls?.[0]?.url).toBe(
      'https://khanacademy.org'
    );
    expect(updated.buildingDefaults?.['schumann-elementary']).toBeUndefined();
  });
});
