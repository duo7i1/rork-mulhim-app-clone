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

const SUPABASE_URL = 'https://fkwlgzkglyrmzdbscqbj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrd2xnemtnbHlybXpkYnNjcWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDUxMTUsImV4cCI6MjA4NTI4MTExNX0.c078nkR2_TJ9b9oPfukp-tI7pXQrosdGPMWJXqeN8Nc';

export async function sendAICoachMessage(body: AICoachRequestBody): Promise<AICoachResponse> {
  console.log('[AICoach] Sending message, messages count:', body.messages.length);

  let session = (await supabase.auth.getSession()).data.session;

  const isExpired = session?.expires_at ? (session.expires_at * 1000) < Date.now() : true;

  if (!session || isExpired) {
    console.warn('[AICoach] No valid session or token expired, refreshing...');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session) {
      console.error('[AICoach] Session refresh failed:', refreshError?.message);
      throw new Error('Authentication required. Please log in again.');
    }
    session = refreshData.session;
    console.log('[AICoach] Session refreshed, new expiry:', new Date(session.expires_at! * 1000).toISOString());
  }

  const url = `${SUPABASE_URL}/functions/v1/ai-coach`;
  console.log('[AICoach] Calling edge function via fetch:', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  console.log('[AICoach] Response status:', response.status);
  console.log('[AICoach] Response body:', responseText.substring(0, 500));

  if (!response.ok) {
    let errorDetail = responseText;
    try {
      const errorJson = JSON.parse(responseText);
      errorDetail = errorJson.error || errorJson.message || responseText;
    } catch (_e) {
      // keep raw text
    }
    console.error('[AICoach] Edge function error:', response.status, errorDetail);
    throw new Error(`AI Coach error (${response.status}): ${errorDetail}`);
  }

  const result: AICoachResponse = JSON.parse(responseText);
  console.log('[AICoach] Response received, content:', result.content?.substring(0, 80), 'toolCalls:', result.toolCalls?.length, 'finishReason:', result.finishReason);
  return result;
}
