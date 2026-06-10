import React, { useState, useRef, useEffect } from 'react';
import { useAIChat } from '../hooks/useAIChat';
import { Scroller } from '../hooks/Scroller';
import type { AIChatResponse } from '../types/AIChatResponse';

interface Props {
  context_snapshot: string;
  className?: string;
  theme?: 'dark' | 'light';
}

export default function AIChat({ context_snapshot, className = '', theme = 'dark' }: Props) {
  const isLight = theme === 'light';
  const [messages, setMessages] = useState<Array<{question: string, response: AIChatResponse | null, timestamp: number, isLoading?: boolean}>>([]);
  const [question, setQuestion] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { loading, setLoading, controllerRef, ask } = useAIChat(context_snapshot);

  // Auto scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    // Cancel any ongoing AI request
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    setLoading(false);
  };

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    
    if (!question.trim()) return;

    const userQuestion = question.trim();
    setQuestion('');

    // Immediately add the user's question with loading state
    const tempMessage = {
      question: userQuestion,
      response: null,
      timestamp: Date.now(),
      isLoading: true
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await ask(userQuestion);
      if (response) {
        // Update the message with the actual response
        setMessages(prev => prev.map(msg => 
          msg.timestamp === tempMessage.timestamp 
            ? { ...msg, response, isLoading: false }
            : msg
        ));
      } else {
        // Remove the message if no response
        setMessages(prev => prev.filter(msg => msg.timestamp !== tempMessage.timestamp));
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      // Remove the message on error
      setMessages(prev => prev.filter(msg => msg.timestamp !== tempMessage.timestamp));
    }
  }

  const containerClass = isLight
    ? 'bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden text-slate-900'
    : 'bg-zinc-900 border border-zinc-800 rounded-lg shadow-sm overflow-hidden text-slate-100';

  const headerTextClass = isLight ? 'text-sm font-semibold text-slate-900' : 'text-sm font-semibold text-slate-200';
  const inputClass = isLight
    ? 'w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500'
    : 'w-full bg-zinc-950 text-slate-100 placeholder:text-slate-500 border border-zinc-800 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500';

  return (
    <section className={`w-full max-w-3xl h-auto min-h-[60vh] lg:h-[80vh] ${className}`} aria-labelledby="ai-chat">
      <div className={containerClass}>
        {/* Main Chat Area */}
        <div className="flex flex-col h-full">
          <div className={`px-4 py-3 border-b ${isLight ? 'border-slate-200' : 'border-zinc-800'} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <h3 id="ai-chat" className={headerTextClass}>
                AI Assistant
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearChat}
                className={`text-xs ${isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-50' : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-800'} bg-transparent px-3 py-1.5 rounded-md transition-colors`}
              >
                Clear chat
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 flex-1 flex flex-col">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                rows={2}
                placeholder="Ask about the selected symbol or market data... (Press Enter to send, Shift+Enter for new line)"
                className={`flex-1 resize-none ${inputClass}`}
                disabled={loading}
              />
              <button
                type={loading ? "button" : "submit"}
                title={loading ? 'Cancel' : question.trim() ? 'Send message' : 'Type a message to send'}
                disabled={!question.trim() && !loading}
                onClick={loading ? clearChat : undefined}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all group ${
                  loading 
                    ? 'bg-amber-500 text-white' 
                    : question.trim() 
                      ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <span className="hidden group-hover:inline text-xs font-medium bg-transparent">Cancel</span>
                    <svg className="w-5 h-5 animate-spin group-hover:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" strokeOpacity="0.25" />
                      <path d="M4 12a8 8 0 018-8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                ) : question.trim() ? (
                  <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </form>

            <Scroller className="space-y-3 max-h-[60vh] sm:max-h-[600px] flex-1 overflow-auto">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <div className="mb-2">💬</div>
                  <div className="text-sm">Start a conversation about the market data</div>
                  <div className="text-xs mt-2 text-slate-400">Ask about symbols, analysis, or trading insights</div>
                </div>
              ) : (
                messages.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-end">
                      <div className={`w-full sm:max-w-xs md:max-w-sm lg:max-w-md px-3 py-2 rounded-lg ${isLight ? 'bg-amber-100 text-slate-900' : 'bg-amber-900 text-amber-100'}`}>
                        <div className="text-sm font-medium">You</div>
                        <div className="text-sm">{item.question}</div>
                      </div>
                    </div>
                    
                    {/* Show loading state or actual response */}
                    <div className="flex justify-start">
                      <div className={`w-full sm:max-w-xs md:max-w-sm lg:max-w-md px-3 py-2 rounded-lg ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-800 text-slate-100'}`}>
                        {item.isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">AI Assistant</div>
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="text-xs text-slate-500 italic">Thinking...</span>
                          </div>
                        ) : item.response ? (
                          <>
                            <div className="text-sm font-medium mb-1">AI Assistant</div>
                            <div className="text-sm whitespace-pre-wrap">{item.response.answer}</div>
                            {item.response.used_fields && item.response.used_fields.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {item.response.used_fields.map((f) => (
                                  <span key={f} className={`text-xs px-2 py-1 rounded ${isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-700 text-slate-300'}`}>{f}</span>
                                ))}
                              </div>
                            )}
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            <div ref={messagesEndRef} />
            </Scroller>
          </div>
        </div>
      </div>
    </section>
  );
}
