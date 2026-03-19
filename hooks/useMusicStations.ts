import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { MusicStation } from '@/types';
import { useAuth } from '@/context/useAuth';

export const useMusicStations = () => {
  const [stations, setStations] = useState<MusicStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedBuildings } = useAuth();

  useEffect(() => {
    const docRef = doc(db, 'global_music_stations', 'library');
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as { stations?: MusicStation[] };
          const raw: MusicStation[] = data.stations ?? [];
          const filtered = raw
            .filter((s) => s.isActive !== false)
            .filter((s) => {
              // No building restriction → visible to everyone
              if (!s.buildingIds || s.buildingIds.length === 0) return true;
              // User has no building selected → show all unrestricted stations
              if (selectedBuildings.length === 0) return true;
              // Show if any of the user's buildings match the station's buildings
              return s.buildingIds.some((id) => selectedBuildings.includes(id));
            })
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          setStations(filtered);
        } else {
          setStations([]);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching music stations:', err);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [selectedBuildings]);

  return { stations, isLoading };
};
