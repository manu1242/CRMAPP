import { LeadItem } from './LeadTypes';

export interface SalesPipelineStageGroup {
  stage: string;
  count: number;
  leads: LeadItem[];
}

export interface UpdateLeadStagePayload {
  leadId: number;
  newStage: string;
}

export interface UpdateLeadStageResponseData {
  leadId: number;
  newStage: string;
}
