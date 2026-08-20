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
import Toast, { BaseToast } from 'react-native-toast-message';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
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
import { useUserStore } from '../../../admin/store/useUserStore';

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

  // Subscribe to Zustand Store
  const {
    users,
    summary,
    availableRoles,
    isLoading: loading,
    isRefreshing: refreshing,
    error,
    search,
    selectedRole,
    selectedStatus,
    page,
    fetchUsers,
    setSearch,
    setSelectedRole,
    setSelectedStatus,
    setPage,
  } = useUserStore();

  // Dropdown Modals Visibility
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Impersonate Confirmation Popup Modal State
  const [impersonateTargetUser, setImpersonateTargetUser] = useState<UserItem | null>(null);
  const [impersonatingLoading, setImpersonatingLoading] = useState(false);

  // Deactivate Confirmation State
  const [deactivateTargetUser, setDeactivateTargetUser] = useState<UserItem | null>(null);

  // Attendance Modal State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [selectedUserForAttendance, setSelectedUserForAttendance] = useState<UserItem | null>(null);
  const [attendanceData, setAttendanceData] = useState<UserAttendanceCalendarResponse | null>(null);
  const [attendanceMonthIndex, setAttendanceMonthIndex] = useState(6); // Default July
  const [attendanceYear, setAttendanceYear] = useState(2026);

  // Initial fetch and fetch on filter modification
  useEffect(() => {
    fetchUsers();
  }, [search, selectedRole, selectedStatus, page]);

  // Refetch when screen is focused (returning from Create/Edit User)
  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );



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

  // Open Edit User Page
  const handleOpenEdit = (user: UserItem) => {
    router.push({
      pathname: '/admin/usemanagement/EditUser',
      params: {
        userId: String(user.userId),
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'Agent',
        isActive: String(user.isActive),
      },
    });
  };

  // Handle User Deactivation (Delete API)
  const handleDeleteUser = (user: UserItem) => {
    setDeactivateTargetUser(user);
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
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
                placeholder="Search by username, email, phone..."
                placeholderTextColor={subTextColor}
                value={search}
                onChangeText={setSearch}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')} style={{ marginRight: 8 }}>
                  <X size={16} color={subTextColor} />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => router.push('/admin/usemanagement/CreateUser')}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#10b981',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Plus size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Dropdown Filters Row */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* Role Dropdown Trigger */}
            <TouchableOpacity
              onPress={() => {
                setIsRoleDropdownOpen(!isRoleDropdownOpen);
                setIsStatusDropdownOpen(false);
              }}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: isRoleDropdownOpen ? '#3b82f6' : borderCol,
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
              onPress={() => {
                setIsStatusDropdownOpen(!isStatusDropdownOpen);
                setIsRoleDropdownOpen(false);
              }}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: isStatusDropdownOpen ? '#10b981' : borderCol,
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

          {/* Inline Role Dropdown Panel */}
          {isRoleDropdownOpen && (
            <View
              style={{
                backgroundColor: cardBg,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: borderCol,
                padding: 6,
                marginTop: 4,
                gap: 2,
              }}
            >
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
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: isSelected ? '#3b82f612' : 'transparent',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: isSelected ? '700' : '500',
                        color: isSelected ? '#3b82f6' : textColor,
                      }}
                    >
                      {roleOpt}
                    </Text>
                    {isSelected && <Check size={14} color="#3b82f6" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Inline Status Dropdown Panel */}
          {isStatusDropdownOpen && (
            <View
              style={{
                backgroundColor: cardBg,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: borderCol,
                padding: 6,
                marginTop: 4,
                gap: 2,
              }}
            >
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
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: isSelected ? '#10b98112' : 'transparent',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: isSelected ? '700' : '500',
                        color: isSelected ? '#10b981' : textColor,
                      }}
                    >
                      {statusOpt}
                    </Text>
                    {isSelected && <Check size={14} color="#10b981" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
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
                              borderRadius: 4,
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
                        borderRadius: 8,
                        backgroundColor: roleBadge.bg,
                        borderWidth: 1,
                        borderColor: roleBadge.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
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
                    <View style={{ flexDirection: 'row', gap: 18 }}>
                      {/* Edit Button */}
                      <TouchableOpacity
                        onPress={() => handleOpenEdit(u)}
                      >
                        <Edit2 size={18} color={adminTheme.brand} />
                      </TouchableOpacity>

                      {/* Delete (Deactivate) Button */}
                      <TouchableOpacity
                        onPress={() => handleDeleteUser(u)}
                      >
                        <Trash2 size={18} color="#ef4444" />
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

      {/* ROLE and STATUS DROPDOWN MODALS removed (uses inline selectors now) */}

      {/* CREATE USER MODAL removed (uses standalone CreateUser screen) */}

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

      {/* Edit User Modal removed (uses standalone EditUser screen) */}

      {/* Sleek Toast-like Confirmation Overlay Card */}
      {deactivateTargetUser && (
        <View
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            backgroundColor: cardBg,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#ef444450',
            padding: 16,
            flexDirection: 'column',
            gap: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
            zIndex: 9999,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#ef444415',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Trash2 size={18} color="#ef4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>
                Deactivate User?
              </Text>
              <Text style={{ fontSize: 12, color: subTextColor, marginTop: 2 }}>
                Are you sure you want to deactivate {deactivateTargetUser.username}?
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
            <TouchableOpacity
              onPress={() => setDeactivateTargetUser(null)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: borderCol,
                backgroundColor: bgColor,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                const target = deactivateTargetUser;
                setDeactivateTargetUser(null);
                try {
                  const res = await userManagementService.deleteUser(target.userId);
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
              }}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: '#ef4444',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#ffffff' }}>Deactivate</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
