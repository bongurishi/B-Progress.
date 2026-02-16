
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, Role } from '../types';
import { STORAGE_KEY, INITIAL_USERS, INITIAL_TASKS } from '../constants';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

export const supabase: SupabaseClient | null = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const DataService = {
  isCloudEnabled(): boolean {
    return !!supabase;
  },

  async signUp(email: string, password: string, metadata: any) {
    if (!supabase) throw new Error("Cloud not configured");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: {
          ...metadata,
          // Explicitly ensure the role is saved in user_metadata
          role: metadata.role || Role.FRIEND 
        } 
      }
    });
    if (error) throw error;
    return data.user;
  },

  async signIn(email: string, password: string) {
    if (!supabase) throw new Error("Cloud not configured");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data.user;
  },

  async signOut() {
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem(STORAGE_KEY);
  },

  async loadState(userId: string): Promise<AppState> {
    // 1. Try Cloud (User specific row)
    if (this.isCloudEnabled() && userId) {
      try {
        const { data, error } = await supabase!
          .from('app_state')
          .select('state_json')
          .eq('id', userId)
          .single();

        if (data && data.state_json) return data.state_json;
      } catch (e) {
        console.error("Cloud fetch failed for user:", userId, e);
      }
    }

    // 2. Fallback to Local Storage
    const saved = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Local storage parse failed:", e);
      }
    }

    // 3. Absolute fallback to fresh state for new user
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

  async saveState(userId: string, state: AppState): Promise<void> {
    if (!userId) return;

    // Backup locally per user
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(state));

    // Sync to Cloud per user
    if (this.isCloudEnabled()) {
      try {
        await supabase!
          .from('app_state')
          .upsert({ id: userId, state_json: state }, { onConflict: 'id' });
      } catch (e) {
        console.error("Cloud sync failed for user:", userId, e);
      }
    }
  },

  // Helper to aggregate ALL data for the Supporter (Admin)
  async loadMasterState(): Promise<AppState> {
    const defaultState: AppState = {
      users: INITIAL_USERS,
      tasks: INITIAL_TASKS,
      records: [],
      messages: [],
      groups: [],
      statuses: [],
      currentUser: null,
    };

    if (!this.isCloudEnabled()) return defaultState;

    try {
      const { data, error } = await supabase!
        .from('app_state')
        .select('state_json');

      if (error || !data) return defaultState;

      // Merge all user states into one for the Admin view
      return data.reduce((acc, row) => {
        const userState: AppState = row.state_json;
        if (!userState) return acc;

        return {
          ...acc,
          // Collect all users across all rows
          users: [...acc.users, ...(userState.currentUser ? [userState.currentUser] : [])],
          // Collect all records
          records: [...acc.records, ...(userState.records || [])],
          // Collect all messages
          messages: [...acc.messages, ...(userState.messages || [])],
          // Collect all statuses
          statuses: [...acc.statuses, ...(userState.statuses || [])],
          // Deduplicate groups by ID
          groups: Array.from(new Map([...acc.groups, ...(userState.groups || [])].map(g => [g.id, g])).values()),
        };
      }, defaultState);
    } catch (e) {
      console.error("Master load failed", e);
      return defaultState;
    }
  }
};
