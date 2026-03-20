import React, { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  NumberLineGlobalConfig,
  BuildingNumberLineDefaults,
  NumberLineMode,
} from '../../types';
import { Save, Loader2, Info } from 'lucide-react';
import { Toggle } from '../common/Toggle';

export const NumberLineConfigurationPanel: React.FC = () => {
  const { selectedBuildings, featurePermissions } = useAuth();
  const buildingId = selectedBuildings[0] ?? 'global';
  const permission = featurePermissions?.find(
    (p) => p.widgetType === 'numberLine'
  );

  const [config, setConfig] = useState<BuildingNumberLineDefaults>({
    min: 0,
    max: 10,
    step: 1,
    displayMode: 'integers',
    showArrows: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const docRef = doc(
          db,
          'configurations',
          `widget_numberLine_${buildingId}`
        );
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as NumberLineGlobalConfig;
          if (data.buildingDefaults) {
            setConfig((prev) => ({ ...prev, ...data.buildingDefaults }));
          }
        } else if (permission?.config) {
          const configObj = permission.config as NumberLineGlobalConfig;
          if (configObj.buildingDefaults) {
            // Fallback to permission config if it exists
            setConfig((prev) => ({
              ...prev,
              ...configObj.buildingDefaults,
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching Number Line config:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchConfig();
  }, [buildingId, permission]);

  const handleSave = async () => {
    if (!buildingId) return;
    setSaving(true);
    setSaveMessage(null);

    try {
      const docRef = doc(
        db,
        'configurations',
        `widget_numberLine_${buildingId}`
      );
      const newConfig: NumberLineGlobalConfig = {
        buildingDefaults: config,
      };

      await setDoc(docRef, newConfig, { merge: true });
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving Number Line config:', error);
      setSaveMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3 text-sm">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p>
          Configure the default settings applied when a user creates a new
          Number Line widget in this building. Users can still adjust these
          settings for their individual widgets.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Default Minimum Value
            </label>
            <input
              type="number"
              value={config.min}
              onChange={(e) =>
                setConfig({ ...config, min: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Default Maximum Value
            </label>
            <input
              type="number"
              value={config.max}
              onChange={(e) =>
                setConfig({ ...config, max: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Default Step Interval
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={config.step}
            onChange={(e) =>
              setConfig({ ...config, step: Number(e.target.value) })
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Default Display Mode
          </label>
          <select
            value={config.displayMode}
            onChange={(e) =>
              setConfig({
                ...config,
                displayMode: e.target.value as NumberLineMode,
              })
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="integers">Integers</option>
            <option value="decimals">Decimals</option>
            <option value="fractions">Fractions</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="block text-sm font-medium text-slate-700">
              Show Arrows on Ends
            </span>
            <span className="text-xs text-slate-500">
              Indicates the line continues in both directions
            </span>
          </div>
          <Toggle
            checked={config.showArrows}
            onChange={(checked) =>
              setConfig({ ...config, showArrows: checked })
            }
          />
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
        <p
          className={`text-sm ${
            saveMessage?.includes('successfully')
              ? 'text-green-600'
              : 'text-red-600'
          }`}
        >
          {saveMessage}
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Default Settings
        </button>
      </div>
    </div>
  );
};
