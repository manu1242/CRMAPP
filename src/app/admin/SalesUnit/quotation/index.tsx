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
  DollarSign
} from 'lucide-react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import { 
  Quoatations,
  QuotationDetail,
  QuotationItem,
  QuotationCreateData,
  QuotationUpdateData,
  QuotationTemplate,
  QuotationVersion,
  PropertyFloor,
  PropertyFlat
} from '../../../../admin/models/QuoatationTypes';
import {
  useQuotations,
  useQuotationDetail,
  useCreateQuotation,
  useUpdateQuotation,
  useDeleteQuotation,
  useUpdateQuotationStatus,
  usePropertyFloors,
  usePropertyFlats,
  useQuotationTemplates,
  useQuotationVersions,
  useSendQuotationApproval
} from '../../../../admin/hooks/useQuotations';
import { LeadService } from '../../../../admin/services/LeadService';
import { PropertyService } from '../../../../admin/services/PropertyService';
import { LeadItem } from '../../../../admin/models/LeadTypes';
import { PropertyItem } from '../../../../admin/models/PropertyTypes';

const STATUS_OPTIONS = ['All', 'Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'];
const ITEM_TYPES = ['Base', 'Parking', 'Amenities', 'Club Membership', 'Custom'];

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

// Reusable Searchable Select Modal Component
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

export default function QuotationsPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const theme = getAdminTheme(isDark);

  // Filter and pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Main React Query hook for quotations list
  const {
    data: listResponse,
    isLoading: isListLoading,
    isRefetching: isListRefetching,
    refetch: refetchList,
  } = useQuotations(page, pageSize, statusFilter === 'All' ? undefined : statusFilter, searchQuery);

  const quotations = listResponse?.data?.items ?? [];
  const totalCount = listResponse?.data?.totalCount ?? 0;
  const totalPages = listResponse?.data?.totalPages ?? 1;

  // Selected Quotation state
  const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(null);
  const { data: detailResponse, isLoading: isDetailLoading } = useQuotationDetail(selectedQuotationId ?? 0);
  const selectedQuotation = detailResponse?.data;

  // Modals state
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isApprovalModalOpen, setApprovalModalOpen] = useState(false);
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);

  // Form input state
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyItem | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<PropertyFloor | null>(null);
  const [selectedFlat, setSelectedFlat] = useState<PropertyFlat | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<QuotationTemplate | null>(null);
  const [validUntilDate, setValidUntilDate] = useState('');
  const [notes, setNotes] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [lineItems, setLineItems] = useState<Omit<QuotationItem, 'itemId' | 'quotationId'>[]>([]);

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

  const { data: templatesResponse } = useQuotationTemplates();
  const templates = templatesResponse?.data ?? [];

  // Version history query hook
  const { data: versionsResponse, isLoading: isVersionsLoading } = useQuotationVersions(selectedQuotationId ?? 0);
  const versions = versionsResponse?.data ?? [];

  // Search modals visibility state
  const [isLeadSelectOpen, setLeadSelectOpen] = useState(false);
  const [isPropertySelectOpen, setPropertySelectOpen] = useState(false);
  const [isFloorSelectOpen, setFloorSelectOpen] = useState(false);
  const [isFlatSelectOpen, setFlatSelectOpen] = useState(false);
  const [isTemplateSelectOpen, setTemplateSelectOpen] = useState(false);

  // Mutation hooks
  const createQuotationMutation = useCreateQuotation();
  const updateQuotationMutation = useUpdateQuotation();
  const updateStatusMutation = useUpdateQuotationStatus();
  const deleteQuotationMutation = useDeleteQuotation();
  const sendApprovalMutation = useSendQuotationApproval();

  // Approval request form state
  const [approvalEmail, setApprovalEmail] = useState('');
  const [approvalValidity, setApprovalValidity] = useState('7');
  const [approvalResult, setApprovalResult] = useState<{ clientPortalUrl: string; token: string } | null>(null);

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
      case 'Accepted':
        return { bg: isDark ? '#064e3b' : '#d1fae5', text: isDark ? '#34d399' : '#059669' };
      case 'Rejected':
        return { bg: isDark ? '#7f1d1d' : '#fee2e2', text: isDark ? '#f87171' : '#dc2626' };
      case 'Sent':
        return { bg: isDark ? '#1e3a8a' : '#dbeafe', text: isDark ? '#60a5fa' : '#2563eb' };
      case 'Expired':
        return { bg: isDark ? '#3f3f46' : '#f4f4f5', text: isDark ? '#a1a1aa' : '#71717a' };
      case 'Draft':
      default:
        return { bg: isDark ? '#27272a' : '#f3f4f6', text: isDark ? '#d4d4d8' : '#4b5563' };
    }
  };

  // Perform totals calculations
  const calculateTotals = () => {
    const subtotal = lineItems.reduce((acc, item) => acc + item.total, 0);
    const disc = parseFloat(discountAmount) || 0;
    const taxable = Math.max(0, subtotal - disc);
    const tax = taxable * 0.05; // 5% GST fallback
    const grand = taxable + tax;
    return { subtotal, tax, grand };
  };

  const { subtotal, tax, grand } = calculateTotals();

  // Reset form inputs
  const resetForm = () => {
    setSelectedLead(null);
    setSelectedProperty(null);
    setSelectedFloor(null);
    setSelectedFlat(null);
    setSelectedTemplate(null);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    setValidUntilDate(futureDate.toISOString().split('T')[0]);
    setNotes('');
    setChangeReason('');
    setDiscountAmount('0');
    setLineItems([]);
  };

  // Edit action
  const handleOpenEdit = () => {
    if (!selectedQuotation) return;
    setFormMode('edit');
    setDetailModalOpen(false);

    // Pre-fill fields
    setSelectedLead({ leadId: selectedQuotation.leadId, fullName: selectedQuotation.leadName } as any);
    setSelectedProperty({ propertyId: selectedQuotation.propertyId, propertyName: selectedQuotation.propertyName } as any);
    setSelectedFloor({ floorNumber: String(selectedQuotation.floorId || ''), floorName: `Floor ${selectedQuotation.floorId || ''}` } as any);
    setSelectedFlat({ flatId: selectedQuotation.flatId ?? 0, flatName: selectedQuotation.flatNumber ?? '' } as any);
    setValidUntilDate(selectedQuotation.validUntil ? selectedQuotation.validUntil.split('T')[0] : '');
    setNotes(selectedQuotation.notes || '');
    setDiscountAmount(String(selectedQuotation.discountAmount));
    setChangeReason('');

    // Pre-fill line items
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

    setFormModalOpen(true);
  };

  // Save creation/update action
  const handleSaveQuotation = () => {
    if (!selectedLead?.leadId || !selectedProperty?.propertyId) {
      Alert.alert('Validation Error', 'Please select both Lead and Property.');
      return;
    }
    if (lineItems.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one line item.');
      return;
    }

    const payload: QuotationCreateData = {
      leadId: selectedLead.leadId,
      propertyId: selectedProperty.propertyId,
      floorId: selectedFloor?.floorId,
      flatId: selectedFlat?.flatId,
      validUntil: validUntilDate ? new Date(validUntilDate).toISOString() : null,
      basePrice: subtotal,
      discountAmount: parseFloat(discountAmount) || 0,
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
        onSuccess: (res) => {
          Alert.alert('Success', 'Quotation created successfully!');
          setFormModalOpen(false);
          resetForm();
          refetchList();
        },
        onError: (err: any) => {
          Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to create quotation.');
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
            Alert.alert('Success', 'Quotation updated successfully!');
            setFormModalOpen(false);
            resetForm();
            refetchList();
          },
          onError: (err: any) => {
            Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to update quotation.');
          },
        }
      );
    }
  };

  // Update Status action
  const handleUpdateStatus = (newStatus: string) => {
    if (!selectedQuotationId) return;
    updateStatusMutation.mutate(
      { id: selectedQuotationId, status: newStatus },
      {
        onSuccess: () => {
          Alert.alert('Success', `Status updated to '${newStatus}' successfully.`);
          refetchList();
        },
        onError: (err: any) => {
          Alert.alert('Error', err.message || 'Failed to update status.');
        },
      }
    );
  };

  // Delete Action
  const handleDeleteQuotation = () => {
    if (!selectedQuotationId) return;
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this quotation? This action is irreversible.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteQuotationMutation.mutate(selectedQuotationId, {
              onSuccess: () => {
                Alert.alert('Deleted', 'Quotation deleted successfully.');
                setDetailModalOpen(false);
                refetchList();
              },
              onError: (err: any) => {
                Alert.alert('Delete Failed', err.response?.data?.message || err.message || 'Could not delete quotation.');
              },
            });
          },
        },
      ]
    );
  };

  // Template select callback
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

  // Dynamic Item field updater
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
    const updated = lineItems.filter((_, i) => i !== index);
    setLineItems(updated);
  };

  // Submit Approval action
  const handleSendApproval = () => {
    if (!selectedQuotationId || !approvalEmail) {
      Alert.alert('Validation Error', 'Please enter a valid client email.');
      return;
    }

    sendApprovalMutation.mutate(
      {
        id: selectedQuotationId,
        clientEmail: approvalEmail,
        validityDays: parseInt(approvalValidity) || 7,
      },
      {
        onSuccess: (res) => {
          setApprovalResult({
            clientPortalUrl: res.data.clientPortalUrl,
            token: res.data.token,
          });
          refetchList();
        },
        onError: (err: any) => {
          Alert.alert('Send Failed', err.response?.data?.message || err.message || 'Failed to send approval.');
        },
      }
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.primaryBg }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: theme.primaryBg, borderBottomColor: theme.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Quotations</Text>
        </View>
       
      </View>

      {/* Filters & Search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <View style={[styles.searchBox, { flex: 1, backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <Search size={16} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Search quotations, leads, or notes..."
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
              setFormMode('create');
              resetForm();
              setFormModalOpen(true);
            }}
            style={[styles.createBtn, { backgroundColor: theme.brand }]}
          >
            <Plus size={20} color="#ffffff" />
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
            <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Fetching quotations...</Text>
          </View>
        ) : quotations.length > 0 ? (
          <View style={{ gap: 12 }}>
            {quotations.map((q) => {
              const badgeColors = getStatusColor(q.status);
              return (
                <TouchableOpacity
                  key={q.quotationId}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedQuotationId(q.quotationId);
                    setDetailModalOpen(true);
                  }}
                  style={[styles.quoteCard, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <FileText size={18} color={theme.brand} />
                      <Text style={[styles.quoteNumberText, { color: theme.textPrimary }]}>{q.quotationNumber}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: badgeColors.bg }]}>
                      <Text style={[styles.statusText, { color: badgeColors.text }]}>{q.status}</Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: theme.border }]} />

                  <View style={{ gap: 8 }}>
                    <View style={styles.gridRow}>
                      <User size={14} color={theme.textMuted} />
                      <Text style={[styles.gridText, { color: theme.textPrimary }]}>
                        <Text style={{ color: theme.textSecondary }}>Lead: </Text>
                        {q.leadName}
                      </Text>
                    </View>

                    <View style={styles.gridRow}>
                      <Building size={14} color={theme.textMuted} />
                      <Text style={[styles.gridText, { color: theme.textPrimary }]} numberOfLines={1}>
                        <Text style={{ color: theme.textSecondary }}>Property: </Text>
                        {q.propertyName} {q.flatNumber ? `· Unit ${q.flatNumber}` : ''}
                      </Text>
                    </View>

                    <View style={styles.gridRow}>
                      <DollarSign size={14} color={theme.textMuted} />
                      <Text style={[styles.gridText, { color: theme.textPrimary, fontWeight: '600' }]}>
                        <Text style={{ color: theme.textSecondary, fontWeight: '400' }}>Grand Total: </Text>
                        {formatCurrency(q.grandTotal)}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: theme.border }]} />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>
                      Created: {formatDate(q.createdOn)}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>
                      Valid: {formatDate(q.validUntil)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={[styles.emptyContainer, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Quotations Found</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              There are no quotations matching your current filters.
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
                  {selectedQuotation?.quotationNumber || 'Loading Details...'}
                </Text>
                {selectedQuotation?.status ? (
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedQuotation.status).bg }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(selectedQuotation.status).text }]}>
                      {selectedQuotation.status}
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
            ) : selectedQuotation ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Meta details */}
                <View style={[styles.detailCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <Text style={[styles.detailSectionTitle, { color: theme.textPrimary }]}>Client & Property info</Text>
                  <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
                    <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Lead: </Text>
                    {selectedQuotation.leadName}
                  </Text>
                  <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
                    <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Property: </Text>
                    {selectedQuotation.propertyName}
                  </Text>
                  <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
                    <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Flat/Unit: </Text>
                    {selectedQuotation.flatNumber || 'N/A'} (Floor {selectedQuotation.floorId || 'N/A'})
                  </Text>
                  <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
                    <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Quotation Date: </Text>
                    {formatDate(selectedQuotation.quotationDate)}
                  </Text>
                  <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
                    <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Valid Until: </Text>
                    {formatDate(selectedQuotation.validUntil)}
                  </Text>
                </View>

                {/* Items List */}
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Quotation Items</Text>
                  {selectedQuotation.items && selectedQuotation.items.length > 0 ? (
                    <View style={[styles.itemsTable, { borderColor: theme.border }]}>
                      <View style={[styles.tableHeader, { backgroundColor: theme.inputBg, borderBottomColor: theme.border }]}>
                        <Text style={[styles.thText, { flex: 2, color: theme.textSecondary }]}>Description</Text>
                        <Text style={[styles.thText, { flex: 1, color: theme.textSecondary, textAlign: 'center' }]}>Qty</Text>
                        <Text style={[styles.thText, { flex: 1.5, color: theme.textSecondary, textAlign: 'right' }]}>Total</Text>
                      </View>
                      {selectedQuotation.items.map((item, idx) => (
                        <View key={item.itemId || idx} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                          <View style={{ flex: 2 }}>
                            <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '500' }}>{item.description}</Text>
                            <Text style={{ color: theme.textMuted, fontSize: 11 }}>{item.itemType}</Text>
                          </View>
                          <Text style={{ flex: 1, color: theme.textPrimary, fontSize: 13, textAlign: 'center' }}>{item.quantity}</Text>
                          <Text style={{ flex: 1.5, color: theme.textPrimary, fontSize: 13, fontWeight: '500', textAlign: 'right' }}>
                            {formatCurrency(item.total)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ color: theme.textSecondary, fontStyle: 'italic' }}>No items attached.</Text>
                  )}
                </View>

                {/* Pricing Summary */}
                <View style={[styles.pricingSummary, { borderColor: theme.border }]}>
                  <View style={styles.summaryRow}>
                    <Text style={{ color: theme.textSecondary }}>Subtotal</Text>
                    <Text style={{ color: theme.textPrimary, fontWeight: '500' }}>{formatCurrency(selectedQuotation.basePrice)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={{ color: theme.textSecondary }}>Discount</Text>
                    <Text style={{ color: '#dc2626', fontWeight: '500' }}>-{formatCurrency(selectedQuotation.discountAmount)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={{ color: theme.textSecondary }}>GST Tax (5%)</Text>
                    <Text style={{ color: theme.textPrimary, fontWeight: '500' }}>{formatCurrency(selectedQuotation.taxAmount)}</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 8 }]} />
                  <View style={styles.summaryRow}>
                    <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 15 }}>Grand Total</Text>
                    <Text style={{ color: theme.brand, fontWeight: '700', fontSize: 16 }}>{formatCurrency(selectedQuotation.grandTotal)}</Text>
                  </View>
                </View>

                {/* Notes */}
                {selectedQuotation.notes ? (
                  <View style={{ marginTop: 16 }}>
                    <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Notes & Terms</Text>
                    <View style={[styles.notesContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                      <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{selectedQuotation.notes}</Text>
                    </View>
                  </View>
                ) : null}

                {/* Status transitions options */}
                <View style={{ marginTop: 20, gap: 8 }}>
                  <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Update Quotation Status</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {['Draft', 'Sent', 'Accepted', 'Rejected'].map((st) => (
                      <TouchableOpacity
                        key={st}
                        disabled={selectedQuotation.status === st}
                        onPress={() => handleUpdateStatus(st)}
                        style={[
                          styles.statusActionBtn,
                          {
                            backgroundColor: selectedQuotation.status === st ? theme.border : theme.inputBg,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <Text style={{ color: selectedQuotation.status === st ? theme.textMuted : theme.textPrimary, fontSize: 12, fontWeight: '600' }}>
                          Set {st}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Action Row */}
                <View style={styles.actionFooter}>
                  <TouchableOpacity
                    onPress={() => {
                      setApprovalResult(null);
                      setApprovalEmail('');
                      setApprovalValidity('7');
                      setApprovalModalOpen(true);
                    }}
                    style={[styles.actionBtn, { backgroundColor: theme.brand }]}
                  >
                    <Send size={15} color="#ffffff" />
                    <Text style={styles.actionBtnText}>Send Approval</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setHistoryModalOpen(true)}
                    style={[styles.actionBtn, { backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border }]}
                  >
                    <History size={15} color={theme.textPrimary} />
                    <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>History</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleOpenEdit}
                    style={[styles.actionBtn, { backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border }]}
                  >
                    <Edit size={15} color={theme.textPrimary} />
                    <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleDeleteQuotation}
                    style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]}
                  >
                    <Trash2 size={15} color="#dc2626" />
                    <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* FORM MODAL (CREATE / EDIT) */}
      <Modal visible={isFormModalOpen} transparent animationType="slide" onRequestClose={() => setFormModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.formModalContent, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {formMode === 'create' ? 'Create Quotation' : 'Edit Quotation'}
              </Text>
              <TouchableOpacity onPress={() => setFormModalOpen(false)} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
                <X size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ gap: 14, paddingBottom: 24 }}>
                {/* 1. Lead Selection */}
                <View>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Select Lead *</Text>
                  <TouchableOpacity
                    onPress={() => setLeadSelectOpen(true)}
                    style={[styles.selectBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                  >
                    <Text style={{ color: selectedLead ? theme.textPrimary : theme.textMuted }}>
                      {selectedLead ? selectedLead.fullName : 'Choose Lead...'}
                    </Text>
                    {isLeadsLoading ? <ActivityIndicator size="small" color={theme.brand} /> : <ChevronDown size={18} color={theme.textSecondary} />}
                  </TouchableOpacity>
                </View>

                {/* 2. Property Selection */}
                <View>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Select Property *</Text>
                  <TouchableOpacity
                    onPress={() => setPropertySelectOpen(true)}
                    style={[styles.selectBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                  >
                    <Text style={{ color: selectedProperty ? theme.textPrimary : theme.textMuted }}>
                      {selectedProperty ? selectedProperty.propertyName : 'Choose Property...'}
                    </Text>
                    {isPropertiesLoading ? <ActivityIndicator size="small" color={theme.brand} /> : <ChevronDown size={18} color={theme.textSecondary} />}
                  </TouchableOpacity>
                </View>

                {/* 3. Floor & Flat Selection (Only if property selected) */}
                {selectedProperty ? (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Floor</Text>
                      <TouchableOpacity
                        onPress={() => setFloorSelectOpen(true)}
                        style={[styles.selectBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                      >
                        <Text style={{ color: selectedFloor ? theme.textPrimary : theme.textMuted }}>
                          {selectedFloor ? selectedFloor.floorName : 'Floor...'}
                        </Text>
                        <ChevronDown size={16} color={theme.textSecondary} />
                      </TouchableOpacity>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Flat/Unit</Text>
                      <TouchableOpacity
                        onPress={() => setFlatSelectOpen(true)}
                        style={[styles.selectBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                      >
                        <Text style={{ color: selectedFlat ? theme.textPrimary : theme.textMuted }}>
                          {selectedFlat ? selectedFlat.flatName : 'Flat...'}
                        </Text>
                        <ChevronDown size={16} color={theme.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                {/* 4. Template (Optional, to auto pre-fill items) */}
                <View>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Apply Quotation Template</Text>
                  <TouchableOpacity
                    onPress={() => setTemplateSelectOpen(true)}
                    style={[styles.selectBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                  >
                    <Text style={{ color: selectedTemplate ? theme.textPrimary : theme.textMuted }}>
                      {selectedTemplate ? selectedTemplate.templateName : 'Choose Template (optional)...'}
                    </Text>
                    <ChevronDown size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* 5. Valid Until */}
                <View>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Valid Until (YYYY-MM-DD)</Text>
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

                {/* 6. Line Items Builder */}
                <View style={[styles.sectionContainer, { borderColor: theme.border }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={[styles.formSectionTitle, { color: theme.textPrimary }]}>Checklist & Line Items</Text>
                    <TouchableOpacity onPress={addEmptyLineItem} style={[styles.addItemBtn, { borderColor: theme.brand }]}>
                      <Plus size={14} color={theme.brand} />
                      <Text style={{ color: theme.brand, fontWeight: '600', fontSize: 12 }}>Add Item</Text>
                    </TouchableOpacity>
                  </View>

                  {lineItems.length > 0 ? (
                    <View style={{ gap: 10 }}>
                      {lineItems.map((item, idx) => (
                        <View key={idx} style={[styles.itemEditorCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 12 }}>Item #{idx + 1}</Text>
                            <TouchableOpacity onPress={() => removeLineItem(idx)}>
                              <Trash2 size={15} color="#dc2626" />
                            </TouchableOpacity>
                          </View>

                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                            {/* Item Type select */}
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 10, color: theme.textMuted, marginBottom: 2 }}>Type</Text>
                              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
                                {ITEM_TYPES.map((type) => {
                                  const isTypeSelected = item.itemType === type;
                                  return (
                                    <TouchableOpacity
                                      key={type}
                                      onPress={() => updateLineItem(idx, 'itemType', type)}
                                      style={{
                                        paddingHorizontal: 8,
                                        paddingVertical: 4,
                                        borderRadius: 6,
                                        backgroundColor: isTypeSelected ? theme.brand : theme.secondaryBg,
                                        borderWidth: 1,
                                        borderColor: theme.border,
                                      }}
                                    >
                                      <Text style={{ fontSize: 9, color: isTypeSelected ? '#ffffff' : theme.textSecondary }}>{type}</Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </ScrollView>
                            </View>
                          </View>

                          <TextInput
                            style={[styles.itemEditorInput, { color: theme.textPrimary, borderBottomColor: theme.border }]}
                            placeholder="Description (e.g. Base flat price)"
                            placeholderTextColor={theme.textMuted}
                            value={item.description}
                            onChangeText={(val) => updateLineItem(idx, 'description', val)}
                          />

                          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                            <View style={{ flex: 2 }}>
                              <Text style={{ fontSize: 10, color: theme.textMuted }}>Price (INR)</Text>
                              <TextInput
                                style={[styles.itemEditorInput, { color: theme.textPrimary, borderBottomColor: theme.border }]}
                                placeholder="0.00"
                                keyboardType="numeric"
                                placeholderTextColor={theme.textMuted}
                                value={String(item.amount || '')}
                                onChangeText={(val) => updateLineItem(idx, 'amount', val)}
                              />
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 10, color: theme.textMuted }}>Qty</Text>
                              <TextInput
                                style={[styles.itemEditorInput, { color: theme.textPrimary, borderBottomColor: theme.border }]}
                                placeholder="1"
                                keyboardType="numeric"
                                placeholderTextColor={theme.textMuted}
                                value={String(item.quantity || '')}
                                onChangeText={(val) => updateLineItem(idx, 'quantity', val)}
                              />
                            </View>

                            <View style={{ flex: 1.5, justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                              <Text style={{ fontSize: 9, color: theme.textMuted }}>Total</Text>
                              <Text style={{ color: theme.textPrimary, fontWeight: '600', fontSize: 13, paddingBottom: 6 }}>
                                {formatCurrency(item.total)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ color: theme.textSecondary, fontStyle: 'italic', textAlign: 'center', marginVertical: 12 }}>
                      No items added yet. Click "Add Item" to start.
                    </Text>
                  )}
                </View>

                {/* 7. Discount */}
                <View>
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

                {/* 8. Summary Card */}
                <View style={[styles.detailCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <Text style={[styles.detailSectionTitle, { color: theme.textPrimary }]}>Summary Preview</Text>
                  <View style={{ gap: 6, marginTop: 8 }}>
                    <View style={styles.summaryRow}>
                      <Text style={{ color: theme.textSecondary }}>Subtotal</Text>
                      <Text style={{ color: theme.textPrimary }}>{formatCurrency(subtotal)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={{ color: theme.textSecondary }}>Discount</Text>
                      <Text style={{ color: '#dc2626' }}>-{formatCurrency(parseFloat(discountAmount) || 0)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={{ color: theme.textSecondary }}>GST Tax (5%)</Text>
                      <Text style={{ color: theme.textPrimary }}>{formatCurrency(tax)}</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <View style={styles.summaryRow}>
                      <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>Grand Total</Text>
                      <Text style={{ color: theme.brand, fontWeight: '700', fontSize: 15 }}>{formatCurrency(grand)}</Text>
                    </View>
                  </View>
                </View>

                {/* 9. Notes */}
                <View>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Notes & Terms</Text>
                  <TextInput
                    style={[styles.notesTextArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                    multiline
                    numberOfLines={4}
                    placeholder="Provide special offers, terms, and notes..."
                    placeholderTextColor={theme.textMuted}
                    value={notes}
                    onChangeText={setNotes}
                  />
                </View>

                {/* 10. Change Reason (Edit Mode Only) */}
                {formMode === 'edit' ? (
                  <View>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Change Reason *</Text>
                    <TextInput
                      style={[styles.notesTextArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                      placeholder="Explain what was modified for version history..."
                      placeholderTextColor={theme.textMuted}
                      value={changeReason}
                      onChangeText={setChangeReason}
                    />
                  </View>
                ) : null}

                {/* Submit Action */}
                <TouchableOpacity
                  onPress={handleSaveQuotation}
                  style={[styles.submitBtn, { backgroundColor: theme.brand }]}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>
                    {formMode === 'create' ? 'Create & Save' : 'Update & Increment Version'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* APPROVAL MODAL */}
      <Modal visible={isApprovalModalOpen} transparent animationType="fade" onRequestClose={() => setApprovalModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.dropdownMenu, { backgroundColor: theme.secondaryBg, borderColor: theme.border, width: '90%', maxWidth: 400 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Send Approval Request</Text>
              <TouchableOpacity onPress={() => setApprovalModalOpen(false)} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
                <X size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14, paddingTop: 10 }}>
              <View>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Client Email</Text>
                <View style={[styles.formInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <TextInput
                    style={[styles.formTextInput, { color: theme.textPrimary }]}
                    placeholder="client@example.com"
                    keyboardType="email-address"
                    placeholderTextColor={theme.textMuted}
                    value={approvalEmail}
                    onChangeText={setApprovalEmail}
                  />
                  <Mail size={16} color={theme.textSecondary} />
                </View>
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Link Validity (Days)</Text>
                <View style={[styles.formInputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <TextInput
                    style={[styles.formTextInput, { color: theme.textPrimary }]}
                    placeholder="7"
                    keyboardType="numeric"
                    placeholderTextColor={theme.textMuted}
                    value={approvalValidity}
                    onChangeText={setApprovalValidity}
                  />
                </View>
              </View>

              {sendApprovalMutation.isPending ? (
                <ActivityIndicator size="small" color={theme.brand} style={{ marginVertical: 10 }} />
              ) : (
                <TouchableOpacity
                  onPress={handleSendApproval}
                  style={[styles.submitBtn, { backgroundColor: theme.brand }]}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '700' }}>Generate & Send</Text>
                </TouchableOpacity>
              )}

              {approvalResult ? (
                <View style={[styles.detailCard, { backgroundColor: theme.inputBg, borderColor: theme.border, marginTop: 10 }]}>
                  <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 13 }}>Request generated successfully!</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 6 }}>
                    <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Token: </Text>
                    {approvalResult.token}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 4 }}>
                    <Text style={{ fontWeight: '600', color: theme.textPrimary }}>Portal URL: </Text>
                    {approvalResult.clientPortalUrl}
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* VERSION HISTORY MODAL */}
      <Modal visible={isHistoryModalOpen} transparent animationType="slide" onRequestClose={() => setHistoryModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Version History</Text>
              <TouchableOpacity onPress={() => setHistoryModalOpen(false)} style={[styles.closeBtn, { backgroundColor: theme.inputBg }]}>
                <X size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {isVersionsLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.brand} />
              </View>
            ) : versions.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={{ gap: 14 }}>
                  {versions.map((v) => (
                    <View key={v.versionId} style={[styles.versionCard, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: theme.brand, fontWeight: '700', fontSize: 14 }}>Version {v.versionNumber}</Text>
                        <Text style={{ color: theme.textMuted, fontSize: 11 }}>{formatDate(v.createdOn)}</Text>
                      </View>
                      <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '600', marginTop: 6 }}>
                        Total: {formatCurrency(v.totalAmount)}
                      </Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
                        <Text style={{ fontWeight: '600' }}>Change Reason: </Text>
                        {v.changeReason || 'No details provided.'}
                      </Text>

                      {/* Display items JSON */}
                      {v.itemsJson ? (
                        <View style={{ marginTop: 8 }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary, marginBottom: 2 }}>Items Snapshot:</Text>
                          {(() => {
                            try {
                              const parsed = JSON.parse(v.itemsJson);
                              return parsed.map((item: any, idx: number) => (
                                <Text key={idx} style={{ fontSize: 11, color: theme.textMuted }}>
                                  · {item.ItemType || item.itemType}: {item.Description || item.description} ({formatCurrency(item.Total || item.total)})
                                </Text>
                              ));
                            } catch {
                              return <Text style={{ fontSize: 11, color: theme.textMuted }}>Could not parse items.</Text>;
                            }
                          })()}
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ color: theme.textSecondary }}>No versions found.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Search selection modals */}
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
          // Set flat price as first line item default if no items yet
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
        onClose={() => setFlatSelectOpen(false)}
      />

      <SearchableSelectModal
        visible={isTemplateSelectOpen}
        title="Select Template"
        items={templates}
        searchKey="templateName"
        labelKey="templateName"
        secondaryLabelKey="description"
        onSelect={handleSelectTemplate}
        onClose={() => setTemplateSelectOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom:4,
   
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  createBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 12,
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
    flex: 1,
  },
  emptyContainer: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
  },
  pageBtn: {
    padding: 8,
    borderRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  formModalContent: {
    width: '100%',
    maxHeight: '95%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginVertical: 4,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginVertical: 10,
  },
  itemsTable: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
  },
  thText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  pricingSummary: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notesContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  statusActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    flex: 1,
    minWidth: 110,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
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
  sectionContainer: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 8,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  itemEditorCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  itemEditorInput: {
    fontSize: 13,
    paddingVertical: 4,
    borderBottomWidth: 1,
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
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  versionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  selectModalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    gap: 6,
    marginBottom: 10,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
  },
  selectOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectOptionSubText: {
    fontSize: 11,
    marginTop: 2,
  },
  dropdownMenu: {
    width: '85%',
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
});