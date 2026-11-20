import { LeadItem } from './LeadTypes';

export interface SalesPipelineStageGroup {
  stage: string;
  label?: string;       // web column title
  count: number;        // after filters
  totalCount?: number;  // before filters
  leads: LeadItem[];
}

// Canonical 8 stages matching CRMweb (Views/SalesPipelines/Index.cshtml)
export const CANONICAL_PIPELINE_STAGES = [
  'New',
  'Office Meeting',
  'Site Visit Requested',
  'Site Visit Done',
  'Quotation',
  'Quotation Sent',
  'Negotiation',
  'Booked',
] as const;

// Web Sales Pipeline column titles (stage key stays the same)
const WEB_STAGE_LABELS: Record<string, string> = {
  'office meeting': 'Contacted',
  'contacted': 'Contacted',
  'site visited': 'Site Visit Done',
  'site visit done': 'Site Visit Done',
};

export function getStageLabel(stage: string | null | undefined): string {
  if (!stage) return '';
  const lower = stage.trim().toLowerCase();
  return WEB_STAGE_LABELS[lower] ?? stage;
}

// Matches Web formatCardDate (Today, Yesterday, or DD MMM)
export function formatCardDate(dateStr?: string | null): string {
  if (!dateStr) return 'Today';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Today';
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export interface UpdateLeadStagePayload {
  leadId: number;
  newStage: string;
}

export interface UpdateLeadStageResponseData {
  leadId: number;
  newStage: string;
}
