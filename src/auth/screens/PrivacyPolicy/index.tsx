import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { useBrandingQuery } from '../../../admin/hooks/useBranding';
import {
  ArrowLeft,
  Shield,
  Database,
  CheckCircle2,
  Scale,
  CreditCard,
  Share2,
  Lock,
  Cookie,
  RefreshCw,
  Mail,
  Info,
  MapPin,
  Clock,
} from 'lucide-react-native';

interface PolicyPoint {
  title?: string;
  text: string;
}

interface PolicySection {
  id: string;
  number: string;
  title: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  iconColor: string;
  points: PolicyPoint[];
  highlight?: string;
}

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const { data: branding } = useBrandingQuery();

  const companyName = branding?.companyName || 'UPropTech Solutions';
  const companyEmail = 'support@uproptech.com';
  const companyAddress = 'Ultrakey IT Solutions Pvt Ltd';

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const brandColor = adminTheme.brand;

  const sections: PolicySection[] = [
    {
      id: 's1',
      number: '01',
      title: 'What Do We Do With Your Information?',
      icon: Database,
      iconColor: '#3B82F6',
      points: [
        {
          title: 'Direct Personal Information',
          text: 'When you purchase services, register an account, or interact with our platform, we collect the personal details you provide such as your Full Name, Email Address, Phone Number, and Office/Billing Address.',
        },
        {
          title: 'Automated Device & Usage Data',
          text: 'When you browse or use our applications, our servers automatically receive your device details, operating system version, and Internet Protocol (IP) address to help deliver an optimized experience.',
        },
        {
          title: 'Service & Update Notifications',
          text: 'With your permission, we may send you important communications concerning your workspace, account status, security alerts, and new feature updates.',
        },
        {
          title: 'Data Minimization Principle',
          text: 'We strictly limit our data collection to information that is necessary to deliver, maintain, and enhance our services for your organization.',
        },
      ],
      highlight: 'We only collect information that is strictly necessary to provide and improve your experience.',
    },
    {
      id: 's2',
      number: '02',
      title: 'Consent & Control',
      icon: CheckCircle2,
      iconColor: '#10B981',
      points: [
        {
          title: 'Implied Consent for Transactions',
          text: 'When you provide personal information to complete an order, verify account credentials, or administer workflows, you imply consent for us to collect and use it for that specific purpose only.',
        },
        {
          title: 'Express Consent for Marketing',
          text: 'If we request your personal information for secondary purposes (such as marketing campaigns or surveys), we will ask directly for your explicit consent or provide a clear mechanism to opt out.',
        },
        {
          title: 'Withdrawing Your Consent',
          text: `If you change your mind after opting in, you can withdraw your consent at any time for continued collection or use of your information by contacting our privacy desk at ${companyEmail}.`,
        },
      ],
      highlight: 'You remain in full control of your consent and can withdraw or modify it at any time.',
    },
    {
      id: 's3',
      number: '03',
      title: 'Disclosure & Legal Obligations',
      icon: Scale,
      iconColor: '#F59E0B',
      points: [
        {
          title: 'Legal Compliance',
          text: 'We may disclose your personal information if compelled to do so by applicable law, court summons, regulation, or governmental authority requests.',
        },
        {
          title: 'Policy & Safety Violations',
          text: 'We reserve the right to disclose relevant information if you violate our Terms of Service or to protect the safety, security, and integrity of our users and services.',
        },
        {
          title: 'No Sale of Personal Data',
          text: 'We do not sell, rent, or trade your personal data to advertisers or third-party marketing brokers.',
        },
      ],
      highlight: 'Your data is only disclosed when legally required or in cases of clear terms violations.',
    },
    {
      id: 's4',
      number: '04',
      title: 'Payment Processing & Security',
      icon: CreditCard,
      iconColor: '#8B5CF6',
      points: [
        {
          title: 'PCI-DSS Compliant Gateways',
          text: 'We use verified third-party payment gateways (such as Razorpay) to process payments securely and reliably.',
        },
        {
          title: 'Zero Card Storage on Company Servers',
          text: 'Neither we nor Razorpay store your confidential payment card numbers, expiry dates, or CVV credentials on our internal servers.',
        },
        {
          title: 'Standard Encryption in Transit',
          text: 'All payment data is encrypted following the Payment Card Industry Data Security Standard (PCI-DSS) protocols during transmission.',
        },
        {
          title: 'Transaction Record Retention',
          text: 'Purchase transaction data is retained only as long as required to complete your transaction, generate receipts, and comply with legal accounting regulations.',
        },
      ],
      highlight: 'Full card credentials are never stored on company servers and are encrypted via PCI-DSS standards.',
    },
    {
      id: 's5',
      number: '05',
      title: 'Third-Party Services',
      icon: Share2,
      iconColor: '#06B6D4',
      points: [
        {
          title: 'Limited Operational Sharing',
          text: 'Third-party service providers engaged by us (such as hosting, notification delivery, and cloud infrastructure) only receive information necessary to perform their specialized tasks.',
        },
        {
          title: 'Independent Privacy Standards',
          text: 'Certain service partners (including payment processors) maintain their own independent privacy policies for the transaction-related information we must provide to them.',
        },
        {
          title: 'External Links & Redirections',
          text: 'Once you navigate away from our application or follow links to third-party domains, your interactions are governed by that third party’s privacy terms, not ours.',
        },
      ],
      highlight: 'We recommend reviewing the privacy policies of third-party providers to understand their specific practices.',
    },
    {
      id: 's6',
      number: '06',
      title: 'Data Security Practices',
      icon: Lock,
      iconColor: '#EC4899',
      points: [
        {
          title: 'Industry-Standard Safeguards',
          text: 'We implement robust technical and organizational security measures to prevent your personal information from unauthorized loss, misuse, alteration, or disclosure.',
        },
        {
          title: 'Encrypted Communications',
          text: 'All communication between the mobile application and backend APIs is encrypted using secure Transport Layer Security (TLS/HTTPS).',
        },
        {
          title: 'Role-Based Access Control',
          text: 'Access to customer data within our organization is strictly restricted based on administrative roles and operational need.',
        },
      ],
      highlight: 'Industry-standard encryption and strict role-based controls protect your data at rest and in transit.',
    },
    {
      id: 's7',
      number: '07',
      title: 'Cookies & Session Data',
      icon: Cookie,
      iconColor: '#EAB308',
      points: [
        {
          title: 'Session Management',
          text: 'We use secure authentication tokens, local storage, and session identifiers to keep you securely signed in and maintain your user session.',
        },
        {
          title: 'No Cross-Platform Tracking',
          text: 'Session cookies and identifiers are strictly limited to the application environment and are never used to track your activities across third-party websites.',
        },
        {
          title: 'Preference Preservation',
          text: 'Session data ensures your dark/light theme, workspace selection, and user preferences remain consistent across sessions.',
        },
      ],
      highlight: 'Session data ensures seamless app navigation and is never used for external ad tracking.',
    },
    {
      id: 's8',
      number: '08',
      title: 'Policy Modifications & Revisions',
      icon: RefreshCw,
      iconColor: '#6366F1',
      points: [
        {
          title: 'Right to Modify',
          text: 'We reserve the right to amend this Privacy Policy at any time, so please check back periodically to stay informed.',
        },
        {
          title: 'Immediate Effect',
          text: 'All revisions, updates, and clarifications take effect immediately upon their publication within the application.',
        },
        {
          title: 'Material Change Notifications',
          text: 'If significant changes are made to how we collect or process personal data, we will alert you through in-app notices or direct communication.',
        },
        {
          title: 'Corporate Transfers',
          text: 'In the event that our platform is acquired or merged with another organization, customer data may be securely transferred to the successor entity to guarantee continuity.',
        },
      ],
      highlight: 'Material updates to this policy will be highlighted directly within the application.',
    },
    {
      id: 's9',
      number: '09',
      title: 'Questions & Contact Information',
      icon: Mail,
      iconColor: '#14B8A6',
      points: [
        {
          title: 'Access & Correction Requests',
          text: 'You have the right to inspect, update, correct, or request deletion of any personal data we maintain about your account.',
        },
        {
          title: 'Privacy Inquiries',
          text: 'If you have questions, feedback, or complaints regarding this Privacy Policy, our data compliance team is available to assist you.',
        },
        {
          title: 'Direct Email Support',
          text: `Reach out directly via email at ${companyEmail} for prompt assistance with any privacy concern.`,
        },
      ],
      highlight: 'Reach out to our support team at any time for data access, corrections, or privacy questions.',
    },
  ];

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${companyEmail}?subject=Privacy%20Policy%20Inquiry`).catch(() => {});
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
            Privacy Policy
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
          <View style={[styles.heroIconBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' }]}>
            <Shield size={28} color="#3B82F6" />
          </View>
          <Text style={[styles.heroTitle, { color: textColor }]}>
            Privacy & Data Protection Policy
          </Text>
          <Text style={[styles.heroSubtitle, { color: subTextColor }]}>
            This policy outlines how personal information is collected, utilized, and protected across our platform and applications.
          </Text>

          <View style={[styles.badgeRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: borderCol }]}>
            <View style={styles.badgeItem}>
              <Clock size={13} color={subTextColor} />
              <Text style={[styles.badgeText, { color: subTextColor }]}>
                Last updated: 2026
              </Text>
            </View>
            <View style={styles.badgeDot} />
            <Text style={[styles.badgeText, { color: brandColor, fontWeight: '600' }]}>
              All Users & Clients
            </Text>
          </View>
        </View>

        {/* Intro Notice */}
        <View style={[styles.introNotice, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : '#F0F9FF', borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : '#BAE6FD' }]}>
          <Info size={18} color="#0284C7" style={{ marginTop: 2 }} />
          <Text style={[styles.introNoticeText, { color: isDark ? '#E0F2FE' : '#0369A1' }]}>
            This privacy policy applies to all visitors, registered users, and corporate clients of{' '}
            <Text style={{ fontWeight: '700' }}>{companyName}</Text>. Please read these terms carefully to understand our practices regarding your personal data.
          </Text>
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

        {/* Contact & Legal Card */}
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
                Have Privacy Questions?
              </Text>
              <Text style={[styles.contactSub, { color: subTextColor }]}>
                Our privacy compliance team is ready to answer any questions or process data requests.
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

            {companyAddress ? (
              <View style={[styles.addressRow, { borderTopColor: borderCol }]}>
                <MapPin size={15} color={subTextColor} style={{ marginTop: 2, marginRight: 8 }} />
                <Text style={[styles.addressText, { color: subTextColor }]}>
                  {companyAddress}
                </Text>
              </View>
            ) : null}
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
  introNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    marginBottom: 14,
  },
  introNoticeText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
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
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 10,
    marginTop: 4,
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
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 10,
  },
  addressText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
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
