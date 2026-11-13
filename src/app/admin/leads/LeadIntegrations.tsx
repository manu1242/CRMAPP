import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Switch,
  Modal,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Share2,
  Check,
  CheckCircle2,
  AlertCircle,
  Settings,
  Zap,
  Trash2,
  Building,
  Layers,
  Key,
  Phone,
  Briefcase,
  Tag,
  Home,
  Grid,
  Users,
  Play,
  X,
  Globe,
  Sliders,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';
import { IntegrationService } from '../../../admin/services/IntegrationService';
import {
  IntegrationItem,
  IntegrationSummary,
  SaveIntegrationConfigPayload,
} from '../../../admin/models/IntegrationTypes';

export default function LeadIntegrationsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const theme = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [clearingTest, setClearingTest] = useState(false);
  const [activeSyncPlatform, setActiveSyncPlatform] = useState<string | null>(null);

  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [summary, setSummary] = useState<IntegrationSummary | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'All' | 'Active' | 'Configured' | 'Inactive'>('All');

  // Edit / Config Modal State
  const [editingItem, setEditingItem] = useState<IntegrationItem | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formEnabled, setFormEnabled] = useState(false);
  const [formPollInterval, setFormPollInterval] = useState('5');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await IntegrationService.getIntegrations();
      if (res?.success && res.data) {
        setIntegrations(res.data.integrations || []);
        setSummary(res.data.summary || null);
        setBaseUrl(res.data.baseUrl || '');
      } else {
        Alert.alert('Notice', res?.message || 'Could not load integrations');
      }
    } catch (err: any) {
      console.error('Error loading integrations:', err);
      Alert.alert('Error', err.message || 'Failed to connect to integration service');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered List
  const filteredList = useMemo(() => {
    return integrations.filter((item) => {
      const matchesSearch =
        item.displayName.toLowerCase().includes(search.toLowerCase()) ||
        item.platform.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (filterTab === 'Active') return item.isEnabled;
      if (filterTab === 'Configured') return item.isConfigured;
      if (filterTab === 'Inactive') return !item.isEnabled;
      return true;
    });
  }, [integrations, search, filterTab]);

  // Toggle Integration
  const handleToggle = async (item: IntegrationItem) => {
    // If not configured yet and trying to toggle ON, open the configure modal immediately!
    if (!item.isConfigured && !item.isEnabled) {
      openEditModal(item, true);
      return;
    }

    const nextState = !item.isEnabled;

    // Optimistically update
    setIntegrations((prev) =>
      prev.map((p) =>
        p.platform === item.platform ? { ...p, isEnabled: nextState } : p
      )
    );
    if (summary) {
      setSummary({
        ...summary,
        activePlatforms: Math.max(0, summary.activePlatforms + (nextState ? 1 : -1)),
      });
    }

    try {
      const res = await IntegrationService.toggleIntegration(item.platform, nextState);
      if (!res?.success) {
        // Revert on failure
        setIntegrations((prev) =>
          prev.map((p) =>
            p.platform === item.platform ? { ...p, isEnabled: item.isEnabled } : p
          )
        );
        if (res?.data?.needsConfig || !item.isConfigured) {
          openEditModal(item, true);
        } else {
          Alert.alert('Notice', res?.message || 'Could not update integration state.');
        }
      }
    } catch (err: any) {
      // Revert on failure
      setIntegrations((prev) =>
        prev.map((p) =>
          p.platform === item.platform ? { ...p, isEnabled: item.isEnabled } : p
        )
      );
      const msg = err?.response?.data?.message || err?.message || 'Failed to update integration state';
      Alert.alert('Toggle Notice', msg);
    }
  };

  // Sync Real Leads
  const handleSyncNow = async (item: IntegrationItem) => {
    setActiveSyncPlatform(item.platform);
    try {
      const res = await IntegrationService.syncNow(item.platform);
      if (res?.success) {
        Alert.alert('Sync Complete', res.message || `Successfully synced leads from ${item.displayName}`);
        loadData(true);
      } else {
        Alert.alert('Sync Failed', res?.message || 'Unable to sync leads');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to sync platform');
    } finally {
      setActiveSyncPlatform(null);
    }
  };

  // Test Sync
  const handleTestSync = async (item: IntegrationItem) => {
    setActiveSyncPlatform(item.platform);
    try {
      const res = await IntegrationService.testSync(item.platform);
      if (res?.success) {
        Alert.alert('Test Sync Success', res.message || `Generated test leads for ${item.displayName}`);
        loadData(true);
      } else {
        Alert.alert('Test Sync Failed', res?.message || 'Unable to generate test leads');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to run test sync');
    } finally {
      setActiveSyncPlatform(null);
    }
  };

  // Sync All Active
  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const res = await IntegrationService.syncAllActive();
      if (res?.success) {
        Alert.alert('Sync Result', res.message || 'Synced all active integrations');
        loadData(true);
      } else {
        Alert.alert('Notice', res?.message || 'No active integrations synced');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to sync all integrations';
      Alert.alert('Notice', msg);
    } finally {
      setSyncingAll(false);
    }
  };

  // Clear Test Leads
  const handleClearTestLeads = () => {
    Alert.alert(
      'Clear Test Leads',
      'Are you sure you want to delete all test leads and reset counters?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setClearingTest(true);
            try {
              const res = await IntegrationService.clearTestLeads();
              if (res?.success) {
                Alert.alert('Cleared', res.message || 'Test leads removed');
                loadData(true);
              } else {
                Alert.alert('Notice', res?.message || 'Could not clear test leads');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to clear test leads');
            } finally {
              setClearingTest(false);
            }
          },
        },
      ]
    );
  };

  // Copy or Share Webhook URL
  const handleShareWebhook = async (url: string, platformName: string) => {
    try {
      await Share.share({
        title: `${platformName} Webhook URL`,
        message: url,
      });
    } catch (error) {
      console.error('Error sharing webhook URL:', error);
    }
  };

  // Open Edit Modal
  const openEditModal = (item: IntegrationItem, defaultEnabled?: boolean) => {
    setEditingItem(item);
    const initialValues: Record<string, string> = {};
    if (item.config) {
      initialValues['ApiKey'] = item.config.apiKey || (item.config as any).ApiKey || '';
      initialValues['ApiSecret'] = item.config.apiSecret || (item.config as any).ApiSecret || '';
      initialValues['AccountId'] = item.config.accountId || (item.config as any).AccountId || '';
      initialValues['AccessToken'] = item.config.accessToken || (item.config as any).AccessToken || '';
      initialValues['RefreshToken'] = item.config.refreshToken || (item.config as any).RefreshToken || '';
      initialValues['ProjectId'] = item.config.projectId || (item.config as any).ProjectId || '';
      initialValues['CampaignId'] = item.config.campaignId || (item.config as any).CampaignId || '';
      initialValues['ExtraConfig'] = item.config.extraConfig || (item.config as any).ExtraConfig || '';
      setFormEnabled(
        defaultEnabled !== undefined
          ? defaultEnabled
          : (item.config.isEnabled ?? (item.config as any).IsEnabled ?? false)
      );
      setFormPollInterval(
        String(item.config.pollIntervalMinutes || (item.config as any).PollIntervalMinutes || 5)
      );
    } else {
      setFormEnabled(defaultEnabled !== undefined ? defaultEnabled : true);
      setFormPollInterval('5');
    }
    setFormValues(initialValues);
  };

  // Save Modal
  const handleSaveConfig = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      const payload: SaveIntegrationConfigPayload = {
        platformName: editingItem.platform,
        apiKey: formValues['ApiKey'],
        apiSecret: formValues['ApiSecret'],
        accountId: formValues['AccountId'],
        accessToken: formValues['AccessToken'],
        refreshToken: formValues['RefreshToken'],
        projectId: formValues['ProjectId'],
        campaignId: formValues['CampaignId'],
        extraConfig: formValues['ExtraConfig'],
        isEnabled: formEnabled,
        pollIntervalMinutes: parseInt(formPollInterval, 10) || 5,
      };

      const res = await IntegrationService.saveConfig(payload);
      if (res?.success) {
        Alert.alert('Success', res.message || `${editingItem.displayName} configured successfully!`);
        setEditingItem(null);
        loadData(true);
      } else {
        Alert.alert('Configuration Error', res?.message || 'Failed to save configuration');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An error occurred while saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const getPlatformIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case 'facebook':
        return <Users size={18} color={color} />;
      case 'google':
        return <Globe size={18} color={color} />;
      case 'building':
        return <Building size={18} color={color} />;
      case 'home':
        return <Home size={18} color={color} />;
      case 'grid':
        return <Grid size={18} color={color} />;
      case 'phone':
        return <Phone size={18} color={color} />;
      case 'briefcase':
        return <Briefcase size={18} color={color} />;
      case 'users':
        return <Users size={18} color={color} />;
      case 'layers':
        return <Layers size={18} color={color} />;
      case 'key':
        return <Key size={18} color={color} />;
      case 'tag':
        return <Tag size={18} color={color} />;
      default:
        return <Globe size={18} color={color} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.primaryBg }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Lead Integrations</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Portals & Ad Campaigns
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => loadData(true)}
          style={[styles.iconBtn, { backgroundColor: theme.inputBg }]}
        >
          <RefreshCw size={16} color={theme.brand} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.contentScroll, { paddingBottom: bottomSpacing + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={theme.brand} />
        }
      >
        {/* Summary Metric Cards */}
        <View style={styles.summaryGrid}>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <View style={[styles.summaryIcon, { backgroundColor: '#3b82f615' }]}>
              <Layers size={16} color="#3b82f6" />
            </View>
            <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
              {summary?.totalPlatforms || 12}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Platforms</Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <View style={[styles.summaryIcon, { backgroundColor: '#10b98115' }]}>
              <Zap size={16} color="#10b981" />
            </View>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>
              {summary?.activePlatforms || 0}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Active</Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <View style={[styles.summaryIcon, { backgroundColor: '#f59e0b15' }]}>
              <Users size={16} color="#f59e0b" />
            </View>
            <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
              {(summary?.totalLeadsSynced || 0).toLocaleString()}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Synced</Text>
          </View>
        </View>

        {/* Global Action Bar */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={handleSyncAll}
            disabled={syncingAll}
            style={[styles.primaryActionBtn, { backgroundColor: theme.brand }]}
          >
            {syncingAll ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <RefreshCw size={14} color="#ffffff" />
                <Text style={styles.primaryActionBtnText}>Sync All Active</Text>
              </>
            )}
          </TouchableOpacity>

          {summary?.hasTestData && (
            <TouchableOpacity
              onPress={handleClearTestLeads}
              disabled={clearingTest}
              style={[styles.secondaryActionBtn, { backgroundColor: '#ef444415', borderColor: '#ef444440' }]}
            >
              {clearingTest ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <>
                  <Trash2 size={14} color="#ef4444" />
                  <Text style={[styles.secondaryActionBtnText, { color: '#ef4444' }]}>Clear Test Leads</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Search & Filter Bar */}
        <View
          style={[
            styles.filterCard,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
        >
          <View style={[styles.searchBox, { backgroundColor: theme.inputBg }]}>
            <Search size={15} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Search portal or platform..."
              placeholderTextColor={theme.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}>
            {(['All', 'Active', 'Configured', 'Inactive'] as const).map((tab) => {
              const isSelected = filterTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setFilterTab(tab)}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isSelected ? theme.brand : theme.inputBg,
                      borderColor: isSelected ? theme.brand : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      { color: isSelected ? '#ffffff' : theme.textSecondary },
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Platforms List */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.brand} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading integrations...
            </Text>
          </View>
        ) : filteredList.length > 0 ? (
          <View style={styles.listContainer}>
            {filteredList.map((item) => {
              const isSyncing = activeSyncPlatform === item.platform;
              return (
                <View
                  key={item.platform}
                  style={[
                    styles.integrationCard,
                    { backgroundColor: theme.cardBg, borderColor: theme.border },
                  ]}
                >
                  {/* Top Bar: Icon, Name & Toggle */}
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.platformIconWrapper, { backgroundColor: `${item.color}18` }]}>
                      {getPlatformIcon(item.icon, item.color)}
                    </View>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.platformTitle, { color: theme.textPrimary }]}>
                          {item.displayName}
                        </Text>
                        <View
                          style={[
                            styles.badgePill,
                            {
                              backgroundColor: item.isEnabled
                                ? '#10b98118'
                                : item.isConfigured
                                ? '#3b82f618'
                                : '#6b728018',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              {
                                color: item.isEnabled
                                  ? '#10b981'
                                  : item.isConfigured
                                  ? '#3b82f6'
                                  : theme.textMuted,
                              },
                            ]}
                          >
                            {item.isEnabled ? 'Active' : item.isConfigured ? 'Configured' : 'Inactive'}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[styles.platformDesc, { color: theme.textSecondary }]}
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                    </View>

                    {/* Enable Switch */}
                    <Switch
                      value={item.isEnabled}
                      onValueChange={() => handleToggle(item)}
                      trackColor={{ false: theme.border, true: `${theme.brand}80` }}
                      thumbColor={item.isEnabled ? theme.brand : '#f4f3f4'}
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                  </View>

                  {/* Sync Details Row */}
                  <View style={[styles.syncInfoRow, { backgroundColor: theme.inputBg }]}>
                    <View style={styles.syncInfoCol}>
                      <Text style={[styles.syncInfoLabel, { color: theme.textSecondary }]}>
                        Leads Synced
                      </Text>
                      <Text style={[styles.syncInfoValue, { color: theme.textPrimary }]}>
                        {item.leadsSynced}
                      </Text>
                    </View>

                    <View style={styles.syncInfoCol}>
                      <Text style={[styles.syncInfoLabel, { color: theme.textSecondary }]}>
                        Last Synced
                      </Text>
                      <Text style={[styles.syncInfoValue, { color: theme.textPrimary }]}>
                        {item.lastSyncedAt
                          ? new Date(item.lastSyncedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Never synced'}
                      </Text>
                    </View>
                  </View>

                  {/* Webhook Preview Box */}
                  <View style={[styles.webhookBox, { borderColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.webhookLabel, { color: theme.textSecondary }]}>
                        Webhook Endpoint
                      </Text>
                      <Text
                        style={[styles.webhookUrlText, { color: theme.textMuted }]}
                        numberOfLines={1}
                      >
                        {item.webhookUrl}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleShareWebhook(item.webhookUrl, item.displayName)}
                      style={[styles.copyBtn, { backgroundColor: theme.inputBg }]}
                    >
                      <Share2 size={13} color={theme.brand} />
                      <Text style={[styles.copyBtnText, { color: theme.brand }]}>Share</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Card Actions */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => openEditModal(item)}
                      style={[
                        styles.cardBtn,
                        { backgroundColor: theme.inputBg, borderColor: theme.border },
                      ]}
                    >
                      <Settings size={13} color={theme.textPrimary} />
                      <Text style={[styles.cardBtnText, { color: theme.textPrimary }]}>Configure</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleTestSync(item)}
                      disabled={isSyncing}
                      style={[
                        styles.cardBtn,
                        { backgroundColor: '#f59e0b12', borderColor: '#f59e0b30' },
                      ]}
                    >
                      {isSyncing ? (
                        <ActivityIndicator size="small" color="#f59e0b" />
                      ) : (
                        <>
                          <Play size={13} color="#f59e0b" />
                          <Text style={[styles.cardBtnText, { color: '#f59e0b' }]}>Test Sync</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {item.isEnabled && (
                      <TouchableOpacity
                        onPress={() => handleSyncNow(item)}
                        disabled={isSyncing}
                        style={[styles.cardBtn, { backgroundColor: theme.brand }]}
                      >
                        {isSyncing ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <>
                            <RefreshCw size={13} color="#ffffff" />
                            <Text style={[styles.cardBtnText, { color: '#ffffff' }]}>Sync Now</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Globe size={40} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Platforms Found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              No lead integration platforms match your search or filter criteria.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Configuration Modal */}
      <Modal visible={!!editingItem} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setEditingItem(null)}
          />

          <View style={[styles.modalSheet, { backgroundColor: theme.cardBg }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {editingItem && (
                  <View
                    style={[
                      styles.platformIconWrapper,
                      { backgroundColor: `${editingItem.color}18`, width: 34, height: 34 },
                    ]}
                  >
                    {getPlatformIcon(editingItem.icon, editingItem.color)}
                  </View>
                )}
                <View>
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                    {editingItem?.displayName}
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                    Configure API Credentials
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => setEditingItem(null)}>
                <X size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Modal Form Scroll */}
            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              {/* Dynamic Fields */}
              {editingItem?.fields.map((field) => {
                const fieldKey = field.key || (field as any).Key;
                const fieldLabel = field.label || (field as any).Label || fieldKey;
                const isRequired = field.required ?? (field as any).Required;
                const isSecret = field.secret ?? (field as any).Secret;

                return (
                  <View key={fieldKey} style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                      {fieldLabel} {isRequired && <Text style={{ color: '#ef4444' }}>*</Text>}
                    </Text>
                    <TextInput
                      style={[
                        styles.formInput,
                        {
                          backgroundColor: theme.inputBg,
                          borderColor: theme.border,
                          color: theme.textPrimary,
                        },
                      ]}
                      placeholder={`Enter ${fieldLabel}`}
                      placeholderTextColor={theme.textMuted}
                      value={formValues[fieldKey] || ''}
                      secureTextEntry={isSecret}
                      autoCapitalize="none"
                      onChangeText={(txt) =>
                        setFormValues((prev) => ({ ...prev, [fieldKey]: txt }))
                      }
                    />
                  </View>
                );
              })}

              {/* Poll Interval */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                  Poll Interval (Minutes)
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.border,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="5"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  value={formPollInterval}
                  onChangeText={setFormPollInterval}
                />
              </View>

              {/* Enable Toggle Switch in Modal */}
              <View
                style={[
                  styles.enableRow,
                  { backgroundColor: theme.inputBg, borderColor: theme.border },
                ]}
              >
                <View>
                  <Text style={[styles.enableTitle, { color: theme.textPrimary }]}>
                    Enable Integration
                  </Text>
                  <Text style={[styles.enableDesc, { color: theme.textSecondary }]}>
                    Allow automatic syncing for this platform
                  </Text>
                </View>
                <Switch
                  value={formEnabled}
                  onValueChange={setFormEnabled}
                  trackColor={{ false: theme.border, true: `${theme.brand}80` }}
                  thumbColor={formEnabled ? theme.brand : '#f4f3f4'}
                />
              </View>

              {/* Webhook Preview in Modal */}
              {editingItem && (
                <View style={[styles.modalWebhookBox, { borderColor: theme.border }]}>
                  <Text style={[styles.webhookLabel, { color: theme.textSecondary }]}>
                    Incoming Webhook Endpoint
                  </Text>
                  <Text
                    style={[styles.webhookUrlText, { color: theme.textPrimary }]}
                    selectable
                  >
                    {editingItem.webhookUrl}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleShareWebhook(editingItem.webhookUrl, editingItem.displayName)}
                    style={[styles.shareModalBtn, { backgroundColor: theme.brand }]}
                  >
                    <Share2 size={13} color="#ffffff" />
                    <Text style={styles.shareModalBtnText}>Share Webhook URL</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View style={styles.modalBottomActions}>
              <TouchableOpacity
                onPress={() => setEditingItem(null)}
                style={[
                  styles.modalCancelBtn,
                  { backgroundColor: theme.inputBg, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.modalCancelBtnText, { color: theme.textPrimary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveConfig}
                disabled={saving}
                style={[styles.modalSaveBtn, { backgroundColor: theme.brand }]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Check size={16} color="#ffffff" />
                    <Text style={styles.modalSaveBtnText}>Save Configuration</Text>
                  </>
                )}
              </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentScroll: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  secondaryActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12.5,
  },
  filterPills: {
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  listContainer: {
    gap: 12,
  },
  integrationCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  platformDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  syncInfoRow: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 8,
    justifyContent: 'space-around',
  },
  syncInfoCol: {
    alignItems: 'center',
  },
  syncInfoLabel: {
    fontSize: 9.5,
    fontWeight: '500',
  },
  syncInfoValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  webhookBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 8,
    gap: 8,
  },
  webhookLabel: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  webhookUrlText: {
    fontSize: 10.5,
    marginTop: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  copyBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  cardBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 240,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '88%',
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  modalFormScroll: {
    maxHeight: 380,
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  formInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 12.5,
  },
  enableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 6,
  },
  enableTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  enableDesc: {
    fontSize: 10.5,
    marginTop: 1,
  },
  modalWebhookBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    marginBottom: 10,
    gap: 6,
  },
  shareModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 4,
  },
  shareModalBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  modalBottomActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  modalSaveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
