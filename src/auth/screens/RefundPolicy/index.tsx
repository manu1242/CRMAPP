import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { useBrandingQuery } from '../../../admin/hooks/useBranding';
import {
  ArrowLeft,
  RotateCcw,
  PackageX,
  CreditCard,
  Clock,
  RefreshCw,
  Ban,
  Mail,
  Info,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from 'lucide-react-native';

interface PolicyPoint {
  title?: string;
  text: string;
}

interface TimelineStep {
  step: string;
  title: string;
  description: string;
}

interface PolicySection {
  id: string;
  number: string;
  title: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  iconColor: string;
  points: PolicyPoint[];
  timeline?: TimelineStep[];
  badge?: string;
  highlight?: string;
}

export default function RefundPolicyScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const { data: branding } = useBrandingQuery();

  const companyName = branding?.companyName || 'UPropTech Solutions';
  const companyEmail = 'support@uproptech.com';

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const brandColor = adminTheme.brand;

  const sections: PolicySection[] = [
    {
      id: 'returns',
      number: '01',
      title: 'Return Policy & Eligibility',
      icon: PackageX,
      iconColor: '#3B82F6',
      badge: '10-Day Return Window',
      points: [
        {
          title: '10-Day Timeframe',
          text: 'Our return policy lasts strictly 10 days from the initial date of purchase. If 10 days have elapsed since purchase, unfortunately we cannot offer a return, refund, or exchange.',
        },
        {
          title: 'Server Download Condition',
          text: 'To be eligible for a return, your application or software package must NOT have been downloaded, fetched, or accessed from our servers.',
        },
        {
          title: 'Non-Returnable Digital Items',
          text: 'Due to the nature of digital software, the following items are strictly non-returnable once provisioned:',
        },
        {
          title: '• Downloadable software products & license files',
          text: 'Any binary files, build artifacts, or deployment bundles already accessed.',
        },
        {
          title: '• Pre-built themes, templates & extension plugins',
          text: 'Reusable assets delivered digitally.',
        },
        {
          title: '• Customized & client-tailored applications',
          text: 'Any software custom-engineered or bespoke-configured for your organization.',
        },
        {
          title: 'Proof of Purchase Required',
          text: 'To process any return request, a valid invoice receipt or order transaction ID is required. Please keep your transaction records secure.',
        },
      ],
      highlight: 'Software packages that have already been downloaded or activated from our servers cannot be returned.',
    },
    {
      id: 'refunds',
      number: '02',
      title: 'Refund Process & Timeline',
      icon: CreditCard,
      iconColor: '#10B981',
      points: [
        {
          title: 'Request Review & Verification',
          text: 'Once your refund request is received, our compliance team inspects your account history and download logs to verify eligibility. We will notify you via email of the approval or rejection of your claim.',
        },
        {
          title: 'Automatic Credit Issuance',
          text: 'Upon approval, your refund will be processed and a credit will automatically be applied to your original payment method (e.g., credit card, debit card, or net banking) within 7 working days.',
        },
      ],
      timeline: [
        {
          step: '1',
          title: 'Request Received',
          description: 'We acknowledge receipt and initiate compliance review of your refund submission.',
        },
        {
          step: '2',
          title: 'Inspection & Decision',
          description: 'Download logs and purchase validity are verified; approval or rejection notification is emailed to you.',
        },
        {
          step: '3',
          title: 'Credit Applied',
          description: 'If approved, funds are credited back to your original payment source within 7 working days.',
        },
      ],
      highlight: 'Approved refunds are credited to your original payment method within 7 working business days.',
    },
    {
      id: 'late_refunds',
      number: '03',
      title: 'Late or Missing Refunds',
      icon: Clock,
      iconColor: '#F59E0B',
      points: [
        {
          title: 'Step 1: Check Bank Account',
          text: 'Verify your latest bank account statement to confirm if the refund has arrived under pending or posted clearances.',
        },
        {
          title: 'Step 2: Contact Card Provider',
          text: 'Reach out to your credit card company or card issuing institution. There is often an official clearance cycle before refunds reflect on your statement.',
        },
        {
          title: 'Step 3: Contact Your Bank',
          text: 'Contact your bank branch directly, as interbank settlement processing times can take a few business days.',
        },
        {
          title: 'Step 4: Contact Our Support',
          text: `If you have completed all the steps above and have still not received your refund, please email our support team at ${companyEmail} with your transaction reference.`,
        },
      ],
      highlight: 'If your refund is delayed beyond 7 business days after bank checks, email us directly for trace assistance.',
    },
    {
      id: 'exchanges',
      number: '04',
      title: 'Exchanges (Defective or Damaged)',
      icon: RefreshCw,
      iconColor: '#8B5CF6',
      points: [
        {
          title: 'Defective Software Only',
          text: 'We only replace software packages if they are proven to be defective or damaged at the time of delivery.',
        },
        {
          title: 'Exchange Procedure',
          text: `If you encounter a defective software package and require an exchange for the identical item, send an email to ${companyEmail} detailing the issue along with error logs and order details.`,
        },
        {
          title: '10-Day Window Applies',
          text: 'Defective product reports and exchange requests must be filed within the standard 10-day window from the purchase timestamp.',
        },
      ],
      highlight: 'Exchanges are strictly limited to defective or damaged packages reported within the 10-day window.',
    },
    {
      id: 'cancellation',
      number: '05',
      title: 'Order & Subscription Cancellation',
      icon: Ban,
      iconColor: '#EC4899',
      points: [
        {
          title: 'Pre-Download Cancellation',
          text: 'To be eligible for an order cancellation, your application, software package, or license credential must not have been downloaded or retrieved from our server portal.',
        },
        {
          title: 'Post-Download Policy',
          text: 'Once a digital product or license key has been accessed or downloaded, it is legally deemed delivered and active. Post-download cancellation requests will not be entertained.',
        },
        {
          title: 'Subscription Cancellations',
          text: 'For recurring subscription plans, cancellations take effect at the conclusion of the currently paid billing period. No retroactive refunds are issued for partially used billing cycles.',
        },
      ],
      highlight: 'Once digital software or licenses are downloaded, they are considered delivered and non-cancellable.',
    },
    {
      id: 'help',
      number: '06',
      title: 'Need Help & Inquiries?',
      icon: Mail,
      iconColor: '#14B8A6',
      points: [
        {
          title: 'Dedicated Assistance',
          text: 'Have questions regarding our Return, Refund, or Cancellation Policy? Our customer support desk is here to assist with any order queries.',
        },
        {
          title: 'Response SLA',
          text: 'Our dedicated support team typically investigates and responds to refund-related inquiries within 24 business hours.',
        },
      ],
      highlight: 'Our customer support team is available to assist you with any refund or cancellation inquiries.',
    },
  ];

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${companyEmail}?subject=Return%20and%20Refund%20Inquiry`).catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={bgColor}
      />

      {/* Top Navigation Bar */}
      <View style={[styles.headerBar, { borderBottomColor: borderCol, backgroundColor: cardBg }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}
          activeOpacity={0.7}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <ArrowLeft size={18} color={textColor} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
            Refund & Cancellation Policy
          </Text>
          <Text style={[styles.headerSub, { color: subTextColor }]} numberOfLines={1}>
            {companyName}
          </Text>
        </View>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Scrollable Policy Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: cardBg,
              borderColor: borderCol,
            },
          ]}
        >
          <View style={[styles.heroIconBadge, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' }]}>
            <RotateCcw size={28} color="#F59E0B" />
          </View>
          <Text style={[styles.heroTitle, { color: textColor }]}>
            Return, Refund & Cancellation Policy
          </Text>
          <Text style={[styles.heroSubtitle, { color: subTextColor }]}>
            Clear guidelines on returns, refunds, product exchanges, and order cancellations for all digital software and services.
          </Text>

          <View style={[styles.badgeRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: borderCol }]}>
            <View style={styles.badgeItem}>
              <Calendar size={13} color={subTextColor} />
              <Text style={[styles.badgeText, { color: subTextColor }]}>
                Last updated: 2026
              </Text>
            </View>
            <View style={styles.badgeDot} />
            <Text style={[styles.badgeText, { color: brandColor, fontWeight: '700' }]}>
              10-Day Window Applies
            </Text>
          </View>
        </View>

        {/* Important Alert Notice */}
        <View style={[styles.alertNotice, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#FFFBEB', borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A' }]}>
          <AlertTriangle size={18} color="#D97706" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.alertTitle, { color: isDark ? '#FDE68A' : '#92400E' }]}>
              Important Notice
            </Text>
            <Text style={[styles.alertNoticeText, { color: isDark ? '#FEF3C7' : '#78350F' }]}>
              All return and refund requests are subject to the specific conditions outlined below. Please review these terms carefully before making a purchase decision.
            </Text>
          </View>
        </View>

        {/* Policy Sections (Point-wise) */}
        {sections.map((section) => {
          const IconComponent = section.icon;
          return (
            <View
              key={section.id}
              style={[
                styles.sectionCard,
                {
                  backgroundColor: cardBg,
                  borderColor: borderCol,
                },
              ]}
            >
              {/* Section Header */}
              <View style={[styles.sectionHeader, { borderBottomColor: borderCol }]}>
                <View style={[styles.sectionNumberBadge, { backgroundColor: section.iconColor }]}>
                  <Text style={styles.sectionNumberText}>{section.number}</Text>
                </View>
                <View style={styles.sectionTitleWrap}>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>
                    {section.title}
                  </Text>
                </View>
                <View
                  style={[
                    styles.sectionIconWrap,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.06)'
                        : `${section.iconColor}14`,
                    },
                  ]}
                >
                  <IconComponent size={16} color={section.iconColor} />
                </View>
              </View>

              {/* Point-wise list */}
              <View style={styles.sectionBody}>
                {/* Specific days badge if present */}
                {section.badge && (
                  <View style={[styles.windowBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF', borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE' }]}>
                    <Clock size={14} color="#3B82F6" />
                    <Text style={[styles.windowBadgeText, { color: isDark ? '#93C5FD' : '#1E40AF' }]}>
                      {section.badge}
                    </Text>
                  </View>
                )}

                {section.points.map((pt, pIdx) => (
                  <View key={pIdx} style={styles.pointRow}>
                    <View style={[styles.pointBullet, { backgroundColor: section.iconColor }]} />
                    <View style={styles.pointContent}>
                      {pt.title && (
                        <Text style={[styles.pointTitle, { color: textColor }]}>
                          {pt.title}
                        </Text>
                      )}
                      <Text style={[styles.pointText, { color: subTextColor }]}>
                        {pt.text}
                      </Text>
                    </View>
                  </View>
                ))}

                {/* Timeline Process if available */}
                {section.timeline && (
                  <View style={[styles.timelineWrap, { borderTopColor: borderCol }]}>
                    <Text style={[styles.timelineHeader, { color: textColor }]}>
                      Step-by-Step Processing Timeline
                    </Text>
                    {section.timeline.map((stepItem, sIdx) => (
                      <View key={sIdx} style={styles.timelineItem}>
                        <View style={[styles.timelineNumberBadge, { backgroundColor: section.iconColor }]}>
                          <Text style={styles.timelineNumberText}>{stepItem.step}</Text>
                        </View>
                        <View style={styles.timelineBody}>
                          <Text style={[styles.timelineTitle, { color: textColor }]}>
                            {stepItem.title}
                          </Text>
                          <Text style={[styles.timelineDesc, { color: subTextColor }]}>
                            {stepItem.description}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Key takeaway highlight box */}
                {section.highlight && (
                  <View
                    style={[
                      styles.highlightBox,
                      {
                        backgroundColor: isDark ? 'rgba(212, 164, 90, 0.08)' : '#FEF9C3',
                        borderLeftColor: '#EAB308',
                        borderColor: isDark ? 'rgba(212, 164, 90, 0.25)' : '#FDE047',
                      },
                    ]}
                  >
                    <Info size={14} color="#CA8A04" style={{ marginTop: 2, marginRight: 8 }} />
                    <Text style={[styles.highlightText, { color: isDark ? '#FEF08A' : '#854D0E' }]}>
                      {section.highlight}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Contact Support Card */}
        <View
          style={[
            styles.contactCard,
            {
              backgroundColor: cardBg,
              borderColor: borderCol,
            },
          ]}
        >
          <View style={[styles.contactHeader, { borderBottomColor: borderCol }]}>
            <View style={[styles.contactIconCircle, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
              <Mail size={20} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactTitle, { color: textColor }]}>
                We're Here to Help
              </Text>
              <Text style={[styles.contactSub, { color: subTextColor }]}>
                Have queries about a transaction or need refund assistance? Our support desk typically responds within 24 hours.
              </Text>
            </View>
          </View>

          <View style={styles.contactBody}>
            <TouchableOpacity
              onPress={handleEmailPress}
              style={[styles.emailActionBtn, { backgroundColor: brandColor }]}
              activeOpacity={0.8}
            >
              <Mail size={16} color="#FFFFFF" />
              <Text style={styles.emailActionText}>{companyEmail}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.bottomBackBtn,
            {
              backgroundColor: cardBg,
              borderColor: borderCol,
            },
          ]}
          activeOpacity={0.7}
        >
          <ArrowLeft size={16} color={subTextColor} />
          <Text style={[styles.bottomBackBtnText, { color: textColor }]}>
            Return to Previous Screen
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  headerRightSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
  },
  heroCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    marginBottom: 14,
  },
  heroIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 26,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
  },
  badgeText: {
    fontSize: 11,
  },
  alertNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    marginBottom: 14,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  alertNoticeText: {
    fontSize: 12,
    lineHeight: 17,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sectionNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionTitleWrap: {
    flex: 1,
    marginHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 18,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBody: {
    padding: 14,
  },
  windowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
    marginBottom: 12,
  },
  windowBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 11,
  },
  pointBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10,
  },
  pointContent: {
    flex: 1,
  },
  pointTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
    lineHeight: 17,
  },
  pointText: {
    fontSize: 12.5,
    lineHeight: 19,
  },
  timelineWrap: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 6,
    marginBottom: 8,
  },
  timelineHeader: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  timelineNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  timelineNumberText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  timelineBody: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  timelineDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 10,
    marginTop: 6,
  },
  highlightText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: '500',
  },
  contactCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 14,
    overflow: 'hidden',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  contactIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  contactSub: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  contactBody: {
    padding: 14,
  },
  emailActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  emailActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  bottomBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  bottomBackBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
