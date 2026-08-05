import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import {
  ArrowLeft,
  RefreshCw,
  MessageSquare,
  UserX,
  LogIn,
  Users,
  Bell,
  Send,
  X,
  UserCheck,
} from 'lucide-react-native';
import {
  chatbotDashboardService,
  ChatbotDashboardData,
  ChatbotMessage,
  ConversationDetails,
} from '../services/ChatbotDashboardService';

import StatsCard from '../../app/admin/chatbot/components/StatsCard';
import ActiveConversations from '../../app/admin/chatbot/components/ActiveConversations';
import OnlineAgents from '../../app/admin/chatbot/components/OnlineAgents';
import RecentMessages from '../../app/admin/chatbot/components/RecentMessages';
import NotificationsList from '../../app/admin/chatbot/components/NotificationsList';

export default function ChatbotContent() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const brandColor = adminTheme.brand || '#3b82f6';
  const inputBg = adminTheme.inputBg || (isDark ? '#1e293b' : '#f8fafc');

  const [dashboardData, setDashboardData] = useState<ChatbotDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Detail / Reply Modal States
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatDetails, setChatDetails] = useState<ConversationDetails | null>(null);
  const [fetchingChat, setFetchingChat] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Quick Assignment States
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignChatId, setAssignChatId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await chatbotDashboardService.getDashboardData();
      if (res && res.success && res.data) {
        setDashboardData(res.data);
      }
    } catch (err: any) {
      console.warn('Error fetching chatbot dashboard data:', err?.message);
      Toast.show({
        type: 'error',
        text1: 'Fetch Error',
        text2: err?.message || 'Failed to fetch chatbot dashboard data',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [fetchDashboardData]);

  const handleOpenChat = useCallback(async (conversationId: string) => {
    setSelectedChatId(conversationId);
    setChatModalVisible(true);
    setFetchingChat(true);
    try {
      const res = await chatbotDashboardService.getConversationDetails(conversationId);
      if (res && res.success && res.data) {
        setChatDetails(res.data);
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Chat Load Failed',
        text2: err.message || 'Failed to fetch chat logs',
      });
    } finally {
      setFetchingChat(false);
    }
  }, []);

  const handleSendReply = useCallback(async () => {
    if (!replyText.trim() || !selectedChatId) return;

    setSendingReply(true);
    try {
      const res = await chatbotDashboardService.sendMessage({
        conversationId: selectedChatId,
        messageText: replyText.trim(),
      });

      if (res && res.success) {
        const localSentMessage: ChatbotMessage = {
          id: Date.now(),
          conversationId: selectedChatId,
          messageText: replyText.trim(),
          messageType: 'Agent',
          senderName: 'Administrator',
          sentAt: new Date().toISOString(),
        };

        if (chatDetails) {
          setChatDetails({
            ...chatDetails,
            messages: [...chatDetails.messages, localSentMessage],
          });
        }
        setReplyText('');
        fetchDashboardData(true);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to send message',
          text2: res.message || 'Error executing API call',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Send Error',
        text2: err.message || 'Unable to deliver message',
      });
    } finally {
      setSendingReply(false);
    }
  }, [replyText, selectedChatId, chatDetails, fetchDashboardData]);

  const handleOpenAssign = useCallback((conversationId: string) => {
    setAssignChatId(conversationId);
    setSelectedAgentId(null);
    setAssignModalVisible(true);
  }, []);

  const handleAssignAgent = useCallback(async () => {
    if (!assignChatId || !selectedAgentId) return;

    setAssigning(true);
    try {
      const res = await chatbotDashboardService.assignConversation({
        conversationId: assignChatId,
        agentId: selectedAgentId,
      });

      if (res && res.success) {
        Toast.show({
          type: 'success',
          text1: 'Conversation Assigned',
          text2: 'Session successfully assigned to the agent.',
        });
        setAssignModalVisible(false);
        fetchDashboardData(true);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Assignment Failed',
          text2: res.message || 'Failed to assign conversation.',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Server error during assignment.',
      });
    } finally {
      setAssigning(false);
    }
  }, [assignChatId, selectedAgentId, fetchDashboardData]);

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: cardBg,
          borderBottomWidth: 1,
          borderBottomColor: borderCol,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }} activeOpacity={0.7}>
            <ArrowLeft size={22} color={textColor} />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>Chatbot Dashboard</Text>
            <Text style={{ fontSize: 11, color: subTextColor, marginTop: 1 }}>Administrator Context</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' }} />
            <Text style={{ fontSize: 11, color: subTextColor }}>Connected</Text>
          </View>

          <TouchableOpacity
            onPress={() => fetchDashboardData(true)}
            style={{
              backgroundColor: brandColor,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
            activeOpacity={0.8}
          >
            <RefreshCw size={14} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={{ marginTop: 12, color: subTextColor, fontSize: 13 }}>Loading Chatbot Dashboard...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchDashboardData(true)} colors={[brandColor]} />
          }
        >
          {dashboardData && (
            <>
              <View style={styles.statsGrid}>
                <StatsCard
                  title="Active Conversations"
                  value={dashboardData.stats.totalActiveConversations}
                  icon={MessageSquare}
                  color="#3b82f6"
                />
                <StatsCard
                  title="Unassigned"
                  value={dashboardData.stats.unassignedConversationsCount}
                  icon={UserX}
                  color="#f59e0b"
                />
                <StatsCard
                  title="Logins Today"
                  value={dashboardData.stats.memberLoginCount}
                  icon={LogIn}
                  color="#10b981"
                />
                <StatsCard
                  title="Online Agents"
                  value={dashboardData.stats.onlineAgentsCount}
                  icon={Users}
                  color="#06b6d4"
                />
                <StatsCard
                  title="Unread Alerts"
                  value={dashboardData.stats.unreadNotificationsCount}
                  icon={Bell}
                  color="#ef4444"
                />
              </View>

              <ActiveConversations
                conversations={[...dashboardData.myActiveConversations, ...dashboardData.unassignedConversations]}
                onViewChat={handleOpenChat}
                onAssignChat={handleOpenAssign}
              />

              <OnlineAgents agents={dashboardData.onlineAgents} />

              <View style={styles.lowerStack}>
                <RecentMessages messages={dashboardData.recentMessages} />
                <NotificationsList notifications={dashboardData.unreadNotifications} />
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* CHAT SESSION HISTORY & MANUAL REPLY MODAL */}
      <Modal visible={chatModalVisible} animationType="slide" onRequestClose={() => setChatModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: bgColor }}>
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: cardBg,
              borderBottomWidth: 1,
              borderBottomColor: borderCol,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>Conversation Log</Text>
              <Text style={{ fontSize: 11, color: subTextColor, marginTop: 1 }}>ID: {selectedChatId}</Text>
            </View>

            <TouchableOpacity onPress={() => setChatModalVisible(false)} style={{ padding: 6 }}>
              <X size={20} color={textColor} />
            </TouchableOpacity>
          </View>

          {fetchingChat ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={brandColor} />
              <Text style={{ marginTop: 12, color: subTextColor, fontSize: 12 }}>Loading chat history...</Text>
            </View>
          ) : (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
              style={{ flex: 1 }}
            >
              <FlatList
                data={chatDetails?.messages || []}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ padding: 16, gap: 12 }}
                renderItem={({ item }) => {
                  const isUser = item.messageType.toLowerCase() === 'user';
                  const isBot = item.messageType.toLowerCase() === 'bot';
                  return (
                    <View
                      style={[
                        styles.messageRow,
                        {
                          justifyContent: isUser ? 'flex-end' : 'flex-start',
                        },
                      ]}
                    >
                      {!isUser && (
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: isBot ? '#10b98120' : `${brandColor}20`,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 8,
                            marginTop: 4,
                          }}
                        >
                          <Text style={{ fontSize: 11 }}>{isBot ? '🤖' : '👤'}</Text>
                        </View>
                      )}

                      <View
                        style={[
                          styles.messageBubble,
                          {
                            backgroundColor: isUser
                              ? brandColor
                              : isDark
                              ? '#1e293b'
                              : '#f1f5f9',
                            borderTopRightRadius: isUser ? 2 : 12,
                            borderTopLeftRadius: isUser ? 12 : 2,
                            maxWidth: '75%',
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '600',
                            color: isUser ? '#ffffffa0' : subTextColor,
                            marginBottom: 2,
                          }}
                        >
                          {item.senderName}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: isUser ? '#ffffff' : textColor,
                            lineHeight: 18,
                          }}
                        >
                          {item.messageText}
                        </Text>
                        <Text
                          style={{
                            fontSize: 9,
                            color: isUser ? '#ffffff80' : subTextColor,
                            textAlign: 'right',
                            marginTop: 4,
                          }}
                        >
                          {item.sentAt
                            ? new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </Text>
                      </View>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <Text style={{ color: subTextColor, fontSize: 13 }}>No messages in this conversation session.</Text>
                  </View>
                }
              />

              {chatDetails?.assignment && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    backgroundColor: isDark ? '#18181b' : '#f8fafc',
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: borderCol,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <UserCheck size={16} color="#10b981" />
                    <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>
                      Assigned Agent ID: {chatDetails.assignment.assignedAgentId}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setChatModalVisible(false);
                      handleOpenAssign(chatDetails.conversationId);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 12, color: brandColor, fontWeight: '700' }}>Reassign</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: cardBg,
                  borderTopWidth: 1,
                  borderTopColor: borderCol,
                  gap: 8,
                }}
              >
                <TextInput
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: borderCol,
                    backgroundColor: inputBg,
                    paddingHorizontal: 16,
                    color: textColor,
                    fontSize: 13,
                  }}
                  placeholder="Type a manual agent response..."
                  placeholderTextColor={subTextColor}
                  value={replyText}
                  onChangeText={setReplyText}
                />
                <TouchableOpacity
                  onPress={handleSendReply}
                  disabled={sendingReply || !replyText.trim()}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: replyText.trim() ? brandColor : borderCol,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  activeOpacity={0.8}
                >
                  {sendingReply ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Send size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}
        </View>
      </Modal>

      {/* QUICK ASSIGN AGENT MODAL */}
      <Modal visible={assignModalVisible} transparent animationType="fade" onRequestClose={() => setAssignModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.assignModalContainer, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={[styles.modalHeaderRow, { borderBottomColor: borderCol }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Assign Conversation</Text>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                <X size={20} color={textColor} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
              <Text style={{ fontSize: 13, color: subTextColor, marginBottom: 4 }}>
                Select an online agent to assign this chat session:
              </Text>

              {dashboardData?.onlineAgents.length === 0 ? (
                <Text style={{ fontSize: 13, color: '#ef4444', fontStyle: 'italic' }}>
                  No agents are currently online.
                </Text>
              ) : (
                dashboardData?.onlineAgents.map((agent) => {
                  const isSelected = selectedAgentId === agent.agentId;
                  return (
                    <TouchableOpacity
                      key={agent.agentId}
                      onPress={() => setSelectedAgentId(agent.agentId || null)}
                      style={[
                        styles.agentSelectRow,
                        {
                          borderColor: isSelected ? brandColor : borderCol,
                          backgroundColor: isSelected ? (isDark ? `${brandColor}20` : `${brandColor}0d`) : inputBg,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{agent.agentName}</Text>
                        <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                          Chats: {agent.currentChats}/{agent.maxChats}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.radioCircle,
                          {
                            borderColor: isSelected ? brandColor : subTextColor,
                            backgroundColor: isSelected ? brandColor : 'transparent',
                          },
                        ]}
                      />
                    </TouchableOpacity>
                  );
                })
              )}

              <TouchableOpacity
                onPress={handleAssignAgent}
                disabled={assigning || !selectedAgentId}
                style={[
                  styles.assignBtn,
                  {
                    backgroundColor: selectedAgentId ? brandColor : borderCol,
                    marginTop: 10,
                  },
                ]}
                activeOpacity={0.8}
              >
                {assigning ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Assign Conversation</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  lowerStack: {
    gap: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  messageBubble: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  assignModalContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  agentSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  assignBtn: {
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
