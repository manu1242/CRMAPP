import { useLeadFormOptionsQuery } from '../../../admin/hooks/useLeadsQuery';
import { useShallow } from 'zustand/react/shallow';
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
  Linking,
  Platform,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  ArrowLeft,
  RefreshCw,
  Phone,
  Mail,
  MessageCircle,
  User,
  Home,
  Activity,
  CalendarCheck,
  FileText,
  Paperclip,
  MapPin,
  GitCommit,
  Clock,
  Star,
  Building,
  AlertCircle,
  Tag,
  Briefcase,
  Plus,
  Send,
  Upload,
  X,
  FileCheck,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  ChevronDown,
  Trash2,
  UserCheck,
  Download,
  ExternalLink,
  File,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Snowflake,
  Calendar,
  Camera,
  Image as ImageIcon,
  Pen,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { useLeadStore } from '../../../admin/store/useLeadStore';
import { LeadService } from '../../../admin/services/LeadService';
import LeadAssignmentModal from '../../../admin/components/LeadAssignmentModal';
import LeadStageModal from '../../../admin/components/LeadStageModal';
import * as QuotationService from '../../../admin/services/QuoatationService';
import * as BookingService from '../../../admin/services/BookingService';
import * as InvoiceService from '../../../admin/services/InvoiceService';
import * as PaymentService from '../../../admin/services/PaymentService';
import { getApiUrl } from '../../../api/remoteConfig';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';
import { usePermission } from '../../../authorization/hooks/usePermission';

function openFileUrl(path: string | null | undefined) {
  if (!path) return;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://')) {
    Linking.openURL(path);
  } else {
    const baseUrl = getApiUrl().replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    Linking.openURL(`${baseUrl}/${cleanPath}`);
  }
}

// Safe date formatters
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return 'N/A';
  }
}

const LONG_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Web Lead Details format: "MMMM dd, yyyy hh:mm tt"
function formatLongDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${LONG_MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()} ${String(hours).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
}

// Web Lead Details format: "MMMM dd, yyyy"
function formatLongDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return `${LONG_MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
}

// Web "Next Follow-up" countdown: Today / Tomorrow / N days overdue / N days remaining
function getFollowUpCountdown(dateStr: string | null | undefined): { text: string; color?: string } | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((a - b) / 86400000);
  if (days === 0) return { text: 'Today', color: '#ef4444' };
  if (days === 1) return { text: 'Tomorrow', color: '#f59e0b' };
  if (days < 0) return { text: `${Math.abs(days)} days overdue`, color: '#ef4444' };
  return { text: `${days} days remaining` };
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const strHours = String(hours).padStart(2, '0');
    return `${day} ${month} ${d.getFullYear()}, ${strHours}:${minutes} ${ampm}`;
  } catch {
    return 'N/A';
  }
}

type TabType =
  | 'contact'
  | 'requirements'
  | 'activities'
  | 'followups'
  | 'notes'
  | 'documents'
  | 'sitevisits'
  | 'transactions'
// | 'transitions';

// Helper to determine file icon and colors matching Web CRM
function getFileIconInfo(fileName?: string) {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return { icon: FileText, color: '#ef4444', bg: '#ef444415' };
    case 'doc':
    case 'docx':
      return { icon: FileText, color: '#3b82f6', bg: '#3b82f615' };
    case 'xls':
    case 'xlsx':
    case 'csv':
      return { icon: FileSpreadsheet, color: '#10b981', bg: '#10b98115' };
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return { icon: Paperclip, color: '#06b6d4', bg: '#06b6d415' };
    default:
      return { icon: File, color: '#8b5cf6', bg: '#8b5cf615' };
  }
}

// Helper to determine activity icon and colors matching Web CRM History
function getActivityIconInfo(activityText?: string) {
  const act = activityText?.toLowerCase() || '';
  if (act.includes('created') || act.includes('add')) return { icon: Plus, color: '#10b981', bg: '#10b98115' };
  if (act.includes('update') || act.includes('modif') || act.includes('edit')) return { icon: Briefcase, color: '#3b82f6', bg: '#3b82f615' };
  if (act.includes('delete') || act.includes('remove')) return { icon: Trash2, color: '#ef4444', bg: '#ef444415' };
  if (act.includes('follow')) return { icon: CalendarCheck, color: '#06b6d4', bg: '#06b6d415' };
  if (act.includes('note')) return { icon: FileText, color: '#f59e0b', bg: '#f59e0b15' };
  if (act.includes('upload') || act.includes('file') || act.includes('document')) return { icon: Upload, color: '#10b981', bg: '#10b98115' };
  if (act.includes('call') || act.includes('phone')) return { icon: Phone, color: '#10b981', bg: '#10b98115' };
  if (act.includes('email') || act.includes('mail')) return { icon: Mail, color: '#3b82f6', bg: '#3b82f615' };
  if (act.includes('site') || act.includes('visit')) return { icon: MapPin, color: '#ec4899', bg: '#ec489915' };
  return { icon: Clock, color: '#8b5cf6', bg: '#8b5cf615' };
}

export default function LeadDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const leadId = params.id;
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();

  const {
    selectedLeadDetails,
    isLoadingDetails,
    detailsError,
    fetchLeadDetails,
    addLeadNote,
    deleteLeadNote,
    addLeadFollowUp,
    editLeadFollowUp,
    uploadLeadDocument,
    deleteLeadDocument,
    updateLeadStatus,
    updateInterestStatus,
  } = useLeadStore(
    // Subscribe only to the fields used here (was: whole store → re-render on any change)
    useShallow((s) => ({ selectedLeadDetails: s.selectedLeadDetails, isLoadingDetails: s.isLoadingDetails, detailsError: s.detailsError, fetchLeadDetails: s.fetchLeadDetails, addLeadNote: s.addLeadNote, deleteLeadNote: s.deleteLeadNote, addLeadFollowUp: s.addLeadFollowUp, editLeadFollowUp: s.editLeadFollowUp, uploadLeadDocument: s.uploadLeadDocument, deleteLeadDocument: s.deleteLeadDocument, updateLeadStatus: s.updateLeadStatus, updateInterestStatus: s.updateInterestStatus }))
  );

  const { can, canEdit, canDelete, isAdmin, isSuperAdmin } = usePermission();
  const canEditLead = isAdmin || isSuperAdmin || canEdit('Leads') || can('Edit', '/admin/leads') || can('Edit', 'Leads');
  const canDeleteLead = isAdmin || isSuperAdmin || canDelete('Leads') || can('Delete', '/admin/leads') || can('Delete', 'Leads');

  const [activeTab, setActiveTab] = useState<TabType>('contact');
  const [refreshing, setRefreshing] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [updatingInterestFollowUpId, setUpdatingInterestFollowUpId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditLead = () => {
    const targetId = leadId || selectedLeadDetails?.contactInformation?.leadId || (selectedLeadDetails as any)?.leadId;
    if (!targetId) return;
    router.push({
      pathname: '/admin/leads/AddLead',
      params: { id: String(targetId) },
    } as any);
  };

  const handleDeleteLead = () => {
    const targetId = leadId || selectedLeadDetails?.contactInformation?.leadId || (selectedLeadDetails as any)?.leadId;
    if (!targetId) return;

    Alert.alert(
      'Delete Lead',
      'Are you sure you want to delete this lead? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              const res = await LeadService.deleteLead(targetId);
              if (res && (res.success || (res as any)?.message?.toLowerCase().includes('success'))) {
                Toast.show({
                  type: 'success',
                  text1: 'Lead Deleted',
                  text2: (res as any)?.message || 'Lead has been deleted successfully.',
                });
                router.replace('/admin/leads' as any);
              } else if (res?.isReferenceError) {
                Alert.alert(
                  'Cannot Delete Lead',
                  res.message || 'This lead has associated Quotations, Bookings, or Invoices. Please delete or reassign those documents first before removing this lead.'
                );
              } else {
                Alert.alert('Delete Failed', res?.message || 'Failed to delete lead. Please try again.');
              }
            } catch (err: any) {
              const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete lead.';
              Alert.alert('Error', errMsg);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateInterest = async (followUpId: number, status: 'Interested' | 'Not Interested' | 'Cold') => {
    if (!leadId || !followUpId) return;
    setUpdatingInterestFollowUpId(followUpId);
    const success = await updateInterestStatus(leadId, followUpId, status);
    setUpdatingInterestFollowUpId(null);
    if (success) {
      Toast.show({
        type: 'success',
        text1: 'Interest Status',
        text2: `Status updated to ${status}`,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Could not update interest status. Please try again.',
      });
    }
  };

  // Form States
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Follow-up / Site Visit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'followup' | 'sitevisit'>('followup');
  const [editingFollowUpId, setEditingFollowUpId] = useState<number | null>(null);
  const [formStage, setFormStage] = useState('Site Visit Requested');
  const [formStatus, setFormStatus] = useState('Scheduled');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0] + 'T10:00:00');
  const [formTime, setFormTime] = useState('10:00 AM');
  const [formComments, setFormComments] = useState('');
  const [formRating, setFormRating] = useState('5');
  const [formInterest, setFormInterest] = useState('Interested');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Dropdown States
  const [formOptions, setFormOptions] = useState<any>(null);
  const [stageSelectOpen, setStageSelectOpen] = useState(false);
  const [statusSelectOpen, setStatusSelectOpen] = useState(false);
  const [ratingSelectOpen, setRatingSelectOpen] = useState(false);
  const [interestSelectOpen, setInterestSelectOpen] = useState(false);

  const fallbackOptions = {
    stages: [
      { value: "New", label: "New" },
      { value: "Office Meeting", label: "Office Meeting" },
      { value: "Site Visit Requested", label: "Site Visit Requested" },
      { value: "Site Visit Done", label: "Site Visit Done" },
      { value: "Quotation", label: "Quotation" },
      { value: "Quotation Sent", label: "Quotation Sent" },
      { value: "Negotiation", label: "Negotiation" },
      { value: "Booked", label: "Booked" }
    ],
    statuses: [
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" },
      { value: "Hot", label: "Hot" },
      { value: "Warm", label: "Warm" },
      { value: "Cold", label: "Cold" }
    ],
    followUpStatuses: [
      { value: "Scheduled", label: "Scheduled" },
      { value: "Completed", label: "Completed" },
      { value: "Cancelled", label: "Cancelled" },
      { value: "Rescheduled", label: "Rescheduled" }
    ],
    ratings: [
      { value: "1", label: "1 Star" },
      { value: "2", label: "2 Stars" },
      { value: "3", label: "3 Stars" },
      { value: "4", label: "4 Stars" },
      { value: "5", label: "5 Stars" }
    ],
    sources: [
      { value: "Website", label: "Website" },
      { value: "Referral", label: "Referral" },
      { value: "Walk-in", label: "Walk-in" },
      { value: "Social Media", label: "Social Media" },
      { value: "Advertisement", label: "Advertisement" },
      { value: "Other", label: "Other" }
    ],
    interestStatuses: [
      { value: "Interested", label: "Interested" },
      { value: "Not Interested", label: "Not Interested" },
      { value: "Need More Info", label: "Need More Info" }
    ]
  };

  const options = formOptions || fallbackOptions;

  // Status dropdown state
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const LEAD_STATUSES = [
    { label: 'Active', color: '#3b82f6' },
    { label: 'Interested', color: '#10b981' },
    { label: 'Not Interested', color: '#ef4444' },
    { label: 'Follow Up', color: '#f59e0b' },
    { label: 'Converted', color: '#8b5cf6' },
    { label: 'Closed', color: '#64748b' },
    { label: 'Lost', color: '#dc2626' },
  ];

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPickerModalOpen, setUploadPickerModalOpen] = useState(false);

  // Local state for Documents & Financial Sub-sections
  const [quotations, setQuotations] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingDocuments, setBookingDocuments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoadingDocsData, setIsLoadingDocsData] = useState(false);

  const fetchDocumentsAndFinancials = async () => {
    if (!leadId) return;
    setIsLoadingDocsData(true);
    try {
      // 1. Fetch Quotations (filter locally by leadId)
      try {
        const qRes = await QuotationService.getQuotations(1, 100);
        if (qRes.success && qRes.data?.items) {
          const leadQuotes = qRes.data.items.filter((q: any) => String(q.leadId) === String(leadId));
          setQuotations(leadQuotes);
        }
      } catch (err) {
        console.error('Error fetching quotations for lead:', err);
      }

      // 2. Fetch Bookings (filter locally by leadId)
      try {
        const bRes = await BookingService.getBookings(1, 100);
        if (bRes.success && bRes.data?.items) {
          const leadBookings = bRes.data.items.filter((b: any) => String(b.leadId) === String(leadId));
          setBookings(leadBookings);

          const bookingIds = leadBookings.map((b: any) => b.bookingId);

          if (bookingIds.length > 0) {
            // Fetch detailed Booking Documents
            try {
              const detailsPromises = bookingIds.map(id => BookingService.getBookingById(id));
              const detailsResponses = await Promise.all(detailsPromises);

              let bookingDocs: any[] = [];
              detailsResponses.forEach(res => {
                if (res.success && res.data) {
                  const bookingData = res.data;
                  if (bookingData.documents && bookingData.documents.length > 0) {
                    const docsWithContext = bookingData.documents.map((doc: any) => ({
                      ...doc,
                      bookingId: bookingData.bookingId,
                      bookingNumber: bookingData.bookingNumber,
                    }));
                    bookingDocs = [...bookingDocs, ...docsWithContext];
                  }

                  if (bookingData.agreementPath) {
                    bookingDocs.push({
                      documentId: `agreement-${bookingData.bookingId}`,
                      documentType: 'Agreement',
                      documentName: bookingData.agreementPath.split('/').pop() || 'Booking Agreement PDF',
                      filePath: bookingData.agreementPath,
                      uploadedOn: bookingData.agreementDate || bookingData.createdOn || new Date().toISOString(),
                      bookingId: bookingData.bookingId,
                      bookingNumber: bookingData.bookingNumber,
                    });
                  }
                }
              });
              setBookingDocuments(bookingDocs);
            } catch (docErr) {
              console.error('Error fetching booking details for documents:', docErr);
            }

            // 3. Fetch Invoices (filter locally by bookingId)
            try {
              const iRes = await InvoiceService.getInvoices(1, 100);
              if (iRes.success && iRes.data?.items) {
                const leadInvoices = iRes.data.items.filter((inv: any) =>
                  bookingIds.some((bId: any) => String(bId) === String(inv.bookingId))
                );
                setInvoices(leadInvoices);
              }
            } catch (invErr) {
              console.error('Error fetching invoices:', invErr);
            }

            // 4. Fetch Payments (filter locally by bookingId)
            try {
              const pRes = await PaymentService.getPayments(1, 100);
              if (pRes.success && pRes.data?.items) {
                const leadPayments = pRes.data.items.filter((pay: any) =>
                  bookingIds.some((bId: any) => String(bId) === String(pay.bookingId))
                );
                setPayments(leadPayments);
              }
            } catch (payErr) {
              console.error('Error fetching payments:', payErr);
            }
          } else {
            setBookingDocuments([]);
            setInvoices([]);
            setPayments([]);
          }
        }
      } catch (err) {
        console.error('Error fetching bookings for lead:', err);
      }
    } catch (error) {
      console.error('Error fetching documents and financials:', error);
    } finally {
      setIsLoadingDocsData(false);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchLeadDetails(leadId);
      fetchDocumentsAndFinancials();
    }
  }, [leadId]);

  // Static dropdown options — cached for 30 min (was re-downloaded every time a lead was opened)
  const { data: formOptionsRes } = useLeadFormOptionsQuery();
  useEffect(() => {
    if (formOptionsRes?.success && formOptionsRes.data) setFormOptions(formOptionsRes.data);
  }, [formOptionsRes]);

  const onRefresh = async () => {
    if (!leadId) return;
    setRefreshing(true);
    await Promise.all([
      fetchLeadDetails(leadId),
      fetchDocumentsAndFinancials(),
    ]);
    setRefreshing(false);
  };

  // Dynamic Admin Theme Colors (from admin.css)
  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg;
  const brandCol = adminTheme.brand;

  const contact = selectedLeadDetails?.contactInformation;
  const requirements = selectedLeadDetails?.propertyRequirements;
  const activities = selectedLeadDetails?.activities || [];
  const followUps = selectedLeadDetails?.followUps || [];
  const notes = selectedLeadDetails?.notes || [];
  const documents = selectedLeadDetails?.documents || [];
  const siteVisits = selectedLeadDetails?.siteVisits || [];
  const transitions = selectedLeadDetails?.transitions || [];

  const handleCall = () => {
    if (contact?.phone) {
      Linking.openURL(`tel:${contact.phone}`);
    }
  };

  const handleEmail = () => {
    if (contact?.email) {
      Linking.openURL(`mailto:${contact.email}`);
    }
  };

  const handleWhatsApp = () => {
    if (contact?.phone) {
      const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
      Linking.openURL(`https://wa.me/${cleanPhone}`);
    }
  };

  // Handlers for Submitting Data
  const handleAddNote = async () => {
    if (!newNoteText.trim() || !leadId) return;
    setIsSubmittingNote(true);
    const success = await addLeadNote(leadId, newNoteText.trim());
    setIsSubmittingNote(false);
    if (success) {
      setNewNoteText('');
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Note added successfully.',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Note Error',
        text2: 'Failed to add note. Please try again.',
      });
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!leadId || !noteId) return;
    const success = await deleteLeadNote(leadId, noteId);
    if (success) {
      Toast.show({
        type: 'success',
        text1: 'Deleted',
        text2: 'Note deleted successfully.',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete note.',
      });
    }
  };

  const handleDeleteDocument = async (uploadId: number) => {
    if (!leadId || !uploadId) return;
    const success = await deleteLeadDocument(leadId, uploadId);
    if (success) {
      Toast.show({
        type: 'success',
        text1: 'Deleted',
        text2: 'Document deleted successfully.',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete document.',
      });
    }
  };

  const openScheduleModal = (type: 'followup' | 'sitevisit') => {
    setModalType(type);
    setEditingFollowUpId(null);
    setFormStage(type === 'sitevisit' ? 'Site Visit Requested' : 'Office Meeting');
    setFormStatus('Scheduled');
    setFormDate(new Date().toISOString().split('T')[0] + 'T10:00:00');
    setFormTime('10:00 AM');
    setFormComments('');
    setFormRating('5');
    setFormInterest('Interested');

    // Close any open dropdown lists
    setStageSelectOpen(false);
    setStatusSelectOpen(false);
    setRatingSelectOpen(false);
    setInterestSelectOpen(false);

    setIsModalOpen(true);
  };

  const openEditScheduleModal = (item: any) => {
    setModalType(item.stage?.toLowerCase().includes('site') ? 'sitevisit' : 'followup');
    setEditingFollowUpId(item.followUpId);
    setFormStage(item.stage || 'Office Meeting');
    setFormStatus(item.status || 'Scheduled');
    setFormDate(item.followUpDate || new Date().toISOString().split('T')[0] + 'T10:00:00');
    setFormTime(item.followUpTime || '10:00 AM');
    setFormComments(item.comments || '');
    setFormRating(item.rating || '5');
    setFormInterest(item.interestStatus || 'Interested');

    // Close any open dropdown lists
    setStageSelectOpen(false);
    setStatusSelectOpen(false);
    setRatingSelectOpen(false);
    setInterestSelectOpen(false);

    setIsModalOpen(true);
  };

  const handleSubmitModalForm = async () => {
    if (!leadId) return;

    if (!formStage || !formStage.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Stage is required.',
      });
      return;
    }
    if (!formDate || !formDate.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Follow-up Date is required.',
      });
      return;
    }

    setIsSubmittingForm(true);

    const payload = {
      stage: formStage,
      status: formStatus,
      followUpDate: formDate,
      followUpTime: formTime,
      comments: formComments,
      interestStatus: formInterest,
      rating: formRating,
    };

    let success = false;
    if (editingFollowUpId !== null) {
      success = await editLeadFollowUp(leadId, editingFollowUpId, payload);
    } else {
      success = await addLeadFollowUp(leadId, payload);
    }

    setIsSubmittingForm(false);
    if (success) {
      setIsModalOpen(false);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: editingFollowUpId !== null ? 'Follow-up updated successfully.' : 'Follow-up added successfully.',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Submission Error',
        text2: 'Failed to save entry. Please try again.',
      });
    }
  };

  const uploadSelectedFile = async (uri: string, name: string, mimeType: string) => {
    if (!leadId) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('leadId', String(leadId));
      formData.append('file', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: name,
        type: mimeType || 'application/octet-stream',
      } as any);

      const success = await uploadLeadDocument(leadId, formData);
      setIsUploading(false);

      if (success) {
        Toast.show({
          type: 'success',
          text1: 'Upload Successful',
          text2: `${name} uploaded successfully!`,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Upload Failed',
          text2: 'File upload failed. Please try again.',
        });
      }
    } catch (err: any) {
      setIsUploading(false);
      Toast.show({
        type: 'error',
        text1: 'Upload Error',
        text2: err?.message || 'Failed to upload file.',
      });
      console.log('Upload error:', err);
    }
  };

  const handlePickDocument = async () => {
    setUploadPickerModalOpen(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'text/csv',
          'image/*',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const doc = result.assets[0];
        const docName = doc.name || `doc_${Date.now()}.pdf`;
        const docMime = doc.mimeType || 'application/pdf';
        await uploadSelectedFile(doc.uri, docName, docMime);
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Document Error',
        text2: err?.message || 'Failed to pick document.',
      });
    }
  };

  const handlePickImage = async () => {
    setUploadPickerModalOpen(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `img_${Date.now()}.jpg`;
        const mimeType = asset.mimeType || 'image/jpeg';
        await uploadSelectedFile(asset.uri, fileName, mimeType);
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Gallery Error',
        text2: err?.message || 'Failed to pick image.',
      });
    }
  };

  const handleTakePhoto = async () => {
    setUploadPickerModalOpen(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Toast.show({
          type: 'error',
          text1: 'Permission Required',
          text2: 'Camera access is required to take photos.',
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `photo_${Date.now()}.jpg`;
        const mimeType = asset.mimeType || 'image/jpeg';
        await uploadSelectedFile(asset.uri, fileName, mimeType);
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Camera Error',
        text2: err?.message || 'Failed to capture photo.',
      });
    }
  };

  const handleUploadDocument = () => {
    setUploadPickerModalOpen(true);
  };

  // Render Rating Pill
  const renderRatingBadge = (rating?: string | null) => {
    if (!rating) return null;
    let badgeBg = '#3b82f615';
    let textCol = '#3b82f6';
    if (rating.toLowerCase() === 'hot') {
      badgeBg = '#ef444415';
      textCol = '#ef4444';
    } else if (rating.toLowerCase() === 'warm') {
      badgeBg = '#f59e0b15';
      textCol = '#f59e0b';
    } else if (rating.toLowerCase() === 'cold') {
      badgeBg = '#06b6d415';
      textCol = '#06b6d4';
    }

    return (
      <View style={[styles.ratingBadge, { backgroundColor: badgeBg }]}>
        <Star size={12} color={textCol} fill={textCol} />
        <Text style={[styles.ratingText, { color: textCol }]}>{rating}</Text>
      </View>
    );
  };

  const totalTransactionsCount =
    quotations.length + bookingDocuments.length + invoices.length + payments.length;

  const tabs: { key: TabType; label: string; count?: number; icon: any }[] = [
    { key: 'contact', label: 'Contact', icon: User },
    { key: 'requirements', label: 'Requirements', icon: Home },
    { key: 'activities', label: 'Activities', count: activities.length, icon: Activity },
    { key: 'followups', label: 'Follow Ups', count: followUps.length, icon: CalendarCheck },
    { key: 'notes', label: 'Notes', count: notes.length, icon: FileText },
    { key: 'documents', label: 'Uploads', count: documents.length, icon: Paperclip },
    { key: 'sitevisits', label: 'Site Visits', count: siteVisits.length, icon: MapPin },
    { key: 'transactions', label: 'Transactions', count: totalTransactionsCount, icon: Receipt },
    // { key: 'transitions', label: 'Transitions', count: transitions.length, icon: GitCommit },
  ];

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Top Header Bar */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: borderCol,
        backgroundColor: cardBg,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            flex: 1,
            marginRight: 8,
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={textColor} />
          <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }} numberOfLines={1}>
            Lead Details
          </Text>
        </TouchableOpacity>

        {/* Action Buttons: Edit and Delete */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {canEditLead && (
            <TouchableOpacity
              onPress={handleEditLead}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.18)' : '#eff6ff',
                paddingVertical: 7,
                paddingHorizontal: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : '#bfdbfe',
              }}
              activeOpacity={0.7}
            >
              <Pen size={14} color="#3b82f6" />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#3b82f6' }}>Edit</Text>
            </TouchableOpacity>
          )}

          {canDeleteLead && (
            <TouchableOpacity
              onPress={handleDeleteLead}
              disabled={isDeleting}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                paddingVertical: 7,
                paddingHorizontal: 11,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#fecaca',
                opacity: isDeleting ? 0.6 : 1,
              }}
              activeOpacity={0.7}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <>
                  <Trash2 size={14} color="#ef4444" />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#ef4444' }}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
      {statusDropdownOpen && (
        <Pressable
          style={[StyleSheet.absoluteFill, { zIndex: 90 }]}
          onPress={() => setStatusDropdownOpen(false)}
        />
      )}
      {isLoadingDetails && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ color: subTextColor, marginTop: 12, fontSize: 14 }}>
            Fetching lead full details...
          </Text>
        </View>
      ) : detailsError ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <AlertCircle size={48} color="#ef4444" />
          <Text style={{ color: textColor, fontSize: 16, fontWeight: '600', marginTop: 12, textAlign: 'center' }}>
            Failed to Load Lead Details
          </Text>
          <Text style={{ color: subTextColor, fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 20 }}>
            {detailsError}
          </Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
            <Text style={{ color: '#ffffff', fontWeight: '600' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(bottomSpacing, 100) }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Lead Hero Profile Card */}
          <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={styles.heroRow}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>
                  {(contact?.fullName || 'L').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={[styles.leadName, { color: textColor }]}>
                    {contact?.fullName || 'Unnamed Lead'}
                  </Text>
                  {renderRatingBadge(contact?.rating)}
                </View>
                <Text style={[styles.leadSub, { color: subTextColor }]}>
                  {contact?.email || 'No email provided'}
                </Text>
                <Text style={[styles.leadSub, { color: subTextColor }]}>
                  {contact?.phone || 'No phone provided'}
                </Text>
              </View>
            </View>

            {/* Status Badges — Status is tappable to change */}
            <View style={styles.badgeRow}>
              {/* Tappable status badge with dropdown */}
              <View style={{ position: 'relative', zIndex: 99 }}>
                <TouchableOpacity
                  onPress={() => setStatusDropdownOpen((o) => !o)}
                  activeOpacity={0.75}
                  style={[styles.pillBadge, { backgroundColor: '#3b82f615', borderWidth: 1, borderColor: '#3b82f630' }]}
                >
                  <Tag size={12} color="#3b82f6" />
                  {isUpdatingStatus ? (
                    <ActivityIndicator size={10} color="#3b82f6" style={{ marginLeft: 4 }} />
                  ) : (
                    <Text style={[styles.pillBadgeText, { color: '#3b82f6' }]}>
                      {contact?.status || 'Active'}
                    </Text>
                  )}
                  <ChevronDown size={10} color="#3b82f6" style={{ marginLeft: 2 }} />
                </TouchableOpacity>

                {/* Dropdown */}
                {statusDropdownOpen && (
                  <View style={{
                    position: 'absolute',
                    top: 30,
                    left: 0,
                    backgroundColor: cardBg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: borderCol,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 8,
                    minWidth: 170,
                    paddingVertical: 6,
                    zIndex: 100,
                  }}>
                    {LEAD_STATUSES.map((s) => (
                      <TouchableOpacity
                        key={s.label}
                        onPress={async () => {
                          if (s.label === contact?.status) {
                            setStatusDropdownOpen(false);
                            return;
                          }
                          setStatusDropdownOpen(false);
                          setIsUpdatingStatus(true);
                          const ok = await updateLeadStatus(leadId, s.label);
                          setIsUpdatingStatus(false);
                          if (ok) {
                            Toast.show({
                              type: 'success',
                              text1: 'Success',
                              text2: `Status updated to ${s.label}.`,
                            });
                          } else {
                            Toast.show({
                              type: 'error',
                              text1: 'Update Failed',
                              text2: 'Could not update lead status. Please try again.',
                            });
                          }
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          gap: 8,
                          backgroundColor: s.label === contact?.status ? `${s.color}15` : 'transparent',
                        }}
                      >
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
                        <Text style={{ color: s.label === contact?.status ? s.color : textColor, fontSize: 13, fontWeight: s.label === contact?.status ? '700' : '400' }}>
                          {s.label}
                        </Text>
                        {s.label === contact?.status && (
                          <Text style={{ color: s.color, fontSize: 10, marginLeft: 'auto' }}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              {/* Interactive Stage Badge (matches Web CRM stage modal) */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setStageModalOpen(true)}
                style={[styles.pillBadge, { backgroundColor: '#8b5cf615', borderWidth: 1, borderColor: '#8b5cf630' }]}
              >
                <Briefcase size={12} color="#8b5cf6" />
                <Text style={[styles.pillBadgeText, { color: '#8b5cf6' }]}>
                  {contact?.stage || 'Set Stage'}
                </Text>
                <Pen size={10} color="#8b5cf6" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
              {contact?.source && (
                <View style={[styles.pillBadge, { backgroundColor: '#10b98115' }]}>
                  <Building size={12} color="#10b981" />
                  <Text style={[styles.pillBadgeText, { color: '#10b981' }]}>
                    {contact.source}
                  </Text>
                </View>
              )}
            </View>

            {/* Action Bar */}
            <View style={[styles.actionRow, { borderTopColor: borderCol }]}>
              <TouchableOpacity
                onPress={handleCall}
                disabled={!contact?.phone}
                style={[styles.actionBtn, { backgroundColor: contact?.phone ? '#10b98115' : inputBg }]}
              >
                <Phone size={16} color={contact?.phone ? '#10b981' : subTextColor} />
                <Text style={[styles.actionBtnText, { color: contact?.phone ? '#10b981' : subTextColor }]}>
                  Call
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleWhatsApp}
                disabled={!contact?.phone}
                style={[styles.actionBtn, { backgroundColor: contact?.phone ? '#22c55e15' : inputBg }]}
              >
                <MessageCircle size={16} color={contact?.phone ? '#22c55e' : subTextColor} />
                <Text style={[styles.actionBtnText, { color: contact?.phone ? '#22c55e' : subTextColor }]}>
                  WhatsApp
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleEmail}
                disabled={!contact?.email}
                style={[styles.actionBtn, { backgroundColor: contact?.email ? '#3b82f615' : inputBg }]}
              >
                <Mail size={16} color={contact?.email ? '#3b82f6' : subTextColor} />
                <Text style={[styles.actionBtnText, { color: contact?.email ? '#3b82f6' : subTextColor }]}>
                  Email
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAssignModalOpen(true)}
                style={[styles.actionBtn, { backgroundColor: '#8b5cf615' }]}
              >
                <UserCheck size={16} color="#8b5cf6" />
                <Text style={[styles.actionBtnText, { color: '#8b5cf6' }]}>
                  Assign
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Horizontal Scrollable Tabs */}
          <View style={{ paddingTop: 16 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            >
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={[
                      styles.tabPill,
                      {
                        backgroundColor: isActive ? '#3b82f6' : cardBg,
                        borderColor: isActive ? '#3b82f6' : borderCol,
                      },
                    ]}
                  >
                    <IconComponent size={14} color={isActive ? '#ffffff' : subTextColor} />
                    <Text style={[styles.tabPillText, { color: isActive ? '#ffffff' : textColor }]}>
                      {tab.label}
                    </Text>
                    {typeof tab.count === 'number' && (
                      <View
                        style={[
                          styles.tabCountBadge,
                          { backgroundColor: isActive ? '#ffffff30' : inputBg },
                        ]}
                      >
                        <Text style={[styles.tabCountText, { color: isActive ? '#ffffff' : subTextColor }]}>
                          {tab.count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Tab Content Section */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            {/* TAB 1: Contact Information */}
            {activeTab === 'contact' && (
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Contact Information</Text>
                {/* Same titles/values/visibility as web Lead Details > Contact Information */}
                <View style={styles.gridContainer}>
                  <GridItem label="Email" value={contact?.email || 'Not provided'} textColor={textColor} subTextColor={subTextColor} />
                  <GridItem label="Phone" value={contact?.phone || '-'} textColor={textColor} subTextColor={subTextColor} />
                  {contact?.groupName || requirements?.groupName ? (
                    <GridItem label="Group Name" value={(contact?.groupName || requirements?.groupName) as string} textColor={textColor} subTextColor={subTextColor} />
                  ) : null}
                  <GridItem label="Assigned Executive" value={contact?.assignedToAgentName || (contact?.assignedToAgentId ? `Agent #${contact.assignedToAgentId}` : 'Unassigned')} textColor={textColor} subTextColor={subTextColor} />
                  {contact?.source ? (
                    <GridItem label="Lead Source" value={contact.source} textColor={textColor} subTextColor={subTextColor} />
                  ) : null}
                  <GridItem label="Created On" value={formatLongDateTime(contact?.createdDate)} textColor={textColor} subTextColor={subTextColor} />
                  {contact?.modifiedOn ? (
                    <GridItem label="Last Modified" value={formatLongDateTime(contact.modifiedOn)} textColor={textColor} subTextColor={subTextColor} />
                  ) : null}
                </View>
              </View>
            )}

            {/* Next Follow-up — same as web Lead Details card */}
            {activeTab === 'contact' && contact?.followUpDate ? (() => {
              const countdown = getFollowUpCountdown(contact.followUpDate);
              return (
                <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol, marginTop: 12 }]}>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Next Follow-up</Text>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }}>
                    {formatLongDate(contact.followUpDate)}
                  </Text>
                  {countdown ? (
                    <Text style={{ fontSize: 12, marginTop: 2, fontWeight: countdown.color ? '700' : '400', color: countdown.color || subTextColor }}>
                      {countdown.text}
                    </Text>
                  ) : null}
                  {contact.stage ? (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#3b82f6', backgroundColor: '#3b82f615', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' }}>
                        {contact.stage}
                      </Text>
                      {contact.status ? (
                        <Text style={{ fontSize: 11, fontWeight: '600', color: subTextColor, backgroundColor: inputBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' }}>
                          {contact.status}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })() : null}

            {/* TAB 2: Property Requirements */}
            {activeTab === 'requirements' && (
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Property Requirements</Text>
                {/* Same titles/values as web Lead Details > Property Requirements (shown only when set) */}
                <View style={styles.gridContainer}>
                  {requirements?.preferredLocation ? (
                    <GridItem label="Preferred Location" value={requirements.preferredLocation} textColor={textColor} subTextColor={subTextColor} />
                  ) : null}
                  {requirements?.type ? (
                    <GridItem label="Type" value={requirements.type} textColor={textColor} subTextColor={subTextColor} />
                  ) : null}
                  {requirements?.propertyType ? (
                    <GridItem label="Property Type" value={requirements.propertyType} textColor={textColor} subTextColor={subTextColor} />
                  ) : null}
                  {requirements?.bhk ? (
                    <GridItem label="BHK" value={requirements.bhk} textColor={textColor} subTextColor={subTextColor} />
                  ) : null}
                  {requirements?.sqft ? (
                    <GridItem label="Square Feet" value={`${requirements.sqft} sq.ft`} textColor={textColor} subTextColor={subTextColor} />
                  ) : null}
                  {requirements?.facing ? (
                    <GridItem label="Facing" value={requirements.facing} textColor={textColor} subTextColor={subTextColor} />
                  ) : null}
                  {(requirements?.locationDistance || contact?.locationDistance) ? (
                    <GridItem label="Location Distance" value={(requirements?.locationDistance || contact?.locationDistance) as string} textColor={textColor} subTextColor={subTextColor} />
                  ) : null}
                </View>
                {!(requirements?.preferredLocation || requirements?.type || requirements?.propertyType || requirements?.bhk ||
                  requirements?.sqft || requirements?.facing || requirements?.locationDistance || contact?.locationDistance) ? (
                  <Text style={{ fontSize: 13, color: subTextColor }}>No property requirements added.</Text>
                ) : null}
              </View>
            )}

            {/* Additional Details — same as web (shown when Requirements or Comments exist) */}
            {activeTab === 'requirements' && (requirements?.requirement || contact?.comments) ? (
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol, marginTop: 12 }]}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Additional Details</Text>
                {requirements?.requirement ? (
                  <View style={{ marginBottom: contact?.comments ? 12 : 0 }}>
                    <Text style={[styles.gridLabel, { color: subTextColor }]}>Requirements</Text>
                    <Text style={[styles.commentText, { color: textColor }]}>{requirements.requirement}</Text>
                  </View>
                ) : null}
                {contact?.comments ? (
                  <View>
                    <Text style={[styles.gridLabel, { color: subTextColor }]}>Comments</Text>
                    <Text style={[styles.commentText, { color: textColor }]}>{contact.comments}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* TAB 3: Activities */}
            {activeTab === 'activities' && (
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Activity size={18} color="#3b82f6" />
                  <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>Activity History</Text>
                </View>
                {activities.length === 0 ? (
                  <EmptyState text="No activity logs recorded yet." subTextColor={subTextColor} />
                ) : (
                  <View style={styles.timelineList}>
                    {activities.map((act, index) => {
                      const iconInfo = getActivityIconInfo(act.activity);
                      const ActIcon = iconInfo.icon;
                      return (
                        <View key={act.historyId || index} style={styles.timelineItem}>
                          <View style={styles.timelineDotContainer}>
                            <View style={[styles.activityIconCircle, { backgroundColor: iconInfo.bg }]}>
                              <ActIcon size={12} color={iconInfo.color} />
                            </View>
                            {index !== activities.length - 1 && (
                              <View style={[styles.timelineLine, { backgroundColor: borderCol }]} />
                            )}
                          </View>
                          <View style={[styles.timelineCard, { backgroundColor: inputBg, borderColor: borderCol }]}>
                            <Text style={[styles.timelineActivity, { color: textColor }]}>{act.activity}</Text>
                            <View style={styles.timelineMeta}>
                              <Clock size={12} color={subTextColor} />
                              <Text style={[styles.timelineTime, { color: subTextColor }]}>
                                {act.activityDateFormatted || formatDateTime(act.activityDate)}
                              </Text>
                              {(act.executiveName || act.executiveId) && (
                                <Text style={[styles.timelineTime, { color: subTextColor }]}>
                                  · {act.executiveName || `Exec #${act.executiveId}`}
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* TAB 4: Follow Ups */}
            {activeTab === 'followups' && (
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>Follow Ups & Schedule</Text>
                  <TouchableOpacity
                    onPress={() => openScheduleModal('followup')}
                    style={styles.addBtnSmall}
                  >
                    <Plus size={14} color="#ffffff" />
                    <Text style={styles.addBtnSmallText}>Add Follow-up</Text>
                  </TouchableOpacity>
                </View>

                {followUps.length === 0 ? (
                  <EmptyState text="No follow-up records found." subTextColor={subTextColor} />
                ) : (
                  <View style={{ gap: 12 }}>
                    {followUps.map((item) => (
                      <View key={item.followUpId} style={[styles.cardItem, { backgroundColor: inputBg, borderColor: borderCol }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <CalendarCheck size={16} color="#3b82f6" />
                            <Text style={[styles.cardItemTitle, { color: textColor }]}>
                              {item.stage || 'Follow Up'}
                            </Text>
                          </View>
                          <View style={[styles.pillBadge, { backgroundColor: item.status === 'Completed' ? '#10b98115' : '#f59e0b15' }]}>
                            <Text style={[styles.pillBadgeText, { color: item.status === 'Completed' ? '#10b981' : '#f59e0b' }]}>
                              {item.status || 'Pending'}
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.cardItemSub, { color: subTextColor, marginTop: 6 }]}>
                          Date: {formatDate(item.followUpDate)} {item.followUpTime ? `· ${item.followUpTime}` : ''}
                        </Text>

                        {item.comments ? (
                          <Text style={[styles.cardItemDesc, { color: textColor, marginTop: 6 }]}>
                            {item.comments}
                          </Text>
                        ) : null}

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                          {item.interestStatus && (
                            <Text style={{ fontSize: 12, color: subTextColor }}>
                              Interest: <Text style={{ color: textColor, fontWeight: '600' }}>{item.interestStatus}</Text>
                            </Text>
                          )}
                          {item.rating && (
                            <Text style={{ fontSize: 12, color: subTextColor }}>
                              Rating: <Text style={{ color: '#f59e0b', fontWeight: '600' }}>{item.rating} ★</Text>
                            </Text>
                          )}
                          {item.executiveId && (
                            <Text style={{ fontSize: 12, color: subTextColor }}>
                              Executive: #{item.executiveId}
                            </Text>
                          )}
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: borderCol + '40' }}>
                          <TouchableOpacity
                            onPress={() => openEditScheduleModal(item)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                          >
                            <CalendarCheck size={14} color="#3b82f6" />
                            <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '600' }}>Edit / Complete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* TAB 5: Notes */}
            {activeTab === 'notes' && (
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Internal Notes & Remarks</Text>

                {/* Add Note Input Box */}
                <View style={[styles.addNoteBox, { backgroundColor: inputBg, borderColor: borderCol }]}>
                  <TextInput
                    style={[styles.noteInput, { color: textColor }]}
                    placeholder="Type an internal remark or comment..."
                    placeholderTextColor={subTextColor}
                    multiline
                    value={newNoteText}
                    onChangeText={setNewNoteText}
                  />
                  <TouchableOpacity
                    onPress={handleAddNote}
                    disabled={isSubmittingNote || !newNoteText.trim()}
                    style={[
                      styles.sendNoteBtn,
                      { opacity: isSubmittingNote || !newNoteText.trim() ? 0.5 : 1 },
                    ]}
                  >
                    {isSubmittingNote ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Send size={14} color="#ffffff" />
                        <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 13 }}></Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {notes.length === 0 ? (
                  <EmptyState text="No notes added for this lead yet." subTextColor={subTextColor} />
                ) : (
                  <View style={{ gap: 12, marginTop: 14 }}>
                    {notes.map((note) => (
                      <View key={note.noteId} style={[styles.cardItem, { backgroundColor: inputBg, borderColor: borderCol }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Text style={[styles.cardItemDesc, { color: textColor, flex: 1 }]}>{note.noteText}</Text>
                          <TouchableOpacity
                            onPress={() => handleDeleteNote(note.noteId)}
                            style={{ padding: 4, marginLeft: 8 }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Trash2 size={15} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                          <Text style={{ fontSize: 11, color: subTextColor }}>
                            {formatDateTime(note.createdOn)}
                          </Text>
                          {note.executiveId && (
                            <Text style={{ fontSize: 11, color: subTextColor }}>
                              By Exec #{note.executiveId}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* TAB 6: Uploads / Documents */}
            {activeTab === 'documents' && (
              <View style={{ gap: 16 }}>
                {/* Upload Action Card */}
                <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Paperclip size={18} color="#3b82f6" />
                      <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>Lead Documents</Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleUploadDocument}
                      disabled={isUploading}
                      style={styles.addBtnSmall}
                    >
                      {isUploading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Upload size={14} color="#ffffff" />
                          <Text style={styles.addBtnSmallText}>Upload File</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  <Text style={{ fontSize: 11, color: subTextColor, marginBottom: 14 }}>
                    Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max: 10MB)
                  </Text>

                  {documents.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 28 }}>
                      <Paperclip size={36} color={subTextColor} style={{ opacity: 0.5, marginBottom: 8 }} />
                      <Text style={{ color: textColor, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
                        No Documents Uploaded
                      </Text>
                      <Text style={{ color: subTextColor, fontSize: 12, textAlign: 'center' }}>
                        Upload your first document using the button above.
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: 10 }}>
                      {documents.map((doc) => {
                        const iconInfo = getFileIconInfo(doc.fileName);
                        const DocIcon = iconInfo.icon;
                        return (
                          <View
                            key={doc.uploadId}
                            style={[
                              styles.docItem,
                              { backgroundColor: inputBg, borderColor: borderCol, flexDirection: 'row', alignItems: 'center' },
                            ]}
                          >
                            <TouchableOpacity
                              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                              onPress={() => {
                                if (doc.filePath) {
                                  openFileUrl(doc.filePath);
                                }
                              }}
                              activeOpacity={0.7}
                            >
                              <View
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 8,
                                  backgroundColor: iconInfo.bg,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <DocIcon size={20} color={iconInfo.color} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.docName, { color: textColor }]} numberOfLines={1}>
                                  {doc.fileName}
                                </Text>
                                <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                                  {formatDateTime(doc.uploadedOn)}
                                </Text>
                              </View>
                            </TouchableOpacity>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                              {doc.filePath ? (
                                <TouchableOpacity
                                  onPress={() => openFileUrl(doc.filePath)}
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 6,
                                    backgroundColor: '#3b82f615',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                >
                                  <Download size={15} color="#3b82f6" />
                                </TouchableOpacity>
                              ) : null}
                              <TouchableOpacity
                                onPress={() => handleDeleteDocument(doc.uploadId)}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 6,
                                  backgroundColor: '#ef444415',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                              >
                                <Trash2 size={15} color="#ef4444" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* TAB: Transactions & Documents */}
            {activeTab === 'transactions' && (
              <View style={{ gap: 16 }}>
                {/* Financial Summary Metric Cards */}
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <View
                    style={{
                      flex: 1,
                      minWidth: '45%',
                      backgroundColor: cardBg,
                      borderColor: borderCol,
                      borderWidth: 1,
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#0284c715', alignItems: 'center', justifyContent: 'center' }}>
                        <FileSpreadsheet size={16} color="#0284c7" />
                      </View>
                      <View>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>{quotations.length}</Text>
                        <Text style={{ fontSize: 11, color: subTextColor }}>Quotations</Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={{
                      flex: 1,
                      minWidth: '45%',
                      backgroundColor: cardBg,
                      borderColor: borderCol,
                      borderWidth: 1,
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#16a34a15', alignItems: 'center', justifyContent: 'center' }}>
                        <FileCheck size={16} color="#16a34a" />
                      </View>
                      <View>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>{bookings.length || bookingDocuments.length}</Text>
                        <Text style={{ fontSize: 11, color: subTextColor }}>Bookings</Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={{
                      flex: 1,
                      minWidth: '45%',
                      backgroundColor: cardBg,
                      borderColor: borderCol,
                      borderWidth: 1,
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#8b5cf615', alignItems: 'center', justifyContent: 'center' }}>
                        <Receipt size={16} color="#8b5cf6" />
                      </View>
                      <View>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>{invoices.length}</Text>
                        <Text style={{ fontSize: 11, color: subTextColor }}>Invoices</Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={{
                      flex: 1,
                      minWidth: '45%',
                      backgroundColor: cardBg,
                      borderColor: borderCol,
                      borderWidth: 1,
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#d9770615', alignItems: 'center', justifyContent: 'center' }}>
                        <CreditCard size={16} color="#d97706" />
                      </View>
                      <View>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>{payments.length}</Text>
                        <Text style={{ fontSize: 11, color: subTextColor }}>Payments</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Sub-section 1: Quotations */}
                <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <FileSpreadsheet size={18} color="#0284c7" />
                      <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>Quotations</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.addBtnSmall, { backgroundColor: '#0284c7' }]}
                      onPress={() => router.push('/admin/SalesUnit/quotation')}
                    >
                      <Plus size={14} color="#ffffff" />
                      <Text style={styles.addBtnSmallText}>New Quotation</Text>
                    </TouchableOpacity>
                  </View>

                  {quotations.length === 0 ? (
                    <Text style={{ fontSize: 13, color: subTextColor }}>No quotations available for this lead.</Text>
                  ) : (
                    <View style={{ gap: 10 }}>
                      {quotations.map((q) => (
                        <TouchableOpacity
                          key={q.quotationId}
                          style={[styles.docItem, { backgroundColor: inputBg, borderColor: borderCol }]}
                          onPress={() => router.push(`/admin/SalesUnit/quotation/${q.quotationId}`)}
                          activeOpacity={0.7}
                        >
                          <FileSpreadsheet size={20} color="#0284c7" />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.docName, { color: textColor }]} numberOfLines={1}>
                              {q.quotationNumber || `Quotation #${q.quotationId}`}
                            </Text>
                            <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                              Property: {q.propertyName || 'N/A'} {q.flatNumber ? `· Unit ${q.flatNumber}` : ''}
                            </Text>
                            <Text style={{ fontSize: 11, color: subTextColor, marginTop: 1 }}>
                              Total: ₹{Number(q.grandTotal || 0).toLocaleString('en-IN')} · Date: {formatDate(q.quotationDate)}
                            </Text>
                            <Text
                              style={{
                                fontSize: 10,
                                color:
                                  q.status === 'Accepted'
                                    ? '#10b981'
                                    : q.status === 'Rejected'
                                      ? '#ef4444'
                                      : '#f59e0b',
                                marginTop: 4,
                                fontWeight: 'bold',
                              }}
                            >
                              Status: {q.status || 'Draft'}
                            </Text>
                          </View>
                          <ExternalLink size={16} color={subTextColor} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Sub-section 2: Booking Documents */}
                <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <FileCheck size={18} color="#16a34a" />
                      <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>Booking Documents</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.addBtnSmall, { backgroundColor: '#16a34a' }]}
                      onPress={() => router.push('/admin/SalesUnit/bookings')}
                    >
                      <Plus size={14} color="#ffffff" />
                      <Text style={styles.addBtnSmallText}>View Bookings</Text>
                    </TouchableOpacity>
                  </View>

                  {bookingDocuments.length === 0 ? (
                    <Text style={{ fontSize: 13, color: subTextColor }}>No booking documents available for this lead.</Text>
                  ) : (
                    <View style={{ gap: 10 }}>
                      {bookingDocuments.map((doc) => (
                        <TouchableOpacity
                          key={doc.documentId}
                          style={[styles.docItem, { backgroundColor: inputBg, borderColor: borderCol }]}
                          onPress={() => {
                            if (doc.filePath) {
                              openFileUrl(doc.filePath);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <FileCheck size={20} color="#16a34a" />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.docName, { color: textColor }]} numberOfLines={1}>
                              {doc.documentName}
                            </Text>
                            <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                              Booking: {doc.bookingNumber || 'N/A'} · Type: {doc.documentType}
                            </Text>
                            <Text style={{ fontSize: 11, color: subTextColor, marginTop: 1 }}>
                              Uploaded: {formatDate(doc.uploadedOn)}
                            </Text>
                          </View>
                          {doc.filePath ? <Download size={16} color="#16a34a" /> : null}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Sub-section 3: Invoice Documents */}
                <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Receipt size={18} color="#8b5cf6" />
                      <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>Invoice Documents</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.addBtnSmall, { backgroundColor: '#8b5cf6' }]}
                      onPress={() => router.push('/admin/SalesUnit/invoice')}
                    >
                      <Plus size={14} color="#ffffff" />
                      <Text style={styles.addBtnSmallText}>New Invoice</Text>
                    </TouchableOpacity>
                  </View>

                  {invoices.length === 0 ? (
                    <Text style={{ fontSize: 13, color: subTextColor }}>No invoice documents available for this lead.</Text>
                  ) : (
                    <View style={{ gap: 10 }}>
                      {invoices.map((inv) => (
                        <TouchableOpacity
                          key={inv.invoiceId}
                          style={[styles.docItem, { backgroundColor: inputBg, borderColor: borderCol }]}
                          onPress={() => router.push('/admin/SalesUnit/invoice')}
                          activeOpacity={0.7}
                        >
                          <Receipt size={20} color="#8b5cf6" />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.docName, { color: textColor }]} numberOfLines={1}>
                              {inv.invoiceNumber}
                            </Text>
                            <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                              Booking: {inv.bookingNumber} · Amount: ₹{Number(inv.totalAmount || 0).toLocaleString('en-IN')}
                            </Text>
                            <Text style={{ fontSize: 11, color: subTextColor, marginTop: 1 }}>
                              Due: {formatDate(inv.dueDate)}
                            </Text>
                            <Text
                              style={{
                                fontSize: 10,
                                color: inv.status === 'Paid' ? '#10b981' : '#ef4444',
                                marginTop: 4,
                                fontWeight: 'bold',
                              }}
                            >
                              Status: {inv.status || 'Unpaid'}
                            </Text>
                          </View>
                          <ExternalLink size={16} color={subTextColor} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Sub-section 4: Payments */}
                <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <CreditCard size={18} color="#d97706" />
                      <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>Payments</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.addBtnSmall, { backgroundColor: '#d97706' }]}
                      onPress={() => router.push('/admin/SalesUnit/payments')}
                    >
                      <Plus size={14} color="#ffffff" />
                      <Text style={styles.addBtnSmallText}>Record Payment</Text>
                    </TouchableOpacity>
                  </View>

                  {payments.length === 0 ? (
                    <Text style={{ fontSize: 13, color: subTextColor }}>No payments recorded for this lead.</Text>
                  ) : (
                    <View style={{ gap: 10 }}>
                      {payments.map((p) => (
                        <TouchableOpacity
                          key={p.paymentId}
                          style={[styles.docItem, { backgroundColor: inputBg, borderColor: borderCol }]}
                          onPress={() => router.push('/admin/SalesUnit/payments')}
                          activeOpacity={0.7}
                        >
                          <CreditCard size={20} color="#d97706" />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.docName, { color: textColor }]} numberOfLines={1}>
                              Receipt: {p.receiptNumber}
                            </Text>
                            <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                              Booking: {p.bookingNumber} · Amount: ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                            </Text>
                            <Text style={{ fontSize: 11, color: subTextColor, marginTop: 1 }}>
                              Date: {formatDate(p.paymentDate)} · Method: {p.paymentMethod}
                            </Text>
                          </View>
                          <ExternalLink size={16} color={subTextColor} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* TAB 7: Site Visit Activities */}
            {activeTab === 'sitevisits' && (
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol, padding: 0, overflow: 'hidden' }]}>
                {/* Header matching user image - Clean with no schedule button */}
                <View style={{
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottomWidth: 1,
                  borderBottomColor: borderCol,
                  backgroundColor: cardBg,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Building size={20} color="#0284c7" />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>
                      Site Visit Activities
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: '#0d6efd',
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 20,
                  }}>
                    <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>
                      {siteVisits.length} properties visited
                    </Text>
                  </View>
                </View>

                {siteVisits.length === 0 ? (
                  <View style={{ padding: 28, alignItems: 'center' }}>
                    <Building size={40} color={subTextColor} style={{ opacity: 0.4, marginBottom: 8 }} />
                    <Text style={{ color: textColor, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
                      No Site Visits Yet
                    </Text>
                    <Text style={{ color: subTextColor, fontSize: 12, textAlign: 'center' }}>
                      This lead hasn't visited any properties yet.
                    </Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ minWidth: 630 }}>
                      {/* Table Header Row */}
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                        borderBottomWidth: 1,
                        borderBottomColor: borderCol,
                      }}>
                        <Text style={{ width: 60, fontSize: 13, fontWeight: '700', color: subTextColor }}>S.No</Text>
                        <Text style={{ width: 250, fontSize: 13, fontWeight: '700', color: subTextColor }}>Property Name</Text>
                        <Text style={{ width: 320, fontSize: 13, fontWeight: '700', color: subTextColor }}>Interest Status</Text>
                      </View>

                      {/* Table Rows */}
                      {siteVisits.map((visit, index) => {
                        const isUpdatingThis = updatingInterestFollowUpId === visit.followUpId;
                        const currentStatus = visit.interestStatus;
                        const isInterested = currentStatus === 'Interested';
                        const isNotInterested = currentStatus === 'Not Interested';
                        const isCold = currentStatus === 'Cold';

                        const visitDateStr = visit.visitDateFormatted || formatDate(visit.visitDate || visit.followUpDate);

                        return (
                          <View
                            key={visit.followUpId || index}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingHorizontal: 16,
                              paddingVertical: 14,
                              borderBottomWidth: index === siteVisits.length - 1 ? 0 : 1,
                              borderBottomColor: borderCol,
                              backgroundColor: cardBg,
                            }}
                          >
                            {/* Column 1: S.No Badge */}
                            <View style={{ width: 60, justifyContent: 'center' }}>
                              <View style={{
                                width: 26,
                                height: 26,
                                borderRadius: 6,
                                backgroundColor: '#475569',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>
                                  {index + 1}
                                </Text>
                              </View>
                            </View>

                            {/* Column 2: Property Icon & Details */}
                            <View style={{ width: 250, flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 12 }}>
                              <View style={{
                                width: 38,
                                height: 38,
                                borderRadius: 8,
                                backgroundColor: '#00918E',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}>
                                <Building size={18} color="#ffffff" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }} numberOfLines={1}>
                                  {visit.propertyName || (visit as any).propertyTitle || 'Property #' + (visit.propertyId || visit.followUpId)}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                                  <Calendar size={11} color={subTextColor} />
                                  <Text style={{ fontSize: 11, color: subTextColor }}>
                                    Visited: {visitDateStr}
                                  </Text>
                                </View>
                              </View>
                            </View>

                            {/* Column 3: Interest Status 3-Button Group */}
                            <View style={{ width: 320, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              {/* 1. INTERESTED */}
                              <TouchableOpacity
                                onPress={() => handleUpdateInterest(visit.followUpId, 'Interested')}
                                disabled={isUpdatingThis}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 5,
                                  paddingHorizontal: 10,
                                  paddingVertical: 7,
                                  borderRadius: 6,
                                  borderWidth: 1.5,
                                  borderColor: '#28a745',
                                  backgroundColor: isInterested
                                    ? '#28a745'
                                    : isDark
                                      ? '#14532d25'
                                      : '#d4edda',
                                }}
                                activeOpacity={0.7}
                              >
                                <ThumbsUp size={13} color={isInterested ? '#ffffff' : isDark ? '#4ade80' : '#155724'} />
                                <Text style={{
                                  fontSize: 11,
                                  fontWeight: '700',
                                  color: isInterested ? '#ffffff' : isDark ? '#4ade80' : '#155724',
                                  letterSpacing: 0.3,
                                }}>
                                  INTERESTED
                                </Text>
                              </TouchableOpacity>

                              {/* 2. NOT INTERESTED */}
                              <TouchableOpacity
                                onPress={() => handleUpdateInterest(visit.followUpId, 'Not Interested')}
                                disabled={isUpdatingThis}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 5,
                                  paddingHorizontal: 10,
                                  paddingVertical: 7,
                                  borderRadius: 6,
                                  borderWidth: 1.5,
                                  borderColor: '#dc3545',
                                  backgroundColor: isNotInterested
                                    ? '#dc3545'
                                    : isDark
                                      ? '#7f1d1d25'
                                      : '#f8d7da',
                                }}
                                activeOpacity={0.7}
                              >
                                <ThumbsDown size={13} color={isNotInterested ? '#ffffff' : isDark ? '#f87171' : '#721c24'} />
                                <Text style={{
                                  fontSize: 11,
                                  fontWeight: '700',
                                  color: isNotInterested ? '#ffffff' : isDark ? '#f87171' : '#721c24',
                                  letterSpacing: 0.3,
                                }}>
                                  NOT INTERESTED
                                </Text>
                              </TouchableOpacity>

                              {/* 3. COLD */}
                              <TouchableOpacity
                                onPress={() => handleUpdateInterest(visit.followUpId, 'Cold')}
                                disabled={isUpdatingThis}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 5,
                                  paddingHorizontal: 10,
                                  paddingVertical: 7,
                                  borderRadius: 6,
                                  borderWidth: 1.5,
                                  borderColor: '#17a2b8',
                                  backgroundColor: isCold
                                    ? '#17a2b8'
                                    : isDark
                                      ? '#164e6325'
                                      : '#d1ecf1',
                                }}
                                activeOpacity={0.7}
                              >
                                <Snowflake size={13} color={isCold ? '#ffffff' : isDark ? '#38bdf8' : '#0c5460'} />
                                <Text style={{
                                  fontSize: 11,
                                  fontWeight: '700',
                                  color: isCold ? '#ffffff' : isDark ? '#38bdf8' : '#0c5460',
                                  letterSpacing: 0.3,
                                }}>
                                  COLD
                                </Text>
                              </TouchableOpacity>

                              {isUpdatingThis && (
                                <ActivityIndicator size="small" color="#0284c7" style={{ marginLeft: 4 }} />
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}
              </View>
            )}

            {/* TAB 8: Stage Transitions */}
            {/* {activeTab === 'transitions' && (
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Stage Transition History</Text>
                {transitions.length === 0 ? (
                  <EmptyState text="No stage transitions recorded yet." subTextColor={subTextColor} />
                ) : (
                  <View style={styles.timelineList}>
                    {transitions.map((item, index) => (
                      <View key={item.historyId || index} style={styles.timelineItem}>
                        <View style={styles.timelineDotContainer}>
                          <View style={[styles.timelineDot, { backgroundColor: '#8b5cf6' }]} />
                          {index !== transitions.length - 1 && <View style={[styles.timelineLine, { backgroundColor: borderCol }]} />}
                        </View>
                        <View style={[styles.timelineCard, { backgroundColor: inputBg, borderColor: borderCol }]}>
                          <Text style={[styles.timelineActivity, { color: textColor }]}>{item.activity}</Text>
                          <View style={styles.timelineMeta}>
                            <Clock size={12} color={subTextColor} />
                            <Text style={[styles.timelineTime, { color: subTextColor }]}>
                              {formatDateTime(item.activityDate)}
                            </Text>
                            {item.executiveId && (
                              <Text style={[styles.timelineTime, { color: subTextColor }]}>
                                · Exec #{item.executiveId}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )} */}
          </View>
        </ScrollView>
      )}

      {/* Modal for Adding Follow-Up or Scheduling Site Visit */}
      <Modal visible={isModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                {modalType === 'sitevisit' ? 'Schedule Site Visit' : 'Add Follow-up'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X size={20} color={subTextColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }} nestedScrollEnabled={true}>
              {/* Stage Selection */}
              <Text style={[styles.inputLabel, { color: subTextColor }]}>Stage *</Text>
              <TouchableOpacity
                onPress={() => {
                  setStageSelectOpen(!stageSelectOpen);
                  setStatusSelectOpen(false);
                  setRatingSelectOpen(false);
                  setInterestSelectOpen(false);
                }}
                style={[styles.dropdownTrigger, { backgroundColor: inputBg, borderColor: borderCol }]}
              >
                <Text style={{ color: formStage ? textColor : subTextColor }}>
                  {options.stages.find((s: any) => s.value === formStage)?.label || formStage || 'Select Stage'}
                </Text>
                <ChevronDown size={14} color={subTextColor} />
              </TouchableOpacity>
              {stageSelectOpen && (
                <View style={[styles.dropdownOptionsList, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  {options.stages.map((item: any) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[styles.dropdownOptionItem, { borderBottomColor: borderCol }]}
                      onPress={() => {
                        setFormStage(item.value);
                        setStageSelectOpen(false);
                      }}
                    >
                      <Text style={{ color: textColor }}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Status Selection */}
              <Text style={[styles.inputLabel, { color: subTextColor }]}>Status *</Text>
              <TouchableOpacity
                onPress={() => {
                  setStatusSelectOpen(!statusSelectOpen);
                  setStageSelectOpen(false);
                  setRatingSelectOpen(false);
                  setInterestSelectOpen(false);
                }}
                style={[styles.dropdownTrigger, { backgroundColor: inputBg, borderColor: borderCol }]}
              >
                <Text style={{ color: formStatus ? textColor : subTextColor }}>
                  {options.followUpStatuses.find((s: any) => s.value === formStatus)?.label || formStatus || 'Select Status'}
                </Text>
                <ChevronDown size={14} color={subTextColor} />
              </TouchableOpacity>
              {statusSelectOpen && (
                <View style={[styles.dropdownOptionsList, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  {options.followUpStatuses.map((item: any) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[styles.dropdownOptionItem, { borderBottomColor: borderCol }]}
                      onPress={() => {
                        setFormStatus(item.value);
                        setStatusSelectOpen(false);
                      }}
                    >
                      <Text style={{ color: textColor }}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Date Input */}
              <Text style={[styles.inputLabel, { color: subTextColor }]}>Date & Time (ISO) *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: inputBg, color: textColor, borderWidth: 1, borderColor: borderCol }]}
                value={formDate}
                onChangeText={setFormDate}
              />

              {/* Rating Selection */}
              <Text style={[styles.inputLabel, { color: subTextColor }]}>Rating</Text>
              <TouchableOpacity
                onPress={() => {
                  setRatingSelectOpen(!ratingSelectOpen);
                  setStageSelectOpen(false);
                  setStatusSelectOpen(false);
                  setInterestSelectOpen(false);
                }}
                style={[styles.dropdownTrigger, { backgroundColor: inputBg, borderColor: borderCol }]}
              >
                <Text style={{ color: formRating ? textColor : subTextColor }}>
                  {options.ratings.find((r: any) => r.value === formRating)?.label || formRating || 'Select Rating'}
                </Text>
                <ChevronDown size={14} color={subTextColor} />
              </TouchableOpacity>
              {ratingSelectOpen && (
                <View style={[styles.dropdownOptionsList, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  {options.ratings.map((item: any) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[styles.dropdownOptionItem, { borderBottomColor: borderCol }]}
                      onPress={() => {
                        setFormRating(item.value);
                        setRatingSelectOpen(false);
                      }}
                    >
                      <Text style={{ color: textColor }}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Interest Status Selection */}
              <Text style={[styles.inputLabel, { color: subTextColor }]}>Interest Status</Text>
              <TouchableOpacity
                onPress={() => {
                  setInterestSelectOpen(!interestSelectOpen);
                  setStageSelectOpen(false);
                  setStatusSelectOpen(false);
                  setRatingSelectOpen(false);
                }}
                style={[styles.dropdownTrigger, { backgroundColor: inputBg, borderColor: borderCol }]}
              >
                <Text style={{ color: formInterest ? textColor : subTextColor }}>
                  {options.interestStatuses.find((i: any) => i.value === formInterest)?.label || formInterest || 'Select Interest Status'}
                </Text>
                <ChevronDown size={14} color={subTextColor} />
              </TouchableOpacity>
              {interestSelectOpen && (
                <View style={[styles.dropdownOptionsList, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  {options.interestStatuses.map((item: any) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[styles.dropdownOptionItem, { borderBottomColor: borderCol }]}
                      onPress={() => {
                        setFormInterest(item.value);
                        setInterestSelectOpen(false);
                      }}
                    >
                      <Text style={{ color: textColor }}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Comments Input */}
              <Text style={[styles.inputLabel, { color: subTextColor }]}>Comments</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: inputBg, color: textColor, height: 70, borderWidth: 1, borderColor: borderCol, textAlignVertical: 'top' }]}
                multiline
                placeholder="Enter remarks or schedule comments..."
                placeholderTextColor={subTextColor}
                value={formComments}
                onChangeText={setFormComments}
              />
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                style={[styles.modalBtn, { backgroundColor: inputBg }]}
              >
                <Text style={{ color: textColor, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitModalForm}
                disabled={isSubmittingForm}
                style={[styles.modalBtn, { backgroundColor: '#3b82f6', flex: 1 }]}
              >
                {isSubmittingForm ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={{ color: '#ffffff', fontWeight: '600' }}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reusable Lead Assignment Modal */}
      <LeadAssignmentModal
        visible={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        leadId={Number(leadId)}
        leadName={contact?.fullName}
        currentAgentId={contact?.assignedToAgentId}
        currentAgentName={contact?.assignedToAgentName}
        onSuccess={(_newAgentId, _newAgentName) => {
          fetchLeadDetails(leadId);
        }}
      />

      {/* Reusable Lead Stage Modal */}
      <LeadStageModal
        visible={stageModalOpen}
        onClose={() => setStageModalOpen(false)}
        leadId={Number(leadId)}
        leadName={contact?.fullName}
        currentStage={contact?.stage}
        onSuccess={(_newStage) => {
          fetchLeadDetails(leadId);
        }}
      />

      {/* Upload File / Document Type Picker Modal */}
      <Modal
        visible={uploadPickerModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setUploadPickerModalOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setUploadPickerModalOpen(false)}
        >
          <Pressable
            style={[styles.modalCard, { backgroundColor: cardBg, borderColor: borderCol, maxWidth: 420 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Upload size={20} color="#3b82f6" />
                <Text style={[styles.modalTitle, { color: textColor }]}>Upload Attachment</Text>
              </View>
              <TouchableOpacity
                onPress={() => setUploadPickerModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color={subTextColor} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: subTextColor, marginBottom: 16 }}>
              Select whether you want to upload a document or an image:
            </Text>

            <View style={{ gap: 10 }}>
              {/* Option 1: Document */}
              <TouchableOpacity
                onPress={handlePickDocument}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: inputBg,
                  borderWidth: 1,
                  borderColor: borderCol,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: '#3b82f615',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText size={22} color="#3b82f6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                    Document File
                  </Text>
                  <Text style={{ fontSize: 12, color: subTextColor, marginTop: 2 }}>
                    PDF, Word (.doc, .docx), Excel (.xls, .xlsx)
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 2: Gallery */}
              <TouchableOpacity
                onPress={handlePickImage}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: inputBg,
                  borderWidth: 1,
                  borderColor: borderCol,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: '#10b98115',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ImageIcon size={22} color="#10b981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                    Photo Library / Gallery
                  </Text>
                  <Text style={{ fontSize: 12, color: subTextColor, marginTop: 2 }}>
                    JPG, JPEG, PNG from gallery
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 3: Camera */}
              <TouchableOpacity
                onPress={handleTakePhoto}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: inputBg,
                  borderWidth: 1,
                  borderColor: borderCol,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: '#8b5cf615',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Camera size={22} color="#8b5cf6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                    Take Photo
                  </Text>
                  <Text style={{ fontSize: 12, color: subTextColor, marginTop: 2 }}>
                    Capture photo directly using camera
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setUploadPickerModalOpen(false)}
              style={{
                marginTop: 16,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: inputBg,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// Subcomponents
function GridItem({
  label,
  value,
  textColor,
  subTextColor,
}: {
  label: string;
  value: string;
  textColor: string;
  subTextColor: string;
}) {
  return (
    <View style={styles.gridCell}>
      <Text style={[styles.gridLabel, { color: subTextColor }]}>{label}</Text>
      <Text style={[styles.gridValue, { color: textColor }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function EmptyState({ text, subTextColor }: { text: string; subTextColor: string }) {
  return (
    <View style={{ paddingVertical: 24, alignItems: 'center' }}>
      <Text style={{ fontSize: 13, color: subTextColor, textAlign: 'center' }}>{text}</Text>
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
    paddingTop: Platform.OS === 'ios' ? 48 : 40,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 16 : 12,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarLarge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  leadName: {
    fontSize: 18,
    fontWeight: '700',
  },
  leadSub: {
    fontSize: 12,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridCell: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 14,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  commentBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
  },
  commentTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineDotContainer: {
    alignItems: 'center',
    marginRight: 10,
  },
  activityIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  timelineActivity: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  timelineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  timelineTime: {
    fontSize: 11,
  },
  cardItem: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  cardItemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardItemSub: {
    fontSize: 12,
  },
  cardItemDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  docName: {
    fontSize: 13,
    fontWeight: '600',
  },
  addBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnSmallText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  addNoteBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  noteInput: {
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  sendNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    borderRadius: 50,
    width: 30,
    height: 30,
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 13,
  },
  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 40,
  },
  dropdownOptionsList: {
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownOptionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
});
