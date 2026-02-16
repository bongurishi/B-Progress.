import { AppState } from '../types';
import { STORAGE_KEY, INITIAL_USERS, INITIAL_TASKS } from '../constants';

export const DataService = {
  isCloudEnabled(): boolean {
    return !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);
  },

  async loadState(): Promise<AppState> {
    // 1. Always check Cloud first for cross-browser consistency
    if (this.isCloudEnabled()) {
      try {
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/app_state?id=eq.global&select=*`, {
          headers: {
            'apikey': process.env.SUPABASE_KEY!,
            'Authorization': `Bearer ${process.env.SUPABASE_KEY}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            return data[0].state_json;
          }
        }
      } catch (e) {
        console.error("Cloud fetch failed:", e);
      }
    }

    // 2. Fallback to Local Storage if Cloud fails or is not configured
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          users: parsed.users || INITIAL_USERS,
          tasks: parsed.tasks || INITIAL_TASKS,
          records: parsed.records || [],
          messages: parsed.messages || [],
          groups: parsed.groups || [],
          statuses: parsed.statuses || [],
          currentUser: parsed.currentUser || null,
        };
      } catch (e) {
        console.error("Local storage parse failed:", e);
      }
    }

    // 3. Absolute fallback to fresh state
    return {
      users: INITIAL_USERS,
      tasks: INITIAL_TASKS,
      records: [],
      messages: [],
      groups: [],
      statuses: [],
      currentUser: null,
    };
  },

  async saveState(state: AppState): Promise<void> {
    // Backup locally
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    // Sync to Cloud
    if (this.isCloudEnabled()) {
      try {
        await fetch(`${process.env.SUPABASE_URL}/rest/v1/app_state?id=eq.global`, {
          method: 'POST',
          headers: {
            'apikey': process.env.SUPABASE_KEY!,
            'Authorization': `Bearer ${process.env.SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({ id: 'global', state_json: state })
        });
      } catch (e) {
        console.error("Cloud sync failed:", e);
      }
    }
  }
};
