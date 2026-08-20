/**
 * AuthImage — fetches images through the authenticated axios instance
 * so the Bearer token is sent automatically. Converts response to a
 * base64 data URI and passes it to React Native's <Image>.
 *
 * It uses TanStack Query to manage the fetching state and query caching,
 * and @react-native-async-storage/async-storage to locally cache the base64
 * data URI so subsequent mounts do not trigger API requests.
 *
 * Usage:
 *   <AuthImage
 *     cacheKey={`cover_${propertyId}`}
 *     fetchFn={() => PropertyService.getPropertyImageBase64(propertyId)}
 *     style={styles.cardImage}
 *     resizeMode="cover"
 *     placeholder={<YourPlaceholderView />}
 *   />
 */
import React from 'react';
import { Image, View, ActivityIndicator, ImageStyle, ViewStyle, StyleProp } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthImageProps {
  /** A unique cache key for local storage and React Query caching, e.g., "cover_12" or "upload_45" */
  cacheKey: string;
  /** Async function that returns a base64 data URI string or null */
  fetchFn: () => Promise<string | null>;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  /** Rendered when loading or when fetch returns null */
  placeholder?: React.ReactNode;
  /** Tint color for the activity spinner while loading */
  spinnerColor?: string;
}

export function AuthImage({
  cacheKey,
  fetchFn,
  style,
  resizeMode = 'cover',
  placeholder,
  spinnerColor = '#6366f1',
}: AuthImageProps) {
  const storageKey = `auth_image_${cacheKey}`;

  const { data: dataUri, isLoading } = useQuery({
    queryKey: ['auth_image', cacheKey],
    queryFn: async () => {
      // 1. Try to read from local AsyncStorage cache first
      try {
        const cached = await AsyncStorage.getItem(storageKey);
        if (cached) {
          return cached;
        }
      } catch (err) {
        console.warn('[AuthImage] Error reading AsyncStorage cache:', err);
      }

      // 2. If not cached, call the fetchFn (API call)
      const fetched = await fetchFn();

      // 3. Store successfully fetched base64 string in AsyncStorage
      if (fetched) {
        try {
          await AsyncStorage.setItem(storageKey, fetched);
        } catch (err) {
          console.warn('[AuthImage] Error writing AsyncStorage cache:', err);
        }
      }

      return fetched;
    },
    staleTime: Infinity, // Keep cached data fresh indefinitely (invalidate manually when updated)
    gcTime: Infinity,    // Keep unused data in query cache memory indefinitely
  });

  if (isLoading) {
    return (
      <View style={[style as ViewStyle, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="small" color={spinnerColor} />
      </View>
    );
  }

  if (!dataUri) {
    return <>{placeholder ?? null}</>;
  }

  return (
    <Image
      source={{ uri: dataUri }}
      style={style}
      resizeMode={resizeMode}
    />
  );
}
