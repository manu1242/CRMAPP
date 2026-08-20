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
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Building,
  MapPin,
  DollarSign,
  Maximize2,
  User,
  Home,
  Image as ImageIcon,
  Check,
  ChevronDown,
  ChevronUp,
  Save,
  X,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { PropertyService } from '../../../admin/services/PropertyService';
import { ExecutiveItem } from '../../../admin/models/PropertyTypes';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PURCHASE_TYPES = ['Sale', 'Rent', 'Lease'];

export default function AddPropertyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const propertyId = id ? (Array.isArray(id) ? id[0] : id) : null;
  const isEditMode = !!propertyId;

  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg;
  const brandCol = adminTheme.brand;

  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    propertyName: '',
    builderName: '',
    location: '',
    areaSqft: '',
    price: '',
    purchaseType: 'Sale',
    assignedTo: '',
  });
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Inline dropdown states (no modals)
  const [isPurchaseTypeOpen, setPurchaseTypeOpen] = useState(false);
  const [isExecOpen, setExecOpen] = useState(false);

  // TanStack Queries
  const { data: executives = [] } = useQuery({
    queryKey: ['executives'],
    queryFn: async () => {
      const res = await PropertyService.getExecutives();
      if (!res.success) throw new Error('Failed to fetch executives');
      return res.executives || [];
    }
  });

  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      const res = await PropertyService.getPropertyById(propertyId!);
      if (!res.success) throw new Error('Failed to fetch property details');
      return res;
    },
    enabled: isEditMode && !!propertyId,
  });

  const loading = isEditMode && propertyLoading;

  useEffect(() => {
    if (property) {
      const p = property as any;
      setForm({
        propertyName: p.propertyName || '',
        builderName: p.builderName || '',
        location: p.location || '',
        areaSqft: p.areaSqft ? p.areaSqft.toString() : '',
        price: p.price ? p.price.toString() : '',
        purchaseType: p.purchaseType || 'Sale',
        assignedTo: p.assignedTo ? p.assignedTo.toString() : '',
      });

      // Load image preview if available
      if (p.propertyImage && p.propertyImage.length > 0) {
        try {
          const byteArray = p.propertyImage;
          let binary = '';
          for (let i = 0; i < byteArray.length; i++) {
            binary += String.fromCharCode(byteArray[i]);
          }
          const base64 = btoa(binary);
          setImagePreviewUrl(`data:image/png;base64,${base64}`);
        } catch { /* silent */ }
      }
    }
  }, [property]);

  const handlePickImage = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          setSelectedImage(file);
          setImagePreviewUrl(URL.createObjectURL(file));
        }
      };
      input.click();
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Library access required.' });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled) {
        const asset = result.assets[0];
        setSelectedImage({ uri: asset.uri, name: asset.fileName || 'upload.jpg', type: asset.mimeType || 'image/jpeg' });
        setImagePreviewUrl(asset.uri);
      }
    }
  };

  const handleSave = async () => {
    if (!form.propertyName.trim() || !form.builderName.trim() || !form.location.trim()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Name, Builder and Location are required.' });
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append('propertyId', isEditMode ? propertyId! : '0');
    formData.append('propertyName', form.propertyName);
    formData.append('builderName', form.builderName);
    formData.append('location', form.location);
    formData.append('areaSqft', form.areaSqft);
    formData.append('price', form.price);
    formData.append('purchaseType', form.purchaseType);
    formData.append('assignedTo', form.assignedTo);

    if (selectedImage) {
      if (Platform.OS === 'web') {
        formData.append('propertyImage', selectedImage);
      } else {
        formData.append('propertyImage', selectedImage as any);
      }
    }

    try {
      const res = await PropertyService.saveProperty(formData);
      if (res.success) {
        Toast.show({ type: 'success', text1: 'Success', text2: res.message || 'Property saved!' });
        if (isEditMode && propertyId) {
          await AsyncStorage.removeItem(`auth_image_cover_${propertyId}`);
          queryClient.invalidateQueries({ queryKey: ['auth_image', `cover_${propertyId}`] });
          queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
        }
        queryClient.invalidateQueries({ queryKey: ['properties'] });
        router.back();
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: res.message || 'Failed to save.' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Network Error', text2: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loaderWrap, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={brandCol} />
        <Text style={{ color: subTextColor, marginTop: 12 }}>Loading property...</Text>
      </View>
    );
  }

  const selectedExecName = executives.find((e) => e.userId.toString() === form.assignedTo)?.fullName || 'Unassigned';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Section: Basic Info ── */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Basic Information</Text>

          <Text style={[styles.label, { color: subTextColor }]}>Property Name *</Text>
          <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: borderCol }]}>
            <Building size={16} color={subTextColor} />
            <TextInput
              style={[styles.textInput, { color: textColor }]}
              value={form.propertyName}
              onChangeText={(t) => setForm({ ...form, propertyName: t })}
              placeholder="e.g. Green Heights"
              placeholderTextColor={subTextColor}
            />
          </View>

          <Text style={[styles.label, { color: subTextColor }]}>Builder / Developer *</Text>
          <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: borderCol }]}>
            <Building size={16} color={subTextColor} />
            <TextInput
              style={[styles.textInput, { color: textColor }]}
              value={form.builderName}
              onChangeText={(t) => setForm({ ...form, builderName: t })}
              placeholder="e.g. Royal Developers"
              placeholderTextColor={subTextColor}
            />
          </View>

          <Text style={[styles.label, { color: subTextColor }]}>Location *</Text>
          <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: borderCol }]}>
            <MapPin size={16} color={subTextColor} />
            <TextInput
              style={[styles.textInput, { color: textColor }]}
              value={form.location}
              onChangeText={(t) => setForm({ ...form, location: t })}
              placeholder="e.g. Indiranagar, Bangalore"
              placeholderTextColor={subTextColor}
            />
          </View>
        </View>

        {/* ── Section: Pricing & Area ── */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Pricing & Area</Text>

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: subTextColor }]}>Area (Sqft)</Text>
              <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: borderCol }]}>
                <Maximize2 size={16} color={subTextColor} />
                <TextInput
                  style={[styles.textInput, { color: textColor }]}
                  value={form.areaSqft}
                  onChangeText={(t) => setForm({ ...form, areaSqft: t })}
                  placeholder="e.g. 1800"
                  placeholderTextColor={subTextColor}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: subTextColor }]}>Price (₹)</Text>
              <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: borderCol }]}>
                <DollarSign size={16} color={subTextColor} />
                <TextInput
                  style={[styles.textInput, { color: textColor }]}
                  value={form.price}
                  onChangeText={(t) => setForm({ ...form, price: t })}
                  placeholder="e.g. 9500000"
                  placeholderTextColor={subTextColor}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        {/* ── Section: Classification ── */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Classification</Text>

          <View style={styles.twoCol}>
            {/* Purchase Type Inline Dropdown */}
            <View style={{ flex: 1, zIndex: 20 }}>
              <Text style={[styles.label, { color: subTextColor }]}>Purchase Type</Text>
              <TouchableOpacity
                style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: isPurchaseTypeOpen ? brandCol : borderCol }]}
                onPress={() => { setPurchaseTypeOpen(!isPurchaseTypeOpen); setExecOpen(false); }}
              >
                <Home size={16} color={subTextColor} />
                <Text style={[styles.textInput, { color: textColor }]}>{form.purchaseType}</Text>
                {isPurchaseTypeOpen ? <ChevronUp size={14} color={subTextColor} /> : <ChevronDown size={14} color={subTextColor} />}
              </TouchableOpacity>
              {isPurchaseTypeOpen && (
                <View style={[styles.inlineDropdown, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  {PURCHASE_TYPES.map((pt) => (
                    <TouchableOpacity
                      key={pt}
                      style={[styles.dropdownItem, { backgroundColor: form.purchaseType === pt ? borderCol : 'transparent' }]}
                      onPress={() => { setForm({ ...form, purchaseType: pt }); setPurchaseTypeOpen(false); }}
                    >
                      <Text style={{ color: textColor, fontSize: 13 }}>{pt}</Text>
                      {form.purchaseType === pt && <Check size={13} color={brandCol} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Assigned Executive Inline Dropdown */}
            <View style={{ flex: 1, zIndex: 10 }}>
              <Text style={[styles.label, { color: subTextColor }]}>Assigned Executive</Text>
              <TouchableOpacity
                style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: isExecOpen ? brandCol : borderCol }]}
                onPress={() => { setExecOpen(!isExecOpen); setPurchaseTypeOpen(false); }}
              >
                <User size={16} color={subTextColor} />
                <Text style={[styles.textInput, { color: textColor }]} numberOfLines={1}>{selectedExecName}</Text>
                {isExecOpen ? <ChevronUp size={14} color={subTextColor} /> : <ChevronDown size={14} color={subTextColor} />}
              </TouchableOpacity>
              {isExecOpen && (
                <View style={[styles.inlineDropdown, { backgroundColor: cardBg, borderColor: borderCol, maxHeight: 200 }]}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <TouchableOpacity
                      style={[styles.dropdownItem, { backgroundColor: form.assignedTo === '' ? borderCol : 'transparent' }]}
                      onPress={() => { setForm({ ...form, assignedTo: '' }); setExecOpen(false); }}
                    >
                      <Text style={{ color: textColor, fontSize: 13 }}>Unassigned</Text>
                      {form.assignedTo === '' && <Check size={13} color={brandCol} />}
                    </TouchableOpacity>
                    {executives.map((exec) => (
                      <TouchableOpacity
                        key={exec.userId}
                        style={[styles.dropdownItem, { backgroundColor: form.assignedTo === exec.userId.toString() ? borderCol : 'transparent' }]}
                        onPress={() => { setForm({ ...form, assignedTo: exec.userId.toString() }); setExecOpen(false); }}
                      >
                        <Text style={{ color: textColor, fontSize: 13 }}>{exec.fullName}</Text>
                        {form.assignedTo === exec.userId.toString() && <Check size={13} color={brandCol} />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Section: Cover Image ── */}
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Cover Image</Text>

          <View style={styles.imagePickerRow}>
            <TouchableOpacity
              style={[styles.imagePickBtn, { backgroundColor: inputBg, borderColor: borderCol }]}
              onPress={handlePickImage}
            >
              <ImageIcon size={18} color={brandCol} />
              <Text style={{ color: brandCol, fontWeight: '600', fontSize: 13 }}>
                {imagePreviewUrl ? 'Change Photo' : 'Choose Photo'}
              </Text>
            </TouchableOpacity>

            {imagePreviewUrl ? (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: imagePreviewUrl }} style={styles.imagePreview} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.removeImgBtn}
                  onPress={() => { setSelectedImage(null); setImagePreviewUrl(null); }}
                >
                  <X size={10} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{ color: subTextColor, fontSize: 12 }}>No image selected</Text>
            )}
          </View>
        </View>

        {/* Save Button (bottom) */}
        <TouchableOpacity
          style={[styles.saveBtnFull, { backgroundColor: brandCol }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Save size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                {isEditMode ? 'Update Property' : 'Save Property'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },


  // Section Card
  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 14,
  },

  // Two-column layout
  twoCol: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 12,
  },

  // Form inputs
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  inputWrap: {
    height: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },

  // Inline Dropdown
  inlineDropdown: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 2,
    paddingVertical: 4,
    zIndex: 999,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Image
  imagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  imagePickBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imagePreviewWrap: {
    position: 'relative',
    width: 70,
    height: 70,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  removeImgBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Save Button
  saveBtnFull: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
});
