export interface ChatSessionItem {
  sessionId: number;
  sessionGuid: string;
  userName?: string | null;
  userPhone?: string | null;
  userEmail?: string | null;
  startedAt: string;
  status: 'Active' | 'Closed' | 'Inactive' | string;
  messageCount: number;
  isLeadGenerated: boolean;
  lastIntent?: string;
  generatedLeadId?: number | null;
}

export interface ChatbotStats {
  totalCount: number;
  totalActive: number;
  activePercent: number;
  totalLeads: number;
  leadsPercent: number;
  todayChats: number;
}

export interface ChatLogEntry {
  chatLogId: number;
  userMessage?: string | null;
  aiResponse?: string | null;
  intent?: string | null;
  propertyQuery?: string | null;
  imageData?: string | null;
  createdOn: string;
  timestamp?: string;
}

export interface RealTimeChatEntry {
  id: number;
  message: string;
  messageType: 'User' | 'Agent' | 'Bot' | 'System' | string;
  senderName: string;
  createdOn: string;
  timestamp?: string;
}

export interface ChatLeadInfo {
  leadId: number;
  name?: string;
  contact?: string;
  email?: string;
  status?: string;
  preferredLocation?: string;
}

export interface ChatTranscriptData {
  session: ChatSessionItem;
  lead?: ChatLeadInfo | null;
  logs: ChatLogEntry[];
  rtMessages: RealTimeChatEntry[];
}

export interface ChatbotFilterParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

export interface ChatbotPaginatedData {
  items: ChatSessionItem[];
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ChatbotApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

