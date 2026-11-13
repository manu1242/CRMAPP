import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Building2, MapPin, Layers, Home, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { PropertyItem } from '../models/PropertyTypes';
import { PropertyService } from '../services/PropertyService';
import { AuthImage } from '../../components/AuthImage';

interface PropertyCardProps {
  property: PropertyItem;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const brandCol = adminTheme.brand;
  const inputBg = adminTheme.inputBg;

  const photoUri = PropertyService.getPropertyImageUri(property);

  const formatPrice = (price?: number | string | null) => {
    if (!price) return 'Price on Request';
    const num = Number(price);
    if (isNaN(num) || num <= 0) return 'Price on Request';
    if (num >= 10000000) return `₹ ${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹ ${(num / 100000).toFixed(2)} L`;
    return `₹ ${num.toLocaleString('en-IN')}`;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push({ pathname: '/admin/properties/propertydetails', params: { id: property.propertyId } })}
      style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}
    >
      {/* Cover Image */}
      <View style={[styles.imageContainer, { backgroundColor: inputBg }]}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.image} resizeMode="cover" />
        ) : property.hasImage && property.propertyId ? (
          <AuthImage
            cacheKey={`prop_${property.propertyId}`}
            fetchFn={() => PropertyService.getPropertyImageBase64(property.propertyId)}
            style={styles.image}
            resizeMode="cover"
            placeholder={
              <View style={[styles.image, styles.placeholderWrap]}>
                <Building2 size={32} color={subTextColor} />
              </View>
            }
          />
        ) : (
          <View style={[styles.image, styles.placeholderWrap]}>
            <Building2 size={32} color={subTextColor} />
          </View>
        )}

        {/* Status Pill Badge over image */}
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>
            {property.inventory || 'Available'}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {property.propertyName}
          </Text>
          <Text style={[styles.developer, { color: subTextColor }]} numberOfLines={1}>
            {property.developer || property.builderName || 'Developer Partner'}
          </Text>
        </View>

        <Text style={[styles.price, { color: brandCol }]}>
          {formatPrice(property.price)}
        </Text>

        {/* Location & Details */}
        <View style={styles.metaRow}>
          {property.location ? (
            <View style={styles.metaItem}>
              <MapPin size={12} color={subTextColor} />
              <Text style={[styles.metaText, { color: subTextColor }]} numberOfLines={1}>
                {property.location}
              </Text>
            </View>
          ) : null}

          {property.areaSqft ? (
            <View style={styles.metaItem}>
              <Layers size={12} color={subTextColor} />
              <Text style={[styles.metaText, { color: subTextColor }]}>
                {property.areaSqft} sq.ft
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  imageContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    padding: 12,
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  developer: {
    fontSize: 12,
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
});
