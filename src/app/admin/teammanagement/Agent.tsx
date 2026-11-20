import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { Agent as AgentType } from '../../../admin/models/AgentTypes';
import { exportToExcel, exportToCSV } from '../../../Services/exportService';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  FileText,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
  Users,
  ChevronDown,
  Check,
  X,
  TrendingUp,
} from 'lucide-react-native';

import { useAgents, useDeleteAgent, useApproveAgent, useRejectAgent } from '../../../admin/hooks/useAgents';
import Toast from 'react-native-toast-message';
import { useBottomNavSpacing } from '../../../hooks/useBottomNavSpacing';

export default function AgentListScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [type, setType] = useState<'All' | 'Salary' | 'Hybrid' | 'Commission'>('All');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Theme values
  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg;
  const brandColor = adminTheme.brand;

  // Debounce search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Query Params
  const queryParams = {
    page,
    pageSize,
    search: debouncedSearch.trim() || undefined,
    status: status !== 'All' ? status : undefined,
    type: type !== 'All' ? type : undefined,
  };

  const { data, isLoading, isRefetching, refetch, isStale } = useAgents(queryParams);
  const deleteAgentMutation = useDeleteAgent();
  const approveAgentMutation = useApproveAgent();
  const rejectAgentMutation = useRejectAgent();

  const agents: AgentType[] = Array.isArray(data?.data?.items)
    ? data.data.items
    : Array.isArray(data?.data)
    ? (data.data as any)
    : [];
  const totalCount = data?.data?.totalCount || agents.length || 0;
  const totalPages = data?.data?.totalPages || 1;
  const stats = data?.data?.stats;

  // Re-fetch when screen comes back into focus
  // Refetch on return only when the cached data is stale — create/edit/delete mutations
  // already invalidate this query, so a forced refetch on every focus was redundant.
  useFocusEffect(
    useCallback(() => {
      if (isStale) refetch();
    }, [isStale, refetch])
  );

  const handleApproveAgent = (agent: AgentType) => {
    Alert.alert(
      'Approve Agent?',
      `Are you sure you want to approve ${agent.fullName}? An active login account will be provisioned.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Approve',
          onPress: async () => {
            try {
              const res: any = await approveAgentMutation.mutateAsync(agent.agentId);
              // Web parity: approval provisions the login — show the credentials message from the server
              const msg = res?.message || `${agent.fullName} approved successfully`;
              if (res?.data?.password) {
                Alert.alert('Agent Approved', msg);
              } else {
                Toast.show({ type: 'success', text1: 'Approved', text2: msg });
              }
              refetch();
            } catch (err: any) {
              console.error('Failed to approve agent:', err);
              Toast.show({
                type: 'error',
                text1: 'Approval Failed',
                text2: err.response?.data?.message || err.message || 'Failed to approve agent',
              });
            }
          },
        },
      ]
    );
  };

  const handleRejectAgent = (agent: AgentType) => {
    Alert.alert(
      'Reject Agent?',
      `Are you sure you want to reject ${agent.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const res: any = await rejectAgentMutation.mutateAsync(agent.agentId);
              Toast.show({
                type: 'success',
                text1: 'Rejected',
                text2: res?.message || 'Agent rejected successfully.',
              });
              refetch();
            } catch (err: any) {
              console.error('Failed to reject agent:', err);
              Toast.show({
                type: 'error',
                text1: 'Rejection Failed',
                text2: err.response?.data?.message || err.message || 'Failed to reject agent',
              });
            }
          },
        },
      ]
    );
  };

  const handleDeleteAgent = (agent: AgentType) => {
    Alert.alert(
      'Delete Agent',
      `Are you sure you want to delete ${agent.fullName}? This will remove the agent and all documents.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAgentMutation.mutateAsync(agent.agentId);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Agent deleted successfully',
              });
              refetch();
            } catch (err: any) {
              console.error('Failed to delete agent:', err);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.response?.data?.message || err.message || 'Failed to delete agent',
              });
            }
          },
        },
      ]
    );
  };

  const handleExportCSV = async () => {
    await exportToCSV({
      data: agents,
      fileName: `Agents_Export_${new Date().toISOString().split('T')[0]}`,
      columns: [
        { header: 'Agent ID', key: 'agentId' },
        { header: 'Full Name', key: 'fullName' },
        { header: 'Email', key: 'email' },
        { header: 'Phone', key: 'phone' },
        { header: 'Address', key: 'address', formatter: (val) => val || 'N/A' },
        { header: 'Type', key: 'agentType' },
        { header: 'Salary', key: 'salary', formatter: (val) => val || 0 },
        { header: 'Commission Rules', key: 'commissionRules', formatter: (val) => val || 'N/A' },
        { header: 'Status', key: 'status' },
        { header: 'Created Date', key: 'createdOn', formatter: (val) => val ? val.split('T')[0] : 'N/A' },
      ],
    });
  };

  const handleExportExcel = async () => {
    await exportToExcel({
      data: agents,
      fileName: `Agents_Export_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Agents',
      columns: [
        { header: 'Agent ID', key: 'agentId' },
        { header: 'Full Name', key: 'fullName' },
        { header: 'Email', key: 'email' },
        { header: 'Phone', key: 'phone' },
        { header: 'Address', key: 'address', formatter: (val) => val || 'N/A' },
        { header: 'Type', key: 'agentType' },
        { header: 'Salary', key: 'salary', formatter: (val) => val || 0 },
        { header: 'Commission Rules', key: 'commissionRules', formatter: (val) => val || 'N/A' },
        { header: 'Status', key: 'status' },
        { header: 'Created Date', key: 'createdOn', formatter: (val) => val ? val.split('T')[0] : 'N/A' },
      ],
    });
  };

  const getStatusConfig = (statusStr: string) => {
    switch (statusStr.toLowerCase()) {
      case 'approved':
        return { bg: '#10b98115', color: '#10b981', icon: CheckCircle2 };
      case 'rejected':
        return { bg: '#ef444415', color: '#ef4444', icon: XCircle };
      default:
        return { bg: '#eab30815', color: '#eab308', icon: AlertCircle };
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Search & Onboard Row */}
      <View style={{
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: cardBg,
        borderBottomWidth: 1,
        borderBottomColor: borderCol
      }}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: inputBg,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: borderCol,
          }}
          accessibilityLabel="Go Back"
        >
          <ArrowLeft size={18} color={textColor} />
        </TouchableOpacity>

        {/* Search */}
        <View style={{
          flex: 1,
          height: 40,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: borderCol,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: bgColor
        }}>
          <Search size={16} color={subTextColor} style={{ marginRight: 8 }} />
          <TextInput
            style={{ flex: 1, color: textColor, fontSize: 13, padding: 0 }}
            placeholder="Search by name, email, phone..."
            placeholderTextColor={subTextColor}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Lead Tracking Button */}
        <TouchableOpacity
          onPress={() => router.push('/admin/teammanagement/AgentLeadTracking')}
          style={{
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
            borderColor: brandColor,
            borderWidth: 1,
            height: 40,
            paddingHorizontal: 10,
            borderRadius: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
          accessibilityLabel="Agent Lead Tracking"
        >
          <TrendingUp size={15} color={brandColor} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: brandColor }}>Tracking</Text>
        </TouchableOpacity>

        {/* Onboard Button */}
        <TouchableOpacity
          onPress={() => router.push('/admin/teammanagement/CreateAgent')}
          style={{
            backgroundColor: brandColor,
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Filters & Export Row */}
      <View style={{
        paddingHorizontal: 16,
        paddingBottom: 12,
        paddingTop: 12,
        backgroundColor: cardBg,
        borderBottomWidth: 1,
        borderBottomColor: borderCol,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50
      }}>
        {/* Export Buttons */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            onPress={handleExportCSV}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: inputBg,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 12,
              gap: 4
            }}
          >
            <FileSpreadsheet size={12} color={brandColor} />
            <Text style={{ fontSize: 10, fontWeight: '600', color: textColor }}>CSV</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExportExcel}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: inputBg,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 12,
              gap: 4
            }}
          >
            <FileSpreadsheet size={12} color="#10b981" />
            <Text style={{ fontSize: 10, fontWeight: '600', color: textColor }}>Excel</Text>
          </TouchableOpacity>
        </View>

        {/* Select Filters */}
        <View style={{ flexDirection: 'row', flex: 1, gap: 8, marginLeft: 12 }}>
          {/* Type Dropdown */}
          <View style={{ flex: 1, position: 'relative' }}>
            <TouchableOpacity
              onPress={() => {
                setTypeDropdownOpen(!typeDropdownOpen);
                setStatusDropdownOpen(false);
              }}
              style={{
                height: 38,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: borderCol,
                paddingHorizontal: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: bgColor
              }}
            >
              <Text style={{ color: textColor, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
                Type: {type}
              </Text>
              <ChevronDown size={14} color={subTextColor} />
            </TouchableOpacity>

            {typeDropdownOpen && (
              <View style={{
                position: 'absolute',
                top: 42,
                left: 0,
                right: 0,
                backgroundColor: cardBg,
                borderWidth: 1,
                borderColor: borderCol,
                borderRadius: 10,
                paddingVertical: 4,
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 5,
                zIndex: 100
              }}>
                {(['All', 'Salary', 'Hybrid', 'Commission'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => {
                      setType(t);
                      setTypeDropdownOpen(false);
                    }}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      backgroundColor: type === t ? borderCol : 'transparent',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ fontSize: 12, color: textColor }}>{t}</Text>
                    {type === t && <Check size={12} color={brandColor} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Status Dropdown */}
          <View style={{ flex: 1, position: 'relative' }}>
            <TouchableOpacity
              onPress={() => {
                setStatusDropdownOpen(!statusDropdownOpen);
                setTypeDropdownOpen(false);
              }}
              style={{
                height: 38,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: borderCol,
                paddingHorizontal: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: bgColor
              }}
            >
              <Text style={{ color: textColor, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
                Status: {status}
              </Text>
              <ChevronDown size={14} color={subTextColor} />
            </TouchableOpacity>

            {statusDropdownOpen && (
              <View style={{
                position: 'absolute',
                top: 42,
                left: 0,
                right: 0,
                backgroundColor: cardBg,
                borderWidth: 1,
                borderColor: borderCol,
                borderRadius: 10,
                paddingVertical: 4,
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 5,
                zIndex: 100
              }}>
                {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => {
                      setStatus(s);
                      setStatusDropdownOpen(false);
                    }}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      backgroundColor: status === s ? borderCol : 'transparent',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ fontSize: 12, color: textColor }}>{s}</Text>
                    {status === s && <Check size={12} color={brandColor} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Agents List content */}
      {isLoading && !isRefetching ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={{ color: subTextColor, marginTop: 12, fontSize: 12 }}>Loading agent records...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomSpacing, flexGrow: 1, gap: 12 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[brandColor]} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Header (web: "Agent List" banner + TOTAL / PENDING / APPROVED / REJECTED) */}
          <View style={{ paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>Agent List</Text>
            <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>Manage and approve agent onboarding requests</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: 'TOTAL', value: stats?.total ?? totalCount, color: brandColor },
              { label: 'PENDING', value: stats?.pending ?? 0, color: '#f59e0b' },
              { label: 'APPROVED', value: stats?.approved ?? 0, color: '#10b981' },
              { label: 'REJECTED', value: stats?.rejected ?? 0, color: '#ef4444' },
            ].map((st) => (
              <View
                key={st.label}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: borderCol, backgroundColor: cardBg }}
              >
                <Text style={{ fontSize: 16, fontWeight: '800', color: st.color }}>{st.value}</Text>
                <Text style={{ fontSize: 9, fontWeight: '700', color: subTextColor, marginTop: 2 }}>{st.label}</Text>
              </View>
            ))}
          </View>

          {agents.length === 0 ? (
            <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 32, alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
              <Users size={32} color={subTextColor} style={{ marginBottom: 12 }} />
              <Text style={{ color: textColor, fontWeight: '600', fontSize: 14 }}>No Agents Found</Text>
              <Text style={{ color: subTextColor, fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                Try adjusting your search query or filters.
              </Text>
            </View>
          ) : (
            agents.map((agent) => {
              const statusConfig = getStatusConfig(agent.status);
              const StatusIcon = statusConfig.icon;
              return (
                <View key={agent.agentId} style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16 }}>
                  <TouchableOpacity onPress={() => router.push(`/admin/teammanagement/AgentDetails?id=${agent.agentId}`)}>
                    {/* Row 1: Profile Circular Initials & Status */}
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: `${brandColor}15`,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: `${brandColor}30`
                      }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: brandColor }}>
                          {agent.fullName.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{agent.fullName}</Text>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: brandColor, marginTop: 2 }}>{agent.agentType} Agent</Text>
                      </View>

                      <View style={{
                        backgroundColor: statusConfig.bg,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <StatusIcon size={10} color={statusConfig.color} />
                        <Text style={{ color: statusConfig.color, fontSize: 8, fontWeight: '700', textTransform: 'uppercase' }}>
                          {agent.status}
                        </Text>
                      </View>
                    </View>

                    {/* Row 2: Details Grid */}
                    <View style={{ gap: 5, marginBottom: 12, paddingHorizontal: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Mail size={12} color={subTextColor} />
                        <Text style={{ fontSize: 12, color: subTextColor }}>{agent.email}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Phone size={12} color={subTextColor} />
                        <Text style={{ fontSize: 12, color: subTextColor }}>{agent.phone}</Text>
                      </View>
                      {agent.address && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MapPin size={12} color={subTextColor} />
                          <Text style={{ fontSize: 11, color: subTextColor }} numberOfLines={1}>{agent.address}</Text>
                        </View>
                      )}
                    </View>

                    {/* Row 3: Compensation Grid */}
                    <View style={{
                      backgroundColor: bgColor,
                      borderRadius: 10,
                      padding: 8,
                      borderWidth: 1,
                      borderColor: borderCol,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 12
                    }}>
                      <View>
                        <Text style={{ fontSize: 8, color: subTextColor, fontWeight: '700', textTransform: 'uppercase' }}>Salary</Text>
                        <Text style={{ fontSize: 11, color: textColor, fontWeight: '700', marginTop: 1 }}>
                          {agent.salary ? `₹${agent.salary.toLocaleString()}` : '₹0'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 8, color: subTextColor, fontWeight: '700', textTransform: 'uppercase' }}>Commission Rule</Text>
                        <Text style={{ fontSize: 11, color: textColor, fontWeight: '700', marginTop: 1 }}>
                          {agent.commissionRules || 'None'}
                        </Text>
                      </View>
                    </View>

                    {/* Documents Badge */}
                    {agent.agentDocuments && agent.agentDocuments.length > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12, paddingHorizontal: 2 }}>
                        <FileText size={12} color={subTextColor} />
                        <Text style={{ fontSize: 10, color: subTextColor, fontWeight: '600' }}>
                          {agent.agentDocuments.length} verification document(s) uploaded
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Row 4: Actions Bar (Web Parity: Approve, Reject, Edit, Delete) */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    borderTopWidth: 1,
                    borderTopColor: borderCol,
                    paddingTop: 12,
                    gap: 8,
                    flexWrap: 'wrap'
                  }}>
                    {/* Approve Button (Visible for Pending and Rejected) */}
                    {(agent.status.toLowerCase() === 'pending' || agent.status.toLowerCase() === 'rejected') && (
                      <TouchableOpacity
                        onPress={() => handleApproveAgent(agent)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#10b98115',
                          borderWidth: 1,
                          borderColor: '#10b98140',
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 10,
                          gap: 4
                        }}
                      >
                        <Check size={13} color="#10b981" strokeWidth={2.5} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#10b981' }}>Approve</Text>
                      </TouchableOpacity>
                    )}

                    {/* Reject Button (Visible for Pending) */}
                    {agent.status.toLowerCase() === 'pending' && (
                      <TouchableOpacity
                        onPress={() => handleRejectAgent(agent)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#ef444415',
                          borderWidth: 1,
                          borderColor: '#ef444440',
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 10,
                          gap: 4
                        }}
                      >
                        <X size={13} color="#ef4444" strokeWidth={2.5} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#ef4444' }}>Reject</Text>
                      </TouchableOpacity>
                    )}

                    {/* Edit Button */}
                    <TouchableOpacity
                      onPress={() => router.push(`/admin/teammanagement/CreateAgent?id=${agent.agentId}`)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: inputBg,
                        borderWidth: 1,
                        borderColor: borderCol,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 10,
                        gap: 4
                      }}
                    >
                      <Edit2 size={12} color={brandColor} />
                      <Text style={{ fontSize: 11, fontWeight: '600', color: textColor }}>Edit</Text>
                    </TouchableOpacity>

                    {/* Delete Button */}
                    <TouchableOpacity
                      onPress={() => handleDeleteAgent(agent)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#ef444410',
                        borderWidth: 1,
                        borderColor: '#ef444430',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 10,
                        gap: 4
                      }}
                    >
                      <Trash2 size={12} color="#ef4444" />
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#ef4444' }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingHorizontal: 4 }}>
              <TouchableOpacity
                disabled={page <= 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: page <= 1 ? inputBg : cardBg,
                  borderWidth: 1,
                  borderColor: borderCol,
                  opacity: page <= 1 ? 0.5 : 1,
                  gap: 4
                }}
              >
                <ChevronLeft size={16} color={textColor} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>Prev</Text>
              </TouchableOpacity>

              <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor }}>
                Page {page} of {totalPages}
              </Text>

              <TouchableOpacity
                disabled={page >= totalPages}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: page >= totalPages ? inputBg : cardBg,
                  borderWidth: 1,
                  borderColor: borderCol,
                  opacity: page >= totalPages ? 0.5 : 1,
                  gap: 4
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>Next</Text>
                <ChevronRight size={16} color={textColor} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
