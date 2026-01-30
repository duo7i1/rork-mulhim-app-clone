import { supabase } from './supabase';
import type { 
  FitnessProfile, 
  ProgressEntry, 
  WorkoutLog 
} from '@/types/fitness';

export interface ProfileRow {
  id: string;
  data: FitnessProfile;
  updated_at?: string;
}

export interface ProgressEntryRow {
  id: string;
  user_id: string;
  data: ProgressEntry;
  created_at: string;
}

export interface WorkoutLogRow {
  id: string;
  user_id: string;
  data: WorkoutLog;
  created_at: string;
}

async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    return !error || error.code === 'PGRST116';
  } catch (e) {
    console.warn('[RemoteFitnessRepo] Supabase connection check failed:', e);
    return false;
  }
}

export const remoteFitnessRepo = {
  async upsertProfile(userId: string, profile: FitnessProfile) {
    console.log('[RemoteFitnessRepo] Upserting profile for user:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        data: profile,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[RemoteFitnessRepo] Error upserting profile:', JSON.stringify({
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }, null, 2));
      throw error;
    }

    console.log('[RemoteFitnessRepo] Profile upserted successfully');
    return data as ProfileRow;
  },

  async fetchProfile(userId: string): Promise<FitnessProfile | null> {
    console.log('[RemoteFitnessRepo] Fetching profile for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('data')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('[RemoteFitnessRepo] Profile not found');
          return null;
        }
        console.error('[RemoteFitnessRepo] Error fetching profile:', JSON.stringify({
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }, null, 2));
        throw error;
      }

      console.log('[RemoteFitnessRepo] Profile fetched successfully');
      return data.data as FitnessProfile;
    } catch (error: any) {
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        console.error('[RemoteFitnessRepo] Network error fetching profile. Supabase may be unreachable.');
        throw new Error('NETWORK_ERROR');
      }
      throw error;
    }
  },

  async insertProgressEntry(userId: string, entry: ProgressEntry) {
    console.log('[RemoteFitnessRepo] Inserting progress entry for user:', userId);
    
    const { data, error } = await supabase
      .from('progress_entries')
      .insert({
        user_id: userId,
        data: entry,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[RemoteFitnessRepo] Error inserting progress entry:', JSON.stringify({
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }, null, 2));
      throw error;
    }

    console.log('[RemoteFitnessRepo] Progress entry inserted successfully');
    return data as ProgressEntryRow;
  },

  async fetchProgressEntries(userId: string): Promise<ProgressEntry[]> {
    console.log('[RemoteFitnessRepo] Fetching progress entries for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('progress_entries')
        .select('data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[RemoteFitnessRepo] Error fetching progress entries:', JSON.stringify({
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }, null, 2));
        throw error;
      }

      console.log('[RemoteFitnessRepo] Progress entries fetched:', data.length);
      return data.map(row => row.data as ProgressEntry);
    } catch (error: any) {
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        console.error('[RemoteFitnessRepo] Network error fetching progress entries. Supabase may be unreachable.');
        throw new Error('NETWORK_ERROR');
      }
      throw error;
    }
  },

  async insertWorkoutLog(userId: string, log: WorkoutLog) {
    console.log('[RemoteFitnessRepo] Inserting workout log for user:', userId);
    
    const { data, error } = await supabase
      .from('workout_logs')
      .insert({
        user_id: userId,
        data: log,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[RemoteFitnessRepo] Error inserting workout log:', JSON.stringify({
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }, null, 2));
      throw error;
    }

    console.log('[RemoteFitnessRepo] Workout log inserted successfully');
    return data as WorkoutLogRow;
  },

  async fetchWorkoutLogs(userId: string): Promise<WorkoutLog[]> {
    console.log('[RemoteFitnessRepo] Fetching workout logs for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[RemoteFitnessRepo] Error fetching workout logs:', JSON.stringify({
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }, null, 2));
        throw error;
      }

      console.log('[RemoteFitnessRepo] Workout logs fetched:', data.length);
      return data.map(row => row.data as WorkoutLog);
    } catch (error: any) {
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        console.error('[RemoteFitnessRepo] Network error fetching workout logs. Supabase may be unreachable.');
        throw new Error('NETWORK_ERROR');
      }
      throw error;
    }
  },
};
