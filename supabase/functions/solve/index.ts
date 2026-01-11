import { handleCors } from '../_shared/cors.ts';
import { errorResponse, jsonResponse, readJson } from '../_shared/http.ts';
import { createAdminClient, createUserClient, getEnv } from '../_shared/supabase.ts';
import { extractText, getTokenUsage, xaiChatCompletions } from '../_shared/xai.ts';

const MODELS = {
  VISION: 'grok-2-vision-1212',
  REASONING: 'grok-4-1-fast-reasoning',
} as const;

// Minimal `Deno` declaration for the TS server in this environment.
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
};

type DifficultyLevel = 'easy' | 'standard' | 'challenge';

type SolveRequest = {
  imageBase64: string;
  mode?: string;
  difficulty?: DifficultyLevel;
};

type SolutionStep = {
  title: string;
  description: string;
  math?: string;
  icon: string;
  reasoning?: string;
};

type SolveResponse = {
  topic: string;
  subtopic: string;
  explanation: string;
  steps: SolutionStep[];
  finalResult: string;
  confidence: number;
  subjectConfidence?: number;
  detectedSubject?: string;
  extractedText?: string;
};

const ACADEMIC_POLICY = `
If this appears to be an active exam or graded assessment:
- Explain the method clearly
- Do NOT give the final numeric answer directly
- Encourage the student to complete the last step themselves
`;

function isQuotaDisabled() {
  try {
    return getEnv('DISABLE_QUOTA').toLowerCase() === 'true';
  } catch {
    return false;
  }
}

function getBudgets(difficulty: DifficultyLevel) {
  switch (difficulty) {
    case 'easy':
      return { visionMaxTokens: 450, reasoningMaxTokens: 1100, quotaEstimateTokens: 2000 };
    case 'challenge':
      return { visionMaxTokens: 900, reasoningMaxTokens: 2500, quotaEstimateTokens: 4200 };
    case 'standard':
    default:
      return { visionMaxTokens: 650, reasoningMaxTokens: 1700, quotaEstimateTokens: 3000 };
  }
}

function getSystemPrompt(args: { mode: string; difficulty: DifficultyLevel }) {
  return `
You are a professional educator.

${ACADEMIC_POLICY}

Student difficulty: ${args.difficulty}
Focus mode: ${args.mode}

Return STRICT JSON only with this schema:
{
  "topic": string,
  "subtopic": string,
  "detectedSubject": string,
  "subjectConfidence": number, 
  "explanation": string,
  "steps": [{"title":string,"description":string,"math"?:string,"icon":string,"reasoning"?:string}],
  "finalResult": string,
  "confidence": number
}

Rules:
- Teach step by step
- Use simple language
- Explain WHY each step works
- If unsure about subject, still choose best label and lower subjectConfidence
- Output JSON only (no markdown fences)
`;
}

function getVisionPrompt(mode: string) {
  return `
Extract the problem EXACTLY as written.

Rules:
- Preserve line breaks
- Preserve symbols and equations verbatim
- Do NOT summarize
- Describe diagrams if present

Focus: ${mode}
`;
}

function normalizeImageUrl(imageBase64: string) {
  if (imageBase64.startsWith('data:')) return imageBase64;
  return `data:image/png;base64,${imageBase64}`;
}

async function logUsage(args: {
  userId: string;
  kind: 'solve';
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd?: number;
  meta?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  await admin.from('ai_usage_events').insert({
    user_id: args.userId,
    kind: args.kind,
    model: args.model,
    prompt_tokens: args.promptTokens,
    completion_tokens: args.completionTokens,
    total_tokens: args.totalTokens,
    cost_usd: args.costUsd ?? null,
    meta: args.meta ?? null,
  });
}

async function enforceQuota(userId: string, estimatedTokens: number) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('consume_ai_quota', {
    user_uuid: userId,
    tokens_to_consume: estimatedTokens,
  });
  if (error) throw new Error(error.message);
  if (!data?.allowed) {
    const retryAfterSeconds = data?.retry_after_seconds ?? null;
    const details = { remaining_tokens: data?.remaining_tokens ?? 0, retry_after_seconds: retryAfterSeconds };
    throw Object.assign(new Error('Quota exceeded'), { name: 'QuotaError', details });
  }
  return data as { allowed: boolean; remaining_tokens: number };
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

    if (userErr || !user) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await readJson<SolveRequest>(req);
    if (!body.imageBase64) return errorResponse('imageBase64 is required', 400);

    const mode = body.mode?.trim() || 'Homework';
    const difficulty: DifficultyLevel = body.difficulty ?? 'standard';

    const budgets = getBudgets(difficulty);

    // cheap pre-consumption estimate so we can block abusive calls before hitting provider
    const quotaDisabled = isQuotaDisabled();
    const quota = quotaDisabled ? null : await enforceQuota(user.id, budgets.quotaEstimateTokens);

    const apiKey = getEnv('GROK_API_KEY');
    const imageUrl = normalizeImageUrl(body.imageBase64);

    // 1) Vision
    const vision = await xaiChatCompletions({
      apiKey,
      model: MODELS.VISION,
      temperature: 0.1,
      max_tokens: budgets.visionMaxTokens,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl } },
            { type: 'text', text: getVisionPrompt(mode) },
          ],
        },
      ],
    });

    const extractedText = extractText(vision);
    const vUsage = getTokenUsage(vision);

    // 2) Reasoning + Subject detection
    const reasoning = await xaiChatCompletions({
      apiKey,
      model: MODELS.REASONING,
      temperature: 0.3,
      max_tokens: budgets.reasoningMaxTokens,
      messages: [
        { role: 'system', content: getSystemPrompt({ mode, difficulty }) },
        {
          role: 'user',
          content: `Problem:\n${extractedText}\n\nProvide a full educational solution.`,
        },
      ],
    });

    const raw = extractText(reasoning);
    const rUsage = getTokenUsage(reasoning);

    let parsed: SolveResponse;
    try {
      parsed = JSON.parse(raw) as SolveResponse;
    } catch {
      parsed = {
        topic: mode,
        subtopic: 'Analysis',
        detectedSubject: mode,
        subjectConfidence: 0.3,
        explanation: extractedText.slice(0, 400),
        steps: [
          {
            title: 'Explanation',
            description: raw.slice(0, 900),
            icon: 'psychology',
          },
        ],
        finalResult: 'See explanation above',
        confidence: 0.6,
      };
    }

    // normalize
    parsed.steps = (parsed.steps ?? []).map((s) => ({
      icon: s.icon || 'psychology',
      title: s.title || 'Step',
      description: s.description || '',
      math: s.math,
      reasoning: s.reasoning,
    }));

    parsed.confidence = Math.min(Math.max(parsed.confidence ?? 0.85, 0), 1);
    if (parsed.subjectConfidence != null) {
      parsed.subjectConfidence = Math.min(Math.max(parsed.subjectConfidence, 0), 1);
    }

    // Choose topic
    const detected = parsed.detectedSubject?.trim();
    if (detected) parsed.topic = detected;

    // usage log + true consumption adjustment (we already consumed estimate via RPC)
    const totalTokens = vUsage.total + rUsage.total;
    await logUsage({
      userId: user.id,
      kind: 'solve',
      model: `${MODELS.VISION}+${MODELS.REASONING}`,
      promptTokens: vUsage.prompt + rUsage.prompt,
      completionTokens: vUsage.completion + rUsage.completion,
      totalTokens,
      meta: { mode, difficulty, remaining_tokens_after_estimate: quota?.remaining_tokens ?? null, quota_disabled: quotaDisabled },
    });

    return jsonResponse({
      ...parsed,
      extractedText,
      quota: { remainingTokens: quota?.remaining_tokens ?? null, disabled: quotaDisabled },
    });
  } catch (err) {
    const anyErr = err as any;
    if (anyErr?.name === 'QuotaError') {
      return errorResponse('Quota exceeded', 429, anyErr.details);
    }
    return errorResponse('Solve failed', 500, String(anyErr?.message ?? err));
  }
});
