import { supabase } from './supabase';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface AICoachResponse {
  content: string | null;
  toolCalls: AIToolCall[];
  finishReason: string;
}

export interface AICoachRequestBody {
  messages: { role: string; content: string }[];
  profile?: Record<string, unknown>;
  nutrition?: {
    targetCalories: number;
    proteinTarget: number;
    mealStructure?: string;
  };
  currentWorkoutPlan?: {
    sessions: {
      day: string;
      name: string;
      exerciseCount: number;
    }[];
  };
  currentMealPlan?: {
    days: {
      day: string;
      totalCalories: number;
      totalProtein: number;
      hasMeals: boolean;
    }[];
  };
  streak?: number;
  language?: 'ar' | 'en';
}

export async function sendAICoachMessage(body: AICoachRequestBody): Promise<AICoachResponse> {
  console.log('[AICoach] Sending message, messages count:', body.messages.length);

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (!session || sessionError) {
    console.warn('[AICoach] No valid session, attempting refresh...');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session) {
      console.error('[AICoach] Session refresh failed:', refreshError?.message);
      throw new Error('Authentication required. Please log in again.');
    }
  }

  const { data, error } = await supabase.functions.invoke('ai-coach', {
    body,
  });

  if (error) {
    console.error('[AICoach] Edge function error:', error.message);
    throw new Error(`AI Coach error: ${error.message}`);
  }

  const result: AICoachResponse = data;
  console.log('[AICoach] Response received, content:', result.content?.substring(0, 80), 'toolCalls:', result.toolCalls.length, 'finishReason:', result.finishReason);
  return result;
}
