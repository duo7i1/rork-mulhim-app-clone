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
  console.log('[AICoach] Calling edge function via supabase.functions.invoke');

  const { data, error } = await supabase.functions.invoke('ai-coach', {
    body: body,
  });

  if (error) {
    console.error('[AICoach] Edge function error:', error.message);
    throw new Error(`AI Coach error: ${error.message}`);
  }

  console.log('[AICoach] Raw response:', JSON.stringify(data).substring(0, 500));

  const result = data as AICoachResponse;

  if (!result || (!result.content && !result.toolCalls)) {
    console.error('[AICoach] Unexpected response format:', data);
    throw new Error('AI Coach returned invalid response');
  }

  if (!result.toolCalls) {
    result.toolCalls = [];
  }

  console.log('[AICoach] Content:', result.content?.substring(0, 80), 'toolCalls:', result.toolCalls?.length, 'finishReason:', result.finishReason);
  return result;
}
