import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Bot, Send, Plus, Trash2, Sparkles, User } from 'lucide-react';
import { chatApi } from '@/services/endpoints';
import { getErrorMessage } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ChatConversation, ChatMessage } from '@/types';
import { useAuthStore } from '@/store';
import { getSuggestedPrompts } from '@/lib/academicStreams';

export default function CareerChatPage() {
  const profile = useAuthStore((s) => s.profile);
  const suggestedPrompts = useMemo(
    () => getSuggestedPrompts(profile?.academicStream),
    [profile?.academicStream]
  );
  const queryClient = useQueryClient();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: loadingChats } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: async () => (await chatApi.getConversations()).data.data,
  });

  const sendMutation = useMutation({
    mutationFn: ({ message, chatId }: { message: string; chatId?: string }) =>
      chatApi.sendMessage(message, chatId),
    onMutate: ({ message }) => {
      setLocalMessages((prev) => [
        ...prev,
        { role: 'user', content: message, createdAt: new Date().toISOString() },
      ]);
      setInput('');
    },
    onSuccess: (res) => {
      const { chat } = res.data.data;
      setActiveChatId(chat._id);
      setLocalMessages(chat.messages);
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
    onError: (error) => {
      setLocalMessages((prev) => prev.slice(0, -1));
      toast.error(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => chatApi.deleteConversation(id),
    onSuccess: (_data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      if (activeChatId === deletedId) {
        setActiveChatId(null);
        setLocalMessages([]);
      }
      toast.success('Conversation deleted');
    },
  });

  const selectConversation = async (chat: ChatConversation) => {
    setActiveChatId(chat._id);
    setLocalMessages(chat.messages);
  };

  const startNewChat = () => {
    setActiveChatId(null);
    setLocalMessages([]);
    setInput('');
  };

  const handleSend = (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || sendMutation.isPending) return;
    sendMutation.mutate({ message, chatId: activeChatId ?? undefined });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, sendMutation.isPending]);

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Conversation sidebar */}
      <Card className="hidden w-72 shrink-0 flex-col overflow-hidden md:flex">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-semibold">Conversations</h2>
          <Button variant="ghost" size="icon" onClick={startNewChat}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loadingChats ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            conversations?.map((chat) => (
              <div
                key={chat._id}
                className={cn(
                  'group mb-1 flex w-full items-center rounded-xl transition-colors',
                  activeChatId === chat._id
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                )}
              >
                <button
                  type="button"
                  onClick={() => selectConversation(chat)}
                  className="min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm"
                >
                  {chat.title}
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(chat._id)}
                  className="hidden shrink-0 px-2 py-2.5 text-text-muted hover:text-error group-hover:block"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Chat area */}
      <Card className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold">Career Copilot</h1>
            <p className="text-xs text-text-muted">AI-powered placement assistant</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto md:hidden" onClick={startNewChat}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {localMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">How can I help you today?</h2>
              <p className="mb-8 max-w-md text-sm text-text-muted">
                Ask about resumes, interviews, skills, job search, or your placement strategy.
                I have context from your profile.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="rounded-full border border-border bg-surface px-4 py-2 text-xs text-text-secondary transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {localMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex w-full gap-3',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'min-w-0 max-w-[80%] shrink-0 rounded-2xl px-4 py-3 text-sm leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-primary text-white'
                          : 'border border-border bg-surface text-text-secondary'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-hover">
                        <User className="h-4 w-4 text-text-muted" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {sendMutation.isPending && (
                <div className="flex w-full gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-2xl border border-border bg-surface px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="h-2 w-2 rounded-full bg-primary"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-border p-4">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask your career copilot..."
              rows={1}
              className="max-h-32 min-h-[48px] flex-1 resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button
              size="icon"
              className="h-12 w-12 shrink-0"
              disabled={!input.trim() || sendMutation.isPending}
              onClick={() => handleSend()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-text-muted">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </Card>
    </div>
  );
}
