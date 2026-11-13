import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Image,
  Modal,
  Alert,
  Vibration,
  Dimensions,
  GestureResponderEvent,
} from 'react-native';
import { Image as ImageIcon, Trash2, Plus, Maximize2 } from 'lucide-react-native';
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

  const [actionImage, setActionImage] = useState<PropertyImageItem | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const handleLongPress = (img: PropertyImageItem, event?: GestureResponderEvent) => {
    try {
      Vibration.vibrate(50);
    } catch {}

    if (event?.nativeEvent) {
      const { pageY, pageX } = event.nativeEvent;
      const screenHeight = Dimensions.get('window').height;
      const screenWidth = Dimensions.get('window').width;
      const menuHeight = 150;
      const menuWidth = 220;

      let top = pageY - 10;
      if (top + menuHeight > screenHeight - 50) {
        top = Math.max(50, pageY - menuHeight - 10);
      } else {
        top = Math.max(50, top);
      }

      let left = pageX ? pageX - 60 : (screenWidth - menuWidth) / 2;
      if (left + menuWidth > screenWidth - 16) {
        left = screenWidth - menuWidth - 16;
      }
      left = Math.max(16, left);

      setMenuPosition({ top, left });
    } else {
      setMenuPosition(null);
    }

    setActionImage(img);
  };

  const confirmDeleteImage = (img: PropertyImageItem) => {
    Alert.alert(
      'Delete Photo',
      `Are you sure you want to delete "${img.fileName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteImage(img.uploadId),
        },
      ]
    );
  };

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
          <TouchableOpacity
            key={img.uploadId}
            activeOpacity={0.9}
            onPress={() => setSelectedPreviewImageId(img.uploadId)}
            onLongPress={(e) => handleLongPress(img, e)}
            delayLongPress={350}
            style={[styles.photoCard, { backgroundColor: cardBg, borderColor: borderCol }]}
          >
            {/* Image */}
            <View style={styles.imageWrap}>
              {(() => {
                const photoUri = PropertyService.getUploadImageUri(img);
                if (photoUri) {
                  return (
                    <Image
                      source={{ uri: photoUri }}
                      style={styles.gridImage}
                      resizeMode="cover"
                    />
                  );
                }
                return (
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
                );
              })()}
            </View>

            {/* Title inside card footer */}
            <View style={styles.photoInfo}>
              <Text style={[styles.photoName, { color: textColor }]} numberOfLines={1}>
                {img.fileName}
              </Text>
              <Text style={{ fontSize: 10, color: subTextColor }}>by {img.uploadedBy || 'admin'}</Text>
            </View>
          </TouchableOpacity>
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

      {/* Action Dropdown Modal on Long Press */}
      <Modal
        visible={actionImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setActionImage(null);
          setMenuPosition(null);
        }}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => {
            setActionImage(null);
            setMenuPosition(null);
          }}
        >
          <View
            style={[
              styles.dropdownMenu,
              {
                backgroundColor: cardBg,
                borderColor: borderCol,
              },
              menuPosition
                ? {
                    position: 'absolute',
                    top: menuPosition.top,
                    left: menuPosition.left,
                  }
                : {
                    position: 'absolute',
                    top: 180,
                    alignSelf: 'center',
                  },
            ]}
          >
            <View style={styles.dropdownHeader}>
              <Text style={[styles.dropdownTitle, { color: textColor }]} numberOfLines={1}>
                Photo Options
              </Text>
              <Text style={[styles.dropdownSubtitle, { color: subTextColor }]} numberOfLines={1}>
                {actionImage?.fileName}
              </Text>
            </View>

            <View style={[styles.dropdownDivider, { backgroundColor: borderCol }]} />

            {/* View Photo Option */}
            <TouchableOpacity
              style={styles.dropdownItem}
              activeOpacity={0.7}
              onPress={() => {
                if (!actionImage) return;
                const img = actionImage;
                setActionImage(null);
                setMenuPosition(null);
                setSelectedPreviewImageId(img.uploadId);
              }}
            >
              <View style={[styles.dropdownIconCircle, { backgroundColor: brandCol + '15' }]}>
                <Maximize2 size={16} color={brandCol} />
              </View>
              <Text style={[styles.dropdownItemText, { color: textColor }]}>View Full Photo</Text>
            </TouchableOpacity>

            {/* Delete Photo Option */}
            <TouchableOpacity
              style={styles.dropdownItem}
              activeOpacity={0.7}
              onPress={() => {
                if (!actionImage) return;
                const img = actionImage;
                setActionImage(null);
                setMenuPosition(null);
                confirmDeleteImage(img);
              }}
            >
              <View style={[styles.dropdownIconCircle, { backgroundColor: '#ef444415' }]}>
                <Trash2 size={16} color="#ef4444" />
              </View>
              <Text style={[styles.dropdownItemText, { color: '#ef4444' }]}>Delete Photo</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  dropdownMenu: {
    width: 230,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  dropdownHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  dropdownTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  dropdownSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  dropdownDivider: {
    height: 1,
    marginVertical: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  dropdownIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
