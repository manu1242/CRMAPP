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
  FileText,
  Landmark,
  Store,
  ShieldCheck,
  Info,
  Tag,
  Package,
  CreditCard,
  ExternalLink,
  UserCheck,
  Ban,
  AlertTriangle,
  Gavel,
  Mail,
  Calendar,
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
  badge?: string;
}

export default function TermsAndConditionsScreen() {
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
      id: 'store_terms',
      number: '01',
      title: 'Online Store & Account Terms',
      icon: Store,
      iconColor: '#3B82F6',
      points: [
        {
          title: 'Age of Majority',
          text: 'By agreeing to these Terms of Service, you represent that you are at least the age of majority in your jurisdiction of residence, or that you have given us your consent to allow your minor dependents to use this service.',
        },
        {
          title: 'Lawful Use Only',
          text: 'You may not use our platform, APIs, software, or digital products for any illegal or unauthorized purpose.',
        },
        {
          title: 'Compliance with Local Laws',
          text: 'You agree to comply with all applicable local, national, and international laws, regulations, and copyright restrictions while accessing our services.',
        },
        {
          title: 'Immediate Termination on Breach',
          text: 'Any breach, abuse, or violation of these Terms will result in immediate suspension or termination of your account and services.',
        },
      ],
      highlight: 'A breach or violation of any Terms will result in an immediate termination of your services.',
    },
    {
      id: 'general_conditions',
      number: '02',
      title: 'General Conditions & Service Rights',
      icon: ShieldCheck,
      iconColor: '#10B981',
      points: [
        {
          title: 'Right to Refuse Service',
          text: 'We reserve the right to refuse service, subscriptions, or accounts to anyone for any legitimate reason at any time.',
        },
        {
          title: 'Network Transmission of Content',
          text: 'You understand that your non-financial content may be transferred unencrypted over various telecommunication networks to adapt to technical requirements.',
        },
        {
          title: 'Encrypted Payment Security',
          text: 'All credit card and payment information is strictly encrypted using industry standard PCI-DSS protocols during transit over networks.',
        },
      ],
      highlight: 'Payment card information is always encrypted during transit across all networks.',
    },
    {
      id: 'accuracy',
      number: '03',
      title: 'Accuracy, Completeness & Timeliness of Information',
      icon: Info,
      iconColor: '#F59E0B',
      points: [
        {
          title: 'General Informational Purpose',
          text: 'Information made available on this platform is for general informational purposes only and should not be relied upon as the sole basis for business or legal decisions without primary verification.',
        },
        {
          title: 'Platform Content Updates',
          text: 'We reserve the right to modify or adjust contents and features on the platform at any time, but we have no obligation to update historical or archival information.',
        },
      ],
      highlight: 'We reserve the right to modify platform contents at any time without obligation to update past records.',
    },
    {
      id: 'modifications',
      number: '04',
      title: 'Modifications to Services & Pricing',
      icon: Tag,
      iconColor: '#8B5CF6',
      points: [
        {
          title: 'Price Adjustments',
          text: 'Prices for our products, plans, and subscription tiers are subject to revision without prior notice.',
        },
        {
          title: 'Feature Discontinuance',
          text: 'We reserve the right at any time to modify, suspend, or discontinue any feature, tool, or aspect of the Service without liability.',
        },
        {
          title: 'No Liability for Modifications',
          text: 'We shall not be liable to you or to any third party for any price adjustments, feature modifications, suspension, or discontinuance of the Service.',
        },
      ],
      highlight: 'Subscription pricing and feature availability may be modified with prospective application.',
    },
    {
      id: 'products_services',
      number: '05',
      title: 'Products, Subscriptions & Service Availability',
      icon: Package,
      iconColor: '#06B6D4',
      points: [
        {
          title: 'Digital Exclusivity',
          text: 'Certain tools, modules, and subscriptions may be provisioned exclusively online or through the mobile app.',
        },
        {
          title: 'Subject to Refund Policy',
          text: 'All product orders, downloads, and software packages are subject to return, exchange, or refund strictly under our Return & Refund Policy.',
        },
        {
          title: 'Territorial Sales Limitations',
          text: 'We reserve the right to restrict the provision of our services or licenses to any geographic territory, person, or jurisdiction at our discretion.',
        },
        {
          title: 'Technical Descriptions',
          text: 'While we strive to display descriptions and configurations as accurately as possible, we do not warrant that all specifications are completely error-free.',
        },
      ],
      highlight: 'Digital products are delivered under our dedicated Return, Refund & Cancellation Policy.',
    },
    {
      id: 'billing',
      number: '06',
      title: 'Accuracy of Billing & Account Information',
      icon: CreditCard,
      iconColor: '#EC4899',
      points: [
        {
          title: 'Right to Refuse Orders',
          text: 'We reserve the right to reject or limit quantities on any transaction or subscription order placed through the app.',
        },
        {
          title: 'Account Detail Accuracy',
          text: 'You agree to provide true, current, complete, and accurate purchase, billing, and organizational details for all transactions.',
        },
        {
          title: 'Prompt Information Updates',
          text: 'You agree to promptly update your profile information (including active email, mobile number, and payment credentials) to facilitate seamless communication and transaction completion.',
        },
      ],
      highlight: 'Accurate billing and contact details must be maintained to ensure active service continuity.',
    },
    {
      id: 'third_party',
      number: '07',
      title: 'Third-Party Links & Integrations',
      icon: ExternalLink,
      iconColor: '#14B8A6',
      points: [
        {
          title: 'External Websites',
          text: 'Certain content or features may link to third-party tools, payment processors, or external service websites not managed by us.',
        },
        {
          title: 'No Liability for External Content',
          text: 'We are not responsible for inspecting, evaluating, or warranting third-party materials or websites, and assume no liability for third-party practices.',
        },
        {
          title: 'Review Independent Policies',
          text: 'We strongly recommend reviewing third-party terms and privacy policies before engaging in any transaction with them.',
        },
      ],
      highlight: 'Interactions with external third-party tools or sites are governed by their respective independent policies.',
    },
    {
      id: 'personal_info',
      number: '08',
      title: 'Personal Information & Privacy',
      icon: UserCheck,
      iconColor: '#6366F1',
      points: [
        {
          title: 'Governed by Privacy Policy',
          text: 'Your submission and handling of personal data through the application is governed strictly by our Privacy Policy.',
        },
        {
          title: 'Incorporated by Reference',
          text: 'Our Privacy Policy is fully incorporated into and forms an integral, legally binding part of these Terms of Service.',
        },
      ],
      highlight: 'Our Privacy Policy forms an integral part of these Terms of Service.',
    },
    {
      id: 'prohibited_uses',
      number: '09',
      title: 'Prohibited Uses of the Platform',
      icon: Ban,
      iconColor: '#EF4444',
      points: [
        {
          title: 'Unlawful Activity',
          text: 'Using the platform for any illegal purpose or to solicit others to commit unlawful acts.',
        },
        {
          title: 'Regulatory Infringement',
          text: 'Violating any local, regional, national, or international regulations, rules, or statutory ordinances.',
        },
        {
          title: 'Intellectual Property Violation',
          text: 'Infringing upon, copying, decompiling, or violating our intellectual property rights or the rights of third parties.',
        },
        {
          title: 'Abusive Conduct',
          text: 'Harassing, abusing, insulting, defaming, slandering, intimidating, or discriminating against any user or team member.',
        },
        {
          title: 'False or Misleading Data',
          text: 'Submitting fraudulent information, forged customer data, or deceptive inquiries.',
        },
        {
          title: 'Malware & Security Circumvention',
          text: 'Uploading malicious code, automated scraping without consent, or bypassing platform security features.',
        },
      ],
      highlight: 'Engaging in prohibited activities will result in immediate account termination and legal escalation.',
    },
    {
      id: 'disclaimer',
      number: '10',
      title: 'Disclaimer of Warranties & Limitation of Liability',
      icon: AlertTriangle,
      iconColor: '#EAB308',
      points: [
        {
          title: 'As-Is Service Provision',
          text: 'The platform and services are provided strictly on an "as is" and "as available" basis without any express or implied warranties.',
        },
        {
          title: 'No Guarantee of Error-Free Uptime',
          text: 'We do not warrant that your use of the service will be continuous, entirely error-free, uninterrupted, or fully immune from unforeseen network outages.',
        },
        {
          title: 'Limitation of Corporate Liability',
          text: `In no circumstance shall ${companyName}, its directors, employees, affiliates, or contractors be liable for any direct, indirect, incidental, punitive, or consequential damages resulting from your use of the platform.`,
        },
      ],
      highlight: 'Services are delivered on an "as-is" basis with limitation of consequential damages to the maximum extent permitted by law.',
    },
    {
      id: 'governing_law',
      number: '11',
      title: 'Governing Law & Dispute Resolution',
      icon: Gavel,
      iconColor: '#0EA5E9',
      badge: 'Governed by Indian Law',
      points: [
        {
          title: 'Applicable Jurisdiction',
          text: 'These Terms of Service and any separate agreements shall be governed by, interpreted, and construed in accordance with the substantive laws of India.',
        },
        {
          title: 'Jurisdiction of Courts',
          text: 'Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts located in India.',
        },
      ],
      highlight: 'All agreements and operational terms are governed exclusively by the laws of India.',
    },
    {
      id: 'contact_terms',
      number: '12',
      title: 'Questions & Contact Information',
      icon: Mail,
      iconColor: '#10B981',
      points: [
        {
          title: 'Legal Queries',
          text: 'Questions, clarifications, or formal notices regarding these Terms & Conditions should be forwarded to our legal & compliance desk.',
        },
        {
          title: 'Turnaround Time',
          text: 'Our team aims to respond to formal terms inquiries within 2–3 business days.',
        },
        {
          title: 'Direct Email',
          text: `Contact us directly at ${companyEmail} for prompt legal assistance.`,
        },
      ],
      highlight: 'Our legal and support desks are available for any questions or terms clarifications.',
    },
  ];

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${companyEmail}?subject=Terms%20and%20Conditions%20Inquiry`).catch(() => {});
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
            Terms & Conditions
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
          <View style={[styles.heroIconBadge, { backgroundColor: isDark ? 'rgba(6, 182, 212, 0.15)' : '#ECFEFF' }]}>
            <FileText size={28} color="#06B6D4" />
          </View>
          <Text style={[styles.heroTitle, { color: textColor }]}>
            Terms of Service & Usage
          </Text>
          <Text style={[styles.heroSubtitle, { color: subTextColor }]}>
            Please review these terms and conditions carefully before utilizing our applications, platforms, tools, and digital services.
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
              Binding Agreement
            </Text>
          </View>
        </View>

        {/* Overview Box */}
        <View
          style={[
            styles.overviewCard,
            {
              backgroundColor: isDark ? '#0f2137' : '#0f2137',
              borderColor: isDark ? 'rgba(26,111,168,.4)' : '#1a3a5c',
            },
          ]}
        >
          <View style={styles.overviewHeader}>
            <View style={styles.overviewIconCircle}>
              <Landmark size={16} color="#d4a45a" />
            </View>
            <Text style={styles.overviewTitle}>General Agreement Overview</Text>
          </View>
          <Text style={styles.overviewText}>
            This application is operated by{' '}
            <Text style={{ color: '#d4a45a', fontWeight: '700' }}>{companyName}</Text>. Throughout the platform, the terms "we", "us", and "our" refer to {companyName}. We offer this platform, including all information, tools, and services, conditioned upon your acceptance of all terms, conditions, policies, and notices stated here.
          </Text>
          <Text style={[styles.overviewText, { marginTop: 8 }]}>
            By accessing or subscribing to our services, you engage in our Service and agree to be bound by these Terms of Service. If you do not agree to all terms, you may not access or use the application.
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
                {section.badge && (
                  <View style={[styles.lawBadge, { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.15)' : '#E0F2FE', borderColor: isDark ? 'rgba(14, 165, 233, 0.3)' : '#BAE6FD' }]}>
                    <Gavel size={14} color="#0EA5E9" />
                    <Text style={[styles.lawBadgeText, { color: isDark ? '#7DD3FC' : '#0369A1' }]}>
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
                Have Terms or Legal Questions?
              </Text>
              <Text style={[styles.contactSub, { color: subTextColor }]}>
                Our legal compliance desk is available to clarify any contractual terms or conditions.
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
  overviewCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  overviewIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(212,164,90,.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewTitle: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  overviewText: {
    color: 'rgba(255,255,255,0.78)',
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
  lawBadge: {
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
  lawBadgeText: {
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
