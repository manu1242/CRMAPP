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
  useOwnerPlansQuery,
  useCreateOwnerPlanMutation,
  useUpdateOwnerPlanMutation,
  useToggleOwnerPlanStatusMutation,
  useDeleteOwnerPlanMutation,
} from '../hooks/useOwnerPlans';
import { OwnerPlan, CreateOwnerPlanRequest, UpdateOwnerPlanRequest } from '../models/ownerPlan';
import { OwnerPlanCard } from './OwnerPlanCard';
import { OwnerPlanFormModal } from './OwnerPlanFormModal';

export const OwnerPlansContent: React.FC = () => {
  const { isDark } = useTheme();

  // Queries & Mutations
  const { data, isLoading, isError, refetch, isRefetching } = useOwnerPlansQuery();
  const createMutation = useCreateOwnerPlanMutation();
  const updateMutation = useUpdateOwnerPlanMutation();
  const toggleMutation = useToggleOwnerPlanStatusMutation();
  const deleteMutation = useDeleteOwnerPlanMutation();

  // Local State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<OwnerPlan | null>(null);

  // Theme colors
  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#e2e8f0';
  const inputBg = isDark ? '#1e293b' : '#ffffff';

  const rawPlans: OwnerPlan[] = Array.isArray(data?.data) ? data.data : [];

  // Metrics
  const totalCount = rawPlans.length;
  const activeCount = rawPlans.filter((p) => p.isActive).length;
  const inactiveCount = totalCount - activeCount;

  // Filtered plans
  const filteredPlans = useMemo(() => {
    return rawPlans.filter((plan) => {
      // Status filter
      if (statusFilter === 'active' && !plan.isActive) return false;
      if (statusFilter === 'inactive' && plan.isActive) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = plan.planName?.toLowerCase().includes(q);
        const matchesDesc = plan.description?.toLowerCase().includes(q);
        const matchesPrice = String(plan.price).includes(q);
        return matchesName || matchesDesc || matchesPrice;
      }
      return true;
    });
  }, [rawPlans, statusFilter, searchQuery]);

  // Handlers
  const handleOpenCreateModal = () => {
    setSelectedPlan(null);
    setModalVisible(true);
  };

  const handleOpenEditModal = (plan: OwnerPlan) => {
    setSelectedPlan(plan);
    setModalVisible(true);
  };

  const handleFormSubmit = async (formData: CreateOwnerPlanRequest | UpdateOwnerPlanRequest) => {
    if (selectedPlan) {
      // Update
      await updateMutation.mutateAsync({
        id: selectedPlan.planId,
        data: formData as UpdateOwnerPlanRequest,
      });
      setModalVisible(false);
      setSelectedPlan(null);
    } else {
      // Create
      await createMutation.mutateAsync(formData as CreateOwnerPlanRequest);
      setModalVisible(false);
    }
  };

  const handleToggleStatus = (plan: OwnerPlan) => {
    toggleMutation.mutate(plan.planId);
  };

  const handleDeletePlan = (plan: OwnerPlan) => {
    Alert.alert(
      'Delete Owner Package',
      `Are you sure you want to permanently delete "${plan.planName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(plan.planId);
          },
        },
      ]
    );
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Top Title & Action Header */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: textColor }]}>Owner Packages</Text>
          <Text style={[styles.subtitle, { color: subTextColor }]}>
            Manage pricing, validity & lead unlock packages for property owners
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleOpenCreateModal}
          style={styles.createBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={18} color="#ffffff" />
          <Text style={styles.createBtnText}>New Package</Text>
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
        {/* Metrics Overview Cards */}
        <View style={styles.metricsGrid}>
          {/* Total */}
          <View
            style={[
              styles.metricCard,
              { backgroundColor: cardBg, borderColor: borderCol },
            ]}
          >
            <View style={styles.metricCardHeader}>
              <Text style={[styles.metricCardLabel, { color: subTextColor }]}>Total</Text>
              <View style={[styles.metricIconBox, { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff' }]}>
                <MaterialCommunityIcons name="package-variant" size={16} color="#3b82f6" />
              </View>
            </View>
            <Text style={[styles.metricCardValue, { color: textColor }]}>{totalCount}</Text>
            <Text style={[styles.metricCardSub, { color: subTextColor }]}>Configured packages</Text>
          </View>

          {/* Active */}
          <View
            style={[
              styles.metricCard,
              { backgroundColor: cardBg, borderColor: borderCol },
            ]}
          >
            <View style={styles.metricCardHeader}>
              <Text style={[styles.metricCardLabel, { color: subTextColor }]}>Active</Text>
              <View style={[styles.metricIconBox, { backgroundColor: isDark ? '#065f4630' : '#ecfdf5' }]}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#10b981" />
              </View>
            </View>
            <Text style={[styles.metricCardValue, { color: '#10b981' }]}>{activeCount}</Text>
            <Text style={[styles.metricCardSub, { color: subTextColor }]}>Live on marketplace</Text>
          </View>

          {/* Inactive */}
          <View
            style={[
              styles.metricCard,
              { backgroundColor: cardBg, borderColor: borderCol },
            ]}
          >
            <View style={styles.metricCardHeader}>
              <Text style={[styles.metricCardLabel, { color: subTextColor }]}>Inactive</Text>
              <View style={[styles.metricIconBox, { backgroundColor: isDark ? '#7f1d1d30' : '#fef2f2' }]}>
                <Ionicons name="pause-circle-outline" size={16} color="#ef4444" />
              </View>
            </View>
            <Text style={[styles.metricCardValue, { color: '#ef4444' }]}>{inactiveCount}</Text>
            <Text style={[styles.metricCardSub, { color: subTextColor }]}>Disabled / Drafts</Text>
          </View>
        </View>

        {/* Search Bar & Filter Tabs */}
        <View style={styles.filterSection}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: inputBg, borderColor: borderCol },
            ]}
          >
            <Ionicons name="search-outline" size={18} color={subTextColor} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search by package name, price, or description..."
              placeholderTextColor={subTextColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={subTextColor} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Status Filter Chips */}
          <View style={styles.filterTabs}>
            {(
              [
                { key: 'all', label: `All (${totalCount})` },
                { key: 'active', label: `Active (${activeCount})` },
                { key: 'inactive', label: `Inactive (${inactiveCount})` },
              ] as const
            ).map((tab) => {
              const active = statusFilter === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setStatusFilter(tab.key)}
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
                  <Text
                    style={[
                      styles.tabChipText,
                      { color: active ? '#ffffff' : textColor },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Plan List Area */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={[styles.loadingText, { color: subTextColor }]}>
              Loading owner packages...
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
            <Text style={styles.errorTitle}>Failed to load owner packages</Text>
            <Text style={[styles.errorDesc, { color: subTextColor }]}>
              An error occurred while communicating with the server.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Ionicons name="refresh" size={14} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredPlans.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: cardBg,
                borderColor: borderCol,
              },
            ]}
          >
            <FontAwesome5 name="box-open" size={44} color="#94a3b8" />
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              {searchQuery || statusFilter !== 'all'
                ? 'No matching packages found'
                : 'No Owner Packages Created Yet'}
            </Text>
            <Text style={[styles.emptyDesc, { color: subTextColor }]}>
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search terms or filter selection.'
                : 'Create pricing tiers for property owners to allow unlocking leads on the platform.'}
            </Text>
            {!searchQuery && statusFilter === 'all' && (
              <TouchableOpacity
                onPress={handleOpenCreateModal}
                style={styles.emptyActionBtn}
              >
                <Ionicons name="add" size={16} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.emptyActionBtnText}>Create First Package</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredPlans.map((plan) => (
            <OwnerPlanCard
              key={plan.planId}
              plan={plan}
              onEdit={handleOpenEditModal}
              onDelete={handleDeletePlan}
              onToggleStatus={handleToggleStatus}
              isToggling={toggleMutation.isPending}
            />
          ))
        )}
      </ScrollView>

      {/* Create / Edit Form Modal */}
      <OwnerPlanFormModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedPlan(null);
        }}
        onSubmit={handleFormSubmit}
        planToEdit={selectedPlan}
        isLoading={isSaving}
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
    paddingHorizontal: 12,
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
});
