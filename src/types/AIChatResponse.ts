export type Confidence = 'low' | 'medium' | 'high';

export interface AIChatResponse {
  answer: string;
  confidence: Confidence;
  used_fields: string[];
}

// Chat message types (merged from chat.types.ts)
export type Role = 'user' | 'assistant';

export interface ChatMessage {
  id?: string;
  role: Role;
  content: string;
}

// Chat service (merged from chatService.ts)
export type OnToken = (token: string) => void;

/**
 * Send messages to backend `/api/chat` and normalize the reply to a string.
 * Supports multiple JSON shapes including { reply }, { content }, and { answer } (AIChatResponse).
 */
export async function sendMessage(messages: ChatMessage[], _onToken?: OnToken, signal?: AbortSignal) {
  const base = (import.meta.env.VITE_AI_API_BASE as string) || '';
  const url = base ? `${base.replace(/\/$/, '')}/api/chat` : '/api/chat';

  // Debug: log outgoing payload and chosen URL in dev
  try {
    console.debug('[chat] POST ->', url, { messages });
  } catch (e) {
    console.warn('[chat] debug log failed', e);
  }

  // If the caller provided a single user message, send it as `{ content }`
  // to support backends that expect a simple content field. For multi-message
  // payloads, send `{ messages }` as before.
  const payload = (messages.length === 1 && messages[0].role === 'user')
    ? { content: messages[0].content }
    : { messages };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
      const txt = await res.text().catch(() => '');
      const errMsg = txt || `${res.status} ${res.statusText}`;
      console.error('[chat] request failed', { url, status: res.status, statusText: res.statusText, body: txt });
      throw new Error(errMsg || 'Chat API error');
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    try { console.debug('[chat] response json', { url, data }); } catch (e) { console.warn('[chat] debug log failed', e); }

    // Prefer `reply` when present, then `answer` (AIChatResponse), then `content`.
    if (data && typeof data === 'object') {
      if ((data as any).reply !== undefined) return (data as any).reply as string;
      if ((data as AIChatResponse).answer !== undefined) return (data as AIChatResponse).answer;
      if ((data as any).content !== undefined) return (data as any).content as string;
    }

    // Fallback: stringify the JSON or return empty string
    try { return JSON.stringify(data); } catch { return '' }
  }

  const text = await res.text();
  return text;
}
