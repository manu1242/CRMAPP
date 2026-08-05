import React, { useEffect, useState } from 'react';
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
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  Filter,
  ChevronDown,
  Check,
  Plus,
  Trash2,
  Edit,
  Send,
  History,
  Info,
  X,
  Mail,
  Building,
  User,
  DollarSign,
  Ban,
  Clock
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import { 
  BookingItem,
  BookingDetail,
  Installment,
  BookingDocument
} from '../../../../admin/models/BookingTypes';
import {
  useBookings,
  useBookingDetail,
  useCreateBooking,
  useCancelBooking,
  useUploadBookingFile
} from '../../../../admin/hooks/useBookings';
import {
  usePropertyFloors,
  usePropertyFlats,
  useQuotations
} from '../../../../admin/hooks/useQuotations';
import { LeadService } from '../../../../admin/services/LeadService';
import { PropertyService } from '../../../../admin/services/PropertyService';
import { LeadItem } from '../../../../admin/models/LeadTypes';
import { PropertyItem } from '../../../../admin/models/PropertyTypes';
import { PropertyFloor, PropertyFlat } from '../../../../admin/models/QuoatationTypes';

const STATUS_OPTIONS = ['All', 'Confirmed', 'Pending', 'Cancelled', 'Completed'];
const PAYMENT_TYPES = ['EMI', 'Lump Sum', 'Bank Finance', 'Self Funding'];

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return 'N/A';
  }
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '₹0.00';
  return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

// Searchable Select Modal Component
interface SearchableSelectModalProps<T> {
  visible: boolean;
  title: string;
  items: T[];
  onSelect: (item: T) => void;
  onClose: () => void;
  searchKey: keyof T;
  labelKey: keyof T;
  secondaryLabelKey?: keyof T;
  placeholder?: string;
}

function SearchableSelectModal<T>({
  visible,
  title,
  items,
  onSelect,
  onClose,
  searchKey,
  labelKey,
  secondaryLabelKey,
  placeholder = 'Search...',
}: SearchableSelectModalProps<T>) {
  const [searchText, setSearchText] = useState('');
  const { isDark } = useTheme();
  const theme = getAdminTheme(isDark);

  const filteredItems = items.filter((item) => {
    const val = String(item[searchKey] || '').toLowerCase();
    return val.includes(searchText.toLowerCase());
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.selectModalContent, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
              <X size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.modalSearchBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <Search size={16} color={theme.textSecondary} />
            <TextInput
              style={[styles.modalSearchInput, { color: theme.textPrimary }]}
              placeholder={placeholder}
              placeholderTextColor={theme.textMuted}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <ScrollView style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled">
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
                      onClose();
                    }}
                    style={[styles.selectOption, { borderBottomColor: theme.border }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.selectOptionText, { color: theme.textPrimary }]}>{label}</Text>
                      {secLabel ? (
                        <Text style={[styles.selectOptionSubText, { color: theme.textSecondary }]}>{secLabel}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: theme.textSecondary }}>No records found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function BookingsPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const theme = getAdminTheme(isDark);

  // Filter and pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Main React Query hook for bookings list
  const {
    data: listResponse,
    isLoading: isListLoading,
    isRefetching: isListRefetching,
    refetch: refetchList,
  } = useBookings(page, pageSize, statusFilter === 'All' ? undefined : statusFilter, searchQuery);

  const bookings = listResponse?.data?.items ?? [];
  const totalCount = listResponse?.data?.totalCount ?? 0;
  const totalPages = listResponse?.data?.totalPages ?? 1;

  // Selected Booking state
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const { data: detailResponse, isLoading: isDetailLoading } = useBookingDetail(selectedBookingId ?? 0);
  const selectedBooking = detailResponse?.data;

  // Modals state
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [isFormModalOpen, setFormModalOpen] = useState(false);

  // Form input state
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
  const [uploadedDocuments, setUploadedDocuments] = useState<{ documentType: string; documentName: string; filePath: string; }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Selection option lists
  const [leadsList, setLeadsList] = useState<LeadItem[]>([]);
  const [propertiesList, setPropertiesList] = useState<PropertyItem[]>([]);
  const [isLeadsLoading, setLeadsLoading] = useState(false);
  const [isPropertiesLoading, setPropertiesLoading] = useState(false);

  // Dependent lists hooks
  const { data: floorsResponse } = usePropertyFloors(selectedProperty?.propertyId ?? 0);
  const floors = floorsResponse?.data ?? [];

  const { data: flatsResponse } = usePropertyFlats(
    selectedProperty?.propertyId ?? 0,
    selectedFloor?.floorNumber ?? undefined
  );
  const flats = flatsResponse?.data ?? [];

  // Load all quotations to filter by lead and property
  const { data: quotationsResponse } = useQuotations(1, 100);
  const allQuotations = quotationsResponse?.data?.items ?? [];

  const allAcceptedQuotations = allQuotations.filter((q) => q.status === 'Accepted');

  const filteredQuotations = allQuotations.filter(
    (q) => q.leadId === selectedLead?.leadId && q.propertyId === selectedProperty?.propertyId
  );

  // Search modals visibility state
  const [isLeadSelectOpen, setLeadSelectOpen] = useState(false);
  const [isPropertySelectOpen, setPropertySelectOpen] = useState(false);
  const [isFloorSelectOpen, setFloorSelectOpen] = useState(false);
  const [isFlatSelectOpen, setFlatSelectOpen] = useState(false);
  const [isQuotationSelectOpen, setQuotationSelectOpen] = useState(false);

  // Mutation hooks
  const createBookingMutation = useCreateBooking();
  const cancelBookingMutation = useCancelBooking();
  const uploadBookingFileMutation = useUploadBookingFile();

  // Load selection lists
  const loadFormDropdowns = async () => {
    try {
      setLeadsLoading(true);
      setPropertiesLoading(true);
      const [leadsRes, propsRes] = await Promise.all([
        LeadService.getLeads({ page: 1, pageSize: 100 }),
        PropertyService.getPropertiesList(),
      ]);
      if (leadsRes.success && leadsRes.data?.items) {
        setLeadsList(leadsRes.data.items);
      }
      if (propsRes.success && propsRes.properties) {
        setPropertiesList(propsRes.properties);
      }
    } catch (err) {
      console.error('Error loading dropdown lists:', err);
    } finally {
      setLeadsLoading(false);
      setPropertiesLoading(false);
    }
  };

  useEffect(() => {
    if (isFormModalOpen) {
      loadFormDropdowns();
    }
  }, [isFormModalOpen]);

  // Handle Search Input submit
  const handleSearchSubmit = () => {
    setSearchQuery(searchInput);
    setPage(1);
  };

  // Dynamic Status Badge Color Selector
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
      case 'Completed':
        return { bg: isDark ? '#064e3b' : '#d1fae5', text: isDark ? '#34d399' : '#059669' };
      case 'Cancelled':
        return { bg: isDark ? '#7f1d1d' : '#fee2e2', text: isDark ? '#f87171' : '#dc2626' };
      case 'Pending':
      default:
        return { bg: isDark ? '#27272a' : '#f3f4f6', text: isDark ? '#d4d4d8' : '#4b5563' };
    }
  };

  // Reset form inputs
  const resetForm = () => {
    setSelectedLead(null);
    setSelectedProperty(null);
    setSelectedFloor(null);
    setSelectedFlat(null);
    setSelectedQuotationId(null);
    setSelectedQuotationNumber('');
    setBookingAmount('200000');
    setTotalAmount('5000000');
    setPaymentType('EMI');
    setNotes('');
    setAgreementDate(new Date().toISOString().split('T')[0]);
    setPossessionDate(() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 2);
      return d.toISOString().split('T')[0];
    });
    setUploadedDocuments([]);
  };

  // Save creation action
  const handleCreateBooking = () => {
    if (!selectedQuotationId) {
      Alert.alert('Validation Error', 'Please select an Accepted Quotation.');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (agreementDate && !dateRegex.test(agreementDate.trim())) {
      Alert.alert('Validation Error', 'Agreement Date must be in YYYY-MM-DD format.');
      return;
    }
    if (possessionDate && !dateRegex.test(possessionDate.trim())) {
      Alert.alert('Validation Error', 'Possession Date must be in YYYY-MM-DD format.');
      return;
    }

    const payload = {
      quotationId: selectedQuotationId,
      bookingAmount: parseFloat(bookingAmount) || 0,
      paymentType: paymentType,
      agreementDate: agreementDate ? `${agreementDate.trim()}T00:00:00Z` : null,
      possessionDate: possessionDate ? `${possessionDate.trim()}T00:00:00Z` : null,
      notes: notes || null,
      documents: uploadedDocuments.length > 0 ? uploadedDocuments : undefined,
    };

    createBookingMutation.mutate(payload, {
      onSuccess: (res) => {
        Alert.alert('Success', 'Property booking created successfully!');
        setFormModalOpen(false);
        resetForm();
        refetchList();
      },
      onError: (err: any) => {
        Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to create booking.');
      },
    });
  };

  // Pick and Upload general booking document
  const handlePickAndUploadDocument = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Media library access permission is required to upload files.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
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
          
          // Detect doc type by file name matching
          let docType = 'Aadhar';
          const lowerName = fileName.toLowerCase();
          if (lowerName.includes('pan')) {
            docType = 'PAN';
          } else if (lowerName.includes('cheque')) {
            docType = 'Cheque';
          } else if (lowerName.includes('agreement')) {
            docType = 'Agreement';
          } else if (lowerName.includes('passport')) {
            docType = 'Passport';
          }

          setUploadedDocuments((prev) => [
            ...prev,
            {
              documentType: docType,
              documentName: uploadedFile.fileName,
              filePath: uploadedFile.urlPath,
            },
          ]);
          Alert.alert('Success', 'Document uploaded successfully!');
        } else {
          Alert.alert('Upload Failed', 'Document upload failed. Please try again.');
        }
      }
    } catch (err: any) {
      setIsUploading(false);
      Alert.alert('Error', err.message || 'Failed to select or upload document.');
    }
  };

  const handleRemoveUploadedDoc = (index: number) => {
    setUploadedDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  // Cancel Action
  const handleCancelBooking = () => {
    if (!selectedBookingId) return;
    Alert.alert(
      'Confirm Cancellation',
      'Are you sure you want to cancel this booking? This will update the status to Cancelled and free up the flat.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            cancelBookingMutation.mutate(selectedBookingId, {
              onSuccess: () => {
                Alert.alert('Success', 'Booking cancelled successfully.');
                setDetailModalOpen(false);
                refetchList();
              },
              onError: (err: any) => {
                Alert.alert('Error', err.response?.data?.message || err.message || 'Could not cancel booking.');
              },
            });
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.primaryBg }]}>
      {/* Search & Action Row */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <View style={[styles.searchBox, { flex: 1, backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <Search size={16} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Search bookings, leads..."
              placeholderTextColor={theme.textMuted}
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={handleSearchSubmit}
            />
            {searchInput ? (
              <TouchableOpacity
                onPress={() => {
                  setSearchInput('');
                  setSearchQuery('');
                }}
              >
                <X size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => {
              resetForm();
              setFormModalOpen(true);
            }}
            style={[styles.createBtn, { backgroundColor: theme.brand }]}
          >
            <Plus size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Status Horizontal Pill Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {STATUS_OPTIONS.map((status) => {
            const isSelected = statusFilter === status;
            return (
              <TouchableOpacity
                key={status}
                onPress={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected ? theme.brand : theme.secondaryBg,
                    borderColor: isSelected ? theme.brand : theme.border,
                  },
                ]}
              >
                <Text style={[styles.pillText, { color: isSelected ? '#ffffff' : theme.textSecondary }]}>
                  {status}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main List */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isListLoading && isListRefetching} onRefresh={refetchList} />}
      >
        {isListLoading && !isListRefetching ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.brand} />
            <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Fetching bookings...</Text>
          </View>
        ) : bookings.length > 0 ? (
          <View style={{ gap: 12 }}>
            {bookings.map((b) => {
              const badgeColors = getStatusColor(b.status);
              return (
                <TouchableOpacity
                  key={b.bookingId}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedBookingId(b.bookingId);
                    setDetailModalOpen(true);
                  }}
                  style={[styles.quoteCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <FileText size={18} color={theme.brand} />
                      <Text style={[styles.quoteNumberText, { color: theme.textPrimary }]}>{b.bookingNumber}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: badgeColors.bg }]}>
                      <Text style={[styles.statusText, { color: badgeColors.text }]}>{b.status}</Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: theme.border }]} />

                  <View style={{ gap: 8 }}>
                    <View style={styles.gridRow}>
                      <User size={14} color={theme.textMuted} />
                      <Text style={[styles.gridText, { color: theme.textPrimary }]}>
                        <Text style={{ color: theme.textSecondary }}>Client: </Text>
                        {b.leadName}
                      </Text>
                    </View>

                    <View style={styles.gridRow}>
                      <Building size={14} color={theme.textMuted} />
                      <Text style={[styles.gridText, { color: theme.textPrimary }]} numberOfLines={1}>
                        <Text style={{ color: theme.textSecondary }}>Unit: </Text>
                        {b.propertyName} {b.flatNumber ? `· Unit ${b.flatNumber}` : ''}
                      </Text>
                    </View>

                    <View style={styles.gridRow}>
                      <DollarSign size={14} color={theme.textMuted} />
                      <Text style={[styles.gridText, { color: theme.textPrimary, fontWeight: '600' }]}>
                        <Text style={{ color: theme.textSecondary, fontWeight: '400' }}>Paid/Total: </Text>
                        {formatCurrency(b.paidAmount)} / {formatCurrency(b.totalAmount)}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: theme.border }]} />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>
                      Booking Date: {formatDate(b.bookingDate)}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>
                      Type: {b.paymentType}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={[styles.emptyContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Bookings Found</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              There are no property bookings matching your filters.
            </Text>
          </View>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={[styles.paginationRow, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <TouchableOpacity
              disabled={page <= 1}
              onPress={() => setPage(page - 1)}
              style={[styles.pageBtn, { backgroundColor: theme.inputBg, opacity: page <= 1 ? 0.4 : 1 }]}
            >
              <ChevronLeft size={16} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={{ color: theme.textPrimary, fontSize: 13 }}>
              Page {page} of {totalPages}
            </Text>
            <TouchableOpacity
              disabled={page >= totalPages}
              onPress={() => setPage(page + 1)}
              style={[styles.pageBtn, { backgroundColor: theme.inputBg, opacity: page >= totalPages ? 0.4 : 1 }]}
            >
              <ChevronRight size={16} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* DETAIL MODAL */}
      <Modal visible={isDetailModalOpen} transparent animationType="fade" onRequestClose={() => setDetailModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  {selectedBooking?.bookingNumber || 'Loading Details...'}
                </Text>
                {selectedBooking?.status ? (
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedBooking.status).bg }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(selectedBooking.status).text }]}>
                      {selectedBooking.status}
                    </Text>
                  </View>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => setDetailModalOpen(false)} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
                <X size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {isDetailLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.brand} />
              </View>
            ) : selectedBooking ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Meta details */}
                <View style={[styles.detailCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <Text style={[styles.detailSectionTitle, { color: theme.textPrimary }]}>Client & Property Info</Text>
                  <Text style={{ color: theme.textSecondary, marginTop: 6 }}>
                    <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Client: </Text>
                    {selectedBooking.leadName}
                  </Text>
                  <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
                    <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Email: </Text>
                    {selectedBooking.leadEmail}
                  </Text>
                  <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
                    <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Phone: </Text>
                    {selectedBooking.Contact}
                  </Text>
                  <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
                    <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Property: </Text>
                    {selectedBooking.propertyName}
                  </Text>
                  <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
                    <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Unit/Flat: </Text>
                    {selectedBooking.flatNumber}
                  </Text>
                  {selectedBooking.quotationNumber ? (
                    <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
                      <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Quotation: </Text>
                      {selectedBooking.quotationNumber}
                    </Text>
                  ) : null}
                  <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
                    <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Booking Date: </Text>
                    {formatDate(selectedBooking.bookingDate)}
                  </Text>
                </View>

                {/* Financial Summary */}
                <View style={[styles.pricingSummary, { borderColor: theme.border }]}>
                  <Text style={[styles.detailSectionTitle, { color: theme.textPrimary, marginBottom: 8 }]}>Financial Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={{ color: theme.textSecondary }}>Booking Amount</Text>
                    <Text style={{ color: theme.textPrimary, fontWeight: '500' }}>{formatCurrency(selectedBooking.bookingAmount)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={{ color: theme.textSecondary }}>Total Commitment</Text>
                    <Text style={{ color: theme.textPrimary, fontWeight: '500' }}>{formatCurrency(selectedBooking.totalCommitment)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={{ color: theme.textSecondary }}>Paid Amount</Text>
                    <Text style={{ color: '#059669', fontWeight: '600' }}>{formatCurrency(selectedBooking.paidAmount)}</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 8 }]} />
                  <View style={styles.summaryRow}>
                    <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 14 }}>Outstanding Balance</Text>
                    <Text style={{ color: theme.brand, fontWeight: '700', fontSize: 15 }}>{formatCurrency(selectedBooking.outstandingAmount)}</Text>
                  </View>
                </View>

                {/* Installments milestones */}
                {selectedBooking.installments && selectedBooking.installments.length > 0 ? (
                  <View style={{ marginTop: 16 }}>
                    <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Milestone Installments (EMI)</Text>
                    <View style={[styles.itemsTable, { borderColor: theme.border }]}>
                      <View style={[styles.tableHeader, { backgroundColor: theme.inputBg, borderBottomColor: theme.border }]}>
                        <Text style={[styles.thText, { flex: 2, color: theme.textSecondary }]}>Milestone</Text>
                        <Text style={[styles.thText, { flex: 1.5, color: theme.textSecondary, textAlign: 'center' }]}>Due Date</Text>
                        <Text style={[styles.thText, { flex: 1.5, color: theme.textSecondary, textAlign: 'right' }]}>Amount</Text>
                      </View>
                      {selectedBooking.installments.map((inst) => (
                        <View key={inst.installmentId} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                          <View style={{ flex: 2 }}>
                            <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '600' }}>{inst.milestoneName}</Text>
                            <Text style={{ color: inst.status === 'Paid' ? '#059669' : '#d97706', fontSize: 11 }}>{inst.status}</Text>
                          </View>
                          <Text style={{ flex: 1.5, color: theme.textPrimary, fontSize: 12, textAlign: 'center' }}>{formatDate(inst.dueDate)}</Text>
                          <Text style={{ flex: 1.5, color: theme.textPrimary, fontSize: 13, fontWeight: '600', textAlign: 'right' }}>
                            {formatCurrency(inst.amount)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Documents List */}
                {selectedBooking.documents && selectedBooking.documents.length > 0 ? (
                  <View style={{ marginTop: 16 }}>
                    <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Booking Documents</Text>
                    <View style={{ gap: 8 }}>
                      {selectedBooking.documents.map((doc) => (
                        <View key={doc.documentId} style={[styles.documentItemRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                          <FileText size={16} color={theme.brand} />
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={{ color: theme.textPrimary, fontSize: 12, fontWeight: '600' }}>{doc.documentName}</Text>
                            <Text style={{ color: theme.textMuted, fontSize: 10 }}>Type: {doc.documentType} · Uploaded {formatDate(doc.uploadedOn)}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Notes */}
                {selectedBooking.notes ? (
                  <View style={{ marginTop: 16 }}>
                    <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Notes</Text>
                    <View style={[styles.notesContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                      <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{selectedBooking.notes}</Text>
                    </View>
                  </View>
                ) : null}

                {/* Cancel Action Footer */}
                {selectedBooking.status !== 'Cancelled' ? (
                  <View style={styles.actionFooter}>
                    <TouchableOpacity
                      onPress={handleCancelBooking}
                      style={[styles.cancelBookingBtn, { backgroundColor: '#fee2e2' }]}
                    >
                      <Ban size={16} color="#dc2626" />
                      <Text style={{ color: '#dc2626', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>Cancel Booking</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* CREATION MODAL */}
      <Modal visible={isFormModalOpen} transparent animationType="slide" onRequestClose={() => setFormModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.formModalContent, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>New Booking</Text>
              <TouchableOpacity onPress={() => setFormModalOpen(false)} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
                <X size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ gap: 14, paddingBottom: 24 }}>
                {/* 1. Quotation Select (Optional) */}
                <View>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Select Accepted Quotation (Optional)</Text>
                  <TouchableOpacity
                    onPress={() => setQuotationSelectOpen(true)}
                    style={[styles.selectBox, { backgroundColor: theme.inputBg, borderColor: theme.border, marginTop: 6 }]}
                  >
                    <Text style={{ color: selectedQuotationId ? theme.textPrimary : theme.textMuted }}>
                      {selectedQuotationId ? selectedQuotationNumber : 'Choose Quotation (optional)...'}
                    </Text>
                    <ChevronDown size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                {selectedQuotationId ? (
                  // Summary Box if Quotation is selected
                  <View style={[styles.quoteCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={[styles.quoteNumberText, { color: theme.brand, fontSize: 13 }]}>Quotation & Property Details</Text>
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
                        style={{ padding: 4 }}
                      >
                        <Text style={{ color: '#dc2626', fontSize: 11, fontWeight: '700' }}>Clear</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={{ color: theme.textSecondary, marginTop: 4, fontSize: 12 }}>
                      <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Lead/Client: </Text>
                      {selectedLead?.fullName}
                    </Text>
                    <Text style={{ color: theme.textSecondary, marginTop: 4, fontSize: 12 }}>
                      <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Property: </Text>
                      {selectedProperty?.propertyName}
                    </Text>
                    <Text style={{ color: theme.textSecondary, marginTop: 4, fontSize: 12 }}>
                      <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Flat/Unit: </Text>
                      {selectedFlat?.flatName}
                    </Text>
                    <Text style={{ color: theme.textSecondary, marginTop: 4, fontSize: 12 }}>
                      <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Total Final Value: </Text>
                      {formatCurrency(parseFloat(totalAmount) || 0)}
                    </Text>
                  </View>
                ) : (
                  // Manual Selectors if no Quotation is selected
                  <>
                    {/* Lead Select */}
                    <View>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Select Lead *</Text>
                      <TouchableOpacity
                        onPress={() => setLeadSelectOpen(true)}
                        style={[styles.selectBox, { backgroundColor: theme.inputBg, borderColor: theme.border, marginTop: 6 }]}
                      >
                        <Text style={{ color: selectedLead ? theme.textPrimary : theme.textMuted }}>
                          {selectedLead ? selectedLead.fullName : 'Choose Lead...'}
                        </Text>
                        {isLeadsLoading ? <ActivityIndicator size="small" color={theme.brand} /> : <ChevronDown size={18} color={theme.textSecondary} />}
                      </TouchableOpacity>
                    </View>

                    {/* Property Select */}
                    <View>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Select Property *</Text>
                      <TouchableOpacity
                        onPress={() => setPropertySelectOpen(true)}
                        style={[styles.selectBox, { backgroundColor: theme.inputBg, borderColor: theme.border, marginTop: 6 }]}
                      >
                        <Text style={{ color: selectedProperty ? theme.textPrimary : theme.textMuted }}>
                          {selectedProperty ? selectedProperty.propertyName : 'Choose Property...'}
                        </Text>
                        {isPropertiesLoading ? <ActivityIndicator size="small" color={theme.brand} /> : <ChevronDown size={18} color={theme.textSecondary} />}
                      </TouchableOpacity>
                    </View>

                    {/* Floor & Flat Select */}
                    {selectedProperty ? (
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Floor</Text>
                          <TouchableOpacity
                            onPress={() => setFloorSelectOpen(true)}
                            style={[styles.selectBox, { backgroundColor: theme.inputBg, borderColor: theme.border, marginTop: 6 }]}
                          >
                            <Text style={{ color: selectedFloor ? theme.textPrimary : theme.textMuted }}>
                              {selectedFloor ? selectedFloor.floorName : 'Floor...'}
                            </Text>
                            <ChevronDown size={16} color={theme.textSecondary} />
                          </TouchableOpacity>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Flat/Unit *</Text>
                          <TouchableOpacity
                            onPress={() => setFlatSelectOpen(true)}
                            style={[styles.selectBox, { backgroundColor: theme.inputBg, borderColor: theme.border, marginTop: 6 }]}
                          >
                            <Text style={{ color: selectedFlat ? theme.textPrimary : theme.textMuted }}>
                              {selectedFlat ? selectedFlat.flatName : 'Flat...'}
                            </Text>
                            <ChevronDown size={16} color={theme.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}

                    {/* Total Amount */}
                    <View>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Total Final Value (INR) *</Text>
                      <View style={[styles.formInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border, marginTop: 6 }]}>
                        <TextInput
                          style={[styles.formTextInput, { color: theme.textPrimary }]}
                          placeholder="5000000"
                          keyboardType="numeric"
                          placeholderTextColor={theme.textMuted}
                          value={totalAmount}
                          onChangeText={(val) => {
                            setTotalAmount(val);
                            const parsed = parseFloat(val) || 0;
                            setBookingAmount(String(Math.round(parsed * 0.2)));
                          }}
                        />
                      </View>
                    </View>
                  </>
                )}

                {/* Booking Amount */}
                <View>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Booking Advance Amount (INR) *</Text>
                  <View style={[styles.formInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border, marginTop: 6 }]}>
                    <TextInput
                      style={[styles.formTextInput, { color: theme.textPrimary }]}
                      placeholder="200000"
                      keyboardType="numeric"
                      placeholderTextColor={theme.textMuted}
                      value={bookingAmount}
                      onChangeText={setBookingAmount}
                    />
                  </View>
                  <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 4 }}>
                    Note: Default token amount is 20% of the total final value (₹{(parseFloat(totalAmount) * 0.2).toLocaleString('en-IN')})
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
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Agreement Date (YYYY-MM-DD) *</Text>
                  <View style={[styles.formInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border, marginTop: 6 }]}>
                    <TextInput
                      style={[styles.formTextInput, { color: theme.textPrimary }]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={theme.textMuted}
                      value={agreementDate}
                      onChangeText={setAgreementDate}
                    />
                  </View>
                </View>

                {/* Expected Possession Date */}
                <View>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Expected Possession Date (YYYY-MM-DD) *</Text>
                  <View style={[styles.formInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border, marginTop: 6 }]}>
                    <TextInput
                      style={[styles.formTextInput, { color: theme.textPrimary }]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={theme.textMuted}
                      value={possessionDate}
                      onChangeText={setPossessionDate}
                    />
                  </View>
                </View>

                {/* Document Upload Area */}
                <View style={{ marginTop: 6 }}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary, marginBottom: 8 }]}>Upload Documents (Optional)</Text>
                  <TouchableOpacity
                    onPress={handlePickAndUploadDocument}
                    style={{
                      borderWidth: 1.5,
                      borderStyle: 'dashed',
                      borderColor: theme.brand,
                      borderRadius: 12,
                      padding: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.inputBg,
                    }}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <ActivityIndicator size="small" color={theme.brand} />
                    ) : (
                      <>
                        <Text style={{ color: theme.brand, fontWeight: '700', fontSize: 13 }}>Click to upload documents</Text>
                        <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 4 }}>Aadhar, PAN, Agreement, Cheque copy, etc.</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* List of uploaded documents in the form */}
                  {uploadedDocuments.length > 0 ? (
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
                          <TouchableOpacity onPress={() => handleRemoveUploadedDoc(index)} style={{ padding: 4 }}>
                            <Trash2 size={16} color="#dc2626" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>

                {/* 8. Notes */}
                <View>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Notes</Text>
                  <TextInput
                    style={[styles.notesTextArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                    multiline
                    numberOfLines={4}
                    placeholder="Enter booking requirements, document milestones, cp commission notes..."
                    placeholderTextColor={theme.textMuted}
                    value={notes}
                    onChangeText={setNotes}
                  />
                </View>

                {/* Submit Action */}
                {createBookingMutation.isPending ? (
                  <ActivityIndicator size="small" color={theme.brand} style={{ marginVertical: 10 }} />
                ) : (
                  <TouchableOpacity
                    onPress={handleCreateBooking}
                    style={[styles.submitBtn, { backgroundColor: theme.brand }]}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>Create Booking</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Dropdown Selection Modals */}
      <SearchableSelectModal
        visible={isLeadSelectOpen}
        title="Select Lead"
        items={leadsList}
        searchKey="fullName"
        labelKey="fullName"
        secondaryLabelKey="phone"
        onSelect={(lead) => setSelectedLead(lead)}
        onClose={() => setLeadSelectOpen(false)}
      />

      <SearchableSelectModal
        visible={isPropertySelectOpen}
        title="Select Property"
        items={propertiesList}
        searchKey="propertyName"
        labelKey="propertyName"
        secondaryLabelKey="location"
        onSelect={(property) => {
          setSelectedProperty(property);
          setSelectedFloor(null);
          setSelectedFlat(null);
          setSelectedQuotationId(null);
        }}
        onClose={() => setPropertySelectOpen(false)}
      />

      <SearchableSelectModal
        visible={isFloorSelectOpen}
        title="Select Floor"
        items={floors}
        searchKey="floorName"
        labelKey="floorName"
        onSelect={(floor) => {
          setSelectedFloor(floor);
          setSelectedFlat(null);
        }}
        onClose={() => setFloorSelectOpen(false)}
      />

      <SearchableSelectModal
        visible={isFlatSelectOpen}
        title="Select Flat/Unit"
        items={flats}
        searchKey="flatName"
        labelKey="flatName"
        secondaryLabelKey="bhk"
        onSelect={(flat) => {
          setSelectedFlat(flat);
          if (flat.price > 0) {
            setTotalAmount(String(flat.price));
          }
        }}
        onClose={() => setFlatSelectOpen(false)}
      />

      <SearchableSelectModal
        visible={isQuotationSelectOpen}
        title="Select Accepted Quotation"
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
          setQuotationSelectOpen(false);
        }}
        onClose={() => setQuotationSelectOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  createBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quoteCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteNumberText: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gridText: {
    fontSize: 13,
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
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    maxHeight: '90%',
  },
  formModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  pricingSummary: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  itemsTable: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  thText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  documentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  notesContainer: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionFooter: {
    marginTop: 24,
    marginBottom: 16,
  },
  cancelBookingBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectBox: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  formInputContainer: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  formTextInput: {
    flex: 1,
    fontSize: 13,
  },
  notesTextArea: {
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 13,
    marginTop: 6,
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  selectModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    maxHeight: '75%',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
  },
  selectOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectOptionSubText: {
    fontSize: 11,
    marginTop: 2,
  }
});
