import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import { useCreateChannelPartner, useSubscriptionPlans } from '../../../../admin/hooks/useChannelPartners';
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
} from 'lucide-react-native';

interface PendingDoc {
  uri: string;
  fileName: string;
  fileSize: number;
  type: string;
  customName: string;
  documentType: string;
}

export default function CreateChannelPartnerScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  // Form States
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    commissionScheme: '',
    commissionPercentage: '5.0',
    selectedPlanId: '',
  });

  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);
  const [planDropdownOpen, setPlanDropdownOpen] = useState(false);

  // Theme values
  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg;
  const brandColor = adminTheme.brand;

  // Subscription plans list query
  const { data: plansData, isLoading: loadingPlans } = useSubscriptionPlans();
  const plans = plansData?.data || [];

  // Find currently selected plan
  const selectedPlan = plans.find((p) => p.planId === Number(form.selectedPlanId));

  // Mutation
  const createMutation = useCreateChannelPartner();
  const isSubmitting = createMutation.isPending;

  // Document types for selector
  const DOC_TYPES = ['License', 'Pan', 'Gst', 'Aadhar', 'Others'];

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
          documentType: 'License',
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
    // Form validations
    if (!form.companyName.trim()) {
      Alert.alert('Validation Error', 'Please enter the Company Name.');
      return;
    }
    if (!form.contactPerson.trim()) {
      Alert.alert('Validation Error', 'Please enter the Contact Person.');
      return;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid Email Address.');
      return;
    }
    const cleanPhone = form.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 10) {
      Alert.alert('Validation Error', 'Phone number must be exactly 10 digits.');
      return;
    }
    if (!form.commissionScheme.trim()) {
      Alert.alert('Validation Error', 'Please specify the Commission Scheme.');
      return;
    }
    if (!form.selectedPlanId) {
      Alert.alert('Validation Error', 'Please select a Subscription Plan.');
      return;
    }

    const commPercent = parseFloat(form.commissionPercentage);
    if (isNaN(commPercent) || commPercent < 0 || commPercent > 100) {
      Alert.alert('Validation Error', 'Commission percentage must be between 0 and 100.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('CompanyName', form.companyName.trim());
      formData.append('ContactPerson', form.contactPerson.trim());
      formData.append('Email', form.email.trim());
      formData.append('Phone', cleanPhone);
      if (form.address.trim()) {
        formData.append('Address', form.address.trim());
      }
      formData.append('CommissionScheme', form.commissionScheme.trim());
      formData.append('CommissionPercentage', commPercent.toString());
      formData.append('SelectedPlanId', form.selectedPlanId);

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

      await createMutation.mutateAsync(formData);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Channel Partner onboarded successfully.',
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Onboarding failed. Please try again.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Header navbar */}
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
          <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>Onboard Partner</Text>
          <Text style={{ fontSize: 10, color: subTextColor, marginTop: 1 }}>Register a new channel partner</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Basic Information Section */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16, gap: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, marginBottom: 4 }}>Basic Information</Text>

          {/* Company Name */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: subTextColor }}>Company Name *</Text>
            <TextInput
              style={{ height: 42, borderRadius: 10, borderWidth: 1, borderColor: borderCol, paddingHorizontal: 12, color: textColor, backgroundColor: inputBg, fontSize: 13 }}
              placeholder="e.g. Acme Realtors Ltd"
              placeholderTextColor={subTextColor}
              value={form.companyName}
              onChangeText={(t) => setForm((prev) => ({ ...prev, companyName: t }))}
            />
          </View>

          {/* Contact Person */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: subTextColor }}>Contact Person *</Text>
            <TextInput
              style={{ height: 42, borderRadius: 10, borderWidth: 1, borderColor: borderCol, paddingHorizontal: 12, color: textColor, backgroundColor: inputBg, fontSize: 13 }}
              placeholder="e.g. John Doe"
              placeholderTextColor={subTextColor}
              value={form.contactPerson}
              onChangeText={(t) => setForm((prev) => ({ ...prev, contactPerson: t }))}
            />
          </View>

          {/* Email */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: subTextColor }}>Email Address *</Text>
            <TextInput
              style={{ height: 42, borderRadius: 10, borderWidth: 1, borderColor: borderCol, paddingHorizontal: 12, color: textColor, backgroundColor: inputBg, fontSize: 13 }}
              placeholder="e.g. partner@acme.com"
              placeholderTextColor={subTextColor}
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(t) => setForm((prev) => ({ ...prev, email: t }))}
            />
          </View>

          {/* Phone */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: subTextColor }}>Phone Number *</Text>
            <TextInput
              style={{ height: 42, borderRadius: 10, borderWidth: 1, borderColor: borderCol, paddingHorizontal: 12, color: textColor, backgroundColor: inputBg, fontSize: 13 }}
              placeholder="10-digit number"
              placeholderTextColor={subTextColor}
              keyboardType="phone-pad"
              maxLength={10}
              value={form.phone}
              onChangeText={(t) => setForm((prev) => ({ ...prev, phone: t }))}
            />
          </View>

          {/* Address */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: subTextColor }}>Office Address</Text>
            <TextInput
              style={{ height: 70, borderRadius: 10, borderWidth: 1, borderColor: borderCol, paddingHorizontal: 12, paddingTop: 10, color: textColor, backgroundColor: inputBg, fontSize: 13, textAlignVertical: 'top' }}
              placeholder="Enter full physical address..."
              placeholderTextColor={subTextColor}
              multiline
              numberOfLines={3}
              value={form.address}
              onChangeText={(t) => setForm((prev) => ({ ...prev, address: t }))}
            />
          </View>
        </View>

        {/* Subscription & Compensation Section */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16, gap: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, marginBottom: 4 }}>Subscription & Compensation</Text>

          {/* Subscription Plan */}
          <View style={{ gap: 6, zIndex: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: subTextColor }}>Subscription Plan *</Text>
            {loadingPlans ? (
              <ActivityIndicator size="small" color={brandColor} />
            ) : (
              <View style={{ position: 'relative' }}>
                <TouchableOpacity
                  onPress={() => setPlanDropdownOpen(!planDropdownOpen)}
                  style={{
                    height: 42,
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
                  <Text style={{ color: selectedPlan ? textColor : subTextColor, fontSize: 13 }}>
                    {selectedPlan ? selectedPlan.planName : 'Select subscription plan'}
                  </Text>
                  <ChevronDown size={16} color={subTextColor} />
                </TouchableOpacity>

                {planDropdownOpen && (
                  <View style={{
                    position: 'absolute',
                    top: 46,
                    left: 0,
                    right: 0,
                    backgroundColor: cardBg,
                    borderWidth: 1,
                    borderColor: borderCol,
                    borderRadius: 10,
                    paddingVertical: 4,
                    shadowColor: '#000',
                    shadowOpacity: 0.15,
                    shadowRadius: 6,
                    elevation: 5,
                    zIndex: 100
                  }}>
                    {plans.map((p) => (
                      <TouchableOpacity
                        key={p.planId}
                        onPress={() => {
                          setForm((prev) => ({ ...prev, selectedPlanId: p.planId.toString() }));
                          setPlanDropdownOpen(false);
                        }}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          backgroundColor: form.selectedPlanId === p.planId.toString() ? borderCol : 'transparent',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, color: textColor, fontWeight: '600' }}>{p.planName}</Text>
                          <Text style={{ fontSize: 10, color: subTextColor, marginTop: 1 }}>{p.description}</Text>
                        </View>
                        {form.selectedPlanId === p.planId.toString() && <Check size={14} color={brandColor} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Commission Scheme */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: subTextColor }}>Commission Scheme *</Text>
            <TextInput
              style={{ height: 42, borderRadius: 10, borderWidth: 1, borderColor: borderCol, paddingHorizontal: 12, color: textColor, backgroundColor: inputBg, fontSize: 13 }}
              placeholder="e.g. Tier 1 Brokerage Plan"
              placeholderTextColor={subTextColor}
              value={form.commissionScheme}
              onChangeText={(t) => setForm((prev) => ({ ...prev, commissionScheme: t }))}
            />
          </View>

          {/* Commission Percentage */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: subTextColor }}>Commission Percentage (%) *</Text>
            <TextInput
              style={{ height: 42, borderRadius: 10, borderWidth: 1, borderColor: borderCol, paddingHorizontal: 12, color: textColor, backgroundColor: inputBg, fontSize: 13 }}
              placeholder="e.g. 5.0"
              placeholderTextColor={subTextColor}
              keyboardType="numeric"
              value={form.commissionPercentage}
              onChangeText={(t) => setForm((prev) => ({ ...prev, commissionPercentage: t }))}
            />
          </View>
        </View>

        {/* Verification Documents Section */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>Verification Documents</Text>
            <TouchableOpacity
              onPress={handlePickDocument}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: `${brandColor}15`,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                gap: 4
              }}
            >
              <Paperclip size={12} color={brandColor} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: brandColor }}>Add Document</Text>
            </TouchableOpacity>
          </View>

          {pendingDocs.length === 0 ? (
            <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: borderCol, borderRadius: 12, padding: 20, alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={24} color={subTextColor} style={{ marginBottom: 6 }} />
              <Text style={{ fontSize: 11, color: subTextColor, textAlign: 'center' }}>No documents attached yet.</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {pendingDocs.map((doc, index) => (
                <View key={index} style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: borderCol, backgroundColor: inputBg, gap: 8 }}>
                  {/* Row 1: Mime info & Remove */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <FileText size={14} color={brandColor} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: textColor, flex: 1 }} numberOfLines={1}>
                        {doc.fileName}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemovePendingDoc(index)} style={{ padding: 4 }}>
                      <Trash2 size={14} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  {/* Row 2: Custom Document Name input */}
                  <TextInput
                    style={{ height: 34, borderRadius: 8, borderWidth: 1, borderColor: borderCol, paddingHorizontal: 10, color: textColor, backgroundColor: cardBg, fontSize: 11 }}
                    placeholder="Rename document (e.g. Trade License)"
                    placeholderTextColor={subTextColor}
                    value={doc.customName}
                    onChangeText={(t) => handleUpdatePendingDoc(index, 'customName', t)}
                  />

                  {/* Row 3: Document Type selector */}
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {DOC_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => handleUpdatePendingDoc(index, 'documentType', type)}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: doc.documentType === type ? brandColor : borderCol,
                          backgroundColor: doc.documentType === type ? `${brandColor}15` : cardBg,
                        }}
                      >
                        <Text style={{ fontSize: 9, fontWeight: '700', color: doc.documentType === type ? brandColor : subTextColor }}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={{
            backgroundColor: brandColor,
            height: 46,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 10,
            opacity: isSubmitting ? 0.7 : 1,
            flexDirection: 'row',
            gap: 8
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>Submit Registration</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
