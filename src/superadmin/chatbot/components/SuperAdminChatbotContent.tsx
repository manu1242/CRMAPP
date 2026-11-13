import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  X,
  RefreshCw,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../../theme/adminTheme';
import {
  useChatbotConversationsQuery,
  useChatbotStatsQuery,
} from '../hooks/useSuperAdminChatbot';
import { ChatSessionItem } from '../models/chatbot';
import { ChatbotStatsCards } from './ChatbotStatsCards';
import { ConversationCard } from './ConversationCard';
import { ChatTranscriptModal } from './ChatTranscriptModal';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';
import BottomNav from '../../components/BottomNav';

const PAGE_SIZE = 15;

const STATUS_FILTERS = [
  { key: 'All', label: 'All' },
  { key: 'Active', label: 'Active' },
  { key: 'Leads', label: 'Leads' },
  { key: 'Closed', label: 'Closed' },
];

export const SuperAdminChatbotContent: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const theme = getSuperAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();

  // State
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<ChatSessionItem | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const onBackPress = () => {
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [router]);

  // Queries
  const {
    data: conversationsData,
    isLoading,
    refetch: refetchConversations,
    isRefetching,
  } = useChatbotConversationsQuery({
    page,
    pageSize: PAGE_SIZE,
    status: statusFilter !== 'All' ? statusFilter : undefined,
    search: searchQuery,
  });

  const { data: statsData, refetch: refetchStats } = useChatbotStatsQuery();

  const paginated = conversationsData?.data;
  const items: ChatSessionItem[] = Array.isArray(paginated?.items) ? paginated.items : [];
  const totalRecords = paginated?.totalRecords || items.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const stats = statsData?.data;

  const handleRefresh = async () => {
    await Promise.all([refetchConversations(), refetchStats()]);
  };

  const handleSelectSession = (item: ChatSessionItem) => {
    setSelectedSession(item);
    setIsModalVisible(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.primaryBg }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomSpacing + 80 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.brand}
          />
        }
      >
        {/* Top Header Row with Back Button */}
        <View
          style={[
            styles.headerRow,
            {
              borderBottomColor: theme.border,
              paddingTop: Platform.OS === 'android' ? Math.max(14, insets.top) : Math.max(10, insets.top),
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.navigate('/superadmin/dashboard');
            }}
            style={[styles.backBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={theme.textPrimary} />
          </TouchableOpacity>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Chatbot Conversations
            </Text>
            <Text numberOfLines={1} style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Visitor chats, AI logs & captured customer leads
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleRefresh}
            style={[
              styles.refreshButton,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <RefreshCw size={14} color={theme.textPrimary} />
            <Text style={[styles.refreshText, { color: theme.textPrimary }]}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* KPI Stats Cards */}
        <ChatbotStatsCards stats={stats} />

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <Search size={16} color={theme.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setPage(1);
              }}
              placeholder="Search phone, name or session..."
              placeholderTextColor={theme.textMuted}
              style={[styles.searchInput, { color: theme.textPrimary }]}
            />
            {Boolean(searchQuery) && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={15} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsContainer}
        >
          {STATUS_FILTERS.map((f) => {
            const isSelected = statusFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => {
                  setStatusFilter(f.key);
                  setPage(1);
                }}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(37, 99, 235, 0.2)'
                        : 'rgba(37, 99, 235, 0.12)'
                      : theme.cardBg,
                    borderColor: isSelected ? theme.brand : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? theme.brand : theme.textMuted,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Conversations List */}
        {(isLoading && !conversationsData) ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.brand} />
            <Text style={[styles.loadingMessage, { color: theme.textMuted }]}>
              Loading chatbot conversations...
            </Text>
          </View>
        ) : items.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <MessageSquare size={36} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              No Conversations Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {searchQuery
                ? 'Try adjusting your search query or filter.'
                : 'There are no website chatbot conversations in this category.'}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {items.map((item) => (
              <ConversationCard
                key={`session-${item.sessionId}`}
                item={item}
                onPress={handleSelectSession}
              />
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={[
                    styles.pageButton,
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: theme.border,
                      opacity: page <= 1 ? 0.4 : 1,
                    },
                  ]}
                >
                  <ChevronLeft size={16} color={theme.textPrimary} />
                  <Text style={[styles.pageButtonText, { color: theme.textPrimary }]}>Prev</Text>
                </TouchableOpacity>

                <Text style={[styles.pageInfoText, { color: theme.textSecondary }]}>
                  Page {page} of {totalPages} ({totalRecords} chats)
                </Text>

                <TouchableOpacity
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={[
                    styles.pageButton,
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: theme.border,
                      opacity: page >= totalPages ? 0.4 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.pageButtonText, { color: theme.textPrimary }]}>Next</Text>
                  <ChevronRight size={16} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Transcript & Details Modal */}
      <ChatTranscriptModal
        session={selectedSession}
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setSelectedSession(null);
        }}
      />

      {/* Bottom Nav */}
      <BottomNav active="more" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  filterPillsContainer: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11.5,
  },
  listContainer: {
    paddingTop: 2,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingMessage: {
    fontSize: 13,
  },
  emptyContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 30,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  pageButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pageInfoText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
});

