import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTenantFilterStore } from '../store/tenantStore';

import { useTheme } from '../../../contexts/ThemeContext';
import { getSuperAdminTheme } from '../../../theme/adminTheme';

export const TenantFilterBar = React.memo(() => {
  const { isDark } = useTheme();
  const superTheme = getSuperAdminTheme(isDark);
  const {
    search,
    status,
    sortBy,
    sortOrder,
    setSearch,
    setStatus,
    setSortBy,
    setSortOrder,
    resetFilters,
  } = useTenantFilterStore();

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearch('');
  }, [setSearch]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [sortOrder, setSortOrder]);

  const statuses = useMemo(
    () => [
      { label: 'All', value: 'all' },
      { label: 'Active', value: 'active' },
      { label: 'Suspended', value: 'suspended' },
      { label: 'Locked', value: 'locked' },
    ],
    []
  );

  const plans = useMemo(
    () => [
      { label: 'All Plans', value: 'all' },
      { label: 'Standard', value: 'Standard' },
      { label: 'Premium', value: 'Premium' },
      { label: 'Premium Plus', value: 'Premium Plus' },
    ],
    []
  );

  const sortFields = useMemo(
    () => [
      { label: 'Company Name', value: 'CompanyName' },
      { label: 'Plan', value: 'Plan' },
      { label: 'Created On', value: 'CreatedOn' },
    ],
    []
  );

  return (
    <View
      style={{
        backgroundColor: superTheme.cardBg,
        borderColor: superTheme.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.2 : 0.02,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      {/* Search Row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: superTheme.inputBg,
            borderColor: superTheme.border,
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 4,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons name="search-outline" size={16} color={superTheme.textMuted} />
          <TextInput
            placeholder="Search company, contact, email..."
            placeholderTextColor={superTheme.textMuted}
            keyboardAppearance={isDark ? 'dark' : 'light'}
            style={{
              flex: 1,
              height: 36,
              color: superTheme.textPrimary,
              marginLeft: 8,
              fontSize: 14,
            }}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={16} color={superTheme.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={toggleExpanded}
          style={{
            padding: 10,
            borderRadius: 12,
            borderWidth: 1,
            backgroundColor: isExpanded
              ? (isDark ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe')
              : superTheme.inputBg,
            borderColor: isExpanded
              ? (isDark ? 'rgba(56, 189, 248, 0.4)' : '#bae6fd')
              : superTheme.border,
          }}
        >
          <Ionicons
            name="funnel-outline"
            size={18}
            color={isExpanded ? superTheme.brand : superTheme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Quick Status Pills */}
      <View style={{ marginTop: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
          {statuses.map((item) => {
            const isSelected = status === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                onPress={() => setStatus(item.value)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 9999,
                  borderWidth: 1,
                  marginRight: 8,
                  backgroundColor: isSelected
                    ? superTheme.brand
                    : superTheme.inputBg,
                  borderColor: isSelected
                    ? superTheme.brand
                    : superTheme.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: isSelected ? '#ffffff' : superTheme.textSecondary,
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Expanded Filters Drawer */}
      {isExpanded && (
        <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: superTheme.border, gap: 16 }}>
          {/* Plan Section */}
          <View>
            <Text style={{ color: superTheme.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Filter by Plan
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {plans.map((item) => {
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={{
                      backgroundColor: superTheme.inputBg,
                      borderColor: superTheme.border,
                      borderWidth: 1,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                    onPress={() => setSearch(item.value === 'all' ? '' : item.value)}
                  >
                    <Text style={{ color: superTheme.textSecondary, fontSize: 11, fontWeight: '600' }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sort By Section */}
          <View>
            <Text style={{ color: superTheme.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Sort By
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {sortFields.map((item) => {
                const isSelected = sortBy === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    onPress={() => setSortBy(item.value)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 8,
                      borderWidth: 1,
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe')
                        : superTheme.inputBg,
                      borderColor: isSelected
                        ? (isDark ? 'rgba(56, 189, 248, 0.4)' : '#bae6fd')
                        : superTheme.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: isSelected ? (isDark ? '#38bdf8' : '#0369a1') : superTheme.textSecondary,
                      }}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sort Order Toggle */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: superTheme.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Sort Order
              </Text>
              <TouchableOpacity
                onPress={toggleSortOrder}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: superTheme.inputBg,
                  borderColor: superTheme.border,
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Ionicons
                  name={sortOrder === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'}
                  size={14}
                  color={superTheme.textSecondary}
                />
                <Text style={{ color: superTheme.textSecondary, fontSize: 11, fontWeight: '600' }}>
                  {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={resetFilters}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons name="refresh-outline" size={14} color="#ef4444" />
              <Text style={{ color: '#ef4444', fontWeight: '600', fontSize: 11 }}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
});

TenantFilterBar.displayName = 'TenantFilterBar';
