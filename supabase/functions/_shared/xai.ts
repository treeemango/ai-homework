type XaiUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

export type XaiChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: XaiUsage;
};

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

export async function xaiChatCompletions(args: {
  apiKey: string;
  model: string;
  messages: Array<any>;
  temperature?: number;
  max_tokens?: number;
}): Promise<XaiChatCompletionResponse> {
  const res = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: args.model,
      messages: args.messages,
      temperature: args.temperature ?? 0.3,
      max_tokens: args.max_tokens ?? 1500,
    }),
  });

  if (res.status === 429) throw new ApiError('Rate limit exceeded', 429);
  if (!res.ok) throw new ApiError(await res.text(), res.status);
  return (await res.json()) as XaiChatCompletionResponse;
}

export function extractText(resp: XaiChatCompletionResponse): string {
  const text = resp.choices?.[0]?.message?.content;
  if (!text) throw new Error('No model output');
  return text;
}

export function getTokenUsage(resp: XaiChatCompletionResponse) {
  const prompt = resp.usage?.prompt_tokens ?? 0;
  const completion = resp.usage?.completion_tokens ?? 0;
  const total = resp.usage?.total_tokens ?? prompt + completion;
  return { prompt, completion, total };
}
