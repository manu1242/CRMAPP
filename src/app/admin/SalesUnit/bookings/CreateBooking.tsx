import React, { useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import {
    Search,
    ChevronLeft,
    ChevronDown,
    Trash2,
    X,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import {
    useCreateBooking,
    useUploadBookingFile,
} from '../../../../admin/hooks/useBookings';
import {
    usePropertyFloors,
    usePropertyFlats,
    useQuotations,
} from '../../../../admin/hooks/useQuotations';
import { LeadService } from '../../../../admin/services/LeadService';
import { PropertyService } from '../../../../admin/services/PropertyService';
import { LeadItem } from '../../../../admin/models/LeadTypes';
import { PropertyItem } from '../../../../admin/models/PropertyTypes';
import { PropertyFloor, PropertyFlat } from '../../../../admin/models/QuoatationTypes';

const PAYMENT_TYPES = ['EMI', 'Lump Sum', 'Bank Finance', 'Self Funding'];

function formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '₹0.00';
    return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

// ─── Inline Dropdown ──────────────────────────────────────────────────────────
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
    const filteredItems = items.filter((item) =>
        String(item[searchKey] || '').toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <View style={{ gap: 4 }}>
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
                        elevation: 4,
                    }}
                >
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
                        <Search size={14} color={theme.textSecondary} />
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CreateBookingScreen() {
    const router = useRouter();
    const { isDark } = useTheme();
    const theme = getAdminTheme(isDark);

    // Form state
    const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
    const [selectedProperty, setSelectedProperty] = useState<PropertyItem | null>(null);
    const [selectedFloor, setSelectedFloor] = useState<PropertyFloor | null>(null);
    const [selectedFlat, setSelectedFlat] = useState<PropertyFlat | null>(null);
    const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(null);
    const [selectedQuotationNumber, setSelectedQuotationNumber] = useState<string>('');
    const [bookingAmount, setBookingAmount] = useState('200000');
    const [totalAmount, setTotalAmount] = useState('5000000');
    const [paymentType, setPaymentType] = useState('EMI');
    const [notes, setNotes] = useState('');
    const [agreementDate, setAgreementDate] = useState(new Date().toISOString().split('T')[0]);
    const [possessionDate, setPossessionDate] = useState(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 2);
        return d.toISOString().split('T')[0];
    });
    const [uploadedDocuments, setUploadedDocuments] = useState<
        { documentType: string; documentName: string; filePath: string }[]
    >([]);
    const [isUploading, setIsUploading] = useState(false);

    // Dropdown lists
    const [leadsList, setLeadsList] = useState<LeadItem[]>([]);
    const [propertiesList, setPropertiesList] = useState<PropertyItem[]>([]);
    const [isLeadsLoading, setLeadsLoading] = useState(false);
    const [isPropertiesLoading, setPropertiesLoading] = useState(false);

    // Dependent hooks
    const { data: floorsResponse } = usePropertyFloors(selectedProperty?.propertyId ?? 0);
    const floors = floorsResponse?.data ?? [];
    const { data: flatsResponse } = usePropertyFlats(
        selectedProperty?.propertyId ?? 0,
        selectedFloor?.floorNumber ?? undefined
    );
    const flats = flatsResponse?.data ?? [];

    // Quotations
    const { data: quotationsResponse } = useQuotations(1, 100);
    const allAcceptedQuotations = (quotationsResponse?.data?.items ?? []).filter((q) => q.status === 'Accepted');

    // Dropdown open state
    const [isLeadOpen, setLeadOpen] = useState(false);
    const [isPropertyOpen, setPropertyOpen] = useState(false);
    const [isFloorOpen, setFloorOpen] = useState(false);
    const [isFlatOpen, setFlatOpen] = useState(false);
    const [isQuotationOpen, setQuotationOpen] = useState(false);

    const createBookingMutation = useCreateBooking();
    const uploadBookingFileMutation = useUploadBookingFile();

    // Load dropdowns on mount
    useEffect(() => {
        (async () => {
            try {
                setLeadsLoading(true);
                setPropertiesLoading(true);
                const [leadsRes, propsRes] = await Promise.all([
                    LeadService.getLeads({ page: 1, pageSize: 100 }),
                    PropertyService.getPropertiesList(),
                ]);
                if (leadsRes.success && leadsRes.data?.items) setLeadsList(leadsRes.data.items);
                if (propsRes.success && propsRes.properties) setPropertiesList(propsRes.properties);
            } catch (err) {
                console.error('Error loading dropdown lists:', err);
            } finally {
                setLeadsLoading(false);
                setPropertiesLoading(false);
            }
        })();
    }, []);

    const closeAllDropdowns = () => {
        setLeadOpen(false);
        setPropertyOpen(false);
        setFloorOpen(false);
        setFlatOpen(false);
        setQuotationOpen(false);
    };

    // Document upload
    const handlePickAndUploadDocument = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Media library access is required.' });
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images', 'videos'],
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setIsUploading(true);

                const formData = new FormData();
                const fileName = asset.fileName || `booking_doc_${Date.now()}.jpg`;
                const mimeType = asset.mimeType || 'image/jpeg';

                formData.append('file', {
                    uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
                    name: fileName,
                    type: mimeType,
                } as any);

                const uploadRes = await uploadBookingFileMutation.mutateAsync(formData);
                setIsUploading(false);

                if (uploadRes.success && uploadRes.data) {
                    const uploadedFile = uploadRes.data;
                    let docType = 'Aadhar';
                    const lowerName = fileName.toLowerCase();
                    if (lowerName.includes('pan')) docType = 'PAN';
                    else if (lowerName.includes('cheque')) docType = 'Cheque';
                    else if (lowerName.includes('agreement')) docType = 'Agreement';
                    else if (lowerName.includes('passport')) docType = 'Passport';

                    setUploadedDocuments((prev) => [
                        ...prev,
                        { documentType: docType, documentName: uploadedFile.fileName, filePath: uploadedFile.urlPath },
                    ]);
                    Toast.show({ type: 'success', text1: 'Uploaded', text2: 'Document uploaded successfully!' });
                } else {
                    Toast.show({ type: 'error', text1: 'Upload Failed', text2: 'Document upload failed. Please try again.' });
                }
            }
        } catch (err: any) {
            setIsUploading(false);
            Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to select or upload document.' });
        }
    };

    const handleRemoveDoc = (index: number) => {
        setUploadedDocuments((prev) => prev.filter((_, i) => i !== index));
    };

    // Create booking
    const handleCreateBooking = () => {
        if (!selectedQuotationId) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select an Accepted Quotation.' });
            return;
        }
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (agreementDate && !dateRegex.test(agreementDate.trim())) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Agreement Date must be in YYYY-MM-DD format.' });
            return;
        }
        if (possessionDate && !dateRegex.test(possessionDate.trim())) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Possession Date must be in YYYY-MM-DD format.' });
            return;
        }

        const payload = {
            quotationId: selectedQuotationId,
            bookingAmount: parseFloat(bookingAmount) || 0,
            paymentType,
            agreementDate: agreementDate ? `${agreementDate.trim()}T00:00:00Z` : null,
            possessionDate: possessionDate ? `${possessionDate.trim()}T00:00:00Z` : null,
            notes: notes || null,
            documents: uploadedDocuments.length > 0 ? uploadedDocuments : undefined,
        };

        createBookingMutation.mutate(payload, {
            onSuccess: () => {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Property booking created successfully!' });
                router.replace('/admin/SalesUnit/bookings');
            },
            onError: (err: any) => {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: err.response?.data?.message || err.message || 'Failed to create booking.',
                });
            },
        });
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, backgroundColor: theme.primaryBg }}
        >
            {/* Header */}
            <View style={[styles.header]}>
              
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>New Booking</Text>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={{ gap: 16 }}>

                    {/* ── Section: Quotation ─────────────────────────────── */}
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Select Accepted Quotation</Text>
                    <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <InlineDropdown
                            isOpen={isQuotationOpen}
                            onToggle={() => { closeAllDropdowns(); setQuotationOpen(!isQuotationOpen); }}
                            selectedValueLabel={selectedQuotationNumber}
                            placeholder="Choose Accepted Quotation..."
                            items={allAcceptedQuotations}
                            searchKey="quotationNumber"
                            labelKey="quotationNumber"
                            secondaryLabelKey="leadName"
                            onSelect={(q) => {
                                setSelectedQuotationId(q.quotationId);
                                setSelectedQuotationNumber(q.quotationNumber);
                                setSelectedLead({ leadId: q.leadId, fullName: q.leadName } as any);
                                setSelectedProperty({ propertyId: q.propertyId, propertyName: q.propertyName } as any);
                                setSelectedFlat({ flatId: q.flatId ?? 0, flatName: q.flatNumber ?? '', price: q.basePrice } as any);
                                setTotalAmount(String(q.grandTotal));
                                setBookingAmount(String(Math.round(q.grandTotal * 0.2)));
                                setQuotationOpen(false);
                            }}
                            theme={theme}
                        />

                        {selectedQuotationId ? (
                            <View style={{ marginTop: 12, gap: 4 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 12, color: theme.brand, fontWeight: '700' }}>Quotation Details</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSelectedQuotationId(null);
                                            setSelectedQuotationNumber('');
                                            setSelectedLead(null);
                                            setSelectedProperty(null);
                                            setSelectedFloor(null);
                                            setSelectedFlat(null);
                                            setTotalAmount('5000000');
                                            setBookingAmount('200000');
                                        }}
                                    >
                                        <Text style={{ color: '#dc2626', fontSize: 11, fontWeight: '700' }}>Clear</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                                    <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>Client: </Text>
                                    {selectedLead?.fullName}
                                </Text>
                                <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                                    <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>Property: </Text>
                                    {selectedProperty?.propertyName}
                                </Text>
                                <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                                    <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>Unit: </Text>
                                    {selectedFlat?.flatName}
                                </Text>
                                <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                                    <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>Total Value: </Text>
                                    {formatCurrency(parseFloat(totalAmount) || 0)}
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    {/* ── Section: Manual Selectors (when no quotation) ─── */}
                    {!selectedQuotationId && (
                        <>
                            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Or Fill Manually</Text>
                            <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border, gap: 14 }]}>
                                {/* Lead */}
                                <View>
                                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                        Select Lead <Text style={{ color: '#ef4444' }}>*</Text>
                                    </Text>
                                    <InlineDropdown
                                        isOpen={isLeadOpen}
                                        onToggle={() => { closeAllDropdowns(); setLeadOpen(!isLeadOpen); }}
                                        selectedValueLabel={selectedLead?.fullName ?? ''}
                                        placeholder="Choose Lead..."
                                        items={leadsList}
                                        loading={isLeadsLoading}
                                        searchKey="fullName"
                                        labelKey="fullName"
                                        secondaryLabelKey="phone"
                                        onSelect={(lead) => { setSelectedLead(lead); setLeadOpen(false); }}
                                        theme={theme}
                                    />
                                </View>

                                {/* Property */}
                                <View>
                                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                        Select Property <Text style={{ color: '#ef4444' }}>*</Text>
                                    </Text>
                                    <InlineDropdown
                                        isOpen={isPropertyOpen}
                                        onToggle={() => { closeAllDropdowns(); setPropertyOpen(!isPropertyOpen); }}
                                        selectedValueLabel={selectedProperty?.propertyName ?? ''}
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
                                            setPropertyOpen(false);
                                        }}
                                        theme={theme}
                                    />
                                </View>

                                {/* Floor & Flat */}
                                {selectedProperty && (
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Floor</Text>
                                            <InlineDropdown
                                                isOpen={isFloorOpen}
                                                onToggle={() => { closeAllDropdowns(); setFloorOpen(!isFloorOpen); }}
                                                selectedValueLabel={selectedFloor?.floorName ?? ''}
                                                placeholder="Floor..."
                                                items={floors}
                                                searchKey="floorName"
                                                labelKey="floorName"
                                                onSelect={(floor) => { setSelectedFloor(floor); setSelectedFlat(null); setFloorOpen(false); }}
                                                theme={theme}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                                Flat/Unit <Text style={{ color: '#ef4444' }}>*</Text>
                                            </Text>
                                            <InlineDropdown
                                                isOpen={isFlatOpen}
                                                onToggle={() => { closeAllDropdowns(); setFlatOpen(!isFlatOpen); }}
                                                selectedValueLabel={selectedFlat?.flatName ?? ''}
                                                placeholder="Flat..."
                                                items={flats}
                                                searchKey="flatName"
                                                labelKey="flatName"
                                                secondaryLabelKey="bhk"
                                                onSelect={(flat) => {
                                                    setSelectedFlat(flat);
                                                    if (flat.price > 0) setTotalAmount(String(flat.price));
                                                    setFlatOpen(false);
                                                }}
                                                theme={theme}
                                            />
                                        </View>
                                    </View>
                                )}

                                {/* Total Amount */}
                                <View>
                                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                        Total Final Value (INR) <Text style={{ color: '#ef4444' }}>*</Text>
                                    </Text>
                                    <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                        <TextInput
                                            style={[styles.textInput, { color: theme.textPrimary }]}
                                            placeholder="5000000"
                                            keyboardType="numeric"
                                            placeholderTextColor={theme.textMuted}
                                            value={totalAmount}
                                            onChangeText={(val) => {
                                                setTotalAmount(val);
                                                setBookingAmount(String(Math.round((parseFloat(val) || 0) * 0.2)));
                                            }}
                                        />
                                    </View>
                                </View>
                            </View>
                        </>
                    )}

                    {/* ── Section: Booking Details ───────────────────────── */}
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Booking Details</Text>
                    <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border, gap: 14 }]}>
                        {/* Booking Amount */}
                        <View>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                Booking Advance Amount (INR) <Text style={{ color: '#ef4444' }}>*</Text>
                            </Text>
                            <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                <TextInput
                                    style={[styles.textInput, { color: theme.textPrimary }]}
                                    placeholder="200000"
                                    keyboardType="numeric"
                                    placeholderTextColor={theme.textMuted}
                                    value={bookingAmount}
                                    onChangeText={setBookingAmount}
                                />
                            </View>
                            <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 4 }}>
                                Default token amount is 20% of total value (
                                {formatCurrency((parseFloat(totalAmount) || 0) * 0.2)})
                            </Text>
                        </View>

                        {/* Payment Type */}
                        <View>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Payment Type</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                                {PAYMENT_TYPES.map((type) => {
                                    const isSelected = paymentType === type;
                                    return (
                                        <TouchableOpacity
                                            key={type}
                                            onPress={() => setPaymentType(type)}
                                            style={[
                                                styles.pill,
                                                {
                                                    backgroundColor: isSelected ? theme.brand : theme.secondaryBg,
                                                    borderColor: isSelected ? theme.brand : theme.border,
                                                },
                                            ]}
                                        >
                                            <Text style={[styles.pillText, { color: isSelected ? '#ffffff' : theme.textSecondary }]}>
                                                {type}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* Agreement Date */}
                        <View>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                Agreement Date (YYYY-MM-DD) <Text style={{ color: '#ef4444' }}>*</Text>
                            </Text>
                            <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                <TextInput
                                    style={[styles.textInput, { color: theme.textPrimary }]}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={theme.textMuted}
                                    value={agreementDate}
                                    onChangeText={setAgreementDate}
                                />
                            </View>
                        </View>

                        {/* Possession Date */}
                        <View>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                Expected Possession Date (YYYY-MM-DD) <Text style={{ color: '#ef4444' }}>*</Text>
                            </Text>
                            <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                <TextInput
                                    style={[styles.textInput, { color: theme.textPrimary }]}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={theme.textMuted}
                                    value={possessionDate}
                                    onChangeText={setPossessionDate}
                                />
                            </View>
                        </View>
                    </View>

                    {/* ── Section: Documents ────────────────────────────── */}
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Documents (Optional)</Text>
                    <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <TouchableOpacity
                            onPress={handlePickAndUploadDocument}
                            disabled={isUploading}
                            style={{
                                borderWidth: 1.5,
                                borderStyle: 'dashed',
                                borderColor: theme.brand,
                                borderRadius: 12,
                                padding: 16,
                                alignItems: 'center',
                                backgroundColor: theme.inputBg,
                            }}
                        >
                            {isUploading ? (
                                <ActivityIndicator size="small" color={theme.brand} />
                            ) : (
                                <>
                                    <Text style={{ color: theme.brand, fontWeight: '700', fontSize: 13 }}>Click to upload documents</Text>
                                    <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 4 }}>
                                        Aadhar, PAN, Agreement, Cheque copy, etc.
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {uploadedDocuments.length > 0 && (
                            <View style={{ marginTop: 10, gap: 6 }}>
                                {uploadedDocuments.map((doc, index) => (
                                    <View
                                        key={index}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            paddingHorizontal: 12,
                                            paddingVertical: 8,
                                            backgroundColor: theme.inputBg,
                                            borderColor: theme.border,
                                            borderWidth: 1,
                                            borderRadius: 10,
                                        }}
                                    >
                                        <View style={{ flex: 1, marginRight: 8 }}>
                                            <Text style={{ color: theme.textPrimary, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
                                                {doc.documentName}
                                            </Text>
                                            <Text style={{ color: theme.textMuted, fontSize: 10 }}>Type: {doc.documentType}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => handleRemoveDoc(index)} style={{ padding: 4 }}>
                                            <Trash2 size={16} color="#dc2626" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* ── Section: Notes ────────────────────────────────── */}
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Notes</Text>
                    <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <TextInput
                            style={[styles.notesArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                            multiline
                            numberOfLines={4}
                            placeholder="Booking requirements, milestones, CP commission notes..."
                            placeholderTextColor={theme.textMuted}
                            value={notes}
                            onChangeText={setNotes}
                        />
                    </View>

                    {/* ── Submit ────────────────────────────────────────── */}
                    {createBookingMutation.isPending ? (
                        <ActivityIndicator size="small" color={theme.brand} style={{ marginVertical: 10 }} />
                    ) : (
                        <TouchableOpacity
                            onPress={handleCreateBooking}
                            style={[styles.submitBtn, { backgroundColor: theme.brand }]}
                        >
                            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>Create Booking</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        gap: 8,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 17, fontWeight: '600' },
    sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: -8 },
    card: { borderRadius: 16, borderWidth: 1, padding: 16 },
    inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
    selectBox: {
        flexDirection: 'row',
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    inputRow: {
        flexDirection: 'row',
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 14,
        alignItems: 'center',
    },
    textInput: { flex: 1, fontSize: 13 },
    pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    pillText: { fontSize: 12, fontWeight: '600' },
    notesArea: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        textAlignVertical: 'top',
        fontSize: 13,
        minHeight: 90,
    },
    submitBtn: {
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
});
