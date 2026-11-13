import { apiClient } from '../../../api/apiClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import {
  ChatbotApiResponse,
  ChatbotPaginatedData,
  ChatbotStats,
  ChatTranscriptData,
  ChatbotFilterParams,
  RealTimeChatEntry,
} from '../models/chatbot';

export const chatbotApi = {
  getConversations: async (
    params?: ChatbotFilterParams
  ): Promise<ChatbotApiResponse<ChatbotPaginatedData>> => {
    const queryParams: Record<string, any> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.pageSize) queryParams.pageSize = params.pageSize;
    if (params?.status && params.status !== 'All') queryParams.status = params.status;
    if (params?.search && params.search.trim()) queryParams.search = params.search.trim();

    return apiClient.get<ChatbotApiResponse<ChatbotPaginatedData>>(
      API_ENDPOINTS.SUPERADMIN_CHATBOT.CONVERSATIONS,
      queryParams
    );
  },

  getStats: async (): Promise<ChatbotApiResponse<ChatbotStats>> => {
    return apiClient.get<ChatbotApiResponse<ChatbotStats>>(
      API_ENDPOINTS.SUPERADMIN_CHATBOT.STATS
    );
  },

  getTranscript: async (
    sessionId: string | number
  ): Promise<ChatbotApiResponse<ChatTranscriptData>> => {
    return apiClient.get<ChatbotApiResponse<ChatTranscriptData>>(
      API_ENDPOINTS.SUPERADMIN_CHATBOT.TRANSCRIPT(sessionId)
    );
  },

  closeSession: async (
    sessionId: string | number
  ): Promise<ChatbotApiResponse<{ sessionId: number; status: string }>> => {
    return apiClient.post<ChatbotApiResponse<{ sessionId: number; status: string }>>(
      API_ENDPOINTS.SUPERADMIN_CHATBOT.CLOSE(sessionId),
      {}
    );
  },

  sendMessage: async (
    sessionId: string | number,
    message: string
  ): Promise<ChatbotApiResponse<RealTimeChatEntry>> => {
    return apiClient.post<ChatbotApiResponse<RealTimeChatEntry>>(
      API_ENDPOINTS.SUPERADMIN_CHATBOT.SEND_MESSAGE(sessionId),
      { message }
    );
  },
};

