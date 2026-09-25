export interface AgentDocument {
  documentId: number;
  fileName?: string;
  documentName: string;
  documentType: string;
  fileSize: number;
  contentType?: string;
  uploadedOn?: string;
  verificationStatus: string;
  rejectionReason?: string;
}

export interface Agent {
  agentId: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  agentType: string;
  salary: number;
  commissionRules: string;
  status: string;
  verificationStatus?: string;
  createdOn?: string;
  createdDate?: string;
  approvedBy?: number | null;
  approvedOn?: string | null;
  channelPartnerId?: number | null;
  agentDocuments: AgentDocument[];
}