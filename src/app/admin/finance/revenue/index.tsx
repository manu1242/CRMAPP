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
    Alert,
    Platform,
    KeyboardAvoidingView,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Plus,
    Search,
    X,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Edit,
    FileSpreadsheet,
    FileText,
    Coins,
    RotateCcw,
    Layers,
    Calendar,
    ArrowUpRight,
    CheckCircle2,
    TrendingUp,
    CreditCard,
    Filter,
    Download,
    Check,
} from 'lucide-react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import { useBottomNavSpacing } from '../../../../hooks/useBottomNavSpacing';
import {
    useRevenues,
    useRecordRevenue,
    useUpdateRevenue,
    useDeleteRevenue,
} from '../../../../admin/hooks/useRevenue';
import { RevenueItem } from '../../../../admin/models/RevenueTypes';
import Toast from 'react-native-toast-message';
import { exportToExcel, exportToCSV } from '../../../../Services/exportService';

// Web matching revenue sources and calibrated mobile colors
const REVENUE_TYPES = [
    { value: 'Sale', label: 'Sale price of property/unit', color: '#166299', bgColor: '#e0f2fe' },
    { value: 'Booking', label: 'Booking / Advance amount', color: '#0284c7', bgColor: '#e0f2fe' },
    { value: 'Collection', label: 'Realized Collections (Payments)', color: '#059669', bgColor: '#d1fae5' },
    { value: 'Rental', label: 'Rental income', color: '#d4a45a', bgColor: '#fef3c7' },
    { value: 'Service', label: 'Other service charges', color: '#8b5cf6', bgColor: '#ede9fe' },
    { value: 'Subscription', label: 'Subscription (Razorpay)', color: '#0891b2', bgColor: '#ecfeff' },
    { value: 'Partner Commission', label: 'Partner Commission logs', color: '#ea580c', bgColor: '#ffedd5' },
    { value: 'Other', label: 'Other revenue', color: '#64748b', bgColor: '#f1f5f9' },
];

const MANUAL_REVENUE_TYPES = [
    { value: 'Sale', label: 'Sale price of property/unit' },
    { value: 'Booking', label: 'Booking / Advance amount' },
    { value: 'Rental', label: 'Rental income' },
    { value: 'Service', label: 'Other service charges' },
    { value: 'Other', label: 'Other' },
];

const DATE_RANGE_OPTIONS = [
    'All Time',
    'Today',
    'This Week',
    'This Month',
    'Last Month',
    'Last 90 Days',
    'This Year',
];

const SORT_OPTIONS: { key: 'newest' | 'oldest' | 'highest' | 'lowest'; label: string }[] = [
    { key: 'newest', label: 'Newest first' },
    { key: 'oldest', label: 'Oldest first' },
    { key: 'highest', label: 'Highest amount' },
    { key: 'lowest', label: 'Lowest amount' },
];

function getRevenueTypeDetails(type: string) {
    const match = REVENUE_TYPES.find(c =>
        c.value.toLowerCase() === (type || '').toLowerCase() ||
        c.label.toLowerCase().includes((type || '').toLowerCase())
    );
    return match || {
        value: type || 'Other',
        label: type || 'Other',
        color: '#64748b',
        bgColor: '#f1f5f9',
    };
}

function formatDate(dateString: string) {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

function formatCurrency(amount: number) {
    return `₹${Math.round(amount || 0).toLocaleString('en-IN')}`;
}

export default function RevenueScreen() {
    const router = useRouter();
    const { isDark } = useTheme();
    const theme = getAdminTheme(isDark);
    const { bottomSpacing } = useBottomNavSpacing();

    // Filter & Pagination States
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [dateRangeType, setDateRangeType] = useState('All Time');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [sortFilter, setSortFilter] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // Dropdown States
    const [isFilterDropdownOpen, setFilterDropdownOpen] = useState(false);
    const [isDateDropdownOpen, setDateDropdownOpen] = useState(false);
    const [isExportDropdownOpen, setExportDropdownOpen] = useState(false);

    // Detail Modal State
    const [detailItem, setDetailItem] = useState<RevenueItem | null>(null);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);

    // Dynamic date bounds
    useEffect(() => {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

        if (dateRangeType === 'All Time') {
            setFromDate('');
            setToDate('');
        } else if (dateRangeType === 'Today') {
            setFromDate(toIso(now));
            setToDate(toIso(now));
        } else if (dateRangeType === 'This Week') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            setFromDate(toIso(startOfWeek));
            setToDate(toIso(now));
        } else if (dateRangeType === 'This Month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            setFromDate(toIso(startOfMonth));
            setToDate(toIso(now));
        } else if (dateRangeType === 'Last Month') {
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            setFromDate(toIso(startOfLastMonth));
            setToDate(toIso(endOfLastMonth));
        } else if (dateRangeType === 'Last 90 Days') {
            const start90 = new Date(now);
            start90.setDate(now.getDate() - 90);
            setFromDate(toIso(start90));
            setToDate(toIso(now));
        } else if (dateRangeType === 'This Year') {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            setFromDate(toIso(startOfYear));
            setToDate(toIso(now));
        }
    }, [dateRangeType]);

    // Fetch revenues via API
    const {
        data: revenuesRes,
        isLoading,
        isRefetching,
        refetch: refetchList,
    } = useRevenues(
        page,
        pageSize,
        selectedCategory === 'All' ? undefined : selectedCategory,
        searchQuery || undefined,
        fromDate || undefined,
        toDate || undefined,
        sortFilter
    );

    const revenueItems = revenuesRes?.data?.items ?? [];
    const summary = revenuesRes?.data?.summary;
    const totalPages = revenuesRes?.data?.totalPages ?? 1;
    const totalCount = revenuesRes?.data?.totalCount ?? 0;

    // Calculate Mobile Metric Totals
    const statsTotalEntries = summary?.totalEntries ?? totalCount;
    const statsTotalRevenue = summary?.totalRevenue ?? 0;
    const statsSalesBookings = summary?.salesAndBookings ?? 0;
    const statsCollections = summary?.collections ?? 0;

    // Revenue by source grouping (for multi-segment progress bar & legend)
    const sourceBreakdown = useMemo(() => {
        const groups: Record<string, { amount: number; count: number }> = {};
        revenueItems.forEach(item => {
            const type = item.type || 'Other';
            if (!groups[type]) {
                groups[type] = { amount: 0, count: 0 };
            }
            groups[type].amount += item.amount;
            groups[type].count += 1;
        });

        const list = Object.keys(groups).map(type => {
            const details = getRevenueTypeDetails(type);
            const amount = groups[type].amount;
            const count = groups[type].count;
            const pct = statsTotalRevenue > 0 ? Math.round((amount / statsTotalRevenue) * 100) : 0;
            return {
                type,
                label: details.label,
                color: details.color,
                amount,
                count,
                pct,
            };
        });
        return list.sort((a, b) => b.amount - a.amount);
    }, [revenueItems, statsTotalRevenue]);

    // Form Modal State (Add / Edit)
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
    const [selectedRevenue, setSelectedRevenue] = useState<RevenueItem | null>(null);
    const [formCategory, setFormCategory] = useState('Sale');
    const [formAmount, setFormAmount] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [isCategoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

    // Mutations
    const recordRevenueMutation = useRecordRevenue();
    const updateRevenueMutation = useUpdateRevenue();
    const deleteRevenueMutation = useDeleteRevenue();

    const handleSearchSubmit = () => {
        setPage(1);
        setSearchQuery(searchInput.trim());
    };

    const resetFilters = () => {
        setSearchInput('');
        setSearchQuery('');
        setSelectedCategory('All');
        setDateRangeType('All Time');
        setSortFilter('newest');
        setPage(1);
        setFilterDropdownOpen(false);
        setDateDropdownOpen(false);
        setExportDropdownOpen(false);
        Toast.show({ type: 'info', text1: 'Filters Reset', text2: 'Filters have been restored to defaults.' });
    };

    const closeAllDropdowns = () => {
        setFilterDropdownOpen(false);
        setDateDropdownOpen(false);
        setExportDropdownOpen(false);
    };

    const handleExportCSV = async () => {
        setExportDropdownOpen(false);
        if (revenueItems.length === 0) {
            Toast.show({ type: 'info', text1: 'No Data', text2: 'No revenue records to export.' });
            return;
        }
        await exportToCSV({
            data: revenueItems,
            fileName: `Revenue_Report_${new Date().toISOString().split('T')[0]}`,
            columns: [
                { header: 'Revenue ID', key: 'revenueId' },
                { header: 'Type', key: 'type' },
                { header: 'Description', key: 'description' },
                { header: 'Amount (INR)', key: 'amount', formatter: (val) => val ?? 0 },
                { header: 'Date', key: 'date', formatter: (val) => (val ? String(val).split('T')[0] : 'N/A') },
                { header: 'Entry Type', key: 'isSystem', formatter: (val) => (val ? 'Auto-realized' : 'Manual') },
            ],
        });
    };

    const handleExportExcel = async () => {
        setExportDropdownOpen(false);
        if (revenueItems.length === 0) {
            Toast.show({ type: 'info', text1: 'No Data', text2: 'No revenue records to export.' });
            return;
        }
        await exportToExcel({
            data: revenueItems,
            fileName: `Revenue_Report_${new Date().toISOString().split('T')[0]}`,
            sheetName: 'Revenue',
            columns: [
                { header: 'Revenue ID', key: 'revenueId' },
                { header: 'Type', key: 'type' },
                { header: 'Description', key: 'description' },
                { header: 'Amount (INR)', key: 'amount', formatter: (val) => val ?? 0 },
                { header: 'Date', key: 'date', formatter: (val) => (val ? String(val).split('T')[0] : 'N/A') },
                { header: 'Entry Type', key: 'isSystem', formatter: (val) => (val ? 'Auto-realized' : 'Manual') },
            ],
        });
    };

    const handleSaveRevenue = () => {
        const amt = parseFloat(formAmount);
        if (isNaN(amt) || amt <= 0) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter a valid positive amount.' });
            return;
        }
        if (!formDescription.trim()) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter a description.' });
            return;
        }

        const payload = {
            type: formCategory,
            description: formDescription.trim(),
            amount: amt,
            date: `${formDate}T12:00:00`,
        };

        if (formMode === 'add') {
            recordRevenueMutation.mutate(payload, {
                onSuccess: (res) => {
                    Toast.show({ type: 'success', text1: 'Success', text2: res.message || 'Revenue recorded successfully!' });
                    setFormModalOpen(false);
                    resetForm();
                    refetchList();
                },
                onError: (err: any) => {
                    const msg = err.response?.data?.message || err.message || 'Failed to record revenue.';
                    Toast.show({ type: 'error', text1: 'Error', text2: msg });
                },
            });
        } else {
            if (!selectedRevenue) return;
            updateRevenueMutation.mutate(
                { revenueId: selectedRevenue.revenueId, ...payload },
                {
                    onSuccess: (res) => {
                        Toast.show({ type: 'success', text1: 'Success', text2: res.message || 'Revenue updated successfully!' });
                        setFormModalOpen(false);
                        resetForm();
                        refetchList();
                    },
                    onError: (err: any) => {
                        const msg = err.response?.data?.message || err.message || 'Failed to update revenue.';
                        Toast.show({ type: 'error', text1: 'Error', text2: msg });
                    },
                }
            );
        }
    };

    const handleDeleteRevenue = (id: number) => {
        Alert.alert(
            'Delete Revenue',
            'Are you sure you want to delete this revenue entry? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteRevenueMutation.mutate(id, {
                            onSuccess: () => {
                                Toast.show({ type: 'success', text1: 'Deleted', text2: 'Revenue entry deleted successfully.' });
                                refetchList();
                            },
                            onError: (err: any) => {
                                const msg = err.response?.data?.message || err.message || 'Failed to delete revenue.';
                                Toast.show({ type: 'error', text1: 'Error', text2: msg });
                            },
                        });
                    },
                },
            ]
        );
    };

    const openAddForm = () => {
        setFormMode('add');
        setSelectedRevenue(null);
        setFormCategory('Sale');
        setFormAmount('');
        setFormDescription('');
        setFormDate(new Date().toISOString().split('T')[0]);
        setFormModalOpen(true);
    };

    const openEditForm = (item: RevenueItem) => {
        if (item.isSystem || item.revenueId <= 0) {
            Toast.show({ type: 'info', text1: 'System Entry', text2: 'Auto-realized collections and transactions cannot be edited directly.' });
            return;
        }
        setSelectedRevenue(item);
        setFormMode('edit');
        setFormCategory(item.type || 'Sale');
        setFormAmount(item.amount.toString());
        setFormDescription(item.description || '');
        setFormDate(item.date ? item.date.split('T')[0] : new Date().toISOString().split('T')[0]);
        setFormModalOpen(true);
    };

    const resetForm = () => {
        setSelectedRevenue(null);
        setFormAmount('');
        setFormDescription('');
        setCategoryDropdownOpen(false);
    };

    const isAnyFilterActive =
        selectedCategory !== 'All' ||
        dateRangeType !== 'All Time' ||
        Boolean(searchQuery) ||
        sortFilter !== 'newest';

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
                <Text style={[styles.screenHeaderTitle, { color: theme.textPrimary }]}>Revenue</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: bottomSpacing + 28 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={() => refetchList()}
                        colors={[theme.brand]}
                        tintColor={theme.brand}
                    />
                }
            >

                {/* 1. HORIZONTAL OVERVIEW / METRIC CARDS (EXPENSES & REVENUE OVERVIEW) */}
                <View style={styles.horizontalCardsWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalCardsScroll}
                    >
                        {/* Card 1: Total Revenue */}
                        <View style={[
                            styles.hStatCard,
                            {
                                backgroundColor: theme.secondaryBg,
                                borderColor: isDark ? 'rgba(5, 150, 105, 0.3)' : '#bbf7d0',
                            }
                        ]}>
                            <View style={styles.hStatCardTop}>
                                <View style={[styles.hStatIconWrap, { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.18)' : '#ecfdf5' }]}>
                                    <TrendingUp size={13} color="#059669" />
                                </View>
                                <View style={[styles.hBadge, { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.15)' : '#dcfce7' }]}>
                                    <Text style={[styles.hBadgeText, { color: '#059669' }]}>Realized</Text>
                                </View>
                            </View>
                            <Text style={[styles.hStatValue, { color: '#059669' }]} numberOfLines={1}>
                                {formatCurrency(statsTotalRevenue)}
                            </Text>
                            <Text style={[styles.hStatLabel, { color: theme.textSecondary }]}>TOTAL REVENUE</Text>
                        </View>

                        {/* Card 2: Total Entries */}
                        <View style={[
                            styles.hStatCard,
                            {
                                backgroundColor: theme.secondaryBg,
                                borderColor: theme.border,
                            }
                        ]}>
                            <View style={styles.hStatCardTop}>
                                <View style={[styles.hStatIconWrap, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff' }]}>
                                    <Layers size={13} color={theme.brand} />
                                </View>
                                <View style={[styles.hBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9' }]}>
                                    <Text style={[styles.hBadgeText, { color: theme.textSecondary }]}>Logs</Text>
                                </View>
                            </View>
                            <Text style={[styles.hStatValue, { color: theme.textPrimary }]} numberOfLines={1}>
                                {statsTotalEntries}
                            </Text>
                            <Text style={[styles.hStatLabel, { color: theme.textSecondary }]}>TOTAL ENTRIES</Text>
                        </View>

                        {/* Card 3: Sales & Bookings */}
                        <View style={[
                            styles.hStatCard,
                            {
                                backgroundColor: theme.secondaryBg,
                                borderColor: isDark ? 'rgba(139, 92, 246, 0.3)' : '#ddd6fe',
                            }
                        ]}>
                            <View style={styles.hStatCardTop}>
                                <View style={[styles.hStatIconWrap, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.18)' : '#f5f3ff' }]}>
                                    <Coins size={13} color="#8b5cf6" />
                                </View>
                                <View style={[styles.hBadge, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#ede9fe' }]}>
                                    <Text style={[styles.hBadgeText, { color: '#8b5cf6' }]}>Units</Text>
                                </View>
                            </View>
                            <Text style={[styles.hStatValue, { color: '#8b5cf6' }]} numberOfLines={1}>
                                {statsSalesBookings}
                            </Text>
                            <Text style={[styles.hStatLabel, { color: theme.textSecondary }]}>SALES & BOOKINGS</Text>
                        </View>

                        {/* Card 4: Collections */}
                        <View style={[
                            styles.hStatCard,
                            {
                                backgroundColor: theme.secondaryBg,
                                borderColor: isDark ? 'rgba(2, 132, 199, 0.3)' : '#bae6fd',
                            }
                        ]}>
                            <View style={styles.hStatCardTop}>
                                <View style={[styles.hStatIconWrap, { backgroundColor: isDark ? 'rgba(2, 132, 199, 0.18)' : '#f0f9ff' }]}>
                                    <CreditCard size={13} color="#0284c7" />
                                </View>
                                <View style={[styles.hBadge, { backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe' }]}>
                                    <Text style={[styles.hBadgeText, { color: '#0284c7' }]}>Auto</Text>
                                </View>
                            </View>
                            <Text style={[styles.hStatValue, { color: '#0284c7' }]} numberOfLines={1}>
                                {statsCollections}
                            </Text>
                            <Text style={[styles.hStatLabel, { color: theme.textSecondary }]}>COLLECTIONS</Text>
                        </View>
                    </ScrollView>
                </View>

                {/* 2. SEARCH BAR WITH PLUS ICON (RIGHT BELOW HORIZONTAL CARDS) */}
                <View style={styles.searchSection}>
                    <View style={styles.searchRow}>
                        <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                            <Search size={16} color={theme.textSecondary} />
                            <TextInput
                                style={[styles.searchInput, { color: theme.textPrimary }]}
                                placeholder="Search revenue, collections, type..."
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

                        {/* Plus button to add new revenue */}
                        <TouchableOpacity
                            onPress={openAddForm}
                            style={[styles.addBtn, { backgroundColor: theme.brand }]}
                            accessibilityLabel="New Revenue"
                            activeOpacity={0.85}
                        >
                            <Plus size={20} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 3. FILTERS TOOLBAR ROW (FILTER ICON + CALENDAR ICON + EXPORT BUTTON) */}
                <View style={styles.filterSection}>
                    <View style={styles.filterBarRow}>
                        {/* Filter Button (Category / Type) */}
                        <TouchableOpacity
                            onPress={() => {
                                setFilterDropdownOpen(!isFilterDropdownOpen);
                                setDateDropdownOpen(false);
                                setExportDropdownOpen(false);
                            }}
                            activeOpacity={0.8}
                            style={[
                                styles.toolbarBtn,
                                {
                                    backgroundColor: theme.secondaryBg,
                                    borderColor: selectedCategory !== 'All' ? theme.brand : theme.border,
                                },
                                selectedCategory !== 'All' && {
                                    backgroundColor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#eff6ff',
                                }
                            ]}
                        >
                            <Filter size={14} color={selectedCategory !== 'All' ? theme.brand : theme.textSecondary} />
                            <Text
                                style={[
                                    styles.toolbarBtnText,
                                    { color: selectedCategory !== 'All' ? theme.brand : theme.textPrimary }
                                ]}
                                numberOfLines={1}
                            >
                                {selectedCategory === 'All' ? 'Filters' : selectedCategory}
                            </Text>
                            {selectedCategory !== 'All' && (
                                <View style={[styles.activeIndicatorDot, { backgroundColor: theme.brand }]} />
                            )}
                            <ChevronDown size={13} color={selectedCategory !== 'All' ? theme.brand : theme.textSecondary} />
                        </TouchableOpacity>

                        {/* Calendar Button (Date Ranges) */}
                        <TouchableOpacity
                            onPress={() => {
                                setDateDropdownOpen(!isDateDropdownOpen);
                                setFilterDropdownOpen(false);
                                setExportDropdownOpen(false);
                            }}
                            activeOpacity={0.8}
                            style={[
                                styles.toolbarBtn,
                                {
                                    backgroundColor: theme.secondaryBg,
                                    borderColor: dateRangeType !== 'All Time' ? '#059669' : theme.border,
                                },
                                dateRangeType !== 'All Time' && {
                                    backgroundColor: isDark ? 'rgba(5, 150, 105, 0.12)' : '#f0fdf4',
                                }
                            ]}
                        >
                            <Calendar size={14} color={dateRangeType !== 'All Time' ? '#059669' : theme.textSecondary} />
                            <Text
                                style={[
                                    styles.toolbarBtnText,
                                    { color: dateRangeType !== 'All Time' ? '#059669' : theme.textPrimary }
                                ]}
                                numberOfLines={1}
                            >
                                {dateRangeType}
                            </Text>
                            <ChevronDown size={13} color={dateRangeType !== 'All Time' ? '#059669' : theme.textSecondary} />
                        </TouchableOpacity>

                        {/* Export Button (Excel / CSV) */}
                        <TouchableOpacity
                            onPress={() => {
                                setExportDropdownOpen(!isExportDropdownOpen);
                                setFilterDropdownOpen(false);
                                setDateDropdownOpen(false);
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

                    {/* SUB DROPDOWN 1: CATEGORY & SORT FILTER */}
                    {isFilterDropdownOpen && (
                        <View style={[styles.subDropdownCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                            <View style={styles.subDropdownHeader}>
                                <Text style={[styles.subDropdownTitle, { color: theme.textPrimary }]}>Filter by Revenue Type</Text>
                                <TouchableOpacity onPress={() => setFilterDropdownOpen(false)}>
                                    <X size={15} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                                {/* All option */}
                                <TouchableOpacity
                                    onPress={() => { setSelectedCategory('All'); setPage(1); setFilterDropdownOpen(false); }}
                                    style={[
                                        styles.subDropdownItem,
                                        selectedCategory === 'All' && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }
                                    ]}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <View style={[styles.subDot, { backgroundColor: theme.brand }]} />
                                        <Text style={[styles.subDropdownText, { color: theme.textPrimary, fontWeight: selectedCategory === 'All' ? '700' : '500' }]}>
                                            All Types
                                        </Text>
                                    </View>
                                    {selectedCategory === 'All' && <Check size={14} color={theme.brand} />}
                                </TouchableOpacity>

                                {/* Revenue types */}
                                {REVENUE_TYPES.map(type => {
                                    const isSelected = selectedCategory.toLowerCase() === type.value.toLowerCase();
                                    return (
                                        <TouchableOpacity
                                            key={type.value}
                                            onPress={() => {
                                                setSelectedCategory(type.value);
                                                setPage(1);
                                                setFilterDropdownOpen(false);
                                            }}
                                            style={[
                                                styles.subDropdownItem,
                                                isSelected && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }
                                            ]}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <View style={[styles.subDot, { backgroundColor: type.color }]} />
                                                <Text style={[styles.subDropdownText, { color: theme.textPrimary, fontWeight: isSelected ? '700' : '500' }]}>
                                                    {type.value}
                                                </Text>
                                            </View>
                                            {isSelected && <Check size={14} color={theme.brand} />}
                                        </TouchableOpacity>
                                    );
                                })}

                                {/* Sort Options Divider */}
                                <View style={[styles.subDropdownDivider, { borderTopColor: theme.border }]} />
                                <Text style={[styles.subSectionTitle, { color: theme.textSecondary }]}>SORT ORDER</Text>
                                {SORT_OPTIONS.map(opt => {
                                    const isSelected = sortFilter === opt.key;
                                    return (
                                        <TouchableOpacity
                                            key={opt.key}
                                            onPress={() => {
                                                setSortFilter(opt.key);
                                                setFilterDropdownOpen(false);
                                            }}
                                            style={[
                                                styles.subDropdownItem,
                                                isSelected && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }
                                            ]}
                                        >
                                            <Text style={[styles.subDropdownText, { color: theme.textPrimary, fontWeight: isSelected ? '700' : '500' }]}>
                                                {opt.label}
                                            </Text>
                                            {isSelected && <Check size={14} color={theme.brand} />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}

                    {/* SUB DROPDOWN 2: DATE RANGE SELECTOR */}
                    {isDateDropdownOpen && (
                        <View style={[styles.subDropdownCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                            <View style={styles.subDropdownHeader}>
                                <Text style={[styles.subDropdownTitle, { color: theme.textPrimary }]}>Select Date Range</Text>
                                <TouchableOpacity onPress={() => setDateDropdownOpen(false)}>
                                    <X size={15} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                                {DATE_RANGE_OPTIONS.map(range => {
                                    const isSelected = dateRangeType === range;
                                    return (
                                        <TouchableOpacity
                                            key={range}
                                            onPress={() => {
                                                setDateRangeType(range);
                                                setPage(1);
                                                setDateDropdownOpen(false);
                                            }}
                                            style={[
                                                styles.subDropdownItem,
                                                isSelected && { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.1)' : '#f0fdf4' }
                                            ]}
                                        >
                                            <Text style={[styles.subDropdownText, { color: isSelected ? '#059669' : theme.textPrimary, fontWeight: isSelected ? '700' : '500' }]}>
                                                {range}
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
                                <Text style={[styles.subDropdownTitle, { color: theme.textPrimary }]}>Export Transactions</Text>
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
                                    <Text style={[styles.exportOptionSub, { color: theme.textSecondary }]}>Formatted spreadsheet report</Text>
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

                {/* 4. OPTIONAL REVENUE BY SOURCE MINI BREAKDOWN BAR */}
                {sourceBreakdown.length > 0 && (
                    <View style={[styles.breakdownCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <View style={styles.breakdownHeader}>
                            <Text style={[styles.breakdownTitle, { color: theme.textPrimary }]}>Revenue by Source</Text>
                            <Text style={[styles.breakdownTotal, { color: '#059669' }]}>{formatCurrency(statsTotalRevenue)}</Text>
                        </View>

                        {/* Multi-segment colored progress bar */}
                        <View style={[styles.progressBarWrap, { backgroundColor: theme.inputBg }]}>
                            {sourceBreakdown.map(item => (
                                <View
                                    key={item.type}
                                    style={{
                                        flex: Math.max(1, item.pct),
                                        backgroundColor: item.color,
                                        height: '100%',
                                    }}
                                />
                            ))}
                        </View>

                        {/* Legend items */}
                        <View style={styles.legendWrap}>
                            {sourceBreakdown.slice(0, 4).map(item => (
                                <View key={item.type} style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                    <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                                        {item.type}: {item.pct}%
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* 5. REVENUE TRANSACTIONS LIST */}
                <View style={styles.listSection}>
                    <View style={styles.listHeaderRow}>
                        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
                            REVENUE TRANSACTIONS ({totalCount || revenueItems.length})
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
                            <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Loading revenues...</Text>
                        </View>
                    ) : revenueItems.length === 0 ? (
                        <View style={[styles.emptyBox, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                            <Coins size={40} color={theme.textMuted} />
                            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Revenue Found</Text>
                            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                                No revenue records match your current search or filters.
                            </Text>
                            <TouchableOpacity onPress={resetFilters} style={[styles.resetFiltersBtn, { backgroundColor: theme.brand }]}>
                                <Text style={styles.resetFiltersText}>Clear Filters</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        revenueItems.map((item, index) => {
                            const details = getRevenueTypeDetails(item.type);
                            const isPersisted = !item.isSystem && item.revenueId > 0;

                            return (
                                <TouchableOpacity
                                    key={`rev-${item.revenueId}-${index}`}
                                    activeOpacity={0.85}
                                    onPress={() => {
                                        closeAllDropdowns();
                                        setDetailItem(item);
                                        setDetailModalOpen(true);
                                    }}
                                    style={[
                                        styles.revenueCard,
                                        {
                                            backgroundColor: theme.secondaryBg,
                                            borderColor: theme.border,
                                            borderLeftColor: details.color,
                                            borderLeftWidth: 4,
                                        }
                                    ]}
                                >
                                    {/* Top Row: Type badge, Date & Amount */}
                                    <View style={styles.cardTopRow}>
                                        <View style={styles.badgeAndDate}>
                                            <View style={[
                                                styles.typeBadge,
                                                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : `${details.color}15` }
                                            ]}>
                                                <View style={[styles.typeDot, { backgroundColor: details.color }]} />
                                                <Text style={[styles.typeText, { color: details.color }]}>{item.type || 'Other'}</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <Calendar size={12} color={theme.textSecondary} />
                                                <Text style={[styles.cardDate, { color: theme.textSecondary }]}>{formatDate(item.date)}</Text>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <ArrowUpRight size={15} color="#059669" />
                                            <Text style={[styles.cardAmount, { color: '#059669' }]}>
                                                +{formatCurrency(item.amount)}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Middle: Description & Reference */}
                                    <View style={styles.cardDescBox}>
                                        <Text style={[styles.cardDescription, { color: theme.textPrimary }]}>{item.description}</Text>
                                        {isPersisted ? (
                                            <Text style={[styles.cardRef, { color: theme.textMuted }]}>Ref #REV-{item.revenueId}</Text>
                                        ) : (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#0284c7' }} />
                                                <Text style={[styles.cardRef, { color: '#0284c7', fontWeight: '600' }]}>
                                                    Auto-realized system entry
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Bottom: System Badge vs Edit/Delete Buttons */}
                                    <View style={styles.cardMetaRow}>
                                        {isPersisted ? (
                                            <View style={styles.cardActionsRow}>
                                                <TouchableOpacity
                                                    onPress={(e) => { e.stopPropagation(); openEditForm(item); }}
                                                    style={[styles.actionBtn, { borderColor: theme.border, backgroundColor: theme.inputBg }]}
                                                >
                                                    <Edit size={12} color={theme.brand} />
                                                    <Text style={[styles.actionBtnText, { color: theme.brand }]}>Edit</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    onPress={(e) => { e.stopPropagation(); handleDeleteRevenue(item.revenueId); }}
                                                    style={[styles.actionBtn, styles.deleteActionBtn]}
                                                >
                                                    <Trash2 size={12} color="#dc2626" />
                                                    <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Delete</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <View style={[
                                                styles.realizedBadge,
                                                {
                                                    backgroundColor: isDark ? 'rgba(5, 150, 105, 0.12)' : '#ecfdf5',
                                                    borderColor: isDark ? 'rgba(5, 150, 105, 0.3)' : '#a7f3d0',
                                                }
                                            ]}>
                                                <CheckCircle2 size={11} color="#059669" />
                                                <Text style={[styles.realizedBadgeText, { color: '#059669' }]}>Realized</Text>
                                            </View>
                                        )}
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

            {/* TRANSACTION DETAILS MODAL */}
            <Modal visible={isDetailModalOpen} transparent animationType="fade">
                <View style={styles.modalBackdrop}>
                    <View style={[styles.detailModalCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <View style={styles.detailModalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <TrendingUp size={18} color="#059669" />
                                <Text style={[styles.detailModalTitle, { color: theme.textPrimary }]}>Revenue Details</Text>
                            </View>
                            <TouchableOpacity onPress={() => setDetailModalOpen(false)} style={styles.modalCloseCircle}>
                                <X size={16} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {detailItem && (
                            <View style={styles.detailModalBody}>
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Type</Text>
                                    <View style={[styles.typeBadge, { backgroundColor: `${getRevenueTypeDetails(detailItem.type).color}15` }]}>
                                        <View style={[styles.typeDot, { backgroundColor: getRevenueTypeDetails(detailItem.type).color }]} />
                                        <Text style={[styles.typeText, { color: getRevenueTypeDetails(detailItem.type).color }]}>{detailItem.type}</Text>
                                    </View>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Description</Text>
                                    <Text style={[styles.detailVal, { color: theme.textPrimary, flex: 1, textAlign: 'right' }]}>
                                        {detailItem.description}
                                    </Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Amount</Text>
                                    <Text style={[styles.detailVal, { color: '#059669', fontWeight: '800', fontSize: 16 }]}>
                                        {formatCurrency(detailItem.amount)}
                                    </Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Date</Text>
                                    <Text style={[styles.detailVal, { color: theme.textPrimary }]}>{formatDate(detailItem.date)}</Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Entry Nature</Text>
                                    <Text style={[styles.detailVal, { color: detailItem.isSystem ? '#0284c7' : theme.textSecondary }]}>
                                        {detailItem.isSystem ? 'Auto-realized System Entry (Payments)' : `Manual Entry (Ref #REV-${detailItem.revenueId})`}
                                    </Text>
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

            {/* ADD / EDIT REVENUE MODAL */}
            <Modal visible={isFormModalOpen} transparent animationType="fade">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
                    <View style={[styles.modalContent, { backgroundColor: theme.secondaryBg }]}>
                        {/* Modal Header */}
                        <View style={[styles.formModalHeader, { backgroundColor: theme.brand }]}>
                            <View>
                                <Text style={styles.modalHeaderTitle}>
                                    {formMode === 'add' ? 'Add Revenue' : 'Edit Revenue'}
                                </Text>
                                <Text style={styles.modalHeaderSub}>Record a manual revenue entry</Text>
                            </View>
                            <TouchableOpacity onPress={() => setFormModalOpen(false)} style={styles.modalCloseBtn}>
                                <X size={16} color="#ffffff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {/* Revenue Type Selector */}
                            <Text style={[styles.formLabel, { color: theme.textPrimary }]}>REVENUE TYPE *</Text>
                            <TouchableOpacity
                                onPress={() => setCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                style={[styles.formInputBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                            >
                                <Text style={{ fontSize: 13, color: theme.textPrimary }}>{formCategory}</Text>
                                <ChevronDown size={14} color={theme.textSecondary} />
                            </TouchableOpacity>

                            {isCategoryDropdownOpen && (
                                <View style={[styles.formDropdown, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                                    {MANUAL_REVENUE_TYPES.map(cat => (
                                        <TouchableOpacity
                                            key={cat.value}
                                            onPress={() => {
                                                setFormCategory(cat.value);
                                                setCategoryDropdownOpen(false);
                                            }}
                                            style={[styles.formDropdownRow, { borderBottomColor: theme.border }]}
                                        >
                                            <Text style={{ fontSize: 12, color: theme.textPrimary, fontWeight: formCategory === cat.value ? '700' : '400' }}>
                                                {cat.value} ({cat.label})
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Description */}
                            <Text style={[styles.formLabel, { color: theme.textPrimary, marginTop: 12 }]}>DESCRIPTION *</Text>
                            <TextInput
                                style={[styles.formInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                                placeholder="e.g. Unit 302 booking balance or Consulting fee"
                                placeholderTextColor={theme.textMuted}
                                value={formDescription}
                                onChangeText={setFormDescription}
                            />

                            {/* Amount */}
                            <Text style={[styles.formLabel, { color: theme.textPrimary, marginTop: 12 }]}>AMOUNT (₹) *</Text>
                            <TextInput
                                style={[styles.formInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                                placeholder="e.g. 50000"
                                placeholderTextColor={theme.textMuted}
                                keyboardType="numeric"
                                value={formAmount}
                                onChangeText={setFormAmount}
                            />

                            {/* Date */}
                            <Text style={[styles.formLabel, { color: theme.textPrimary, marginTop: 12 }]}>DATE (YYYY-MM-DD) *</Text>
                            <TextInput
                                style={[styles.formInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={theme.textMuted}
                                value={formDate}
                                onChangeText={setFormDate}
                            />
                        </ScrollView>

                        {/* Modal Footer */}
                        <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
                            <TouchableOpacity onPress={() => setFormModalOpen(false)} style={[styles.modalCancelBtn, { borderColor: theme.border }]}>
                                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleSaveRevenue}
                                style={[styles.modalSaveBtn, { backgroundColor: theme.brand }]}
                                disabled={recordRevenueMutation.isPending || updateRevenueMutation.isPending}
                            >
                                {(recordRevenueMutation.isPending || updateRevenueMutation.isPending) ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text style={{ color: '#ffffff', fontWeight: '700' }}>Save Revenue</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
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

    // 2. SEARCH BAR & PLUS ICON
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
    subDropdownDivider: {
        borderTopWidth: 1,
        marginVertical: 6,
    },
    subSectionTitle: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginVertical: 4,
        paddingHorizontal: 8,
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

    // 4. BREAKDOWN CARD
    breakdownCard: {
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 10,
        borderWidth: 1,
        padding: 12,
    },
    breakdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    breakdownTitle: {
        fontSize: 12,
        fontWeight: '700',
    },
    breakdownTotal: {
        fontSize: 12,
        fontWeight: '800',
    },
    progressBarWrap: {
        height: 8,
        borderRadius: 4,
        flexDirection: 'row',
        overflow: 'hidden',
        marginBottom: 8,
    },
    legendWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
    legendText: {
        fontSize: 10,
        fontWeight: '600',
    },

    // 5. LIST SECTION
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
    revenueCard: {
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
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 13,
        fontWeight: '700',
    },
    cardRef: {
        fontSize: 10,
        marginTop: 1,
    },
    cardMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: 8,
    },
    cardActionsRow: {
        flexDirection: 'row',
        gap: 6,
    },
    actionBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    deleteActionBtn: {
        borderColor: '#fca5a5',
        backgroundColor: '#fef2f2',
    },
    actionBtnText: {
        fontSize: 10,
        fontWeight: '700',
    },
    realizedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
    },
    realizedBadgeText: {
        fontSize: 10,
        fontWeight: '700',
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

    // ADD / EDIT MODAL
    modalContent: {
        borderRadius: 12,
        overflow: 'hidden',
        maxHeight: '90%',
    },
    formModalHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalHeaderTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#ffffff',
    },
    modalHeaderSub: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
    },
    modalCloseBtn: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBody: {
        padding: 16,
    },
    formLabel: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 4,
    },
    formInputBox: {
        height: 38,
        borderRadius: 6,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    formInput: {
        height: 38,
        borderRadius: 6,
        borderWidth: 1,
        paddingHorizontal: 10,
        fontSize: 13,
    },
    formDropdown: {
        borderWidth: 1,
        borderRadius: 6,
        marginTop: 4,
        maxHeight: 180,
    },
    formDropdownRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        gap: 8,
        borderBottomWidth: 1,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 12,
        borderTopWidth: 1,
        gap: 10,
    },
    modalCancelBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
    },
    modalSaveBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
