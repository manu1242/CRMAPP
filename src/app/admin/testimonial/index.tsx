import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Switch,
  Image as RNImage,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import {
  testimonialService,
  TestimonialItem,
  SaveTestimonialPayload,
} from '../../../admin/services/testimonialService';
import {
  ArrowLeft,
  Plus,
  Star,
  Edit3,
  Trash2,
  Camera,
  User,
  Info,
  CheckCircle,
} from 'lucide-react-native';

export default function TestimonialScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg || (isDark ? '#1e293b' : '#f8fafc');
  const brandColor = adminTheme.brand || '#3b82f6';

  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal form states
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number>(0);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  const fetchTestimonials = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await testimonialService.getTestimonials();
      if (res && res.success && res.data) {
        setTestimonials(res.data);
      } else {
        setTestimonials([]);
      }
    } catch (err: any) {
      console.error('Error fetching testimonials:', err?.message);
      Toast.show({
        type: 'error',
        text1: 'Fetch Error',
        text2: err?.message || 'Failed to fetch testimonials',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const handlePickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Gallery permission is required to upload testimonials photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageBase64(`data:image/jpeg;base64,${asset.base64}`);
      }
    } catch (err: any) {
      console.warn('Error picking image:', err?.message);
    }
  };

  const openAddModal = () => {
    setEditId(0);
    setName('');
    setTag('');
    setContent('');
    setRating(5);
    setImageBase64('');
    setIsActive(true);
    setModalVisible(true);
  };

  const openEditModal = (item: TestimonialItem) => {
    setEditId(item.testimonialId);
    setName(item.name);
    setTag(item.tag);
    setContent(item.content);
    setRating(item.rating);
    setImageBase64(item.imageBase64 || '');
    setIsActive(item.isActive);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a name.');
      return;
    }
    if (!tag.trim()) {
      Alert.alert('Validation Error', 'Please enter a designation/tag.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Validation Error', 'Please enter content.');
      return;
    }

    setSaving(true);
    try {
      const payload: SaveTestimonialPayload = {
        testimonialId: editId,
        name: name.trim(),
        tag: tag.trim(),
        content: content.trim(),
        rating,
        imageBase64: imageBase64 || undefined,
        isActive,
      };

      const res = await testimonialService.saveTestimonial(payload);
      if (res && res.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: editId === 0 ? 'Testimonial added successfully' : 'Testimonial updated successfully',
        });
        setModalVisible(false);
        fetchTestimonials();
      } else {
        Alert.alert('Save Failed', res.message || 'Failed to save testimonial.');
      }
    } catch (err: any) {
      console.error('Error saving testimonial:', err);
      Alert.alert('Save Error', err?.message || 'Failed to save testimonial.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number, userName: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete the testimonial from "${userName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await testimonialService.deleteTestimonial(id);
              if (res && res.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Deleted',
                  text2: 'Testimonial deleted successfully',
                });
                fetchTestimonials();
              } else {
                Alert.alert('Delete Failed', res.message || 'Failed to delete.');
              }
            } catch (err: any) {
              Alert.alert('Delete Error', err?.message || 'Failed to delete.');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (item: TestimonialItem) => {
    try {
      const payload: SaveTestimonialPayload = {
        testimonialId: item.testimonialId,
        name: item.name,
        tag: item.tag,
        content: item.content,
        rating: item.rating,
        imageBase64: item.imageBase64 || undefined,
        isActive: !item.isActive,
      };

      const res = await testimonialService.saveTestimonial(payload);
      if (res && res.success) {
        Toast.show({
          type: 'success',
          text1: 'Status Updated',
          text2: `Testimonial is now ${!item.isActive ? 'visible' : 'hidden'} on landing page`,
        });
        fetchTestimonials();
      }
    } catch (err: any) {
      console.error('Error toggling active state:', err);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Top Navigation Bar */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: cardBg,
          borderBottomWidth: 1,
          borderBottomColor: borderCol,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
          <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>Testimonials</Text>
        </View>

        <TouchableOpacity
          onPress={openAddModal}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: brandColor,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            gap: 4,
          }}
        >
          <Plus size={16} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchTestimonials(true)} />
        }
      >
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={brandColor} />
            <Text style={{ marginTop: 12, color: subTextColor, fontSize: 13 }}>Loading testimonials...</Text>
          </View>
        ) : testimonials.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center', gap: 10 }}>
            <Info size={40} color={subTextColor} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: textColor }}>No Testimonials Found</Text>
            <Text style={{ fontSize: 13, color: subTextColor, textAlign: 'center', paddingHorizontal: 40 }}>
              Testimonials you add will be shown here and displayed on the website landing page.
            </Text>
            <TouchableOpacity
              onPress={openAddModal}
              style={{
                backgroundColor: brandColor,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 8,
                marginTop: 10,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Create Testimonial</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {testimonials.map((item) => (
              <View
                key={item.testimonialId}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: borderCol,
                  padding: 16,
                  gap: 12,
                }}
              >
                {/* Profile Header */}
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  {item.imageBase64 ? (
                    <RNImage
                      source={{ uri: item.imageBase64 }}
                      style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: bgColor }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 23,
                        backgroundColor: '#3b82f620',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <User size={20} color="#3b82f6" />
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: subTextColor, marginTop: 1 }}>
                      {item.tag}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => openEditModal(item)} style={{ padding: 4 }}>
                      <Edit3 size={18} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.testimonialId, item.name)} style={{ padding: 4 }}>
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Rating & Content */}
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        color={s <= item.rating ? '#eab308' : '#cbd5e1'}
                        fill={s <= item.rating ? '#eab308' : 'none'}
                      />
                    ))}
                  </View>
                  <Text style={{ fontSize: 13, color: textColor, lineHeight: 18 }}>
                    "{item.content}"
                  </Text>
                </View>

                {/* Bottom Toggle switch */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: borderCol,
                  }}
                >
                  <View style={{ gap: 2 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>
                      Show on landing page
                    </Text>
                    <Text style={{ fontSize: 10, color: subTextColor }}>
                      Visible to website visitors
                    </Text>
                  </View>

                  <Switch
                    value={item.isActive}
                    onValueChange={() => handleToggleActive(item)}
                    trackColor={{ false: '#cbd5e1', true: '#10b981' }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add / Edit Testimonial Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: cardBg,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: '90%',
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>
                {editId === 0 ? 'Add Testimonial' : 'Edit Testimonial'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                <Text style={{ color: subTextColor, fontSize: 14, fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              
              {/* Photo Upload Row */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>Photo</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  {imageBase64 ? (
                    <RNImage
                      source={{ uri: imageBase64 }}
                      style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: bgColor }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: borderCol,
                      }}
                    >
                      <User size={28} color={subTextColor} />
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={handlePickPhoto}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isDark ? '#1e293b' : '#fff',
                      borderWidth: 1,
                      borderColor: '#e2e8f0',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      gap: 6,
                    }}
                  >
                    <Camera size={16} color="#f59e0b" />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#fff' : '#475569' }}>
                      Choose Photo
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Name */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                  Name <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <TextInput
                  style={{
                    backgroundColor: inputBg,
                    borderWidth: 1,
                    borderColor: borderCol,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    height: 44,
                    color: textColor,
                    fontSize: 13,
                  }}
                  value={name}
                  onChangeText={setName}
                  placeholder="Full name"
                  placeholderTextColor={subTextColor}
                />
              </View>

              {/* Tag / Designation */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                  Designation <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <TextInput
                  style={{
                    backgroundColor: inputBg,
                    borderWidth: 1,
                    borderColor: borderCol,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    height: 44,
                    color: textColor,
                    fontSize: 13,
                  }}
                  value={tag}
                  onChangeText={setTag}
                  placeholder="e.g. Property Owner"
                  placeholderTextColor={subTextColor}
                />
              </View>

              {/* Content / Body */}
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                    Content <Text style={{ color: '#ef4444' }}>*</Text>
                  </Text>
                  <Text style={{ fontSize: 11, color: subTextColor }}>
                    {content.length}/500
                  </Text>
                </View>
                <TextInput
                  style={{
                    backgroundColor: inputBg,
                    borderWidth: 1,
                    borderColor: borderCol,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingTop: 8,
                    height: 100,
                    color: textColor,
                    fontSize: 13,
                    textAlignVertical: 'top',
                  }}
                  multiline
                  maxLength={500}
                  value={content}
                  onChangeText={setContent}
                  placeholder="Write the testimonial..."
                  placeholderTextColor={subTextColor}
                />
              </View>

              {/* Rating */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                  Rating <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <TouchableOpacity key={s} onPress={() => setRating(s)}>
                        <Star
                          size={24}
                          color={s <= rating ? '#eab308' : '#cbd5e1'}
                          fill={s <= rating ? '#eab308' : 'none'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={{ fontSize: 12, color: subTextColor }}>
                    Click to rate
                  </Text>
                </View>
              </View>

              {/* Active Switch */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderTopWidth: 1,
                  borderTopColor: borderCol,
                  borderBottomWidth: 1,
                  borderBottomColor: borderCol,
                }}
              >
                <View style={{ gap: 2 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                    Show on landing page
                  </Text>
                  <Text style={{ fontSize: 11, color: subTextColor }}>
                    Visible to website visitors
                  </Text>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: '#cbd5e1', true: '#10b981' }}
                  thumbColor="#fff"
                />
              </View>

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
                <TouchableOpacity
                  disabled={saving}
                  onPress={() => setModalVisible(false)}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: textColor, fontWeight: '700', fontSize: 13 }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={saving}
                  onPress={handleSave}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 8,
                    backgroundColor: brandColor,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Save Testimonial</Text>
                  )}
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
