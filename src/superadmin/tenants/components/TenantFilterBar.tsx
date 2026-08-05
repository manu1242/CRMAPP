import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTenantFilterStore } from '../store/tenantStore';

export const TenantFilterBar = React.memo(() => {
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
    <View className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-4">
      {/* Search Row */}
      <View className="flex-row items-center gap-2">
        <View className="flex-1 bg-slate-50 border border-slate-150 rounded-xl px-3 py-1 flex-row items-center">
          <Ionicons name="search-outline" size={16} color="#64748b" />
          <TextInput
            placeholder="Search company, contact, email..."
            placeholderTextColor="#94a3b8"
            className="flex-1 h-9 text-slate-800 ml-2 text-sm bg-transparent"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={toggleExpanded}
          className={`p-2 rounded-xl border ${
            isExpanded ? 'bg-sky-50 border-sky-200' : 'bg-white border-slate-200'
          }`}
        >
          <Ionicons
            name="funnel-outline"
            size={18}
            color={isExpanded ? '#0284c7' : '#64748b'}
          />
        </TouchableOpacity>
      </View>

      {/* Quick Status Pills */}
      <View className="mt-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
          {statuses.map((item) => {
            const isSelected = status === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                onPress={() => setStatus(item.value)}
                className={`px-4 py-1.5 rounded-full border ${
                  isSelected
                    ? 'bg-[#1e73be] border-[#1e73be]'
                    : 'bg-slate-50 border-slate-250'
                } mr-2`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-white' : 'text-slate-600'
                  }`}
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
        <View className="mt-4 pt-4 border-t border-slate-100 gap-4">
          {/* Plan Section */}
          <View>
            <Text className="text-slate-500 text-xxs font-bold uppercase tracking-wider mb-2">
              Filter by Plan
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {plans.map((item) => {
                return (
                  <TouchableOpacity
                    key={item.value}
                    className="bg-slate-50 border border-slate-250 px-3 py-1 rounded-lg"
                    onPress={() => setSearch(item.value === 'all' ? '' : item.value)}
                  >
                    <Text className="text-slate-600 text-xxs font-semibold">
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sort By Section */}
          <View>
            <Text className="text-slate-500 text-xxs font-bold uppercase tracking-wider mb-2">
              Sort By
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {sortFields.map((item) => {
                const isSelected = sortBy === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    onPress={() => setSortBy(item.value)}
                    className={`px-3 py-1 rounded-lg border ${
                      isSelected ? 'bg-sky-50 border-sky-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xxs font-semibold ${
                        isSelected ? 'text-sky-700' : 'text-slate-600'
                      }`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sort Order Toggle */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Text className="text-slate-500 text-xxs font-bold uppercase tracking-wider">
                Sort Order
              </Text>
              <TouchableOpacity
                onPress={toggleSortOrder}
                className="flex-row items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg"
              >
                <Ionicons
                  name={sortOrder === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'}
                  size={14}
                  color="#64748b"
                />
                <Text className="text-slate-600 text-xxs font-semibold">
                  {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={resetFilters}
              className="flex-row items-center gap-1"
            >
              <Ionicons name="refresh-outline" size={14} color="#ef4444" />
              <Text className="text-red-500 font-semibold text-xxs">Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
});

TenantFilterBar.displayName = 'TenantFilterBar';
