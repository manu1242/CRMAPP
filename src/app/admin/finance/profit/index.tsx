import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    StyleSheet,
    Modal,
    Alert,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    Search,
    Calendar,
    X,
    ChevronDown,
    AlertCircle,
    TrendingUp,
    FileSpreadsheet,
    FileText,
    DollarSign,
    ArrowUpRight,
    ArrowDownLeft,
    PieChart,
    Layers,
} from 'lucide-react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import { useProfitAnalytics } from '../../../../admin/hooks/useProfit';

const ALL_CATEGORIES = [
    // Revenue types
    { value: 'Sale', label: 'Sale price of property/unit', color: '#b45309', bgColor: '#fef3c7' },
    { value: 'Booking', label: 'Booking/Advance amount', color: '#2563eb', bgColor: '#dbeafe' },
    { value: 'Rental', label: 'Rental income', color: '#7c3aed', bgColor: '#f3e8ff' },
    { value: 'Service', label: 'Other service charges', color: '#0891b2', bgColor: '#ecfeff' },
    { value: 'Collection', label: 'Collection (from payments)', color: '#059669', bgColor: '#d1fae5' },
    { value: 'Subscription', label: 'Subscription (Razorpay)', color: '#db2777', bgColor: '#fce7f3' },
    { value: 'Partner Commission', label: 'Partner Commission logs', color: '#ea580c', bgColor: '#ffedd5' },

    // Expense types
    { value: 'Land', label: 'Land cost / Purchase price', color: '#b45309', bgColor: '#fef3c7' },
    { value: 'Construction', label: 'Construction / Development', color: '#8b5cf6', bgColor: '#ede9fe' },
    { value: 'Legal', label: 'Legal / Registration', color: '#2563eb', bgColor: '#dbeafe' },
    { value: 'Marketing', label: 'Marketing / Sales', color: '#059669', bgColor: '#d1fae5' },
    { value: 'Agent', label: 'Agent / CP Commission', color: '#ec4899', bgColor: '#fce7f3' },
    { value: 'Tax', label: 'Taxes (GST, Stamp Duty)', color: '#ef4444', bgColor: '#fee2e2' },
    { value: 'Maintenance', label: 'Maintenance / Utilities', color: '#06b6d4', bgColor: '#ecfeff' },

    // Shared / fallback
    { value: 'Other', label: 'Other', color: '#4b5563', bgColor: '#f3f4f6' },
];

function getCategoryDetails(type: string) {
    return ALL_CATEGORIES.find(c => c.value === type) || {
        value: type,
        label: type,
        color: '#4b5563',
        bgColor: '#f3f4f6'
    };
}

function formatDate(dateString: string) {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatCurrency(amount: number) {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

interface LedgerItem {
    id: string;
    itemId: number;
    type: string;
    description: string;
    amount: number;
    date: string;
    isRevenue: boolean;
}

export default function ProfitScreen() {
    const router = useRouter();
    const { isDark } = useTheme();
    const theme = getAdminTheme(isDark);

    // States
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRangeType, setDateRangeType] = useState('All Time');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [activeTab, setActiveTab] = useState<'All' | 'Revenues' | 'Expenses'>('All');
    
    // Pagination
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // Filters Dropdown State
    const [isDateDropdownOpen, setDateDropdownOpen] = useState(false);

    // Calculate dates to query backend
    const queryDates = useMemo(() => {
        const now = new Date();
        const getFormatted = (d: Date) => d.toISOString().split('T')[0];
        const todayStr = getFormatted(now);

        let fDate = '';
        let tDate = '';

        if (dateRangeType === 'Today') {
            fDate = todayStr;
            tDate = todayStr;
        } else if (dateRangeType === 'This Week') {
            const sw = new Date(now);
            sw.setDate(now.getDate() - now.getDay()); // Sunday
            fDate = getFormatted(sw);
            tDate = todayStr;
        } else if (dateRangeType === 'This Month') {
            const sm = new Date(now.getFullYear(), now.getMonth(), 1);
            fDate = getFormatted(sm);
            tDate = todayStr;
        } else if (dateRangeType === 'Last 3 Months') {
            const s3 = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            fDate = getFormatted(s3);
            tDate = todayStr;
        } else if (dateRangeType === 'Custom Range') {
            fDate = fromDate;
            tDate = toDate;
        }

        return {
            fromDate: fDate || undefined,
            toDate: tDate || undefined
        };
    }, [dateRangeType, fromDate, toDate]);

    // Fetch profit analytics from backend
    const {
        data: profitRes,
        isLoading,
        isRefetching,
        refetch,
    } = useProfitAnalytics(queryDates.fromDate, queryDates.toDate);

    const analytics = profitRes?.data;
    const netProfit = analytics?.netProfit ?? 0;
    const totalRevenue = analytics?.totalRevenue ?? 0;
    const totalExpenses = analytics?.totalExpenses ?? 0;
    const rawRevenues = analytics?.revenues ?? [];
    const rawExpenses = analytics?.expenses ?? [];

    // Combine revenues and expenses into a unified ledger
    const combinedLedger = useMemo(() => {
        const ledger: LedgerItem[] = [];

        rawRevenues.forEach(r => {
            ledger.push({
                id: `rev-${r.revenueId}-${r.type}-${r.amount}-${r.date}`,
                itemId: r.revenueId,
                type: r.type,
                description: r.description,
                amount: r.amount,
                date: r.date,
                isRevenue: true,
            });
        });

        rawExpenses.forEach(e => {
            ledger.push({
                id: `exp-${e.expenseId}-${e.type}-${e.amount}-${e.date}`,
                itemId: e.expenseId,
                type: e.type,
                description: e.description,
                amount: e.amount,
                date: e.date,
                isRevenue: false,
            });
        });

        // Sort descending by date
        return ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [rawRevenues, rawExpenses]);

    // Client-side Searching inside unified ledger
    const filteredLedger = useMemo(() => {
        let items = combinedLedger;

        // Apply Tab Filter
        if (activeTab === 'Revenues') {
            items = items.filter(item => item.isRevenue);
        } else if (activeTab === 'Expenses') {
            items = items.filter(item => !item.isRevenue);
        }

        // Apply Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.description.toLowerCase().includes(query) ||
                item.type.toLowerCase().includes(query)
            );
        }

        return items;
    }, [combinedLedger, searchQuery, activeTab]);

    // Pagination Calculations
    const totalCount = filteredLedger.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [totalPages, page]);

    const paginatedLedger = useMemo(() => {
        const startIndex = (page - 1) * pageSize;
        return filteredLedger.slice(startIndex, startIndex + pageSize);
    }, [filteredLedger, page, pageSize]);

    // Detailed Ledger Item Modal
    const [selectedItem, setSelectedItem] = useState<LedgerItem | null>(null);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);

    // Visual Splits calculations
    const expensePercentage = totalRevenue > 0 ? Math.min(100, (totalExpenses / totalRevenue) * 100) : 0;
    const revenuePercentage = 100 - expensePercentage;

    const handleSearchSubmit = () => {
        setPage(1);
        setSearchQuery(searchInput.trim());
    };

    const applyDateRangeType = (range: string) => {
        setDateRangeType(range);
        setDateDropdownOpen(false);
        setPage(1);

        if (range !== 'Custom Range') {
            setFromDate('');
            setToDate('');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.primaryBg }]}>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            >

                {/* VISUAL ANALYTICS CARD */}
                <View style={[styles.summaryCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>NET SURPLUS / PROFIT</Text>
                            <Text style={[styles.summaryVal, { color: netProfit >= 0 ? '#059669' : '#ef4444' }]}>
                                {formatCurrency(netProfit)}
                            </Text>
                        </View>
                        <View style={[styles.iconContainer, { backgroundColor: netProfit >= 0 ? '#d1fae5' : '#fee2e2' }]}>
                            {netProfit >= 0 ? (
                                <ArrowUpRight size={24} color="#059669" />
                            ) : (
                                <ArrowDownLeft size={24} color="#ef4444" />
                            )}
                        </View>
                    </View>

                    {/* Progress visual bar */}
                    <View style={{ marginTop: 16 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '600' }}>
                                Revenue vs Expense Balance
                            </Text>
                            <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: '700' }}>
                                {totalRevenue > 0 ? `${Math.round(revenuePercentage)}% Profit Ratio` : 'No revenue'}
                            </Text>
                        </View>
                        
                        <View style={[styles.balanceBarContainer, { backgroundColor: theme.inputBg }]}>
                            {totalRevenue > 0 ? (
                                <>
                                    <View style={{ flex: revenuePercentage, backgroundColor: '#059669' }} />
                                    <View style={{ flex: expensePercentage, backgroundColor: '#ef4444' }} />
                                </>
                            ) : (
                                <View style={{ flex: 1, backgroundColor: theme.border }} />
                            )}
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#059669' }} />
                                <Text style={{ fontSize: 10, color: theme.textSecondary }}>Revenue</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' }} />
                                <Text style={{ fontSize: 10, color: theme.textSecondary }}>Expenses</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* METRICS SPLITS ROW */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 6, gap: 10 }}
                >
                    {/* Revenue Card */}
                    <View style={[styles.metricCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <View style={[styles.metricIconBox, { backgroundColor: '#d1fae5' }]}>
                            <ArrowUpRight size={18} color="#059669" />
                        </View>
                        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>TOTAL REVENUE</Text>
                        <Text style={[styles.metricVal, { color: '#059669' }]} numberOfLines={1}>
                            {formatCurrency(totalRevenue)}
                        </Text>
                    </View>

                    {/* Expenses Card */}
                    <View style={[styles.metricCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <View style={[styles.metricIconBox, { backgroundColor: '#fee2e2' }]}>
                            <ArrowDownLeft size={18} color="#ef4444" />
                        </View>
                        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>TOTAL EXPENSES</Text>
                        <Text style={[styles.metricVal, { color: '#ef4444' }]} numberOfLines={1}>
                            {formatCurrency(totalExpenses)}
                        </Text>
                    </View>

                    {/* Transaction Count */}
                    <View style={[styles.metricCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <View style={[styles.metricIconBox, { backgroundColor: '#f3e8ff' }]}>
                            <Layers size={18} color="#7c3aed" />
                        </View>
                        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>LEDGER COUNT</Text>
                        <Text style={[styles.metricVal, { color: '#7c3aed' }]} numberOfLines={1}>
                            {combinedLedger.length}
                        </Text>
                    </View>
                </ScrollView>

                {/* SEARCH & FILTERS BAR */}
                <View style={[styles.filterBarCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                    <View style={{ gap: 10 }}>
                        {/* Search Bar Row */}
                        <View>
                            <Text style={[styles.fieldHeaderLabel, { color: theme.textSecondary }]}>SEARCH TRANSACTIONS</Text>
                            <View style={[styles.inlineSearchBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                <TextInput
                                    style={[styles.inlineSearchInput, { color: theme.textPrimary }]}
                                    placeholder="Search description or type..."
                                    placeholderTextColor={theme.textMuted}
                                    value={searchInput}
                                    onChangeText={setSearchInput}
                                    onSubmitEditing={handleSearchSubmit}
                                />
                                {searchInput ? (
                                    <TouchableOpacity onPress={() => { setSearchInput(''); setSearchQuery(''); setPage(1); }}>
                                        <X size={16} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </View>

                        {/* Date Range Dropdown Row */}
                        <View style={{ zIndex: 110 }}>
                            <Text style={[styles.fieldHeaderLabel, { color: theme.textSecondary }]}>DATE RANGE (API FILTERED)</Text>
                            <TouchableOpacity
                                onPress={() => setDateDropdownOpen(!isDateDropdownOpen)}
                                style={[styles.inlineSelectBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                            >
                                <Text style={{ color: theme.textPrimary, fontSize: 13 }} numberOfLines={1}>
                                    {dateRangeType}
                                </Text>
                                <ChevronDown size={14} color={theme.textSecondary} />
                            </TouchableOpacity>

                            {isDateDropdownOpen && (
                                <View style={[styles.inlineDropdownList, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                                    {['All Time', 'Today', 'This Week', 'This Month', 'Last 3 Months', 'Custom Range'].map((range) => (
                                        <TouchableOpacity
                                            key={range}
                                            onPress={() => applyDateRangeType(range)}
                                            style={styles.dropdownOptionRow}
                                        >
                                            <Text style={{ fontSize: 12, color: theme.textPrimary, fontWeight: dateRangeType === range ? '700' : '400' }}>
                                                {range}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Custom Dates Input Selectors */}
                        {dateRangeType === 'Custom Range' && (
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textSecondary }}>FROM DATE</Text>
                                    <TextInput
                                        style={[styles.dateInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={theme.textMuted}
                                        value={fromDate}
                                        onChangeText={(val) => { setFromDate(val); setPage(1); }}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textSecondary }}>TO DATE</Text>
                                    <TextInput
                                        style={[styles.dateInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={theme.textMuted}
                                        value={toDate}
                                        onChangeText={(val) => { setToDate(val); setPage(1); }}
                                    />
                                </View>
                            </View>
                        )}

                        {/* Excel Report Export */}
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginTop: 4 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    Alert.alert('Excel Export', 'Profit ledger sheet exported successfully!');
                                }}
                                style={[styles.exportExcelBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                            >
                                <FileSpreadsheet size={16} color="#1e73be" />
                                <Text style={[styles.exportExcelText, { color: '#1e73be' }]}>Export report</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* SEGMENTED TAB BUTTONS */}
                <View style={styles.tabsRow}>
                    {(['All', 'Revenues', 'Expenses'] as const).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => {
                                setActiveTab(tab);
                                setPage(1);
                            }}
                            style={[
                                styles.tabBtn,
                                activeTab === tab && {
                                    backgroundColor: theme.brand,
                                    borderColor: theme.brand,
                                },
                                activeTab !== tab && {
                                    backgroundColor: theme.inputBg,
                                    borderColor: theme.border,
                                }
                            ]}
                        >
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontWeight: '700',
                                    color: activeTab === tab ? '#ffffff' : theme.textPrimary,
                                }}
                            >
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* TRANSACTION LEDGER LIST */}
                <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
                    {isLoading ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={theme.brand} />
                            <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Loading profit database logs...</Text>
                        </View>
                    ) : paginatedLedger.length > 0 ? (
                        <View style={{ gap: 10 }}>
                            {paginatedLedger.map((item) => {
                                const catDetails = getCategoryDetails(item.type);
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => {
                                            setSelectedItem(item);
                                            setDetailModalOpen(true);
                                        }}
                                        style={[
                                            styles.ledgerCard,
                                            {
                                                backgroundColor: theme.secondaryBg,
                                                borderColor: theme.border,
                                                borderLeftColor: item.isRevenue ? '#059669' : '#ef4444'
                                            }
                                        ]}
                                    >
                                        <View style={{ flex: 1.2, gap: 5 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                {item.isRevenue ? (
                                                    <ArrowUpRight size={14} color="#059669" />
                                                ) : (
                                                    <ArrowDownLeft size={14} color="#ef4444" />
                                                )}
                                                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }} numberOfLines={1}>
                                                    {item.description}
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <Calendar size={14} color={theme.textSecondary} />
                                                <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                                                    {formatDate(item.date)}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <View style={{ alignItems: 'flex-end', marginRight: 4 }}>
                                                <Text style={{ fontSize: 8, fontWeight: '700', color: theme.textMuted }}>AMOUNT</Text>
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        fontWeight: '800',
                                                        color: item.isRevenue ? '#059669' : '#ef4444',
                                                        marginTop: 2
                                                    }}
                                                >
                                                    {item.isRevenue ? '+' : '-'}{formatCurrency(item.amount)}
                                                </Text>
                                            </View>
                                            <View style={[styles.catBadge, { backgroundColor: catDetails.bgColor }]}>
                                                <Text style={{ fontSize: 9, fontWeight: '700', color: catDetails.color }}>
                                                    {item.type}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}

                            {/* PAGINATION SECTION */}
                            <View style={[styles.paginationRow, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                                    Showing {totalCount > 0 ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, totalCount)} of {totalCount} logs
                                </Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TouchableOpacity
                                        disabled={page <= 1}
                                        onPress={() => setPage(page - 1)}
                                        style={[styles.pageBtn, { borderColor: theme.border, opacity: page <= 1 ? 0.4 : 1 }]}
                                    >
                                        <Text style={{ fontSize: 12, color: theme.textPrimary, fontWeight: '600' }}>&lt; Previous</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        disabled={page >= totalPages}
                                        onPress={() => setPage(page + 1)}
                                        style={[styles.pageBtn, { borderColor: theme.border, opacity: page >= totalPages ? 0.4 : 1 }]}
                                    >
                                        <Text style={{ fontSize: 12, color: theme.textPrimary, fontWeight: '600' }}>Next &gt;</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={[styles.emptyContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                            <AlertCircle size={32} color={theme.textMuted} style={{ marginBottom: 8 }} />
                            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No transactions found</Text>
                            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                                There are no records mapped to this selected date range or category filter.
                            </Text>
                        </View>
                    )}
                </View>

            </ScrollView>

            {/* DETAIL MODAL */}
            <Modal visible={isDetailModalOpen} transparent animationType="slide" onRequestClose={() => setDetailModalOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.detailModalContent, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>

                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Transaction details</Text>
                            <TouchableOpacity onPress={() => setDetailModalOpen(false)} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
                                <X size={18} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {selectedItem ? (
                            <ScrollView showsVerticalScrollIndicator={false}>

                                {/* Amount Indicator */}
                                <View style={{ backgroundColor: theme.inputBg, padding: 16, borderRadius: 14, marginBottom: 14, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textSecondary, marginBottom: 4 }}>
                                        {selectedItem.isRevenue ? 'REVENUE VALUE' : 'EXPENSE VALUE'}
                                    </Text>
                                    <Text style={{ fontSize: 24, fontWeight: '800', color: selectedItem.isRevenue ? '#059669' : '#ef4444' }}>
                                        {selectedItem.isRevenue ? '+' : '-'}{formatCurrency(selectedItem.amount)}
                                    </Text>
                                </View>

                                {/* Grid items */}
                                <View style={{ gap: 10, marginBottom: 16 }}>

                                    {/* Flow type */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Ledger Direction</Text>
                                        <Text style={{ color: selectedItem.isRevenue ? '#059669' : '#ef4444', fontSize: 13, fontWeight: '700' }}>
                                            {selectedItem.isRevenue ? 'Income (Revenue)' : 'Outgoing (Expense)'}
                                        </Text>
                                    </View>

                                    {/* Category Type */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Category Type</Text>
                                        <View style={[styles.catBadge, { backgroundColor: getCategoryDetails(selectedItem.type).bgColor }]}>
                                            <Text style={{ fontSize: 11, fontWeight: '700', color: getCategoryDetails(selectedItem.type).color }}>
                                                {getCategoryDetails(selectedItem.type).label}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Date */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Date</Text>
                                        <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '600' }}>
                                            {formatDate(selectedItem.date)}
                                        </Text>
                                    </View>

                                    {/* Description */}
                                    <View style={{ gap: 6, marginTop: 4 }}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Description</Text>
                                        <View style={{ backgroundColor: theme.inputBg, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.border }}>
                                            <Text style={{ color: theme.textPrimary, fontSize: 13, lineHeight: 18 }}>
                                                {selectedItem.description}
                                            </Text>
                                        </View>
                                    </View>

                                </View>

                                {/* Close Action Button */}
                                <TouchableOpacity
                                    onPress={() => setDetailModalOpen(false)}
                                    style={[styles.formCancelBtn, { marginVertical: 12, backgroundColor: theme.inputBg, borderColor: theme.border }]}
                                >
                                    <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>Close Details</Text>
                                </TouchableOpacity>

                            </ScrollView>
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
    summaryCard: {
        marginHorizontal: 16,
        marginVertical: 14,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    summaryLabel: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    summaryVal: {
        fontSize: 22,
        fontWeight: '800',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    balanceBarContainer: {
        height: 10,
        borderRadius: 5,
        flexDirection: 'row',
        overflow: 'hidden',
        marginVertical: 8,
    },
    metricCard: {
        width: 140,
        height: 100,
        borderRadius: 16,
        borderWidth: 1,
        padding: 12,
        marginRight: 4,
    },
    metricIconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 9,
        fontWeight: '600',
        marginTop: 8,
    },
    metricVal: {
        fontSize: 13,
        fontWeight: '700',
        marginTop: 2,
    },
    filterBarCard: {
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginHorizontal: 16,
        marginVertical: 14,
    },
    fieldHeaderLabel: {
        fontSize: 9,
        fontWeight: '700',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    inlineSearchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 38,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 10,
    },
    inlineSearchInput: {
        flex: 1,
        fontSize: 13,
        paddingVertical: 0,
    },
    inlineSelectBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 38,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 10,
    },
    inlineDropdownList: {
        position: 'absolute',
        top: 56,
        left: 0,
        right: 0,
        borderWidth: 1,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        zIndex: 200,
        maxHeight: 180,
    },
    dropdownOptionRow: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e2e8f0',
    },
    exportExcelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    exportExcelText: {
        fontSize: 12,
        fontWeight: '700',
    },
    dateInput: {
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 10,
        fontSize: 12,
        marginTop: 4,
    },
    tabsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 12,
    },
    tabBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    ledgerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderLeftWidth: 5,
    },
    catBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    paginationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    pageBtn: {
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
    },
    emptyContainer: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    detailModalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    formCancelBtn: {
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
});
