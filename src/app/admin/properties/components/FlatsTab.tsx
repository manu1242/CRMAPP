import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  Vibration,
  Dimensions,
  GestureResponderEvent,
} from 'react-native';
import {
  Search,
  X,
  Plus,
  Layers,
  BedDouble,
  Bath,
  Car,
  Maximize2,
  Trash2,
  Edit2,
  Filter,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { FlatItem } from '../../../../admin/models/PropertyTypes';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';

interface FlatsTabProps {
  flats: FlatItem[];
  searchBhk?: string;
  setSearchBhk?: (val: string) => void;
  propertyId: string;
  propertyName: string;
  onDeleteFlat: (flatId: number) => void;
}

export default function FlatsTab({
  flats,
  propertyId,
  propertyName,
  onDeleteFlat,
}: FlatsTabProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const cardBg = adminTheme.cardBg;
  const borderCol = adminTheme.border;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const brandCol = adminTheme.brand;
  const inputBg = adminTheme.inputBg;

  const [searchQuery, setSearchQuery] = useState('');
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

  const confirmDeleteFlat = (flat: FlatItem) => {
    Alert.alert(
      'Delete Flat',
      `Are you sure you want to delete Flat "${flat.flatName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteFlat(flat.flatId),
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    if (status === 'Available') return '#22c55e';
    if (status === 'Booked') return '#3b82f6';
    if (status === 'Sold') return '#ef4444';
    return '#f59e0b';
  };

  // Filter flats strictly by Search query (Flat Name, BHK, Block, Floor)
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

  return (
    <View style={styles.flatsContainer}>
      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: borderCol, flex: 1, marginBottom: 0 }]}>
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
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: brandCol, marginLeft: 10 }]}
          onPress={() =>
            router.push({
              pathname: '/admin/properties/add-flat',
              params: { propertyId, propertyName },
            })
          }
        >
          <Plus size={15} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Add Flat</Text>
        </TouchableOpacity>
      </View>

      {/* Flats List */}
      {filteredFlats.length === 0 ? (
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
              style={[styles.clearBtn, { backgroundColor: brandCol, marginTop: 14 }]}
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
                    {flat.bhk} • {flat.propertyType || 'Apartment'}
                    {flat.costPerSqft ? ` • ₹${flat.costPerSqft}/sqft` : ''}
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
                router.push({
                  pathname: '/admin/properties/add-flat',
                  params: {
                    propertyId,
                    propertyName,
                    flatId: flatToEdit.flatId.toString(),
                  },
                });
              }}
            >
              <View style={[styles.dropdownIconCircle, { backgroundColor: brandCol + '15' }]}>
                <Edit2 size={16} color={brandCol} />
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
                confirmDeleteFlat(flatToDelete);
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
  flatsContainer: {
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchBox: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    height: 44,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  flatsList: {
    gap: 12,
  },
  flatCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  flatCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  flatCardBlock: {
    fontSize: 11,
    fontWeight: '600',
  },
  flatCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  flatCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  flatCardPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  flatCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flatCardSpecs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  specPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  specPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  filterPillScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPillText: {
    fontSize: 12,
  },
  clearBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
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
