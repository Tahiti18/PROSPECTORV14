// services/geminiService.ts
type ChatRole = 'system' | 'user' | 'assistant';

export type GeminiChatMessage = {
  role: ChatRole;
  content: string;
};

export type OpenRouterChatResponse = {
  ok: boolean;
  content?: string;
  raw?: any;
  error?: { message: string; code?: number };
};

const OPENROUTER_CHAT_ENDPOINT = '/api/openrouter/chat';

// ---- Small helpers ---------------------------------------------------------

function nonEmptyString(v: any): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function normalizeMessages(input: any): GeminiChatMessage[] | null {
  // Already correct shape
  if (Array.isArray(input?.messages)) {
    const msgs = input.messages
      .map((m: any) => ({
        role: (m?.role || 'user') as ChatRole,
        content: typeof m?.content === 'string' ? m.content : '',
      }))
      .filter((m: any) => nonEmptyString(m.content));
    return msgs.length ? msgs : null;
  }

  // Legacy shapes
  const legacyPrompt =
    input?.prompt ??
    input?.text ??
    input?.input ??
    input?.query ??
    input?.message ??
    input?.content;

  if (nonEmptyString(legacyPrompt)) {
    return [{ role: 'user', content: legacyPrompt.trim() }];
  }

  return null;
}

async function postOpenRouterChat(payload: any): Promise<OpenRouterChatResponse> {
  const res = await fetch(OPENROUTER_CHAT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      data?.error?.message ||
      data?.message ||
      `OpenRouter proxy error (HTTP ${res.status})`;
    return { ok: false, error: { message: msg, code: res.status }, raw: data };
  }

  // Your proxy typically returns { ok: true, content: "...", raw: {...} }
  if (typeof data?.content === 'string') {
    return { ok: true, content: data.content, raw: data };
  }

  // Some responses may embed content in choices like OpenAI format
  const choiceContent =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    data?.output_text;

  if (typeof choiceContent === 'string') {
    return { ok: true, content: choiceContent, raw: data };
  }

  return { ok: true, content: '', raw: data };
}

// ---- Public API ------------------------------------------------------------

export async function runGeminiChat(params: {
  model?: string;
  messages?: GeminiChatMessage[];
  prompt?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}): Promise<OpenRouterChatResponse> {
  const messages =
    params.messages && params.messages.length
      ? params.messages
      : params.prompt
        ? [{ role: 'user', content: params.prompt }]
        : [];

  if (!messages.length || !messages.some((m) => nonEmptyString(m.content))) {
    return {
      ok: false,
      error: { message: 'Client payload missing prompt/messages', code: 400 },
      raw: {
        receivedHasMessages: Array.isArray(params.messages),
        receivedPromptType: typeof params.prompt,
      },
    };
  }

  const payload = {
    model: params.model,
    messages,
    temperature: params.temperature,
    max_tokens: params.max_tokens,
    stream: params.stream,
  };

  return postOpenRouterChat(payload);
}

/**
 * Used by AutomatedSearch. It returns plain text + raw payload.
 */
export async function groundedLeadSearch(args: {
  market: string;
  query: string;
  constraints?: string[];
  model?: string;
}): Promise<{
  ok: boolean;
  text: string;
  raw?: any;
  error?: { message: string; code?: number };
}> {
  const constraintsBlock =
    args.constraints && args.constraints.length
      ? `\n\nConstraints:\n- ${args.constraints.join('\n- ')}`
      : '';

  const prompt = `You are a lead-research assistant.

Market: ${args.market}
Query: ${args.query}${constraintsBlock}

Return:
1) A concise summary (5-10 bullets)
2) A list of 10-25 candidate leads with:
   - businessName
   - website (if known)
   - short rationale (1 line)
   - confidence (0-100)

No markdown fences.`;

  const resp = await runGeminiChat({
    model: args.model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 1400,
  });

  if (!resp.ok) {
    return {
      ok: false,
      text: '',
      raw: resp.raw,
      error: resp.error ?? { message: 'Unknown error' },
    };
  }

  return { ok: true, text: resp.content ?? '', raw: resp.raw };
}
