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
    Modal,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    Search,
    ChevronLeft,
    ChevronDown,
    Trash2,
    X,
    FileText,
    Camera,
    Image as ImageIcon,
    Plus,
    Check,
    Paperclip,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
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
const BOOKING_DOC_TYPES = ['Aadhar', 'PAN', 'Agreement', 'Cheque', 'Passport', 'Allotment Letter', 'Salary Slip', 'Bank Statement', 'Other'];

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
        {
            documentType: string;
            documentName: string;
            filePath: string;
            isPdf?: boolean;
            fileSize?: number;
        }[]
    >([]);
    const [isUploading, setIsUploading] = useState(false);
    const [pickerModalOpen, setPickerModalOpen] = useState(false);

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

    // Upload helper to server
    const uploadFileToServer = async (fileUri: string, rawName: string, mimeType: string, fileSize?: number) => {
        try {
            setIsUploading(true);
            const formData = new FormData();
            const cleanName = rawName || `doc_${Date.now()}`;
            formData.append('file', {
                uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
                name: cleanName,
                type: mimeType || 'application/octet-stream',
            } as any);

            const uploadRes = await uploadBookingFileMutation.mutateAsync(formData);

            if (uploadRes.success && uploadRes.data) {
                const uploadedFile = uploadRes.data;
                let defaultType = 'Aadhar';
                const lower = cleanName.toLowerCase();
                if (lower.includes('pan')) defaultType = 'PAN';
                else if (lower.includes('cheque')) defaultType = 'Cheque';
                else if (lower.includes('agreement')) defaultType = 'Agreement';
                else if (lower.includes('passport')) defaultType = 'Passport';
                else if (lower.includes('allotment')) defaultType = 'Allotment Letter';
                else if (lower.includes('salary')) defaultType = 'Salary Slip';
                else if (lower.includes('statement')) defaultType = 'Bank Statement';

                const isPdf = mimeType.includes('pdf') || cleanName.toLowerCase().endsWith('.pdf');

                setUploadedDocuments((prev) => [
                    ...prev,
                    {
                        documentType: defaultType,
                        documentName: uploadedFile.fileName || cleanName,
                        filePath: uploadedFile.urlPath,
                        isPdf,
                        fileSize: fileSize || uploadedFile.fileSize,
                    },
                ]);
                Toast.show({ type: 'success', text1: 'Uploaded', text2: `${cleanName} uploaded successfully!` });
            } else {
                Toast.show({ type: 'error', text1: 'Upload Failed', text2: 'Document upload failed. Please try again.' });
            }
        } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Upload Error', text2: err.message || 'Failed to upload file.' });
        } finally {
            setIsUploading(false);
        }
    };

    // 1. Pick Document (PDF, Word, etc.)
    const handlePickDocument = async () => {
        setPickerModalOpen(false);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*', 'text/plain'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                await uploadFileToServer(
                    file.uri,
                    file.name || `doc_${Date.now()}.pdf`,
                    file.mimeType || 'application/pdf',
                    file.size
                );
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to select document.');
        }
    };

    // 2. Pick Image from Gallery
    const handlePickImage = async () => {
        setPickerModalOpen(false);
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permission Denied', 'We need photo library permission to upload images.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                await uploadFileToServer(
                    asset.uri,
                    asset.fileName || `photo_${Date.now()}.jpg`,
                    asset.mimeType || 'image/jpeg',
                    asset.fileSize
                );
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to select photo.');
        }
    };

    // 3. Take Photo with Camera
    const handleTakePhoto = async () => {
        setPickerModalOpen(false);
        try {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permission Denied', 'We need camera permission to capture document photos.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                await uploadFileToServer(
                    asset.uri,
                    `camera_${Date.now()}.jpg`,
                    asset.mimeType || 'image/jpeg',
                    asset.fileSize
                );
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to capture photo.');
        }
    };

    const handleUpdateDocType = (index: number, newType: string) => {
        setUploadedDocuments((prev) =>
            prev.map((doc, idx) => (idx === index ? { ...doc, documentType: newType } : doc))
        );
    };

    const handleUpdateDocName = (index: number, newName: string) => {
        setUploadedDocuments((prev) =>
            prev.map((doc, idx) => (idx === index ? { ...doc, documentName: newName } : doc))
        );
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
            documents: uploadedDocuments.length > 0
                ? uploadedDocuments.map((d) => ({
                    documentType: d.documentType,
                    documentName: d.documentName || 'Document',
                    filePath: d.filePath,
                }))
                : undefined,
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
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backBtn, { backgroundColor: theme.inputBg }]}
                >
                    <ChevronLeft size={20} color={theme.textPrimary} />
                </TouchableOpacity>
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

                    {/* ── Section: Documents & Photos ──────────────────── */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginBottom: 0 }]}>Documents & Photos (Optional)</Text>
                        <TouchableOpacity
                            onPress={() => setPickerModalOpen(true)}
                            disabled={isUploading}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: `${theme.brand}15`,
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                                borderRadius: 10,
                                gap: 4,
                            }}
                        >
                            <Plus size={13} color={theme.brand} />
                            <Text style={{ color: theme.brand, fontSize: 11, fontWeight: '700' }}>Add File</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border, gap: 12 }]}>
                        {/* Upload Trigger Area */}
                        <TouchableOpacity
                            onPress={() => setPickerModalOpen(true)}
                            disabled={isUploading}
                            activeOpacity={0.8}
                            style={{
                                borderWidth: 1.5,
                                borderStyle: 'dashed',
                                borderColor: theme.brand,
                                borderRadius: 14,
                                paddingVertical: 18,
                                paddingHorizontal: 16,
                                alignItems: 'center',
                                backgroundColor: theme.inputBg,
                                gap: 8,
                            }}
                        >
                            {isUploading ? (
                                <View style={{ alignItems: 'center', gap: 8 }}>
                                    <ActivityIndicator size="small" color={theme.brand} />
                                    <Text style={{ color: theme.brand, fontSize: 13, fontWeight: '600' }}>Uploading to server...</Text>
                                </View>
                            ) : (
                                <>
                                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${theme.brand}15`, alignItems: 'center', justifyContent: 'center' }}>
                                            <FileText size={18} color={theme.brand} />
                                        </View>
                                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#3b82f615', alignItems: 'center', justifyContent: 'center' }}>
                                            <ImageIcon size={18} color="#3b82f6" />
                                        </View>
                                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#10b98115', alignItems: 'center', justifyContent: 'center' }}>
                                            <Camera size={18} color="#10b981" />
                                        </View>
                                    </View>
                                    <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 13 }}>
                                        Upload Document or Photo
                                    </Text>
                                    <Text style={{ color: theme.textMuted, fontSize: 11, textAlign: 'center' }}>
                                        Pick PDF, DOC, Gallery photo, or take a Camera snap
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* List of uploaded documents */}
                        {uploadedDocuments.length > 0 && (
                            <View style={{ gap: 10 }}>
                                {uploadedDocuments.map((doc, index) => {
                                    const isPdf = doc.isPdf || doc.filePath.toLowerCase().endsWith('.pdf') || doc.documentName.toLowerCase().endsWith('.pdf');
                                    return (
                                        <View
                                            key={index}
                                            style={{
                                                backgroundColor: theme.inputBg,
                                                borderColor: theme.border,
                                                borderWidth: 1,
                                                borderRadius: 12,
                                                padding: 12,
                                                gap: 8,
                                            }}
                                        >
                                            {/* Header: Icon, filename, delete */}
                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                                                    {isPdf ? (
                                                        <FileText size={18} color="#ef4444" />
                                                    ) : (
                                                        <ImageIcon size={18} color="#3b82f6" />
                                                    )}
                                                    <View style={{ flex: 1 }}>
                                                        <TextInput
                                                            style={{
                                                                color: theme.textPrimary,
                                                                fontSize: 12,
                                                                fontWeight: '600',
                                                                paddingVertical: 2,
                                                                paddingHorizontal: 0,
                                                            }}
                                                            value={doc.documentName}
                                                            onChangeText={(val) => handleUpdateDocName(index, val)}
                                                            placeholder="Document name..."
                                                            placeholderTextColor={theme.textMuted}
                                                        />
                                                        {doc.fileSize ? (
                                                            <Text style={{ color: theme.textMuted, fontSize: 10 }}>
                                                                {(doc.fileSize / 1024).toFixed(0)} KB
                                                            </Text>
                                                        ) : null}
                                                    </View>
                                                </View>
                                                <TouchableOpacity onPress={() => handleRemoveDoc(index)} style={{ padding: 4 }}>
                                                    <Trash2 size={16} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>

                                            {/* Document Type Selector Pills */}
                                            <View style={{ gap: 4 }}>
                                                <Text style={{ fontSize: 9, fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase' }}>
                                                    Document Type
                                                </Text>
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
                                                    {BOOKING_DOC_TYPES.map((dt) => {
                                                        const isSelected = doc.documentType === dt;
                                                        return (
                                                            <TouchableOpacity
                                                                key={dt}
                                                                onPress={() => handleUpdateDocType(index, dt)}
                                                                style={{
                                                                    paddingHorizontal: 8,
                                                                    paddingVertical: 4,
                                                                    borderRadius: 8,
                                                                    backgroundColor: isSelected ? theme.brand : theme.secondaryBg,
                                                                    borderWidth: 1,
                                                                    borderColor: isSelected ? theme.brand : theme.border,
                                                                }}
                                                            >
                                                                <Text
                                                                    style={{
                                                                        fontSize: 10,
                                                                        fontWeight: '700',
                                                                        color: isSelected ? '#ffffff' : theme.textSecondary,
                                                                    }}
                                                                >
                                                                    {dt}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </ScrollView>
                                            </View>
                                        </View>
                                    );
                                })}
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

            {/* Modal: Select File Source */}
            <Modal
                visible={pickerModalOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setPickerModalOpen(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setPickerModalOpen(false)}
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 24,
                    }}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: 320,
                            backgroundColor: theme.secondaryBg,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: theme.border,
                            padding: 18,
                            gap: 12,
                        }}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 4 }}>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary }}>Select File Source</Text>
                            <TouchableOpacity onPress={() => setPickerModalOpen(false)} style={{ padding: 4 }}>
                                <X size={16} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Document Picker Option */}
                        <TouchableOpacity
                            onPress={handlePickDocument}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                                backgroundColor: theme.inputBg,
                                padding: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: theme.border,
                            }}
                        >
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${theme.brand}15`, alignItems: 'center', justifyContent: 'center' }}>
                                <FileText size={20} color={theme.brand} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }}>Document (PDF / Word)</Text>
                                <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 1 }}>Browse PDF, DOC, DOCX, text files</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Photo Gallery Option */}
                        <TouchableOpacity
                            onPress={handlePickImage}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                                backgroundColor: theme.inputBg,
                                padding: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: theme.border,
                            }}
                        >
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#3b82f615', alignItems: 'center', justifyContent: 'center' }}>
                                <ImageIcon size={20} color="#3b82f6" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }}>Photo Gallery</Text>
                                <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 1 }}>Select photos from gallery</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Camera Option */}
                        <TouchableOpacity
                            onPress={handleTakePhoto}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                                backgroundColor: theme.inputBg,
                                padding: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: theme.border,
                            }}
                        >
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#10b98115', alignItems: 'center', justifyContent: 'center' }}>
                                <Camera size={20} color="#10b981" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }}>Take Photo</Text>
                                <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 1 }}>Capture document using camera</Text>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
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
