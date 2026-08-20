import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import {
  Shield,
  ShieldCheck,
  Search,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Settings,
  Save,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react-native';
import {
  roleManagementService,
  RoleItem,
  RolePermissionsMatrixResponse,
} from '../../../admin/services/roleManagementService';
import { useRolePermissionsStore } from '../../../hooks/useRolePermissionsStore';

export default function RolesManagement() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [search, setSearch] = useState('');



  // Add Role Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newAllowedModules, setNewAllowedModules] = useState('');

  // Fetch Roles
  const fetchRoles = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await roleManagementService.getRoles({
          search: search.trim() || undefined,
        });

        if (response && response.success !== false) {
          const rolesList = response.data || [];
          setRoles(rolesList);
          rolesList.forEach((r) => {
            useRolePermissionsStore.getState().fetchPermissionsForRole(r.roleName);
          });
        } else {
          setError('Failed to fetch role management data');
          Toast.show({
            type: 'error',
            text1: 'Fetch Error',
            text2: 'Failed to fetch role management data',
          });
        }
      } catch (err: any) {
        console.error('Error fetching roles:', err);
        setError(err.message || 'Error connecting to role service');
        Toast.show({
          type: 'error',
          text1: 'Connection Error',
          text2: err.message || 'Error connecting to role service',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search]
  );

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Handle Add Role
  const handleAddRole = async () => {
    if (!newRoleName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a role name.',
      });
      return;
    }

    setAddLoading(true);
    try {
      const res = await roleManagementService.addRole({
        roleName: newRoleName.trim(),
        allowedModules: newAllowedModules.trim(),
      });

      if (res && res.success) {
        Toast.show({
          type: 'success',
          text1: 'Role Created',
          text2: res.message || 'Role created successfully!',
        });
        setIsAddModalOpen(false);
        setNewRoleName('');
        setNewAllowedModules('');
        fetchRoles();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Creation Failed',
          text2: res.message || 'Failed to add role',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: err.message || 'Server error creating role',
      });
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Top Search & Actions Bar */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: cardBg,
          borderBottomWidth: 1,
          borderBottomColor: borderCol,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {/* Search Bar Input */}
        <View
          style={{
            flex: 1,
            height: 40,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: borderCol,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: bgColor,
          }}
        >
          <Search size={16} color={subTextColor} style={{ marginRight: 8 }} />
          <TextInput
            style={{ flex: 1, color: textColor, fontSize: 13 }}
            placeholder="Search roles..."
            placeholderTextColor={subTextColor}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={subTextColor} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Add Role Button */}
        <TouchableOpacity
          onPress={() => setIsAddModalOpen(true)}
          style={{
            backgroundColor: '#10b981',
            paddingHorizontal: 14,
            height: 40,
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 13 }}>Add Role</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchRoles(true)} />
        }
      >
        {/* Roles List */}
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={{ marginTop: 12, color: subTextColor, fontSize: 13 }}>Loading roles...</Text>
          </View>
        ) : error ? (
          <View
            style={{
              padding: 20,
              backgroundColor: '#ef444410',
              borderRadius: 14,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#ef444430',
            }}
          >
            <AlertCircle size={32} color="#ef4444" />
            <Text style={{ color: '#ef4444', fontWeight: '600', marginTop: 8, fontSize: 14 }}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={() => fetchRoles()}
              style={{
                marginTop: 12,
                backgroundColor: '#ef4444',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : roles.length === 0 ? (
          <View
            style={{
              padding: 30,
              backgroundColor: cardBg,
              borderRadius: 14,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: borderCol,
            }}
          >
            <Shield size={36} color={subTextColor} />
            <Text style={{ color: textColor, fontWeight: '600', marginTop: 10, fontSize: 15 }}>
              No Roles Found
            </Text>
            <Text style={{ color: subTextColor, fontSize: 12, marginTop: 4 }}>
              Create a new role to manage user permissions
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {roles.map((r) => (
              <View
                key={r.id}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: borderCol,
                  padding: 16,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>
                        {r.roleName}
                      </Text>
                      {r.roleName === 'Admin' && (
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 10,
                            backgroundColor: '#10b98115',
                          }}
                        >
                          <Text style={{ fontSize: 10, color: '#10b981', fontWeight: '700' }}>
                            Default
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={{ fontSize: 12, color: subTextColor, marginTop: 2 }}>
                      {r.accessType || 'Page-Specific Access Rules'}
                    </Text>

                    {r.allowedModules ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {r.allowedModules.split(',').map((mod) => (
                          <View
                            key={mod}
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6,
                              backgroundColor: bgColor,
                              borderWidth: 1,
                              borderColor: borderCol,
                            }}
                          >
                            <Text style={{ fontSize: 11, color: textColor, fontWeight: '500' }}>
                              {mod.trim()}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>

                  {/* Configure Permissions Button */}
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/admin/usemanagement/RolePermissions', params: { roleName: r.roleName } })}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: '#10b98115',
                      borderWidth: 1,
                      borderColor: '#10b98140',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Settings size={14} color="#10b981" />
                    <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '600' }}>
                      Permissions
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ADD ROLE MODAL */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 20,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>Add New Role</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <X size={20} color={subTextColor} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  Role Name *
                </Text>
                <TextInput
                  style={{
                    height: 42,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    color: textColor,
                    backgroundColor: bgColor,
                    fontSize: 13,
                  }}
                  placeholder="e.g. Sales Manager"
                  placeholderTextColor={subTextColor}
                  value={newRoleName}
                  onChangeText={setNewRoleName}
                />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  Allowed Modules (comma-separated)
                </Text>
                <TextInput
                  style={{
                    height: 42,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    color: textColor,
                    backgroundColor: bgColor,
                    fontSize: 13,
                  }}
                  placeholder="e.g. Leads, Properties, Bookings"
                  placeholderTextColor={subTextColor}
                  value={newAllowedModules}
                  onChangeText={setNewAllowedModules}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => setIsAddModalOpen(false)}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: borderCol,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: subTextColor, fontWeight: '600', fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddRole}
                disabled={addLoading}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 8,
                  backgroundColor: '#10b981',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {addLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Add Role</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}
