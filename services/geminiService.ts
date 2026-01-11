import { supabase } from './supabaseClient';

export type DifficultyLevel = 'easy' | 'standard' | 'challenge';

export interface SolveResult {
  topic: string;
  subtopic: string;
  explanation: string;
  steps: Array<{ title: string; description: string; math?: string; icon: string; reasoning?: string }>;
  finalResult: string;
  confidence: number;
  detectedSubject?: string;
  subjectConfidence?: number;
  extractedText?: string;
  quota?: { remainingTokens: number };
}

type FunctionErrorBody = { error?: { message?: string; details?: any } };

function tryParseJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseFunctionInvokeError(err: any): { status?: number; message: string; details?: any } {
  const status: number | undefined = err?.context?.status;
  const rawBody = err?.context?.body;

  let body: FunctionErrorBody | null = null;

  if (rawBody && typeof rawBody === 'object') {
    body = rawBody as FunctionErrorBody;
  } else if (typeof rawBody === 'string') {
    body = (tryParseJson(rawBody) as FunctionErrorBody) ?? null;
  }

  const messageFromBody = body?.error?.message;
  const details = body?.error?.details;

  // Supabase sometimes returns a generic message like
  // "Edge Function returned a non-2xx status code" without exposing the JSON body.
  // Provide a better default for known statuses.
  const generic = typeof err?.message === 'string' ? err.message : '';
  const fallbackForStatus =
    status === 429 ? 'Quota exceeded' : status === 401 ? 'Unauthorized' : status === 403 ? 'Forbidden' : 'Request failed';

  const message = messageFromBody || (generic.includes('non-2xx') ? fallbackForStatus : generic) || fallbackForStatus;
  return { status, message, details };
}

function makeApiError(message: string, extras?: { status?: number; details?: any; name?: string }) {
  const e = new Error(message) as Error & { status?: number; details?: any };
  if (extras?.name) e.name = extras.name;
  if (extras?.status != null) e.status = extras.status;
  if (extras?.details != null) e.details = extras.details;
  return e;
}

export async function solveProblem(
  imageBase64: string,
  mode: string,
  difficulty?: DifficultyLevel,
): Promise<SolveResult> {
  if (!supabase) throw new Error('Supabase credentials not configured');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No active session. Please sign in again.');
  }

  const { data, error } = await supabase.functions.invoke('solve', {
    body: { imageBase64, mode, difficulty },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    const parsed = parseFunctionInvokeError(error);
    if (parsed.status === 429) {
      const retryAfter = parsed.details?.retry_after_seconds;
      const remaining = parsed.details?.remaining_tokens;
      const suffix =
        retryAfter != null
          ? ` Try again in ~${retryAfter}s.`
          : remaining != null
            ? ` Remaining tokens: ${remaining}.`
            : '';
      throw makeApiError(`${parsed.message}${suffix}`, {
        name: 'QuotaError',
        status: parsed.status,
        details: parsed.details,
      });
    }
    throw makeApiError(parsed.message || 'Solve failed', { status: parsed.status, details: parsed.details });
  }

  if ((data as any)?.error) {
    throw new Error((data as any).error?.message ?? 'Solve failed');
  }

  return data as SolveResult;
}

export type ChatMessage = { role: 'user' | 'model'; content: string };

export async function chatWithSolution(
  history: ChatMessage[],
  message: string,
  context?: { topic?: string; subtopic?: string; solutionSummary?: string },
): Promise<{ reply: string; quota?: { remainingTokens: number } }> {
  if (!supabase) throw new Error('Supabase credentials not configured');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No active session. Please sign in again.');
  }

  const { data, error } = await supabase.functions.invoke('chat', {
    body: { history, message, context },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    const parsed = parseFunctionInvokeError(error);
    if (parsed.status === 429) {
      const retryAfter = parsed.details?.retry_after_seconds;
      const remaining = parsed.details?.remaining_tokens;
      const suffix =
        retryAfter != null
          ? ` Try again in ~${retryAfter}s.`
          : remaining != null
            ? ` Remaining tokens: ${remaining}.`
            : '';
      throw makeApiError(`${parsed.message}${suffix}`, {
        name: 'QuotaError',
        status: parsed.status,
        details: parsed.details,
      });
    }
    throw makeApiError(parsed.message || 'Chat failed', { status: parsed.status, details: parsed.details });
  }

  if ((data as any)?.error) {
    throw new Error((data as any).error?.message ?? 'Chat failed');
  }

  return data as { reply: string; quota?: { remainingTokens: number } };
}
