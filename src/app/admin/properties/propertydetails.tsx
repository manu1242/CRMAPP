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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
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
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { PropertyService } from '../../../admin/services/PropertyService';
import { FlatItem, PropertyDetails, PropertyImageItem } from '../../../admin/models/PropertyTypes';
import { TokenStorage } from '../../../auth/storage/TokenStorage';

const DOCUMENT_TYPES = ['Title Deed', 'NOC', 'Building Plan', 'RERA Certificate', 'Other'];

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

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'flats' | 'photos' | 'documents'>('overview');

  // Loading & Refreshing States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data States
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [flats, setFlats] = useState<FlatItem[]>([]);
  const [images, setImages] = useState<PropertyImageItem[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [executives, setExecutives] = useState<any[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Flat Form Modal State
  const [isFlatModalOpen, setFlatModalOpen] = useState(false);
  const [editingFlatId, setEditingFlatId] = useState<number | null>(null);
  const [savingFlat, setSavingFlat] = useState(false);
  const [isFlatStatusFormSelectOpen, setFlatStatusFormSelectOpen] = useState(false);
  const [flatForm, setFlatForm] = useState({
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

  // Flat BHK filter state
  const [searchBhk, setSearchBhk] = useState('');

  // Image Modal state (Full Preview)
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Document Upload Modal state
  const [isDocUploadModalOpen, setDocUploadModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('Title Deed');
  const [isDocTypeDropdownOpen, setDocTypeDropdownOpen] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    const loadToken = async () => {
      const token = await TokenStorage.getAccessToken();
      setAuthToken(token);
    };
    loadToken();
    if (propertyId) {
      fetchInitialData();
    }
  }, [propertyId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPropertyDetails(),
        fetchFlats(),
        fetchImages(),
        fetchDocuments(),
        fetchExecutives(),
      ]);
    } catch (err) {
      console.error('[PropertyDetails] Error loading page data', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchPropertyDetails(),
        fetchFlats(),
        fetchImages(),
        fetchDocuments(),
      ]);
    } catch (err) {
      console.error('[PropertyDetails] Refresh error', err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchPropertyDetails = async () => {
    const res = await PropertyService.getPropertyById(propertyId);
    if (res.success) {
      setProperty(res as PropertyDetails);
    } else {
      Toast.show({ type: 'error', text1: 'Error', text2: res.message || 'Failed to fetch property details' });
    }
  };

  const fetchFlats = async () => {
    const res = await PropertyService.getFlats(propertyId, searchBhk);
    if (res.success) {
      setFlats(res.flats);
    }
  };

  const fetchImages = async () => {
    const res = await PropertyService.getImages(propertyId);
    if (res.success) {
      setImages(res.uploads);
    }
  };

  const fetchDocuments = async () => {
    const res = await PropertyService.getDocuments(propertyId);
    if (res.success) {
      setDocuments(res.documents);
    }
  };

  const fetchExecutives = async () => {
    const res = await PropertyService.getExecutives();
    if (res.success) {
      setExecutives(res.executives);
    }
  };

  // --- FLAT INVENTORY OPERATIONS ---

  const handleOpenAddFlat = () => {
    setEditingFlatId(null);
    setFlatForm({
      blockName: '',
      floorName: '',
      flatName: '',
      bhk: '2 BHK',
      propertyType: 'Apartment',
      propertyGroup: 'Residential',
      areaSqft: '',
      location: property?.location || '',
      bedroomCount: '2',
      bathroomCount: '2',
      parkingAvailable: 'true',
      flatStatus: 'Available',
      price: '',
    });
    setFlatModalOpen(true);
  };

  const handleOpenEditFlat = (flat: FlatItem) => {
    setEditingFlatId(flat.flatId);
    setFlatForm({
      blockName: flat.blockName,
      floorName: flat.floorName,
      flatName: flat.flatName,
      bhk: flat.bhk,
      propertyType: flat.propertyType,
      propertyGroup: flat.propertyGroup,
      areaSqft: flat.areaSqft ? flat.areaSqft.toString() : '',
      location: flat.location,
      bedroomCount: flat.bedroomCount ? flat.bedroomCount.toString() : '2',
      bathroomCount: flat.bathroomCount ? flat.bathroomCount.toString() : '2',
      parkingAvailable: flat.parkingAvailable ? 'true' : 'false',
      flatStatus: flat.flatStatus,
      price: flat.price ? flat.price.toString() : '',
    });
    setFlatModalOpen(true);
  };

  const handleSaveFlat = async () => {
    if (!flatForm.flatName) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Flat Name is required' });
      return;
    }

    setSavingFlat(true);
    const formData = new FormData();
    formData.append('flatId', editingFlatId ? editingFlatId.toString() : '0');
    formData.append('propertyId', propertyId);
    formData.append('flatName', flatForm.flatName);
    formData.append('blockName', flatForm.blockName);
    formData.append('floorName', flatForm.floorName);
    formData.append('bhk', flatForm.bhk);
    formData.append('propertyType', flatForm.propertyType);
    formData.append('propertyGroup', flatForm.propertyGroup);
    formData.append('areaSqft', flatForm.areaSqft);
    formData.append('location', flatForm.location);
    formData.append('bedroomCount', flatForm.bedroomCount);
    formData.append('bathroomCount', flatForm.bathroomCount);
    formData.append('parkingAvailable', flatForm.parkingAvailable);
    formData.append('flatStatus', flatForm.flatStatus);
    formData.append('price', flatForm.price);

    try {
      const res = await PropertyService.saveFlat(formData);
      if (res.success) {
        Toast.show({ type: 'success', text1: 'Success', text2: res.message });
        setFlatModalOpen(false);
        fetchFlats();
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: res.message });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Server Error', text2: err.message || 'Something went wrong' });
    } finally {
      setSavingFlat(false);
    }
  };

  const handleDeleteFlat = async (flatId: number) => {
    try {
      const res = await PropertyService.deleteFlat(flatId);
      if (res.success) {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Flat deleted successfully' });
        fetchFlats();
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: res.message });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to delete flat' });
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
        fetchImages();
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
        fetchImages();
      } else {
        Toast.show({ type: 'error', text1: 'Delete Failed', text2: res.message });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to delete photo' });
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
            fetchDocuments();
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
          fetchDocuments();
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
        fetchDocuments();
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

  const imageBaseUrl = getApiUrl();

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Top Navbar */}
      <View style={[styles.navbar, { backgroundColor: cardBg, borderBottomColor: borderCol }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: inputBg }]} onPress={() => router.back()}>
          <ArrowLeft size={20} color={textColor} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.navbarTitle, { color: textColor }]} numberOfLines={1}>
            {property?.propertyName || 'Estate Profile'}
          </Text>
          <Text style={{ fontSize: 12, color: subTextColor }}>{property?.builderName}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: brandCol }]}>
          <Text style={styles.badgeText}>{property?.purchaseType}</Text>
        </View>
      </View>

      {/* Tabs Selector */}
      <View style={[styles.tabsContainer, { backgroundColor: cardBg, borderBottomColor: borderCol }]}>
        {(['overview', 'flats', 'photos', 'documents'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && { borderBottomColor: brandCol }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? brandCol : subTextColor },
                activeTab === tab && { fontWeight: '700' },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ padding: 20 }}>
          {/* --- OVERVIEW TAB --- */}
          {activeTab === 'overview' && property && (
            <View style={styles.overviewContainer}>
              {/* Image Banner */}
              <View style={[styles.imageBanner, { backgroundColor: inputBg, borderColor: borderCol }]}>
                {property.propertyImage && property.propertyImage.length > 0 ? (
                  <Image
                    source={{
                      uri: `${imageBaseUrl}/Properties/GetPropertyImage?propertyId=${property.propertyId}`,
                      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined
                    }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.bannerPlaceholder}>
                    <Building size={48} color={subTextColor} />
                    <Text style={{ color: subTextColor, fontSize: 12, marginTop: 8 }}>No Cover Photo Uploaded</Text>
                  </View>
                )}
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
          {activeTab === 'flats' && (
            <View style={styles.flatsContainer}>
              <View style={styles.sectionHeader}>
                <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: borderCol, flex: 1, height: 38, marginBottom: 0 }]}>
                  <TextInput
                    style={[styles.searchInput, { color: textColor, fontSize: 12 }]}
                    placeholder="Filter by BHK (e.g. 3 BHK)"
                    placeholderTextColor={subTextColor}
                    value={searchBhk}
                    onChangeText={(text) => {
                      setSearchBhk(text);
                      fetchFlats();
                    }}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: brandCol, height: 38 }]}
                  onPress={handleOpenAddFlat}
                >
                  <Plus size={14} color="#fff" />
                  <Text style={[styles.addButtonText, { fontSize: 12 }]}>Add Flat</Text>
                </TouchableOpacity>
              </View>

              {flats.length > 0 ? (
                flats.map((flat) => (
                  <View key={flat.flatId} style={[styles.flatCard, { backgroundColor: cardBg, borderColor: borderCol, marginBottom: 12 }]}>
                    <View style={styles.flatCardHeader}>
                      <Text style={[styles.flatName, { color: textColor }]}>
                        {flat.blockName} - {flat.flatName} ({flat.floorName})
                      </Text>
                      <View
                        style={[
                          styles.flatStatusBadge,
                          {
                            backgroundColor:
                              flat.flatStatus === 'Available'
                                ? '#22c55e15'
                                : flat.flatStatus === 'Sold'
                                ? '#ef444415'
                                : '#f59e0b15',
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '700',
                            color:
                              flat.flatStatus === 'Available'
                                ? '#22c55e'
                                : flat.flatStatus === 'Sold'
                                ? '#ef4444'
                                : '#f59e0b',
                          }}
                        >
                          {flat.flatStatus}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.flatSpecs}>
                      <Text style={{ color: subTextColor, fontSize: 12 }}>
                        {flat.bhk} • {flat.propertyType} • {flat.areaSqft} Sqft
                      </Text>
                      <Text style={{ color: brandCol, fontSize: 12, fontWeight: '700', marginTop: 4 }}>
                        {flat.price ? `₹${flat.price.toLocaleString('en-IN')}` : 'Price on Request'}
                      </Text>
                    </View>

                    <View style={[styles.cardSeparator, { backgroundColor: borderCol }]} />

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                      <TouchableOpacity
                        style={[styles.cardActionBtn, { backgroundColor: inputBg, height: 26 }]}
                        onPress={() => handleOpenEditFlat(flat)}
                      >
                        <Text style={{ color: textColor, fontSize: 11 }}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.cardActionBtn, { backgroundColor: '#ef444412', height: 26 }]}
                        onPress={() => handleDeleteFlat(flat.flatId)}
                      >
                        <Text style={{ color: '#ef4444', fontSize: 11 }}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Building size={36} color={subTextColor} />
                  <Text style={{ color: subTextColor, marginTop: 8, fontSize: 12 }}>No flats matched BHK parameter.</Text>
                </View>
              )}
            </View>
          )}

          {/* --- PHOTOS TAB --- */}
          {activeTab === 'photos' && (
            <View style={styles.photosContainer}>
              <TouchableOpacity
                style={[styles.uploadBox, { borderColor: borderCol, backgroundColor: cardBg }]}
                onPress={handlePickAndUploadImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={brandCol} />
                ) : (
                  <>
                    <Upload size={20} color={brandCol} />
                    <Text style={{ color: brandCol, fontWeight: '700', fontSize: 12, marginTop: 6 }}>Upload Photo</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.imageGrid}>
                {images.length > 0 ? (
                  images.map((img) => (
                    <View key={img.uploadId} style={[styles.photoCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                      <TouchableOpacity
                        onPress={() => setSelectedPreviewImage(`${imageBaseUrl}/Properties/DownloadImage?uploadId=${img.uploadId}`)}
                      >
                        <Image
                          source={{
                            uri: `${imageBaseUrl}/Properties/DownloadImage?uploadId=${img.uploadId}`,
                            headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined
                          }}
                          style={styles.gridImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
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
                  ))
                ) : (
                  <View style={{ flex: 1, width: '100%', alignItems: 'center', paddingVertical: 40 }}>
                    <ImageIcon size={36} color={subTextColor} />
                    <Text style={{ color: subTextColor, marginTop: 8, fontSize: 12 }}>No gallery photos uploaded.</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* --- DOCUMENTS TAB --- */}
          {activeTab === 'documents' && (
            <View style={styles.documentsContainer}>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: brandCol, alignSelf: 'flex-start', marginBottom: 16 }]}
                onPress={() => setDocUploadModalOpen(true)}
              >
                <Upload size={16} color="#fff" />
                <Text style={styles.addButtonText}>Upload Document</Text>
              </TouchableOpacity>

              {documents.length > 0 ? (
                documents.map((doc) => (
                  <View key={doc.documentId} style={[styles.docCard, { backgroundColor: cardBg, borderColor: borderCol, marginBottom: 10 }]}>
                    <View style={styles.docIconWrapper}>
                      <FileText size={24} color={brandCol} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.docType, { color: textColor }]}>{doc.documentType}</Text>
                      <Text style={[styles.docName, { color: subTextColor }]} numberOfLines={1}>
                        {doc.fileName}
                      </Text>
                      <Text style={{ fontSize: 10, color: subTextColor, marginTop: 2 }}>
                        Uploaded: {doc.uploadedOn ? doc.uploadedOn.split('T')[0] : ''} • By {doc.uploadedBy || 'admin'}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                      <TouchableOpacity
                        style={[styles.circleBtn, { backgroundColor: inputBg }]}
                        onPress={() => handleDownloadDocument(doc)}
                      >
                        <Download size={14} color={textColor} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.circleBtn, { backgroundColor: '#ef444412' }]}
                        onPress={() => handleDeleteDocument(doc.documentId)}
                      >
                        <Trash2 size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <FileText size={36} color={subTextColor} />
                  <Text style={{ color: subTextColor, marginTop: 8, fontSize: 12 }}>No title or RERA documents uploaded.</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* --- ADD / EDIT FLAT FORM MODAL --- */}
      <Modal visible={isFlatModalOpen} animationType="slide" transparent>
        <View style={styles.modalScrollOverlay}>
          <View style={[styles.formContainer, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={[styles.formHeader, { borderBottomColor: borderCol }]}>
              <Text style={[styles.formTitle, { color: textColor }]}>
                {editingFlatId ? 'Edit Flat Details' : 'Add New Flat'}
              </Text>
              <TouchableOpacity onPress={() => setFlatModalOpen(false)}>
                <X size={20} color={textColor} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text style={[styles.label, { color: textColor }]}>Block Name</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                value={flatForm.blockName}
                onChangeText={(text) => setFlatForm({ ...flatForm, blockName: text })}
                placeholder="e.g. Block A"
                placeholderTextColor={subTextColor}
              />

              <Text style={[styles.label, { color: textColor }]}>Floor Name</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                value={flatForm.floorName}
                onChangeText={(text) => setFlatForm({ ...flatForm, floorName: text })}
                placeholder="e.g. 4th Floor"
                placeholderTextColor={subTextColor}
              />

              <Text style={[styles.label, { color: textColor }]}>Flat/Door Name *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                value={flatForm.flatName}
                onChangeText={(text) => setFlatForm({ ...flatForm, flatName: text })}
                placeholder="e.g. A-402"
                placeholderTextColor={subTextColor}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: textColor }]}>BHK</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                    value={flatForm.bhk}
                    onChangeText={(text) => setFlatForm({ ...flatForm, bhk: text })}
                    placeholder="e.g. 3 BHK"
                    placeholderTextColor={subTextColor}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: textColor }]}>Area (Sqft)</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                    value={flatForm.areaSqft}
                    onChangeText={(text) => setFlatForm({ ...flatForm, areaSqft: text })}
                    placeholder="e.g. 1450"
                    placeholderTextColor={subTextColor}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={[styles.label, { color: textColor }]}>Flat Status</Text>
              <TouchableOpacity
                style={[styles.pickerWrapper, { backgroundColor: inputBg, borderColor: borderCol, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }]}
                onPress={() => setFlatStatusFormSelectOpen(true)}
              >
                <Text style={{ color: textColor, fontSize: 13 }}>{flatForm.flatStatus}</Text>
                <ChevronDown size={14} color={subTextColor} />
              </TouchableOpacity>

              <Text style={[styles.label, { color: textColor }]}>Price (₹)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                value={flatForm.price}
                onChangeText={(text) => setFlatForm({ ...flatForm, price: text })}
                placeholder="e.g. 9500000"
                placeholderTextColor={subTextColor}
                keyboardType="numeric"
              />
            </ScrollView>

            <View style={[styles.formFooter, { borderTopColor: borderCol }]}>
              <TouchableOpacity
                style={[styles.formActionBtn, { backgroundColor: inputBg }]}
                onPress={() => setFlatModalOpen(false)}
                disabled={savingFlat}
              >
                <Text style={{ color: textColor }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formActionBtn, { backgroundColor: brandCol }]}
                onPress={handleSaveFlat}
                disabled={savingFlat}
              >
                {savingFlat ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Save flat</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Flat Status Select Form Dropdown Modal */}
      <Modal visible={isFlatStatusFormSelectOpen} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setFlatStatusFormSelectOpen(false)} style={styles.modalOverlay}>
          <View style={[styles.dropdownMenu, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Text style={[styles.dropdownTitle, { color: subTextColor }]}>Select Flat Status</Text>
            {['Available', 'Sold', 'Blocked'].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => {
                  setFlatForm({ ...flatForm, flatStatus: status });
                  setFlatStatusFormSelectOpen(false);
                }}
                style={[
                  styles.dropdownOption,
                  { backgroundColor: flatForm.flatStatus === status ? borderCol : 'transparent' },
                ]}
              >
                <Text style={{ color: textColor }}>{status}</Text>
                {flatForm.flatStatus === status && <Check size={14} color={brandCol} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- PHOTO GALLERY PREVIEW MODAL --- */}
      <Modal visible={selectedPreviewImage !== null} transparent animationType="fade">
        <View style={styles.imagePreviewModalOverlay}>
          <TouchableOpacity style={styles.closePreviewBtn} onPress={() => setSelectedPreviewImage(null)}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
          {selectedPreviewImage && (
            <Image
              source={{
                uri: selectedPreviewImage,
                headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined
              }}
              style={styles.fullPreviewImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

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
  navbar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navbarTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 44,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 13,
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
  flatCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  flatCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flatName: {
    fontSize: 13,
    fontWeight: '700',
  },
  flatStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  flatSpecs: {
    marginTop: 6,
  },
  cardSeparator: {
    height: 1,
    marginVertical: 10,
  },
  cardActionBtn: {
    borderRadius: 6,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  photosContainer: {
    gap: 16,
  },
  uploadBox: {
    height: 100,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCard: {
    width: Platform.OS === 'web' ? '23%' : '47%',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    height: 100,
    width: '100%',
  },
  photoInfo: {
    padding: 8,
  },
  photoName: {
    fontSize: 11,
    fontWeight: '600',
  },
  deletePhotoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#fff',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
