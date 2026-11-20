import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { X, ChevronLeft, ChevronRight, Trash2, ZoomIn, Download } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { PropertyImageItem } from '../models/PropertyTypes';
import { PropertyService } from '../services/PropertyService';
import { downloadAndShareFile } from '../../Services/downloadService';

interface PropertyImageGalleryProps {
  images: PropertyImageItem[];
  visible: boolean;
  initialIndex?: number;
  onClose: () => void;
  onDelete?: (uploadId: number) => void;
  canDelete?: boolean;
}

export default function PropertyImageGallery({
  images,
  visible,
  initialIndex = 0,
  onClose,
  onDelete,
  canDelete = false,
}: PropertyImageGalleryProps) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);

  if (!images || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];
  const photoUri = PropertyService.getUploadImageUri(currentImage);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleDownload = async () => {
    if (!currentImage || !photoUri) return;
    const fileName = currentImage.fileName || `property_image_${currentImage.uploadId}.jpg`;
    const mimeType = currentImage.contentType || 'image/jpeg';

    await downloadAndShareFile({
      url: photoUri,
      fileName,
      mimeType,
      dialogTitle: 'Save Image',
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {images.length}
          </Text>

          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={handleDownload}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Download size={20} color="#ffffff" />
            </TouchableOpacity>

            {canDelete && currentImage && onDelete && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => onDelete(currentImage.uploadId)}
              >
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
              <X size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main View Area */}
        <View style={styles.mainView}>
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={[styles.fullImage, { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.65 }]}
              resizeMode="contain"
            />
          ) : (
            <Text style={{ color: '#fff', fontSize: 14 }}>Image unavailable</Text>
          )}

          {/* Left / Right Nav Arrows */}
          {images.length > 1 && (
            <>
              <TouchableOpacity style={[styles.arrowBtn, styles.leftArrow]} onPress={handlePrev}>
                <ChevronLeft size={28} color="#ffffff" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.arrowBtn, styles.rightArrow]} onPress={handleNext}>
                <ChevronRight size={28} color="#ffffff" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Caption & Thumbnails */}
        <View style={styles.bottomBar}>
          <Text style={styles.fileNameText} numberOfLines={1}>
            {currentImage?.fileName || `Photo #${currentImage?.uploadId}`}
          </Text>

          {images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbScroll}>
              {images.map((img, idx) => {
                const thumbUri = PropertyService.getUploadImageUri(img);
                const isSelected = idx === currentIndex;
                return (
                  <TouchableOpacity
                    key={img.uploadId}
                    onPress={() => setCurrentIndex(idx)}
                    style={[
                      styles.thumbWrap,
                      isSelected && { borderColor: adminTheme.brand, borderWidth: 2 },
                    ]}
                  >
                    {thumbUri ? (
                      <Image source={{ uri: thumbUri }} style={styles.thumbImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.thumbImage, { backgroundColor: '#333' }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
  },
  counterText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullImage: {
    maxWidth: '100%',
  },
  arrowBtn: {
    position: 'absolute',
    top: '50%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftArrow: {
    left: 12,
  },
  rightArrow: {
    right: 12,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 10,
  },
  fileNameText: {
    color: '#e2e8f0',
    fontSize: 12,
    textAlign: 'center',
  },
  thumbScroll: {
    gap: 8,
    justifyContent: 'center',
  },
  thumbWrap: {
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    borderColor: 'transparent',
    borderWidth: 1,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
});

