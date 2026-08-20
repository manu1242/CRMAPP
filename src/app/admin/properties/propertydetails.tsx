import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/api/remoteConfig';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
  Image,
  RefreshControl,
  Linking,
  Animated,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Building,
  MapPin,
  Maximize2,
  DollarSign,
  User,
  Calendar,
  Layers,
  FileText,
  Image as ImageIcon,
  Plus,
  Trash2,
  Download,
  Upload,
  X,
  ChevronDown,
  Check,
  Tag,
  Clock,
  BedDouble,
  Bath,
  Car,
  Edit2,
  Search,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { PropertyService } from '../../../admin/services/PropertyService';
import { FlatItem, PropertyDetails, PropertyImageItem } from '../../../admin/models/PropertyTypes';
import { TokenStorage } from '../../../auth/storage/TokenStorage';
import { AuthImage } from '../../../components/AuthImage';
import FlatsTab from './components/FlatsTab';
import PhotosTab from './components/PhotosTab';
import DocumentsTab from './components/DocumentsTab';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DOCUMENT_TYPES = ['Title Deed', 'NOC', 'Building Plan', 'RERA Certificate', 'Other'];

// Stable constant outside component — no recreation on every render
const TAB_INDICES: Record<string, number> = { overview: 0, flats: 1, photos: 2, documents: 3 };

export default function PropertyDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const propertyId = id ? (Array.isArray(id) ? id[0] : id) : '';

  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg;
  const brandCol = adminTheme.brand;

  // Active Tab — single source of truth, no displayTab needed
  const [activeTab, setActiveTab] = useState<'overview' | 'flats' | 'photos' | 'documents'>('overview');

  // Tracks which tab content is currently visible (only changes AFTER fade-out finishes)
  const displayTabRef = React.useRef<'overview' | 'flats' | 'photos' | 'documents'>('overview');
  const [displayTab, setDisplayTab] = useState<'overview' | 'flats' | 'photos' | 'documents'>('overview');

  // Tab refs for transitions (stable — never recreated)
  const prevIndexRef = React.useRef(0);
  const tabProgress = React.useRef(new Animated.Value(0)).current;
  const tabOpacity = React.useRef(new Animated.Value(1)).current;
  const tabTranslateX = React.useRef(new Animated.Value(0)).current;
  const transitionInProgress = React.useRef(false);

  // Tab container layout measurements for sliding pill animation
  const screenWidth = Dimensions.get('window').width;
  const [containerWidth, setContainerWidth] = useState(screenWidth - 40);
  const tabWidth = (containerWidth - 8) / 4;

  const indicatorTranslateX = tabProgress.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, tabWidth, tabWidth * 2, tabWidth * 3],
  });
  const queryClient = useQueryClient();

  // Loading & Refreshing States
  const [refreshing, setRefreshing] = useState(false);

  // Flat BHK filter state
  const [searchBhk, setSearchBhk] = useState('');

  // Image Modal state (Full Preview)
  const [selectedPreviewImageId, setSelectedPreviewImageId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Document Upload Modal state
  const [isDocUploadModalOpen, setDocUploadModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('Title Deed');
  const [isDocTypeDropdownOpen, setDocTypeDropdownOpen] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // TanStack Queries
  const { data: property, isLoading: propertyLoading, refetch: refetchProperty } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      const res = await PropertyService.getPropertyById(propertyId);
      if (!res.success) throw new Error(res.message || 'Failed to fetch property details');
      return res as PropertyDetails;
    },
    enabled: !!propertyId,
  });

  const { data: flats = [], isLoading: flatsLoading, refetch: refetchFlats } = useQuery({
    queryKey: ['flats', propertyId, searchBhk],
    queryFn: async () => {
      const res = await PropertyService.getFlats(propertyId, searchBhk);
      if (!res.success) throw new Error('Failed to fetch flats');
      return res.flats || [];
    },
    enabled: !!propertyId && activeTab === 'flats',
  });

  const { data: images = [], isLoading: imagesLoading, refetch: refetchImages } = useQuery({
    queryKey: ['property_images', propertyId],
    queryFn: async () => {
      const res = await PropertyService.getImages(propertyId);
      if (!res.success) throw new Error('Failed to fetch images');
      return res.uploads || [];
    },
    enabled: !!propertyId && activeTab === 'photos',
  });

  const { data: documents = [], isLoading: documentsLoading, refetch: refetchDocuments } = useQuery({
    queryKey: ['property_documents', propertyId],
    queryFn: async () => {
      const res = await PropertyService.getDocuments(propertyId);
      if (!res.success) throw new Error('Failed to fetch documents');
      return res.documents || [];
    },
    enabled: !!propertyId && activeTab === 'documents',
  });

  const { data: executives = [], isLoading: executivesLoading } = useQuery({
    queryKey: ['executives'],
    queryFn: async () => {
      const res = await PropertyService.getExecutives();
      if (!res.success) throw new Error('Failed to fetch executives');
      return res.executives || [];
    },
  });

  const loading = propertyLoading || executivesLoading;

  // Tab transition animation logic — no intermediate state causes flicker
  useEffect(() => {
    const currentIndex = TAB_INDICES[activeTab];
    const prevIndex = prevIndexRef.current;

    // Always animate the sliding pill indicator
    Animated.spring(tabProgress, {
      toValue: currentIndex,
      useNativeDriver: true,
      tension: 40,
      friction: 7.5,
    }).start();

    if (currentIndex === prevIndex) return;
    if (transitionInProgress.current) return;

    transitionInProgress.current = true;
    const direction = currentIndex > prevIndex ? 1 : -1;

    // Step 1: Fade + slide OUT current content
    Animated.parallel([
      Animated.timing(tabOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(tabTranslateX, {
        toValue: -15 * direction,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Step 2: Synchronously update which content is visible while opacity is 0
      // This prevents any visible flash — the swap happens while invisible
      displayTabRef.current = activeTab;
      setDisplayTab(activeTab);

      // Reposition for incoming slide direction, still invisible
      tabTranslateX.setValue(15 * direction);

      // Step 3: Use requestAnimationFrame to defer fade-in until after the
      // React render triggered by setDisplayTab has been painted
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(tabOpacity, {
            toValue: 1,
            duration: 130,
            useNativeDriver: true,
          }),
          Animated.timing(tabTranslateX, {
            toValue: 0,
            duration: 130,
            useNativeDriver: true,
          }),
        ]).start(() => {
          prevIndexRef.current = currentIndex;
          transitionInProgress.current = false;
        });
      });
    });
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Clear cover image local cache to force reload on pull-to-refresh
      await AsyncStorage.removeItem(`auth_image_cover_${propertyId}`);
      queryClient.invalidateQueries({ queryKey: ['auth_image', `cover_${propertyId}`] });

      await Promise.all([
        refetchProperty(),
        refetchDocuments(),
        refetchFlats(),
        refetchImages(),
      ]);
    } catch (err) {
      console.error('[PropertyDetails] Refresh error', err);
    } finally {
      setRefreshing(false);
    }
  };

  // --- PHOTO GALLERY OPERATIONS ---

  const handlePickAndUploadImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Camera roll permission is required to upload images' });
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (pickerResult.canceled) return;

    setUploadingImage(true);
    const imageUri = pickerResult.assets[0].uri;
    const filename = imageUri.split('/').pop() || 'upload.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    const formData = new FormData();
    formData.append('propertyId', propertyId);
    formData.append('file', { uri: imageUri, name: filename, type } as any);

    try {
      const res = await PropertyService.uploadImage(formData);
      if (res.success) {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Image uploaded successfully!' });
        queryClient.invalidateQueries({ queryKey: ['property_images', propertyId] });
      } else {
        Toast.show({ type: 'error', text1: 'Upload Failed', text2: res.message });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to upload photo' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (uploadId: number) => {
    try {
      const res = await PropertyService.deleteImage(uploadId);
      if (res.success) {
        Toast.show({ type: 'success', text1: 'Deleted', text2: 'Photo deleted successfully!' });
        // Clear local cache for this specific image upload
        await AsyncStorage.removeItem(`auth_image_upload_${uploadId}`);
        queryClient.invalidateQueries({ queryKey: ['auth_image', `upload_${uploadId}`] });
        queryClient.invalidateQueries({ queryKey: ['property_images', propertyId] });
      } else {
        Toast.show({ type: 'error', text1: 'Delete Failed', text2: res.message });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to delete photo' });
    }
  };

  // --- FLAT INVENTORY OPERATIONS ---

  const handleDeleteFlat = async (flatId: number) => {
    try {
      const res = await PropertyService.deleteFlat(flatId);
      if (res.success) {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Flat deleted successfully' });
        queryClient.invalidateQueries({ queryKey: ['flats', propertyId] });
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: res.message });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to delete flat' });
    }
  };

  // --- DOCUMENT OPERATIONS ---

  const handlePickAndUploadDocument = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingDoc(true);
        const formData = new FormData();
        formData.append('propertyId', propertyId);
        formData.append('documentType', selectedDocType);
        formData.append('file', file);

        try {
          const res = await PropertyService.uploadDocument(formData);
          if (res.success) {
            Toast.show({ type: 'success', text1: 'Uploaded', text2: 'Document uploaded successfully!' });
            setDocUploadModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['property_documents', propertyId] });
          } else {
            Toast.show({ type: 'error', text1: 'Upload Failed', text2: res.message });
          }
        } catch (err: any) {
          Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to upload document' });
        } finally {
          setUploadingDoc(false);
        }
      };
      input.click();
    } else {
      // In native React Native, we use expo-image-picker as a document library fallback
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
      });

      if (pickerResult.canceled) return;

      setUploadingDoc(true);
      const uri = pickerResult.assets[0].uri;
      const filename = uri.split('/').pop() || 'document.pdf';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `application/${match[1]}` : `application/pdf`;

      const formData = new FormData();
      formData.append('propertyId', propertyId);
      formData.append('documentType', selectedDocType);
      formData.append('file', { uri, name: filename, type } as any);

      try {
        const res = await PropertyService.uploadDocument(formData);
        if (res.success) {
          Toast.show({ type: 'success', text1: 'Uploaded', text2: 'Document uploaded successfully!' });
          setDocUploadModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['property_documents', propertyId] });
        } else {
          Toast.show({ type: 'error', text1: 'Upload Failed', text2: res.message });
        }
      } catch (err: any) {
        Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to upload document' });
      } finally {
        setUploadingDoc(false);
      }
    }
  };

  const handleDownloadDocument = (doc: any) => {
    const apiBaseUrl = getApiUrl();
    const downloadUrl = `${apiBaseUrl}/Properties/DownloadDocument?documentId=${doc.documentId}`;
    Linking.openURL(downloadUrl).catch(() => {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Unable to download file' });
    });
  };

  const handleDeleteDocument = async (documentId: number) => {
    try {
      const res = await PropertyService.deleteDocument(documentId);
      if (res.success) {
        Toast.show({ type: 'success', text1: 'Deleted', text2: 'Document deleted successfully!' });
        queryClient.invalidateQueries({ queryKey: ['property_documents', propertyId] });
      } else {
        Toast.show({ type: 'error', text1: 'Delete Failed', text2: res.message });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to delete document' });
    }
  };

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={brandCol} />
        <Text style={{ color: subTextColor, marginTop: 12 }}>Loading estate details...</Text>
      </View>
    );
  }

  const executiveName = executives.find((e) => e.userId === property?.assignedTo)?.fullName || 'Unassigned';

  const imageBaseUrl = getApiUrl().replace(/\/+$/, '');

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Tabs Selector (Pill design with sliding background) */}
      <View
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        style={[styles.tabsContainer, { backgroundColor: inputBg, borderColor: borderCol, position: 'relative' }]}
      >
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              backgroundColor: brandCol,
              width: tabWidth,
              transform: [{ translateX: indicatorTranslateX }],
            },
          ]}
        />
        {(['overview', 'flats', 'photos', 'documents'] as const).map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.tabButton}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isSelected ? '#fff' : subTextColor },
                  isSelected && { fontWeight: '700' },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Animated.View
          style={{
            padding: 20,
            opacity: tabOpacity,
            transform: [{ translateX: tabTranslateX }],
          }}
        >
          {/* --- OVERVIEW TAB --- */}
          {displayTab === 'overview' && property && (
            <View style={styles.overviewContainer}>
              {/* Image Banner with Title and Purchase Type Badge */}
              <View style={[styles.imageBanner, { backgroundColor: inputBg, borderColor: borderCol, position: 'relative' }]}>
                {property.propertyImage && property.propertyImage.length > 0 ? (
                  <AuthImage
                    cacheKey={`cover_${property.propertyId}`}
                    fetchFn={() => PropertyService.getPropertyImageBase64(property.propertyId)}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                    spinnerColor={brandCol}
                    placeholder={
                      <View style={styles.bannerPlaceholder}>
                        <Building size={48} color={subTextColor} />
                        <Text style={{ color: subTextColor, fontSize: 12, marginTop: 8 }}>No Cover Photo Uploaded</Text>
                      </View>
                    }
                  />
                ) : (
                  <View style={styles.bannerPlaceholder}>
                    <Building size={48} color={subTextColor} />
                    <Text style={{ color: subTextColor, fontSize: 12, marginTop: 8 }}>No Cover Photo Uploaded</Text>
                  </View>
                )}

                {/* Text Overlay for Name & Builder */}
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }} numberOfLines={1}>
                    {property?.propertyName || 'Estate Profile'}
                  </Text>
                  {property?.builderName ? (
                    <Text style={{ color: '#eee', fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                      by {property.builderName}
                    </Text>
                  ) : null}
                </View>

                {/* Type badge overlay */}
                <View style={[styles.badge, { position: 'absolute', top: 12, right: 12, backgroundColor: brandCol }]}>
                  <Text style={[styles.badgeText, { color: '#fff' }]}>{property?.purchaseType}</Text>
                </View>
              </View>

              {/* General Info Card */}
              <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <Text style={[styles.cardTitle, { color: textColor, marginBottom: 8 }]}>General Information</Text>

                <View style={styles.detailRow}>
                  <View style={styles.iconContainer}>
                    <Building size={16} color={brandCol} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: subTextColor, fontSize: 11 }}>Estate Name</Text>
                    <Text style={[styles.detailValue, { color: textColor }]}>{property.propertyName}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.iconContainer}>
                    <Building size={16} color={brandCol} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: subTextColor, fontSize: 11 }}>Developer / Builder</Text>
                    <Text style={[styles.detailValue, { color: textColor }]}>{property.builderName}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.iconContainer}>
                    <MapPin size={16} color={brandCol} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: subTextColor, fontSize: 11 }}>Location Details</Text>
                    <Text style={[styles.detailValue, { color: textColor }]}>{property.location}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={[styles.detailRow, { flex: 1 }]}>
                    <View style={styles.iconContainer}>
                      <Maximize2 size={16} color={brandCol} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: subTextColor, fontSize: 11 }}>Area</Text>
                      <Text style={[styles.detailValue, { color: textColor }]}>
                        {property.areaSqft ? `${property.areaSqft} ${property.unit || 'Sqft'}` : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.detailRow, { flex: 1 }]}>
                    <View style={styles.iconContainer}>
                      <DollarSign size={16} color={brandCol} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: subTextColor, fontSize: 11 }}>Pricing</Text>
                      <Text style={[styles.detailValue, { color: brandCol, fontWeight: '700' }]}>
                        {property.price ? `₹${property.price.toLocaleString('en-IN')}` : 'Price on Request'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.iconContainer}>
                    <User size={16} color={brandCol} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: subTextColor, fontSize: 11 }}>Assigned Sales Executive</Text>
                    <Text style={[styles.detailValue, { color: textColor }]}>{executiveName}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={[styles.detailRow, { flex: 1 }]}>
                    <View style={styles.iconContainer}>
                      <Clock size={16} color={brandCol} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: subTextColor, fontSize: 11 }}>Classification</Text>
                      <Text style={[styles.detailValue, { color: textColor }]}>{property.propertyGroup || 'Residential'}</Text>
                    </View>
                  </View>

                  <View style={[styles.detailRow, { flex: 1 }]}>
                    <View style={styles.iconContainer}>
                      <Layers size={16} color={brandCol} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: subTextColor, fontSize: 11 }}>Status</Text>
                      <Text style={[styles.detailValue, { color: textColor }]}>{property.inventory || 'Available'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* --- FLATS TAB --- */}
          {displayTab === 'flats' && (
            <FlatsTab
              flats={flats}
              searchBhk={searchBhk}
              setSearchBhk={setSearchBhk}
              propertyId={propertyId}
              propertyName={property?.propertyName || ''}
              onDeleteFlat={handleDeleteFlat}
            />
          )}

          {/* --- PHOTOS TAB --- */}
          {displayTab === 'photos' && (
            <PhotosTab
              images={images}
              uploadingImage={uploadingImage}
              handlePickAndUploadImage={handlePickAndUploadImage}
              handleDeleteImage={handleDeleteImage}
              setSelectedPreviewImageId={setSelectedPreviewImageId}
            />
          )}

          {/* --- DOCUMENTS TAB --- */}
          {displayTab === 'documents' && (
            <DocumentsTab
              documents={documents}
              setDocUploadModalOpen={setDocUploadModalOpen}
              handleDownloadDocument={handleDownloadDocument}
              handleDeleteDocument={handleDeleteDocument}
            />
          )}
        </Animated.View>
      </ScrollView>



      {/* --- DOCUMENT UPLOAD OPTIONS MODAL --- */}
      <Modal visible={isDocUploadModalOpen} transparent animationType="slide">
        <View style={styles.modalScrollOverlay}>
          <View style={[styles.formContainer, { backgroundColor: cardBg, borderColor: borderCol, maxHeight: 300 }]}>
            <View style={[styles.formHeader, { borderBottomColor: borderCol }]}>
              <Text style={[styles.formTitle, { color: textColor }]}>Upload Document</Text>
              <TouchableOpacity onPress={() => setDocUploadModalOpen(false)}>
                <X size={20} color={textColor} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={[styles.label, { color: textColor }]}>Document Type</Text>
              <TouchableOpacity
                style={[styles.pickerWrapper, { backgroundColor: inputBg, borderColor: borderCol, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }]}
                onPress={() => setDocTypeDropdownOpen(true)}
              >
                <Text style={{ color: textColor, fontSize: 13 }}>{selectedDocType}</Text>
                <ChevronDown size={14} color={subTextColor} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: brandCol, justifyContent: 'center' }]}
                onPress={handlePickAndUploadDocument}
                disabled={uploadingDoc}
              >
                <Upload size={16} color="#fff" />
                <Text style={styles.addButtonText}>
                  {uploadingDoc ? 'Uploading...' : 'Choose file & Upload'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Document Type Dropdown Modal */}
      <Modal visible={isDocTypeDropdownOpen} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setDocTypeDropdownOpen(false)} style={styles.modalOverlay}>
          <View style={[styles.dropdownMenu, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Text style={[styles.dropdownTitle, { color: subTextColor }]}>Select Document Type</Text>
            {DOCUMENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => {
                  setSelectedDocType(type);
                  setDocTypeDropdownOpen(false);
                }}
                style={[
                  styles.dropdownOption,
                  { backgroundColor: selectedDocType === type ? borderCol : 'transparent' },
                ]}
              >
                <Text style={{ color: textColor }}>{type}</Text>
                {selectedDocType === type && <Check size={14} color={brandCol} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- PHOTO GALLERY PREVIEW MODAL --- */}
      <Modal visible={selectedPreviewImageId !== null} transparent animationType="fade">
        <View style={styles.imagePreviewModalOverlay}>
          <TouchableOpacity style={styles.closePreviewBtn} onPress={() => setSelectedPreviewImageId(null)}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
          {selectedPreviewImageId !== null && (
            <AuthImage
              cacheKey={`upload_${selectedPreviewImageId}`}
              fetchFn={() => PropertyService.getUploadImageBase64(selectedPreviewImageId)}
              style={styles.fullPreviewImage}
              resizeMode="contain"
              spinnerColor="#fff"
            />
          )}
        </View>
      </Modal>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    padding: 4,
    marginHorizontal: 20,
    marginVertical: 14,
    borderWidth: 1,
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  overviewContainer: {
    gap: 16,
  },
  imageBanner: {
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bannerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#4f46e510',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  flatsContainer: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  searchBox: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    height: 44,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  documentsContainer: {
    gap: 12,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  docIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#4f46e510',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docType: {
    fontSize: 13,
    fontWeight: '700',
  },
  docName: {
    fontSize: 11,
    marginTop: 1,
  },
  circleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 450,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 10,
  },
  textInput: {
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 10,
  },
  pickerWrapper: {
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
  },
  formFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  formActionBtn: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    width: 240,
    maxHeight: 300,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
  },
  dropdownTitle: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imagePreviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closePreviewBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  fullPreviewImage: {
    width: '100%',
    height: '80%',
  },
});
