import { createContext } from 'react';

export type SettingsLabelTone = 'default' | 'drawer';

export const SettingsLabelToneContext =
  createContext<SettingsLabelTone>('default');

export const SettingsLabelToneProvider = SettingsLabelToneContext.Provider;
