import { handleCors } from '../_shared/cors.ts';
import { errorResponse, jsonResponse, readJson } from '../_shared/http.ts';
import { createAdminClient, createUserClient, getEnv } from '../_shared/supabase.ts';
import { extractText, getTokenUsage, xaiChatCompletions } from '../_shared/xai.ts';

const MODEL = 'grok-4-1-fast-reasoning';

// Minimal `Deno` declaration for the TS server in this environment.
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
};

type ChatRequest = {
  history: Array<{ role: 'user' | 'model'; content: string }>;
  message: string;
  context?: {
    topic?: string;
    subtopic?: string;
    solutionSummary?: string;
  };
};

function isQuotaDisabled() {
  try {
    return getEnv('DISABLE_QUOTA').toLowerCase() === 'true';
  } catch {
    return false;
  }
}

async function enforceQuota(userId: string, estimatedTokens: number) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('consume_ai_quota', {
    user_uuid: userId,
    tokens_to_consume: estimatedTokens,
  });
  if (error) throw new Error(error.message);
  if (!data?.allowed) {
    const details = { remaining_tokens: data?.remaining_tokens ?? 0, retry_after_seconds: data?.retry_after_seconds ?? null };
    throw Object.assign(new Error('Quota exceeded'), { name: 'QuotaError', details });
  }
  return data as { allowed: boolean; remaining_tokens: number };
}

async function logUsage(args: {
  userId: string;
  kind: 'chat';
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}) {
  const admin = createAdminClient();
  await admin.from('ai_usage_events').insert({
    user_id: args.userId,
    kind: args.kind,
    model: args.model,
    prompt_tokens: args.promptTokens,
    completion_tokens: args.completionTokens,
    total_tokens: args.totalTokens,
  });
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const supabase = createUserClient(req);
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) return errorResponse('Unauthorized', 401);

    const body = await readJson<ChatRequest>(req);
    if (!body.message?.trim()) return errorResponse('message is required', 400);

    const quotaDisabled = isQuotaDisabled();
    const quota = quotaDisabled ? null : await enforceQuota(user.id, 400);

    const apiKey = getEnv('GROK_API_KEY');

    const messages = [
      {
        role: 'system',
        content:
          'You are a helpful tutor. Keep responses concise, step-by-step, and ask a quick check question at the end.',
      },
      ...(body.context
        ? [
            {
              role: 'system',
              content: `Context: topic=${body.context.topic ?? ''}, subtopic=${body.context.subtopic ?? ''}. Summary: ${body.context.solutionSummary ?? ''}`,
            },
          ]
        : []),
      ...(body.history ?? []).map((m) => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.content,
      })),
      { role: 'user', content: body.message },
    ];

    const resp = await xaiChatCompletions({
      apiKey,
      model: MODEL,
      temperature: 0.4,
      max_tokens: 700,
      messages,
    });

    const text = extractText(resp);
    const usage = getTokenUsage(resp);

    await logUsage({
      userId: user.id,
      kind: 'chat',
      model: MODEL,
      promptTokens: usage.prompt,
      completionTokens: usage.completion,
      totalTokens: usage.total,
    });

    return jsonResponse({ reply: text, quota: { remainingTokens: quota?.remaining_tokens ?? null, disabled: quotaDisabled } });
  } catch (err) {
    const anyErr = err as any;
    if (anyErr?.name === 'QuotaError') {
      return errorResponse('Quota exceeded', 429, anyErr.details);
    }
    return errorResponse('Chat failed', 500, String(anyErr?.message ?? err));
  }
});
