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

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onToolCalls: (toolCalls: AIToolCall[]) => void;
  onDone: (fullContent: string, finishReason: string) => void;
  onError: (error: Error) => void;
}

const EDGE_FUNCTION_URL = 'https://fkwlgzkglyrmzdbscqbj.supabase.co/functions/v1/ai-coach';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrd2xnemtnbHlybXpkYnNjcWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDUxMTUsImV4cCI6MjA4NTI4MTExNX0.c078nkR2_TJ9b9oPfukp-tI7pXQrosdGPMWJXqeN8Nc';

export async function sendAICoachMessage(body: AICoachRequestBody): Promise<AICoachResponse> {
  console.log('[AICoach] Sending message, messages count:', body.messages.length);
  console.log('[AICoach] Calling edge function via direct fetch');

  let response: Response;
  try {
    response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
    });
  } catch (networkError: unknown) {
    const msg = networkError instanceof Error ? networkError.message : 'Unknown network error';
    console.error('[AICoach] Network error:', msg);
    throw new Error(`AI Coach network error: ${msg}`);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'No error body');
    console.error('[AICoach] Edge function error:', response.status, errorText);
    throw new Error(`AI Coach error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
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

export async function streamAICoachMessage(
  body: AICoachRequestBody,
  callbacks: StreamCallbacks
): Promise<void> {
  console.log('[AICoach] Streaming message, messages count:', body.messages.length);

  let response: Response;
  try {
    response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'X-Stream': 'true',
      },
      body: JSON.stringify({ ...body, stream: true }),
    });
  } catch (networkError: unknown) {
    const msg = networkError instanceof Error ? networkError.message : 'Unknown network error';
    console.error('[AICoach] Stream network error:', msg);
    callbacks.onError(new Error(`AI Coach network error: ${msg}`));
    return;
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'No error body');
    console.error('[AICoach] Stream edge function error:', response.status, errorText);
    callbacks.onError(new Error(`AI Coach error (${response.status}): ${errorText}`));
    return;
  }

  const contentType = response.headers.get('content-type') || '';
  console.log('[AICoach] Response content-type:', contentType);

  if (contentType.includes('application/json')) {
    console.log('[AICoach] Got JSON response instead of stream, falling back');
    try {
      const data = await response.json();
      const result = data as AICoachResponse;
      if (result.content) {
        callbacks.onToken(result.content);
      }
      if (result.toolCalls && result.toolCalls.length > 0) {
        callbacks.onToolCalls(result.toolCalls);
      }
      callbacks.onDone(result.content || '', result.finishReason || 'stop');
    } catch (e) {
      callbacks.onError(e instanceof Error ? e : new Error('Failed to parse JSON fallback'));
    }
    return;
  }

  if (!response.body) {
    console.error('[AICoach] No response body for streaming');
    callbacks.onError(new Error('No response body for streaming'));
    return;
  }

  try {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let finishReason = 'stop';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('[AICoach] Stream ended');
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === ':') continue;

        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6);

          if (data === '[DONE]') {
            console.log('[AICoach] Stream [DONE]');
            callbacks.onDone(fullContent, finishReason);
            return;
          }

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'token' && parsed.content) {
              fullContent += parsed.content;
              callbacks.onToken(parsed.content);
            } else if (parsed.type === 'tool_calls' && parsed.toolCalls) {
              callbacks.onToolCalls(parsed.toolCalls);
            } else if (parsed.type === 'done') {
              finishReason = parsed.finishReason || 'stop';
            } else if (parsed.type === 'error') {
              console.error('[AICoach] Stream error event:', parsed.error);
              callbacks.onError(new Error(parsed.error || 'Stream error'));
              return;
            }
          } catch (parseErr) {
            console.warn('[AICoach] Failed to parse SSE data:', data);
          }
        }
      }
    }

    callbacks.onDone(fullContent, finishReason);
  } catch (streamErr) {
    console.error('[AICoach] Stream reading error:', streamErr);
    callbacks.onError(streamErr instanceof Error ? streamErr : new Error('Stream reading failed'));
  }
}
