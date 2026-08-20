import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { AgentsService } from '../../../admin/services/Agentservice';
import { useAgents, useAgentDropdowns, useOnboardAgent, useUpdateAgent } from '../../../admin/hooks/useAgents';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import {
  ArrowLeft,
  ChevronDown,
  Paperclip,
  Trash2,
  Check,
  Plus,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react-native';

interface PendingDoc {
  uri: string;
  fileName: string;
  fileSize: number;
  type: string;
  customName: string;
  documentType: string;
}

export default function CreateAgentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  // Form States
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    agentType: 'Salary',
    salary: '',
    commissionRules: 'None (0% of sale)',
  });

  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);
  const [existingDocs, setExistingDocs] = useState<any[]>([]);

  // TanStack Query dropdown selections
  const { data: dropdownData, isLoading: loadingDropdowns } = useAgentDropdowns();
  const agentTypes = dropdownData?.data?.agentTypes || ['Salary', 'Hybrid', 'Commission'];
  const commissionRules = dropdownData?.data?.commissionRules || ['None (0% of sale)'];

  // Detail query for edit mode (only triggers if isEdit is true)
  const { data: agentListData, isLoading: loadingDetails } = useAgents(
    isEdit ? { pageSize: 100 } : undefined
  );

  // Populate form details in edit mode
  useEffect(() => {
    if (isEdit && id && agentListData?.data?.items) {
      const agent = agentListData.data.items.find((a) => a.agentId === Number(id));
      if (agent) {
        setForm({
          fullName: agent.fullName || '',
          email: agent.email || '',
          phone: agent.phone || '',
          address: agent.address || '',
          agentType: agent.agentType || 'Salary',
          salary: agent.salary ? agent.salary.toString() : '',
          commissionRules: agent.commissionRules || 'None (0% of sale)',
        });
        setExistingDocs(agent.agentDocuments || []);
      }
    }
  }, [isEdit, id, agentListData]);

  // Mutations
  const onboardMutation = useOnboardAgent();
  const updateMutation = useUpdateAgent();
  const isSubmitting = onboardMutation.isPending || updateMutation.isPending;

  // Modal Open States
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  // Document types for selector
  const DOC_TYPES = ['Aadhar', 'PAN', 'Resume', 'License', 'Others'];

  // Theme values
  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg;
  const brandColor = adminTheme.brand;

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
        const newFile: PendingDoc = {
          uri: asset.uri,
          fileName: asset.fileName || `doc_${Date.now()}.jpg`,
          fileSize: asset.fileSize || 0,
          type: asset.mimeType || 'image/jpeg',
          customName: '',
          documentType: 'Aadhar',
        };
        setPendingDocs((prev) => [...prev, newFile]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to select file.');
    }
  };

  const handleRemovePendingDoc = (index: number) => {
    setPendingDocs((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdatePendingDoc = (index: number, key: 'customName' | 'documentType', value: string) => {
    setPendingDocs((prev) =>
      prev.map((doc, idx) => (idx === index ? { ...doc, [key]: value } : doc))
    );
  };

  const handleSubmit = async () => {
    // Form Validations
    if (!form.fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter the agent\'s full name.');
      return;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }
    const cleanPhone = form.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 10) {
      Alert.alert('Validation Error', 'Phone number must be exactly 10 digits.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('FullName', form.fullName.trim());
      formData.append('Email', form.email.trim());
      formData.append('Phone', cleanPhone);
      if (form.address.trim()) {
        formData.append('Address', form.address.trim());
      }
      formData.append('AgentType', form.agentType);

      const salaryVal = parseFloat(form.salary);
      if ((form.agentType === 'Salary' || form.agentType === 'Hybrid') && !isNaN(salaryVal)) {
        formData.append('Salary', salaryVal.toString());
      } else {
        formData.append('Salary', '0');
      }

      formData.append('CommissionRules', form.commissionRules);

      // Append files and their parallel custom details
      pendingDocs.forEach((doc) => {
        formData.append('DocumentFiles', {
          uri: Platform.OS === 'android' ? doc.uri : doc.uri.replace('file://', ''),
          name: doc.fileName,
          type: doc.type,
        } as any);

        formData.append('DocumentNames', doc.customName.trim() || doc.fileName);
        formData.append('DocumentTypes', doc.documentType);
      });

      let res;
      if (isEdit && id) {
        res = await updateMutation.mutateAsync({ id, formData });
      } else {
        res = await onboardMutation.mutateAsync(formData);
      }

      if (res.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: isEdit ? 'Agent updated successfully' : 'Agent onboarded successfully',
        });
        router.back();
      }
    } catch (err: any) {
      console.error('Submit Failed:', err);
      const msg = err.response?.data?.message || 'Onboarding failed. Please try again.';
      Alert.alert('Error', msg);
    }
  };

  const getStatusConfig = (statusStr: string) => {
    switch (statusStr.toLowerCase()) {
      case 'approved':
        return { bg: '#10b98115', color: '#10b981', icon: CheckCircle2 };
      case 'rejected':
        return { bg: '#ef444415', color: '#ef4444', icon: XCircle };
      default:
        return { bg: '#eab30815', color: '#eab308', icon: AlertCircle };
    }
  };

  if (loadingDetails) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={brandColor} />
        <Text style={{ color: subTextColor, marginTop: 12, fontSize: 13 }}>Loading details...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Navbar Title Row */}
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
          <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>
            {isEdit ? 'Edit Agent' : 'Onboard New Agent'}
          </Text>
          <Text style={{ fontSize: 10, color: subTextColor, marginTop: 1 }}>
            {isEdit ? 'Update details or verify attachments' : 'Provide details and verify files'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Form Card */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16, gap: 14 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, borderBottomWidth: 1, borderBottomColor: borderCol, paddingBottom: 8, marginBottom: 4 }}>
            Agent Information
          </Text>

          {/* Full Name */}
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: subTextColor }}>FULL NAME *</Text>
            <TextInput
              style={{
                height: 44,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: borderCol,
                paddingHorizontal: 12,
                color: textColor,
                fontSize: 13,
                backgroundColor: inputBg
              }}
              placeholder="e.g. John Doe"
              placeholderTextColor={subTextColor}
              value={form.fullName}
              onChangeText={(val) => setForm({ ...form, fullName: val })}
            />
          </View>

          {/* Email */}
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: subTextColor }}>EMAIL ADDRESS *</Text>
            <TextInput
              style={{
                height: 44,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: borderCol,
                paddingHorizontal: 12,
                color: textColor,
                fontSize: 13,
                backgroundColor: inputBg
              }}
              placeholder="e.g. john@company.com"
              placeholderTextColor={subTextColor}
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(val) => setForm({ ...form, email: val })}
            />
          </View>

          {/* Phone */}
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: subTextColor }}>PHONE NUMBER (10 DIGITS) *</Text>
            <TextInput
              style={{
                height: 44,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: borderCol,
                paddingHorizontal: 12,
                color: textColor,
                fontSize: 13,
                backgroundColor: inputBg
              }}
              placeholder="e.g. 9876543210"
              placeholderTextColor={subTextColor}
              keyboardType="phone-pad"
              maxLength={10}
              value={form.phone}
              onChangeText={(val) => setForm({ ...form, phone: val })}
            />
          </View>

          {/* Address */}
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: subTextColor }}>ADDRESS / LOCATION</Text>
            <TextInput
              style={{
                height: 44,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: borderCol,
                paddingHorizontal: 12,
                color: textColor,
                fontSize: 13,
                backgroundColor: inputBg
              }}
              placeholder="e.g. Hyderabad, India"
              placeholderTextColor={subTextColor}
              value={form.address}
              onChangeText={(val) => setForm({ ...form, address: val })}
            />
          </View>

          {/* Agent Type dropdown */}
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: subTextColor }}>AGENT TYPE *</Text>
            {loadingDropdowns ? (
              <ActivityIndicator size="small" color={brandColor} style={{ alignSelf: 'flex-start' }} />
            ) : (
              <TouchableOpacity
                onPress={() => setTypeModalOpen(true)}
                style={{
                  height: 44,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: borderCol,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: inputBg
                }}
              >
                <Text style={{ color: textColor, fontSize: 13 }}>{form.agentType}</Text>
                <ChevronDown size={14} color={subTextColor} />
              </TouchableOpacity>
            )}
          </View>

          {/* Salary (Visible only if type is Salary or Hybrid) */}
          {(form.agentType === 'Salary' || form.agentType === 'Hybrid') && (
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: subTextColor }}>SALARY (INR) *</Text>
              <TextInput
                style={{
                  height: 44,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: borderCol,
                  paddingHorizontal: 12,
                  color: textColor,
                  fontSize: 13,
                  backgroundColor: inputBg
                }}
                placeholder="e.g. 25000"
                placeholderTextColor={subTextColor}
                keyboardType="numeric"
                value={form.salary}
                onChangeText={(val) => setForm({ ...form, salary: val })}
              />
            </View>
          )}

          {/* Commission Rules dropdown */}
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: subTextColor }}>COMMISSION RULES *</Text>
            {loadingDropdowns ? (
              <ActivityIndicator size="small" color={brandColor} style={{ alignSelf: 'flex-start' }} />
            ) : (
              <TouchableOpacity
                onPress={() => setRulesModalOpen(true)}
                style={{
                  height: 44,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: borderCol,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: inputBg
                }}
              >
                <Text style={{ color: textColor, fontSize: 13 }} numberOfLines={1}>
                  {form.commissionRules}
                </Text>
                <ChevronDown size={14} color={subTextColor} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Existing Documents Card (Only shown in Edit mode) */}
        {isEdit && existingDocs.length > 0 && (
          <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, borderBottomWidth: 1, borderBottomColor: borderCol, paddingBottom: 8 }}>
              Uploaded Verification Documents
            </Text>
            {existingDocs.map((doc) => {
              const statusConfig = getStatusConfig(doc.verificationStatus);
              const StatusIcon = statusConfig.icon;
              return (
                <View
                  key={doc.documentId}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: borderCol,
                    backgroundColor: bgColor,
                    gap: 10
                  }}
                >
                  <FileText size={20} color={brandColor} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>{doc.documentName}</Text>
                    <Text style={{ fontSize: 10, color: subTextColor, marginTop: 1 }}>
                      Type: {doc.documentType} | Size: {(doc.fileSize / 1024).toFixed(1)} KB
                    </Text>
                    {doc.rejectionReason && (
                      <Text style={{ fontSize: 9, color: '#ef4444', fontWeight: '500', marginTop: 2 }}>
                        Reason: {doc.rejectionReason}
                      </Text>
                    )}
                  </View>
                  <View style={{
                    backgroundColor: statusConfig.bg,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <StatusIcon size={9} color={statusConfig.color} />
                    <Text style={{ color: statusConfig.color, fontSize: 8, fontWeight: '700', textTransform: 'uppercase' }}>
                      {doc.verificationStatus}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Attachment Card */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16, gap: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: borderCol, paddingBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>
              Verification Attachments
            </Text>
            <TouchableOpacity
              onPress={handlePickDocument}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: `${brandColor}15`,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 12,
                gap: 4
              }}
            >
              <Paperclip size={12} color={brandColor} />
              <Text style={{ color: brandColor, fontSize: 11, fontWeight: '700' }}>Choose File</Text>
            </TouchableOpacity>
          </View>

          {pendingDocs.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: subTextColor, fontSize: 12, textAlign: 'center' }}>
                No new files selected.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {pendingDocs.map((doc, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: bgColor,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: borderCol,
                    padding: 12,
                    gap: 10
                  }}
                >
                  {/* File title & Remove */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: textColor, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                      File: {doc.fileName}
                    </Text>
                    <TouchableOpacity onPress={() => handleRemovePendingDoc(index)} style={{ padding: 4 }}>
                      <Trash2 size={14} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  {/* Document Display Name */}
                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: subTextColor }}>DISPLAY NAME</Text>
                    <TextInput
                      style={{
                        height: 36,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: borderCol,
                        paddingHorizontal: 10,
                        color: textColor,
                        fontSize: 12,
                        backgroundColor: cardBg
                      }}
                      placeholder="e.g. Aadhar Front, Resume"
                      placeholderTextColor={subTextColor}
                      value={doc.customName}
                      onChangeText={(val) => handleUpdatePendingDoc(index, 'customName', val)}
                    />
                  </View>

                  {/* Document Category selectors */}
                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: subTextColor }}>DOCUMENT TYPE</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {DOC_TYPES.map((dt) => (
                        <TouchableOpacity
                          key={dt}
                          onPress={() => handleUpdatePendingDoc(index, 'documentType', dt)}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            backgroundColor: doc.documentType === dt ? brandColor : cardBg,
                            borderWidth: 1,
                            borderColor: borderCol
                          }}
                        >
                          <Text style={{ fontSize: 9, fontWeight: '700', color: doc.documentType === dt ? '#ffffff' : textColor }}>
                            {dt}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Submit button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={{
            height: 48,
            backgroundColor: brandColor,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 8,
            opacity: isSubmitting ? 0.7 : 1,
            flexDirection: 'row',
            gap: 8
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Check size={18} color="#ffffff" />
          )}
          <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>
            {isSubmitting ? 'Submitting Details...' : isEdit ? 'Update Agent details' : 'Complete Onboarding'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Dropdowns Selection Modals ── */}

      {/* Agent Type Modal */}
      <Modal visible={typeModalOpen} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setTypeModalOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 260, backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, paddingVertical: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor, paddingHorizontal: 16, paddingVertical: 8, textTransform: 'uppercase' }}>
              Select Agent Type
            </Text>
            {agentTypes.map((typeStr) => (
              <TouchableOpacity
                key={typeStr}
                onPress={() => {
                  setForm({ ...form, agentType: typeStr });
                  setTypeModalOpen(false);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: form.agentType === typeStr ? borderCol : 'transparent'
                }}
              >
                <Text style={{ color: textColor, fontSize: 13 }}>{typeStr}</Text>
                {form.agentType === typeStr && <Check size={14} color={brandColor} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Commission Rules Modal */}
      <Modal visible={rulesModalOpen} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setRulesModalOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 280, maxHeight: 400, backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, paddingVertical: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor, paddingHorizontal: 16, paddingVertical: 8, textTransform: 'uppercase' }}>
              Select Commission Rule
            </Text>
            <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={true}>
              {commissionRules.map((ruleStr) => (
                <TouchableOpacity
                  key={ruleStr}
                  onPress={() => {
                    setForm({ ...form, commissionRules: ruleStr });
                    setRulesModalOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: form.commissionRules === ruleStr ? borderCol : 'transparent'
                  }}
                >
                  <Text style={{ color: textColor, fontSize: 13, flex: 1 }} numberOfLines={1}>{ruleStr}</Text>
                  {form.commissionRules === ruleStr && <Check size={14} color={brandColor} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
