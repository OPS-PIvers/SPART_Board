import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivityWallSettings } from './Settings';
import { WidgetData } from '@/types';
import { useDashboard } from '@/context/useDashboard';

vi.mock('@/context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

const mockUpdateWidget = vi.fn();

describe('ActivityWallSettings', () => {
  const widget: WidgetData = {
    id: 'widget-1',
    type: 'activity-wall',
    x: 0,
    y: 0,
    w: 4,
    h: 4,
    z: 1,
    flipped: false,
    config: {
      activeActivityId: 'activity-1',
      draftActivity: {
        id: 'draft-1',
        title: '',
        prompt: '',
        mode: 'text',
        moderationEnabled: false,
        identificationMode: 'anonymous',
        submissions: [],
        startedAt: null,
      },
      activities: [
        {
          id: 'activity-1',
          title: 'Warm Up',
          prompt: 'Share one idea',
          mode: 'text',
          moderationEnabled: true,
          identificationMode: 'anonymous',
          submissions: [],
          startedAt: 123,
        },
      ],
    },
  } as WidgetData;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
      '22222222-2222-2222-2222-222222222222'
    );
    vi.mocked(useDashboard).mockReturnValue({
      updateWidget: mockUpdateWidget,
    } as unknown as ReturnType<typeof useDashboard>);
  });

  it('stores demo responses as approved even when moderation is enabled', async () => {
    const user = userEvent.setup();
    render(<ActivityWallSettings widget={widget} />);

    await user.click(screen.getByTitle(/activity settings/i));
    await user.type(
      screen.getByPlaceholderText(/add demo text/i),
      'Teacher sample'
    );
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    expect(mockUpdateWidget).toHaveBeenCalledWith('widget-1', {
      config: expect.objectContaining({
        activities: [
          expect.objectContaining({
            id: 'activity-1',
            submissions: [
              expect.objectContaining({
                id: '22222222-2222-2222-2222-222222222222',
                content: 'Teacher sample',
                participantLabel: 'Demo Student',
                status: 'approved',
              }),
            ],
          }),
        ],
      }) as unknown,
    });
  });
});
