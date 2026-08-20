import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  DollarSign,
  TrendingUp,
  Building2,
  Award,
  Calendar as CalendarIcon,
  RefreshCw,
  AlertCircle,
  FileText,
  CheckCircle,
  Clock,
  Eye,
  Check,
  X,
  Play,
  RotateCcw,
  UserCheck,
  User,
} from 'lucide-react-native';
import {
  payoutService,
  PartnerPayoutItem,
  PartnerPayoutSummary,
  PartnerPayoutDetailsData,
  PartnerPayslipData,
} from '../../../admin/services/payoutService';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function PartnerPayout() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const currentDate = new Date();
  const [month, setMonth] = useState(MONTHS[currentDate.getMonth()]);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [payouts, setPayouts] = useState<PartnerPayoutItem[]>([]);
  const [summary, setSummary] = useState<PartnerPayoutSummary | null>(null);

  // Modals state
  const [selectedDetails, setSelectedDetails] = useState<PartnerPayoutDetailsData | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [selectedPayslip, setSelectedPayslip] = useState<PartnerPayslipData | null>(null);
  const [payslipLoading, setPayslipLoading] = useState(false);

  const fetchPayouts = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await payoutService.getPartnerPayouts({
          month,
          year,
          search: search.trim() || undefined,
        });

        if (response && response.success !== false) {
          setPayouts(response.data || []);
          setSummary(response.summary || null);
        } else {
          setError('Failed to fetch partner payouts');
        }
      } catch (err: any) {
        console.error('Error fetching partner payouts:', err);
        setError(err.message || 'Error connecting to payout service');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [month, year, search]
  );

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handlePrevMonth = () => {
    const idx = MONTHS.indexOf(month);
    if (idx === 0) {
      setMonth(MONTHS[11]);
      setYear((y) => y - 1);
    } else {
      setMonth(MONTHS[idx - 1]);
    }
  };

  const handleNextMonth = () => {
    const idx = MONTHS.indexOf(month);
    if (idx === 11) {
      setMonth(MONTHS[0]);
      setYear((y) => y + 1);
    } else {
      setMonth(MONTHS[idx + 1]);
    }
  };

  // Process Monthly Partner Payouts
  const handleProcessPayouts = async () => {
    Alert.alert(
      'Process Partner Payouts',
      `Calculate payouts for confirmed partner bookings in ${month} ${year}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Process',
          onPress: async () => {
            setProcessing(true);
            try {
              const res = await payoutService.processPartnerPayouts({ month, year });
              if (res.success) {
                Alert.alert('Success', res.message || 'Partner payouts processed successfully');
                fetchPayouts();
              } else {
                Alert.alert('Process Failed', res.message || 'Unable to process partner payouts');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Error processing partner payouts');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  // Recalculate Partner Payouts
  const handleRecalculatePayouts = async () => {
    Alert.alert(
      'Recalculate Payouts',
      `This will recalculate all partner commissions afresh for ${month} ${year}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Recalculate',
          style: 'destructive',
          onPress: async () => {
            setRecalculating(true);
            try {
              const res = await payoutService.recalculatePartnerPayouts({ month, year });
              if (res.success) {
                Alert.alert('Recalculated', res.message || 'Partner payouts recalculated successfully');
                fetchPayouts();
              } else {
                Alert.alert('Recalculate Failed', res.message || 'Unable to recalculate partner payouts');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Error recalculating partner payouts');
            } finally {
              setRecalculating(false);
            }
          },
        },
      ]
    );
  };

  // Update Status
  const handleUpdateStatus = async (item: PartnerPayoutItem, newStatus: string) => {
    try {
      const res = await payoutService.updatePartnerPayoutStatus({
        payoutId: item.payoutId,
        status: newStatus,
      });

      if (res.success) {
        Alert.alert('Status Updated', `Payout marked as ${newStatus}`);
        fetchPayouts();
      } else {
        Alert.alert('Update Failed', res.message || 'Unable to update status');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error updating status');
    }
  };

  // Open Details Modal
  const handleOpenDetails = async (partnerId: number) => {
    setDetailsLoading(true);
    setSelectedDetails(null);
    try {
      const data = await payoutService.getPartnerPayoutDetails(partnerId, { month, year });
      if (data) {
        setSelectedDetails(data);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to load partner payout details');
    } finally {
      setDetailsLoading(false);
    }
  };

  // Open Payslip Modal
  const handleOpenPayslip = async (partnerId: number) => {
    setPayslipLoading(true);
    setSelectedPayslip(null);
    try {
      const data = await payoutService.getPartnerPayslip({ partnerId, month, year });
      if (data) {
        setSelectedPayslip(data);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to load partner payslip');
    } finally {
      setPayslipLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'paid':
        return { bg: '#10b98115', text: '#10b981', border: '#10b98140' };
      case 'processed':
        return { bg: '#3b82f615', text: '#3b82f6', border: '#3b82f640' };
      case 'pending':
      default:
        return { bg: '#f59e0b15', text: '#f59e0b', border: '#f59e0b40' };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: adminTheme.primaryBg }]}>
      {/* Header Bar */}
      <View
        style={[
          styles.headerBar,
          { backgroundColor: adminTheme.cardBg, borderBottomColor: adminTheme.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: adminTheme.inputBg }]}
        >
          <ChevronLeft size={20} color={adminTheme.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: adminTheme.textPrimary }]}>
            Partner Payouts
          </Text>
          <Text style={[styles.headerSubtitle, { color: adminTheme.textSecondary }]}>
            Channel Partner Commissions ({month} {year})
          </Text>
        </View>

        {/* Month Selector */}
        <View style={[styles.monthSelector, { backgroundColor: adminTheme.inputBg }]}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.monthArrow}>
            <ChevronLeft size={16} color={adminTheme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.monthText, { color: adminTheme.textPrimary }]}>
            {month} {year.toString().substring(2)}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.monthArrow}>
            <ChevronRight size={16} color={adminTheme.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchPayouts(true)}
            tintColor={adminTheme.brand}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Card 1: Total Payouts */}
          <View
            style={[
              styles.statCard,
              { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
            ]}
          >
            <View style={[styles.statIconBadge, { backgroundColor: '#10b98115' }]}>
              <DollarSign size={16} color="#10b981" />
            </View>
            <Text style={[styles.statValue, { color: '#10b981' }]}>
              ₹{(summary?.totalPayouts || 0).toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: adminTheme.textSecondary }]}>
              Total Payouts
            </Text>
          </View>

          {/* Card 2: Total Partners */}
          <View
            style={[
              styles.statCard,
              { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
            ]}
          >
            <View style={[styles.statIconBadge, { backgroundColor: '#a855f715' }]}>
              <Building2 size={16} color="#a855f7" />
            </View>
            <Text style={[styles.statValue, { color: adminTheme.textPrimary }]}>
              {summary?.totalPartners || 0}
            </Text>
            <Text style={[styles.statLabel, { color: adminTheme.textSecondary }]}>
              Partners
            </Text>
          </View>

          {/* Card 3: Total Sales */}
          <View
            style={[
              styles.statCard,
              { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
            ]}
          >
            <View style={[styles.statIconBadge, { backgroundColor: '#3b82f615' }]}>
              <TrendingUp size={16} color="#3b82f6" />
            </View>
            <Text style={[styles.statValue, { color: adminTheme.textPrimary }]}>
              {summary?.totalSales || 0}
            </Text>
            <Text style={[styles.statLabel, { color: adminTheme.textSecondary }]}>
              Sales
            </Text>
          </View>

          {/* Card 4: Avg Commission */}
          <View
            style={[
              styles.statCard,
              { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
            ]}
          >
            <View style={[styles.statIconBadge, { backgroundColor: '#f59e0b15' }]}>
              <Award size={16} color="#f59e0b" />
            </View>
            <Text style={[styles.statValue, { color: adminTheme.textPrimary }]}>
              ₹{(summary?.averageCommission || 0).toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: adminTheme.textSecondary }]}>
              Avg Commission
            </Text>
          </View>
        </View>

        {/* Filter Bar & Action Buttons */}
        <View
          style={[
            styles.filterContainer,
            { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
          ]}
        >
          {/* Search Box */}
          <View style={[styles.searchBox, { backgroundColor: adminTheme.inputBg }]}>
            <Search size={16} color={adminTheme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: adminTheme.textPrimary }]}
              placeholder="Search company or contact person..."
              placeholderTextColor={adminTheme.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Action Row */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              onPress={handleProcessPayouts}
              disabled={processing}
              style={[styles.processButton, { backgroundColor: adminTheme.brand }]}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Play size={14} color="#ffffff" />
                  <Text style={styles.actionBtnText}>Process Payouts</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRecalculatePayouts}
              disabled={recalculating}
              style={[styles.recalculateButton, { backgroundColor: adminTheme.inputBg, borderColor: adminTheme.border }]}
            >
              {recalculating ? (
                <ActivityIndicator size="small" color={adminTheme.textPrimary} />
              ) : (
                <>
                  <RotateCcw size={14} color={adminTheme.textPrimary} />
                  <Text style={[styles.actionBtnText, { color: adminTheme.textPrimary }]}>Recalculate</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Error State */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: '#ef444415', borderColor: '#ef444440' }]}>
            <AlertCircle size={20} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchPayouts()} style={styles.retryButton}>
              <RefreshCw size={14} color="#ef4444" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Partner Payout Cards List */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={adminTheme.brand} />
            <Text style={[styles.loadingText, { color: adminTheme.textSecondary }]}>
              Loading partner payouts...
            </Text>
          </View>
        ) : payouts && payouts.length > 0 ? (
          <View style={styles.cardsList}>
            {payouts.map((item) => {
              const statusBadge = getStatusBadge(item.status);
              const totalAmount = item.totalCommission || item.amount || 0;

              return (
                <View
                  key={item.payoutId || item.partnerId}
                  style={[
                    styles.partnerCard,
                    { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
                  ]}
                >
                  {/* Card Header Row */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.avatarCircle, { backgroundColor: '#a855f7' }]}>
                      <Building2 size={20} color="#ffffff" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.companyName, { color: adminTheme.textPrimary }]}>
                        {item.companyName}
                      </Text>
                      <View style={styles.contactRow}>
                        <User size={12} color={adminTheme.textSecondary} />
                        <Text style={[styles.contactPerson, { color: adminTheme.textSecondary }]}>
                          {item.contactPerson} • {item.month} {item.year}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusBadge.bg, borderColor: statusBadge.border },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: statusBadge.text }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  {/* Financial Metrics Row */}
                  <View style={[styles.financeGrid, { backgroundColor: adminTheme.inputBg }]}>
                    <View style={styles.financeItem}>
                      <Text style={[styles.financeLabel, { color: adminTheme.textSecondary }]}>
                        Fixed Rate/Sale
                      </Text>
                      <Text style={[styles.financeValue, { color: adminTheme.textPrimary }]}>
                        ₹{(item.fixedCommissionPerSale || 0).toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.financeItem}>
                      <Text style={[styles.financeLabel, { color: adminTheme.textSecondary }]}>
                        Total Sales
                      </Text>
                      <Text style={[styles.financeValue, { color: adminTheme.textPrimary }]}>
                        {item.totalSales}
                      </Text>
                    </View>

                    <View style={styles.financeItem}>
                      <Text style={[styles.financeLabel, { color: adminTheme.textSecondary }]}>
                        Total Commission
                      </Text>
                      <Text style={[styles.heroPayoutValue, { color: '#10b981' }]}>
                        ₹{totalAmount.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* Lead Metrics Row */}
                  <View style={styles.metricsRow}>
                    <View style={styles.metricPill}>
                      <TrendingUp size={12} color={adminTheme.textSecondary} />
                      <Text style={[styles.metricText, { color: adminTheme.textSecondary }]}>
                        Leads: {item.convertedLeads || 0}/{item.totalLeads || 0}
                      </Text>
                    </View>
                  </View>

                  {/* Actions Row */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      onPress={() => handleOpenDetails(item.partnerId)}
                      style={[
                        styles.actionBtn,
                        { backgroundColor: adminTheme.inputBg, borderColor: adminTheme.border },
                      ]}
                    >
                      <Eye size={14} color={adminTheme.textPrimary} />
                      <Text style={[styles.actionBtnText, { color: adminTheme.textPrimary }]}>
                        Details
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleOpenPayslip(item.partnerId)}
                      style={[
                        styles.actionBtn,
                        { backgroundColor: adminTheme.inputBg, borderColor: adminTheme.border },
                      ]}
                    >
                      <FileText size={14} color={adminTheme.brand} />
                      <Text style={[styles.actionBtnText, { color: adminTheme.brand }]}>
                        Payslip
                      </Text>
                    </TouchableOpacity>

                    {item.status !== 'Paid' && (
                      <TouchableOpacity
                        onPress={() => handleUpdateStatus(item, 'Paid')}
                        style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
                      >
                        <CheckCircle size={14} color="#ffffff" />
                        <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>Mark Paid</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Building2 size={36} color={adminTheme.textMuted} />
            <Text style={[styles.emptyTitle, { color: adminTheme.textPrimary }]}>
              No Partner Payouts Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: adminTheme.textSecondary }]}>
              No partner payout records match your filter. Click "Process Payouts" to calculate.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 1. Partner Details Modal */}
      <Modal visible={!!selectedDetails || detailsLoading} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setSelectedDetails(null)} />
          <View style={[styles.modalSheet, { backgroundColor: adminTheme.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: adminTheme.textPrimary }]}>
                Partner Details - {selectedDetails?.payout?.companyName}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDetails(null)}>
                <X size={20} color={adminTheme.textPrimary} />
              </TouchableOpacity>
            </View>

            {detailsLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={adminTheme.brand} />
              </View>
            ) : selectedDetails ? (
              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                {/* Performance Summary Box */}
                <View style={[styles.modalCard, { backgroundColor: adminTheme.inputBg }]}>
                  <Text style={[styles.modalSectionTitle, { color: adminTheme.textPrimary }]}>
                    Commission Summary ({selectedDetails.payout.month} {selectedDetails.payout.year})
                  </Text>
                  <View style={styles.modalRow}>
                    <Text style={{ color: adminTheme.textSecondary }}>Fixed Commission / Sale:</Text>
                    <Text style={{ fontWeight: '700', color: adminTheme.textPrimary }}>
                      ₹{selectedDetails.payout.fixedCommissionPerSale?.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={{ color: adminTheme.textSecondary }}>Confirmed Sales:</Text>
                    <Text style={{ fontWeight: '700', color: adminTheme.textPrimary }}>
                      {selectedDetails.payout.totalSales}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={{ color: adminTheme.textSecondary }}>Conversion Rate:</Text>
                    <Text style={{ fontWeight: '700', color: adminTheme.brand }}>
                      {selectedDetails.performance?.conversionRatePercentage?.toFixed(1) ?? '0.0'}%
                    </Text>
                  </View>
                  <View style={[styles.modalRow, { borderTopWidth: 1, borderTopColor: adminTheme.border, paddingTop: 6, marginTop: 4 }]}>
                    <Text style={{ fontWeight: '700', color: adminTheme.textPrimary }}>Total Commission:</Text>
                    <Text style={{ fontWeight: '800', fontSize: 16, color: '#10b981' }}>
                      ₹{selectedDetails.payout.totalCommission?.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Booking Commission Logs */}
                {selectedDetails.commissionLogs && selectedDetails.commissionLogs.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: adminTheme.textPrimary }]}>
                      Confirmed Booking Logs ({selectedDetails.commissionLogs.length})
                    </Text>
                    {selectedDetails.commissionLogs.map((log) => (
                      <View key={log.logId} style={[styles.modalRecordRow, { borderBottomColor: adminTheme.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: adminTheme.textPrimary, fontWeight: '700', fontSize: 12 }}>
                            {log.customerName} - {log.propertyName} ({log.flatName})
                          </Text>
                          <Text style={{ color: adminTheme.textSecondary, fontSize: 10 }}>Date: {log.saleDate}</Text>
                        </View>
                        <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 13 }}>
                          +₹{log.fixedCommissionAmount?.toLocaleString()}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* 2. Partner Payslip Modal */}
      <Modal visible={!!selectedPayslip || payslipLoading} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setSelectedPayslip(null)} />
          <View style={[styles.modalSheet, { backgroundColor: adminTheme.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: adminTheme.textPrimary }]}>
                Partner Statement - {selectedPayslip?.companyName}
              </Text>
              <TouchableOpacity onPress={() => setSelectedPayslip(null)}>
                <X size={20} color={adminTheme.textPrimary} />
              </TouchableOpacity>
            </View>

            {payslipLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={adminTheme.brand} />
              </View>
            ) : selectedPayslip ? (
              <View style={[styles.payslipCard, { backgroundColor: adminTheme.inputBg, borderColor: adminTheme.border }]}>
                <Text style={[styles.payslipHeader, { color: adminTheme.textPrimary }]}>
                  COMMISSION STATEMENT ({selectedPayslip.month?.toUpperCase()} {selectedPayslip.year})
                </Text>
                <Text style={{ color: adminTheme.textSecondary, fontSize: 12, marginBottom: 10 }}>
                  Company: {selectedPayslip.companyName} | Contact: {selectedPayslip.contactPerson}
                </Text>

                <View style={styles.statementRow}>
                  <Text style={{ fontSize: 12, color: adminTheme.textSecondary }}>Confirmed Sales Count:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: adminTheme.textPrimary }}>
                    {selectedPayslip.totalSales}
                  </Text>
                </View>

                <View style={styles.statementRow}>
                  <Text style={{ fontSize: 12, color: adminTheme.textSecondary }}>Gross Commission Earned:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#10b981' }}>
                    ₹{selectedPayslip.commissionEarned?.toLocaleString()}
                  </Text>
                </View>

                <View style={[styles.netSalaryBox, { backgroundColor: '#a855f7' }]}>
                  <Text style={styles.netSalaryLabel}>NET PAYABLE AMOUNT:</Text>
                  <Text style={styles.netSalaryValue}>₹{selectedPayslip.netAmount?.toLocaleString()}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
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
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 4,
  },
  monthArrow: {
    padding: 4,
  },
  monthText: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  filterContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  processButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  recalculateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
  },
  cardsList: {
    gap: 12,
  },
  partnerCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyName: {
    fontSize: 15,
    fontWeight: '700',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  contactPerson: {
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  financeGrid: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-between',
  },
  financeItem: {
    alignItems: 'center',
  },
  financeLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  financeValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  heroPayoutValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 11,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalLoading: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  modalCard: {
    borderRadius: 14,
    padding: 12,
    gap: 6,
    marginBottom: 10,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalSection: {
    marginBottom: 10,
  },
  modalRecordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },

  // Payslip
  payslipCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  payslipHeader: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  netSalaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  netSalaryLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  netSalaryValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 11,
    textAlign: 'center',
  },
});
