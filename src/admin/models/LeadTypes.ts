export interface LeadItem {
  leadId: number;
  fullName: string;
  name?: string;
  email: string;
  phone: string;
  stage?: string;
  status: string;
  source: string;
  preferredLocation?: string;
  type?: string;
  propertyType?: string;
  bhk?: string;
  requirement?: string;
  handoverStatus?: string;
  assignedToAgentId?: number;
  assignedToAgentName?: string;
  followUpDate?: string;
  createdDate: string;
  createdOn?: string;
  executiveId?: number;
  rating?: string;
}

export interface LeadQueryParams {
  search?: string;
  page?: number;
  pageSize?: number;
  stage?: string;
  status?: string;
  executiveId?: number;
  source?: string;
}

export interface LeadListResponseData {
  items: LeadItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface LeadContactInformation {
  leadId: number;
  fullName: string;
  email: string;
  phone: string;
  stage?: string;
  status?: string;
  source?: string;
  rating?: string;
  comments?: string;
  handoverStatus?: string;
  channelPartnerId?: number | null;
  assignedToAgentId?: number | null;
  assignedToAgentName?: string | null;
  followUpDate?: string | null;
  createdDate?: string | null;
}

export interface LeadPropertyRequirements {
  groupName?: string | null;
  preferredLocation?: string | null;
  sqft?: string | null;
  facing?: string | null;
  type?: string | null;
  propertyType?: string | null;
  bhk?: string | null;
  requirement?: string | null;
}

export interface LeadActivity {
  historyId: number;
  leadId: number;
  activity: string;
  activityDate: string;
  executiveId?: number | null;
}

export interface LeadFollowUp {
  followUpId: number;
  leadId: number;
  stage?: string | null;
  status?: string | null;
  followUpDate?: string | null;
  followUpTime?: string | null;
  comments?: string | null;
  executiveId?: number | null;
  propertyId?: number | null;
  interestStatus?: string | null;
  rating?: string | null;
  createdOn?: string | null;
  completedOn?: string | null;
}

export interface LeadNote {
  noteId: number;
  leadId: number;
  noteText: string;
  executiveId?: number | null;
  createdOn?: string | null;
}

export interface LeadDocument {
  uploadId: number;
  leadId: number;
  fileName: string;
  filePath: string;
  fileType?: string | null;
  uploadedBy?: number | null;
  uploadedOn?: string | null;
}

export interface LeadSiteVisit {
  followUpId: number;
  leadId: number;
  stage?: string | null;
  status?: string | null;
  followUpDate?: string | null;
  followUpTime?: string | null;
  comments?: string | null;
  executiveId?: number | null;
  propertyId?: number | null;
  interestStatus?: string | null;
  rating?: string | null;
  createdOn?: string | null;
  completedOn?: string | null;
}

export interface LeadTransition {
  historyId: number;
  leadId: number;
  activity: string;
  activityDate: string;
  executiveId?: number | null;
}

export interface LeadFullDetails {
  contactInformation: LeadContactInformation;
  propertyRequirements: LeadPropertyRequirements;
  activities: LeadActivity[];
  followUps: LeadFollowUp[];
  notes: LeadNote[];
  documents: LeadDocument[];
  siteVisits: LeadSiteVisit[];
  transitions: LeadTransition[];
}

export interface AddNotePayload {
  noteText: string;
}

export interface AddFollowUpPayload {
  stage?: string;
  status?: string;
  followUpDate?: string;
  followUpTime?: string;
  comments?: string;
  propertyId?: number | null;
  interestStatus?: string;
  rating?: string;
}


