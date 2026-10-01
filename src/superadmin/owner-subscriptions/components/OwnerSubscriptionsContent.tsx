import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  useOwnerSubscriptionsQuery,
  useAssignOwnerSubscriptionMutation,
  useToggleOwnerSubscriptionStatusMutation,
  useDeleteOwnerSubscriptionMutation,
} from '../hooks/useOwnerSubscriptions';
import {
  OwnerSubscriptionItem,
  AssignOwnerSubscriptionRequest,
} from '../models/ownerSubscription';
import { OwnerSubscriptionCard } from './OwnerSubscriptionCard';
import { AssignOwnerSubscriptionModal } from './AssignOwnerSubscriptionModal';

const PAGE_SIZE = 15;

export const OwnerSubscriptionsContent: React.FC = () => {
  const { isDark } = useTheme();

  // Local state for pagination and search
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [modalVisible, setModalVisible] = useState(false);

  // Queries & Mutations
  const { data, isLoading, isError, refetch, isRefetching } = useOwnerSubscriptionsQuery({
    page,
    pageSize: PAGE_SIZE,
    search: searchQuery,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const assignMutation = useAssignOwnerSubscriptionMutation();
  const toggleMutation = useToggleOwnerSubscriptionStatusMutation();
  const deleteMutation = useDeleteOwnerSubscriptionMutation();

  // Colors
  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#e2e8f0';
  const inputBg = isDark ? '#1e293b' : '#ffffff';

  const paginatedData = data?.data;
  const items: OwnerSubscriptionItem[] = Array.isArray(paginatedData?.items)
    ? paginatedData.items
    : [];
  const totalRecords = paginatedData?.totalRecords || items.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));

  // Compute local counts from current items or stats
  const activeCount = useMemo(() => {
    return items.filter(
      (item) =>
        item.isActive &&
        item.status?.toLowerCase() !== 'expired' &&
        (!item.expiryDate || new Date(item.expiryDate) >= new Date())
    ).length;
  }, [items]);

  const expiredCount = useMemo(() => {
    return items.filter(
      (item) =>
        item.status?.toLowerCase() === 'expired' ||
        (item.expiryDate && new Date(item.expiryDate) < new Date())
    ).length;
  }, [items]);

  // Handlers
  const handleAssignSubmit = async (formData: AssignOwnerSubscriptionRequest) => {
    await assignMutation.mutateAsync(formData);
    setModalVisible(false);
  };

  const handleToggleStatus = (item: OwnerSubscriptionItem) => {
    toggleMutation.mutate(item.subscriptionId);
  };

  const handleDelete = (item: OwnerSubscriptionItem) => {
    Alert.alert(
      'Delete Subscription',
      `Are you sure you want to delete the subscription for ${item.ownerPhone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(item.subscriptionId);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Top Header Row */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: textColor }]}>Owner Subscriptions</Text>
          <Text style={[styles.subtitle, { color: subTextColor }]}>
            Track active packages & manage public owner access
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.createBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={16} color="#ffffff" />
          <Text style={styles.createBtnText}>Assign</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      >
        {/* Metric Cards */}
        <View style={styles.metricsGrid}>
          {/* Total */}
          <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={styles.metricCardHeader}>
              <Text style={[styles.metricCardLabel, { color: subTextColor }]}>Total</Text>
              <View style={[styles.metricIconBox, { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff' }]}>
                <Ionicons name="people-outline" size={16} color="#3b82f6" />
              </View>
            </View>
            <Text style={[styles.metricCardValue, { color: textColor }]}>{totalRecords}</Text>
            <Text style={[styles.metricCardSub, { color: subTextColor }]}>Subscribed owners</Text>
          </View>

          {/* Active */}
          <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={styles.metricCardHeader}>
              <Text style={[styles.metricCardLabel, { color: subTextColor }]}>Active</Text>
              <View style={[styles.metricIconBox, { backgroundColor: isDark ? '#065f4630' : '#ecfdf5' }]}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
              </View>
            </View>
            <Text style={[styles.metricCardValue, { color: '#10b981' }]}>{activeCount}</Text>
            <Text style={[styles.metricCardSub, { color: subTextColor }]}>Currently live</Text>
          </View>

          {/* Expired */}
          <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={styles.metricCardHeader}>
              <Text style={[styles.metricCardLabel, { color: subTextColor }]}>Expired</Text>
              <View style={[styles.metricIconBox, { backgroundColor: isDark ? '#7f1d1d30' : '#fef2f2' }]}>
                <Ionicons name="time-outline" size={16} color="#ef4444" />
              </View>
            </View>
            <Text style={[styles.metricCardValue, { color: '#ef4444' }]}>{expiredCount}</Text>
            <Text style={[styles.metricCardSub, { color: subTextColor }]}>Needs renewal</Text>
          </View>
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.filterSection}>
          <View style={[styles.searchBox, { backgroundColor: inputBg, borderColor: borderCol }]}>
            <Ionicons name="search-outline" size={18} color={subTextColor} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search by owner phone or payment ID..."
              placeholderTextColor={subTextColor}
              value={searchQuery}
              onChangeText={(t) => {
                setSearchQuery(t);
                setPage(1);
              }}
              clearButtonMode="while-editing"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
              >
                <Ionicons name="close-circle" size={18} color={subTextColor} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Status Tabs */}
          <View style={styles.filterTabs}>
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'active', label: 'Active' },
                { key: 'expired', label: 'Expired' },
              ] as const
            ).map((tab) => {
              const active = statusFilter === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => {
                    setStatusFilter(tab.key);
                    setPage(1);
                  }}
                  style={[
                    styles.tabChip,
                    active
                      ? { backgroundColor: '#2563eb', borderColor: '#2563eb' }
                      : {
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          borderColor: borderCol,
                        },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabChipText, { color: active ? '#ffffff' : textColor }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Subscription List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={[styles.loadingText, { color: subTextColor }]}>
              Loading owner subscriptions...
            </Text>
          </View>
        ) : isError ? (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: isDark ? '#7f1d1d20' : '#fef2f2',
                borderColor: isDark ? '#7f1d1d' : '#fecaca',
              },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={36} color="#ef4444" />
            <Text style={styles.errorTitle}>Failed to load subscriptions</Text>
            <Text style={[styles.errorDesc, { color: subTextColor }]}>
              An error occurred while communicating with the server.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Ionicons name="refresh" size={14} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <FontAwesome5 name="id-card" size={44} color="#94a3b8" />
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              {searchQuery || statusFilter !== 'all'
                ? 'No matching subscriptions'
                : 'No Owner Subscriptions Found'}
            </Text>
            <Text style={[styles.emptyDesc, { color: subTextColor }]}>
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search terms or filter selection.'
                : 'Assign direct subscription packages to property owners or wait for incoming payments.'}
            </Text>
            {!searchQuery && statusFilter === 'all' && (
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={styles.emptyActionBtn}
              >
                <Ionicons name="person-add" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.emptyActionBtnText}>Assign Subscription</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {items.map((item) => (
              <OwnerSubscriptionCard
                key={item.subscriptionId}
                subscription={item}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
                isToggling={toggleMutation.isPending}
              />
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={[
                    styles.pageBtn,
                    {
                      backgroundColor: cardBg,
                      borderColor: borderCol,
                      opacity: page <= 1 ? 0.4 : 1,
                    },
                  ]}
                >
                  <Ionicons name="chevron-back" size={16} color={textColor} />
                  <Text style={[styles.pageBtnText, { color: textColor }]}>Previous</Text>
                </TouchableOpacity>

                <Text style={[styles.pageIndicator, { color: subTextColor }]}>
                  Page <Text style={{ fontWeight: '800', color: textColor }}>{page}</Text> of{' '}
                  <Text style={{ fontWeight: '800', color: textColor }}>{totalPages}</Text>
                </Text>

                <TouchableOpacity
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={[
                    styles.pageBtn,
                    {
                      backgroundColor: cardBg,
                      borderColor: borderCol,
                      opacity: page >= totalPages ? 0.4 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.pageBtnText, { color: textColor }]}>Next</Text>
                  <Ionicons name="chevron-forward" size={16} color={textColor} />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Assign Modal */}
      <AssignOwnerSubscriptionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleAssignSubmit}
        isLoading={assignMutation.isPending}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricCardValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  metricCardSub: {
    fontSize: 10,
    marginTop: 2,
  },
  filterSection: {
    marginBottom: 14,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: 42,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
    marginTop: 10,
  },
  errorDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pageIndicator: {
    fontSize: 12,
  },
});
