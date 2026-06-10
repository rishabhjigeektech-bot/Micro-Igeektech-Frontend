import { useCallback, useRef, useState } from 'react';
import type { AIChatResponse } from '../types/AIChatResponse';
import { sendMessage } from '../types/AIChatResponse';
import type { ChatMessage } from '../types/AIChatResponse';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

const STORAGE_KEY = 'ai_chat_history_v1';

export function useAIChat(contextSnapshot: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as ChatMessage[];
    } catch (e) {
      // localStorage may be unavailable (SSR/private mode); ignore read errors
      console.debug('useAIChat: failed to read history', e);
    }
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // Test function to check backend connectivity
  async function testConnectivity(): Promise<boolean> {
    try {
      const url = import.meta.env.VITE_AI_API_BASE || 'https://mqn8mdsb-8000.inc1.devtunnels.ms/api/chat';
      
      
      const response = await fetch(url, {
        method: 'HEAD', // Use HEAD to check if endpoint exists without sending data
        headers: { 
          'ngrok-skip-browser-warning': 'true',
        },
      });
      
      
      return response.ok;
    } catch (error) {
      console.error('Connectivity test failed:', error);
      return false;
    }
  }

  

  // Persist messages
  const persist = useCallback((next: ChatMessage[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      // ignore write errors (e.g., quota); surface in debug
      console.debug('useAIChat: failed to persist history', e);
    }
  }, []);

  const appendMessage = useCallback((m: ChatMessage) => {
    setMessages(prev => {
      const next = [...prev, m];
      persist(next);
      return next;
    });
  }, [persist]);

  const clear = useCallback(() => {
    setMessages([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { console.debug('useAIChat: clear failed', e); }
  }, []);


  // Generate a concise fallback response (no manual assistant prompts)
  const generateIntelligentFallback = useCallback((_question?: string): string => {
    // reference the parameter to avoid unused-var lint complaints
    void _question;
    return 'Sorry — no answer available right now.';
  }, []);

  const ask = useCallback(async (question: string): Promise<AIChatResponse | undefined> => {
    if (!question.trim()) {
      return undefined;
    }
    setLoading(true);
    setError(null);

    // Abort any previous in-flight request for cleanliness
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      // Prepare context snapshot - ensure it's meaningful
      // Do not inject manual assistant prompts into the context; send empty string if none
      let contextToSend = contextSnapshot || '';
      if (!contextToSend || contextToSend.trim() === '') {
        contextToSend = '';
      }

      // Send via shared chatService which normalizes responses
      const messageContent = `${question}\n\nContext: ${contextToSend}`;
      const reply = await sendMessage([{ role: 'user', content: messageContent }], undefined, controller.signal);

      const data: AIChatResponse = {
        answer: reply ?? '',
        confidence: 'medium',
        used_fields: [],
      };

      // Basic validation
      if (!data.answer || data.answer.trim().length < 1) {
        throw new Error('Invalid response format');
      }

      // Simple unhelpful response check
      const lowerAnswer = data.answer.toLowerCase();
      const isUnhelpful = (
        lowerAnswer.includes('data not available') ||
        lowerAnswer.includes('could not be retrieved') ||
        lowerAnswer.includes('no data available') ||
        data.answer.trim() === '' ||
        data.answer.length < 15
      );

      if (isUnhelpful) {
        return {
          answer: generateIntelligentFallback(question),
          confidence: 'medium' as const,
          used_fields: []
        };
      }

      return data;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return undefined;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);

      // Return a more helpful fallback response
      const fallbackAnswer = generateIntelligentFallback(question);

      const fallbackResponse: AIChatResponse = {
        answer: fallbackAnswer,
        confidence: 'low' as const,
        used_fields: []
      };

      return fallbackResponse;
    } finally {
      setLoading(false);
      controllerRef.current = null;
    }
  }, [contextSnapshot, generateIntelligentFallback]);
  const send = useCallback(async (input: string) => {
    const content = input?.trim();
    if (!content) return;

    const userMessage: ChatMessage = { id: uid(), role: 'user', content };
    appendMessage(userMessage);

    setLoading(true);
    try {
      const ai = await ask(content);
      const reply = ai?.answer ?? 'No response';

      const assistantMessage: ChatMessage = { id: uid(), role: 'assistant', content: reply };
      appendMessage(assistantMessage);
    } catch (err) {
      console.debug('useAIChat.send error', err);
      const assistantMessage: ChatMessage = { id: uid(), role: 'assistant', content: 'Sorry, something went wrong.' };
      appendMessage(assistantMessage);
    } finally {
      setLoading(false);
    }
  }, [appendMessage, ask]);

  return { messages, loading, error, ask, testConnectivity, controllerRef, setLoading, send, appendMessage, setMessages, clear } as const;
}
