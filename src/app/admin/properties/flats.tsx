import React, { useEffect, useState } from 'react';
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

const FLAT_STATUSES = ['Available', 'Sold', 'Blocked'];
const BHK_OPTIONS = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5 BHK', 'Studio', 'Duplex'];

export default function FlatsScreen() {
  const router = useRouter();
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
  const [searchBhk, setSearchBhk] = useState('');

  const { data: flats = [], isLoading: loading, refetch: fetchFlats } = useQuery({
    queryKey: ['flats', propId, searchBhk],
    queryFn: async () => {
      const res = await PropertyService.getFlats(propId, searchBhk);
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

  const handleDelete = async (flatId: number, flatName: string) => {
    const performDelete = async () => {
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
    };
    if (Platform.OS === 'web') {
      if (confirm(`Delete flat "${flatName}"?`)) performDelete();
    } else {
      performDelete();
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Available') return '#22c55e';
    if (status === 'Sold') return '#ef4444';
    return '#f59e0b';
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── Search / Filter bar ── */}
        <View style={styles.searchBar}>
          <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: borderCol, flex: 1 }]}>
            <Search size={16} color={subTextColor} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Filter by BHK (e.g. 2 BHK)"
              placeholderTextColor={subTextColor}
              value={searchBhk}
              onChangeText={(t) => { setSearchBhk(t); }}
            />
            {searchBhk !== '' && (
              <TouchableOpacity onPress={() => { setSearchBhk(''); }}>
                <X size={14} color={subTextColor} />
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
        ) : flats.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Layers size={48} color={subTextColor} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>No Flats Found</Text>
            <Text style={{ color: subTextColor, textAlign: 'center', marginTop: 4, fontSize: 13 }}>
              {searchBhk ? `No flats match "${searchBhk}"` : 'No flats added yet. Tap Add Flat to begin.'}
            </Text>
          </View>
        ) : (
          <View style={styles.flatsList}>
            <Text style={{ color: subTextColor, fontSize: 13, marginBottom: 10 }}>
              {flats.length} flat{flats.length !== 1 ? 's' : ''} in inventory
            </Text>
            {flats.map((flat) => (
              <View key={flat.flatId} style={[styles.flatCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
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

                  {/* Edit/Delete Actions */}
                  <View style={styles.flatCardActions}>
                    <TouchableOpacity
                      style={[styles.actionIconButton, { backgroundColor: inputBg }]}
                      onPress={() => openEditForm(flat)}
                    >
                      <Edit size={14} color={brandCol} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionIconButton, { backgroundColor: '#ef444410' }]}
                      onPress={() => handleDelete(flat.flatId, flat.flatName)}
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </TouchableOpacity>
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
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
});
