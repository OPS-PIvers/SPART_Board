import React, { useMemo, useRef, useEffect } from 'react';
import {
  WidgetData,
  SoundboardConfig,
  SoundboardGlobalConfig,
  SoundboardSound,
} from '@/types';
import { useAuth } from '@/context/useAuth';
import { WidgetLayout } from '@/components/widgets/WidgetLayout';
import { ScaledEmptyState } from '@/components/common/ScaledEmptyState';
import { Volume2 } from 'lucide-react';
import { STANDARD_COLORS } from '@/config/colors';

export const SoundboardWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const config = widget.config as SoundboardConfig;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { selectedSoundIds = [] } = config;

  const { featurePermissions, selectedBuildings } = useAuth();
  const buildingId = selectedBuildings.length > 0 ? selectedBuildings[0] : null;

  const globalConfig = useMemo(() => {
    const perm = featurePermissions.find((p) => p.widgetType === 'soundboard');
    return perm?.config as SoundboardGlobalConfig | undefined;
  }, [featurePermissions]);

  const visibleSounds = useMemo(() => {
    let availableSounds: SoundboardSound[] = [];

    if (!buildingId) {
      // If no building selected, aggregate all available sounds from all building defaults
      const allDefaults = globalConfig?.buildingDefaults ?? {};
      availableSounds = Object.values(allDefaults).flatMap(
        (d) => d.availableSounds ?? []
      );
    } else {
      availableSounds =
        globalConfig?.buildingDefaults?.[buildingId]?.availableSounds ?? [];
    }

    return availableSounds.filter(
      (sound) =>
        selectedSoundIds.includes(sound.id) &&
        typeof sound.url === 'string' &&
        sound.url.trim() !== ''
    );
  }, [globalConfig, buildingId, selectedSoundIds]);

  const playSound = (url: string) => {
    if (!url) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
    } else {
      audioRef.current.src = url;
      audioRef.current.currentTime = 0;
    }
    audioRef.current.play().catch(() => {
      /* silent */
    });
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  if (visibleSounds.length === 0) {
    return (
      <ScaledEmptyState
        icon={Volume2}
        title="No Sounds Selected"
        subtitle="Flip to set up your board."
      />
    );
  }

  // Calculate grid layout based on number of items
  const columns =
    visibleSounds.length > 4 ? (visibleSounds.length > 9 ? 4 : 3) : 2;

  return (
    <WidgetLayout
      padding="p-0"
      content={
        <div
          className="w-full h-full grid"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gap: 'min(12px, 2cqmin)',
            padding: 'min(12px, 2cqmin)',
          }}
        >
          {visibleSounds.map((sound) => (
            <button
              key={sound.id}
              onClick={() => playSound(sound.url)}
              className="relative overflow-hidden flex flex-col items-center justify-center transition-transform active:scale-95 group shadow-sm hover:shadow-md border border-slate-200/50"
              style={{
                backgroundColor: sound.color ?? STANDARD_COLORS.indigo, // default indigo-500
                borderRadius: 'min(16px, 3cqmin)',
              }}
            >
              {/* Overlay for interaction state */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 group-active:bg-black/10 transition-colors" />

              <Volume2
                className="text-white drop-shadow-sm"
                style={{
                  width: 'min(48px, 15cqmin)',
                  height: 'min(48px, 15cqmin)',
                  marginBottom: 'min(8px, 1.5cqmin)',
                }}
              />
              <span
                className="font-black text-white text-center leading-tight drop-shadow-md break-words max-w-full"
                style={{
                  fontSize: 'min(18px, 6cqmin)',
                  paddingLeft: 'min(8px, 1.5cqmin)',
                  paddingRight: 'min(8px, 1.5cqmin)',
                }}
              >
                {sound.label}
              </span>
            </button>
          ))}
        </div>
      }
    />
  );
};
