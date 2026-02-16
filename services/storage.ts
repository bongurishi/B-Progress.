
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState } from '../types';
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
      options: { data: metadata }
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

        if (data) return data.state_json;
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

  // Helper to get ALL states (Admin only)
  async loadAllStates(): Promise<AppState[]> {
    if (!this.isCloudEnabled()) return [];
    const { data, error } = await supabase!
      .from('app_state')
      .select('state_json');
    
    if (error) return [];
    return data.map(row => row.state_json);
  }
};
