import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { MiniAppGlobalConfig } from '@/types';

export const useMiniAppGlobalConfig = () => {
  const [globalConfig, setGlobalConfig] = useState<MiniAppGlobalConfig | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    const fetchGlobal = async () => {
      try {
        const snap = await getDoc(doc(db, 'feature_permissions', 'miniApp'));
        if (!isCancelled && snap.exists()) {
          const data = snap.data();
          if (data.config) {
            setGlobalConfig(data.config as MiniAppGlobalConfig);
          }
        }
      } catch (err) {
        console.error('Error fetching MiniApp global config:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };
    void fetchGlobal();
    return () => {
      isCancelled = true;
    };
  }, []);

  return { globalConfig, loading };
};
