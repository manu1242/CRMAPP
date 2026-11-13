import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    StyleSheet,
    Modal,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { exportToExcel, exportToCSV } from '../../../../Services/exportService';
import {
    ArrowLeft,
    Search,
    Calendar,
    X,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    FileSpreadsheet,
    FileText,
    ArrowUpRight,
    ArrowDownLeft,
    RotateCcw,
    Layers,
    PieChart,
    Wallet,
    Coins,
    Filter,
    Download,
    Check,
} from 'lucide-react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import { useBottomNavSpacing } from '../../../../hooks/useBottomNavSpacing';
import { useProfitAnalytics } from '../../../../admin/hooks/useProfit';

// Category color mappings matching web specifications
const CATEGORY_COLORS: Record<string, string> = {
    Salary: '#8b5cf6',
    Construction: '#3b82f6',
    Office: '#14b8a6',
    Legal: '#6366f1',
    'Legal & Registration': '#6366f1',
    Agent: '#f97316',
    'Agent Commission': '#f97316',
    Land: '#06b6d4',
    Marketing: '#f59e0b',
    Sale: '#14b8a6',
    Booking: '#3b82f6',
    Collection: '#1e3a8a',
    Rental: '#0284c7',
    Service: '#8b5cf6',
    Subscription: '#0891b2',
    'Partner Commission': '#ea580c',
    Maintenance: '#64748b',
    Tax: '#ef4444',
    Other: '#64748b',
};

const PRESET_OPTIONS = [
    'Last 90 days',
    'This month',
    'Last month',
    'This year',
    'All time',
];

const LEDGER_TYPES: ('All' | 'Revenues' | 'Expenses')[] = ['All', 'Revenues', 'Expenses'];

function getCategoryColor(type: string) {
    return CATEGORY_COLORS[type] || '#64748b';
}

function formatDate(dateString: string) {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatCurrency(amount: number) {
    return `₹${Math.round(amount || 0).toLocaleString('en-IN')}`;
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
    const { bottomSpacing } = useBottomNavSpacing();

    // Filter & Search States
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRangePreset, setDateRangePreset] = useState('Last 90 days');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [activeTab, setActiveTab] = useState<'All' | 'Revenues' | 'Expenses'>('All');

    // Pagination
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // Dropdowns
    const [isFilterDropdownOpen, setFilterDropdownOpen] = useState(false);
    const [isPresetDropdownOpen, setPresetDropdownOpen] = useState(false);
    const [isExportDropdownOpen, setExportDropdownOpen] = useState(false);

    // Detail Modal
    const [selectedItem, setSelectedItem] = useState<LedgerItem | null>(null);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);

    // Calculate dates matching web presets (Last 90 days default)
    useEffect(() => {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

        if (dateRangePreset === 'Last 90 days') {
            const start = new Date(now);
            start.setDate(now.getDate() - 90);
            setFromDate(toIso(start));
            setToDate(toIso(now));
        } else if (dateRangePreset === 'This month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            setFromDate(toIso(start));
            setToDate(toIso(now));
        } else if (dateRangePreset === 'Last month') {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            setFromDate(toIso(start));
            setToDate(toIso(end));
        } else if (dateRangePreset === 'This year') {
            const start = new Date(now.getFullYear(), 0, 1);
            setFromDate(toIso(start));
            setToDate(toIso(now));
        } else if (dateRangePreset === 'All time') {
            setFromDate('');
            setToDate('');
        }
    }, [dateRangePreset]);

    // Fetch profit analytics from backend API
    const {
        data: profitRes,
        isLoading,
        isRefetching,
        refetch,
    } = useProfitAnalytics(fromDate || undefined, toDate || undefined);

    const analytics = profitRes?.data;
    const netProfit = analytics?.netProfit ?? 0;
    const totalRevenue = analytics?.totalRevenue ?? 0;
    const totalExpenses = analytics?.totalExpenses ?? 0;
    const rawRevenues = analytics?.revenues ?? [];
    const rawExpenses = analytics?.expenses ?? [];

    // Profit margin & ratio calculations matching web
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';
    const expenseRatio = totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(1) : '0';

    // Top Expense Category
    const topExpenseInfo = useMemo(() => {
        const map: Record<string, number> = {};
        rawExpenses.forEach(e => {
            const cat = e.type || 'Other';
            map[cat] = (map[cat] || 0) + e.amount;
        });
        const sorted = Object.keys(map).map(k => ({ cat: k, total: map[k] })).sort((a, b) => b.total - a.total);
        if (sorted.length > 0) {
            return `${sorted[0].cat} (${formatCurrency(sorted[0].total)})`;
        }
        return 'None recorded';
    }, [rawExpenses]);

    // Top Revenue Source
    const topRevenueInfo = useMemo(() => {
        const map: Record<string, number> = {};
        rawRevenues.forEach(r => {
            const src = r.type || 'Other';
            map[src] = (map[src] || 0) + r.amount;
        });
        const sorted = Object.keys(map).map(k => ({ src: k, total: map[k] })).sort((a, b) => b.total - a.total);
        if (sorted.length > 0) {
            return `${sorted[0].src} (${formatCurrency(sorted[0].total)})`;
        }
        return 'None recorded';
    }, [rawRevenues]);

    // Monthly Comparison Data (for monthly revenue vs expense bars)
    const monthlyComparison = useMemo(() => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const map: Record<string, { month: string; revenue: number; expense: number }> = {};

        rawRevenues.forEach(r => {
            if (!r.date) return;
            const d = new Date(r.date);
            if (isNaN(d.getTime())) return;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!map[key]) {
                map[key] = { month: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`, revenue: 0, expense: 0 };
            }
            map[key].revenue += r.amount;
        });

        rawExpenses.forEach(e => {
            if (!e.date) return;
            const d = new Date(e.date);
            if (isNaN(d.getTime())) return;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!map[key]) {
                map[key] = { month: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`, revenue: 0, expense: 0 };
            }
            map[key].expense += e.amount;
        });

        const list = Object.keys(map).sort().map(k => map[k]);
        return list.slice(-6);
    }, [rawRevenues, rawExpenses]);

    // Unified Ledger combining revenues and expenses
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

        return ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [rawRevenues, rawExpenses]);

    // Filtered ledger based on search & tabs
    const filteredLedger = useMemo(() => {
        let items = combinedLedger;

        if (activeTab === 'Revenues') {
            items = items.filter(item => item.isRevenue);
        } else if (activeTab === 'Expenses') {
            items = items.filter(item => !item.isRevenue);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            items = items.filter(item =>
                (item.description || '').toLowerCase().includes(query) ||
                (item.type || '').toLowerCase().includes(query)
            );
        }

        return items;
    }, [combinedLedger, searchQuery, activeTab]);

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

    const handleSearchSubmit = () => {
        setPage(1);
        setSearchQuery(searchInput.trim());
    };

    const resetFilters = () => {
        setSearchInput('');
        setSearchQuery('');
        setDateRangePreset('Last 90 days');
        setActiveTab('All');
        setPage(1);
        setFilterDropdownOpen(false);
        setPresetDropdownOpen(false);
        setExportDropdownOpen(false);
        Toast.show({ type: 'info', text1: 'Filters Reset', text2: 'Reset to Last 90 days default.' });
    };

    const closeAllDropdowns = () => {
        setFilterDropdownOpen(false);
        setPresetDropdownOpen(false);
        setExportDropdownOpen(false);
    };

    const handleExportCSV = async () => {
        setExportDropdownOpen(false);
        if (filteredLedger.length === 0) {
            Toast.show({ type: 'info', text1: 'No Data', text2: 'No transactions to export.' });
            return;
        }
        await exportToCSV({
            data: filteredLedger,
            fileName: `Profit_Report_${new Date().toISOString().split('T')[0]}`,
            columns: [
                { header: 'ID', key: 'itemId' },
                { header: 'Type', key: 'isRevenue', formatter: (val) => (val ? 'Revenue' : 'Expense') },
                { header: 'Category', key: 'type' },
                { header: 'Description', key: 'description' },
                { header: 'Amount (INR)', key: 'amount', formatter: (val) => val ?? 0 },
                { header: 'Date', key: 'date', formatter: (val) => (val ? String(val).split('T')[0] : 'N/A') },
            ],
        });
    };

    const handleExportExcel = async () => {
        setExportDropdownOpen(false);
        if (filteredLedger.length === 0) {
            Toast.show({ type: 'info', text1: 'No Data', text2: 'No transactions to export.' });
            return;
        }
        await exportToExcel({
            data: filteredLedger,
            fileName: `Profit_Report_${new Date().toISOString().split('T')[0]}`,
            sheetName: 'ProfitReport',
            columns: [
                { header: 'ID', key: 'itemId' },
                { header: 'Type', key: 'isRevenue', formatter: (val) => (val ? 'Revenue' : 'Expense') },
                { header: 'Category', key: 'type' },
                { header: 'Description', key: 'description' },
                { header: 'Amount (INR)', key: 'amount', formatter: (val) => val ?? 0 },
                { header: 'Date', key: 'date', formatter: (val) => (val ? String(val).split('T')[0] : 'N/A') },
            ],
        });
    };

    // Max monthly amount for scale in bars
    const maxMonthlyVal = useMemo(() => {
        let max = 1;
        monthlyComparison.forEach(m => {
            if (m.revenue > max) max = m.revenue;
            if (m.expense > max) max = m.expense;
        });
        return max;
    }, [monthlyComparison]);

    const isAnyFilterActive =
        activeTab !== 'All' ||
        dateRangePreset !== 'Last 90 days' ||
        Boolean(searchQuery);

    return (
        <View style={[styles.container, { backgroundColor: theme.primaryBg }]}>

            {/* Screen Header Bar with Back Handler */}
            <View style={[styles.screenHeader, { backgroundColor: theme.primaryBg, borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel="Back"
                >
                    <ArrowLeft size={22} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.screenHeaderTitle, { color: theme.textPrimary }]}>Profit</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: bottomSpacing + 28 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={() => refetch()}
                        colors={[theme.brand]}
                        tintColor={theme.brand}
                    />
                }
            >

                {/* 1. HORIZONTAL OVERVIEW / METRIC CARDS (PROFIT OVERVIEW) */}
                <View style={styles.horizontalCardsWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalCardsScroll}
                    >
                        {/* Card 1: Net Profit */}
                        <View style={[
                            styles.hStatCard,
                            {
                                backgroundColor: theme.secondaryBg,
                                borderColor: netProfit >= 0 ? (isDark ? 'rgba(5, 150, 105, 0.3)' : '#bbf7d0') : (isDark ? 'rgba(225, 29, 72, 0.3)' : '#fecdd3'),
                            }
                        ]}>
                            <View style={styles.hStatCardTop}>
                                <View style={[
                                    styles.hStatIconWrap,
                                    { backgroundColor: netProfit >= 0 ? (isDark ? 'rgba(5, 150, 105, 0.18)' : '#ecfdf5') : (isDark ? 'rgba(225, 29, 72, 0.18)' : '#ffe4e6') }
                                ]}>
                                    {netProfit >= 0 ? (
                                        <TrendingUp size={13} color="#059669" />
                                    ) : (
                                        <TrendingDown size={13} color="#e11d48" />
                                    )}
                                </View>
                                <View style={[
                                    styles.hBadge,
                                    { backgroundColor: netProfit >= 0 ? (isDark ? 'rgba(5, 150, 105, 0.15)' : '#dcfce7') : (isDark ? 'rgba(225, 29, 72, 0.15)' : '#ffe4e6') }
                                ]}>
                                    <Text style={[styles.hBadgeText, { color: netProfit >= 0 ? '#059669' : '#e11d48' }]}>
                                        {netProfit >= 0 ? 'Profit' : 'Loss'}
                                    </Text>
                                </View>
                            </View>
                            <Text style={[styles.hStatValue, { color: netProfit >= 0 ? '#059669' : '#e11d48' }]} numberOfLines={1}>
                                {formatCurrency(netProfit)}
                            </Text>
                            <Text style={[styles.hStatLabel, { color: theme.textSecondary }]}>NET PROFIT</Text>
                        </View>

                        {/* Card 2: Total Revenue */}
                        <View style={[
                            styles.hStatCard,
                            {
                                backgroundColor: theme.secondaryBg,
                                borderColor: isDark ? 'rgba(5, 150, 105, 0.3)' : '#bbf7d0',
                            }
                        ]}>
                            <View style={styles.hStatCardTop}>
                                <View style={[styles.hStatIconWrap, { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.18)' : '#ecfdf5' }]}>
                                    <ArrowUpRight size={13} color="#059669" />
                                </View>
                                <View style={[styles.hBadge, { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.15)' : '#dcfce7' }]}>
                                    <Text style={[styles.hBadgeText, { color: '#059669' }]}>Inflows</Text>
                                </View>
                            </View>
                            <Text style={[styles.hStatValue, { color: '#059669' }]} numberOfLines={1}>
                                {formatCurrency(totalRevenue)}
                            </Text>
                            <Text style={[styles.hStatLabel, { color: theme.textSecondary }]}>TOTAL REVENUE</Text>
                        </View>

                        {/* Card 3: Total Expenses */}
                        <View style={[
                            styles.hStatCard,
                            {
                                backgroundColor: theme.secondaryBg,
                                borderColor: isDark ? 'rgba(225, 29, 72, 0.3)' : '#fecdd3',
                            }
                        ]}>
                            <View style={styles.hStatCardTop}>
                                <View style={[styles.hStatIconWrap, { backgroundColor: isDark ? 'rgba(225, 29, 72, 0.18)' : '#ffe4e6' }]}>
                                    <ArrowDownLeft size={13} color="#e11d48" />
                                </View>
                                <View style={[styles.hBadge, { backgroundColor: isDark ? 'rgba(225, 29, 72, 0.15)' : '#ffe4e6' }]}>
                                    <Text style={[styles.hBadgeText, { color: '#e11d48' }]}>Costs</Text>
                                </View>
                            </View>
                            <Text style={[styles.hStatValue, { color: '#e11d48' }]} numberOfLines={1}>
                                {formatCurrency(totalExpenses)}
                            </Text>
                            <Text style={[styles.hStatLabel, { color: theme.textSecondary }]}>TOTAL EXPENSES</Text>
                        </View>

                        {/* Card 4: Profit Margin */}
                        <View style={[
                            styles.hStatCard,
                            {
                                backgroundColor: theme.secondaryBg,
                                borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#c7d2fe',
                            }
                        ]}>
                            <View style={styles.hStatCardTop}>
                                <View style={[styles.hStatIconWrap, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.18)' : '#e0e7ff' }]}>
                                    <PieChart size={13} color="#6366f1" />
                                </View>
                                <View style={[styles.hBadge, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#e0e7ff' }]}>
                                    <Text style={[styles.hBadgeText, { color: '#6366f1' }]}>Ratio</Text>
                                </View>
                            </View>
                            <Text style={[styles.hStatValue, { color: '#6366f1' }]} numberOfLines={1}>
                                {profitMargin}%
                            </Text>
                            <Text style={[styles.hStatLabel, { color: theme.textSecondary }]}>PROFIT MARGIN</Text>
                        </View>

                        {/* Card 5: Expense Ratio */}
                        <View style={[
                            styles.hStatCard,
                            {
                                backgroundColor: theme.secondaryBg,
                                borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#fde68a',
                            }
                        ]}>
                            <View style={styles.hStatCardTop}>
                                <View style={[styles.hStatIconWrap, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : '#fef3c7' }]}>
                                    <Coins size={13} color="#f59e0b" />
                                </View>
                                <View style={[styles.hBadge, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7' }]}>
                                    <Text style={[styles.hBadgeText, { color: '#f59e0b' }]}>Cost</Text>
                                </View>
                            </View>
                            <Text style={[styles.hStatValue, { color: '#f59e0b' }]} numberOfLines={1}>
                                {expenseRatio}%
                            </Text>
                            <Text style={[styles.hStatLabel, { color: theme.textSecondary }]}>EXPENSE RATIO</Text>
                        </View>
                    </ScrollView>
                </View>

                {/* 2. SEARCH BAR ROW WITH REFRESH BUTTON */}
                <View style={styles.searchSection}>
                    <View style={styles.searchRow}>
                        <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                            <Search size={16} color={theme.textSecondary} />
                            <TextInput
                                style={[styles.searchInput, { color: theme.textPrimary }]}
                                placeholder="Search ledger entries, category..."
                                placeholderTextColor={theme.textMuted}
                                value={searchInput}
                                onChangeText={setSearchInput}
                                onSubmitEditing={handleSearchSubmit}
                                returnKeyType="search"
                            />
                            {searchInput ? (
                                <TouchableOpacity
                                    onPress={() => { setSearchInput(''); setSearchQuery(''); setPage(1); }}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <X size={16} color={theme.textSecondary} />
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {/* Quick Sync Button */}
                        <TouchableOpacity
                            onPress={() => refetch()}
                            style={[styles.addBtn, { backgroundColor: theme.brand }]}
                            accessibilityLabel="Refresh Data"
                            activeOpacity={0.85}
                        >
                            <RotateCcw size={18} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 3. FILTERS TOOLBAR ROW (FILTER ICON + CALENDAR ICON + EXPORT BUTTON) */}
                <View style={styles.filterSection}>
                    <View style={styles.filterBarRow}>
                        {/* Filter Button (Ledger Tab: All / Revenues / Expenses) */}
                        <TouchableOpacity
                            onPress={() => {
                                setFilterDropdownOpen(!isFilterDropdownOpen);
                                setPresetDropdownOpen(false);
                                setExportDropdownOpen(false);
                            }}
                            activeOpacity={0.8}
                            style={[
                                styles.toolbarBtn,
                                {
                                    backgroundColor: theme.secondaryBg,
                                    borderColor: activeTab !== 'All' ? theme.brand : theme.border,
                                },
                                activeTab !== 'All' && {
                                    backgroundColor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#eff6ff',
                                }
                            ]}
                        >
                            <Filter size={14} color={activeTab !== 'All' ? theme.brand : theme.textSecondary} />
                            <Text
                                style={[
                                    styles.toolbarBtnText,
                                    { color: activeTab !== 'All' ? theme.brand : theme.textPrimary }
                                ]}
                                numberOfLines={1}
                            >
                                {activeTab === 'All' ? 'Filters' : activeTab}
                            </Text>
                            {activeTab !== 'All' && (
                                <View style={[styles.activeIndicatorDot, { backgroundColor: theme.brand }]} />
                            )}
                            <ChevronDown size={13} color={activeTab !== 'All' ? theme.brand : theme.textSecondary} />
                        </TouchableOpacity>

                        {/* Calendar Button (Date Range Presets) */}
                        <TouchableOpacity
                            onPress={() => {
                                setPresetDropdownOpen(!isPresetDropdownOpen);
                                setFilterDropdownOpen(false);
                                setExportDropdownOpen(false);
                            }}
                            activeOpacity={0.8}
                            style={[
                                styles.toolbarBtn,
                                {
                                    backgroundColor: theme.secondaryBg,
                                    borderColor: dateRangePreset !== 'Last 90 days' ? '#059669' : theme.border,
                                },
                                dateRangePreset !== 'Last 90 days' && {
                                    backgroundColor: isDark ? 'rgba(5, 150, 105, 0.12)' : '#f0fdf4',
                                }
                            ]}
                        >
                            <Calendar size={14} color={dateRangePreset !== 'Last 90 days' ? '#059669' : theme.textSecondary} />
                            <Text
                                style={[
                                    styles.toolbarBtnText,
                                    { color: dateRangePreset !== 'Last 90 days' ? '#059669' : theme.textPrimary }
                                ]}
                                numberOfLines={1}
                            >
                                {dateRangePreset}
                            </Text>
                            <ChevronDown size={13} color={dateRangePreset !== 'Last 90 days' ? '#059669' : theme.textSecondary} />
                        </TouchableOpacity>

                        {/* Export Button (Excel / CSV) */}
                        <TouchableOpacity
                            onPress={() => {
                                setExportDropdownOpen(!isExportDropdownOpen);
                                setFilterDropdownOpen(false);
                                setPresetDropdownOpen(false);
                            }}
                            activeOpacity={0.8}
                            style={[
                                styles.toolbarBtn,
                                {
                                    backgroundColor: theme.secondaryBg,
                                    borderColor: theme.border,
                                }
                            ]}
                        >
                            <Download size={14} color={theme.textSecondary} />
                            <Text style={[styles.toolbarBtnText, { color: theme.textPrimary }]}>Export</Text>
                            <ChevronDown size={13} color={theme.textSecondary} />
                        </TouchableOpacity>

                        {/* Reset Button (Visible when filters are active) */}
                        {isAnyFilterActive && (
                            <TouchableOpacity
                                onPress={resetFilters}
                                activeOpacity={0.8}
                                style={[styles.resetPillBtn, { backgroundColor: theme.secondaryBg, borderColor: '#fca5a5' }]}
                                accessibilityLabel="Reset filters"
                            >
                                <RotateCcw size={13} color="#ef4444" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* SUB DROPDOWN 1: LEDGER TYPE SELECTOR */}
                    {isFilterDropdownOpen && (
                        <View style={[styles.subDropdownCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                            <View style={styles.subDropdownHeader}>
                                <Text style={[styles.subDropdownTitle, { color: theme.textPrimary }]}>Filter Ledger Entries</Text>
                                <TouchableOpacity onPress={() => setFilterDropdownOpen(false)}>
                                    <X size={15} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                                {LEDGER_TYPES.map(tab => {
                                    const isSelected = activeTab === tab;
                                    return (
                                        <TouchableOpacity
                                            key={tab}
                                            onPress={() => {
                                                setActiveTab(tab);
                                                setPage(1);
                                                setFilterDropdownOpen(false);
                                            }}
                                            style={[
                                                styles.subDropdownItem,
                                                isSelected && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }
                                            ]}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <View style={[styles.subDot, { backgroundColor: tab === 'Revenues' ? '#059669' : tab === 'Expenses' ? '#ef4444' : theme.brand }]} />
                                                <Text style={[styles.subDropdownText, { color: theme.textPrimary, fontWeight: isSelected ? '700' : '500' }]}>
                                                    {tab === 'All' ? 'All Transactions (Revenue & Expenses)' : tab}
                                                </Text>
                                            </View>
                                            {isSelected && <Check size={14} color={theme.brand} />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}

                    {/* SUB DROPDOWN 2: DATE RANGE SELECTOR */}
                    {isPresetDropdownOpen && (
                        <View style={[styles.subDropdownCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                            <View style={styles.subDropdownHeader}>
                                <Text style={[styles.subDropdownTitle, { color: theme.textPrimary }]}>Select Date Preset</Text>
                                <TouchableOpacity onPress={() => setPresetDropdownOpen(false)}>
                                    <X size={15} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                                {PRESET_OPTIONS.map(preset => {
                                    const isSelected = dateRangePreset === preset;
                                    return (
                                        <TouchableOpacity
                                            key={preset}
                                            onPress={() => {
                                                setDateRangePreset(preset);
                                                setPage(1);
                                                setPresetDropdownOpen(false);
                                            }}
                                            style={[
                                                styles.subDropdownItem,
                                                isSelected && { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.1)' : '#f0fdf4' }
                                            ]}
                                        >
                                            <Text style={[styles.subDropdownText, { color: isSelected ? '#059669' : theme.textPrimary, fontWeight: isSelected ? '700' : '500' }]}>
                                                {preset}
                                            </Text>
                                            {isSelected && <Check size={14} color="#059669" />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}

                    {/* SUB DROPDOWN 3: EXPORT BUTTON (EXCEL / CSV) */}
                    {isExportDropdownOpen && (
                        <View style={[styles.subDropdownCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                            <View style={styles.subDropdownHeader}>
                                <Text style={[styles.subDropdownTitle, { color: theme.textPrimary }]}>Export Profit Ledger</Text>
                                <TouchableOpacity onPress={() => setExportDropdownOpen(false)}>
                                    <X size={15} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                onPress={handleExportExcel}
                                activeOpacity={0.8}
                                style={[styles.exportOptionRow, { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.12)' : '#f0fdf4', borderColor: isDark ? 'rgba(5, 150, 105, 0.3)' : '#bbf7d0' }]}
                            >
                                <View style={[styles.exportOptionIcon, { backgroundColor: '#059669' }]}>
                                    <FileSpreadsheet size={15} color="#ffffff" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.exportOptionTitle, { color: '#059669' }]}>Excel (.xlsx)</Text>
                                    <Text style={[styles.exportOptionSub, { color: theme.textSecondary }]}>Complete profit & loss ledger report</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleExportCSV}
                                activeOpacity={0.8}
                                style={[styles.exportOptionRow, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc', borderColor: theme.border }]}
                            >
                                <View style={[styles.exportOptionIcon, { backgroundColor: '#475569' }]}>
                                    <FileText size={15} color="#ffffff" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.exportOptionTitle, { color: theme.textPrimary }]}>CSV (.csv)</Text>
                                    <Text style={[styles.exportOptionSub, { color: theme.textSecondary }]}>Standard comma-separated format</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* 4. MONTHLY REVENUE VS EXPENSES COMPARISON CHART */}
                {monthlyComparison.length > 0 && (
                    <View style={[styles.chartCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <View style={styles.chartHeader}>
                            <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Monthly Revenue vs Expenses</Text>
                            <View style={styles.chartLegend}>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendBox, { backgroundColor: '#059669' }]} />
                                    <Text style={[styles.legendLbl, { color: theme.textSecondary }]}>Revenue</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendBox, { backgroundColor: '#e11d48' }]} />
                                    <Text style={[styles.legendLbl, { color: theme.textSecondary }]}>Expenses</Text>
                                </View>
                            </View>
                        </View>

                        {/* Visual Monthly Bars */}
                        <View style={styles.barsContainer}>
                            {monthlyComparison.map(m => {
                                const revHeight = Math.max(8, Math.round((m.revenue / maxMonthlyVal) * 75));
                                const expHeight = Math.max(8, Math.round((m.expense / maxMonthlyVal) * 75));
                                const net = m.revenue - m.expense;

                                return (
                                    <View key={m.month} style={styles.barCol}>
                                        <View style={styles.barsGroup}>
                                            <View style={[styles.barItem, { height: revHeight, backgroundColor: '#059669' }]} />
                                            <View style={[styles.barItem, { height: expHeight, backgroundColor: '#e11d48' }]} />
                                        </View>
                                        <Text style={[styles.monthLabel, { color: theme.textSecondary }]}>{m.month}</Text>
                                        <Text style={[styles.netLabel, { color: net >= 0 ? '#059669' : '#dc2626' }]}>
                                            {net >= 0 ? '+' : ''}{Math.round(net / 1000)}k
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* 5. 2 MINI KPI CARDS: TOP REVENUE & TOP EXPENSE */}
                <View style={styles.kpiRow}>
                    <View style={[styles.kpiCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <Text style={[styles.kpiTitle, { color: theme.textSecondary }]}>TOP REVENUE SOURCE</Text>
                        <Text style={[styles.kpiVal, { color: '#059669' }]} numberOfLines={1}>
                            {topRevenueInfo}
                        </Text>
                    </View>
                    <View style={[styles.kpiCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <Text style={[styles.kpiTitle, { color: theme.textSecondary }]}>TOP EXPENSE CATEGORY</Text>
                        <Text style={[styles.kpiVal, { color: '#e11d48' }]} numberOfLines={1}>
                            {topExpenseInfo}
                        </Text>
                    </View>
                </View>

                {/* 6. TRANSACTIONS LEDGER SECTION */}
                <View style={styles.listSection}>
                    <View style={styles.listHeaderRow}>
                        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
                            TRANSACTIONS LEDGER ({totalCount})
                        </Text>
                        {isAnyFilterActive && (
                            <TouchableOpacity onPress={resetFilters}>
                                <Text style={[styles.clearFilterLink, { color: theme.brand }]}>Reset</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {isLoading ? (
                        <View style={styles.centerBox}>
                            <ActivityIndicator size="large" color={theme.brand} />
                            <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Loading profit ledger...</Text>
                        </View>
                    ) : filteredLedger.length === 0 ? (
                        <View style={[styles.emptyBox, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                            <Layers size={40} color={theme.textMuted} />
                            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Transactions Found</Text>
                            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                                No entries match your selected period or filters.
                            </Text>
                            <TouchableOpacity onPress={resetFilters} style={[styles.resetFiltersBtn, { backgroundColor: theme.brand }]}>
                                <Text style={styles.resetFiltersText}>Clear Filters</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        paginatedLedger.map(item => {
                            const catColor = getCategoryColor(item.type);
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    activeOpacity={0.85}
                                    onPress={() => {
                                        closeAllDropdowns();
                                        setSelectedItem(item);
                                        setDetailModalOpen(true);
                                    }}
                                    style={[
                                        styles.ledgerCard,
                                        {
                                            backgroundColor: theme.secondaryBg,
                                            borderColor: theme.border,
                                            borderLeftColor: item.isRevenue ? '#059669' : '#e11d48',
                                            borderLeftWidth: 4,
                                        }
                                    ]}
                                >
                                    {/* Top Row: Type badge, Date & Amount */}
                                    <View style={styles.cardTopRow}>
                                        <View style={styles.badgeAndDate}>
                                            <View style={[
                                                styles.typeBadge,
                                                { backgroundColor: item.isRevenue ? (isDark ? 'rgba(5, 150, 105, 0.15)' : '#ecfdf5') : (isDark ? 'rgba(225, 29, 72, 0.15)' : '#ffe4e6') }
                                            ]}>
                                                <View style={[styles.typeDot, { backgroundColor: item.isRevenue ? '#059669' : '#e11d48' }]} />
                                                <Text style={[styles.typeText, { color: item.isRevenue ? '#059669' : '#e11d48' }]}>
                                                    {item.isRevenue ? 'Revenue' : 'Expense'}
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <Calendar size={12} color={theme.textSecondary} />
                                                <Text style={[styles.cardDate, { color: theme.textSecondary }]}>{formatDate(item.date)}</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.cardAmount, { color: item.isRevenue ? '#059669' : '#e11d48' }]}>
                                            {item.isRevenue ? '+' : '-'}{formatCurrency(item.amount)}
                                        </Text>
                                    </View>

                                    {/* Middle: Description & Category Tag */}
                                    <View style={styles.cardDescBox}>
                                        <Text style={[styles.cardDescription, { color: theme.textPrimary }]}>{item.description}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                            <View style={[styles.categoryTag, { backgroundColor: `${catColor}15` }]}>
                                                <View style={[styles.typeDot, { backgroundColor: catColor }]} />
                                                <Text style={[styles.categoryTagText, { color: catColor }]}>{item.type}</Text>
                                            </View>
                                            <Text style={[styles.cardRef, { color: theme.textMuted }]}>
                                                Ref #{item.isRevenue ? 'REV' : 'EXP'}-{item.itemId}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <View style={[styles.paginationRow, { borderTopColor: theme.border }]}>
                            <TouchableOpacity
                                onPress={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                style={[
                                    styles.pageBtn,
                                    { borderColor: theme.border, backgroundColor: theme.secondaryBg },
                                    page <= 1 && { opacity: 0.4 }
                                ]}
                            >
                                <ChevronLeft size={16} color={theme.textPrimary} />
                                <Text style={[styles.pageBtnText, { color: theme.textPrimary }]}>Prev</Text>
                            </TouchableOpacity>

                            <Text style={[styles.pageIndicatorText, { color: theme.textSecondary }]}>
                                Page {page} of {totalPages}
                            </Text>

                            <TouchableOpacity
                                onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                style={[
                                    styles.pageBtn,
                                    { borderColor: theme.border, backgroundColor: theme.secondaryBg },
                                    page >= totalPages && { opacity: 0.4 }
                                ]}
                            >
                                <Text style={[styles.pageBtnText, { color: theme.textPrimary }]}>Next</Text>
                                <ChevronRight size={16} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

            </ScrollView>

            {/* DETAIL MODAL */}
            <Modal visible={isDetailModalOpen} transparent animationType="fade">
                <View style={styles.modalBackdrop}>
                    <View style={[styles.detailModalCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <View style={styles.detailModalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Wallet size={18} color={theme.brand} />
                                <Text style={[styles.detailModalTitle, { color: theme.textPrimary }]}>Transaction Details</Text>
                            </View>
                            <TouchableOpacity onPress={() => setDetailModalOpen(false)} style={styles.modalCloseCircle}>
                                <X size={16} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {selectedItem && (
                            <View style={styles.detailModalBody}>
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Type</Text>
                                    <Text style={[styles.detailVal, { color: selectedItem.isRevenue ? '#059669' : '#e11d48' }]}>
                                        {selectedItem.isRevenue ? 'Revenue' : 'Expense'}
                                    </Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Category</Text>
                                    <Text style={[styles.detailVal, { color: theme.textPrimary }]}>{selectedItem.type}</Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Description</Text>
                                    <Text style={[styles.detailVal, { color: theme.textPrimary, flex: 1, textAlign: 'right' }]}>
                                        {selectedItem.description}
                                    </Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Amount</Text>
                                    <Text style={[styles.detailVal, { color: selectedItem.isRevenue ? '#059669' : '#e11d48', fontWeight: '800', fontSize: 16 }]}>
                                        {selectedItem.isRevenue ? '+' : '-'}{formatCurrency(selectedItem.amount)}
                                    </Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Date</Text>
                                    <Text style={[styles.detailVal, { color: theme.textPrimary }]}>{formatDate(selectedItem.date)}</Text>
                                </View>
                            </View>
                        )}

                        <View style={[styles.detailModalFooter, { borderTopColor: theme.border }]}>
                            <TouchableOpacity
                                onPress={() => setDetailModalOpen(false)}
                                style={[styles.closeDetailBtn, { backgroundColor: theme.brand }]}
                            >
                                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Close</Text>
                            </TouchableOpacity>
                        </View>
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
    screenHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 4,
        marginRight: 10,
    },
    screenHeaderTitle: {
        fontSize: 18,
        fontWeight: '700',
    },

    // 1. HORIZONTAL CARDS STYLES
    horizontalCardsWrapper: {
        paddingTop: 8,
        paddingBottom: 4,
    },
    horizontalCardsScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    hStatCard: {
        width: 130,
        borderRadius: 10,
        borderWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 10,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
    },
    hStatCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    hStatIconWrap: {
        width: 24,
        height: 24,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hBadge: {
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 5,
    },
    hBadgeText: {
        fontSize: 9,
        fontWeight: '700',
    },
    hStatValue: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 1,
    },
    hStatLabel: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.2,
    },

    // 2. SEARCH BAR & REFRESH ICON
    searchSection: {
        paddingHorizontal: 16,
        marginTop: 6,
        marginBottom: 8,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    searchBox: {
        flex: 1,
        height: 42,
        borderRadius: 10,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        marginLeft: 8,
    },
    addBtn: {
        width: 42,
        height: 42,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },

    // 3. FILTERS TOOLBAR
    filterSection: {
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    filterBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    toolbarBtn: {
        flex: 1,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        gap: 5,
    },
    toolbarBtnText: {
        fontSize: 12,
        fontWeight: '600',
        maxWidth: 75,
    },
    activeIndicatorDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    resetPillBtn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // SUB DROPDOWN CARD
    subDropdownCard: {
        marginTop: 8,
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    subDropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    subDropdownTitle: {
        fontSize: 12,
        fontWeight: '700',
    },
    subDropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 9,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    subDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    subDropdownText: {
        fontSize: 12,
    },
    exportOptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 6,
        gap: 10,
    },
    exportOptionIcon: {
        width: 30,
        height: 30,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    exportOptionTitle: {
        fontSize: 12,
        fontWeight: '700',
    },
    exportOptionSub: {
        fontSize: 10,
        marginTop: 1,
    },

    // 4. CHART CARD
    chartCard: {
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    chartTitle: {
        fontSize: 12,
        fontWeight: '700',
    },
    chartLegend: {
        flexDirection: 'row',
        gap: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendBox: {
        width: 8,
        height: 8,
        borderRadius: 2,
    },
    legendLbl: {
        fontSize: 10,
        fontWeight: '600',
    },
    barsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 100,
        paddingTop: 8,
        paddingBottom: 4,
    },
    barCol: {
        alignItems: 'center',
        flex: 1,
    },
    barsGroup: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 3,
        marginBottom: 6,
    },
    barItem: {
        width: 10,
        borderRadius: 3,
    },
    monthLabel: {
        fontSize: 9,
        fontWeight: '600',
    },
    netLabel: {
        fontSize: 9,
        fontWeight: '700',
        marginTop: 1,
    },

    // 5. KPI ROW
    kpiRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 10,
    },
    kpiCard: {
        flex: 1,
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
    },
    kpiTitle: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.4,
        marginBottom: 3,
    },
    kpiVal: {
        fontSize: 12,
        fontWeight: '800',
    },

    // 6. LIST SECTION
    listSection: {
        paddingHorizontal: 16,
    },
    listHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionHeading: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    clearFilterLink: {
        fontSize: 11,
        fontWeight: '700',
    },
    ledgerCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        marginBottom: 8,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    badgeAndDate: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    typeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    typeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    cardDate: {
        fontSize: 11,
        fontWeight: '500',
    },
    cardAmount: {
        fontSize: 14,
        fontWeight: '800',
    },
    cardDescBox: {
        marginBottom: 2,
    },
    cardDescription: {
        fontSize: 13,
        fontWeight: '700',
    },
    categoryTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    categoryTagText: {
        fontSize: 10,
        fontWeight: '700',
    },
    cardRef: {
        fontSize: 10,
    },
    centerBox: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyBox: {
        padding: 30,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginTop: 8,
    },
    emptySubtitle: {
        fontSize: 12,
        marginTop: 2,
        textAlign: 'center',
    },
    resetFiltersBtn: {
        marginTop: 12,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 6,
    },
    resetFiltersText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
    },

    // PAGINATION
    paginationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        marginTop: 6,
        borderTopWidth: 1,
    },
    pageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        gap: 4,
    },
    pageBtnText: {
        fontSize: 12,
        fontWeight: '600',
    },
    pageIndicatorText: {
        fontSize: 12,
        fontWeight: '600',
    },

    // DETAILS MODAL
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 16,
    },
    detailModalCard: {
        borderRadius: 14,
        borderWidth: 1,
        overflow: 'hidden',
    },
    detailModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    detailModalTitle: {
        fontSize: 15,
        fontWeight: '800',
    },
    modalCloseCircle: {
        padding: 4,
    },
    detailModalBody: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    detailVal: {
        fontSize: 12,
        fontWeight: '700',
    },
    detailModalFooter: {
        padding: 12,
        borderTopWidth: 1,
    },
    closeDetailBtn: {
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
