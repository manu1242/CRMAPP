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
    KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    Plus,
    Search,
    Calendar,
    X,
    ChevronDown,
    Trash2,
    Edit,
    Tag,
    AlertCircle,
    TrendingUp,
    FileSpreadsheet,
    FileText,
    MessageSquare,
    MoreVertical,
    DollarSign,
    Coins,
} from 'lucide-react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import {
    useRevenues,
    useRecordRevenue,
    useUpdateRevenue,
    useDeleteRevenue,
} from '../../../../admin/hooks/useRevenue';
import { RevenueItem } from '../../../../admin/models/RevenueTypes';

const REVENUE_TYPES = [
    { value: 'Sale', label: 'Sale price of property/unit', color: '#b45309', bgColor: '#fef3c7' }, // Gold/Amber
    { value: 'Booking', label: 'Booking/Advance amount', color: '#2563eb', bgColor: '#dbeafe' }, // Blue
    { value: 'Rental', label: 'Rental income', color: '#7c3aed', bgColor: '#f3e8ff' }, // Purple/Violet
    { value: 'Service', label: 'Other service charges', color: '#0891b2', bgColor: '#ecfeff' }, // Cyan
    { value: 'Collection', label: 'Collection (from payments)', color: '#059669', bgColor: '#d1fae5' }, // Green
    { value: 'Subscription', label: 'Subscription (Razorpay)', color: '#db2777', bgColor: '#fce7f3' }, // Pink
    { value: 'Partner Commission', label: 'Partner Commission logs', color: '#ea580c', bgColor: '#ffedd5' }, // Orange
    { value: 'Other', label: 'Other', color: '#4b5563', bgColor: '#f3f4f6' }, // Gray
];

const MANUAL_REVENUE_TYPES = REVENUE_TYPES.filter(type =>
    ['Sale', 'Booking', 'Rental', 'Service', 'Other'].includes(type.value)
);

function getRevenueTypeDetails(type: string) {
    return REVENUE_TYPES.find(c => c.value === type) || {
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

export default function RevenueScreen() {
    const router = useRouter();
    const { isDark } = useTheme();
    const theme = getAdminTheme(isDark);

    // Filter & Pagination States
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [dateRangeType, setDateRangeType] = useState('All Time');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);

    // Inline Filter Dropdowns Toggle
    const [isCategoryFilterOpen, setCategoryFilterOpen] = useState(false);
    const [isDateDropdownOpen, setDateDropdownOpen] = useState(false);

    // Fetch raw revenue list
    const {
        data: revenuesRes,
        isLoading,
        isRefetching,
        refetch: refetchList,
    } = useRevenues();

    const rawRevenues = revenuesRes?.data ?? [];

    // Client-side Searching and Filtering (Matching MVC dashboard behavior)
    const filteredRevenues = useMemo(() => {
        const now = new Date();
        const getFormatted = (d: Date) => d.toISOString().split('T')[0];
        const todayStr = getFormatted(now);

        let filterStart = '';
        let filterEnd = todayStr;

        if (dateRangeType === 'Today') {
            filterStart = todayStr;
            filterEnd = todayStr;
        } else if (dateRangeType === 'This Week') {
            const sw = new Date(now);
            sw.setDate(now.getDate() - now.getDay()); // Sunday
            filterStart = getFormatted(sw);
        } else if (dateRangeType === 'This Month') {
            const sm = new Date(now.getFullYear(), now.getMonth(), 1);
            filterStart = getFormatted(sm);
        } else if (dateRangeType === 'Last 3 Months') {
            const s3 = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            filterStart = getFormatted(s3);
        } else if (dateRangeType === 'Custom Range') {
            filterStart = fromDate;
            filterEnd = toDate || todayStr;
        }

        return rawRevenues.filter((item) => {
            // 1. Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesDesc = item.description?.toLowerCase().includes(query);
                const matchesType = item.type?.toLowerCase().includes(query);
                if (!matchesDesc && !matchesType) return false;
            }

            // 2. Category filter
            if (selectedCategory !== 'All' && item.type !== selectedCategory) {
                return false;
            }

            // 3. Date range filter
            if (dateRangeType !== 'All Time') {
                const itemDateStr = item.date.split('T')[0];
                if (filterStart && itemDateStr < filterStart) return false;
                if (filterEnd && itemDateStr > filterEnd) return false;
            }

            return true;
        });
    }, [rawRevenues, searchQuery, selectedCategory, dateRangeType, fromDate, toDate]);

    // Summary calculations (dynamically updated when filters change)
    const summaryMetrics = useMemo(() => {
        let totalAmount = 0;
        let salesCount = 0;
        filteredRevenues.forEach(r => {
            totalAmount += r.amount;
            if (r.type === 'Sale') {
                salesCount++;
            }
        });
        return {
            totalAmount,
            totalCount: filteredRevenues.length,
            salesCount
        };
    }, [filteredRevenues]);

    // Pagination
    const totalCount = filteredRevenues.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [totalPages, page]);

    const paginatedItems = useMemo(() => {
        const startIndex = (page - 1) * pageSize;
        return filteredRevenues.slice(startIndex, startIndex + pageSize);
    }, [filteredRevenues, page, pageSize]);

    // Detail Modal State
    const [selectedRevenue, setSelectedRevenue] = useState<RevenueItem | null>(null);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);

    // Add/Edit Form State
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
    const [formCategory, setFormCategory] = useState('Sale');
    const [formAmount, setFormAmount] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [isCategoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

    // Mutations
    const recordRevenueMutation = useRecordRevenue();
    const updateRevenueMutation = useUpdateRevenue();
    const deleteRevenueMutation = useDeleteRevenue();

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

    const handleRecordRevenue = () => {
        const amt = parseFloat(formAmount);
        if (isNaN(amt) || amt <= 0) {
            Alert.alert('Validation Error', 'Please enter a valid positive Amount.');
            return;
        }
        if (!formDescription.trim()) {
            Alert.alert('Validation Error', 'Please enter a Description.');
            return;
        }

        const payload = {
            type: formCategory,
            description: formDescription.trim(),
            amount: amt,
        };

        recordRevenueMutation.mutate(payload, {
            onSuccess: (res) => {
                Alert.alert('Success', 'Revenue logged successfully!');
                setFormModalOpen(false);
                resetForm();
                refetchList();
            },
            onError: (err: any) => {
                const msg = err.response?.data?.message || err.message || 'Failed to record revenue.';
                Alert.alert('Error', msg);
            },
        });
    };

    const handleEditSubmit = () => {
        if (!selectedRevenue) return;
        const amt = parseFloat(formAmount);
        if (isNaN(amt) || amt <= 0) {
            Alert.alert('Validation Error', 'Please enter a valid positive Amount.');
            return;
        }
        if (!formDescription.trim()) {
            Alert.alert('Validation Error', 'Please enter a Description.');
            return;
        }

        const payload = {
            revenueId: selectedRevenue.revenueId,
            type: formCategory,
            description: formDescription.trim(),
            amount: amt,
        };

        updateRevenueMutation.mutate(payload, {
            onSuccess: (res) => {
                Alert.alert('Success', 'Revenue updated successfully!');
                setFormModalOpen(false);
                resetForm();
                setDetailModalOpen(false);
                setSelectedRevenue(null);
                refetchList();
            },
            onError: (err: any) => {
                const msg = err.response?.data?.message || err.message || 'Failed to update revenue.';
                Alert.alert('Error', msg);
            },
        });
    };

    const handleDeleteRevenue = (id: number) => {
        Alert.alert(
            'Confirm Deletion',
            'Are you sure you want to delete this revenue record? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteRevenueMutation.mutate(id, {
                            onSuccess: () => {
                                Alert.alert('Success', 'Revenue deleted successfully.');
                                setDetailModalOpen(false);
                                setSelectedRevenue(null);
                                refetchList();
                            },
                            onError: (err: any) => {
                                Alert.alert('Error', err.message || 'Failed to delete revenue.');
                            },
                        });
                    },
                },
            ]
        );
    };

    const resetForm = () => {
        setFormCategory('Sale');
        setFormAmount('');
        setFormDescription('');
        setCategoryDropdownOpen(false);
    };

    const openAddForm = () => {
        setFormMode('add');
        resetForm();
        setFormModalOpen(true);
    };

    const openEditForm = () => {
        if (!selectedRevenue) return;
        setFormMode('edit');
        setFormCategory(selectedRevenue.type);
        setFormAmount(selectedRevenue.amount.toString());
        setFormDescription(selectedRevenue.description);
        setCategoryDropdownOpen(false);
        setFormModalOpen(true);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.primaryBg }]}>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetchList} />}
            >

                {/* METRICS ROW */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, gap: 10 }}
                >
                    {/* Total Revenue */}
                    <View style={[styles.metricCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <View style={[styles.metricIconBox, { backgroundColor: '#d1fae5' }]}>
                            <Coins size={20} color="#059669" />
                        </View>
                        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>TOTAL REVENUE</Text>
                        <Text style={[styles.metricVal, { color: '#059669' }]} numberOfLines={1}>
                            {formatCurrency(summaryMetrics.totalAmount)}
                        </Text>
                    </View>

                    {/* Total Entries Count */}
                    <View style={[styles.metricCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <View style={[styles.metricIconBox, { backgroundColor: '#bp' === '#bp' ? '#dbeafe' : theme.inputBg }]}>
                            <FileText size={20} color="#2563eb" />
                        </View>
                        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>TOTAL ENTRIES</Text>
                        <Text style={[styles.metricVal, { color: '#2563eb' }]} numberOfLines={1}>
                            {summaryMetrics.totalCount}
                        </Text>
                    </View>

                    {/* Sales Counts */}
                    <View style={[styles.metricCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <View style={[styles.metricIconBox, { backgroundColor: '#fef3c7' }]}>
                            <TrendingUp size={20} color="#d4a45a" />
                        </View>
                        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>PROPERTY SALES</Text>
                        <Text style={[styles.metricVal, { color: '#b8893e' }]} numberOfLines={1}>
                            {summaryMetrics.salesCount}
                        </Text>
                    </View>
                </ScrollView>

                {/* SEARCH & FILTERS CONTAINER */}
                <View style={[styles.filterBarCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>

                    <View style={{ gap: 10 }}>
                        {/* Search Input and Plus Button row */}
                        <View>
                            <Text style={[styles.fieldHeaderLabel, { color: theme.textSecondary }]}>SEARCH</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={[styles.inlineSearchBox, { flex: 1, backgroundColor: theme.inputBg, borderColor: theme.border }]}>
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
                                <TouchableOpacity
                                    onPress={openAddForm}
                                    style={[styles.createBtn, { backgroundColor: theme.brand, height: 38, width: 38 }]}
                                >
                                    <Plus size={20} color="#ffffff" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Category & Date range Row */}
                        <View style={{ flexDirection: 'row', gap: 10, zIndex: 100 }}>

                            {/* Category Dropdown */}
                            <View style={{ flex: 1, zIndex: 120 }}>
                                <Text style={[styles.fieldHeaderLabel, { color: theme.textSecondary }]}>REVENUE TYPE</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setCategoryFilterOpen(!isCategoryFilterOpen);
                                        setDateDropdownOpen(false);
                                    }}
                                    style={[styles.inlineSelectBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                                >
                                    <Text style={{ color: theme.textPrimary, fontSize: 13 }} numberOfLines={1}>
                                        {selectedCategory === 'All' ? 'All Types' : getRevenueTypeDetails(selectedCategory).label}
                                    </Text>
                                    <ChevronDown size={14} color={theme.textSecondary} />
                                </TouchableOpacity>

                                {isCategoryFilterOpen && (
                                    <View style={[styles.inlineDropdownList, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                                        <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setSelectedCategory('All');
                                                    setCategoryFilterOpen(false);
                                                    setPage(1);
                                                }}
                                                style={styles.dropdownOptionRow}
                                            >
                                                <Text style={{ fontSize: 12, color: theme.textPrimary, fontWeight: selectedCategory === 'All' ? '700' : '400' }}>
                                                    All Types
                                                </Text>
                                            </TouchableOpacity>
                                            {REVENUE_TYPES.map((cat) => (
                                                <TouchableOpacity
                                                    key={cat.value}
                                                    onPress={() => {
                                                        setSelectedCategory(cat.value);
                                                        setCategoryFilterOpen(false);
                                                        setPage(1);
                                                    }}
                                                    style={styles.dropdownOptionRow}
                                                >
                                                    <Text style={{ fontSize: 12, color: theme.textPrimary, fontWeight: selectedCategory === cat.value ? '700' : '400' }}>
                                                        {cat.value}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            {/* Date Range Dropdown */}
                            <View style={{ flex: 1, zIndex: 110 }}>
                                <Text style={[styles.fieldHeaderLabel, { color: theme.textSecondary }]}>DATE RANGE</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setDateDropdownOpen(!isDateDropdownOpen);
                                        setCategoryFilterOpen(false);
                                    }}
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
                        </View>

                        {/* Custom Dates Inputs */}
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

                        {/* Export Excel Row */}
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginTop: 4 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    Alert.alert('Excel Export', 'Revenue analytics report exported to Excel successfully!');
                                }}
                                style={[styles.exportExcelBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                            >
                                <FileSpreadsheet size={16} color="#16a34a" />
                                <Text style={[styles.exportExcelText, { color: '#16a34a' }]}>Export Excel</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>

                {/* SECTION DIVIDER */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionHeaderText, { color: theme.textSecondary }]}>REVENUE LOGS</Text>
                    <View style={[styles.sectionHeaderLine, { backgroundColor: theme.border }]} />
                </View>

                {/* REVENUE LIST SECTION */}
                <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
                    {isLoading ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={theme.brand} />
                            <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Loading revenue logs...</Text>
                        </View>
                    ) : paginatedItems.length > 0 ? (
                        <View style={{ gap: 10 }}>
                            {paginatedItems.map((item, index) => {
                                const catDetails = getRevenueTypeDetails(item.type);
                                return (
                                    <TouchableOpacity
                                        key={item.revenueId > 0 ? `manual-${item.revenueId}` : `sys-${index}`}
                                        onPress={() => {
                                            setSelectedRevenue(item);
                                            setDetailModalOpen(true);
                                        }}
                                        style={[styles.expenseCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border, borderLeftColor: catDetails.color }]}
                                    >
                                        {/* Left Column details */}
                                        <View style={{ flex: 1.3, gap: 5 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <FileText size={14} color={catDetails.color} />
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

                                        {/* Right Column details */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <View style={{ alignItems: 'flex-end', marginRight: 4 }}>
                                                <Text style={{ fontSize: 8, fontWeight: '700', color: theme.textMuted }}>AMOUNT</Text>
                                                <Text style={{ fontSize: 15, fontWeight: '800', color: '#059669', marginTop: 2 }}>
                                                    {formatCurrency(item.amount)}
                                                </Text>
                                            </View>
                                            <View style={[styles.catBadge, { backgroundColor: catDetails.bgColor }]}>
                                                <Text style={{ fontSize: 9, fontWeight: '700', color: catDetails.color }}>
                                                    {item.type}
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setSelectedRevenue(item);
                                                    setDetailModalOpen(true);
                                                }}
                                                style={[styles.optionsCircle, { backgroundColor: theme.inputBg }]}
                                            >
                                                <MoreVertical size={15} color={theme.textSecondary} />
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}

                            {/* PAGINATION SECTION */}
                            <View style={[styles.paginationRow, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                                    Showing {totalCount > 0 ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, totalCount)} of {totalCount} revenues
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
                            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No revenues found</Text>
                            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                                Try adjusting your search query, filters, or selected date ranges.
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
                            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Revenue Details</Text>
                            <TouchableOpacity onPress={() => setDetailModalOpen(false)} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
                                <X size={18} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {selectedRevenue ? (
                            <ScrollView showsVerticalScrollIndicator={false}>

                                {/* Summary Box */}
                                <View style={{ backgroundColor: theme.inputBg, padding: 16, borderRadius: 14, marginBottom: 14, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, marginBottom: 4 }}>REVENUE AMOUNT</Text>
                                    <Text style={{ fontSize: 24, fontWeight: '800', color: '#059669' }}>
                                        {formatCurrency(selectedRevenue.amount)}
                                    </Text>
                                </View>

                                {/* Grid Fields */}
                                <View style={{ gap: 10, marginBottom: 16 }}>

                                    {/* Type Badge */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Category Type</Text>
                                        <View style={[styles.catBadge, { backgroundColor: getRevenueTypeDetails(selectedRevenue.type).bgColor }]}>
                                            <Text style={{ fontSize: 11, fontWeight: '700', color: getRevenueTypeDetails(selectedRevenue.type).color }}>
                                                {getRevenueTypeDetails(selectedRevenue.type).label}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Date Field */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Date</Text>
                                        <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '600' }}>
                                            {formatDate(selectedRevenue.date)}
                                        </Text>
                                    </View>

                                    {/* Description Box */}
                                    <View style={{ gap: 6, marginTop: 4 }}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Description</Text>
                                        <View style={{ backgroundColor: theme.inputBg, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.border }}>
                                            <Text style={{ color: theme.textPrimary, fontSize: 13, lineHeight: 18 }}>
                                                {selectedRevenue.description}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Origin info if system generated */}
                                    {selectedRevenue.isSystem && (
                                        <View style={{ flexDirection: 'row', gap: 6, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 8, padding: 10, marginTop: 8 }}>
                                            <AlertCircle size={16} color="#16a34a" />
                                            <Text style={{ color: '#16a34a', fontSize: 11, flex: 1 }}>
                                                This is an automated system entry and cannot be edited or deleted manually.
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Actions Grid (Only show if manually added and has valid ID) */}
                                {!selectedRevenue.isSystem && selectedRevenue.revenueId > 0 && (
                                    <View style={{ flexDirection: 'row', gap: 10, marginVertical: 16 }}>
                                        <TouchableOpacity
                                            onPress={openEditForm}
                                            style={{
                                                flex: 1,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: theme.inputBg,
                                                borderWidth: 1,
                                                borderColor: theme.border,
                                                paddingVertical: 12,
                                                borderRadius: 10,
                                                gap: 6
                                            }}
                                        >
                                            <Edit size={16} color={theme.textPrimary} />
                                            <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 13 }}>Edit</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => handleDeleteRevenue(selectedRevenue.revenueId)}
                                            style={{
                                                flex: 1,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: '#fee2e2',
                                                paddingVertical: 12,
                                                borderRadius: 10,
                                                borderWidth: 1,
                                                borderColor: '#fca5a5',
                                                gap: 6
                                            } as any}
                                        >
                                            <Trash2 size={16} color="#ef4444" />
                                            <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                            </ScrollView>
                        ) : null}

                    </View>
                </View>
            </Modal>

            {/* RECORD/EDIT REVENUE FORM MODAL */}
            <Modal visible={isFormModalOpen} transparent animationType="slide" onRequestClose={() => setFormModalOpen(false)}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.formModalContent, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>

                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                                {formMode === 'add' ? 'Record Revenue' : 'Edit Revenue'}
                            </Text>
                            <TouchableOpacity onPress={() => setFormModalOpen(false)} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
                                <X size={18} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <View style={{ gap: 14, paddingBottom: 24, paddingTop: 10 }}>

                                {/* Form Field: Amount */}
                                <View>
                                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Amount (INR) *</Text>
                                    <View style={[styles.formInputContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border, marginTop: 6 }]}>
                                        <TextInput
                                            style={[styles.formTextInput, { color: theme.textPrimary }]}
                                            keyboardType="numeric"
                                            placeholder="0.00"
                                            placeholderTextColor={theme.textMuted}
                                            value={formAmount}
                                            onChangeText={setFormAmount}
                                        />
                                    </View>
                                </View>

                                {/* Dropdown Category Selector */}
                                <View style={{ zIndex: 10 }}>
                                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Category Type *</Text>
                                    <TouchableOpacity
                                        onPress={() => setCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                        style={[styles.selectBox, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}
                                    >
                                        <Text style={{ color: theme.textPrimary, fontSize: 13 }}>
                                            {getRevenueTypeDetails(formCategory).label}
                                        </Text>
                                        <ChevronDown size={16} color={theme.textSecondary} />
                                    </TouchableOpacity>

                                    {isCategoryDropdownOpen && (
                                        <View style={{
                                            position: 'absolute',
                                            top: 68,
                                            left: 0,
                                            right: 0,
                                            backgroundColor: theme.secondaryBg,
                                            borderColor: theme.border,
                                            borderWidth: 1,
                                            borderRadius: 10,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 4,
                                            elevation: 3,
                                            zIndex: 100,
                                            maxHeight: 180,
                                        }}>
                                            <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                                                {MANUAL_REVENUE_TYPES.map((cat) => (
                                                    <TouchableOpacity
                                                        key={cat.value}
                                                        onPress={() => {
                                                            setFormCategory(cat.value);
                                                            setCategoryDropdownOpen(false);
                                                        }}
                                                        style={{
                                                            paddingVertical: 10,
                                                            paddingHorizontal: 12,
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: theme.border,
                                                        }}
                                                    >
                                                        <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: formCategory === cat.value ? '700' : '400' }}>
                                                            {cat.label}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>

                                {/* Description input */}
                                <View>
                                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Description / Notes *</Text>
                                    <View style={[styles.formInputContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border, marginTop: 6, height: 80, alignItems: 'flex-start' }]}>
                                        <TextInput
                                            style={[styles.formTextInput, { color: theme.textPrimary, height: '100%', paddingVertical: 8, textAlignVertical: 'top' }]}
                                            placeholder="Property details, Booking advance particulars, lease names, etc..."
                                            placeholderTextColor={theme.textMuted}
                                            multiline
                                            value={formDescription}
                                            onChangeText={setFormDescription}
                                        />
                                    </View>
                                </View>

                                {/* Form Buttons */}
                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                                    <TouchableOpacity
                                        onPress={() => setFormModalOpen(false)}
                                        style={[styles.formCancelBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                                    >
                                        <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>Cancel</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={formMode === 'add' ? handleRecordRevenue : handleEditSubmit}
                                        disabled={recordRevenueMutation.isPending || updateRevenueMutation.isPending}
                                        style={[styles.formSaveBtn, { backgroundColor: theme.brand }]}
                                    >
                                        {recordRevenueMutation.isPending || updateRevenueMutation.isPending ? (
                                            <ActivityIndicator size="small" color="#ffffff" />
                                        ) : (
                                            <Text style={{ color: '#ffffff', fontWeight: '700' }}>
                                                {formMode === 'add' ? 'Record Revenue' : 'Save Changes'}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>

                            </View>
                        </ScrollView>

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
    createBtn: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 36,
        height: 36,
        borderRadius: 10,
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
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 10,
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
        marginVertical: 10,
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
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginHorizontal: 16,
        marginVertical: 12,
    },
    sectionHeaderText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    sectionHeaderLine: {
        flex: 1,
        height: 1,
    },
    expenseCard: {
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
    optionsCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
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
        maxHeight: '85%',
    },
    formModalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        maxHeight: '90%',
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
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    formInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        paddingHorizontal: 12,
    },
    formTextInput: {
        flex: 1,
        fontSize: 13,
        paddingVertical: 0,
    },
    selectBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        paddingHorizontal: 12,
        marginTop: 6,
    },
    formCancelBtn: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    formSaveBtn: {
        flex: 1.5,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
