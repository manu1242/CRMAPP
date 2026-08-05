import React, { useEffect, useState } from 'react';
import { getApiUrl } from '@/api/remoteConfig';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Modal,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Check,
  Plus,
  Trash2,
  Edit,
  Upload,
  Download,
  X,
  MapPin,
  Building,
  DollarSign,
  Maximize2,
  Image as ImageIcon,
  User,
  Calendar,
  Layers,
  Home,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import * as XLSX from 'xlsx';

import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { PropertyService } from '../../../admin/services/PropertyService';
import { TokenStorage } from '../../../auth/storage/TokenStorage';
import {
  PropertyItem,
  BuilderItem,
  ExecutiveItem,
  FlatItem,
  PropertyImageItem,
} from '../../../admin/models/PropertyTypes';

const PURCHASE_TYPES = ['All', 'Sale', 'Rent', 'Lease'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'area-asc', label: 'Area: Small to Large' },
  { value: 'area-desc', label: 'Area: Large to Small' },
];

export default function PropertiesScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  // Dynamic Theme Colors
  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg;
  const brandCol = adminTheme.brand;

  // Data State
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [builders, setBuilders] = useState<BuilderItem[]>([]);
  const [executives, setExecutives] = useState<ExecutiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Filter State
  const [search, setSearch] = useState('');
  const [selectedBuilder, setSelectedBuilder] = useState('All');
  const [selectedExecutive, setSelectedExecutive] = useState('All');
  const [selectedPurchaseType, setSelectedPurchaseType] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  // UI State for dropdowns & modals
  const [isBuilderFilterOpen, setBuilderFilterOpen] = useState(false);
  const [isExecFilterOpen, setExecFilterOpen] = useState(false);
  const [isPurchaseTypeFilterOpen, setPurchaseTypeFilterOpen] = useState(false);
  const [isSortOpen, setSortOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Header operations dropdown states
  const [isExportMenuOpen, setExportMenuOpen] = useState(false);
  const [isAddUploadMenuOpen, setAddUploadMenuOpen] = useState(false);

  // Form Select dropdown states (native-compatible)
  const [isPurchaseTypeFormSelectOpen, setPurchaseTypeFormSelectOpen] = useState(false);
  const [isExecFormSelectOpen, setExecFormSelectOpen] = useState(false);
  const [isFlatStatusFormSelectOpen, setFlatStatusFormSelectOpen] = useState(false);

  // Add / Edit Property Modal State
  const [isAddEditModalOpen, setAddEditModalOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | number | null>(null);
  const [propForm, setPropForm] = useState({
    propertyName: '',
    builderName: '',
    location: '',
    areaSqft: '',
    price: '',
    purchaseType: 'Sale',
    assignedTo: '',
  });
  const [selectedImage, setSelectedImage] = useState<any>(null); // For local image picking
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [savingProperty, setSavingProperty] = useState(false);

  // Bulk Upload Modal State
  const [isBulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
  const [uploadingBulk, setUploadingBulk] = useState(false);

  // Flats Modal State
  const [isFlatsModalOpen, setFlatsModalOpen] = useState(false);
  const [selectedPropertyForFlats, setSelectedPropertyForFlats] = useState<PropertyItem | null>(null);
  const [flats, setFlats] = useState<FlatItem[]>([]);
  const [flatsLoading, setFlatsLoading] = useState(false);
  const [searchBhk, setSearchBhk] = useState('');
  const [isAddFlatMode, setIsAddFlatMode] = useState(false);
  const [editingFlatId, setEditingFlatId] = useState<string | number | null>(null);
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
  const [savingFlat, setSavingFlat] = useState(false);

  // Images Modal State
  const [isImagesModalOpen, setImagesModalOpen] = useState(false);
  const [selectedPropertyForImages, setSelectedPropertyForImages] = useState<PropertyItem | null>(null);
  const [images, setImages] = useState<PropertyImageItem[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // API Call: Fetch Main Data
  const fetchData = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setLoading(true);
    setError(null);
    try {
      const [propRes, builderRes, execRes] = await Promise.all([
        PropertyService.getPropertiesList(),
        PropertyService.getBuilders(),
        PropertyService.getExecutives(),
      ]);

      if (propRes.success) {
        setProperties(propRes.properties || []);
      } else {
        setError(propRes.message || 'Failed to fetch properties list');
      }

      if (builderRes.success) {
        setBuilders(builderRes.builders || []);
      }

      if (execRes.success) {
        setExecutives(execRes.executives || []);
      }
    } catch (err: any) {
      console.error('[Properties Error]', err);
      setError(err.message || 'Network error fetching properties data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadToken = async () => {
      const token = await TokenStorage.getAccessToken();
      setAuthToken(token);
    };
    loadToken();
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(false);
    setRefreshing(false);
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedBuilder('All');
    setSelectedExecutive('All');
    setSelectedPurchaseType('All');
    setMinPrice('');
    setMaxPrice('');
    setSortOrder('newest');
  };

  // Client-side local filtering logic
  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      p.propertyName.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.builderName.toLowerCase().includes(search.toLowerCase());

    const matchesBuilder = selectedBuilder === 'All' || p.builderName === selectedBuilder;
    const matchesExecutive = selectedExecutive === 'All' || p.assignedTo?.toString() === selectedExecutive;
    const matchesPurchaseType = selectedPurchaseType === 'All' || p.purchaseType === selectedPurchaseType;

    const price = p.price || 0;
    const matchesMinPrice = minPrice === '' || price >= parseFloat(minPrice);
    const matchesMaxPrice = maxPrice === '' || price <= parseFloat(maxPrice);

    return matchesSearch && matchesBuilder && matchesExecutive && matchesPurchaseType && matchesMinPrice && matchesMaxPrice;
  }).sort((a, b) => {
    if (sortOrder === 'price-asc') return (a.price || 0) - (b.price || 0);
    if (sortOrder === 'price-desc') return (b.price || 0) - (a.price || 0);
    if (sortOrder === 'area-asc') return (a.areaSqft || 0) - (b.areaSqft || 0);
    if (sortOrder === 'area-desc') return (b.areaSqft || 0) - (a.areaSqft || 0);
    // newest first
    const dateA = a.createdOn ? new Date(a.createdOn).getTime() : 0;
    const dateB = b.createdOn ? new Date(b.createdOn).getTime() : 0;
    return dateB - dateA;
  });

  // Client-Side CSV Export
  const exportToCSV = () => {
    if (filteredProperties.length === 0) {
      Toast.show({ type: 'info', text1: 'No data', text2: 'No properties to export.' });
      return;
    }

    let csv = 'Property ID,Property Name,Builder,Location,Area (Sqft),Price,Purchase Type,Assigned To,Created Date\n';
    filteredProperties.forEach((p) => {
      const priceStr = p.price ? p.price.toString() : 'N/A';
      const areaStr = p.areaSqft ? p.areaSqft.toString() : 'N/A';
      const assignedName = p.assignedToName || 'Unassigned';
      const createdDate = p.createdOn ? p.createdOn.split('T')[0] : 'N/A';

      const escapeCSV = (val: string) => {
        if (!val) return '';
        let formatted = val.replace(/"/g, '""');
        if (formatted.includes(',') || formatted.includes('"') || formatted.includes('\n')) {
          formatted = `"${formatted}"`;
        }
        return formatted;
      };

      csv += [
        p.propertyId,
        escapeCSV(p.propertyName),
        escapeCSV(p.builderName),
        escapeCSV(p.location),
        areaStr,
        priceStr,
        p.purchaseType,
        escapeCSV(assignedName),
        createdDate,
      ].join(',') + '\n';
    });

    if (Platform.OS === 'web') {
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
        download: `Properties_Export_${new Date().toISOString().split('T')[0]}.csv`,
      });
      a.click();
      Toast.show({ type: 'success', text1: 'Export Success', text2: 'CSV downloaded' });
    } else {
      alert('CSV Export Generated!\nDownload is supported in web mode.');
    }
  };

  // Client-Side Excel Export
  const exportToExcel = () => {
    if (filteredProperties.length === 0) {
      Toast.show({ type: 'info', text1: 'No data', text2: 'No properties to export.' });
      return;
    }

    const headers = ['Property ID', 'Property Name', 'Builder', 'Location', 'Area (Sqft)', 'Price', 'Purchase Type', 'Assigned To', 'Created Date'];
    const rows = [
      headers,
      ...filteredProperties.map((p) => [
        p.propertyId,
        p.propertyName,
        p.builderName,
        p.location,
        p.areaSqft || 'N/A',
        p.price || 'N/A',
        p.purchaseType,
        p.assignedToName || 'Unassigned',
        p.createdOn ? p.createdOn.split('T')[0] : 'N/A',
      ]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Properties');

    if (Platform.OS === 'web') {
      XLSX.writeFile(wb, `Properties_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      Toast.show({ type: 'success', text1: 'Export Success', text2: 'Excel downloaded' });
    } else {
      alert('Excel Export Generated!\nDownload is supported in web mode.');
    }
  };

  // Trigger Bulk Upload
  const handleBulkUploadClick = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx, .xls .csv';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingBulk(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
          const res = await PropertyService.bulkUploadProperties(formData);
          if (res.success) {
            Toast.show({ type: 'success', text1: 'Upload Completed', text2: res.message || 'Bulk upload finished' });
            fetchData();
          } else {
            Toast.show({ type: 'error', text1: 'Upload Failed', text2: res.message || 'Upload failed' });
          }
        } catch (err: any) {
          Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Network error uploading file' });
        } finally {
          setUploadingBulk(false);
        }
      };
      input.click();
    } else {
      setBulkUploadModalOpen(true);
    }
  };

  // Image Picking
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
        Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Need library access to upload image.' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setSelectedImage({
          uri: asset.uri,
          name: asset.fileName || 'upload.jpg',
          type: asset.mimeType || 'image/jpeg',
        });
        setImagePreviewUrl(asset.uri);
      }
    }
  };

  // Add Property Mode Trigger
  const handleOpenAddModal = () => {
    setEditingPropertyId(null);
    setPropForm({
      propertyName: '',
      builderName: '',
      location: '',
      areaSqft: '',
      price: '',
      purchaseType: 'Sale',
      assignedTo: '',
    });
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setAddEditModalOpen(true);
  };

  // Edit Property Mode Trigger
  const handleOpenEditModal = async (property: PropertyItem) => {
    setEditingPropertyId(property.propertyId);
    setPropForm({
      propertyName: property.propertyName,
      builderName: property.builderName,
      location: property.location,
      areaSqft: property.areaSqft ? property.areaSqft.toString() : '',
      price: property.price ? property.price.toString() : '',
      purchaseType: property.purchaseType || 'Sale',
      assignedTo: property.assignedTo ? property.assignedTo.toString() : '',
    });
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setAddEditModalOpen(true);

    // Call API details endpoint to load binary image data if available
    try {
      const details = await PropertyService.getPropertyById(property.propertyId);
      if (details.success && details.propertyImage) {
        // Convert byte array to base64 for preview
        const byteArray = details.propertyImage;
        let binary = '';
        const len = byteArray.length;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(byteArray[i]);
        }
        const base64 = btoa(binary);
        setImagePreviewUrl(`data:image/png;base64,${base64}`);
      }
    } catch (err) {
      console.error('[Fetch Image Error]', err);
    }
  };

  // Save Property Action
  const handleSaveProperty = async () => {
    if (!propForm.propertyName.trim() || !propForm.builderName.trim() || !propForm.location.trim()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Name, Builder and Location are required.' });
      return;
    }

    setSavingProperty(true);
    const formData = new FormData();
    formData.append('propertyId', editingPropertyId ? editingPropertyId.toString() : '0');
    formData.append('propertyName', propForm.propertyName);
    formData.append('builderName', propForm.builderName);
    formData.append('location', propForm.location);
    formData.append('areaSqft', propForm.areaSqft);
    formData.append('price', propForm.price);
    formData.append('purchaseType', propForm.purchaseType);
    formData.append('assignedTo', propForm.assignedTo);

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
        Toast.show({ type: 'success', text1: 'Success', text2: res.message || 'Property saved successfully!' });
        setAddEditModalOpen(false);
        fetchData();
      } else {
        Toast.show({ type: 'error', text1: 'Error Saving', text2: res.message || 'Failed to save property.' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Network Error', text2: err.message || 'Failed to communicate with server.' });
    } finally {
      setSavingProperty(false);
    }
  };

  // Delete Property Action
  const handleDeleteProperty = (propertyId: number, propertyName: string) => {
    const performDelete = async () => {
      try {
        const res = await PropertyService.deleteProperty(propertyId);
        if (res.success) {
          Toast.show({ type: 'success', text1: 'Deleted', text2: `${propertyName} deleted successfully.` });
          fetchData();
        } else {
          Toast.show({ type: 'error', text1: 'Error', text2: res.message || 'Could not delete.' });
        }
      } catch (err: any) {
        Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Network error.' });
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(`Are you sure you want to delete "${propertyName}"?`)) {
        performDelete();
      }
    } else {
      // Direct deletion for native UI simple trigger or confirm
      performDelete();
    }
  };

  // --- Related Flats sub-view ---
  const handleOpenFlatsModal = async (property: PropertyItem) => {
    setSelectedPropertyForFlats(property);
    setFlatsModalOpen(true);
    setIsAddFlatMode(false);
    setEditingFlatId(null);
    setSearchBhk('');
    fetchFlatsList(property.propertyId);
  };

  const fetchFlatsList = async (propertyId: number, bhkFilter = '') => {
    setFlatsLoading(true);
    try {
      const res = await PropertyService.getFlats(propertyId, bhkFilter);
      if (res.success) {
        setFlats(res.flats || []);
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load flats.' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Network Error', text2: err.message });
    } finally {
      setFlatsLoading(false);
    }
  };

  const handleOpenAddFlatForm = () => {
    setIsAddFlatMode(true);
    setEditingFlatId(null);
    setFlatForm({
      blockName: '',
      floorName: '',
      flatName: '',
      bhk: '2 BHK',
      propertyType: 'Apartment',
      propertyGroup: 'Residential',
      areaSqft: '',
      location: selectedPropertyForFlats?.location || '',
      bedroomCount: '2',
      bathroomCount: '2',
      parkingAvailable: 'true',
      flatStatus: 'Available',
      price: '',
    });
  };

  const handleOpenEditFlatForm = (flat: FlatItem) => {
    setIsAddFlatMode(true);
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
      bedroomCount: flat.bedroomCount ? flat.bedroomCount.toString() : '1',
      bathroomCount: flat.bathroomCount ? flat.bathroomCount.toString() : '1',
      parkingAvailable: flat.parkingAvailable ? 'true' : 'false',
      flatStatus: flat.flatStatus,
      price: flat.price ? flat.price.toString() : '',
    });
  };

  const handleSaveFlat = async () => {
    if (!selectedPropertyForFlats) return;
    if (!flatForm.flatName.trim()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Flat Name is required.' });
      return;
    }

    setSavingFlat(true);
    const formData = new FormData();
    formData.append('flatId', editingFlatId ? editingFlatId.toString() : '0');
    formData.append('propertyId', selectedPropertyForFlats.propertyId.toString());
    formData.append('blockName', flatForm.blockName);
    formData.append('floorName', flatForm.floorName);
    formData.append('flatName', flatForm.flatName);
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
        Toast.show({ type: 'success', text1: 'Success', text2: res.message || 'Flat saved successfully!' });
        setIsAddFlatMode(false);
        fetchFlatsList(selectedPropertyForFlats.propertyId, searchBhk);
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: res.message || 'Failed to save flat.' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Network Error', text2: err.message });
    } finally {
      setSavingFlat(false);
    }
  };

  const handleDeleteFlat = async (flatId: number, flatName: string) => {
    if (!selectedPropertyForFlats) return;
    const performDeleteFlat = async () => {
      try {
        const res = await PropertyService.deleteFlat(flatId);
        if (res.success) {
          Toast.show({ type: 'success', text1: 'Deleted', text2: `${flatName} removed.` });
          fetchFlatsList(selectedPropertyForFlats.propertyId, searchBhk);
        } else {
          Toast.show({ type: 'error', text1: 'Error', text2: res.message || 'Could not delete flat.' });
        }
      } catch (err: any) {
        Toast.show({ type: 'error', text1: 'Error', text2: err.message });
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(`Delete flat "${flatName}"?`)) performDeleteFlat();
    } else {
      performDeleteFlat();
    }
  };

  // --- Related Images sub-view ---
  const handleOpenImagesModal = async (property: PropertyItem) => {
    setSelectedPropertyForImages(property);
    setImagesModalOpen(true);
    fetchImagesList(property.propertyId);
  };

  const fetchImagesList = async (propertyId: number) => {
    setImagesLoading(true);
    try {
      const res = await PropertyService.getImages(propertyId);
      if (res.success) {
        setImages(res.uploads || []);
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load images.' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    } finally {
      setImagesLoading(false);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedPropertyForImages) return;

    const performUpload = async (file: any) => {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('propertyId', selectedPropertyForImages.propertyId.toString());
      formData.append('fileType', 'Image');

      if (Platform.OS === 'web') {
        formData.append('file', file);
      } else {
        formData.append('file', file as any);
      }

      try {
        const res = await PropertyService.uploadImage(formData);
        if (res.success) {
          Toast.show({ type: 'success', text1: 'Success', text2: 'Image uploaded successfully.' });
          fetchImagesList(selectedPropertyForImages.propertyId);
          fetchData(false); // Update list thumbnail
        } else {
          Toast.show({ type: 'error', text1: 'Failed', text2: res.message || 'Upload failed.' });
        }
      } catch (err: any) {
        Toast.show({ type: 'error', text1: 'Error', text2: err.message });
      } finally {
        setUploadingImage(false);
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

  const handleDeleteImage = async (uploadId: number) => {
    if (!selectedPropertyForImages) return;
    try {
      const res = await PropertyService.deleteImage(uploadId);
      if (res.success) {
        Toast.show({ type: 'success', text1: 'Deleted', text2: 'Image deleted.' });
        fetchImagesList(selectedPropertyForImages.propertyId);
        fetchData(false);
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: res.message || 'Delete failed.' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    }
  };

  const getFullImageUrl = (uploadId: number) => {
    const apiBaseUrl = getApiUrl();
    return `${apiBaseUrl}/Properties/DownloadImage?uploadId=${uploadId}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderCol }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Properties Directory</Text>
          <Text style={[styles.headerSubtitle, { color: subTextColor }]}>
            Manage and upload residential and commercial estates
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerActionBtn, { backgroundColor: inputBg }]}
            onPress={() => setExportMenuOpen(true)}
          >
            <Download size={15} color={brandCol} />
            <Text style={{ color: brandCol, fontSize: 13, fontWeight: '600' }}>Export</Text>
            <ChevronDown size={14} color={brandCol} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: brandCol }]}
            onPress={() => setAddUploadMenuOpen(true)}
          >
            <Plus size={16} color="#fff" />
            <Text style={styles.addButtonText}>Operations</Text>
            <ChevronUp size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Search Bar & Primary Filters */}
        <View style={styles.filtersContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Search Box */}
            <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: borderCol, flex: 1, minWidth: 220 }]}>
              <Search size={18} color={subTextColor} />
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder="Search by name, builder, location..."
                placeholderTextColor={subTextColor}
                value={search}
                onChangeText={setSearch}
              />
              {search !== '' && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Text style={{ color: subTextColor, fontSize: 13, fontWeight: '600' }}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Toggle Button */}
            <TouchableOpacity
              style={[
                styles.filterToggleBtn,
                { backgroundColor: cardBg, borderColor: showFilters || selectedBuilder !== 'All' || selectedExecutive !== 'All' || selectedPurchaseType !== 'All' || minPrice || maxPrice ? brandCol : borderCol }
              ]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} color={showFilters || selectedBuilder !== 'All' || selectedExecutive !== 'All' || selectedPurchaseType !== 'All' || minPrice || maxPrice ? brandCol : subTextColor} />
              <Text style={[styles.filterToggleText, { color: showFilters || selectedBuilder !== 'All' || selectedExecutive !== 'All' || selectedPurchaseType !== 'All' || minPrice || maxPrice ? brandCol : textColor }]}>
                Filters
              </Text>
              <ChevronDown size={14} color={subTextColor} style={{ transform: [{ rotate: showFilters ? '180deg' : '0deg' }] } as any} />
            </TouchableOpacity>

            {/* Inline filters on the right of Search & Filter Button */}
            {showFilters && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, alignItems: 'center' }}
                style={{ flexGrow: 0 }}
              >
                {/* Builder Filter */}
                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    { backgroundColor: cardBg, borderColor: selectedBuilder !== 'All' ? brandCol : borderCol },
                  ]}
                  onPress={() => setBuilderFilterOpen(true)}
                >
                  <Building size={14} color={selectedBuilder !== 'All' ? brandCol : subTextColor} />
                  <Text style={[styles.filterPillText, { color: selectedBuilder !== 'All' ? brandCol : textColor }]}>
                    {selectedBuilder === 'All' ? 'Builder' : selectedBuilder}
                  </Text>
                  <ChevronDown size={12} color={subTextColor} />
                </TouchableOpacity>

                {/* Executive Filter */}
                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    { backgroundColor: cardBg, borderColor: selectedExecutive !== 'All' ? brandCol : borderCol },
                  ]}
                  onPress={() => setExecFilterOpen(true)}
                >
                  <User size={14} color={selectedExecutive !== 'All' ? brandCol : subTextColor} />
                  <Text style={[styles.filterPillText, { color: selectedExecutive !== 'All' ? brandCol : textColor }]}>
                    {selectedExecutive === 'All'
                      ? 'Assignee'
                      : executives.find((e) => e.userId.toString() === selectedExecutive)?.fullName || 'Selected'}
                  </Text>
                  <ChevronDown size={12} color={subTextColor} />
                </TouchableOpacity>

                {/* Purchase Type Filter */}
                <TouchableOpacity
                  style={[
                    styles.filterPill,
                    { backgroundColor: cardBg, borderColor: selectedPurchaseType !== 'All' ? brandCol : borderCol },
                  ]}
                  onPress={() => setPurchaseTypeFilterOpen(true)}
                >
                  <Home size={14} color={selectedPurchaseType !== 'All' ? brandCol : subTextColor} />
                  <Text style={[styles.filterPillText, { color: selectedPurchaseType !== 'All' ? brandCol : textColor }]}>
                    {selectedPurchaseType === 'All' ? 'Type' : selectedPurchaseType}
                  </Text>
                  <ChevronDown size={12} color={subTextColor} />
                </TouchableOpacity>

                {/* Sort Dropdown */}
                <TouchableOpacity
                  style={[styles.filterPill, { backgroundColor: cardBg, borderColor: borderCol }]}
                  onPress={() => setSortOpen(true)}
                >
                  <Layers size={14} color={subTextColor} />
                  <Text style={[styles.filterPillText, { color: textColor }]}>
                    Sort: {SORT_OPTIONS.find((o) => o.value === sortOrder)?.label}
                  </Text>
                  <ChevronDown size={12} color={subTextColor} />
                </TouchableOpacity>

                {/* Price Inputs */}
                <View style={[styles.priceFilterRange, { borderColor: borderCol, backgroundColor: cardBg }]}>
                  <DollarSign size={13} color={subTextColor} />
                  <TextInput
                    style={{ color: textColor, fontSize: 12, paddingVertical: 0, width: 50 }}
                    placeholder="Min"
                    placeholderTextColor={subTextColor}
                    keyboardType="numeric"
                    value={minPrice}
                    onChangeText={setMinPrice}
                  />
                  <Text style={{ color: subTextColor, fontSize: 10, marginHorizontal: 2 }}>-</Text>
                  <TextInput
                    style={{ color: textColor, fontSize: 12, paddingVertical: 0, width: 50 }}
                    placeholder="Max"
                    placeholderTextColor={subTextColor}
                    keyboardType="numeric"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                  />
                </View>

                {(search || selectedBuilder !== 'All' || selectedExecutive !== 'All' || selectedPurchaseType !== 'All' || minPrice || maxPrice || sortOrder !== 'newest') && (
                  <TouchableOpacity onPress={resetFilters} style={styles.clearFiltersBtn}>
                    <Text style={{ color: brandCol, fontSize: 13, fontWeight: '600' }}>Reset</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>

        {/* Error State */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Indicator */}
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={brandCol} />
            <Text style={{ color: subTextColor, marginTop: 12 }}>Loading properties database...</Text>
          </View>
        ) : (
          /* Cards Grid */
          <View style={styles.gridContainer}>
            {filteredProperties.length > 0 ? (
              filteredProperties.map((item) => (
                <View key={item.propertyId} style={[styles.propertyCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      router.push({
                        pathname: '/admin/properties/propertydetails',
                        params: { id: item.propertyId }
                      });
                    }}
                  >
                    {/* Image/Header placeholder */}
                    <View style={[styles.cardHeader, { backgroundColor: inputBg }]}>
                      {item.hasImage ? (
                        /* Display Image. We fetch standard gallery image URL if uploads are verified, but can fall back to general path */
                        <Image
                          source={{
                            uri: `${getApiUrl()}/Properties/GetPropertyImage?propertyId=${item.propertyId}`,
                            headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined
                          }}
                          style={styles.cardImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Building size={40} color={subTextColor} />
                          <Text style={{ color: subTextColor, fontSize: 11, marginTop: 4 }}>No Image Added</Text>
                        </View>
                      )}

                      <View style={[styles.purchaseTypeBadge, { backgroundColor: brandCol }]}>
                        <Text style={styles.purchaseTypeBadgeText}>{item.purchaseType}</Text>
                      </View>
                    </View>

                    {/* Details */}
                    <View style={{ paddingHorizontal: 14, paddingTop: 14 }}>
                      <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>
                        {item.propertyName}
                      </Text>
                      <Text style={[styles.cardBuilder, { color: subTextColor }]} numberOfLines={1}>
                        by {item.builderName}
                      </Text>

                      <View style={styles.cardRow}>
                        <MapPin size={13} color={subTextColor} />
                        <Text style={[styles.cardRowText, { color: subTextColor }]} numberOfLines={1}>
                          {item.location}
                        </Text>
                      </View>

                      <View style={styles.cardSpecsRow}>
                        <View style={styles.specItem}>
                          <Maximize2 size={12} color={subTextColor} />
                          <Text style={[styles.specText, { color: textColor }]}>
                            {item.areaSqft ? `${item.areaSqft} sqft` : 'N/A sqft'}
                          </Text>
                        </View>
                        <View style={styles.specItem}>
                          <DollarSign size={12} color={subTextColor} />
                          <Text style={[styles.specText, { color: brandCol, fontWeight: '700' }]}>
                            {item.price ? `₹${item.price.toLocaleString('en-IN')}` : 'Price on Request'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Actions and Footer (not nested in touchable wrapper) */}
                  <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                    <View style={[styles.cardSeparator, { backgroundColor: borderCol }]} />

                    <View style={styles.cardFooter}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <User size={13} color={subTextColor} />
                        <Text style={{ fontSize: 12, color: subTextColor }}>
                          {item.assignedToName || 'Unassigned'}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: subTextColor }}>
                        {item.createdOn ? item.createdOn.split('T')[0] : ''}
                      </Text>
                    </View>

                    {/* Action Panel */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={[styles.cardActionBtn, { backgroundColor: inputBg }]}
                        onPress={() => handleOpenFlatsModal(item)}
                      >
                        <Layers size={13} color={textColor} />
                        <Text style={{ color: textColor, fontSize: 11, fontWeight: '600' }}>Flats</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.cardActionBtn, { backgroundColor: inputBg }]}
                        onPress={() => handleOpenImagesModal(item)}
                      >
                        <ImageIcon size={13} color={textColor} />
                        <Text style={{ color: textColor, fontSize: 11, fontWeight: '600' }}>Photos</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.cardActionBtn, { backgroundColor: inputBg }]}
                        onPress={() => handleOpenEditModal(item)}
                      >
                        <Edit size={13} color={brandCol} />
                        <Text style={{ color: brandCol, fontSize: 11, fontWeight: '600' }}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.cardActionBtn, { backgroundColor: '#ef444412' }]}
                        onPress={() => handleDeleteProperty(item.propertyId, item.propertyName)}
                      >
                        <Trash2 size={13} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noDataCard}>
                <Building size={48} color={subTextColor} />
                <Text style={[styles.noDataTitle, { color: textColor }]}>No Properties Found</Text>
                <Text style={{ color: subTextColor, textAlign: 'center', marginTop: 4 }}>
                  No active properties matched your filter parameters.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* --- FILTER MODALS --- */}
      {/* Export Options Modal */}
      <Modal visible={isExportMenuOpen} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setExportMenuOpen(false)} style={styles.modalOverlay}>
          <View style={[styles.dropdownMenu, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Text style={[styles.dropdownTitle, { color: subTextColor }]}>Export Options</Text>
            <TouchableOpacity
              onPress={() => {
                setExportMenuOpen(false);
                exportToCSV();
              }}
              style={styles.dropdownOption}
            >
              <Text style={{ color: textColor }}>Export CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setExportMenuOpen(false);
                exportToExcel();
              }}
              style={styles.dropdownOption}
            >
              <Text style={{ color: textColor }}>Export Excel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add & Upload Operations Modal */}
      <Modal visible={isAddUploadMenuOpen} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setAddUploadMenuOpen(false)} style={styles.modalOverlay}>
          <View style={[styles.dropdownMenu, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Text style={[styles.dropdownTitle, { color: subTextColor }]}>Operations</Text>
            <TouchableOpacity
              onPress={() => {
                setAddUploadMenuOpen(false);
                handleOpenAddModal();
              }}
              style={styles.dropdownOption}
            >
              <Text style={{ color: textColor }}>Add Property</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setAddUploadMenuOpen(false);
                handleBulkUploadClick();
              }}
              style={styles.dropdownOption}
            >
              <Text style={{ color: textColor }}>Bulk Upload</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Builder Filter Modal */}
      <Modal visible={isBuilderFilterOpen} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setBuilderFilterOpen(false)} style={styles.modalOverlay}>
          <View style={[styles.dropdownMenu, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Text style={[styles.dropdownTitle, { color: subTextColor }]}>Filter by Builder</Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedBuilder('All');
                setBuilderFilterOpen(false);
              }}
              style={[styles.dropdownOption, { backgroundColor: selectedBuilder === 'All' ? borderCol : 'transparent' }]}
            >
              <Text style={{ color: textColor }}>All Builders</Text>
              {selectedBuilder === 'All' && <Check size={14} color={brandCol} />}
            </TouchableOpacity>
            {builders.map((b) => (
              <TouchableOpacity
                key={b.builderId}
                onPress={() => {
                  setSelectedBuilder(b.builderName);
                  setBuilderFilterOpen(false);
                }}
                style={[
                  styles.dropdownOption,
                  { backgroundColor: selectedBuilder === b.builderName ? borderCol : 'transparent' },
                ]}
              >
                <Text style={{ color: textColor }}>{b.builderName}</Text>
                {selectedBuilder === b.builderName && <Check size={14} color={brandCol} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Executive Filter Modal */}
      <Modal visible={isExecFilterOpen} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setExecFilterOpen(false)} style={styles.modalOverlay}>
          <View style={[styles.dropdownMenu, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Text style={[styles.dropdownTitle, { color: subTextColor }]}>Filter by Sales Executive</Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedExecutive('All');
                setExecFilterOpen(false);
              }}
              style={[styles.dropdownOption, { backgroundColor: selectedExecutive === 'All' ? borderCol : 'transparent' }]}
            >
              <Text style={{ color: textColor }}>All Executives</Text>
              {selectedExecutive === 'All' && <Check size={14} color={brandCol} />}
            </TouchableOpacity>
            {executives.map((e) => (
              <TouchableOpacity
                key={e.userId}
                onPress={() => {
                  setSelectedExecutive(e.userId.toString());
                  setExecFilterOpen(false);
                }}
                style={[
                  styles.dropdownOption,
                  { backgroundColor: selectedExecutive === e.userId.toString() ? borderCol : 'transparent' },
                ]}
              >
                <Text style={{ color: textColor }}>{e.fullName}</Text>
                {selectedExecutive === e.userId.toString() && <Check size={14} color={brandCol} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Purchase Type Filter Modal */}
      <Modal visible={isPurchaseTypeFilterOpen} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setPurchaseTypeFilterOpen(false)} style={styles.modalOverlay}>
          <View style={[styles.dropdownMenu, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Text style={[styles.dropdownTitle, { color: subTextColor }]}>Filter by Type</Text>
            {PURCHASE_TYPES.map((pt) => (
              <TouchableOpacity
                key={pt}
                onPress={() => {
                  setSelectedPurchaseType(pt);
                  setPurchaseTypeFilterOpen(false);
                }}
                style={[
                  styles.dropdownOption,
                  { backgroundColor: selectedPurchaseType === pt ? borderCol : 'transparent' },
                ]}
              >
                <Text style={{ color: textColor }}>{pt}</Text>
                {selectedPurchaseType === pt && <Check size={14} color={brandCol} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sort Options Modal */}
      <Modal visible={isSortOpen} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setSortOpen(false)} style={styles.modalOverlay}>
          <View style={[styles.dropdownMenu, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Text style={[styles.dropdownTitle, { color: subTextColor }]}>Sort Order</Text>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => {
                  setSortOrder(opt.value);
                  setSortOpen(false);
                }}
                style={[
                  styles.dropdownOption,
                  { backgroundColor: sortOrder === opt.value ? borderCol : 'transparent' },
                ]}
              >
                <Text style={{ color: textColor }}>{opt.label}</Text>
                {sortOrder === opt.value && <Check size={14} color={brandCol} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- ADD / EDIT PROPERTY MODAL --- */}
      <Modal visible={isAddEditModalOpen} animationType="slide" transparent>
        <View style={styles.modalScrollOverlay}>
          <View style={[styles.formContainer, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={[styles.formHeader, { borderBottomColor: borderCol }]}>
              <Text style={[styles.formTitle, { color: textColor }]}>
                {editingPropertyId ? 'Edit Property details' : 'Add New Property'}
              </Text>
              <TouchableOpacity onPress={() => setAddEditModalOpen(false)}>
                <X size={20} color={textColor} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              {/* Form Input fields */}
              <Text style={[styles.label, { color: textColor }]}>Property Name *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                value={propForm.propertyName}
                onChangeText={(text) => setPropForm({ ...propForm, propertyName: text })}
                placeholder="e.g. Green Heights"
                placeholderTextColor={subTextColor}
              />

              <Text style={[styles.label, { color: textColor }]}>Builder Name *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                value={propForm.builderName}
                onChangeText={(text) => setPropForm({ ...propForm, builderName: text })}
                placeholder="e.g. Royal Developers"
                placeholderTextColor={subTextColor}
              />

              <Text style={[styles.label, { color: textColor }]}>Location *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                value={propForm.location}
                onChangeText={(text) => setPropForm({ ...propForm, location: text })}
                placeholder="e.g. Indiranagar, Bangalore"
                placeholderTextColor={subTextColor}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: textColor }]}>Area (Sqft) *</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                    value={propForm.areaSqft}
                    onChangeText={(text) => setPropForm({ ...propForm, areaSqft: text })}
                    placeholder="e.g. 1800"
                    placeholderTextColor={subTextColor}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: textColor }]}>Price (₹) *</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                    value={propForm.price}
                    onChangeText={(text) => setPropForm({ ...propForm, price: text })}
                    placeholder="e.g. 9500000"
                    placeholderTextColor={subTextColor}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: textColor }]}>Purchase Type</Text>
                  <TouchableOpacity
                    style={[styles.pickerWrapper, { backgroundColor: inputBg, borderColor: borderCol, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                    onPress={() => setPurchaseTypeFormSelectOpen(true)}
                  >
                    <Text style={{ color: textColor, fontSize: 13 }}>{propForm.purchaseType}</Text>
                    <ChevronDown size={14} color={subTextColor} />
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: textColor }]}>Assigned Executive</Text>
                  <TouchableOpacity
                    style={[styles.pickerWrapper, { backgroundColor: inputBg, borderColor: borderCol, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                    onPress={() => setExecFormSelectOpen(true)}
                  >
                    <Text style={{ color: textColor, fontSize: 13 }}>
                      {executives.find((exec) => exec.userId.toString() === propForm.assignedTo)?.fullName || 'Unassigned'}
                    </Text>
                    <ChevronDown size={14} color={subTextColor} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Property Image Selector */}
              <Text style={[styles.label, { color: textColor }]}>Property Image</Text>
              <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center', marginTop: 4 }}>
                <TouchableOpacity
                  style={[styles.imageSelectBtn, { backgroundColor: inputBg, borderColor: borderCol }]}
                  onPress={handlePickImage}
                >
                  <ImageIcon size={18} color={brandCol} />
                  <Text style={{ color: brandCol, fontSize: 13, fontWeight: '600' }}>Choose Photo</Text>
                </TouchableOpacity>

                {imagePreviewUrl ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: imagePreviewUrl }} style={styles.formImagePreview} />
                    <TouchableOpacity
                      style={styles.removePreviewBtn}
                      onPress={() => {
                        setSelectedImage(null);
                        setImagePreviewUrl(null);
                      }}
                    >
                      <X size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={{ color: subTextColor, fontSize: 12 }}>No image selected</Text>
                )}
              </View>
            </ScrollView>

            <View style={[styles.formFooter, { borderTopColor: borderCol }]}>
              <TouchableOpacity
                style={[styles.formActionBtn, { backgroundColor: inputBg }]}
                onPress={() => setAddEditModalOpen(false)}
                disabled={savingProperty}
              >
                <Text style={{ color: textColor }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formActionBtn, { backgroundColor: brandCol }]}
                onPress={handleSaveProperty}
                disabled={savingProperty}
              >
                {savingProperty ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Save Property</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Purchase Type Form Select Modal */}
      <Modal visible={isPurchaseTypeFormSelectOpen} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setPurchaseTypeFormSelectOpen(false)} style={styles.modalOverlay}>
          <View style={[styles.dropdownMenu, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Text style={[styles.dropdownTitle, { color: subTextColor }]}>Select Purchase Type</Text>
            {['Sale', 'Rent', 'Lease'].map((pt) => (
              <TouchableOpacity
                key={pt}
                onPress={() => {
                  setPropForm({ ...propForm, purchaseType: pt });
                  setPurchaseTypeFormSelectOpen(false);
                }}
                style={[
                  styles.dropdownOption,
                  { backgroundColor: propForm.purchaseType === pt ? borderCol : 'transparent' },
                ]}
              >
                <Text style={{ color: textColor }}>{pt}</Text>
                {propForm.purchaseType === pt && <Check size={14} color={brandCol} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Executive Form Select Modal */}
      <Modal visible={isExecFormSelectOpen} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setExecFormSelectOpen(false)} style={styles.modalOverlay}>
          <View style={[styles.dropdownMenu, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <Text style={[styles.dropdownTitle, { color: subTextColor }]}>Select Executive</Text>
            <TouchableOpacity
              onPress={() => {
                setPropForm({ ...propForm, assignedTo: '' });
                setExecFormSelectOpen(false);
              }}
              style={[styles.dropdownOption, { backgroundColor: propForm.assignedTo === '' ? borderCol : 'transparent' }]}
            >
              <Text style={{ color: textColor }}>Unassigned</Text>
              {propForm.assignedTo === '' && <Check size={14} color={brandCol} />}
            </TouchableOpacity>
            {executives.map((exec) => (
              <TouchableOpacity
                key={exec.userId}
                onPress={() => {
                  setPropForm({ ...propForm, assignedTo: exec.userId.toString() });
                  setExecFormSelectOpen(false);
                }}
                style={[
                  styles.dropdownOption,
                  { backgroundColor: propForm.assignedTo === exec.userId.toString() ? borderCol : 'transparent' },
                ]}
              >
                <Text style={{ color: textColor }}>{exec.fullName}</Text>
                {propForm.assignedTo === exec.userId.toString() && <Check size={14} color={brandCol} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- RELATED FLATS LIST MODAL --- */}
      <Modal visible={isFlatsModalOpen} animationType="slide" transparent>
        <View style={styles.modalScrollOverlay}>
          <View style={[styles.formContainer, { backgroundColor: cardBg, borderColor: borderCol, width: '90%', maxWidth: 750 }]}>
            <View style={[styles.formHeader, { borderBottomColor: borderCol }]}>
              <View>
                <Text style={[styles.formTitle, { color: textColor }]}>
                  Flats Inventory Management
                </Text>
                <Text style={{ fontSize: 12, color: subTextColor }}>
                  Property: {selectedPropertyForFlats?.propertyName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setFlatsModalOpen(false)}>
                <X size={20} color={textColor} />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, flexDirection: Platform.OS === 'web' ? 'row' : 'column' }}>
              {/* Flats List section (left side on web) */}
              <View style={{ flex: 1, borderRightWidth: Platform.OS === 'web' ? 1 : 0, borderRightColor: borderCol, padding: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol, flex: 1, marginBottom: 0, height: 36 }]}
                    value={searchBhk}
                    onChangeText={(text) => {
                      setSearchBhk(text);
                      if (selectedPropertyForFlats) fetchFlatsList(selectedPropertyForFlats.propertyId, text);
                    }}
                    placeholder="Search by BHK (e.g. 2 BHK)"
                    placeholderTextColor={subTextColor}
                  />
                  <TouchableOpacity style={[styles.addButton, { backgroundColor: brandCol, height: 36 }]} onPress={handleOpenAddFlatForm}>
                    <Plus size={14} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Add Flat</Text>
                  </TouchableOpacity>
                </View>

                {flatsLoading ? (
                  <ActivityIndicator size="large" color={brandCol} style={{ marginTop: 40 }} />
                ) : (
                  <ScrollView style={{ maxHeight: 400 }}>
                    {flats.length > 0 ? (
                      flats.map((flat) => (
                        <View key={flat.flatId} style={[styles.flatItemRow, { borderBottomColor: borderCol }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: textColor, fontWeight: '700', fontSize: 13 }}>
                              {flat.blockName} Block - Floor {flat.floorName} - {flat.flatName}
                            </Text>
                            <Text style={{ color: subTextColor, fontSize: 11 }}>
                              {flat.bhk} · {flat.propertyType} · {flat.areaSqft} sqft
                            </Text>
                            <Text style={{ color: brandCol, fontWeight: '700', fontSize: 12, marginTop: 2 }}>
                              {flat.price ? `₹${flat.price.toLocaleString('en-IN')}` : 'Price N/A'} · Status:{' '}
                              <Text style={{ color: flat.flatStatus === 'Available' ? '#10b981' : '#f59e0b' }}>
                                {flat.flatStatus}
                              </Text>
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            <TouchableOpacity onPress={() => handleOpenEditFlatForm(flat)}>
                              <Edit size={14} color={brandCol} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteFlat(flat.flatId, flat.flatName)}>
                              <Trash2 size={14} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={{ color: subTextColor, textAlign: 'center', marginTop: 40 }}>No flats inventory added.</Text>
                    )}
                  </ScrollView>
                )}
              </View>

              {/* Add/Edit Flat Form section (right side on web) */}
              {isAddFlatMode && (
                <View style={{ width: Platform.OS === 'web' ? 280 : '100%', padding: 16 }}>
                  <Text style={{ fontWeight: '700', color: textColor, fontSize: 14, marginBottom: 12 }}>
                    {editingFlatId ? 'Edit Flat Details' : 'Add New Flat'}
                  </Text>
                  <ScrollView style={{ maxHeight: 350 }}>
                    <Text style={[styles.label, { color: textColor }]}>Block Name</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol, height: 32 }]}
                      value={flatForm.blockName}
                      onChangeText={(text) => setFlatForm({ ...flatForm, blockName: text })}
                      placeholder="e.g. Block A"
                      placeholderTextColor={subTextColor}
                    />

                    <Text style={[styles.label, { color: textColor }]}>Floor Name</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol, height: 32 }]}
                      value={flatForm.floorName}
                      onChangeText={(text) => setFlatForm({ ...flatForm, floorName: text })}
                      placeholder="e.g. 5th Floor"
                      placeholderTextColor={subTextColor}
                    />

                    <Text style={[styles.label, { color: textColor }]}>Flat/Door Name *</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol, height: 32 }]}
                      value={flatForm.flatName}
                      onChangeText={(text) => setFlatForm({ ...flatForm, flatName: text })}
                      placeholder="e.g. 504"
                      placeholderTextColor={subTextColor}
                    />

                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: textColor }]}>BHK</Text>
                        <TextInput
                          style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol, height: 32 }]}
                          value={flatForm.bhk}
                          onChangeText={(text) => setFlatForm({ ...flatForm, bhk: text })}
                          placeholder="e.g. 3 BHK"
                          placeholderTextColor={subTextColor}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: textColor }]}>Area (Sqft)</Text>
                        <TextInput
                          style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol, height: 32 }]}
                          value={flatForm.areaSqft}
                          onChangeText={(text) => setFlatForm({ ...flatForm, areaSqft: text })}
                          placeholder="e.g. 1500"
                          placeholderTextColor={subTextColor}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    <Text style={[styles.label, { color: textColor }]}>Flat Status</Text>
                    <TouchableOpacity
                      style={[styles.pickerWrapper, { backgroundColor: inputBg, borderColor: borderCol, height: 32, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                      onPress={() => setFlatStatusFormSelectOpen(true)}
                    >
                      <Text style={{ color: textColor, fontSize: 13 }}>{flatForm.flatStatus}</Text>
                      <ChevronDown size={12} color={subTextColor} />
                    </TouchableOpacity>

                    <Text style={[styles.label, { color: textColor }]}>Price (₹)</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol, height: 32 }]}
                      value={flatForm.price}
                      onChangeText={(text) => setFlatForm({ ...flatForm, price: text })}
                      placeholder="e.g. 7500000"
                      placeholderTextColor={subTextColor}
                      keyboardType="numeric"
                    />
                  </ScrollView>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <TouchableOpacity
                      style={[styles.formActionBtn, { backgroundColor: inputBg, flex: 1, height: 32 }]}
                      onPress={() => setIsAddFlatMode(false)}
                    >
                      <Text style={{ color: textColor, fontSize: 12 }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.formActionBtn, { backgroundColor: brandCol, flex: 1, height: 32 }]}
                      onPress={handleSaveFlat}
                      disabled={savingFlat}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Flat Status Form Select Modal */}
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

      {/* --- PHOTO GALLERY MODAL --- */}
      <Modal visible={isImagesModalOpen} animationType="slide" transparent>
        <View style={styles.modalScrollOverlay}>
          <View style={[styles.formContainer, { backgroundColor: cardBg, borderColor: borderCol, width: '80%', maxWidth: 600 }]}>
            <View style={[styles.formHeader, { borderBottomColor: borderCol }]}>
              <View>
                <Text style={[styles.formTitle, { color: textColor }]}>
                  Property Photo Gallery
                </Text>
                <Text style={{ fontSize: 12, color: subTextColor }}>
                  Property: {selectedPropertyForImages?.propertyName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setImagesModalOpen(false)}>
                <X size={20} color={textColor} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16 }}>
              <TouchableOpacity
                style={[styles.imageSelectBtn, { backgroundColor: inputBg, borderColor: borderCol, alignSelf: 'flex-start', marginBottom: 16 }]}
                onPress={handleUploadImage}
                disabled={uploadingImage}
              >
                <Upload size={16} color={brandCol} />
                <Text style={{ color: brandCol, fontWeight: '600', fontSize: 13 }}>Upload Image</Text>
              </TouchableOpacity>

              {imagesLoading ? (
                <ActivityIndicator size="large" color={brandCol} style={{ marginVertical: 30 }} />
              ) : (
                <ScrollView contentContainerStyle={styles.galleryGrid} style={{ maxHeight: 350 }}>
                  {images.length > 0 ? (
                    images.map((img) => (
                      <View key={img.uploadId} style={[styles.galleryCard, { borderColor: borderCol }]}>
                        <Image source={{ uri: getFullImageUrl(img.uploadId) }} style={styles.galleryImage} />
                        <View style={styles.galleryFooter}>
                          <Text style={{ fontSize: 9, color: subTextColor, flex: 1 }} numberOfLines={1}>
                            {img.fileName}
                          </Text>
                          <TouchableOpacity onPress={() => handleDeleteImage(img.uploadId)}>
                            <Trash2 size={12} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: subTextColor, textAlign: 'center', marginVertical: 40, width: '100%' }}>
                      No photos uploaded for this property yet.
                    </Text>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  headerActionBtn: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButton: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  searchBox: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  filterToggleBtn: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4,
  },
  filterPill: {
    height: 32,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterPillText: {
    fontSize: 12,
  },
  priceFilterRange: {
    height: 32,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearFiltersBtn: {
    marginLeft: 8,
  },
  loaderContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  propertyCard: {
    width: Platform.OS === 'web' ? '31.5%' : '100%',
    minWidth: 260,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchaseTypeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  purchaseTypeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardBuilder: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 6,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  cardRowText: {
    fontSize: 12,
  },
  cardSpecsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 12,
  },
  cardSeparator: {
    height: 1,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  cardActionBtn: {
    height: 28,
    borderRadius: 6,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
  },
  noDataCard: {
    width: '100%',
    paddingVertical: 80,
    alignItems: 'center',
  },
  noDataTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  errorBanner: {
    backgroundColor: '#ef444415',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    flex: 1,
  },
  retryBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
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
  modalScrollOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  formHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  textInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 8,
  },
  pickerWrapper: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 8,
  },
  pickerIcon: {
    position: 'absolute',
    right: 10,
    pointerEvents: 'none',
  },
  imageSelectBtn: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: 60,
    height: 60,
  },
  formImagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePreviewBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formFooter: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  formActionBtn: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatItemRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  galleryCard: {
    width: '30%',
    minWidth: 100,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: 80,
  },
  galleryFooter: {
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00000005',
  },
});
