import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image as ImageIcon, Trash2, Plus } from 'lucide-react-native';
import { PropertyImageItem } from '../../../../admin/models/PropertyTypes';
import { AuthImage } from '../../../../components/AuthImage';
import { PropertyService } from '../../../../admin/services/PropertyService';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';

interface PhotosTabProps {
  images: PropertyImageItem[];
  uploadingImage: boolean;
  handlePickAndUploadImage: () => void;
  handleDeleteImage: (uploadId: number) => void;
  setSelectedPreviewImageId: (uploadId: number) => void;
}

export default function PhotosTab({
  images,
  uploadingImage,
  handlePickAndUploadImage,
  handleDeleteImage,
  setSelectedPreviewImageId,
}: PhotosTabProps) {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const cardBg = adminTheme.cardBg;
  const borderCol = adminTheme.border;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const brandCol = adminTheme.brand;
  const inputBg = adminTheme.inputBg;

  return (
    <View style={styles.photosContainer}>
      {images.length > 0 && (
        <Text style={{ color: subTextColor, fontSize: 13, marginBottom: 4 }}>
          {images.length} photo{images.length !== 1 ? 's' : ''} uploaded
        </Text>
      )}

      {/* Image Grid */}
      <View style={styles.imageGrid}>
        {images.map((img) => (
          <View key={img.uploadId} style={[styles.photoCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            {/* Image */}
            <View style={styles.imageWrap}>
              <TouchableOpacity onPress={() => setSelectedPreviewImageId(img.uploadId)}>
                <AuthImage
                  cacheKey={`upload_${img.uploadId}`}
                  fetchFn={() => PropertyService.getUploadImageBase64(img.uploadId)}
                  style={styles.gridImage}
                  resizeMode="cover"
                  spinnerColor={brandCol}
                  placeholder={
                    <View style={[styles.gridImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: inputBg }]}>
                      <ImageIcon size={24} color={subTextColor} />
                    </View>
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Title and delete btn inside card footer */}
            <View style={styles.photoInfo}>
              <Text style={[styles.photoName, { color: textColor }]} numberOfLines={1}>
                {img.fileName}
              </Text>
              <Text style={{ fontSize: 10, color: subTextColor }}>by {img.uploadedBy || 'admin'}</Text>
            </View>

            <TouchableOpacity
              style={styles.deletePhotoBtn}
              onPress={() => handleDeleteImage(img.uploadId)}
            >
              <Trash2 size={13} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}

        {/* The Upload Card inside the Grid (moves dynamically as images are added) */}
        <TouchableOpacity
          style={[
            styles.photoCard,
            styles.uploadCard,
            { backgroundColor: cardBg, borderColor: borderCol, borderStyle: 'dashed' },
          ]}
          onPress={handlePickAndUploadImage}
          disabled={uploadingImage}
        >
          <View style={styles.uploadCardContent}>
            {uploadingImage ? (
              <ActivityIndicator size="small" color={brandCol} />
            ) : (
              <View style={[styles.plusIconWrap, { backgroundColor: brandCol }]}>
                <Plus size={18} color="#fff" />
              </View>
            )}
            <Text style={[styles.uploadCardText, { color: textColor }]}>
              {uploadingImage ? 'Uploading...' : 'Add Photo'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  photosContainer: {
    gap: 16,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCard: {
    width: Platform.OS === 'web' ? '23%' : '47%',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  imageWrap: {
    width: '100%',
    height: 110,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: 110,
  },
  photoInfo: {
    padding: 10,
  },
  photoName: {
    fontSize: 12,
    fontWeight: '700',
  },
  deletePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  uploadCard: {
    height: 155,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  uploadCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  plusIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  uploadCardText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
});
