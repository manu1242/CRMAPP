import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  Upload,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { PropertyService } from '../../../admin/services/PropertyService';
import { PropertyImageItem } from '../../../admin/models/PropertyTypes';
import { AuthImage } from '../../../components/AuthImage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ImagesScreen() {
  const { propertyId, propertyName } = useLocalSearchParams();
  const propId = propertyId ? (Array.isArray(propertyId) ? propertyId[0] : propertyId) : '';
  const propName = propertyName ? (Array.isArray(propertyName) ? propertyName[0] : propertyName) : 'Property';

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
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: images = [], isLoading: loading, refetch: fetchImages } = useQuery({
    queryKey: ['property_images', propId],
    queryFn: async () => {
      const res = await PropertyService.getImages(propId);
      if (!res.success) throw new Error('Failed to load images.');
      return res.uploads || [];
    },
    enabled: !!propId,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchImages();
    setRefreshing(false);
  };

  const handleUpload = async () => {
    const performUpload = async (file: any) => {
      setUploading(true);
      const formData = new FormData();
      formData.append('propertyId', propId);
      formData.append('fileType', 'Image');
      if (Platform.OS === 'web') {
        formData.append('file', file);
      } else {
        formData.append('file', file as any);
      }
      try {
        const res = await PropertyService.uploadImage(formData);
        if (res.success) {
          Toast.show({ type: 'success', text1: 'Uploaded', text2: 'Image uploaded successfully.' });
          queryClient.invalidateQueries({ queryKey: ['property_images', propId] });
        } else {
          Toast.show({ type: 'error', text1: 'Failed', text2: res.message || 'Upload failed.' });
        }
      } catch (err: any) {
        Toast.show({ type: 'error', text1: 'Error', text2: err.message });
      } finally {
        setUploading(false);
      }
    };

    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) performUpload(file);
      };
      input.click();
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled) {
        const asset = result.assets[0];
        performUpload({
          uri: asset.uri,
          name: asset.fileName || 'upload.jpg',
          type: asset.mimeType || 'image/jpeg',
        });
      }
    }
  };

  const handleDelete = async (uploadId: number, fileName: string) => {
    const performDelete = async () => {
      try {
        const res = await PropertyService.deleteImage(uploadId);
        if (res.success) {
          Toast.show({ type: 'success', text1: 'Deleted', text2: `${fileName} deleted.` });
          // Clear local cache for this specific image upload
          await AsyncStorage.removeItem(`auth_image_upload_${uploadId}`);
          queryClient.invalidateQueries({ queryKey: ['auth_image', `upload_${uploadId}`] });
          queryClient.invalidateQueries({ queryKey: ['property_images', propId] });
        } else {
          Toast.show({ type: 'error', text1: 'Error', text2: res.message || 'Delete failed.' });
        }
      } catch (err: any) {
        Toast.show({ type: 'error', text1: 'Error', text2: err.message });
      }
    };
    if (Platform.OS === 'web') {
      if (confirm(`Delete image "${fileName}"?`)) performDelete();
    } else {
      performDelete();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Upload Button Row */}
        <TouchableOpacity
          style={[styles.uploadBtn, { backgroundColor: brandCol }]}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Upload size={15} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Upload Photo</Text>
            </>
          )}
        </TouchableOpacity>

        {loading && !refreshing ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={brandCol} />
            <Text style={{ color: subTextColor, marginTop: 12 }}>Loading photos...</Text>
          </View>
        ) : images.length === 0 ? (
          /* Empty State with Upload CTA */
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIconWrap, { backgroundColor: inputBg, borderColor: borderCol }]}>
              <ImageIcon size={48} color={subTextColor} />
            </View>
            <Text style={[styles.emptyTitle, { color: textColor }]}>No Photos Yet</Text>
            <Text style={{ color: subTextColor, textAlign: 'center', marginTop: 6, fontSize: 13, lineHeight: 20 }}>
              Upload photos to showcase this property.{'\n'}High quality images attract more leads.
            </Text>
            <TouchableOpacity
              style={[styles.emptyUploadBtn, { backgroundColor: brandCol }]}
              onPress={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Upload size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Upload First Photo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Count */}
            <Text style={{ color: subTextColor, fontSize: 13, marginBottom: 14 }}>
              {images.length} photo{images.length !== 1 ? 's' : ''} uploaded
            </Text>

            {/* Image Grid */}
            <View style={styles.imageGrid}>
              {images.map((img) => (
                <View key={img.uploadId} style={[styles.imageCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  {/* Image */}
                  <View style={styles.imageWrap}>
                    <AuthImage
                      cacheKey={`upload_${img.uploadId}`}
                      fetchFn={() => PropertyService.getUploadImageBase64(img.uploadId)}
                      style={styles.image}
                      resizeMode="cover"
                      spinnerColor={brandCol}
                      placeholder={
                        <View style={[styles.image, { justifyContent: 'center', alignItems: 'center', backgroundColor: inputBg }]}>
                          <ImageIcon size={24} color={subTextColor} />
                        </View>
                      }
                    />
                    {/* Delete overlay button */}
                    <TouchableOpacity
                      style={styles.deleteOverlay}
                      onPress={() => handleDelete(img.uploadId, img.fileName)}
                    >
                      <Trash2 size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  {/* Footer */}
                  <View style={[styles.imageFooter, { borderTopColor: borderCol }]}>
                    <Text style={{ color: textColor, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                      {img.fileName}
                    </Text>
                    <Text style={{ color: subTextColor, fontSize: 10, marginTop: 1 }}>
                      by {img.uploadedBy || 'admin'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  uploadBtn: {
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },

  // Loader / Empty
  loaderWrap: { paddingVertical: 80, alignItems: 'center' },
  emptyWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptyUploadBtn: {
    marginTop: 24,
    height: 50,
    paddingHorizontal: 28,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Image Grid
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageCard: {
    width: Platform.OS === 'web' ? '23%' : '47%',
    minWidth: 140,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    height: 130,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(239,68,68,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageFooter: {
    padding: 8,
    borderTopWidth: 1,
  },
});
