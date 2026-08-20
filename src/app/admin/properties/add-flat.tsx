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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Building,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  Save,
  X,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { PropertyService } from '../../../admin/services/PropertyService';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const FLAT_STATUSES = ['Available', 'Sold', 'Blocked'];
const BHK_OPTIONS = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5 BHK', 'Studio', 'Duplex'];

export default function AddFlatScreen() {
  const router = useRouter();
  const { propertyId, flatId } = useLocalSearchParams();
  const propId = propertyId ? (Array.isArray(propertyId) ? propertyId[0] : propertyId) : '';
  const fId = flatId ? (Array.isArray(flatId) ? flatId[0] : flatId) : null;
  const isEditMode = !!fId;

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

  const [form, setForm] = useState({
    blockName: '',
    floorName: '',
    flatName: '',
    bhk: '2 BHK',
    propertyType: 'Apartment',
    propertyGroup: 'Residential',
    areaSqft: '',
    location: '',
    bedroomCount: '2',
    bathroomCount: '2',
    parkingAvailable: 'true',
    flatStatus: 'Available',
    price: '',
  });

  const [isBhkOpen, setBhkOpen] = useState(false);
  const [isStatusOpen, setStatusOpen] = useState(false);

  // Fetch flats using TanStack Query
  const { data: flats = [], isLoading: loading } = useQuery({
    queryKey: ['flats', propId],
    queryFn: async () => {
      const res = await PropertyService.getFlats(propId);
      if (!res.success) throw new Error('Failed to load flats.');
      return res.flats || [];
    },
    enabled: isEditMode && !!propId,
  });

  useEffect(() => {
    if (isEditMode && flats.length > 0) {
      const flat = flats.find((item) => item.flatId.toString() === fId);
      if (flat) {
        setForm({
          blockName: flat.blockName || '',
          floorName: flat.floorName || '',
          flatName: flat.flatName || '',
          bhk: flat.bhk || '2 BHK',
          propertyType: flat.propertyType || 'Apartment',
          propertyGroup: flat.propertyGroup || 'Residential',
          areaSqft: flat.areaSqft ? flat.areaSqft.toString() : '',
          location: flat.location || '',
          bedroomCount: flat.bedroomCount ? flat.bedroomCount.toString() : '2',
          bathroomCount: flat.bathroomCount ? flat.bathroomCount.toString() : '2',
          parkingAvailable: flat.parkingAvailable ? 'true' : 'false',
          flatStatus: flat.flatStatus || 'Available',
          price: flat.price ? flat.price.toString() : '',
        });
      }
    }
  }, [flats, isEditMode, fId]);

  const handleSave = async () => {
    if (!form.flatName.trim()) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Flat Name is required.' });
      return;
    }
    setSaving(true);
    const formData = new FormData();
    formData.append('flatId', isEditMode ? fId! : '0');
    formData.append('propertyId', propId);
    formData.append('blockName', form.blockName);
    formData.append('floorName', form.floorName);
    formData.append('flatName', form.flatName);
    formData.append('bhk', form.bhk);
    formData.append('propertyType', form.propertyType);
    formData.append('propertyGroup', form.propertyGroup);
    formData.append('areaSqft', form.areaSqft);
    formData.append('location', form.location);
    formData.append('bedroomCount', form.bedroomCount);
    formData.append('bathroomCount', form.bathroomCount);
    formData.append('parkingAvailable', form.parkingAvailable);
    formData.append('flatStatus', form.flatStatus);
    formData.append('price', form.price);

    try {
      const res = await PropertyService.saveFlat(formData);
      if (res.success) {
        Toast.show({ type: 'success', text1: 'Success', text2: res.message || 'Flat saved!' });
        queryClient.invalidateQueries({ queryKey: ['flats', propId] });
        router.back();
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: res.message || 'Failed to save flat.' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loaderWrap, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={brandCol} />
        <Text style={{ color: subTextColor, marginTop: 12 }}>Loading flat info...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {isEditMode ? 'Edit Flat Details' : 'Add New Flat'}
          </Text>

          {/* Row 1: Block + Floor + Flat Name */}
          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: subTextColor }]}>Block Name</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                value={form.blockName}
                onChangeText={(t) => setForm({ ...form, blockName: t })}
                placeholder="e.g. Block A"
                placeholderTextColor={subTextColor}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: subTextColor }]}>Floor</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                value={form.floorName}
                onChangeText={(t) => setForm({ ...form, floorName: t })}
                placeholder="e.g. 5th Floor"
                placeholderTextColor={subTextColor}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: subTextColor }]}>Flat Name *</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                value={form.flatName}
                onChangeText={(t) => setForm({ ...form, flatName: t })}
                placeholder="e.g. 501"
                placeholderTextColor={subTextColor}
              />
            </View>
          </View>

          {/* Row 2: BHK + Area + Price */}
          <View style={styles.formRow}>
            {/* BHK Dropdown */}
            <View style={{ flex: 1, zIndex: 20 }}>
              <Text style={[styles.label, { color: subTextColor }]}>BHK</Text>
              <TouchableOpacity
                style={[styles.formInput, styles.selectInput, { backgroundColor: inputBg, borderColor: isBhkOpen ? brandCol : borderCol }]}
                onPress={() => { setBhkOpen(!isBhkOpen); setStatusOpen(false); }}
              >
                <Text style={{ color: textColor, fontSize: 13, flex: 1 }}>{form.bhk}</Text>
                {isBhkOpen ? <ChevronUp size={13} color={subTextColor} /> : <ChevronDown size={13} color={subTextColor} />}
              </TouchableOpacity>
              {isBhkOpen && (
                <View style={[styles.miniDropdown, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  {BHK_OPTIONS.map((b) => (
                    <TouchableOpacity
                      key={b}
                      style={[styles.miniDropdownItem, { backgroundColor: form.bhk === b ? borderCol : 'transparent' }]}
                      onPress={() => { setForm({ ...form, bhk: b }); setBhkOpen(false); }}
                    >
                      <Text style={{ color: textColor, fontSize: 12 }}>{b}</Text>
                      {form.bhk === b && <Check size={11} color={brandCol} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: subTextColor }]}>Area (Sqft)</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                value={form.areaSqft}
                onChangeText={(t) => setForm({ ...form, areaSqft: t })}
                placeholder="e.g. 1200"
                placeholderTextColor={subTextColor}
                keyboardType="numeric"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: subTextColor }]}>Price (₹)</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                value={form.price}
                onChangeText={(t) => setForm({ ...form, price: t })}
                placeholder="e.g. 5500000"
                placeholderTextColor={subTextColor}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Row 3: Status + Parking + Bedrooms */}
          <View style={styles.formRow}>
            {/* Status Dropdown */}
            <View style={{ flex: 1, zIndex: 10 }}>
              <Text style={[styles.label, { color: subTextColor }]}>Status</Text>
              <TouchableOpacity
                style={[styles.formInput, styles.selectInput, { backgroundColor: inputBg, borderColor: isStatusOpen ? brandCol : borderCol }]}
                onPress={() => { setStatusOpen(!isStatusOpen); setBhkOpen(false); }}
              >
                <Text style={{ color: textColor, fontSize: 13, flex: 1 }}>
                  {form.flatStatus}
                </Text>
                {isStatusOpen ? <ChevronUp size={13} color={subTextColor} /> : <ChevronDown size={13} color={subTextColor} />}
              </TouchableOpacity>
              {isStatusOpen && (
                <View style={[styles.miniDropdown, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  {FLAT_STATUSES.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.miniDropdownItem, { backgroundColor: form.flatStatus === s ? borderCol : 'transparent' }]}
                      onPress={() => { setForm({ ...form, flatStatus: s }); setStatusOpen(false); }}
                    >
                      <Text style={{ color: textColor, fontSize: 12 }}>{s}</Text>
                      {form.flatStatus === s && <Check size={11} color={brandCol} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Parking Toggle */}
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: subTextColor }]}>Parking</Text>
              <View style={styles.parkingToggle}>
                <TouchableOpacity
                  style={[styles.toggleBtn, { backgroundColor: form.parkingAvailable === 'true' ? brandCol : inputBg, borderColor: borderCol }]}
                  onPress={() => setForm({ ...form, parkingAvailable: 'true' })}
                >
                  <Text style={{ color: form.parkingAvailable === 'true' ? '#fff' : subTextColor, fontSize: 12, fontWeight: '600' }}>
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, { backgroundColor: form.parkingAvailable === 'false' ? '#ef4444' : inputBg, borderColor: borderCol }]}
                  onPress={() => setForm({ ...form, parkingAvailable: 'false' })}
                >
                  <Text style={{ color: form.parkingAvailable === 'false' ? '#fff' : subTextColor, fontSize: 12, fontWeight: '600' }}>
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: subTextColor }]}>Bedrooms</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                value={form.bedroomCount}
                onChangeText={(t) => setForm({ ...form, bedroomCount: t })}
                placeholder="2"
                placeholderTextColor={subTextColor}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Action Buttons at bottom */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.cancelBtn, { backgroundColor: inputBg, borderColor: borderCol }]}
            onPress={() => router.back()}
          >
            <Text style={{ color: textColor, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: brandCol }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Save size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                  {isEditMode ? 'Update Flat' : 'Save Flat'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  section: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
  },
  formRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 10,
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  formInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniDropdown: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 2,
    zIndex: 999,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  miniDropdownItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  parkingToggle: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  toggleBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Buttons
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
