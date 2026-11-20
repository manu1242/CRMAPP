import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiUrl } from '../../../api/remoteConfig';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
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
  MapPin,
  Building,
  IndianRupee,
  Maximize2,
  Image as ImageIcon,
  User,
  Layers,
  Home,
  X,
  RotateCcw,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { exportToExcel, exportToCSV } from '../../../Services/exportService';

import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { usePermissions } from '../../../authorization/hooks/usePermission';
import { PropertyService } from '../../../admin/services/PropertyService';
import { TokenStorage } from '../../../auth/storage/TokenStorage';
import { AuthImage } from '../../../components/AuthImage';
import {
  PropertyItem,
  BuilderItem,
  ExecutiveItem,
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
  const { canCreate, canEdit, canDelete } = usePermissions();

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg;
  const brandCol = adminTheme.brand;

  const queryClient = useQueryClient();

  const { data: propertiesData, isLoading: propertiesLoading, error: propertiesError, refetch: refetchProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const res = await PropertyService.getPropertiesList();
      if (!res.success) throw new Error(res.message || 'Failed to fetch properties list');
      return res.properties || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes cache freshness
    gcTime: 24 * 60 * 60 * 1000, // 24 hours persistence
  });

  const { data: buildersData, refetch: refetchBuilders } = useQuery({
    queryKey: ['builders'],
    queryFn: async () => {
      const res = await PropertyService.getBuilders();
      if (!res.success) throw new Error(res.message || 'Failed to fetch builders');
      return res.builders || [];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  const { data: executivesData, refetch: refetchExecutives } = useQuery({
    queryKey: ['executives'],
    queryFn: async () => {
      const res = await PropertyService.getExecutives();
      if (!res.success) throw new Error(res.message || 'Failed to fetch executives');
      return res.executives || [];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  const properties = propertiesData || [];
  const builders = buildersData || [];
  const executives = executivesData || [];
  const loading = propertiesLoading;
  const error = propertiesError ? (propertiesError as any).message : null;

  const [refreshing, setRefreshing] = useState(false);

  // Filter State (Web Parity)
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedBuilder, setSelectedBuilder] = useState('All');
  const [selectedExecutive, setSelectedExecutive] = useState('All');
  const [selectedPurchaseType, setSelectedPurchaseType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPriceBand, setSelectedPriceBand] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  // Inline panel open states (no modals)
  const [showFilters, setShowFilters] = useState(false);
  const [isExportOpen, setExportOpen] = useState(false);
  const [isOperationsOpen, setOperationsOpen] = useState(false);
  const [isLocationOpen, setLocationOpen] = useState(false);
  const [isBuilderOpen, setBuilderOpen] = useState(false);
  const [isExecOpen, setExecOpen] = useState(false);
  const [isPurchaseTypeOpen, setPurchaseTypeOpen] = useState(false);
  const [isStatusOpen, setStatusOpen] = useState(false);
  const [isPriceBandOpen, setPriceBandOpen] = useState(false);
  const [isSortOpen, setSortOpen] = useState(false);

  const fetchData = async () => {
    await Promise.all([refetchProperties(), refetchBuilders(), refetchExecutives()]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['properties'] }),
        queryClient.invalidateQueries({ queryKey: ['builders'] }),
        queryClient.invalidateQueries({ queryKey: ['executives'] }),
      ]);
      await fetchData();
    } catch (err: any) {
      console.warn('Pull-to-refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedLocation('All');
    setSelectedBuilder('All');
    setSelectedExecutive('All');
    setSelectedPurchaseType('All');
    setSelectedStatus('All');
    setSelectedPriceBand('all');
    setMinPrice('');
    setMaxPrice('');
    setSortOrder('newest');
  };

  const closeAllDropdowns = () => {
    setExportOpen(false);
    setOperationsOpen(false);
    setLocationOpen(false);
    setBuilderOpen(false);
    setExecOpen(false);
    setPurchaseTypeOpen(false);
    setStatusOpen(false);
    setPriceBandOpen(false);
    setSortOpen(false);
  };

  // Distinct locations from live properties
  const availableLocations = React.useMemo(() => {
    const locSet = new Set<string>();
    properties.forEach((p) => {
      if (p.location && p.location.trim()) {
        locSet.add(p.location.trim());
      }
    });
    return Array.from(locSet).sort();
  }, [properties]);

  // Client-side filtering (Web Parity) — memoized: previously re-ran (with lowercase/date parsing
  // for every property) on every render, including each keystroke and dropdown toggle.
  const filteredProperties = React.useMemo(() => properties.filter((p) => {
    const matchesSearch =
      p.propertyName.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.builderName.toLowerCase().includes(search.toLowerCase());

    const matchesLocation = selectedLocation === 'All' || p.location.toLowerCase() === selectedLocation.toLowerCase();
    const matchesBuilder = selectedBuilder === 'All' || p.builderName === selectedBuilder;
    const matchesExecutive = selectedExecutive === 'All' || p.assignedTo?.toString() === selectedExecutive;
    const matchesPurchaseType = selectedPurchaseType === 'All' || p.purchaseType === selectedPurchaseType;

    // Status: Available vs Sold
    const isSold = (p as any).status?.toLowerCase() === 'sold' || p.inventory === 'Sold';
    const matchesStatus =
      selectedStatus === 'All' ||
      (selectedStatus === 'Available' ? !isSold : isSold);

    const price = p.price || 0;
    let matchesPriceBand = true;
    if (selectedPriceBand === 'under25l') matchesPriceBand = price < 2500000;
    else if (selectedPriceBand === '25l-50l') matchesPriceBand = price >= 2500000 && price <= 5000000;
    else if (selectedPriceBand === '50l-1cr') matchesPriceBand = price >= 5000000 && price <= 10000000;
    else if (selectedPriceBand === '1cr-2cr') matchesPriceBand = price >= 10000000 && price <= 20000000;
    else if (selectedPriceBand === 'above2cr') matchesPriceBand = price > 20000000;

    const matchesMinPrice = minPrice === '' || price >= parseFloat(minPrice);
    const matchesMaxPrice = maxPrice === '' || price <= parseFloat(maxPrice);

    return (
      matchesSearch &&
      matchesLocation &&
      matchesBuilder &&
      matchesExecutive &&
      matchesPurchaseType &&
      matchesStatus &&
      matchesPriceBand &&
      matchesMinPrice &&
      matchesMaxPrice
    );
  }).sort((a, b) => {
    if (sortOrder === 'price-asc') return (a.price || 0) - (b.price || 0);
    if (sortOrder === 'price-desc') return (b.price || 0) - (a.price || 0);
    if (sortOrder === 'area-asc') return (a.areaSqft || 0) - (b.areaSqft || 0);
    if (sortOrder === 'area-desc') return (b.areaSqft || 0) - (a.areaSqft || 0);
    const dateA = a.createdOn ? new Date(a.createdOn).getTime() : 0;
    const dateB = b.createdOn ? new Date(b.createdOn).getTime() : 0;
    return dateB - dateA;
  }), [properties, search, selectedLocation, selectedBuilder, selectedExecutive, selectedPurchaseType, selectedStatus, selectedPriceBand, minPrice, maxPrice, sortOrder]);

  // Incremental rendering: draw cards in batches as the user scrolls. Rendering every card at once
  // also fired every cover-image download at once (AuthImage base64 per property).
  const BATCH = 12;
  const [visibleCount, setVisibleCount] = useState(BATCH);
  useEffect(() => {
    setVisibleCount(BATCH);
  }, [filteredProperties]);
  const visibleProperties = React.useMemo(
    () => filteredProperties.slice(0, visibleCount),
    [filteredProperties, visibleCount]
  );
  const handleListScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (
      visibleCount < filteredProperties.length &&
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 600
    ) {
      setVisibleCount((c) => Math.min(c + BATCH, filteredProperties.length));
    }
  };

  // CSV Export
  const handleExportCSV = async () => {
    if (filteredProperties.length === 0) {
      Toast.show({ type: 'info', text1: 'No data', text2: 'No properties to export.' });
      return;
    }
    await exportToCSV({
      data: filteredProperties,
      fileName: `Properties_Export_${new Date().toISOString().split('T')[0]}`,
      columns: [
        { header: 'Property ID', key: 'propertyId' },
        { header: 'Property Name', key: 'propertyName' },
        { header: 'Builder', key: 'builderName', formatter: (val) => val || 'N/A' },
        { header: 'Location', key: 'location', formatter: (val) => val || 'N/A' },
        { header: 'Area (Sqft)', key: 'areaSqft', formatter: (val) => val || 'N/A' },
        { header: 'Price', key: 'price', formatter: (val) => val || 'N/A' },
        { header: 'Purchase Type', key: 'purchaseType', formatter: (val) => val || 'N/A' },
        { header: 'Assigned To', key: 'assignedToName', formatter: (val) => val || 'Unassigned' },
        { header: 'Created Date', key: 'createdOn', formatter: (val) => (val ? val.split('T')[0] : 'N/A') },
      ],
    });
  };

  // Excel Export
  const handleExportExcel = async () => {
    if (filteredProperties.length === 0) {
      Toast.show({ type: 'info', text1: 'No data', text2: 'No properties to export.' });
      return;
    }
    await exportToExcel({
      data: filteredProperties,
      fileName: `Properties_Export_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Properties',
      columns: [
        { header: 'Property ID', key: 'propertyId' },
        { header: 'Property Name', key: 'propertyName' },
        { header: 'Builder', key: 'builderName', formatter: (val) => val || 'N/A' },
        { header: 'Location', key: 'location', formatter: (val) => val || 'N/A' },
        { header: 'Area (Sqft)', key: 'areaSqft', formatter: (val) => val || 'N/A' },
        { header: 'Price', key: 'price', formatter: (val) => val || 'N/A' },
        { header: 'Purchase Type', key: 'purchaseType', formatter: (val) => val || 'N/A' },
        { header: 'Assigned To', key: 'assignedToName', formatter: (val) => val || 'Unassigned' },
        { header: 'Created Date', key: 'createdOn', formatter: (val) => (val ? val.split('T')[0] : 'N/A') },
      ],
    });
  };

  // Bulk Upload
  const handleBulkUpload = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.xls,.csv';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
          const res = await PropertyService.bulkUploadProperties(formData);
          if (res.success) {
            Toast.show({ type: 'success', text1: 'Upload Done', text2: res.message || 'Bulk upload finished' });
            fetchData();
          } else {
            Toast.show({ type: 'error', text1: 'Upload Failed', text2: res.message || 'Upload failed' });
          }
        } catch (err: any) {
          Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Network error' });
        }
      };
      input.click();
    } else {
      Toast.show({ type: 'info', text1: 'Bulk Upload', text2: 'Bulk upload is available on web.' });
    }
  };

  // Delete Property
  const handleDeleteProperty = (propertyId: number, propertyName: string) => {
    const performDelete = async () => {
      try {
        const res = await PropertyService.deleteProperty(propertyId);
        if (res.success) {
          Toast.show({ type: 'success', text1: 'Deleted', text2: `${propertyName} deleted.` });
          queryClient.invalidateQueries({ queryKey: ['properties'] });
          fetchData();
        } else {
          Toast.show({ type: 'error', text1: 'Error', text2: res.message || 'Could not delete.' });
        }
      } catch (err: any) {
        Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Network error.' });
      }
    };
    if (Platform.OS === 'web') {
      if (confirm(`Delete "${propertyName}"?`)) performDelete();
    } else {
      performDelete();
    }
  };

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (selectedLocation !== 'All') count++;
    if (selectedBuilder !== 'All') count++;
    if (selectedExecutive !== 'All') count++;
    if (selectedPurchaseType !== 'All') count++;
    if (selectedStatus !== 'All') count++;
    if (selectedPriceBand !== 'all') count++;
    if (minPrice || maxPrice) count++;
    if (sortOrder !== 'newest') count++;
    return count;
  }, [selectedLocation, selectedBuilder, selectedExecutive, selectedPurchaseType, selectedStatus, selectedPriceBand, minPrice, maxPrice, sortOrder]);

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        // Pressing scroll area should close any open inline dropdown
        onScrollBeginDrag={closeAllDropdowns}
        onScroll={handleListScroll}
        scrollEventThrottle={200}
      >
        {/* ── Top Bar: Search + Action Buttons ── */}
        <View style={styles.topBar}>
          {/* Search Box */}
          <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: borderCol, flex: 1 }]}>
            <Search size={18} color={subTextColor} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search by name, builder, location..."
              placeholderTextColor={subTextColor}
              value={search}
              onChangeText={(t) => { setSearch(t); closeAllDropdowns(); }}
            />
            {search !== '' && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <X size={16} color={subTextColor} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Toggle with Badge Count */}
          <TouchableOpacity
            style={[
              styles.iconBtn,
              { backgroundColor: cardBg, borderColor: hasActiveFilters ? brandCol : borderCol }
            ]}
            onPress={() => { setShowFilters(!showFilters); closeAllDropdowns(); }}
          >
            <Filter size={16} color={hasActiveFilters ? brandCol : subTextColor} />
            <Text style={{ color: hasActiveFilters ? brandCol : textColor, fontSize: 13, fontWeight: '600' }}>
              {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
            </Text>
            {hasActiveFilters && (
              <View style={[styles.dot, { backgroundColor: brandCol }]} />
            )}
          </TouchableOpacity>

          {/* Export Button */}
          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: inputBg, borderColor: borderCol }]}
              onPress={() => { setExportOpen(!isExportOpen); setOperationsOpen(false); }}
            >
              <Download size={15} color={brandCol} />
              <Text style={{ color: brandCol, fontSize: 13, fontWeight: '600' }}>Export</Text>
              {isExportOpen ? <ChevronUp size={13} color={brandCol} /> : <ChevronDown size={13} color={brandCol} />}
            </TouchableOpacity>

            {isExportOpen && (
              <View style={[styles.inlineDropdown, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <TouchableOpacity
                  style={styles.inlineDropdownItem}
                  onPress={() => { setExportOpen(false); handleExportCSV(); }}
                >
                  <Download size={14} color={subTextColor} />
                  <Text style={{ color: textColor, fontSize: 13 }}>Export CSV</Text>
                </TouchableOpacity>
                <View style={[styles.ddivider, { backgroundColor: borderCol }]} />
                <TouchableOpacity
                  style={styles.inlineDropdownItem}
                  onPress={() => { setExportOpen(false); handleExportExcel(); }}
                >
                  <Download size={14} color={subTextColor} />
                  <Text style={{ color: textColor, fontSize: 13 }}>Export Excel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Operations Button */}
          {canCreate('Properties') && (
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: brandCol }]}
                onPress={() => { setOperationsOpen(!isOperationsOpen); setExportOpen(false); }}
              >
                <Plus size={16} color="#fff" />
                <Text style={styles.addButtonText}>Operations</Text>
                {isOperationsOpen ? <ChevronUp size={13} color="#fff" /> : <ChevronDown size={13} color="#fff" />}
              </TouchableOpacity>

              {isOperationsOpen && (
                <View style={[styles.inlineDropdown, { backgroundColor: cardBg, borderColor: borderCol, right: 0, left: 'auto' as any }]}>
                  <TouchableOpacity
                    style={styles.inlineDropdownItem}
                    onPress={() => {
                      setOperationsOpen(false);
                      router.push('/admin/properties/add-property');
                    }}
                  >
                    <Plus size={14} color={subTextColor} />
                    <Text style={{ color: textColor, fontSize: 13 }}>Add Property</Text>
                  </TouchableOpacity>
                  <View style={[styles.ddivider, { backgroundColor: borderCol }]} />
                  <TouchableOpacity
                    style={styles.inlineDropdownItem}
                    onPress={() => { setOperationsOpen(false); handleBulkUpload(); }}
                  >
                    <Upload size={14} color={subTextColor} />
                    <Text style={{ color: textColor, fontSize: 13 }}>Bulk Upload</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── Quick Chips / Removable Active Filter Chips (Web Parity) ── */}
        <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}
          >
            {hasActiveFilters && (
              <TouchableOpacity
                onPress={resetFilters}
                style={[styles.chipPill, { backgroundColor: isDark ? '#7f1d1d33' : '#fef2f2', borderColor: '#ef4444' }]}
              >
                <RotateCcw size={12} color="#ef4444" />
                <Text style={[styles.chipText, { color: '#ef4444', fontWeight: '700' }]}>Clear All</Text>
              </TouchableOpacity>
            )}

            {selectedLocation !== 'All' && (
              <TouchableOpacity
                onPress={() => setSelectedLocation('All')}
                style={[styles.chipPill, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5', borderColor: brandCol }]}
              >
                <MapPin size={12} color={brandCol} />
                <Text style={[styles.chipText, { color: brandCol }]}>{selectedLocation}</Text>
                <X size={12} color={brandCol} />
              </TouchableOpacity>
            )}

            {selectedStatus !== 'All' && (
              <TouchableOpacity
                onPress={() => setSelectedStatus('All')}
                style={[styles.chipPill, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5', borderColor: brandCol }]}
              >
                <Text style={[styles.chipText, { color: brandCol }]}>{selectedStatus}</Text>
                <X size={12} color={brandCol} />
              </TouchableOpacity>
            )}

            {selectedPriceBand !== 'all' && (
              <TouchableOpacity
                onPress={() => setSelectedPriceBand('all')}
                style={[styles.chipPill, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5', borderColor: brandCol }]}
              >
                <IndianRupee size={12} color={brandCol} />
                <Text style={[styles.chipText, { color: brandCol }]}>{selectedPriceBand}</Text>
                <X size={12} color={brandCol} />
              </TouchableOpacity>
            )}

            {selectedPurchaseType !== 'All' && (
              <TouchableOpacity
                onPress={() => setSelectedPurchaseType('All')}
                style={[styles.chipPill, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5', borderColor: brandCol }]}
              >
                <Home size={12} color={brandCol} />
                <Text style={[styles.chipText, { color: brandCol }]}>{selectedPurchaseType}</Text>
                <X size={12} color={brandCol} />
              </TouchableOpacity>
            )}

            {selectedBuilder !== 'All' && (
              <TouchableOpacity
                onPress={() => setSelectedBuilder('All')}
                style={[styles.chipPill, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5', borderColor: brandCol }]}
              >
                <Building size={12} color={brandCol} />
                <Text style={[styles.chipText, { color: brandCol }]}>{selectedBuilder}</Text>
                <X size={12} color={brandCol} />
              </TouchableOpacity>
            )}

            {/* Quick shortcuts */}
            {selectedStatus !== 'Available' && (
              <TouchableOpacity
                onPress={() => setSelectedStatus('Available')}
                style={[styles.chipPill, { backgroundColor: cardBg, borderColor: borderCol }]}
              >
                <Text style={[styles.chipText, { color: subTextColor }]}>Available Only</Text>
              </TouchableOpacity>
            )}

            {selectedPriceBand !== 'under25l' && (
              <TouchableOpacity
                onPress={() => setSelectedPriceBand('under25l')}
                style={[styles.chipPill, { backgroundColor: cardBg, borderColor: borderCol }]}
              >
                <Text style={[styles.chipText, { color: subTextColor }]}>Under ₹25L</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* ── Inline Filters Panel (Web Parity) ── */}
        {showFilters && (
          <View style={[styles.filtersPanel, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={styles.filtersPanelHeader}>
              <Text style={{ color: textColor, fontWeight: '700', fontSize: 14 }}>Filter Properties</Text>
              {hasActiveFilters && (
                <TouchableOpacity onPress={resetFilters}>
                  <Text style={{ color: brandCol, fontSize: 13, fontWeight: '600' }}>Reset All</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.filtersRow}>
              {/* City / Location (Web Parity: filterCity) */}
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: subTextColor }]}>City / Location</Text>
                <TouchableOpacity
                  style={[styles.filterSelect, { backgroundColor: inputBg, borderColor: selectedLocation !== 'All' ? brandCol : borderCol }]}
                  onPress={() => { setLocationOpen(!isLocationOpen); setBuilderOpen(false); setExecOpen(false); setPurchaseTypeOpen(false); setStatusOpen(false); setPriceBandOpen(false); setSortOpen(false); }}
                >
                  <MapPin size={13} color={selectedLocation !== 'All' ? brandCol : subTextColor} />
                  <Text style={{ color: selectedLocation !== 'All' ? brandCol : textColor, fontSize: 12, flex: 1 }} numberOfLines={1}>
                    {selectedLocation}
                  </Text>
                  <ChevronDown size={12} color={subTextColor} />
                </TouchableOpacity>
                {isLocationOpen && (
                  <View style={[styles.filterDropdown, { backgroundColor: cardBg, borderColor: borderCol }]}>
                    <TouchableOpacity
                      style={[styles.filterDropdownItem, { backgroundColor: selectedLocation === 'All' ? borderCol : 'transparent' }]}
                      onPress={() => { setSelectedLocation('All'); setLocationOpen(false); }}
                    >
                      <Text style={{ color: textColor, fontSize: 12 }}>All Cities / Locations</Text>
                      {selectedLocation === 'All' && <Check size={12} color={brandCol} />}
                    </TouchableOpacity>
                    {availableLocations.map((loc) => (
                      <TouchableOpacity
                        key={loc}
                        style={[styles.filterDropdownItem, { backgroundColor: selectedLocation === loc ? borderCol : 'transparent' }]}
                        onPress={() => { setSelectedLocation(loc); setLocationOpen(false); }}
                      >
                        <Text style={{ color: textColor, fontSize: 12 }}>{loc}</Text>
                        {selectedLocation === loc && <Check size={12} color={brandCol} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Status (Web Parity: filterStatus - Available / Sold) */}
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: subTextColor }]}>Status</Text>
                <TouchableOpacity
                  style={[styles.filterSelect, { backgroundColor: inputBg, borderColor: selectedStatus !== 'All' ? brandCol : borderCol }]}
                  onPress={() => { setStatusOpen(!isStatusOpen); setLocationOpen(false); setBuilderOpen(false); setExecOpen(false); setPurchaseTypeOpen(false); setPriceBandOpen(false); setSortOpen(false); }}
                >
                  <Text style={{ color: selectedStatus !== 'All' ? brandCol : textColor, fontSize: 12, flex: 1 }} numberOfLines={1}>
                    {selectedStatus === 'All' ? 'All Status' : selectedStatus}
                  </Text>
                  <ChevronDown size={12} color={subTextColor} />
                </TouchableOpacity>
                {isStatusOpen && (
                  <View style={[styles.filterDropdown, { backgroundColor: cardBg, borderColor: borderCol }]}>
                    {['All', 'Available', 'Sold'].map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={[styles.filterDropdownItem, { backgroundColor: selectedStatus === st ? borderCol : 'transparent' }]}
                        onPress={() => { setSelectedStatus(st); setStatusOpen(false); }}
                      >
                        <Text style={{ color: textColor, fontSize: 12 }}>{st === 'All' ? 'All Status' : st}</Text>
                        {selectedStatus === st && <Check size={12} color={brandCol} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Builder */}
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: subTextColor }]}>Builder</Text>
                <TouchableOpacity
                  style={[styles.filterSelect, { backgroundColor: inputBg, borderColor: selectedBuilder !== 'All' ? brandCol : borderCol }]}
                  onPress={() => { setBuilderOpen(!isBuilderOpen); setLocationOpen(false); setExecOpen(false); setPurchaseTypeOpen(false); setStatusOpen(false); setPriceBandOpen(false); setSortOpen(false); }}
                >
                  <Building size={13} color={selectedBuilder !== 'All' ? brandCol : subTextColor} />
                  <Text style={{ color: selectedBuilder !== 'All' ? brandCol : textColor, fontSize: 12, flex: 1 }} numberOfLines={1}>
                    {selectedBuilder}
                  </Text>
                  <ChevronDown size={12} color={subTextColor} />
                </TouchableOpacity>
                {isBuilderOpen && (
                  <View style={[styles.filterDropdown, { backgroundColor: cardBg, borderColor: borderCol }]}>
                    <TouchableOpacity
                      style={[styles.filterDropdownItem, { backgroundColor: selectedBuilder === 'All' ? borderCol : 'transparent' }]}
                      onPress={() => { setSelectedBuilder('All'); setBuilderOpen(false); }}
                    >
                      <Text style={{ color: textColor, fontSize: 12 }}>All Builders</Text>
                      {selectedBuilder === 'All' && <Check size={12} color={brandCol} />}
                    </TouchableOpacity>
                    {builders.map((b: BuilderItem) => (
                      <TouchableOpacity
                        key={b.builderId}
                        style={[styles.filterDropdownItem, { backgroundColor: selectedBuilder === b.builderName ? borderCol : 'transparent' }]}
                        onPress={() => { setSelectedBuilder(b.builderName); setBuilderOpen(false); }}
                      >
                        <Text style={{ color: textColor, fontSize: 12 }}>{b.builderName}</Text>
                        {selectedBuilder === b.builderName && <Check size={12} color={brandCol} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Purchase Type */}
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: subTextColor }]}>Type</Text>
                <TouchableOpacity
                  style={[styles.filterSelect, { backgroundColor: inputBg, borderColor: selectedPurchaseType !== 'All' ? brandCol : borderCol }]}
                  onPress={() => { setPurchaseTypeOpen(!isPurchaseTypeOpen); setLocationOpen(false); setBuilderOpen(false); setExecOpen(false); setStatusOpen(false); setPriceBandOpen(false); setSortOpen(false); }}
                >
                  <Home size={13} color={selectedPurchaseType !== 'All' ? brandCol : subTextColor} />
                  <Text style={{ color: selectedPurchaseType !== 'All' ? brandCol : textColor, fontSize: 12, flex: 1 }}>
                    {selectedPurchaseType}
                  </Text>
                  <ChevronDown size={12} color={subTextColor} />
                </TouchableOpacity>
                {isPurchaseTypeOpen && (
                  <View style={[styles.filterDropdown, { backgroundColor: cardBg, borderColor: borderCol }]}>
                    {PURCHASE_TYPES.map((pt) => (
                      <TouchableOpacity
                        key={pt}
                        style={[styles.filterDropdownItem, { backgroundColor: selectedPurchaseType === pt ? borderCol : 'transparent' }]}
                        onPress={() => { setSelectedPurchaseType(pt); setPurchaseTypeOpen(false); }}
                      >
                        <Text style={{ color: textColor, fontSize: 12 }}>{pt}</Text>
                        {selectedPurchaseType === pt && <Check size={12} color={brandCol} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Price Band (Web Parity: filterPrice) */}
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: subTextColor }]}>Price Band</Text>
                <TouchableOpacity
                  style={[styles.filterSelect, { backgroundColor: inputBg, borderColor: selectedPriceBand !== 'all' ? brandCol : borderCol }]}
                  onPress={() => { setPriceBandOpen(!isPriceBandOpen); setLocationOpen(false); setBuilderOpen(false); setExecOpen(false); setPurchaseTypeOpen(false); setStatusOpen(false); setSortOpen(false); }}
                >
                  <IndianRupee size={13} color={selectedPriceBand !== 'all' ? brandCol : subTextColor} />
                  <Text style={{ color: selectedPriceBand !== 'all' ? brandCol : textColor, fontSize: 12, flex: 1 }} numberOfLines={1}>
                    {selectedPriceBand === 'all' ? 'All Prices' : selectedPriceBand}
                  </Text>
                  <ChevronDown size={12} color={subTextColor} />
                </TouchableOpacity>
                {isPriceBandOpen && (
                  <View style={[styles.filterDropdown, { backgroundColor: cardBg, borderColor: borderCol }]}>
                    {[
                      { id: 'all', label: 'All Prices' },
                      { id: 'under25l', label: 'Under ₹25 Lakhs' },
                      { id: '25l-50l', label: '₹25L – ₹50 Lakhs' },
                      { id: '50l-1cr', label: '₹50L – ₹1 Crore' },
                      { id: '1cr-2cr', label: '₹1Cr – ₹2 Crore' },
                      { id: 'above2cr', label: 'Above ₹2 Crore' },
                    ].map((pb) => (
                      <TouchableOpacity
                        key={pb.id}
                        style={[styles.filterDropdownItem, { backgroundColor: selectedPriceBand === pb.id ? borderCol : 'transparent' }]}
                        onPress={() => { setSelectedPriceBand(pb.id); setPriceBandOpen(false); }}
                      >
                        <Text style={{ color: textColor, fontSize: 12 }}>{pb.label}</Text>
                        {selectedPriceBand === pb.id && <Check size={12} color={brandCol} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Sort By */}
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: subTextColor }]}>Sort By</Text>
                <TouchableOpacity
                  style={[styles.filterSelect, { backgroundColor: inputBg, borderColor: borderCol }]}
                  onPress={() => { setSortOpen(!isSortOpen); setLocationOpen(false); setBuilderOpen(false); setExecOpen(false); setPurchaseTypeOpen(false); setStatusOpen(false); setPriceBandOpen(false); }}
                >
                  <Layers size={13} color={subTextColor} />
                  <Text style={{ color: textColor, fontSize: 12, flex: 1 }}>
                    {SORT_OPTIONS.find((o) => o.value === sortOrder)?.label}
                  </Text>
                  <ChevronDown size={12} color={subTextColor} />
                </TouchableOpacity>
                {isSortOpen && (
                  <View style={[styles.filterDropdown, { backgroundColor: cardBg, borderColor: borderCol }]}>
                    {SORT_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.filterDropdownItem, { backgroundColor: sortOrder === opt.value ? borderCol : 'transparent' }]}
                        onPress={() => { setSortOrder(opt.value); setSortOpen(false); }}
                      >
                        <Text style={{ color: textColor, fontSize: 12 }}>{opt.label}</Text>
                        {sortOrder === opt.value && <Check size={12} color={brandCol} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Custom Price Range */}
            <View style={styles.priceRangeRow}>
              <IndianRupee size={14} color={subTextColor} />
              <Text style={{ color: subTextColor, fontSize: 12 }}>Custom Price:</Text>
              <TextInput
                style={[styles.priceInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                placeholder="Min"
                placeholderTextColor={subTextColor}
                keyboardType="numeric"
                value={minPrice}
                onChangeText={setMinPrice}
              />
              <Text style={{ color: subTextColor, fontSize: 12 }}>—</Text>
              <TextInput
                style={[styles.priceInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                placeholder="Max"
                placeholderTextColor={subTextColor}
                keyboardType="numeric"
                value={maxPrice}
                onChangeText={setMaxPrice}
              />
            </View>
          </View>
        )}

        {/* ── Error Banner ── */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Results Count ── */}
        {!loading && !error && (
          <View style={styles.resultsBar}>
            <Text style={{ color: subTextColor, fontSize: 13 }}>
              {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} found
            </Text>
          </View>
        )}

        {/* ── Property Cards Grid ── */}
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={brandCol} />
            <Text style={{ color: subTextColor, marginTop: 12 }}>Loading properties...</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {filteredProperties.length > 0 ? (
              visibleProperties.map((item) => (
                <View key={item.propertyId} style={[styles.propertyCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  {/* Tappable card body → property details */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      closeAllDropdowns();
                      router.push({
                        pathname: '/admin/properties/propertydetails',
                        params: { id: item.propertyId }
                      });
                    }}
                  >
                    {/* Image */}
                    <View style={[styles.cardImageWrap, { backgroundColor: inputBg }]}>
                      {(() => {
                        const imageUri = PropertyService.getPropertyImageUri(item);
                        if (imageUri) {
                          return (
                            <ExpoImage
                              source={{ uri: imageUri }}
                              style={styles.cardImage}
                              contentFit="cover"
                              cachePolicy="memory-disk"
                              recyclingKey={`prop_${item.propertyId}`}
                              transition={150}
                            />
                          );
                        }
                        if (item.hasImage) {
                          return (
                            <AuthImage
                              cacheKey={`cover_${item.propertyId}`}
                              fetchFn={() => PropertyService.getPropertyImageBase64(item.propertyId)}
                              style={styles.cardImage}
                              resizeMode="cover"
                              spinnerColor={brandCol}
                              placeholder={
                                <View style={styles.imagePlaceholder}>
                                  <Building size={36} color={subTextColor} />
                                </View>
                              }
                            />
                          );
                        }
                        return (
                          <View style={styles.imagePlaceholder}>
                            <Building size={36} color={subTextColor} />
                            <Text style={{ color: subTextColor, fontSize: 10, marginTop: 4 }}>No Image</Text>
                          </View>
                        );
                      })()}
                      <View style={[styles.purchaseBadge, { backgroundColor: brandCol }]}>
                        <Text style={styles.purchaseBadgeText}>{item.purchaseType}</Text>
                      </View>
                    </View>

                    {/* Card Info */}
                    <View style={{ paddingHorizontal: 14, paddingTop: 12 }}>
                      <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>
                        {item.propertyName}
                      </Text>
                      <Text style={[styles.cardSub, { color: subTextColor }]} numberOfLines={1}>
                        by {item.builderName}
                      </Text>

                      <View style={styles.cardRow}>
                        <MapPin size={12} color={subTextColor} />
                        <Text style={[styles.cardRowText, { color: subTextColor }]} numberOfLines={1}>
                          {item.location}
                        </Text>
                      </View>

                      <View style={styles.cardSpecsRow}>
                        <View style={styles.specItem}>
                          <Maximize2 size={11} color={subTextColor} />
                          <Text style={[styles.specText, { color: textColor }]}>
                            {item.areaSqft ? `${item.areaSqft} sqft` : 'N/A'}
                          </Text>
                        </View>
                        <View style={styles.specItem}>
                          <IndianRupee size={11} color={subTextColor} />
                          <Text style={[styles.specText, { color: brandCol, fontWeight: '700' }]}>
                            {item.price ? `₹${item.price.toLocaleString('en-IN')}` : 'On Request'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Card Footer (outside touchable) */}
                  <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                    <View style={[styles.cardSeparator, { backgroundColor: borderCol }]} />

                    <View style={styles.cardFooter}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <User size={12} color={subTextColor} />
                        <Text style={{ fontSize: 11, color: subTextColor }}>
                          {item.assignedToName || 'Unassigned'}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 10, color: subTextColor }}>
                        {item.createdOn ? item.createdOn.split('T')[0] : ''}
                      </Text>
                    </View>

                    {/* Action Buttons — navigate to screens */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: inputBg }]}
                        onPress={() => {
                          closeAllDropdowns();
                          router.push({
                            pathname: '/admin/properties/flats',
                            params: { propertyId: item.propertyId, propertyName: item.propertyName }
                          });
                        }}
                      >
                        <Layers size={12} color={textColor} />
                        <Text style={{ color: textColor, fontSize: 11, fontWeight: '600' }}>Flats</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: inputBg }]}
                        onPress={() => {
                          closeAllDropdowns();
                          router.push({
                            pathname: '/admin/properties/images',
                            params: { propertyId: item.propertyId, propertyName: item.propertyName }
                          });
                        }}
                      >
                        <ImageIcon size={12} color={textColor} />
                        <Text style={{ color: textColor, fontSize: 11, fontWeight: '600' }}>Photos</Text>
                      </TouchableOpacity>

                      {canEdit('Properties') && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: inputBg }]}
                          onPress={() => {
                            closeAllDropdowns();
                            router.push({
                              pathname: '/admin/properties/add-property',
                              params: { id: item.propertyId }
                            });
                          }}
                        >
                          <Edit size={12} color={brandCol} />
                          <Text style={{ color: brandCol, fontSize: 11, fontWeight: '600' }}>Edit</Text>
                        </TouchableOpacity>
                      )}

                      {canDelete('Properties') && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#ef444415' }]}
                          onPress={() => handleDeleteProperty(item.propertyId, item.propertyName)}
                        >
                          <Trash2 size={12} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noDataCard}>
                <Building size={48} color={subTextColor} />
                <Text style={[styles.noDataTitle, { color: textColor }]}>No Properties Found</Text>
                <Text style={{ color: subTextColor, textAlign: 'center', marginTop: 4, fontSize: 13 }}>
                  No properties matched your filter criteria.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Top Bar
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    zIndex: 100,
  },
  searchBox: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 200,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  iconBtn: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  addButton: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // Inline Dropdown (Export / Operations)
  inlineDropdown: {
    position: 'absolute',
    top: 46,
    left: 0,
    minWidth: 160,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 4,
    zIndex: 999,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  inlineDropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ddivider: {
    height: 1,
    marginHorizontal: 8,
  },

  // Filters Panel
  filtersPanel: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    zIndex: 50,
  },
  filtersPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterGroup: {
    minWidth: 140,
    flex: 1,
    position: 'relative',
    zIndex: 20,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  filterSelect: {
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterDropdown: {
    position: 'absolute',
    top: 62,
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 999,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'scroll' as any,
  },
  filterDropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  priceInput: {
    height: 34,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    width: 80,
  },

  // Results Bar
  resultsBar: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },

  // Error
  errorBanner: {
    backgroundColor: '#ef444415',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: { color: '#ef4444', fontSize: 13, flex: 1 },
  retryBtn: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  retryText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Loader
  loaderContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Grid
  gridContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
  cardImageWrap: {
    height: 155,
    width: '100%',
    position: 'relative',
  },
  cardImage: { width: '100%', height: '100%' },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchaseBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  purchaseBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardSub: { fontSize: 12, marginTop: 2, marginBottom: 4 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  cardRowText: { fontSize: 12 },
  cardSpecsRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 },
  specItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  specText: { fontSize: 12 },
  cardSeparator: { height: 1, marginVertical: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  actionBtn: {
    height: 28,
    borderRadius: 6,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
  },

  // No Data
  noDataCard: {
    width: '100%',
    paddingVertical: 80,
    alignItems: 'center',
  },
  noDataTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
