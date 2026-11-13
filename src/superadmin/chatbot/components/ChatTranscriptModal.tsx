import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Linking,
  Alert,
  Clipboard,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  X,
  Send,
  Phone,
  Mail,
  MessageCircle,
  Copy,
  Bot,
  User,
  Sparkles,
  CheckCircle,
  Clock,
  Info,
  Calendar,
  Layers,
  Check,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../../theme/adminTheme';
import {
  useChatbotTranscriptQuery,
  useCloseChatbotSessionMutation,
  useSendChatbotMessageMutation,
} from '../hooks/useSuperAdminChatbot';
import { ChatSessionItem } from '../models/chatbot';

interface ChatTranscriptModalProps {
  session: ChatSessionItem | null;
  visible: boolean;
  onClose: () => void;
}

export const ChatTranscriptModal: React.FC<ChatTranscriptModalProps> = ({
  session,
  visible,
  onClose,
}) => {
  const { isDark } = useTheme();
  const theme = getSuperAdminTheme(isDark);
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'transcript' | 'customer' | 'session'>('transcript');
  const [replyMessage, setReplyMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sessionId = session?.sessionGuid || session?.sessionId;
  const { data, isLoading, refetch, isRefetching } = useChatbotTranscriptQuery(
    visible && sessionId ? sessionId : null
  );

  const closeMutation = useCloseChatbotSessionMutation();
  const sendMutation = useSendChatbotMessageMutation();

  const transcriptData = data?.data;
  const s = transcriptData?.session || session;
  const lead = transcriptData?.lead;
  const logs = transcriptData?.logs || [];
  const rtMessages = transcriptData?.rtMessages || [];

  const displayName = s?.userName?.trim()
    ? s.userName
    : `Visitor #${s?.sessionGuid ? s.sessionGuid.substring(0, 8) : s?.sessionId || ''}`;

  const isActive = s?.status === 'Active';

  useEffect(() => {
    if (visible) {
      setActiveTab('transcript');
      setReplyMessage('');
    }
  }, [visible]);

  const handleSendMessage = async () => {
    if (!replyMessage.trim() || !sessionId) return;
    const msg = replyMessage.trim();
    setReplyMessage('');
    try {
      await sendMutation.mutateAsync({
        sessionId,
        message: msg,
      });
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const handleCloseSession = () => {
    if (!sessionId) return;
    Alert.alert(
      'End Session',
      'Are you sure you want to mark this chatbot session as closed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            try {
              await closeMutation.mutateAsync(sessionId);
              Alert.alert('Success', 'Session marked as closed.');
            } catch {
              Alert.alert('Error', 'Failed to close session.');
            }
          },
        },
      ]
    );
  };

  const handleCall = () => {
    if (s?.userPhone) {
      Linking.openURL(`tel:${s.userPhone}`);
    }
  };

  const handleWhatsApp = () => {
    if (s?.userPhone) {
      const cleanPhone = s.userPhone.replace(/[^0-9]/g, '');
      Linking.openURL(`whatsapp://send?phone=${cleanPhone}`);
    }
  };

  const handleEmail = () => {
    if (s?.userEmail) {
      Linking.openURL(`mailto:${s.userEmail}`);
    }
  };

  const handleCopyTranscript = () => {
    let text = `=== CHAT TRANSCRIPT: ${displayName} ===\n`;
    text += `Session GUID: ${s?.sessionGuid}\nStarted: ${s?.startedAt}\nStatus: ${s?.status}\n\n`;

    logs.forEach((log) => {
      if (log.userMessage) text += `User: ${log.userMessage} (${log.createdOn})\n`;
      if (log.aiResponse) text += `Bot: ${log.aiResponse} (${log.createdOn})\n\n`;
    });

    rtMessages.forEach((rt) => {
      text += `${rt.senderName || 'Agent'}: ${rt.message} (${rt.createdOn})\n`;
    });

    Clipboard.setString(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: theme.primaryBg }]}
      >
        {/* Top Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.cardBg,
              borderBottomColor: theme.border,
              paddingTop: Platform.OS === 'android' ? Math.max(16, insets.top) : 12,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.headerAvatar,
                {
                  backgroundColor: isActive
                    ? isDark
                      ? '#835CEE30'
                      : '#835CEE15'
                    : isDark
                    ? '#1e1e1e'
                    : '#f4f4f5',
                },
              ]}
            >
              <Text
                style={[
                  styles.headerAvatarText,
                  { color: isActive ? (isDark ? '#a78bfa' : '#835CEE') : theme.textMuted },
                ]}
              >
                {displayName.substring(0, 2).toUpperCase()}
              </Text>
            </View>

            <View style={styles.headerInfo}>
              <View style={styles.headerTitleRow}>
                <Text
                  numberOfLines={1}
                  style={[styles.headerTitle, { color: theme.textPrimary }]}
                >
                  {displayName}
                </Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isActive
                        ? isDark
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'rgba(16, 185, 129, 0.12)'
                        : isDark
                        ? 'rgba(148, 163, 184, 0.2)'
                        : 'rgba(148, 163, 184, 0.12)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: isActive ? '#10b981' : theme.textMuted },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: isActive ? '#10b981' : theme.textMuted },
                    ]}
                  >
                    {isActive ? 'Active' : 'Closed'}
                  </Text>
                </View>
              </View>

              <Text numberOfLines={1} style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                {s?.userPhone || s?.userEmail || 'Website Guest'} · {s?.startedAt || ''}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {isActive && (
              <TouchableOpacity
                onPress={handleCloseSession}
                disabled={closeMutation.isPending}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(239, 68, 68, 0.1)',
                  },
                ]}
              >
                <Text style={styles.closeSessionText}>
                  {closeMutation.isPending ? 'Ending...' : 'End Chat'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={onClose} style={styles.closeIconBtn}>
              <X size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Selector */}
        <View
          style={[
            styles.tabsContainer,
            { backgroundColor: theme.cardBg, borderBottomColor: theme.border },
          ]}
        >
          <TouchableOpacity
            onPress={() => setActiveTab('transcript')}
            style={[
              styles.tabBtn,
              activeTab === 'transcript' && [
                styles.tabBtnActive,
                { borderBottomColor: theme.brand },
              ],
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === 'transcript' ? theme.brand : theme.textMuted,
                  fontWeight: activeTab === 'transcript' ? '700' : '600',
                },
              ]}
            >
              Transcript ({logs.length + rtMessages.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('customer')}
            style={[
              styles.tabBtn,
              activeTab === 'customer' && [
                styles.tabBtnActive,
                { borderBottomColor: theme.brand },
              ],
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === 'customer' ? theme.brand : theme.textMuted,
                  fontWeight: activeTab === 'customer' ? '700' : '600',
                },
              ]}
            >
              Customer Info
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('session')}
            style={[
              styles.tabBtn,
              activeTab === 'session' && [
                styles.tabBtnActive,
                { borderBottomColor: theme.brand },
              ],
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === 'session' ? theme.brand : theme.textMuted,
                  fontWeight: activeTab === 'session' ? '700' : '600',
                },
              ]}
            >
              Session Info
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Transcript */}
        {activeTab === 'transcript' && (
          <View style={{ flex: 1 }}>
            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1 }}
              contentContainerStyle={styles.transcriptContent}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
            >
              {/* Lead Banner if generated */}
              {s?.isLeadGenerated && (
                <View
                  style={[
                    styles.leadBanner,
                    {
                      backgroundColor: isDark
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(16, 185, 129, 0.1)',
                      borderColor: '#10b981',
                    },
                  ]}
                >
                  <View style={styles.leadBadgePill}>
                    <Sparkles size={11} color="#ffffff" />
                    <Text style={styles.leadBadgePillText}>LEAD CAPTURED</Text>
                  </View>
                  <Text style={[styles.leadBannerDetails, { color: theme.textPrimary }]}>
                    {displayName} · {s.userPhone || '--'} · {s.userEmail || '--'}
                  </Text>
                  <Text style={[styles.leadBannerSub, { color: '#10b981' }]}>
                    Captured into CRM Leads
                  </Text>
                </View>
              )}

              {isLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={theme.brand} />
                  <Text style={[styles.loadingText, { color: theme.textMuted }]}>
                    Loading transcript...
                  </Text>
                </View>
              ) : logs.length === 0 && rtMessages.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Clock size={32} color={theme.textMuted} />
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    No messages recorded in this session yet.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Logs: User and Bot */}
                  {logs.map((log) => (
                    <React.Fragment key={`log-${log.chatLogId}`}>
                      {/* User message */}
                      {Boolean(log.userMessage) && (
                        <View style={styles.userMsgRow}>
                          <View
                            style={[
                              styles.userBubble,
                              { backgroundColor: theme.brand },
                            ]}
                          >
                            <Text style={styles.userBubbleText}>{log.userMessage}</Text>
                            <Text style={styles.userBubbleTime}>
                              {displayName} · {log.createdOn}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* AI Bot Response */}
                      {Boolean(log.aiResponse) && (
                        <View style={styles.botMsgRow}>
                          <View
                            style={[
                              styles.botAvatarWrap,
                              {
                                backgroundColor: isDark
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : 'rgba(245, 158, 11, 0.1)',
                              },
                            ]}
                          >
                            <Bot size={16} color="#f59e0b" />
                          </View>
                          <View
                            style={[
                              styles.botBubble,
                              {
                                backgroundColor: theme.cardBg,
                                borderColor: theme.border,
                              },
                            ]}
                          >
                            <Text style={[styles.botBubbleText, { color: theme.textPrimary }]}>
                              {log.aiResponse}
                            </Text>
                            <Text style={[styles.botBubbleTime, { color: theme.textMuted }]}>
                              Chatbot · {log.createdOn}
                            </Text>
                          </View>
                        </View>
                      )}
                    </React.Fragment>
                  ))}

                  {/* Realtime messages */}
                  {rtMessages.map((rt) => (
                    <View
                      key={`rt-${rt.id}`}
                      style={
                        rt.messageType === 'User' ? styles.userMsgRow : styles.botMsgRow
                      }
                    >
                      {rt.messageType !== 'User' && (
                        <View
                          style={[
                            styles.botAvatarWrap,
                            {
                              backgroundColor: isDark
                                ? 'rgba(59, 130, 246, 0.15)'
                                : 'rgba(37, 99, 235, 0.1)',
                            },
                          ]}
                        >
                          <User size={16} color={theme.brand} />
                        </View>
                      )}
                      <View
                        style={[
                          rt.messageType === 'User'
                            ? [styles.userBubble, { backgroundColor: theme.brand }]
                            : [
                                styles.botBubble,
                                {
                                  backgroundColor: theme.cardBg,
                                  borderColor: theme.border,
                                },
                              ],
                        ]}
                      >
                        <Text
                          style={[
                            rt.messageType === 'User'
                              ? styles.userBubbleText
                              : [styles.botBubbleText, { color: theme.textPrimary }],
                          ]}
                        >
                          {rt.message}
                        </Text>
                        <Text
                          style={[
                            rt.messageType === 'User'
                              ? styles.userBubbleTime
                              : [styles.botBubbleTime, { color: theme.textMuted }],
                          ]}
                        >
                          {rt.senderName || 'Agent'} · {rt.createdOn}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {/* Submitted Lead Inquiry Card */}
                  {s?.isLeadGenerated && (
                    <View
                      style={[
                        styles.inquiryCard,
                        {
                          backgroundColor: theme.cardBg,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <View style={styles.inquiryHeader}>
                        <CheckCircle size={14} color="#10b981" />
                        <Text style={[styles.inquiryTitle, { color: '#10b981' }]}>
                          INQUIRY SUBMITTED
                        </Text>
                      </View>
                      <View style={styles.inquiryRow}>
                        <Text style={[styles.inquiryLabel, { color: theme.textMuted }]}>Name:</Text>
                        <Text style={[styles.inquiryVal, { color: theme.textPrimary }]}>
                          {displayName}
                        </Text>
                      </View>
                      <View style={styles.inquiryRow}>
                        <Text style={[styles.inquiryLabel, { color: theme.textMuted }]}>Phone:</Text>
                        <Text style={[styles.inquiryVal, { color: theme.textPrimary }]}>
                          {s?.userPhone || '--'}
                        </Text>
                      </View>
                      <View style={styles.inquiryRow}>
                        <Text style={[styles.inquiryLabel, { color: theme.textMuted }]}>Email:</Text>
                        <Text style={[styles.inquiryVal, { color: theme.textPrimary }]}>
                          {s?.userEmail || '--'}
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {/* Bottom Message Input Bar */}
            <View
              style={[
                styles.replyBar,
                {
                  backgroundColor: theme.cardBg,
                  borderTopColor: theme.border,
                  paddingBottom: Math.max(12, insets.bottom),
                },
              ]}
            >
              <TextInput
                value={replyMessage}
                onChangeText={setReplyMessage}
                placeholder="Type a reply as SuperAdmin..."
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.replyInput,
                  {
                    backgroundColor: theme.primaryBg,
                    color: theme.textPrimary,
                    borderColor: theme.border,
                  },
                ]}
                multiline
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={!replyMessage.trim() || sendMutation.isPending}
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: replyMessage.trim()
                      ? theme.brand
                      : isDark
                      ? '#1e1e1e'
                      : '#e4e4e7',
                  },
                ]}
              >
                {sendMutation.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Send
                    size={16}
                    color={replyMessage.trim() ? '#ffffff' : theme.textMuted}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tab 2: Customer Info */}
        {activeTab === 'customer' && (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.infoContent,
              { paddingBottom: Math.max(24, insets.bottom + 16) },
            ]}
          >
            {/* Quick Actions (Call, WhatsApp, Email) */}
            <View style={styles.quickActionsRow}>
              {Boolean(s?.userPhone) && (
                <>
                  <TouchableOpacity
                    onPress={handleCall}
                    style={[styles.quickActionBtn, { backgroundColor: '#10b981' }]}
                  >
                    <Phone size={15} color="#ffffff" />
                    <Text style={styles.quickActionBtnText}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleWhatsApp}
                    style={[styles.quickActionBtn, { backgroundColor: '#25D366' }]}
                  >
                    <MessageCircle size={15} color="#ffffff" />
                    <Text style={styles.quickActionBtnText}>WhatsApp</Text>
                  </TouchableOpacity>
                </>
              )}

              {Boolean(s?.userEmail) && (
                <TouchableOpacity
                  onPress={handleEmail}
                  style={[styles.quickActionBtn, { backgroundColor: theme.brand }]}
                >
                  <Mail size={15} color="#ffffff" />
                  <Text style={styles.quickActionBtnText}>Email</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Customer Details Card */}
            <View
              style={[
                styles.detailsCard,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.cardHeaderTitle, { color: theme.textPrimary }]}>
                Customer Identity
              </Text>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Full Name</Text>
                <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                  {displayName}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Phone Number</Text>
                <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                  {s?.userPhone || 'Not provided'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Email Address</Text>
                <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                  {s?.userEmail || 'Not provided'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Visitor Status</Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: s?.isLeadGenerated ? '#f59e0b' : theme.textSecondary },
                  ]}
                >
                  {s?.isLeadGenerated ? '⭐ Captured CRM Lead' : 'Active Visitor'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Interest / Query</Text>
                <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                  {lead?.preferredLocation || s?.lastIntent || 'General Website Enquiry'}
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Tab 3: Session Info */}
        {activeTab === 'session' && (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.infoContent,
              { paddingBottom: Math.max(24, insets.bottom + 16) },
            ]}
          >
            {/* Copy Transcript Button */}
            <TouchableOpacity
              onPress={handleCopyTranscript}
              style={[
                styles.copyButton,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
              ]}
            >
              {copied ? (
                <>
                  <Check size={16} color="#10b981" />
                  <Text style={[styles.copyButtonText, { color: '#10b981' }]}>
                    Transcript Copied!
                  </Text>
                </>
              ) : (
                <>
                  <Copy size={16} color={theme.textPrimary} />
                  <Text style={[styles.copyButtonText, { color: theme.textPrimary }]}>
                    Copy Full Transcript
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Session Metadata Card */}
            <View
              style={[
                styles.detailsCard,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.cardHeaderTitle, { color: theme.textPrimary }]}>
                Session Metadata
              </Text>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Session GUID</Text>
                <Text
                  selectable
                  style={[styles.detailValue, { color: theme.textSecondary, fontSize: 11 }]}
                >
                  {s?.sessionGuid || '--'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Started Time</Text>
                <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                  {s?.startedAt || '--'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Total Messages</Text>
                <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                  {logs.length + rtMessages.length} Messages
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Session State</Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: isActive ? '#10b981' : theme.textMuted },
                  ]}
                >
                  {s?.status || 'Unknown'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Detected Intent</Text>
                <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                  {s?.lastIntent || 'Property Search & Enquiry'}
                </Text>
              </View>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  closeSessionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ef4444',
  },
  closeIconBtn: {
    padding: 6,
    borderRadius: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    gap: 16,
  },
  tabBtn: {
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    // borderBottomColor set dynamically
  },
  tabText: {
    fontSize: 12.5,
  },
  transcriptContent: {
    padding: 16,
    gap: 12,
  },
  leadBanner: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
    gap: 4,
  },
  leadBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  leadBadgePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  leadBannerDetails: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  leadBannerSub: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 12.5,
    textAlign: 'center',
  },
  userMsgRow: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
  },
  userBubble: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderTopRightRadius: 2,
  },
  userBubbleText: {
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 18,
  },
  userBubbleTime: {
    fontSize: 9.5,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  botMsgRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    maxWidth: '85%',
    gap: 8,
  },
  botAvatarWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  botBubble: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderTopLeftRadius: 2,
    borderWidth: 1,
  },
  botBubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  botBubbleTime: {
    fontSize: 9.5,
    marginTop: 4,
  },
  inquiryCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
    gap: 6,
  },
  inquiryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  inquiryTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  inquiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inquiryLabel: {
    fontSize: 11,
    width: 48,
  },
  inquiryVal: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    maxHeight: 90,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    padding: 16,
    gap: 14,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  quickActionBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  detailsCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  cardHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  detailRow: {
    gap: 3,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

