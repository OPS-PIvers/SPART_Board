import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';
import { ClassLinkData } from '@/types';

/**
 * Service to interact with the ClassLink Roster Server proxy.
 */
class ClassLinkService {
  private cache: ClassLinkData | null = null;
  private lastFetch: number = 0;
  private CACHE_TTL = 1000 * 60 * 5; // 5 minutes

  /**
   * Fetches the rosters for the currently authenticated teacher.
   */
  async getRosters(forceRefresh = false): Promise<ClassLinkData> {
    const now = Date.now();
    if (!forceRefresh && this.cache && now - this.lastFetch < this.CACHE_TTL) {
      return this.cache;
    }

    try {
      const getClassLinkRoster = httpsCallable<void, ClassLinkData>(
        functions,
        'getClassLinkRoster'
      );
      const result = await getClassLinkRoster();

      this.cache = result.data;
      this.lastFetch = now;

      return this.cache;
    } catch (error) {
      console.error('Error fetching ClassLink rosters:', error);
      throw error;
    }
  }

  /**
   * Clears the local cache.
   */
  clearCache() {
    this.cache = null;
    this.lastFetch = 0;
  }
}

export const classLinkService = new ClassLinkService();
