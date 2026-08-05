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
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { useAgent, useDeleteAgent, useUploadAgentDocument, useDeleteAgentDocument } from '../../../admin/hooks/useAgents';
import { AgentsService } from '../../../admin/services/Agentservice';
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
} from 'lucide-react-native';

export default function AgentDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const { data, isLoading, refetch, isRefetching, error } = useAgent(id);
  const deleteAgentMutation = useDeleteAgent();
  const uploadDocMutation = useUploadAgentDocument();
  const deleteDocMutation = useDeleteAgentDocument();

  // Document states
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    fileName: string;
    fileSize: number;
    type: string;
    customName: string;
    documentType: string;
  } | null>(null);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState<number | string | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const DOC_TYPES = ['Aadhar', 'PAN', 'Resume', 'License', 'Others'];

  const handlePickDocument = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'We need storage permission to upload documents.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          fileName: asset.fileName || `doc_${Date.now()}.jpg`,
          fileSize: asset.fileSize || 0,
          type: asset.mimeType || 'image/jpeg',
          customName: '',
          documentType: 'Aadhar',
        });
        setUploadModalOpen(true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to select file.');
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !agent) return;

    try {
      await uploadDocMutation.mutateAsync({
        agentId: agent.agentId,
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
      const blob = await AgentsService.downloadDocument(documentId);
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
    if (!agent || isDownloadingAll) return;
    setIsDownloadingAll(true);
    try {
      const blob = await AgentsService.downloadAllDocuments(agent.agentId);
      if (Platform.OS === 'web') {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `agent_${agent.agentId}_documents.zip`);
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
    if (!agent) return;
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
                agentId: agent.agentId,
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

  const agent = data?.data;

  // Re-fetch when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg;
  const brandColor = adminTheme.brand;

  const handleDelete = () => {
    if (!agent) return;
    Alert.alert(
      'Delete Agent',
      `Are you sure you want to delete ${agent.fullName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAgentMutation.mutateAsync(agent.agentId);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Agent deleted successfully',
              });
              router.back();
            } catch (err: any) {
              console.error('Failed to delete agent:', err);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.response?.data?.message || 'Failed to delete agent',
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
        <Text style={{ color: subTextColor, marginTop: 12, fontSize: 13 }}>Loading agent details...</Text>
      </View>
    );
  }

  if (error || !agent) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 12 }} />
        <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, textAlign: 'center' }}>
          Failed to Load Agent Profile
        </Text>
        <Text style={{ fontSize: 13, color: subTextColor, textAlign: 'center', marginTop: 6, marginBottom: 20 }}>
          {error?.message || 'Agent record could not be found or access is restricted.'}
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

  const statusConfig = getStatusConfig(agent.status);
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
          <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>Agent Profile</Text>
          <Text style={{ fontSize: 11, color: subTextColor, marginTop: 1 }}>ID: #{agent.agentId}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => router.push(`/admin/teammanagement/CreateAgent?id=${agent.agentId}`)}
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
            onPress={handleDelete}
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
        {/* Main Card: Profile Summary */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 20, alignItems: 'center' }}>
          {/* Avatar Placeholder */}
          <View style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: brandColor + '15',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
            borderWidth: 1,
            borderColor: brandColor + '30'
          }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: brandColor }}>
              {agent.fullName ? agent.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?'}
            </Text>
          </View>

          <Text style={{ fontSize: 18, fontWeight: '800', color: textColor }}>{agent.fullName}</Text>
          <Text style={{ fontSize: 12, color: subTextColor, marginTop: 4, fontWeight: '600' }}>
            {agent.agentType} compensation plan
          </Text>

          {/* Badges Container */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            <View style={{
              backgroundColor: statusConfig.bg,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4
            }}>
              <StatusIcon size={12} color={statusConfig.color} />
              <Text style={{ color: statusConfig.color, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
                {agent.status}
              </Text>
            </View>
            <View style={{
              backgroundColor: inputBg,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              borderWidth: 1,
              borderColor: borderCol
            }}>
              <Calendar size={12} color={subTextColor} />
              <Text style={{ color: textColor, fontSize: 10, fontWeight: '600' }}>
                Joined {agent.createdOn ? agent.createdOn.split('T')[0] : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Info Card */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16, gap: 14 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, marginBottom: 2 }}>Contact Details</Text>
          
          <TouchableOpacity onPress={() => handleEmail(agent.email || '')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ padding: 8, borderRadius: 10, backgroundColor: bgColor }}>
              <Mail size={16} color={brandColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: subTextColor }}>Email Address</Text>
              <Text style={{ fontSize: 13, color: textColor, marginTop: 2, fontWeight: '600' }}>{agent.email}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleCall(agent.phone || '')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ padding: 8, borderRadius: 10, backgroundColor: bgColor }}>
              <Phone size={16} color={brandColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: subTextColor }}>Phone Number</Text>
              <Text style={{ fontSize: 13, color: textColor, marginTop: 2, fontWeight: '600' }}>{agent.phone}</Text>
            </View>
          </TouchableOpacity>

          {agent.address && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ padding: 8, borderRadius: 10, backgroundColor: bgColor }}>
                <MapPin size={16} color={brandColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: subTextColor }}>Residence Address</Text>
                <Text style={{ fontSize: 13, color: textColor, marginTop: 2, fontWeight: '600' }}>{agent.address}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Compensation Card */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16, gap: 14 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, marginBottom: 2 }}>Financial Information</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ padding: 8, borderRadius: 10, backgroundColor: bgColor }}>
              <DollarSign size={16} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: subTextColor }}>Base Salary</Text>
              <Text style={{ fontSize: 14, color: textColor, marginTop: 2, fontWeight: '700' }}>
                {agent.salary ? `₹${agent.salary.toLocaleString()}` : '₹0'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ padding: 8, borderRadius: 10, backgroundColor: bgColor }}>
              <Briefcase size={16} color="#eab308" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: subTextColor }}>Commission Rules</Text>
              <Text style={{ fontSize: 13, color: textColor, marginTop: 2, fontWeight: '600' }}>
                {agent.commissionRules || 'No commission percentage configured'}
              </Text>
            </View>
          </View>
        </View>

        {/* Documents Card */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>Verification Documents</Text>
            {agent.agentDocuments && agent.agentDocuments.length > 0 && (
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

          {!agent.agentDocuments || agent.agentDocuments.length === 0 ? (
            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
              <FileText size={24} color={subTextColor} style={{ marginBottom: 6 }} />
              <Text style={{ fontSize: 12, color: subTextColor }}>No document attachments uploaded</Text>
            </View>
          ) : (
            agent.agentDocuments.map((doc) => {
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
        {agent.approvedBy && (
          <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16, gap: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, marginBottom: 2 }}>Verification Audit</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <UserCheck size={16} color="#10b981" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>
                  Approved by User #{agent.approvedBy}
                </Text>
                <Text style={{ fontSize: 10, color: subTextColor, marginTop: 2 }}>
                  Approved On: {agent.approvedOn ? agent.approvedOn.replace('T', ' ').substring(0, 19) : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

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
                placeholder="e.g. Aadhar Front / PAN Card"
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
