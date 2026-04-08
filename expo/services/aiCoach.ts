import { supabase } from './supabase';

const EDGE_FUNCTION_URL = 'https://fkwlgzkglyrmzdbscqbj.supabase.co/functions/v1/ai-coach';

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

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    console.warn('[AICoach] No access token available, attempting without auth');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrd2xnemtnbHlybXpkYnNjcWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDUxMTUsImV4cCI6MjA4NTI4MTExNX0.c078nkR2_TJ9b9oPfukp-tI7pXQrosdGPMWJXqeN8Nc',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[AICoach] Edge function error:', response.status, errorText);
    throw new Error(`AI Coach error: ${response.status}`);
  }

  const result: AICoachResponse = await response.json();
  console.log('[AICoach] Response received, content:', result.content?.substring(0, 80), 'toolCalls:', result.toolCalls.length, 'finishReason:', result.finishReason);
  return result;
}
