import { Linking } from 'react-native';

export interface NotificationEntity {
  link?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: number | string | null;
  type?: string | null;
  title?: string | null;
  message?: string | null;
}

/**
 * Intelligently resolves the destination in-app route or external URL
 * for any notification payload, handling entity IDs, URL paths, and semantic fallbacks.
 */
export function resolveNotificationRoute(item: NotificationEntity): string | null {
  const rawLink = (item.link || '').trim();
  const entityType = (item.relatedEntityType || item.type || '').trim().toLowerCase();
  const rawEntityId = item.relatedEntityId;
  const entityId =
    rawEntityId !== undefined && rawEntityId !== null && String(rawEntityId).trim() !== ''
      ? String(rawEntityId).trim()
      : null;

  // 1. External HTTP/HTTPS URLs
  if (/^https?:\/\//i.test(rawLink)) {
    return rawLink;
  }

  // 2. Extract numerical ID from link if present (e.g. "/leads/details/42", "/leads/42", "?id=42")
  let linkId: string | null = null;
  if (rawLink && rawLink !== '#') {
    const idMatch = rawLink.match(/(?:details\/|\/)(\d+)(?:[/?#]|$)/i) || rawLink.match(/[?&]id=(\d+)/i);
    if (idMatch && idMatch[1]) {
      linkId = idMatch[1];
    }
  }

  const targetId = entityId || linkId;
  const cleanLink = rawLink.toLowerCase().replace(/^[#/\s]+/, '');
  const combinedText = `${item.title || ''} ${item.message || ''} ${item.type || ''}`.toLowerCase();

  // 3. Leads & Follow-ups
  if (entityType.includes('lead') || cleanLink.includes('lead') || combinedText.includes('lead')) {
    if (cleanLink.includes('unassigned') || combinedText.includes('unassigned')) {
      return '/admin/unassigned';
    }
    if (cleanLink.includes('integration') || combinedText.includes('integration')) {
      return '/admin/leads/LeadIntegrations';
    }
    if (targetId) {
      return `/admin/leads/${targetId}`;
    }
    return '/admin/leads';
  }

  // 4. Bookings
  if (entityType.includes('booking') || cleanLink.includes('booking') || combinedText.includes('booking')) {
    if (targetId) {
      return `/admin/SalesUnit/bookings/${targetId}`;
    }
    return '/admin/SalesUnit/bookings';
  }

  // 5. Quotations
  if (entityType.includes('quotation') || cleanLink.includes('quotation') || combinedText.includes('quotation')) {
    if (targetId) {
      return `/admin/SalesUnit/quotation/${targetId}`;
    }
    return '/admin/SalesUnit/quotation';
  }

  // 6. Invoices
  if (entityType.includes('invoice') || cleanLink.includes('invoice') || combinedText.includes('invoice')) {
    if (targetId) {
      return `/admin/SalesUnit/invoice/${targetId}`;
    }
    return '/admin/SalesUnit/invoice';
  }

  // 7. Payments
  if (entityType.includes('payment') || cleanLink.includes('payment') || combinedText.includes('payment')) {
    return '/admin/SalesUnit/payments';
  }

  // 8. Properties
  if (entityType.includes('propert') || cleanLink.includes('propert') || combinedText.includes('propert')) {
    if (targetId) {
      return `/admin/properties/propertydetails?id=${targetId}`;
    }
    return '/admin/properties';
  }

  // 9. Tasks / Reminders
  if (
    entityType.includes('task') ||
    entityType.includes('follow') ||
    cleanLink.includes('task') ||
    combinedText.includes('task') ||
    combinedText.includes('follow')
  ) {
    if (targetId && (entityType.includes('lead') || combinedText.includes('lead'))) {
      return `/admin/leads/${targetId}`;
    }
    return '/admin/Tasks';
  }

  // 10. Attendance
  if (entityType.includes('attendance') || cleanLink.includes('attendance') || combinedText.includes('attendance')) {
    return '/admin/attendance/AgentAttendance';
  }

  // 11. Agents & Agent Lead Tracking
  if (entityType.includes('agent') || cleanLink.includes('agent') || combinedText.includes('agent')) {
    if (cleanLink.includes('tracking') || combinedText.includes('tracking')) {
      return '/admin/teammanagement/AgentLeadTracking';
    }
    if (targetId) {
      return `/admin/teammanagement/AgentDetails?id=${targetId}`;
    }
    return '/admin/teammanagement/Agent';
  }

  // 12. Channel Partners
  if (
    entityType.includes('partner') ||
    cleanLink.includes('partner') ||
    combinedText.includes('partner') ||
    cleanLink.includes('channel')
  ) {
    if (targetId) {
      return `/admin/teammanagement/channelpartner/PartnerDetails?id=${targetId}`;
    }
    return '/admin/teammanagement/channelpartner/channel';
  }

  // 13. Payouts
  if (entityType.includes('payout') || cleanLink.includes('payout') || combinedText.includes('payout')) {
    if (cleanLink.includes('partner') || combinedText.includes('partner')) {
      return '/admin/payouts/PartnerPayout';
    }
    return '/admin/payouts/AgentPayout';
  }

  // 14. Subscriptions & Billing
  if (
    entityType.includes('subscri') ||
    cleanLink.includes('subscri') ||
    cleanLink.includes('plan') ||
    combinedText.includes('subscri')
  ) {
    return '/admin/subscriptions';
  }

  // 15. User Management
  if (entityType.includes('user') || cleanLink.includes('user') || cleanLink.includes('role')) {
    return '/admin/usemanagement/ManageUsers';
  }

  // 16. SuperAdmin modules
  if (cleanLink.includes('publiclead') || combinedText.includes('public lead')) {
    if (targetId) return `/superadmin/public-leads/${targetId}`;
    return '/superadmin/public-leads/index';
  }
  if (cleanLink.includes('tenant') || combinedText.includes('tenant')) {
    if (targetId) return `/superadmin/tenants/${targetId}`;
    return '/superadmin/tenants';
  }
  if (cleanLink.includes('inquir') || combinedText.includes('inquir')) {
    return '/superadmin/inquiries';
  }

  // 17. Raw path fallback
  if (rawLink && rawLink !== '#') {
    if (rawLink.startsWith('/admin') || rawLink.startsWith('/superadmin')) {
      return rawLink;
    }
    if (rawLink.startsWith('/')) {
      return `/admin${rawLink}`;
    }
    return `/admin/${rawLink}`;
  }

  return null;
}

/**
 * Handles navigation for a notification item, opening web links or navigating to app screens.
 */
export async function navigateToNotification(item: NotificationEntity, router: any): Promise<boolean> {
  const targetRoute = resolveNotificationRoute(item);
  if (!targetRoute) return false;

  if (targetRoute.startsWith('http://') || targetRoute.startsWith('https://')) {
    try {
      await Linking.openURL(targetRoute);
      return true;
    } catch (err) {
      console.warn('[NotificationNavigator] Could not open external URL:', err);
      return false;
    }
  }

  try {
    router.push(targetRoute as any);
    return true;
  } catch (err) {
    console.warn('[NotificationNavigator] Navigation error to route:', targetRoute, err);
    return false;
  }
}
