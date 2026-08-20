import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { FlatItem } from '../../../../admin/models/PropertyTypes';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';

interface FlatsTabProps {
  flats: FlatItem[];
  searchBhk: string;
  setSearchBhk: (val: string) => void;
  propertyId: string;
  propertyName: string;
  onDeleteFlat: (flatId: number) => void;
}

export default function FlatsTab({
  flats,
  searchBhk,
  setSearchBhk,
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

  const getStatusColor = (status: string) => {
    if (status === 'Available') return '#22c55e';
    if (status === 'Sold') return '#ef4444';
    return '#f59e0b';
  };

  return (
    <View style={styles.flatsContainer}>
      {/* Search / Filter bar */}
      <View style={styles.searchBar}>
        <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: borderCol, flex: 1, marginBottom: 0 }]}>
          <Search size={16} color={subTextColor} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Filter by BHK (e.g. 2 BHK)"
            placeholderTextColor={subTextColor}
            value={searchBhk}
            onChangeText={setSearchBhk}
          />
          {searchBhk !== '' && (
            <TouchableOpacity onPress={() => setSearchBhk('')}>
              <X size={14} color={subTextColor} />
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
      {flats.length === 0 ? (
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
                    onPress={() =>
                      router.push({
                        pathname: '/admin/properties/add-flat',
                        params: { propertyId, propertyName, flatId: flat.flatId.toString() },
                      })
                    }
                  >
                    <Edit2 size={14} color={brandCol} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionIconButton, { backgroundColor: '#ef444410' }]}
                    onPress={() => onDeleteFlat(flat.flatId)}
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
});
