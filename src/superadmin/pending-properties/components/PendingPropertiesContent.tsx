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
  Alert,
  Platform,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  X,
  RefreshCw,
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../../theme/adminTheme';
import {
  usePendingPropertiesQuery,
  usePendingPropertiesStatsQuery,
  useModeratePropertyMutation,
} from '../hooks/usePendingProperties';
import { PendingPropertyItem } from '../models/pendingProperty';
import { PendingPropertyStatsCards } from './PendingPropertyStatsCards';
import { PendingPropertyCard } from './PendingPropertyCard';
import { PendingPropertyDetailModal } from './PendingPropertyDetailModal';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';
import BottomNav from '../../components/BottomNav';

const PAGE_SIZE = 15;

const STATUS_FILTERS = [
  { key: 'PENDING_APPROVAL', label: 'Pending' },
  { key: 'ACTIVE', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'ALL', label: 'All' },
];

const CATEGORY_FILTERS = [
  { key: 'ALL', label: 'All Categories' },
  { key: 'Rent', label: 'For Rent' },
  { key: 'Sell', label: 'For Sale' },
];

export const PendingPropertiesContent: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const theme = getSuperAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();

  // State
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('PENDING_APPROVAL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<PendingPropertyItem | null>(null);
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

  // Queries & Mutations
  const {
    data: propertiesData,
    isLoading,
    refetch: refetchProperties,
    isRefetching,
  } = usePendingPropertiesQuery({
    page,
    pageSize: PAGE_SIZE,
    status: statusFilter,
    category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
    search: searchQuery,
  });

  const { data: statsData, refetch: refetchStats } = usePendingPropertiesStatsQuery();
  const moderateMutation = useModeratePropertyMutation();

  const paginated = propertiesData?.data;
  const items: PendingPropertyItem[] = Array.isArray(paginated?.items) ? paginated.items : [];
  const totalRecords = paginated?.totalRecords || items.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const stats = statsData?.data;

  const handleRefresh = async () => {
    await Promise.all([refetchProperties(), refetchStats()]);
  };

  const handleSelectProperty = (item: PendingPropertyItem) => {
    setSelectedProperty(item);
    setIsModalVisible(true);
  };

  const handleQuickApprove = (item: PendingPropertyItem) => {
    Alert.alert(
      'Approve Property',
      `Approve "${item.propertyName}"? It will become live on the public site immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              await moderateMutation.mutateAsync({
                id: item.propertyId,
                status: 'ACTIVE',
              });
              Alert.alert('Approved!', 'Property has been approved successfully.');
            } catch {
              Alert.alert('Error', 'Failed to approve property.');
            }
          },
        },
      ]
    );
  };

  const handleQuickReject = (item: PendingPropertyItem) => {
    Alert.prompt
      ? Alert.prompt(
          'Reject Property',
          'Enter reason for rejection (optional):',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Reject',
              style: 'destructive',
              onPress: async (reason?: string) => {
                try {
                  await moderateMutation.mutateAsync({
                    id: item.propertyId,
                    status: 'REJECTED',
                    rejectReason: reason || undefined,
                  });
                  Alert.alert('Rejected', 'Property submission was rejected.');
                } catch {
                  Alert.alert('Error', 'Failed to reject property.');
                }
              },
            },
          ],
          'plain-text'
        )
      : handleSelectProperty(item);
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
              Pending Properties
            </Text>
            <Text numberOfLines={1} style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Review & approve owner property submissions
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

        {/* Stats Cards */}
        <PendingPropertyStatsCards stats={stats} />

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
              placeholder="Search property, location, owner..."
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

        {/* Status Filters */}
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

        {/* Category Filters (Rent / Sell) */}
        <View style={styles.categoryRow}>
          {CATEGORY_FILTERS.map((cat) => {
            const isSelected = categoryFilter === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => {
                  setCategoryFilter(cat.key);
                  setPage(1);
                }}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.08)'
                      : 'transparent',
                    borderColor: isSelected ? theme.brand : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.catChipText,
                    {
                      color: isSelected ? theme.brand : theme.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Properties List */}
        {(isLoading && !propertiesData) ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.brand} />
            <Text style={[styles.loadingMessage, { color: theme.textMuted }]}>
              Loading properties...
            </Text>
          </View>
        ) : items.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Building2 size={36} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              No Properties Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {statusFilter === 'PENDING_APPROVAL'
                ? 'No pending properties currently waiting for moderation.'
                : 'No properties matching your selected criteria.'}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {items.map((item) => (
              <PendingPropertyCard
                key={`prop-${item.propertyId}`}
                item={item}
                onPress={handleSelectProperty}
                onApprove={handleQuickApprove}
                onReject={handleQuickReject}
                isActionLoading={moderateMutation.isPending}
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
                  Page {page} of {totalPages} ({totalRecords} properties)
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

      {/* Property Details Modal */}
      <PendingPropertyDetailModal
        property={selectedProperty}
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setSelectedProperty(null);
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
    marginBottom: 8,
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
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 10,
  },
  catChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 11,
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

