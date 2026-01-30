import { supabase } from './supabase';
import type { 
  FitnessProfile, 
  ProgressEntry, 
  WorkoutLog 
} from '@/types/fitness';

export interface ProfileRow {
  user_id: string;
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

export const remoteFitnessRepo = {
  async upsertProfile(userId: string, profile: FitnessProfile) {
    console.log('[RemoteFitnessRepo] Upserting profile for user:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        data: profile,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[RemoteFitnessRepo] Error upserting profile:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('[RemoteFitnessRepo] Profile upserted successfully');
    return data as ProfileRow;
  },

  async fetchProfile(userId: string): Promise<FitnessProfile | null> {
    console.log('[RemoteFitnessRepo] Fetching profile for user:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('data')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[RemoteFitnessRepo] Profile not found');
        return null;
      }
      console.error('[RemoteFitnessRepo] Error fetching profile:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('[RemoteFitnessRepo] Profile fetched successfully');
    return data.data as FitnessProfile;
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
      console.error('[RemoteFitnessRepo] Error inserting progress entry:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('[RemoteFitnessRepo] Progress entry inserted successfully');
    return data as ProgressEntryRow;
  },

  async fetchProgressEntries(userId: string): Promise<ProgressEntry[]> {
    console.log('[RemoteFitnessRepo] Fetching progress entries for user:', userId);
    
    const { data, error } = await supabase
      .from('progress_entries')
      .select('data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[RemoteFitnessRepo] Error fetching progress entries:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('[RemoteFitnessRepo] Progress entries fetched:', data.length);
    return data.map(row => row.data as ProgressEntry);
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
      console.error('[RemoteFitnessRepo] Error inserting workout log:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('[RemoteFitnessRepo] Workout log inserted successfully');
    return data as WorkoutLogRow;
  },

  async fetchWorkoutLogs(userId: string): Promise<WorkoutLog[]> {
    console.log('[RemoteFitnessRepo] Fetching workout logs for user:', userId);
    
    const { data, error } = await supabase
      .from('workout_logs')
      .select('data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[RemoteFitnessRepo] Error fetching workout logs:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('[RemoteFitnessRepo] Workout logs fetched:', data.length);
    return data.map(row => row.data as WorkoutLog);
  },
};
