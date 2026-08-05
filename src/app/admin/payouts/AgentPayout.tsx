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
import { getAdminTheme } from '@/theme/adminTheme';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  DollarSign,
  TrendingUp,
  Users,
  Award,
  Calendar as CalendarIcon,
  RefreshCw,
  AlertCircle,
  FileText,
  CheckCircle,
  Clock,
  Briefcase,
  Eye,
  Check,
  X,
  Play,
  Download,
} from 'lucide-react-native';
import {
  payoutService,
  AgentPayoutItem,
  AgentPayoutSummary,
  AgentPayoutDetailsData,
  AgentPayslipData,
} from '../../../admin/services/payoutService';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AgentPayout() {
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
  const [error, setError] = useState<string | null>(null);

  const [payouts, setPayouts] = useState<AgentPayoutItem[]>([]);
  const [summary, setSummary] = useState<AgentPayoutSummary | null>(null);

  // Modals state
  const [selectedDetails, setSelectedDetails] = useState<AgentPayoutDetailsData | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [selectedPayslip, setSelectedPayslip] = useState<AgentPayslipData | null>(null);
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
        const response = await payoutService.getAgentPayouts({
          month,
          year,
          search: search.trim() || undefined,
        });

        if (response && response.success !== false) {
          setPayouts(response.data || []);
          setSummary(response.summary || null);
        } else {
          setError('Failed to fetch agent payouts');
        }
      } catch (err: any) {
        console.error('Error fetching agent payouts:', err);
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

  // Process Monthly Agent Payouts Action
  const handleProcessPayouts = async () => {
    Alert.alert(
      'Process Payouts',
      `Calculate and process monthly agent payouts for ${month} ${year}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Process Now',
          onPress: async () => {
            setProcessing(true);
            try {
              const res = await payoutService.processAgentPayouts({ month, year });
              if (res.success) {
                Alert.alert('Success', res.message || 'Payouts processed successfully');
                fetchPayouts();
              } else {
                Alert.alert('Process Failed', res.message || 'Unable to process payouts');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'An error occurred while processing payouts');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  // Mark Payout Status as Paid
  const handleUpdateStatus = async (item: AgentPayoutItem, newStatus: string) => {
    try {
      const res = await payoutService.updateAgentPayoutStatus({
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
  const handleOpenDetails = async (agentId: number) => {
    setDetailsLoading(true);
    setSelectedDetails(null);
    try {
      const data = await payoutService.getAgentPayoutDetails(agentId, { month, year });
      if (data) {
        setSelectedDetails(data);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to load agent payout details');
    } finally {
      setDetailsLoading(false);
    }
  };

  // Open Payslip Modal
  const handleOpenPayslip = async (agentId: number) => {
    setPayslipLoading(true);
    setSelectedPayslip(null);
    try {
      const data = await payoutService.getAgentPayslip({ agentId, month, year });
      if (data) {
        setSelectedPayslip(data);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to load agent payslip');
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
            Agent Payouts
          </Text>
          <Text style={[styles.headerSubtitle, { color: adminTheme.textSecondary }]}>
            Monthly Payroll & Commissions ({month} {year})
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

          {/* Card 2: Total Agents */}
          <View
            style={[
              styles.statCard,
              { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
            ]}
          >
            <View style={[styles.statIconBadge, { backgroundColor: '#6366f115' }]}>
              <Users size={16} color="#6366f1" />
            </View>
            <Text style={[styles.statValue, { color: adminTheme.textPrimary }]}>
              {summary?.totalAgents || 0}
            </Text>
            <Text style={[styles.statLabel, { color: adminTheme.textSecondary }]}>
              Agents
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

          {/* Card 4: Total Commission */}
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
              ₹{(summary?.totalCommission || 0).toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: adminTheme.textSecondary }]}>
              Commissions
            </Text>
          </View>
        </View>

        {/* Filter Bar & Process Payouts Trigger */}
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
              placeholder="Search agent by name..."
              placeholderTextColor={adminTheme.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Process Monthly Payouts Button */}
          <TouchableOpacity
            onPress={handleProcessPayouts}
            disabled={processing}
            style={[styles.processButton, { backgroundColor: adminTheme.brand }]}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Play size={16} color="#ffffff" />
                <Text style={styles.processButtonText}>Process Payouts for {month} {year}</Text>
              </>
            )}
          </TouchableOpacity>
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

        {/* Payouts Cards List */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={adminTheme.brand} />
            <Text style={[styles.loadingText, { color: adminTheme.textSecondary }]}>
              Loading agent payouts...
            </Text>
          </View>
        ) : payouts && payouts.length > 0 ? (
          <View style={styles.cardsList}>
            {payouts.map((item) => {
              const statusBadge = getStatusBadge(item.status);
              const finalAmount = item.finalPayout || item.amount || 0;

              return (
                <View
                  key={item.payoutId || item.agentId}
                  style={[
                    styles.payoutCard,
                    { backgroundColor: adminTheme.cardBg, borderColor: adminTheme.border },
                  ]}
                >
                  {/* Card Header Row */}
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {item.agentName ? item.agentName.charAt(0).toUpperCase() : 'A'}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.agentName, { color: adminTheme.textPrimary }]}>
                        {item.agentName}
                      </Text>
                      <Text style={[styles.agentType, { color: adminTheme.textSecondary }]}>
                        Type: {item.agentType} • {item.month} {item.year}
                      </Text>
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

                  {/* Financial Breakdown Grid */}
                  <View style={[styles.financeGrid, { backgroundColor: adminTheme.inputBg }]}>
                    <View style={styles.financeItem}>
                      <Text style={[styles.financeLabel, { color: adminTheme.textSecondary }]}>
                        Base Salary
                      </Text>
                      <Text style={[styles.financeValue, { color: adminTheme.textPrimary }]}>
                        ₹{(item.baseSalary || 0).toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.financeItem}>
                      <Text style={[styles.financeLabel, { color: adminTheme.textSecondary }]}>
                        Deductions
                      </Text>
                      <Text style={[styles.financeValue, { color: '#ef4444' }]}>
                        -₹{(item.attendanceDeduction || 0).toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.financeItem}>
                      <Text style={[styles.financeLabel, { color: adminTheme.textSecondary }]}>
                        Commission
                      </Text>
                      <Text style={[styles.financeValue, { color: '#10b981' }]}>
                        +₹{(item.commissionAmount || 0).toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.financeItem}>
                      <Text style={[styles.financeLabel, { color: adminTheme.textSecondary }]}>
                        Net Payout
                      </Text>
                      <Text style={[styles.heroPayoutValue, { color: adminTheme.brand }]}>
                        ₹{finalAmount.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* Attendance & Sales Row */}
                  <View style={styles.metricsRow}>
                    <View style={styles.metricPill}>
                      <Clock size={12} color={adminTheme.textSecondary} />
                      <Text style={[styles.metricText, { color: adminTheme.textSecondary }]}>
                        Present: {item.presentDays}/{item.workingDays} days
                      </Text>
                    </View>

                    <View style={styles.metricPill}>
                      <TrendingUp size={12} color={adminTheme.textSecondary} />
                      <Text style={[styles.metricText, { color: adminTheme.textSecondary }]}>
                        Sales: {item.totalSales}
                      </Text>
                    </View>
                  </View>

                  {/* Actions Row */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      onPress={() => handleOpenDetails(item.agentId)}
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
                      onPress={() => handleOpenPayslip(item.agentId)}
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
            <DollarSign size={36} color={adminTheme.textMuted} />
            <Text style={[styles.emptyTitle, { color: adminTheme.textPrimary }]}>
              No Agent Payouts Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: adminTheme.textSecondary }]}>
              No agent payout records match your selection. Click "Process Payouts" to compute.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 1. Agent Payout Details Modal */}
      <Modal visible={!!selectedDetails || detailsLoading} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setSelectedDetails(null)} />
          <View style={[styles.modalSheet, { backgroundColor: adminTheme.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: adminTheme.textPrimary }]}>
                Payout Breakdown - {selectedDetails?.payout?.agentName}
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
                {/* Summary Card */}
                <View style={[styles.modalCard, { backgroundColor: adminTheme.inputBg }]}>
                  <Text style={[styles.modalSectionTitle, { color: adminTheme.textPrimary }]}>
                    Salary Summary ({selectedDetails.payout.month} {selectedDetails.payout.year})
                  </Text>
                  <View style={styles.modalRow}>
                    <Text style={{ color: adminTheme.textSecondary }}>Base Salary:</Text>
                    <Text style={{ fontWeight: '700', color: adminTheme.textPrimary }}>
                      ₹{selectedDetails.payout.baseSalary?.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={{ color: adminTheme.textSecondary }}>Attendance Deduction:</Text>
                    <Text style={{ fontWeight: '700', color: '#ef4444' }}>
                      -₹{selectedDetails.payout.attendanceDeduction?.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={{ color: adminTheme.textSecondary }}>Commission Earned:</Text>
                    <Text style={{ fontWeight: '700', color: '#10b981' }}>
                      +₹{selectedDetails.payout.commissionAmount?.toLocaleString()}
                    </Text>
                  </View>
                  <View style={[styles.modalRow, { borderTopWidth: 1, borderTopColor: adminTheme.border, paddingTop: 6, marginTop: 4 }]}>
                    <Text style={{ fontWeight: '700', color: adminTheme.textPrimary }}>Final Payout:</Text>
                    <Text style={{ fontWeight: '800', fontSize: 16, color: adminTheme.brand }}>
                      ₹{selectedDetails.payout.finalPayout?.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Attendance Breakdown */}
                {selectedDetails.attendanceSummary && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: adminTheme.textPrimary }]}>
                      Attendance Records ({selectedDetails.attendanceSummary.presentEquivalentDays}/{selectedDetails.attendanceSummary.workingDays} Days)
                    </Text>
                    {selectedDetails.attendanceSummary.attendanceRecords?.map((rec, i) => (
                      <View key={i} style={[styles.modalRecordRow, { borderBottomColor: adminTheme.border }]}>
                        <Text style={{ color: adminTheme.textPrimary, fontSize: 12 }}>{rec.date}</Text>
                        <Text style={{ color: rec.status === 'Present' ? '#10b981' : '#ef4444', fontWeight: '700', fontSize: 12 }}>
                          {rec.status}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Commission Logs */}
                {selectedDetails.commissionLogs && selectedDetails.commissionLogs.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: adminTheme.textPrimary }]}>
                      Sales Commission Logs ({selectedDetails.commissionLogs.length})
                    </Text>
                    {selectedDetails.commissionLogs.map((log) => (
                      <View key={log.logId} style={[styles.modalRecordRow, { borderBottomColor: adminTheme.border }]}>
                        <View>
                          <Text style={{ color: adminTheme.textPrimary, fontWeight: '700', fontSize: 12 }}>
                            {log.propertyName} ({log.flatName})
                          </Text>
                          <Text style={{ color: adminTheme.textSecondary, fontSize: 10 }}>{log.saleDate}</Text>
                        </View>
                        <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 13 }}>
                          +₹{log.commissionAmount?.toLocaleString()}
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

      {/* 2. Agent Payslip View Modal */}
      <Modal visible={!!selectedPayslip || payslipLoading} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setSelectedPayslip(null)} />
          <View style={[styles.modalSheet, { backgroundColor: adminTheme.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: adminTheme.textPrimary }]}>
                Agent Payslip - {selectedPayslip?.agentName}
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
                  PAYSLIP FOR {selectedPayslip.month?.toUpperCase()} {selectedPayslip.year}
                </Text>
                <Text style={{ color: adminTheme.textSecondary, fontSize: 12, marginBottom: 10 }}>
                  Agent: {selectedPayslip.agentName} ({selectedPayslip.designation || 'Sales Executive'})
                </Text>

                {/* Earnings & Deductions Tables */}
                <View style={styles.payslipGrid}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tableHeading, { color: '#10b981' }]}>EARNINGS</Text>
                    <View style={styles.tableRow}>
                      <Text style={{ fontSize: 11, color: adminTheme.textSecondary }}>Basic Salary:</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: adminTheme.textPrimary }}>
                        ₹{selectedPayslip.earnings?.baseSalary?.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={{ fontSize: 11, color: adminTheme.textSecondary }}>Commission:</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: adminTheme.textPrimary }}>
                        ₹{selectedPayslip.earnings?.commissionEarned?.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tableHeading, { color: '#ef4444' }]}>DEDUCTIONS</Text>
                    <View style={styles.tableRow}>
                      <Text style={{ fontSize: 11, color: adminTheme.textSecondary }}>Attendance:</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#ef4444' }}>
                        ₹{selectedPayslip.deductions?.attendanceDeduction?.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Net Salary Row */}
                <View style={[styles.netSalaryBox, { backgroundColor: adminTheme.brand }]}>
                  <Text style={styles.netSalaryLabel}>NET SALARY PAYABLE:</Text>
                  <Text style={styles.netSalaryValue}>₹{selectedPayslip.netSalary?.toLocaleString()}</Text>
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
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  processButtonText: {
    color: '#ffffff',
    fontSize: 13,
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
  payoutCard: {
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
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  agentName: {
    fontSize: 15,
    fontWeight: '700',
  },
  agentType: {
    fontSize: 11,
    marginTop: 1,
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
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
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
  payslipGrid: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 6,
  },
  tableHeading: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  netSalaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
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
});
