import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Switch,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '@/theme/adminTheme';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Shield,
  Calendar as CalendarIcon,
  LogIn,
  X,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  UserCheck,
  UserX,
  FileText,
  Edit2,
  Trash2,
} from 'lucide-react-native';
import {
  userManagementService,
  UserItem,
  UserSummary,
  UserAttendanceCalendarResponse,
  CreateUserPayload,
} from '../../../admin/services/userManagementService';
import { useAuthStore } from '../../../auth/store/authStore';

const MONTHS_LIST = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function ManageUsers() {
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

  const [users, setUsers] = useState<UserItem[]>([]);
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>(['Admin', 'Agent', 'Partner']);

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [page] = useState(1);

  // Dropdown Modals Visibility
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Impersonate Confirmation Popup Modal State
  const [impersonateTargetUser, setImpersonateTargetUser] = useState<UserItem | null>(null);
  const [impersonatingLoading, setImpersonatingLoading] = useState(false);

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserPayload>({
    username: '',
    email: '',
    password: '',
    role: 'Agent',
    phone: '',
    isActive: true,
  });

  // Edit User Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserItem | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    phone: '',
    role: 'Agent',
    isActive: true,
    password: '',
  });

  // Attendance Modal State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [selectedUserForAttendance, setSelectedUserForAttendance] = useState<UserItem | null>(null);
  const [attendanceData, setAttendanceData] = useState<UserAttendanceCalendarResponse | null>(null);
  const [attendanceMonthIndex, setAttendanceMonthIndex] = useState(6); // Default July
  const [attendanceYear, setAttendanceYear] = useState(2026);

  // Fetch Users
  const fetchUsers = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await userManagementService.getUsers({
          search: search.trim() || undefined,
          roleFilter: selectedRole !== 'All' ? selectedRole : undefined,
          statusFilter: selectedStatus !== 'All' ? selectedStatus : undefined,
          page,
          pageSize: 10,
        });

        if (response && response.success !== false) {
          setUsers(response.data || []);
          setSummary(response.summary || null);
          if (response.availableRoles && response.availableRoles.length > 0) {
            setAvailableRoles(response.availableRoles);
          }
        } else {
          setError('Failed to fetch user management data');
          Toast.show({
            type: 'error',
            text1: 'Fetch Error',
            text2: 'Failed to fetch user management data',
          });
        }
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError(err.message || 'Error connecting to user service');
        Toast.show({
          type: 'error',
          text1: 'Connection Error',
          text2: err.message || 'Error connecting to user service',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, selectedRole, selectedStatus, page]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Create User
  const handleCreateUser = async () => {
    if (!createForm.username || !createForm.email) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter username and email.',
      });
      return;
    }

    setCreateLoading(true);
    try {
      const res = await userManagementService.createUser(createForm);
      if (res && res.success) {
        Toast.show({
          type: 'success',
          text1: 'User Created',
          text2: res.message || 'User created successfully!',
        });
        setIsCreateModalOpen(false);
        setCreateForm({
          username: '',
          email: '',
          password: '',
          role: 'Agent',
          phone: '',
          isActive: true,
        });
        fetchUsers();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Creation Failed',
          text2: res.message || 'Failed to create user',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: err.message || 'Server error creating user',
      });
    } finally {
      setCreateLoading(false);
    }
  };

  // Confirm and Execute Impersonate
  const confirmImpersonate = async () => {
    if (!impersonateTargetUser) return;
    setImpersonatingLoading(true);
    try {
      const res = await userManagementService.impersonateUser(impersonateTargetUser.userId);
      if (res && res.success && res.data) {
        setImpersonateTargetUser(null);
        await useAuthStore.getState().impersonate(res.data.token, res.data.user);
        // Route partner-role users to the Partner Dashboard; others go to admin dashboard
        const impersonatedRole = (res.data.user?.role ?? '').toLowerCase();
        if (impersonatedRole === 'partner') {
          router.replace('/admin/PartnerDashboard');
        } else {
          router.replace('/admin/dashboard');
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Impersonation Failed',
          text2: res.message || 'Failed to impersonate user',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Impersonation request failed',
      });
    } finally {
      setImpersonatingLoading(false);
    }
  };

  // Open Edit User Modal
  const handleOpenEdit = (user: UserItem) => {
    setSelectedUserForEdit(user);
    setEditForm({
      username: user.username || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'Agent',
      isActive: user.isActive,
      password: '',
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit User details submission
  const handleUpdateUser = async () => {
    if (!selectedUserForEdit) return;
    if (!editForm.username.trim() || !editForm.email.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Username and email are required.',
      });
      return;
    }

    setEditLoading(true);
    try {
      const payload: any = {
        username: editForm.username.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        isActive: editForm.isActive,
        phone: editForm.phone.trim() || undefined,
      };
      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      const res = await userManagementService.updateUser(selectedUserForEdit.userId, payload);
      if (res && res.success) {
        Toast.show({
          type: 'success',
          text1: 'User Updated',
          text2: res.message || 'User updated successfully!',
        });
        setIsEditModalOpen(false);
        setSelectedUserForEdit(null);
        fetchUsers();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: res.message || 'Failed to update user details',
        });
      }
    } catch (err: any) {
      console.error('Error updating user:', err);
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: err.message || 'Server error updating user',
      });
    } finally {
      setEditLoading(false);
    }
  };

  // Handle User Deactivation (Delete API)
  const handleDeleteUser = (user: UserItem) => {
    Alert.alert(
      'Deactivate User',
      `Are you sure you want to deactivate account for ${user.username}? This will set their account to Inactive.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await userManagementService.deleteUser(user.userId);
              if (res && res.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Account Deactivated',
                  text2: res.message || 'User deactivated successfully',
                });
                fetchUsers();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Deactivation Failed',
                  text2: res.message || 'Failed to deactivate account',
                });
              }
            } catch (err: any) {
              console.error('Error deactivating user:', err);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.message || 'Server error deactivating user',
              });
            }
          },
        },
      ]
    );
  };

  // Open Attendance Modal
  const handleOpenAttendance = async (user: UserItem) => {
    setSelectedUserForAttendance(user);
    setIsAttendanceModalOpen(true);
    fetchAttendanceCalendar(user.userId, MONTHS_LIST[attendanceMonthIndex], attendanceYear);
  };

  const fetchAttendanceCalendar = async (userId: number, month: string, year: number) => {
    setAttendanceLoading(true);
    try {
      const res = await userManagementService.getUserAttendanceCalendar(userId, { month, year });
      if (res && res.success) {
        setAttendanceData(res);
      }
    } catch (err: any) {
      console.error('Error fetching user attendance:', err);
      Toast.show({
        type: 'error',
        text1: 'Attendance Error',
        text2: err.message || 'Error fetching user attendance records',
      });
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Navigate Attendance Month
  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (!selectedUserForAttendance) return;
    let newIndex = attendanceMonthIndex;
    let newYear = attendanceYear;

    if (direction === 'prev') {
      if (attendanceMonthIndex === 0) {
        newIndex = 11;
        newYear -= 1;
      } else {
        newIndex -= 1;
      }
    } else {
      if (attendanceMonthIndex === 11) {
        newIndex = 0;
        newYear += 1;
      } else {
        newIndex += 1;
      }
    }

    setAttendanceMonthIndex(newIndex);
    setAttendanceYear(newYear);
    fetchAttendanceCalendar(selectedUserForAttendance.userId, MONTHS_LIST[newIndex], newYear);
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return { bg: '#10b98115', color: '#10b981', border: '#10b98140' };
      case 'agent':
        return { bg: '#3b82f615', color: '#3b82f6', border: '#3b82f640' };
      case 'partner':
        return { bg: '#f59e0b15', color: '#f59e0b', border: '#f59e0b40' };
      default:
        return { bg: '#64748b15', color: '#64748b', border: '#64748b40' };
    }
  };

  const getAttendanceStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return { bg: '#10b98115', color: '#10b981', border: '#10b98140', icon: CheckCircle };
      case 'absent':
        return { bg: '#ef444415', color: '#ef4444', border: '#ef444440', icon: XCircle };
      case 'half day':
        return { bg: '#f59e0b15', color: '#f59e0b', border: '#f59e0b40', icon: Clock };
      case 'on leave':
      case 'leave':
        return { bg: '#8b5cf615', color: '#8b5cf6', border: '#8b5cf640', icon: CalendarIcon };
      default:
        return { bg: '#64748b15', color: '#64748b', border: '#64748b40', icon: Clock };
    }
  };

  const allRoleOptions = ['All', ...availableRoles];
  const allStatusOptions = ['All', 'Active', 'Inactive'];

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Top Header Bar */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: cardBg,
          borderBottomWidth: 1,
          borderBottomColor: borderCol,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>Manage Users</Text>

        <TouchableOpacity
          onPress={() => setIsCreateModalOpen(true)}
          style={{
            backgroundColor: '#10b981',
            paddingHorizontal: 14,
            height: 38,
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 13 }}>Add User</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchUsers(true)} />
        }
      >
        {/* Search & Dropdown Filters Bar */}
        <View
          style={{
            backgroundColor: cardBg,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: borderCol,
            padding: 12,
            marginBottom: 16,
            gap: 10,
          }}
        >
          {/* Search Box */}
          <View
            style={{
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
              placeholder="Search by username, email, phone..."
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

          {/* Dropdown Filters Row */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* Role Dropdown Trigger */}
            <TouchableOpacity
              onPress={() => setIsRoleDropdownOpen(true)}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: borderCol,
                paddingHorizontal: 12,
                backgroundColor: bgColor,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Filter size={14} color="#3b82f6" />
                <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>
                  Role: <Text style={{ fontWeight: '700', color: '#3b82f6' }}>{selectedRole}</Text>
                </Text>
              </View>
              <ChevronDown size={16} color={subTextColor} />
            </TouchableOpacity>

            {/* Status Dropdown Trigger */}
            <TouchableOpacity
              onPress={() => setIsStatusDropdownOpen(true)}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: borderCol,
                paddingHorizontal: 12,
                backgroundColor: bgColor,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Filter size={14} color="#10b981" />
                <Text style={{ fontSize: 12, color: textColor, fontWeight: '600' }}>
                  Status: <Text style={{ fontWeight: '700', color: '#10b981' }}>{selectedStatus}</Text>
                </Text>
              </View>
              <ChevronDown size={16} color={subTextColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* User List */}
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={{ marginTop: 12, color: subTextColor, fontSize: 13 }}>Loading users...</Text>
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
              onPress={() => fetchUsers()}
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
        ) : users.length === 0 ? (
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
            <Users size={36} color={subTextColor} />
            <Text style={{ color: textColor, fontWeight: '600', marginTop: 10, fontSize: 15 }}>
              No Users Found
            </Text>
            <Text style={{ color: subTextColor, fontSize: 12, marginTop: 4 }}>
              Try adjusting your search query or dropdown filters
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {users.map((u) => {
              const roleBadge = getRoleBadgeStyle(u.role);
              return (
                <View
                  key={u.userId}
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: borderCol,
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
                      {/* Avatar Circle */}
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: '#3b82f615',
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: '#3b82f630',
                        }}
                      >
                        <Text style={{ color: '#3b82f6', fontWeight: '700', fontSize: 16 }}>
                          {u.username ? u.username.charAt(0).toUpperCase() : 'U'}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                            {u.username}
                          </Text>
                          {/* Active / Inactive Badge */}
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 10,
                              backgroundColor: u.isActive ? '#10b98115' : '#ef444415',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: '700',
                                color: u.isActive ? '#10b981' : '#ef4444',
                              }}
                            >
                              {u.isActive ? 'Active' : 'Inactive'}
                            </Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                          <Mail size={13} color={subTextColor} />
                          <Text style={{ fontSize: 12, color: subTextColor }}>{u.email}</Text>
                        </View>

                        {u.phone ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4 }}>
                            <Phone size={13} color={subTextColor} />
                            <Text style={{ fontSize: 12, color: subTextColor }}>{u.phone}</Text>
                          </View>
                        ) : null}

                        <Text style={{ fontSize: 11, color: subTextColor, marginTop: 4 }}>
                          Joined: {u.createdDate || u.createdDateIso || 'N/A'}
                        </Text>
                      </View>
                    </View>

                    {/* Role Chip */}
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                        backgroundColor: roleBadge.bg,
                        borderWidth: 1,
                        borderColor: roleBadge.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Shield size={11} color={roleBadge.color} />
                      <Text style={{ color: roleBadge.color, fontSize: 11, fontWeight: '700' }}>
                        {u.role}
                      </Text>
                    </View>
                  </View>

                  {/* Actions Footer */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 14,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: borderCol,
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    {/* Left Actions (Manage Context) */}
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {/* Edit Button */}
                      <TouchableOpacity
                        onPress={() => handleOpenEdit(u)}
                        style={{
                          padding: 8,
                          borderRadius: 8,
                          backgroundColor: `${adminTheme.brand}10`,
                          borderWidth: 1,
                          borderColor: `${adminTheme.brand}30`,
                        }}
                      >
                        <Edit2 size={13} color={adminTheme.brand} />
                      </TouchableOpacity>

                      {/* Delete (Deactivate) Button */}
                      <TouchableOpacity
                        onPress={() => handleDeleteUser(u)}
                        style={{
                          padding: 8,
                          borderRadius: 8,
                          backgroundColor: '#ef444410',
                          borderWidth: 1,
                          borderColor: '#ef444430',
                        }}
                      >
                        <Trash2 size={13} color="#ef4444" />
                      </TouchableOpacity>
                    </View>

                    {/* Right Actions */}
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {/* Impersonate Button */}
                      <TouchableOpacity
                        onPress={() => setImpersonateTargetUser(u)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: '#8b5cf610',
                          borderWidth: 1,
                          borderColor: '#8b5cf630',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <LogIn size={13} color="#8b5cf6" />
                        <Text style={{ color: '#8b5cf6', fontSize: 11, fontWeight: '700' }}>
                          Impersonate
                        </Text>
                      </TouchableOpacity>

                      {/* Attendance Calendar Button */}
                      <TouchableOpacity
                        onPress={() => handleOpenAttendance(u)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                          backgroundColor: '#3b82f610',
                          borderWidth: 1,
                          borderColor: '#3b82f630',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <CalendarIcon size={13} color="#3b82f6" />
                        <Text style={{ color: '#3b82f6', fontSize: 11, fontWeight: '700' }}>
                          Attendance
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* CUSTOM GLOBAL POPUP MODAL FOR IMPERSONATION */}
      <Modal visible={!!impersonateTargetUser} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 24,
              width: '100%',
              maxWidth: 360,
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#8b5cf620',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#8b5cf640',
              }}
            >
              <LogIn size={28} color="#8b5cf6" />
            </View>

            <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, textAlign: 'center' }}>
              Confirm Impersonation
            </Text>

            <Text style={{ fontSize: 13, color: subTextColor, textAlign: 'center', lineHeight: 18 }}>
              Are you sure you want to log in as user{' '}
              <Text style={{ fontWeight: '700', color: textColor }}>
                {impersonateTargetUser?.username}
              </Text>{' '}
              ({impersonateTargetUser?.role})?
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => setImpersonateTargetUser(null)}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: borderCol,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: subTextColor, fontWeight: '600', fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmImpersonate}
                disabled={impersonatingLoading}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 10,
                  backgroundColor: '#8b5cf6',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {impersonatingLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Impersonate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ROLE DROPDOWN MODAL */}
      <Modal visible={isRoleDropdownOpen} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsRoleDropdownOpen(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, marginBottom: 12 }}>
              Select Role Filter
            </Text>
            {allRoleOptions.map((roleOpt) => {
              const isSelected = selectedRole === roleOpt;
              return (
                <TouchableOpacity
                  key={roleOpt}
                  onPress={() => {
                    setSelectedRole(roleOpt);
                    setIsRoleDropdownOpen(false);
                  }}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: isSelected ? '#3b82f615' : 'transparent',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isSelected ? '700' : '500',
                      color: isSelected ? '#3b82f6' : textColor,
                    }}
                  >
                    {roleOpt}
                  </Text>
                  {isSelected && <Check size={16} color="#3b82f6" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* STATUS DROPDOWN MODAL */}
      <Modal visible={isStatusDropdownOpen} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsStatusDropdownOpen(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, marginBottom: 12 }}>
              Select Status Filter
            </Text>
            {allStatusOptions.map((statusOpt) => {
              const isSelected = selectedStatus === statusOpt;
              return (
                <TouchableOpacity
                  key={statusOpt}
                  onPress={() => {
                    setSelectedStatus(statusOpt);
                    setIsStatusDropdownOpen(false);
                  }}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: isSelected ? '#10b98115' : 'transparent',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isSelected ? '700' : '500',
                      color: isSelected ? '#10b981' : textColor,
                    }}
                  >
                    {statusOpt}
                  </Text>
                  {isSelected && <Check size={16} color="#10b981" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* CREATE USER MODAL */}
      <Modal visible={isCreateModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 20,
              maxHeight: '90%',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>Create New User</Text>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}>
                <X size={20} color={subTextColor} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12 }}>
              {/* Username */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  Full Name / Username *
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
                  placeholder="e.g. Ravi Teja"
                  placeholderTextColor={subTextColor}
                  value={createForm.username}
                  onChangeText={(val) => setCreateForm({ ...createForm, username: val })}
                />
              </View>

              {/* Email */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  Email Address *
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
                  keyboardType="email-address"
                  placeholder="e.g. ravi@example.com"
                  placeholderTextColor={subTextColor}
                  value={createForm.email}
                  onChangeText={(val) => setCreateForm({ ...createForm, email: val })}
                />
              </View>

              {/* Password */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  Password
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
                  secureTextEntry
                  placeholder="Leave blank for default"
                  placeholderTextColor={subTextColor}
                  value={createForm.password}
                  onChangeText={(val) => setCreateForm({ ...createForm, password: val })}
                />
              </View>

              {/* Phone */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 4 }}>
                  Phone Number
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
                  keyboardType="phone-pad"
                  placeholder="e.g. 9876543210"
                  placeholderTextColor={subTextColor}
                  value={createForm.phone}
                  onChangeText={(val) => setCreateForm({ ...createForm, phone: val })}
                />
              </View>

              {/* Role Selection */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 6 }}>
                  User Role
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {['Admin', 'Agent', 'Partner'].map((r) => {
                    const selected = createForm.role === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        onPress={() => setCreateForm({ ...createForm, role: r })}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 7,
                          borderRadius: 8,
                          backgroundColor: selected ? '#3b82f6' : bgColor,
                          borderWidth: 1,
                          borderColor: selected ? '#3b82f6' : borderCol,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: selected ? '700' : '500',
                            color: selected ? '#ffffff' : textColor,
                          }}
                        >
                          {r}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Is Active Switch */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 6,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                  Account Active
                </Text>
                <Switch
                  value={createForm.isActive}
                  onValueChange={(val) => setCreateForm({ ...createForm, isActive: val })}
                  trackColor={{ false: borderCol, true: '#10b981' }}
                />
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setIsCreateModalOpen(false)}
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
                onPress={handleCreateUser}
                disabled={createLoading}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 8,
                  backgroundColor: '#10b981',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {createLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Create User</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* POLISHED HIGH-END ATTENDANCE CALENDAR MODAL */}
      <Modal visible={isAttendanceModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 }}>
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 20,
              maxHeight: '92%',
            }}
          >
            {/* Modal Top Navigation Bar */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: '#3b82f620',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <CalendarIcon size={20} color="#3b82f6" />
                </View>
                <View>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>
                    Attendance Calendar
                  </Text>
                  <Text style={{ fontSize: 12, color: subTextColor }}>
                    Employee Monthly Activity & Time Logs
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setIsAttendanceModalOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: bgColor,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: borderCol,
                }}
              >
                <X size={18} color={subTextColor} />
              </TouchableOpacity>
            </View>

            {/* Selected User Info Header Card */}
            {selectedUserForAttendance && (
              <View
                style={{
                  marginBottom: 16,
                  padding: 14,
                  backgroundColor: bgColor,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: borderCol,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      backgroundColor: '#3b82f620',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#3b82f640',
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#3b82f6' }}>
                      {selectedUserForAttendance.username?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                      {selectedUserForAttendance.username}
                    </Text>
                    <Text style={{ fontSize: 12, color: subTextColor }}>
                      {selectedUserForAttendance.email}
                    </Text>
                  </View>
                </View>

                {/* Role Chip */}
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 10,
                    backgroundColor: '#3b82f615',
                    borderWidth: 1,
                    borderColor: '#3b82f640',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#3b82f6' }}>
                    {selectedUserForAttendance.role}
                  </Text>
                </View>
              </View>
            )}

            {/* Month & Year Navigation Control Bar */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: bgColor,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: borderCol,
                marginBottom: 16,
              }}
            >
              <TouchableOpacity
                onPress={() => handleMonthChange('prev')}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  backgroundColor: cardBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: borderCol,
                }}
              >
                <ChevronLeft size={18} color={textColor} />
              </TouchableOpacity>

              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                  {MONTHS_LIST[attendanceMonthIndex]} {attendanceYear}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleMonthChange('next')}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  backgroundColor: cardBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: borderCol,
                }}
              >
                <ChevronRight size={18} color={textColor} />
              </TouchableOpacity>
            </View>

            {/* Attendance KPI Summary Cards */}
            {attendanceData?.summary && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <View
                  style={{
                    flex: 1,
                    padding: 10,
                    backgroundColor: cardBg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: borderCol,
                    alignItems: 'center',
                  }}
                >
                  <Briefcase size={16} color="#3b82f6" style={{ marginBottom: 4 }} />
                  <Text style={{ fontSize: 10, color: subTextColor, fontWeight: '500' }}>
                    Working
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: textColor, marginTop: 2 }}>
                    {attendanceData.summary.workingDays}
                  </Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    padding: 10,
                    backgroundColor: cardBg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: borderCol,
                    alignItems: 'center',
                  }}
                >
                  <UserCheck size={16} color="#10b981" style={{ marginBottom: 4 }} />
                  <Text style={{ fontSize: 10, color: subTextColor, fontWeight: '500' }}>
                    Present
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#10b981', marginTop: 2 }}>
                    {attendanceData.summary.presentDays}
                  </Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    padding: 10,
                    backgroundColor: cardBg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: borderCol,
                    alignItems: 'center',
                  }}
                >
                  <UserX size={16} color="#ef4444" style={{ marginBottom: 4 }} />
                  <Text style={{ fontSize: 10, color: subTextColor, fontWeight: '500' }}>
                    Absent
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#ef4444', marginTop: 2 }}>
                    {attendanceData.summary.absentDays}
                  </Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    padding: 10,
                    backgroundColor: cardBg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: borderCol,
                    alignItems: 'center',
                  }}
                >
                  <Clock size={16} color="#f59e0b" style={{ marginBottom: 4 }} />
                  <Text style={{ fontSize: 10, color: subTextColor, fontWeight: '500' }}>
                    Pending
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#f59e0b', marginTop: 2 }}>
                    {attendanceData.summary.pendingRequests || 0}
                  </Text>
                </View>
              </View>
            )}

            {/* Daily Attendance Logs List */}
            {attendanceLoading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={{ marginTop: 10, fontSize: 13, color: subTextColor }}>
                  Loading attendance records...
                </Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>
                {attendanceData?.attendance && attendanceData.attendance.length > 0 ? (
                  attendanceData.attendance.map((rec) => {
                    const statusBadge = getAttendanceStatusBadge(rec.status);
                    const StatusIcon = statusBadge.icon;
                    return (
                      <View
                        key={rec.attendanceId || rec.date}
                        style={{
                          padding: 12,
                          backgroundColor: cardBg,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: borderCol,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <View style={{ gap: 4 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>
                              {rec.date}
                            </Text>
                            <Text style={{ fontSize: 12, color: subTextColor, fontWeight: '600' }}>
                              ({rec.dayOfWeek})
                            </Text>
                          </View>

                          {rec.loginTime ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 }}>
                              <Text style={{ fontSize: 11, color: subTextColor }}>
                                In: <Text style={{ fontWeight: '700', color: textColor }}>{rec.loginTime}</Text>
                              </Text>
                              <Text style={{ fontSize: 11, color: subTextColor }}>
                                Out: <Text style={{ fontWeight: '700', color: textColor }}>{rec.logoutTime || 'N/A'}</Text>
                              </Text>
                              {rec.workingHours > 0 ? (
                                <Text style={{ fontSize: 11, color: '#3b82f6', fontWeight: '600' }}>
                                  ({rec.workingHours} hrs)
                                </Text>
                              ) : null}
                            </View>
                          ) : (
                            <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                              No login timestamps recorded
                            </Text>
                          )}
                        </View>

                        {/* Status Badge */}
                        <View
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 10,
                            backgroundColor: statusBadge.bg,
                            borderWidth: 1,
                            borderColor: statusBadge.border,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <StatusIcon size={12} color={statusBadge.color} />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: statusBadge.color }}>
                            {rec.status}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                    <CalendarIcon size={32} color={subTextColor} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textColor, marginTop: 8 }}>
                      No Attendance Logs Found
                    </Text>
                    <Text style={{ fontSize: 12, color: subTextColor, marginTop: 2 }}>
                      No attendance records for {MONTHS_LIST[attendanceMonthIndex]} {attendanceYear}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        visible={isEditModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!editLoading) {
            setIsEditModalOpen(false);
            setSelectedUserForEdit(null);
          }
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={{
              backgroundColor: cardBg,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: borderCol,
              padding: 20,
              gap: 14,
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>Edit User Details</Text>
              <TouchableOpacity
                disabled={editLoading}
                onPress={() => {
                  setIsEditModalOpen(false);
                  setSelectedUserForEdit(null);
                }}
                style={{ padding: 4 }}
              >
                <X size={20} color={textColor} />
              </TouchableOpacity>
            </View>

            {/* Username Input */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor }}>USERNAME *</Text>
              <TextInput
                style={{
                  height: 40,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: borderCol,
                  paddingHorizontal: 12,
                  color: textColor,
                  backgroundColor: bgColor,
                  fontSize: 13,
                }}
                placeholder="Enter username"
                placeholderTextColor={subTextColor}
                value={editForm.username}
                onChangeText={(val) => setEditForm((prev) => ({ ...prev, username: val }))}
              />
            </View>

            {/* Email Input */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor }}>EMAIL ADDRESS *</Text>
              <TextInput
                style={{
                  height: 40,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: borderCol,
                  paddingHorizontal: 12,
                  color: textColor,
                  backgroundColor: bgColor,
                  fontSize: 13,
                }}
                placeholder="email@example.com"
                placeholderTextColor={subTextColor}
                keyboardType="email-address"
                autoCapitalize="none"
                value={editForm.email}
                onChangeText={(val) => setEditForm((prev) => ({ ...prev, email: val }))}
              />
            </View>

            {/* Phone Input */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor }}>PHONE NUMBER</Text>
              <TextInput
                style={{
                  height: 40,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: borderCol,
                  paddingHorizontal: 12,
                  color: textColor,
                  backgroundColor: bgColor,
                  fontSize: 13,
                }}
                placeholder="Enter phone number"
                placeholderTextColor={subTextColor}
                keyboardType="phone-pad"
                value={editForm.phone}
                onChangeText={(val) => setEditForm((prev) => ({ ...prev, phone: val }))}
              />
            </View>

            {/* Optional Password Change Input */}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor }}>PASSWORD (OPTIONAL)</Text>
              <TextInput
                style={{
                  height: 40,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: borderCol,
                  paddingHorizontal: 12,
                  color: textColor,
                  backgroundColor: bgColor,
                  fontSize: 13,
                }}
                placeholder="Leave blank to keep current password"
                placeholderTextColor={subTextColor}
                secureTextEntry
                autoCapitalize="none"
                value={editForm.password}
                onChangeText={(val) => setEditForm((prev) => ({ ...prev, password: val }))}
              />
            </View>

            {/* Role Select Buttons */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: subTextColor }}>USER ROLE *</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {availableRoles.map((r) => {
                  const isSelected = editForm.role === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setEditForm((prev) => ({ ...prev, role: r }))}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 10,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: isSelected ? '#3b82f6' : borderCol,
                        backgroundColor: isSelected ? '#3b82f615' : cardBg,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: isSelected ? '#3b82f6' : textColor }}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Active Switch */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>Account Active Status</Text>
                <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                  Set inactive to restrict account access
                </Text>
              </View>
              <Switch
                value={editForm.isActive}
                onValueChange={(val) => setEditForm((prev) => ({ ...prev, isActive: val }))}
                trackColor={{ false: '#ef444430', true: '#10b98130' }}
                thumbColor={editForm.isActive ? '#10b981' : '#ef4444'}
              />
            </View>

            {/* Action Save Button */}
            <TouchableOpacity
              disabled={editLoading}
              onPress={handleUpdateUser}
              style={{
                backgroundColor: adminTheme.brand,
                padding: 12,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                marginTop: 6,
                opacity: editLoading ? 0.6 : 1,
              }}
            >
              {editLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={16} color="#ffffff" />
                  <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
