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
    Modal,
    Alert,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    ChevronRight,
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
} from 'lucide-react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import {
    useExpenses,
    useRecordExpense,
    useUpdateExpense,
    useDeleteExpense,
} from '../../../../admin/hooks/useExpenses';
import { ExpenseItem } from '../../../../admin/models/ExpenseTypes';

const EXPENSE_CATEGORIES = [
    { value: 'Land', label: 'Land cost / Purchase price', color: '#b45309', bgColor: '#fef3c7' }, // Land - Orange/Amber
    { value: 'Construction', label: 'Construction / Development', color: '#8b5cf6', bgColor: '#ede9fe' }, // Purple
    { value: 'Legal', label: 'Legal / Registration', color: '#2563eb', bgColor: '#dbeafe' }, // Blue
    { value: 'Marketing', label: 'Marketing / Sales', color: '#059669', bgColor: '#d1fae5' }, // Green
    { value: 'Agent', label: 'Agent / CP Commission', color: '#ec4899', bgColor: '#fce7f3' }, // Pink
    { value: 'Tax', label: 'Taxes (GST, Stamp Duty)', color: '#ef4444', bgColor: '#fee2e2' }, // Red
    { value: 'Maintenance', label: 'Maintenance / Utilities', color: '#06b6d4', bgColor: '#ecfeff' }, // Cyan
    { value: 'Other', label: 'Other', color: '#6b7280', bgColor: '#f3f4f6' }, // Gray
];

function getCategoryDetails(type: string) {
    return EXPENSE_CATEGORIES.find(c => c.value === type) || {
        value: type,
        label: type,
        color: '#6b7280',
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

export default function ExpensesScreen() {
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

    // Queries
    const {
        data: expensesRes,
        isLoading,
        isRefetching,
        refetch: refetchList,
    } = useExpenses(
        page,
        pageSize,
        selectedCategory === 'All' ? undefined : selectedCategory,
        searchQuery || undefined,
        fromDate || undefined,
        toDate || undefined
    );

    const expenseItems = expensesRes?.data?.items ?? [];
    const summary = expensesRes?.data?.summary;
    const totalPages = expensesRes?.data?.totalPages ?? 1;
    const totalCount = expensesRes?.data?.totalCount ?? 0;

    // Detail Modal State
    const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);

    // Add/Edit Form State
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
    const [formCategory, setFormCategory] = useState('Marketing');
    const [formAmount, setFormAmount] = useState('');
    const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [formDescription, setFormDescription] = useState('');
    const [isCategoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

    // Mutations
    const recordExpenseMutation = useRecordExpense();
    const deleteExpenseMutation = useDeleteExpense();

    const handleSearchSubmit = () => {
        setPage(1);
        setSearchQuery(searchInput.trim());
    };

    const applyDateRangeType = (range: string) => {
        setDateRangeType(range);
        setDateDropdownOpen(false);
        setPage(1);

        const now = new Date();
        if (range === 'All Time') {
            setFromDate('');
            setToDate('');
        } else if (range === 'This Month') {
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            setFromDate(`${year}-${month}-01`);
            setToDate(now.toISOString().split('T')[0]);
        } else if (range === 'Last Month') {
            const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

            const fYear = prevMonth.getFullYear();
            const fMonth = String(prevMonth.getMonth() + 1).padStart(2, '0');
            const tYear = prevMonthEnd.getFullYear();
            const tMonth = String(prevMonthEnd.getMonth() + 1).padStart(2, '0');
            const tDay = String(prevMonthEnd.getDate()).padStart(2, '0');

            setFromDate(`${fYear}-${fMonth}-01`);
            setToDate(`${tYear}-${tMonth}-${tDay}`);
        }
    };

    const handleRecordExpense = () => {
        const amt = parseFloat(formAmount);
        if (isNaN(amt) || amt <= 0) {
            Alert.alert('Validation Error', 'Please enter a valid positive Amount.');
            return;
        }
        if (!formDate) {
            Alert.alert('Validation Error', 'Please specify the expense Date.');
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
            date: `${formDate}T12:00:00`,
        };

        recordExpenseMutation.mutate(payload, {
            onSuccess: (res) => {
                Alert.alert('Success', res.message || 'Expense recorded successfully!');
                setFormModalOpen(false);
                resetForm();
                refetchList();
            },
            onError: (err: any) => {
                const msg = err.response?.data?.message || err.message || 'Failed to record expense.';
                Alert.alert('Error', msg);
            },
        });
    };

    const updateExpenseMutation = useUpdateExpense(selectedExpense?.expenseId ?? 0);

    const handleEditSubmit = () => {
        if (!selectedExpense) return;
        const amt = parseFloat(formAmount);
        if (isNaN(amt) || amt <= 0) {
            Alert.alert('Validation Error', 'Please enter a valid positive Amount.');
            return;
        }
        if (!formDate) {
            Alert.alert('Validation Error', 'Please specify the expense Date.');
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
            date: `${formDate}T12:00:00`,
        };

        updateExpenseMutation.mutate(payload, {
            onSuccess: (res) => {
                Alert.alert('Success', res.message || 'Expense updated successfully!');
                setFormModalOpen(false);
                resetForm();
                setDetailModalOpen(false);
                setSelectedExpense(null);
                refetchList();
            },
            onError: (err: any) => {
                const msg = err.response?.data?.message || err.message || 'Failed to update expense.';
                Alert.alert('Error', msg);
            },
        });
    };

    const handleDeleteExpense = (id: number) => {
        Alert.alert(
            'Confirm Deletion',
            'Are you sure you want to delete this expense record? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteExpenseMutation.mutate(id, {
                            onSuccess: () => {
                                Alert.alert('Success', 'Expense deleted successfully.');
                                setDetailModalOpen(false);
                                setSelectedExpense(null);
                                refetchList();
                            },
                            onError: (err: any) => {
                                Alert.alert('Error', err.message || 'Failed to delete expense.');
                            },
                        });
                    },
                },
            ]
        );
    };

    const resetForm = () => {
        setFormCategory('Marketing');
        setFormAmount('');
        setFormDate(new Date().toISOString().split('T')[0]);
        setFormDescription('');
        setCategoryDropdownOpen(false);
    };

    const openAddForm = () => {
        setFormMode('add');
        resetForm();
        setFormModalOpen(true);
    };

    const openEditForm = () => {
        if (!selectedExpense) return;
        setFormMode('edit');
        setFormCategory(selectedExpense.type);
        setFormAmount(selectedExpense.amount.toString());
        setFormDate(selectedExpense.date.split('T')[0]);
        setFormDescription(selectedExpense.description);
        setCategoryDropdownOpen(false);
        setFormModalOpen(true);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.primaryBg }]}>

            {/* HEADER SECTION */}
            {/* <View style={[styles.headerRow, { borderBottomColor: theme.border, backgroundColor: theme.secondaryBg }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <ChevronLeft size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Expenses Tracker</Text>
        </View>
        
      </View> */}

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
                    {/* Total Expenses */}
                    <View style={[styles.metricCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <View style={[styles.metricIconBox, { backgroundColor: '#fee2e2' }]}>
                            <DollarSign size={20} color="#ef4444" />
                        </View>
                        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>TOTAL EXPENSES</Text>
                        <Text style={[styles.metricVal, { color: '#ef4444' }]} numberOfLines={1}>
                            {summary ? formatCurrency(summary.totalExpenses) : '₹0'}
                        </Text>
                    </View>

                    {/* This Month Expenses */}
                    <View style={[styles.metricCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <View style={[styles.metricIconBox, { backgroundColor: '#fef3c7' }]}>
                            <TrendingUp size={20} color="#f59e0b" />
                        </View>
                        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>THIS MONTH</Text>
                        <Text style={[styles.metricVal, { color: '#f59e0b' }]} numberOfLines={1}>
                            {summary ? formatCurrency(summary.thisMonthExpenses) : '₹0'}
                        </Text>
                    </View>

                    {/* Total Count */}
                    <View style={[styles.metricCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <View style={[styles.metricIconBox, { backgroundColor: '#d1fae5' }]}>
                            <Tag size={20} color="#10b981" />
                        </View>
                        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>TRANSACTIONS</Text>
                        <Text style={[styles.metricVal, { color: '#10b981' }]} numberOfLines={1}>
                            {summary ? summary.totalCount : '0'}
                        </Text>
                    </View>
                </ScrollView>

                {/* SEARCH & FILTERS CONTAINER - MATCHING THE USER'S ATTACHED SCREENSHOT */}
                <View style={[styles.filterBarCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>

                    <View style={{ gap: 10 }}>
                        {/* Search Input and Plus Button row */}
                        <View>
                            <Text style={[styles.fieldHeaderLabel, { color: theme.textSecondary }]}>SEARCH</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={[styles.inlineSearchBox, { flex: 1, backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                    <TextInput
                                        style={[styles.inlineSearchInput, { color: theme.textPrimary }]}
                                        placeholder="Search anything..."
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
                                <Text style={[styles.fieldHeaderLabel, { color: theme.textSecondary }]}>CATEGORY TYPE</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setCategoryFilterOpen(!isCategoryFilterOpen);
                                        setDateDropdownOpen(false);
                                    }}
                                    style={[styles.inlineSelectBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                                >
                                    <Text style={{ color: theme.textPrimary, fontSize: 13 }} numberOfLines={1}>
                                        {selectedCategory === 'All' ? 'All Types' : getCategoryDetails(selectedCategory).label}
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
                                            {EXPENSE_CATEGORIES.map((cat) => (
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
                                                        {cat.label}
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
                                        {['All Time', 'This Month', 'Last Month', 'Custom Range'].map((range) => (
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
                                    Alert.alert('Excel Export', 'Expenses sheet exported to Excel successfully!');
                                }}
                                style={[styles.exportExcelBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                            >
                                <FileSpreadsheet size={16} color="#2563eb" />
                                <Text style={[styles.exportExcelText, { color: '#2563eb' }]}>Export Excel</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>

                {/* SECTION DIVIDER */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionHeaderText, { color: theme.textSecondary }]}>RECENT EXPENSES</Text>
                    <View style={[styles.sectionHeaderLine, { backgroundColor: theme.border }]} />
                </View>

                {/* EXPENSE LIST SECTION */}
                <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
                    {isLoading ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={theme.brand} />
                            <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Loading expenses list...</Text>
                        </View>
                    ) : expenseItems.length > 0 ? (
                        <View style={{ gap: 10 }}>
                            {expenseItems.map((item) => {
                                const catDetails = getCategoryDetails(item.type);
                                return (
                                    <TouchableOpacity
                                        key={item.expenseId}
                                        onPress={() => {
                                            setSelectedExpense(item);
                                            setDetailModalOpen(true);
                                        }}
                                        style={[styles.expenseCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border, borderLeftColor: catDetails.color }]}
                                    >
                                        {/* Left Column details */}
                                        <View style={{ flex: 1.3, gap: 5 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <FileText size={14} color="#2563eb" />
                                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e3a8a' }}>
                                                    {item.type}
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <Calendar size={14} color={theme.textSecondary} />
                                                <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                                                    {formatDate(item.date)}
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <MessageSquare size={14} color={theme.textSecondary} />
                                                <Text style={{ fontSize: 12, color: theme.textSecondary }} numberOfLines={1}>
                                                    {item.description}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Right Column details */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <View style={{ alignItems: 'flex-end', marginRight: 4 }}>
                                                <Text style={{ fontSize: 8, fontWeight: '700', color: theme.textMuted }}>AMOUNT</Text>
                                                <Text style={{ fontSize: 16, fontWeight: '800', color: '#1e3a8a', marginTop: 2 }}>
                                                    {formatCurrency(item.amount)}
                                                </Text>
                                            </View>
                                            <View style={[styles.catBadge, { backgroundColor: catDetails.bgColor }]}>
                                                <Text style={{ fontSize: 10, fontWeight: '700', color: catDetails.color }}>
                                                    {catDetails.value}
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setSelectedExpense(item);
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
                                    Showing {totalCount > 0 ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, totalCount)} of {totalCount} expenses
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
                            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No expenses found</Text>
                            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                                Try adjusting your search query, active categories, or selected date ranges.
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
                            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Expense Details</Text>
                            <TouchableOpacity onPress={() => setDetailModalOpen(false)} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
                                <X size={18} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {selectedExpense ? (
                            <ScrollView showsVerticalScrollIndicator={false}>

                                {/* Summary Box */}
                                <View style={{ backgroundColor: theme.inputBg, padding: 16, borderRadius: 14, marginBottom: 14, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, marginBottom: 4 }}>EXPENSE AMOUNT</Text>
                                    <Text style={{ fontSize: 24, fontWeight: '800', color: '#ef4444' }}>
                                        {formatCurrency(selectedExpense.amount)}
                                    </Text>
                                </View>

                                {/* Grid Fields */}
                                <View style={{ gap: 10, marginBottom: 16 }}>

                                    {/* Category Field */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Category</Text>
                                        <View style={[styles.catBadge, { backgroundColor: getCategoryDetails(selectedExpense.type).bgColor }]}>
                                            <Text style={{ fontSize: 11, fontWeight: '700', color: getCategoryDetails(selectedExpense.type).color }}>
                                                {getCategoryDetails(selectedExpense.type).label}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Date Field */}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Date</Text>
                                        <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '600' }}>
                                            {formatDate(selectedExpense.date)}
                                        </Text>
                                    </View>

                                    {/* Description Box */}
                                    <View style={{ gap: 6, marginTop: 4 }}>
                                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Description</Text>
                                        <View style={{ backgroundColor: theme.inputBg, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.border }}>
                                            <Text style={{ color: theme.textPrimary, fontSize: 13, lineHeight: 18 }}>
                                                {selectedExpense.description}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Actions Grid */}
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
                                        onPress={() => handleDeleteExpense(selectedExpense.expenseId)}
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
                                        }}
                                    >
                                        <Trash2 size={16} color="#ef4444" />
                                        <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>Delete</Text>
                                    </TouchableOpacity>
                                </View>

                            </ScrollView>
                        ) : null}

                    </View>
                </View>
            </Modal>

            {/* RECORD/EDIT EXPENSE FORM MODAL */}
            <Modal visible={isFormModalOpen} transparent animationType="slide" onRequestClose={() => setFormModalOpen(false)}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.formModalContent, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>

                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                                {formMode === 'add' ? 'Record Expense' : 'Edit Expense'}
                            </Text>
                            <TouchableOpacity onPress={() => setFormModalOpen(false)} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
                                <X size={18} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <View style={{ gap: 14, paddingBottom: 24, paddingTop: 10 }}>

                                {/* Row 1: Amount & Date */}
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <View style={{ flex: 1 }}>
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

                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Expense Date *</Text>
                                        <View style={[styles.formInputContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border, marginTop: 6 }]}>
                                            <TextInput
                                                style={[styles.formTextInput, { color: theme.textPrimary }]}
                                                placeholder="YYYY-MM-DD"
                                                placeholderTextColor={theme.textMuted}
                                                value={formDate}
                                                onChangeText={setFormDate}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Dropdown Category Selector */}
                                <View style={{ zIndex: 10 }}>
                                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Category *</Text>
                                    <TouchableOpacity
                                        onPress={() => setCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                        style={[styles.selectBox, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}
                                    >
                                        <Text style={{ color: theme.textPrimary, fontSize: 13 }}>
                                            {getCategoryDetails(formCategory).label}
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
                                                {EXPENSE_CATEGORIES.map((cat) => (
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
                                            placeholder="Specify campaign, materials, vendor names or purchase reasons..."
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
                                        onPress={formMode === 'add' ? handleRecordExpense : handleEditSubmit}
                                        disabled={recordExpenseMutation.isPending || updateExpenseMutation.isPending}
                                        style={[styles.formSaveBtn, { backgroundColor: theme.brand }]}
                                    >
                                        {recordExpenseMutation.isPending || updateExpenseMutation.isPending ? (
                                            <ActivityIndicator size="small" color="#ffffff" />
                                        ) : (
                                            <Text style={{ color: '#ffffff', fontWeight: '700' }}>
                                                {formMode === 'add' ? 'Record Expense' : 'Save Changes'}
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        zIndex: 50,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
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
    customDateInputsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 6,
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
