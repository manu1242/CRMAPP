import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatbotApi } from '../api/chatbot.api';
import { ChatbotFilterParams } from '../models/chatbot';

export const SUPERADMIN_CHATBOT_KEYS = {
  all: ['superadmin-chatbot'] as const,
  lists: () => [...SUPERADMIN_CHATBOT_KEYS.all, 'list'] as const,
  list: (params?: ChatbotFilterParams) => [...SUPERADMIN_CHATBOT_KEYS.lists(), params] as const,
  stats: () => [...SUPERADMIN_CHATBOT_KEYS.all, 'stats'] as const,
  detail: (id: string | number) => [...SUPERADMIN_CHATBOT_KEYS.all, 'detail', String(id)] as const,
};

export const useChatbotConversationsQuery = (params?: ChatbotFilterParams) => {
  return useQuery({
    queryKey: SUPERADMIN_CHATBOT_KEYS.list(params),
    queryFn: () => chatbotApi.getConversations(params),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useChatbotStatsQuery = () => {
  return useQuery({
    queryKey: SUPERADMIN_CHATBOT_KEYS.stats(),
    queryFn: () => chatbotApi.getStats(),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useChatbotTranscriptQuery = (sessionId: string | number | null | undefined) => {
  return useQuery({
    queryKey: SUPERADMIN_CHATBOT_KEYS.detail(sessionId || ''),
    queryFn: () => chatbotApi.getTranscript(sessionId!),
    enabled: Boolean(sessionId),
    staleTime: 15 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCloseChatbotSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string | number) => chatbotApi.closeSession(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: SUPERADMIN_CHATBOT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SUPERADMIN_CHATBOT_KEYS.detail(sessionId) });
    },
  });
};

export const useSendChatbotMessageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: string | number; message: string }) =>
      chatbotApi.sendMessage(sessionId, message),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: SUPERADMIN_CHATBOT_KEYS.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: SUPERADMIN_CHATBOT_KEYS.lists() });
    },
  });
};

