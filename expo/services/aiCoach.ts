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

const EDGE_FUNCTION_URL = 'https://fkwlgzkglyrmzdbscqbj.supabase.co/functions/v1/ai-coach';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrd2xnemtnbHlybXpkYnNjcWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDUxMTUsImV4cCI6MjA4NTI4MTExNX0.c078nkR2_TJ9b9oPfukp-tI7pXQrosdGPMWJXqeN8Nc';

export async function sendAICoachMessage(body: AICoachRequestBody): Promise<AICoachResponse> {
  console.log('[AICoach] Sending message, messages count:', body.messages.length);
  console.log('[AICoach] Calling edge function via fetch with anon key (JWT verification disabled)');

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey': ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  console.log('[AICoach] Response status:', response.status, 'body preview:', responseText.substring(0, 500));

  if (!response.ok) {
    console.error('[AICoach] Edge function error:', response.status, responseText);
    throw new Error(`AI Coach error (${response.status}): ${responseText}`);
  }

  let data: AICoachResponse;
  try {
    data = JSON.parse(responseText) as AICoachResponse;
  } catch (parseErr) {
    console.error('[AICoach] Failed to parse response JSON:', parseErr);
    throw new Error('AI Coach returned invalid response');
  }

  console.log('[AICoach] Content:', data.content?.substring(0, 80), 'toolCalls:', data.toolCalls?.length, 'finishReason:', data.finishReason);
  return data;
}
