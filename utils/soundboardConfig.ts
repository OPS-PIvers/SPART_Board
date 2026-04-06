import {
  SoundboardBuildingConfig,
  SoundboardGlobalConfig,
  SoundboardSound,
} from '@/types';
import { SOUND_LIBRARY } from '@/config/soundLibrary';

const dedupeById = (sounds: SoundboardSound[]): SoundboardSound[] => {
  const seenIds = new Set<string>();
  return sounds.filter((sound) => {
    if (seenIds.has(sound.id)) {
      return false;
    }
    seenIds.add(sound.id);
    return true;
  });
};

const resolveBuildingSounds = (
  buildingConfig: SoundboardBuildingConfig,
  sharedCustomSounds: SoundboardSound[]
): SoundboardSound[] => {
  const library = SOUND_LIBRARY.filter((sound) =>
    buildingConfig.enabledLibrarySoundIds?.includes(sound.id)
  );

  const sharedCustom = sharedCustomSounds.filter((sound) =>
    buildingConfig.enabledCustomSoundIds?.includes(sound.id)
  );

  // Backwards compatibility for legacy building-level custom sounds.
  const legacyCustom = buildingConfig.availableSounds ?? [];

  return dedupeById([...library, ...sharedCustom, ...legacyCustom]);
};

export const getAvailableSoundboardSounds = (
  globalConfig: SoundboardGlobalConfig | undefined,
  buildingId: string | null
): SoundboardSound[] => {
  const buildingDefaults = globalConfig?.buildingDefaults ?? {};
  const sharedCustomSounds = globalConfig?.customLibrarySounds ?? [];

  if (buildingId) {
    const buildingConfig = buildingDefaults[buildingId] ?? {
      availableSounds: [],
      enabledLibrarySoundIds: [],
      enabledCustomSoundIds: [],
    };

    return resolveBuildingSounds(buildingConfig, sharedCustomSounds);
  }

  const allSounds = Object.values(buildingDefaults).flatMap((buildingConfig) =>
    resolveBuildingSounds(buildingConfig, sharedCustomSounds)
  );

  return dedupeById(allSounds);
};
