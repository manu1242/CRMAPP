import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import {
  useChannelPartner,
  useDeleteChannelPartner,
  useUpdateChannelPartner,
  useUploadPartnerDocument,
  useDeletePartnerDocument,
} from '../../../../admin/hooks/useChannelPartners';
import { ChannelPartnerService } from '../../../../admin/services/ChannelPartnerService';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Briefcase,
  UserCheck,
  Download,
  Plus,
  Check,
  Paperclip,
  Globe,
  Layers,
  Building2,
} from 'lucide-react-native';

export default function PartnerDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const { data, isLoading, refetch, isRefetching, error } = useChannelPartner(id);
  const deletePartnerMutation = useDeleteChannelPartner();
  const updatePartnerMutation = useUpdateChannelPartner();
  const uploadDocMutation = useUploadPartnerDocument();
  const deleteDocMutation = useDeletePartnerDocument();

  const partner = data?.data;

  // Re-fetch when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Modal open states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Downloading indicators
  const [isDownloading, setIsDownloading] = useState<number | string | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  // Form state for editing
  const [editForm, setEditForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    commissionScheme: 'Percentage',
    commissionPercentage: 5,
  });

  // State for picked document file
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    fileName: string;
    fileSize: number;
    type: string;
    customName: string;
    documentType: string;
  } | null>(null);

  const DOC_TYPES = ['License', 'Agreement', 'Registration', 'Tax', 'Others'];

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg;
  const brandColor = adminTheme.brand;

  // Populate edit form on open
  const handleOpenEdit = () => {
    if (!partner) return;
    setEditForm({
      companyName: partner.companyName || '',
      contactPerson: partner.contactPerson || '',
      email: partner.email || '',
      phone: partner.phone || '',
      address: partner.address || '',
      commissionScheme: partner.commissionScheme || 'Percentage',
      commissionPercentage: partner.commissionPercentage || 5,
    });
    setEditModalOpen(true);
  };

  const handleUpdatePartner = async () => {
    if (!partner) return;
    if (!editForm.companyName.trim() || !editForm.contactPerson.trim() || !editForm.email.trim() || !editForm.phone.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    try {
      await updatePartnerMutation.mutateAsync({
        id: partner.partnerId,
        data: {
          companyName: editForm.companyName.trim(),
          contactPerson: editForm.contactPerson.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
          address: editForm.address.trim() || null,
          commissionScheme: editForm.commissionScheme,
          commissionPercentage: editForm.commissionPercentage,
        },
      });

      Toast.show({
        type: 'success',
        text1: 'Updated',
        text2: 'Channel partner updated successfully',
      });
      setEditModalOpen(false);
    } catch (err: any) {
      console.error('Failed to update partner:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || 'Failed to update partner',
      });
    }
  };

  const handleDeletePartner = () => {
    if (!partner) return;
    Alert.alert(
      'Delete Channel Partner',
      `Are you sure you want to delete ${partner.companyName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePartnerMutation.mutateAsync(partner.partnerId);
              Toast.show({
                type: 'success',
                text1: 'Deleted',
                text2: 'Channel partner deleted successfully',
              });
              router.back();
            } catch (err: any) {
              console.error('Failed to delete partner:', err);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.response?.data?.message || 'Failed to delete channel partner',
              });
            }
          },
        },
      ]
    );
  };

  const handlePickDocument = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'We need storage permission to upload documents.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          fileName: asset.fileName || `cp_doc_${Date.now()}.jpg`,
          fileSize: asset.fileSize || 0,
          type: asset.mimeType || 'image/jpeg',
          customName: '',
          documentType: 'License',
        });
        setUploadModalOpen(true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to select file.');
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !partner) return;

    try {
      await uploadDocMutation.mutateAsync({
        partnerId: partner.partnerId,
        fileUri: selectedFile.uri,
        fileName: selectedFile.fileName,
        fileType: selectedFile.type,
        docName: selectedFile.customName.trim() || selectedFile.fileName,
        docType: selectedFile.documentType,
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Document uploaded successfully',
      });
      setSelectedFile(null);
      setUploadModalOpen(false);
    } catch (err: any) {
      console.error('Failed to upload document:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || 'Failed to upload document',
      });
    }
  };

  const handleDownloadDocument = async (documentId: number, fileName: string) => {
    if (isDownloading) return;
    setIsDownloading(documentId);
    try {
      const blob = await ChannelPartnerService.downloadDocument(documentId);
      if (Platform.OS === 'web') {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        Toast.show({ type: 'success', text1: 'Downloaded', text2: `${fileName} downloaded successfully.` });
      } else {
        alert('File download is supported in web mode.');
      }
    } catch (err: any) {
      console.error('Failed to download document:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to download document',
      });
    } finally {
      setIsDownloading(null);
    }
  };

  const handleDownloadAllDocuments = async () => {
    if (!partner || isDownloadingAll) return;
    setIsDownloadingAll(true);
    try {
      const blob = await ChannelPartnerService.downloadAllDocuments(partner.partnerId);
      if (Platform.OS === 'web') {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `partner_${partner.partnerId}_documents.zip`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        Toast.show({ type: 'success', text1: 'Downloaded', text2: 'All documents downloaded as ZIP.' });
      } else {
        alert('File download is supported in web mode.');
      }
    } catch (err: any) {
      console.error('Failed to download all documents:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to download documents',
      });
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleDeleteDocument = (documentId: number, docName: string) => {
    if (!partner) return;
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${docName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocMutation.mutateAsync({
                partnerId: partner.partnerId,
                documentId,
              });
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Document deleted successfully',
              });
            } catch (err: any) {
              console.error('Failed to delete document:', err);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.response?.data?.message || 'Failed to delete document',
              });
            }
          },
        },
      ]
    );
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to place a call on this device.');
    });
  };

  const handleEmail = (emailAddress: string) => {
    Linking.openURL(`mailto:${emailAddress}`).catch(() => {
      Alert.alert('Error', 'Unable to send email from this device.');
    });
  };

  const getStatusConfig = (statusStr: string = '') => {
    switch (statusStr.toLowerCase()) {
      case 'approved':
        return { bg: '#10b98115', color: '#10b981', icon: CheckCircle2 };
      case 'rejected':
        return { bg: '#ef444415', color: '#ef4444', icon: XCircle };
      default:
        return { bg: '#eab30815', color: '#eab308', icon: AlertCircle };
    }
  };

  const getDocStatusConfig = (statusStr: string = '') => {
    switch (statusStr.toLowerCase()) {
      case 'approved':
        return { bg: '#10b98110', color: '#10b981', label: 'Verified' };
      case 'rejected':
        return { bg: '#ef444410', color: '#ef4444', label: 'Rejected' };
      default:
        return { bg: '#eab30810', color: '#eab308', label: 'Pending Verification' };
    }
  };

  if (isLoading && !isRefetching) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={brandColor} />
        <Text style={{ color: subTextColor, marginTop: 12, fontSize: 13 }}>Loading partner details...</Text>
      </View>
    );
  }

  if (error || !partner) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 12 }} />
        <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, textAlign: 'center' }}>
          Failed to Load Partner Profile
        </Text>
        <Text style={{ fontSize: 13, color: subTextColor, textAlign: 'center', marginTop: 6, marginBottom: 20 }}>
          {error?.message || 'Partner record could not be found or access is restricted.'}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ backgroundColor: brandColor, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusConfig = getStatusConfig(partner.status);
  const StatusIcon = statusConfig.icon;

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Header Bar */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: cardBg,
        borderBottomWidth: 1,
        borderBottomColor: borderCol,
        gap: 12
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: inputBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={20} color={textColor} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>Channel Partner Details</Text>
          <Text style={{ fontSize: 11, color: subTextColor, marginTop: 1 }}>ID: #{partner.partnerId}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={handleOpenEdit}
            style={{
              padding: 8,
              borderRadius: 12,
              backgroundColor: inputBg,
              borderWidth: 1,
              borderColor: borderCol,
            }}
          >
            <Edit2 size={16} color={brandColor} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeletePartner}
            style={{
              padding: 8,
              borderRadius: 12,
              backgroundColor: '#ef444410',
              borderWidth: 1,
              borderColor: '#ef444430',
            }}
          >
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[brandColor]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Web-Style Header Banner */}
        <View style={{
          backgroundColor: '#0d9488', // Teal background matching screenshot
          borderRadius: 16,
          padding: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <View style={{ flex: 1, minWidth: 200, gap: 8 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#ffffff' }}>
              {partner.companyName}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Building2 size={12} color="#ffffffa0" />
                <Text style={{ fontSize: 11, color: '#ffffffd0', fontWeight: '500' }}>
                  {partner.contactPerson}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Mail size={12} color="#ffffffa0" />
                <Text style={{ fontSize: 11, color: '#ffffffd0', fontWeight: '500' }}>
                  {partner.email}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Phone size={12} color="#ffffffa0" />
                <Text style={{ fontSize: 11, color: '#ffffffd0', fontWeight: '500' }}>
                  {partner.phone}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <View style={{
              backgroundColor: '#10b981', // Green badge matching screenshot
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
            }}>
              <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '700' }}>
                {partner.status || 'Approved'}
              </Text>
            </View>
            <View style={{
              backgroundColor: '#ffffff', // White badge matching screenshot
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: '#0d9488a0'
            }}>
              <Text style={{ color: '#111827', fontSize: 10, fontWeight: '700' }}>
                {(partner.subscriptionPlan || 'Basic')} Plan
              </Text>
            </View>
          </View>
        </View>

        {/* Info Grid - Stacks on Mobile */}
        {/* Company Information Card */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Building2 size={16} color={brandColor} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: brandColor }}>Company Information</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: `${borderCol}50` }}>
            <Text style={{ fontSize: 12, color: subTextColor }}>Company Name:</Text>
            <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>{partner.companyName}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: `${borderCol}50` }}>
            <Text style={{ fontSize: 12, color: subTextColor }}>Contact Person:</Text>
            <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>{partner.contactPerson}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: `${borderCol}50` }}>
            <Text style={{ fontSize: 12, color: subTextColor }}>Email:</Text>
            <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>{partner.email}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: `${borderCol}50` }}>
            <Text style={{ fontSize: 12, color: subTextColor }}>Phone:</Text>
            <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>{partner.phone}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, color: subTextColor }}>Address:</Text>
            <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>{partner.address || 'N/A'}</Text>
          </View>
        </View>

        {/* Timeline Card */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Calendar size={16} color={brandColor} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: brandColor }}>Timeline</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: `${borderCol}50` }}>
            <Text style={{ fontSize: 12, color: subTextColor }}>Registered:</Text>
            <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>
              {partner.createdOn ? new Date(partner.createdOn).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, color: subTextColor }}>Approved:</Text>
            <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>
              {partner.approvedOn ? new Date(partner.approvedOn).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Pending'}
            </Text>
          </View>
        </View>

        {/* Lead Statistics Card */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Globe size={16} color={brandColor} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: brandColor }}>Lead Statistics</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: `${borderCol}50` }}>
            <Text style={{ fontSize: 12, color: subTextColor }}>Total Leads:</Text>
            <Text style={{ fontSize: 12, color: textColor, fontWeight: '700' }}>{partner.totalLeads ?? 0}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, color: subTextColor }}>Closed:</Text>
            <View style={{ backgroundColor: '#6b728020', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ fontSize: 11, color: textColor, fontWeight: '700' }}>{partner.closedLeads ?? 0}</Text>
            </View>
          </View>
        </View>

        {/* Partnership Details Card */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Briefcase size={16} color={brandColor} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: brandColor }}>Partnership Details</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: `${borderCol}50` }}>
            <Text style={{ fontSize: 12, color: subTextColor }}>Commission Scheme:</Text>
            <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>
              {partner.commissionScheme ? (partner.commissionScheme.toLowerCase() === 'percentage' ? 'Percentage of Sale' : 'Fixed Amount') : 'N/A'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: `${borderCol}50` }}>
            <Text style={{ fontSize: 12, color: subTextColor }}>Commission Rate:</Text>
            <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>
              {partner.commissionPercentage ? `${partner.commissionPercentage.toFixed(2)}%` : '5.00%'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: `${borderCol}50` }}>
            <Text style={{ fontSize: 12, color: subTextColor }}>Subscription Plan:</Text>
            <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>{partner.subscriptionPlan || 'Basic'}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: `${borderCol}50` }}>
            <Text style={{ fontSize: 12, color: subTextColor }}>Status:</Text>
            <View style={{ backgroundColor: statusConfig.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ fontSize: 11, color: statusConfig.color, fontWeight: '700' }}>{partner.status}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, color: subTextColor }}>Documents:</Text>
            <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>
              {partner.documents && partner.documents.length > 0 ? `${partner.documents.length} document(s) uploaded` : 'Not Uploaded'}
            </Text>
          </View>
        </View>

        {/* Active Subscription Details Card (only shown if activeSubscription is not null) */}
        {partner.activeSubscription && (
          <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Layers size={16} color="#10b981" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#10b981' }}>Active Subscription Details</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: `${borderCol}50` }}>
              <Text style={{ fontSize: 12, color: subTextColor }}>Plan:</Text>
              <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>{partner.activeSubscription.planName}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: `${borderCol}50` }}>
              <Text style={{ fontSize: 12, color: subTextColor }}>Amount:</Text>
              <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>
                ₹{partner.activeSubscription.amount.toLocaleString()} / {partner.activeSubscription.billingCycle}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, color: subTextColor }}>Billing Period:</Text>
              <Text style={{ fontSize: 11, color: textColor, fontWeight: '600' }}>
                {partner.activeSubscription.startDate.split('T')[0]} to {partner.activeSubscription.endDate.split('T')[0]}
              </Text>
            </View>
          </View>
        )}

        {/* Documents Card */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>Verification Documents</Text>
            {partner.documents && partner.documents.length > 0 && (
              <TouchableOpacity
                onPress={handleDownloadAllDocuments}
                disabled={isDownloadingAll}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: inputBg,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: borderCol
                }}
              >
                {isDownloadingAll ? (
                  <ActivityIndicator size="small" color={brandColor} style={{ width: 12, height: 12 }} />
                ) : (
                  <Download size={12} color={brandColor} />
                )}
                <Text style={{ fontSize: 10, fontWeight: '700', color: brandColor }}>
                  {isDownloadingAll ? 'Zipping...' : 'Download All'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={handlePickDocument}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              borderWidth: 1,
              borderColor: brandColor,
              borderStyle: 'dashed',
              borderRadius: 12,
              padding: 12,
              backgroundColor: `${brandColor}05`,
              marginBottom: 4
            }}
          >
            <Plus size={16} color={brandColor} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: brandColor }}>Upload New Document</Text>
          </TouchableOpacity>

          {!partner.documents || partner.documents.length === 0 ? (
            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
              <FileText size={24} color={subTextColor} style={{ marginBottom: 6 }} />
              <Text style={{ fontSize: 12, color: subTextColor }}>No document attachments uploaded</Text>
            </View>
          ) : (
            partner.documents.map((doc) => {
              const docStatus = getDocStatusConfig(doc.verificationStatus);
              return (
                <View
                  key={doc.documentId}
                  style={{
                    backgroundColor: bgColor,
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: borderCol,
                    gap: 8
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <FileText size={20} color={brandColor} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }} numberOfLines={1}>
                          {doc.documentName}
                        </Text>
                        <Text style={{ fontSize: 9, color: subTextColor, marginTop: 2 }}>
                          {doc.documentType} • {(doc.fileSize / 1024).toFixed(1)} KB
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{
                        backgroundColor: docStatus.bg,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6
                      }}>
                        <Text style={{ color: docStatus.color, fontSize: 8, fontWeight: '700', textTransform: 'uppercase' }}>
                          {docStatus.label}
                        </Text>
                      </View>

                      {/* Download Action */}
                      <TouchableOpacity
                        onPress={() => handleDownloadDocument(doc.documentId, doc.fileName || doc.documentName)}
                        disabled={isDownloading === doc.documentId}
                        style={{
                          padding: 6,
                          borderRadius: 8,
                          backgroundColor: inputBg,
                          borderWidth: 1,
                          borderColor: borderCol,
                        }}
                      >
                        {isDownloading === doc.documentId ? (
                          <ActivityIndicator size="small" color={brandColor} style={{ width: 14, height: 14 }} />
                        ) : (
                          <Download size={14} color={textColor} />
                        )}
                      </TouchableOpacity>

                      {/* Delete Action */}
                      <TouchableOpacity
                        onPress={() => handleDeleteDocument(doc.documentId, doc.documentName)}
                        style={{
                          padding: 6,
                          borderRadius: 8,
                          backgroundColor: '#ef444410',
                          borderWidth: 1,
                          borderColor: '#ef444420',
                        }}
                      >
                        <Trash2 size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {doc.verificationStatus.toLowerCase() === 'rejected' && doc.rejectionReason && (
                    <View style={{
                      backgroundColor: '#ef444408',
                      padding: 8,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#ef444415',
                      marginTop: 4
                    }}>
                      <Text style={{ fontSize: 10, color: '#ef4444', fontWeight: '600' }}>
                        Reason: {doc.rejectionReason}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Approvals/Audits Card (If approved) */}
        {partner.approvedBy && (
          <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16, gap: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, marginBottom: 2 }}>Verification Audit</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <UserCheck size={16} color="#10b981" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>
                  Approved by User #{partner.approvedBy}
                </Text>
                <Text style={{ fontSize: 10, color: subTextColor, marginTop: 2 }}>
                  Approved On: {partner.approvedOn ? partner.approvedOn.replace('T', ' ').substring(0, 19) : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Edit Partner Modal */}
      <Modal
        visible={editModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!updatePartnerMutation.isPending) {
            setEditModalOpen(false);
          }
        }}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: 20
        }}>
          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={{
              backgroundColor: cardBg,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: borderCol,
              gap: 14,
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 5
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>Edit Channel Partner</Text>
              <TouchableOpacity
                disabled={updatePartnerMutation.isPending}
                onPress={() => setEditModalOpen(false)}
                style={{ padding: 4 }}
              >
                <Text style={{ color: subTextColor, fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Company Name */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: subTextColor }}>COMPANY NAME *</Text>
              <TextInput
                style={{
                  height: 38,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: borderCol,
                  paddingHorizontal: 12,
                  color: textColor,
                  backgroundColor: bgColor,
                  fontSize: 13
                }}
                value={editForm.companyName}
                onChangeText={(val) => setEditForm(prev => ({ ...prev, companyName: val }))}
              />
            </View>

            {/* Contact Person */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: subTextColor }}>CONTACT PERSON *</Text>
              <TextInput
                style={{
                  height: 38,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: borderCol,
                  paddingHorizontal: 12,
                  color: textColor,
                  backgroundColor: bgColor,
                  fontSize: 13
                }}
                value={editForm.contactPerson}
                onChangeText={(val) => setEditForm(prev => ({ ...prev, contactPerson: val }))}
              />
            </View>

            {/* Email */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: subTextColor }}>EMAIL ADDRESS *</Text>
              <TextInput
                style={{
                  height: 38,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: borderCol,
                  paddingHorizontal: 12,
                  color: textColor,
                  backgroundColor: bgColor,
                  fontSize: 13
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                value={editForm.email}
                onChangeText={(val) => setEditForm(prev => ({ ...prev, email: val }))}
              />
            </View>

            {/* Phone */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: subTextColor }}>PHONE NUMBER *</Text>
              <TextInput
                style={{
                  height: 38,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: borderCol,
                  paddingHorizontal: 12,
                  color: textColor,
                  backgroundColor: bgColor,
                  fontSize: 13
                }}
                keyboardType="phone-pad"
                value={editForm.phone}
                onChangeText={(val) => setEditForm(prev => ({ ...prev, phone: val }))}
              />
            </View>

            {/* Address */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: subTextColor }}>ADDRESS</Text>
              <TextInput
                style={{
                  height: 38,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: borderCol,
                  paddingHorizontal: 12,
                  color: textColor,
                  backgroundColor: bgColor,
                  fontSize: 13
                }}
                value={editForm.address}
                onChangeText={(val) => setEditForm(prev => ({ ...prev, address: val }))}
              />
            </View>

            {/* Commission Scheme */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: subTextColor }}>COMMISSION SCHEME *</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['Percentage', 'Fixed'].map((s) => {
                  const isSelected = editForm.commissionScheme === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setEditForm(prev => ({ ...prev, commissionScheme: s }))}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 10,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: isSelected ? brandColor : borderCol,
                        backgroundColor: isSelected ? `${brandColor}15` : cardBg
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: isSelected ? brandColor : textColor }}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Commission Percentage */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: subTextColor }}>COMMISSION RATE ({editForm.commissionScheme === 'Percentage' ? '%' : 'Fixed Amount'}) *</Text>
              <TextInput
                style={{
                  height: 38,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: borderCol,
                  paddingHorizontal: 12,
                  color: textColor,
                  backgroundColor: bgColor,
                  fontSize: 13
                }}
                keyboardType="numeric"
                value={String(editForm.commissionPercentage)}
                onChangeText={(val) => setEditForm(prev => ({ ...prev, commissionPercentage: parseFloat(val) || 0 }))}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              disabled={updatePartnerMutation.isPending}
              onPress={handleUpdatePartner}
              style={{
                backgroundColor: brandColor,
                padding: 12,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                marginTop: 6,
                opacity: updatePartnerMutation.isPending ? 0.6 : 1
              }}
            >
              {updatePartnerMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={16} color="#ffffff" />
                  <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Document Upload Configuration Modal */}
      <Modal
        visible={uploadModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (!uploadDocMutation.isPending) {
            setUploadModalOpen(false);
            setSelectedFile(null);
          }
        }}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: 20
        }}>
          <View style={{
            backgroundColor: cardBg,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: borderCol,
            gap: 16,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 5
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>Configure Upload Document</Text>
              <TouchableOpacity
                disabled={uploadDocMutation.isPending}
                onPress={() => {
                  setUploadModalOpen(false);
                  setSelectedFile(null);
                }}
                style={{ padding: 4 }}
              >
                <Text style={{ color: subTextColor, fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {selectedFile && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: bgColor,
                padding: 10,
                borderRadius: 10,
                gap: 8,
                borderWidth: 1,
                borderColor: borderCol
              }}>
                <Paperclip size={16} color={brandColor} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: textColor, fontWeight: '700' }} numberOfLines={1}>
                    {selectedFile.fileName}
                  </Text>
                  <Text style={{ fontSize: 9, color: subTextColor, marginTop: 1 }}>
                    {(selectedFile.fileSize / 1024).toFixed(1)} KB
                  </Text>
                </View>
              </View>
            )}

            {/* Document Custom Name Input */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor }}>DOCUMENT NAME</Text>
              <TextInput
                style={{
                  height: 40,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: borderCol,
                  paddingHorizontal: 12,
                  color: textColor,
                  backgroundColor: bgColor,
                  fontSize: 13
                }}
                placeholder="e.g. Trade License / Lease Agreement"
                placeholderTextColor={subTextColor}
                value={selectedFile?.customName || ''}
                onChangeText={(val) => setSelectedFile(prev => prev ? { ...prev, customName: val } : null)}
              />
            </View>

            {/* Document Type Selector */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor }}>DOCUMENT TYPE</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {DOC_TYPES.map((type) => {
                  const isSelected = selectedFile?.documentType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setSelectedFile(prev => prev ? { ...prev, documentType: type } : null)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: isSelected ? brandColor : borderCol,
                        backgroundColor: isSelected ? `${brandColor}15` : cardBg,
                      }}
                    >
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: isSelected ? brandColor : textColor
                      }}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              disabled={uploadDocMutation.isPending}
              onPress={handleUploadDocument}
              style={{
                backgroundColor: brandColor,
                padding: 12,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                marginTop: 8,
                opacity: uploadDocMutation.isPending ? 0.6 : 1
              }}
            >
              {uploadDocMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={16} color="#ffffff" />
                  <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Upload Document</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
