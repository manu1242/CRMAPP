import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
  RefreshControl,
  Modal,
  Alert,
  Vibration,
  Dimensions,
  GestureResponderEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Building,
  Plus,
  Trash2,
  Edit,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  Search,
  X,
  BedDouble,
  Bath,
  Car,
  Maximize2,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { PropertyService } from '../../../admin/services/PropertyService';
import { FlatItem } from '../../../admin/models/PropertyTypes';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';

const FLAT_STATUSES = ['All', 'Available', 'Booked', 'Sold'];
const BHK_OPTIONS = ['All', '1 BHK', '2 BHK', '3 BHK', '4 BHK', '5 BHK', 'Studio', 'Duplex'];

export default function FlatsScreen() {
  const router = useRouter();
  const { propertyId, propertyName } = useLocalSearchParams();
  const propId = propertyId ? (Array.isArray(propertyId) ? propertyId[0] : propertyId) : '';
  const propName = propertyName ? (Array.isArray(propertyName) ? propertyName[0] : propertyName) : 'Property';

  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();
  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg;
  const brandCol = adminTheme.brand;

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBhk, setSelectedBhk] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [actionFlat, setActionFlat] = useState<FlatItem | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const handleLongPress = (flat: FlatItem, event?: GestureResponderEvent) => {
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

    setActionFlat(flat);
  };

  const { data: flats = [], isLoading: loading, refetch: fetchFlats } = useQuery({
    queryKey: ['flats', propId],
    queryFn: async () => {
      const res = await PropertyService.getFlats(propId);
      if (!res.success) throw new Error('Failed to load flats.');
      return res.flats || [];
    },
    enabled: !!propId,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFlats();
    setRefreshing(false);
  };

  const filteredFlats = useMemo(() => {
    if (!searchQuery.trim()) return flats;

    const query = searchQuery.trim().toLowerCase();
    const queryNormalized = query.replace(/\s+/g, '');

    return flats.filter((flat) => {
      const flatName = (flat.flatName || '').toLowerCase();
      const blockName = (flat.blockName || '').toLowerCase();
      const floorName = (flat.floorName || '').toLowerCase();
      const bhk = (flat.bhk || '').toLowerCase();
      const bhkNormalized = bhk.replace(/\s+/g, '');
      const propType = (flat.propertyType || '').toLowerCase();

      return (
        flatName.includes(query) ||
        blockName.includes(query) ||
        floorName.includes(query) ||
        bhk.includes(query) ||
        bhkNormalized.includes(queryNormalized) ||
        propType.includes(query)
      );
    });
  }, [flats, searchQuery]);

  const hasActiveFilters = searchQuery !== '' || selectedBhk !== 'All' || selectedStatus !== 'All';

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedBhk('All');
    setSelectedStatus('All');
  };

  const openAddForm = () => {
    router.push({
      pathname: '/admin/properties/add-flat',
      params: { propertyId: propId }
    });
  };

  const openEditForm = (flat: FlatItem) => {
    router.push({
      pathname: '/admin/properties/add-flat',
      params: { propertyId: propId, flatId: flat.flatId }
    });
  };

  const handleDelete = (flatId: number, flatName: string) => {
    Alert.alert(
      'Delete Flat',
      `Are you sure you want to delete "${flatName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await PropertyService.deleteFlat(flatId);
              if (res.success) {
                Toast.show({ type: 'success', text1: 'Deleted', text2: `${flatName} removed.` });
                queryClient.invalidateQueries({ queryKey: ['flats', propId] });
              } else {
                Toast.show({ type: 'error', text1: 'Error', text2: res.message || 'Delete failed.' });
              }
            } catch (err: any) {
              Toast.show({ type: 'error', text1: 'Error', text2: err.message });
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    if (status === 'Available') return '#22c55e';
    if (status === 'Sold') return '#ef4444';
    return '#f59e0b';
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomSpacing, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── Search / Filter bar ── */}
        <View style={styles.searchBar}>
          <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: borderCol, flex: 1 }]}>
            <Search size={16} color={subTextColor} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search flat (e.g. 501, 2BHK, Block A)..."
              placeholderTextColor={subTextColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={15} color={subTextColor} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: brandCol }]} onPress={openAddForm}>
            <Plus size={15} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Add Flat</Text>
          </TouchableOpacity>
        </View>

        {/* ── Flats List ── */}
        {loading && !refreshing ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={brandCol} />
            <Text style={{ color: subTextColor, marginTop: 10 }}>Loading flats...</Text>
          </View>
        ) : filteredFlats.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Layers size={48} color={subTextColor} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              {searchQuery.trim() ? 'No Matching Flats' : 'No Flats Found'}
            </Text>
            <Text style={{ color: subTextColor, textAlign: 'center', marginTop: 4, fontSize: 13 }}>
              {searchQuery.trim()
                ? `No flats match "${searchQuery}". Try a different flat name or BHK.`
                : 'No flats added yet. Tap Add Flat to begin.'}
            </Text>
            {searchQuery.trim() !== '' && (
              <TouchableOpacity
                style={{ backgroundColor: brandCol, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 12 }}
                onPress={() => setSearchQuery('')}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.flatsList}>
            <Text style={{ color: subTextColor, fontSize: 13, marginBottom: 10 }}>
              {searchQuery.trim()
                ? `Found ${filteredFlats.length} of ${flats.length} flat${flats.length !== 1 ? 's' : ''}`
                : `${flats.length} flat${flats.length !== 1 ? 's' : ''} in inventory`}
            </Text>
            {filteredFlats.map((flat) => (
              <TouchableOpacity
                key={flat.flatId}
                activeOpacity={0.88}
                onLongPress={(e) => handleLongPress(flat, e)}
                delayLongPress={350}
                style={[styles.flatCard, { backgroundColor: cardBg, borderColor: borderCol }]}
              >
                {/* Top Info Header */}
                <View style={styles.flatCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.flatCardBlock, { color: subTextColor }]}>
                      {flat.blockName ? `${flat.blockName} Block` : 'Main Block'} • Floor {flat.floorName || '—'}
                    </Text>
                    <Text style={[styles.flatCardTitle, { color: textColor }]}>
                      Flat {flat.flatName}
                    </Text>
                  </View>
                  
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(flat.flatStatus) + '15' }]}>
                    <Text style={{ color: getStatusColor(flat.flatStatus), fontSize: 11, fontWeight: '700' }}>
                      {flat.flatStatus}
                    </Text>
                  </View>
                </View>

                {/* Price and BHK */}
                <View style={styles.flatCardBody}>
                  <View>
                    <Text style={[styles.flatCardPrice, { color: brandCol }]}>
                      {flat.price ? `₹${flat.price.toLocaleString('en-IN')}` : 'Price on Request'}
                    </Text>
                    <Text style={{ color: subTextColor, fontSize: 12, marginTop: 2 }}>
                      {flat.bhk} • {flat.propertyType}
                    </Text>
                  </View>
                </View>

                {/* Specs Divider & Specs Badges */}
                <View style={[styles.flatCardSpecs, { borderTopColor: borderCol }]}>
                  {flat.areaSqft ? (
                    <View style={[styles.specPill, { backgroundColor: inputBg }]}>
                      <Maximize2 size={12} color={subTextColor} />
                      <Text style={[styles.specPillText, { color: textColor }]}>{flat.areaSqft} sqft</Text>
                    </View>
                  ) : null}

                  <View style={[styles.specPill, { backgroundColor: inputBg }]}>
                    <BedDouble size={12} color={subTextColor} />
                    <Text style={[styles.specPillText, { color: textColor }]}>{flat.bedroomCount || '—'} Beds</Text>
                  </View>

                  <View style={[styles.specPill, { backgroundColor: inputBg }]}>
                    <Bath size={12} color={subTextColor} />
                    <Text style={[styles.specPillText, { color: textColor }]}>{flat.bathroomCount || '—'} Baths</Text>
                  </View>

                  {flat.parkingAvailable ? (
                    <View style={[styles.specPill, { backgroundColor: '#22c55e10' }]}>
                      <Car size={12} color="#22c55e" />
                      <Text style={[styles.specPillText, { color: '#22c55e' }]}>Parking</Text>
                    </View>
                  ) : (
                    <View style={[styles.specPill, { backgroundColor: '#ef444410' }]}>
                      <Car size={12} color="#ef4444" />
                      <Text style={[styles.specPillText, { color: '#ef4444' }]}>No Parking</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action Dropdown Modal on Long Press */}
      <Modal
        visible={actionFlat !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setActionFlat(null);
          setMenuPosition(null);
        }}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => {
            setActionFlat(null);
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
                Flat {actionFlat?.flatName}
              </Text>
              <Text style={[styles.dropdownSubtitle, { color: subTextColor }]} numberOfLines={1}>
                {actionFlat?.blockName ? `${actionFlat.blockName} Block • ` : ''}Floor {actionFlat?.floorName || '—'} • {actionFlat?.bhk || ''}
              </Text>
            </View>

            <View style={[styles.dropdownDivider, { backgroundColor: borderCol }]} />

            {/* Edit Option */}
            <TouchableOpacity
              style={styles.dropdownItem}
              activeOpacity={0.7}
              onPress={() => {
                if (!actionFlat) return;
                const flatToEdit = actionFlat;
                setActionFlat(null);
                setMenuPosition(null);
                openEditForm(flatToEdit);
              }}
            >
              <View style={[styles.dropdownIconCircle, { backgroundColor: brandCol + '15' }]}>
                <Edit size={16} color={brandCol} />
              </View>
              <Text style={[styles.dropdownItemText, { color: textColor }]}>Edit Flat</Text>
            </TouchableOpacity>

            {/* Delete Option */}
            <TouchableOpacity
              style={styles.dropdownItem}
              activeOpacity={0.7}
              onPress={() => {
                if (!actionFlat) return;
                const flatToDelete = actionFlat;
                setActionFlat(null);
                setMenuPosition(null);
                handleDelete(flatToDelete.flatId, flatToDelete.flatName);
              }}
            >
              <View style={[styles.dropdownIconCircle, { backgroundColor: '#ef444415' }]}>
                <Trash2 size={16} color="#ef4444" />
              </View>
              <Text style={[styles.dropdownItemText, { color: '#ef4444' }]}>Delete Flat</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },


  // Search bar
  searchBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBox: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  addBtn: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },


  // List
  loaderWrap: { paddingVertical: 60, alignItems: 'center' },
  emptyWrap: { paddingVertical: 80, alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 14 },
  flatsList: { paddingHorizontal: 16 },
  flatCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  flatCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  flatCardBlock: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  flatCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  flatCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  flatCardPrice: {
    fontSize: 20,
    fontWeight: '800',
  },
  flatCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatCardSpecs: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  specPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
