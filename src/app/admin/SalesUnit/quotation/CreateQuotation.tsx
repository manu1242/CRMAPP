import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    StyleSheet,

    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    Search,
    ChevronLeft,
    FileText,
    Calendar,
    ChevronDown,
    Plus,
    Trash2,
    User,
    Building,
    DollarSign
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import {
    QuotationDetail,
    QuotationItem,
    QuotationCreateData,
    QuotationUpdateData,
    QuotationTemplate,
    PropertyFloor,
    PropertyFlat
} from '../../../../admin/models/QuoatationTypes';
import { useQuery } from '@tanstack/react-query';
import {
    useQuotationDetail,
    useCreateQuotation,
    useUpdateQuotation,
    usePropertyFloors,
    usePropertyFlats,
    useQuotationTemplates
} from '../../../../admin/hooks/useQuotations';
import { useLeadsQuery } from '../../../../admin/hooks/useLeadsQuery';
import { PropertyService } from '../../../../admin/services/PropertyService';
import { LeadItem } from '../../../../admin/models/LeadTypes';
import { PropertyItem } from '../../../../admin/models/PropertyTypes';

const ITEM_TYPES = ['Base', 'Parking', 'Amenities', 'Club Membership', 'Custom'];

interface InlineDropdownProps<T> {
    isOpen: boolean;
    onToggle: () => void;
    selectedValueLabel: string;
    placeholder: string;
    items: T[];
    loading?: boolean;
    searchKey: keyof T;
    labelKey: keyof T;
    secondaryLabelKey?: keyof T;
    onSelect: (item: T) => void;
    theme: any;
}

function InlineDropdown<T>({
    isOpen,
    onToggle,
    selectedValueLabel,
    placeholder,
    items,
    loading = false,
    searchKey,
    labelKey,
    secondaryLabelKey,
    onSelect,
    theme,
}: InlineDropdownProps<T>) {
    const [searchText, setSearchText] = useState('');

    const filteredItems = items.filter((item) => {
        const val = String(item[searchKey] || '').toLowerCase();
        return val.includes(searchText.toLowerCase());
    });

    return (
        <View style={{ gap: 4, width: '100%' }}>
            <TouchableOpacity
                onPress={onToggle}
                activeOpacity={0.8}
                style={[styles.selectBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
            >
                <Text style={{ color: selectedValueLabel ? theme.textPrimary : theme.textMuted, fontSize: 14 }}>
                    {selectedValueLabel || placeholder}
                </Text>
                {loading ? (
                    <ActivityIndicator size="small" color={theme.brand} />
                ) : (
                    <ChevronDown size={18} color={theme.textSecondary} />
                )}
            </TouchableOpacity>

            {isOpen && (
                <View
                    style={{
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 12,
                        backgroundColor: theme.secondaryBg,
                        marginTop: 4,
                        padding: 8,
                        maxHeight: 220,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                    }}
                >
                    {/* Search inside selector */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            height: 38,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: theme.border,
                            backgroundColor: theme.inputBg,
                            paddingHorizontal: 10,
                            gap: 6,
                            marginBottom: 8,
                        }}
                    >
                        <Search size={14} color={theme.textSecondary} style={{ marginRight: 4 }} />
                        <TextInput
                            style={{ flex: 1, fontSize: 13, color: theme.textPrimary, paddingVertical: 0 }}
                            placeholder="Type to filter..."
                            placeholderTextColor={theme.textMuted}
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                    </View>

                    <ScrollView style={{ flexGrow: 0 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item, idx) => {
                                const label = String(item[labelKey] || '');
                                const secLabel = secondaryLabelKey ? String(item[secondaryLabelKey] || '') : '';
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        onPress={() => {
                                            onSelect(item);
                                            setSearchText('');
                                        }}
                                        style={{
                                            paddingVertical: 10,
                                            paddingHorizontal: 8,
                                            borderBottomWidth: idx === filteredItems.length - 1 ? 0 : 1,
                                            borderBottomColor: theme.border,
                                        }}
                                    >
                                        <Text style={{ fontSize: 13, fontWeight: '500', color: theme.textPrimary }}>{label}</Text>
                                        {secLabel ? (
                                            <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>{secLabel}</Text>
                                        ) : null}
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                            <View style={{ padding: 12, alignItems: 'center' }}>
                                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>No records found</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

export default function CreateQuotation() {
    const router = useRouter();
    const { editId } = useLocalSearchParams<{ editId?: string }>();
    const { isDark } = useTheme();
    const theme = getAdminTheme(isDark);

    const selectedQuotationId = editId ? parseInt(editId, 10) : null;
    const formMode = selectedQuotationId ? 'edit' : 'create';

    // Fetch selected quotation detail for edit pre-filling
    const { data: detailResponse, isLoading: isDetailLoading } = useQuotationDetail(selectedQuotationId ?? 0);
    const selectedQuotation = detailResponse?.data;

    // Form input state
    const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
    const [selectedProperty, setSelectedProperty] = useState<PropertyItem | null>(null);
    const [selectedFloor, setSelectedFloor] = useState<PropertyFloor | null>(null);
    const [selectedFlat, setSelectedFlat] = useState<PropertyFlat | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<QuotationTemplate | null>(null);
    const [validUntilDate, setValidUntilDate] = useState(() => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        return futureDate.toISOString().split('T')[0];
    });
    const [notes, setNotes] = useState('');
    const [changeReason, setChangeReason] = useState('');
    const [discountAmount, setDiscountAmount] = useState('0');
    const [lineItems, setLineItems] = useState<Omit<QuotationItem, 'itemId' | 'quotationId'>[]>([]);

    // Selection option lists using TanStack Query
    const { data: leadsQueryData, isLoading: isLeadsLoading } = useLeadsQuery({ page: 1, pageSize: 150 });
    const leadsList = leadsQueryData?.data?.items ?? [];

    const { data: propertiesList = [], isLoading: isPropertiesLoading } = useQuery({
        queryKey: ['propertiesList'],
        queryFn: async () => {
            const res = await PropertyService.getPropertiesList();
            if (!res.success) {
                throw new Error(res.message || 'Failed to fetch properties');
            }
            return res.properties || [];
        },
        staleTime: 5 * 60 * 1000,
    });

    // Dependent lists hooks
    const { data: floorsResponse } = usePropertyFloors(selectedProperty?.propertyId ?? 0);
    const floors = floorsResponse?.data ?? [];

    const { data: flatsResponse } = usePropertyFlats(
        selectedProperty?.propertyId ?? 0,
        selectedFloor?.floorNumber ?? undefined
    );
    const flats = flatsResponse?.data ?? [];

    const { data: templatesResponse } = useQuotationTemplates();
    const templates = templatesResponse?.data ?? [];

    // Search modals visibility state
    const [isLeadSelectOpen, setLeadSelectOpen] = useState(false);
    const [isPropertySelectOpen, setPropertySelectOpen] = useState(false);
    const [isFloorSelectOpen, setFloorSelectOpen] = useState(false);
    const [isFlatSelectOpen, setFlatSelectOpen] = useState(false);
    const [isTemplateSelectOpen, setTemplateSelectOpen] = useState(false);

    // Mutation hooks
    const createQuotationMutation = useCreateQuotation();
    const updateQuotationMutation = useUpdateQuotation();

    // Pre-fill form when selectedQuotation detail is fetched in Edit mode
    useEffect(() => {
        if (selectedQuotation && formMode === 'edit') {
            setSelectedLead({ leadId: selectedQuotation.leadId, fullName: selectedQuotation.leadName } as any);
            setSelectedProperty({ propertyId: selectedQuotation.propertyId, propertyName: selectedQuotation.propertyName } as any);
            if (selectedQuotation.floorId) {
                setSelectedFloor({ floorId: selectedQuotation.floorId, floorNumber: String(selectedQuotation.floorId), floorName: `Floor ${selectedQuotation.floorId}` });
            }
            if (selectedQuotation.flatId) {
                setSelectedFlat({ flatId: selectedQuotation.flatId, flatName: selectedQuotation.flatNumber ?? `Flat ${selectedQuotation.flatId}` } as any);
            }
            setValidUntilDate(selectedQuotation.validUntil ? selectedQuotation.validUntil.split('T')[0] : '');
            setNotes(selectedQuotation.notes || '');
            setDiscountAmount(String(selectedQuotation.discountAmount));
            setChangeReason('');
            if (selectedQuotation.items) {
                setLineItems(
                    selectedQuotation.items.map((i) => ({
                        itemType: i.itemType,
                        description: i.description,
                        amount: i.amount,
                        quantity: i.quantity,
                        total: i.total,
                    }))
                );
            }
        }
    }, [selectedQuotation, formMode]);

    // Calculate totals
    const calculateTotals = () => {
        const subtotal = lineItems.reduce((acc, item) => acc + item.total, 0);
        const disc = parseFloat(discountAmount) || 0;
        const taxable = Math.max(0, subtotal - disc);
        const tax = taxable * 0.05; // 5% GST
        const grand = taxable + tax;
        return { subtotal, tax, grand };
    };

    const { subtotal, tax, grand } = calculateTotals();

    // Save Quotation Handler
    const handleSaveQuotation = () => {
        if (!selectedLead?.leadId) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select a Lead.' });
            return;
        }
        if (!selectedProperty?.propertyId) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select a Property.' });
            return;
        }
        if (!selectedFloor?.floorId) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select a Floor.' });
            return;
        }
        if (!selectedFlat?.flatId) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select a Flat/Unit.' });
            return;
        }
        if (!validUntilDate || !validUntilDate.trim()) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter a Valid Until Date.' });
            return;
        }
        if (!notes || !notes.trim()) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter Notes & Terms Description.' });
            return;
        }
        if (formMode === 'edit' && (!changeReason || !changeReason.trim())) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter a Version Change Reason.' });
            return;
        }
        if (lineItems.length === 0) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please add at least one line item.' });
            return;
        }

        // Check if any line item has invalid details
        if (lineItems.some(item => !item.description?.trim())) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please fill descriptions for all line items.' });
            return;
        }
        if (lineItems.some(item => item.amount <= 0)) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'All line item amounts must be greater than zero.' });
            return;
        }
        if (lineItems.some(item => item.quantity <= 0)) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'All line item quantities must be greater than zero.' });
            return;
        }

        const disc = parseFloat(discountAmount) || 0;
        if (disc < 0) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Discount amount cannot be negative.' });
            return;
        }
        if (disc > subtotal) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Discount amount cannot exceed the subtotal.' });
            return;
        }

        const payload: QuotationCreateData = {
            leadId: selectedLead.leadId,
            propertyId: selectedProperty.propertyId,
            floorId: selectedFloor?.floorId,
            flatId: selectedFlat?.flatId,
            validUntil: validUntilDate ? new Date(validUntilDate).toISOString() : null,
            basePrice: subtotal,
            discountAmount: disc,
            notes: notes || null,
            items: lineItems.map((item) => ({
                itemType: item.itemType,
                description: item.description,
                amount: item.amount,
                quantity: item.quantity,
                total: item.total,
            })),
        };

        if (formMode === 'create') {
            createQuotationMutation.mutate(payload, {
                onSuccess: () => {
                    Toast.show({ type: 'success', text1: 'Success', text2: 'Quotation created successfully!' });
                    router.replace('/admin/SalesUnit/quotation');
                },
                onError: (err: any) => {
                    Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.message || err.message || 'Failed to create quotation.' });
                },
            });
        } else {
            const updatePayload: QuotationUpdateData = {
                ...payload,
                changeReason: changeReason || `Modified on ${new Date().toLocaleDateString()}`,
            };
            updateQuotationMutation.mutate(
                { id: selectedQuotationId!, data: updatePayload },
                {
                    onSuccess: () => {
                        Toast.show({ type: 'success', text1: 'Success', text2: 'Quotation updated successfully!' });
                        router.replace('/admin/SalesUnit/quotation');
                    },
                    onError: (err: any) => {
                        Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.message || err.message || 'Failed to update quotation.' });
                    },
                }
            );
        }
    };

    // Pre-fill fields from template
    const handleSelectTemplate = (template: QuotationTemplate) => {
        setSelectedTemplate(template);
        if (template.itemsJson) {
            try {
                const parsed = JSON.parse(template.itemsJson);
                const mappedItems = parsed.map((item: any) => ({
                    itemType: item.itemType || item.ItemType || 'Base',
                    description: item.description || item.Description || '',
                    amount: parseFloat(item.amount || item.Amount) || 0,
                    quantity: parseInt(item.quantity || item.Quantity) || 1,
                    total: parseFloat(item.total || item.Total) || 0,
                }));
                setLineItems(mappedItems);
            } catch (err) {
                console.error('Error parsing template itemsJson:', err);
            }
        }
    };

    const updateLineItem = (index: number, key: string, val: any) => {
        const updated = [...lineItems];
        const item = { ...updated[index] };
        if (key === 'amount') {
            item.amount = parseFloat(val) || 0;
        } else if (key === 'quantity') {
            item.quantity = parseInt(val) || 1;
        } else {
            (item as any)[key] = val;
        }
        item.total = item.amount * item.quantity;
        updated[index] = item;
        setLineItems(updated);
    };

    const addEmptyLineItem = () => {
        setLineItems([
            ...lineItems,
            { itemType: 'Base', description: '', amount: 0, quantity: 1, total: 0 },
        ]);
    };

    const removeLineItem = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const formatCurrency = (amount: number | null | undefined): string => {
        if (amount === null || amount === undefined) return '₹0.00';
        return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    };

    if (isDetailLoading && formMode === 'edit') {
        return (
            <View style={{ flex: 1, backgroundColor: theme.primaryBg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.brand} />
                <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Loading Quotation details...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, backgroundColor: theme.primaryBg }}
        >
            <View style={[styles.header]}>

                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                    {formMode === 'create' ? 'Create New Quotation' : 'Edit Quotation'}
                </Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                <View style={{ gap: 16 }}>
                    {/* Section 1: Lead & Property Selection */}
                        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Client & Property Configuration</Text>
                    <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>

                        {/* Lead Selection */}
                        <View style={{ marginTop: 12 }}>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                Select Lead <Text style={{ color: '#ef4444' }}>*</Text>
                            </Text>
                            <InlineDropdown
                                isOpen={isLeadSelectOpen}
                                onToggle={() => {
                                    setLeadSelectOpen(!isLeadSelectOpen);
                                    setPropertySelectOpen(false);
                                    setFloorSelectOpen(false);
                                    setFlatSelectOpen(false);
                                    setTemplateSelectOpen(false);
                                }}
                                selectedValueLabel={selectedLead ? selectedLead.fullName : ''}
                                placeholder="Choose Lead..."
                                items={leadsList}
                                loading={isLeadsLoading}
                                searchKey="fullName"
                                labelKey="fullName"
                                secondaryLabelKey="phone"
                                onSelect={(lead) => {
                                    setSelectedLead(lead);
                                    setLeadSelectOpen(false);
                                }}
                                theme={theme}
                            />
                        </View>

                        {/* Property Selection */}
                        <View style={{ marginTop: 12 }}>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                Select Property <Text style={{ color: '#ef4444' }}>*</Text>
                            </Text>
                            <InlineDropdown
                                isOpen={isPropertySelectOpen}
                                onToggle={() => {
                                    setPropertySelectOpen(!isPropertySelectOpen);
                                    setLeadSelectOpen(false);
                                    setFloorSelectOpen(false);
                                    setFlatSelectOpen(false);
                                    setTemplateSelectOpen(false);
                                }}
                                selectedValueLabel={selectedProperty ? selectedProperty.propertyName : ''}
                                placeholder="Choose Property..."
                                items={propertiesList}
                                loading={isPropertiesLoading}
                                searchKey="propertyName"
                                labelKey="propertyName"
                                secondaryLabelKey="location"
                                onSelect={(property) => {
                                    setSelectedProperty(property);
                                    setSelectedFloor(null);
                                    setSelectedFlat(null);
                                    setPropertySelectOpen(false);
                                }}
                                theme={theme}
                            />
                        </View>

                        {/* Floors & Flats Selection */}
                        {selectedProperty ? (
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                        Floor <Text style={{ color: '#ef4444' }}>*</Text>
                                    </Text>
                                    <InlineDropdown
                                        isOpen={isFloorSelectOpen}
                                        onToggle={() => {
                                            setFloorSelectOpen(!isFloorSelectOpen);
                                            setLeadSelectOpen(false);
                                            setPropertySelectOpen(false);
                                            setFlatSelectOpen(false);
                                            setTemplateSelectOpen(false);
                                        }}
                                        selectedValueLabel={selectedFloor ? selectedFloor.floorName : ''}
                                        placeholder="Choose Floor..."
                                        items={floors}
                                        searchKey="floorName"
                                        labelKey="floorName"
                                        onSelect={(floor) => {
                                            setSelectedFloor(floor);
                                            setSelectedFlat(null);
                                            setFloorSelectOpen(false);
                                        }}
                                        theme={theme}
                                    />
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                        Flat/Unit <Text style={{ color: '#ef4444' }}>*</Text>
                                    </Text>
                                    <InlineDropdown
                                        isOpen={isFlatSelectOpen}
                                        onToggle={() => {
                                            setFlatSelectOpen(!isFlatSelectOpen);
                                            setLeadSelectOpen(false);
                                            setPropertySelectOpen(false);
                                            setFloorSelectOpen(false);
                                            setTemplateSelectOpen(false);
                                        }}
                                        selectedValueLabel={selectedFlat ? selectedFlat.flatName : ''}
                                        placeholder="Choose Flat..."
                                        items={flats}
                                        searchKey="flatName"
                                        labelKey="flatName"
                                        secondaryLabelKey="bhk"
                                        onSelect={(flat) => {
                                            setSelectedFlat(flat);
                                            setFlatSelectOpen(false);
                                            if (lineItems.length === 0 && flat.price > 0) {
                                                setLineItems([
                                                    {
                                                        itemType: 'Base',
                                                        description: `Base flat price for flat ${flat.flatName}`,
                                                        amount: flat.price,
                                                        quantity: 1,
                                                        total: flat.price,
                                                    },
                                                ]);
                                            }
                                        }}
                                        theme={theme}
                                    />
                                </View>
                            </View>
                        ) : null}
                    </View>

                    {/* Section 2: Templates & Validity */}
                        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Validity</Text>
                    <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>



                        {/* Valid Until Date */}
                        <View style={{ marginTop: 12 }}>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                Valid Until (YYYY-MM-DD) <Text style={{ color: '#ef4444' }}>*</Text>
                            </Text>
                            <View style={[styles.formInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                <TextInput
                                    style={[styles.formTextInput, { color: theme.textPrimary }]}
                                    placeholder="e.g. 2026-08-22"
                                    placeholderTextColor={theme.textMuted}
                                    value={validUntilDate}
                                    onChangeText={setValidUntilDate}
                                />
                                <Calendar size={16} color={theme.textSecondary} />
                            </View>
                        </View>
                    </View>

                    {/* Section 3: Line Items Builder */}
                            <Text style={[styles.sectionTitle, { color: theme.textSecondary}]}>Line Items Builder</Text>
                    <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <TouchableOpacity onPress={addEmptyLineItem} style={[styles.addItemBtn, { borderColor: theme.brand }]}>
                                <Plus size={14} color={theme.brand} />
                                <Text style={{ color: theme.brand, fontWeight: '600', fontSize: 13 }}>Add Item</Text>
                            </TouchableOpacity>
                        </View>

                        {lineItems.length > 0 ? (
                            <View style={{ gap: 12, marginTop: 12 }}>
                                {lineItems.map((item, idx) => (
                                    <View key={idx} style={[styles.itemEditorCard, { backgroundColor: theme.inputBg, borderColor: theme.border, padding: 14 }]}>
                                        {/* Row 1: Header (Item # and delete) */}
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <View style={{ backgroundColor: theme.brand, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' }}>
                                                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 11 }}>{idx + 1}</Text>
                                                </View>
                                                <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 14 }}>Line Item</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => removeLineItem(idx)} style={{ padding: 4 }}>
                                                <Trash2 size={16} color="#dc2626" />
                                            </TouchableOpacity>
                                        </View>

                                        {/* Row 2: Item Type Selector (Horizontal Wrap Chips) */}
                                        <View style={{ marginBottom: 12 }}>
                                            <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 }}>Type</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                                {ITEM_TYPES.map((type) => {
                                                    const isTypeSelected = item.itemType === type;
                                                    return (
                                                        <TouchableOpacity
                                                            key={type}
                                                            onPress={() => updateLineItem(idx, 'itemType', type)}
                                                            activeOpacity={0.7}
                                                            style={{
                                                                paddingHorizontal: 12,
                                                                paddingVertical: 6,
                                                                borderRadius: 8,
                                                                backgroundColor: isTypeSelected ? theme.brand : theme.secondaryBg,
                                                                borderWidth: 1,
                                                                borderColor: isTypeSelected ? theme.brand : theme.border,
                                                            }}
                                                        >
                                                            <Text style={{ fontSize: 11, fontWeight: '600', color: isTypeSelected ? '#ffffff' : theme.textSecondary }}>{type}</Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </View>

                                        {/* Row 3: Description Input */}
                                        <View style={{ marginBottom: 12 }}>
                                            <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 }}>Description</Text>
                                            <TextInput
                                                style={{
                                                    backgroundColor: theme.secondaryBg,
                                                    color: theme.textPrimary,
                                                    borderColor: theme.border,
                                                    borderWidth: 1,
                                                    borderRadius: 8,
                                                    paddingHorizontal: 10,
                                                    paddingVertical: 8,
                                                    fontSize: 13,
                                                }}
                                                placeholder="Description of work, materials, etc..."
                                                placeholderTextColor={theme.textMuted}
                                                value={item.description}
                                                onChangeText={(val) => updateLineItem(idx, 'description', val)}
                                            />
                                        </View>

                                        {/* Row 4: Pricing Config (Grid layout) */}
                                        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
                                            <View style={{ flex: 1.5 }}>
                                                <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 }}>Price / Unit (₹)</Text>
                                                <TextInput
                                                    style={{
                                                        backgroundColor: theme.secondaryBg,
                                                        color: theme.textPrimary,
                                                        borderColor: theme.border,
                                                        borderWidth: 1,
                                                        borderRadius: 8,
                                                        paddingHorizontal: 10,
                                                        paddingVertical: 8,
                                                        fontSize: 13,
                                                    }}
                                                    placeholder="0.00"
                                                    keyboardType="numeric"
                                                    placeholderTextColor={theme.textMuted}
                                                    value={String(item.amount || '')}
                                                    onChangeText={(val) => updateLineItem(idx, 'amount', val)}
                                                />
                                            </View>

                                            <View style={{ width: 80 }}>
                                                <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 }}>Quantity</Text>
                                                <TextInput
                                                    style={{
                                                        backgroundColor: theme.secondaryBg,
                                                        color: theme.textPrimary,
                                                        borderColor: theme.border,
                                                        borderWidth: 1,
                                                        borderRadius: 8,
                                                        paddingHorizontal: 10,
                                                        paddingVertical: 8,
                                                        fontSize: 13,
                                                        textAlign: 'center',
                                                    }}
                                                    placeholder="1"
                                                    keyboardType="numeric"
                                                    placeholderTextColor={theme.textMuted}
                                                    value={String(item.quantity || '')}
                                                    onChangeText={(val) => updateLineItem(idx, 'quantity', val)}
                                                />
                                            </View>

                                            <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6 }}>
                                                <Text style={{ fontSize: 10, color: theme.textMuted, marginBottom: 2 }}>Subtotal</Text>
                                                <Text style={{ color: theme.brand, fontWeight: '800', fontSize: 15 }}>
                                                    {formatCurrency(item.total)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text style={{ color: theme.textSecondary, fontStyle: 'italic', textAlign: 'center', marginVertical: 20 }}>
                                No items added yet. Click "Add Item" to customize pricing.
                            </Text>
                        )}
                    </View>

                    {/* Section 4: Discount & Financial Summary */}
                        <Text style={[styles.sectionTitle, { color: theme.textSecondary}]}>Summary & Discounts</Text>
                    <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>

                        {/* Discount */}
                        <View style={{ marginTop: 12 }}>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Discount Amount (INR)</Text>
                            <View style={[styles.formInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                <TextInput
                                    style={[styles.formTextInput, { color: theme.textPrimary }]}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    placeholderTextColor={theme.textMuted}
                                    value={discountAmount}
                                    onChangeText={setDiscountAmount}
                                />
                            </View>
                        </View>

                        {/* Summary Cards */}
                        <View style={[styles.summaryCard, { backgroundColor: theme.inputBg, borderColor: theme.border, marginTop: 14 }]}>
                            <View style={styles.summaryRow}>
                                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Items Subtotal</Text>
                                <Text style={{ color: theme.textPrimary, fontWeight: '500' }}>{formatCurrency(subtotal)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Discounts Applied</Text>
                                <Text style={{ color: '#dc2626', fontWeight: '500' }}>-{formatCurrency(parseFloat(discountAmount) || 0)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>GST Tax (5%)</Text>
                                <Text style={{ color: theme.textPrimary, fontWeight: '500' }}>{formatCurrency(tax)}</Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 8 }]} />
                            <View style={styles.summaryRow}>
                                <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 14 }}>Grand Total</Text>
                                <Text style={{ color: theme.brand, fontWeight: '800', fontSize: 16 }}>{formatCurrency(grand)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Section 5: Notes & Explain Modifies */}
                        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Notes & History Changes</Text>
                    <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>

                        {/* Notes */}
                        <View style={{ marginTop: 12 }}>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                Notes & Terms Description <Text style={{ color: '#ef4444' }}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.notesTextArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                                multiline
                                numberOfLines={4}
                                placeholder="Include custom offer messages, special T&C..."
                                placeholderTextColor={theme.textMuted}
                                value={notes}
                                onChangeText={setNotes}
                            />
                        </View>

                        {/* Change Reason (Edit Mode only) */}
                        {formMode === 'edit' ? (
                            <View style={{ marginTop: 12 }}>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                    Version Change Reason <Text style={{ color: '#ef4444' }}>*</Text>
                                </Text>
                                <TextInput
                                    style={[styles.notesTextArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                                    placeholder="Explain details of modification to keep track in history log..."
                                    placeholderTextColor={theme.textMuted}
                                    value={changeReason}
                                    onChangeText={setChangeReason}
                                />
                            </View>
                        ) : null}
                    </View>

                    {/* Submit Action */}
                    <TouchableOpacity
                        onPress={handleSaveQuotation}
                        disabled={createQuotationMutation.isPending || updateQuotationMutation.isPending}
                        style={[styles.submitBtn, { backgroundColor: theme.brand }]}
                    >
                        {createQuotationMutation.isPending || updateQuotationMutation.isPending ? (
                            <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>
                                {formMode === 'create' ? 'Create & Save Quotation' : 'Update & Save (New Version)'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal:10,
        paddingTop: 16,
        paddingBottom:8,
    },
  
    headerTitle: {
        fontSize: 17,
        fontWeight: '500',
        marginLeft: 8,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
    },
    selectBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 12,
    },
    formInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 12,
    },
    formTextInput: {
        flex: 1,
        fontSize: 14,
    },
    addItemBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        gap: 4,
    },
    itemEditorCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        gap: 6,
    },

    summaryCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        gap: 6,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    divider: {
        height: 1,
    },
    notesTextArea: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        height: 80,
        textAlignVertical: 'top',
        fontSize: 13,
    },
    submitBtn: {
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
});
