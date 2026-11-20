import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import { useChannelPartners } from '../../../../admin/hooks/useChannelPartners';
import { ChannelPartner } from '../../../../admin/models/ChannelPartnerTypes';
import { ChannelPartnerService } from '../../../../admin/services/ChannelPartnerService';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import { exportToExcel, exportToCSV } from '../../../../Services/exportService';
import { useBottomNavSpacing } from '../../../../hooks/useBottomNavSpacing';
import { usePartnerPlanEligibility } from '../../../../admin/hooks/usePartnerPlanEligibility';
import PartnerPlanUpgradeCard from '../../../../admin/components/PartnerPlanUpgradeCard';
import {
  Search,
  Plus,
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
  ChevronLeft,
  ChevronRight,
  Check,
  Building2,
  Layers,
  Globe,
} from 'lucide-react-native';

export default function ChannelPartnerListScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const { bottomSpacing } = useBottomNavSpacing();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const { isEligible: hasPartnerPlanEligibility, isLoading: eligibilityLoading } = usePartnerPlanEligibility();

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
  };

  const { data, isLoading, isRefetching, refetch, isStale } = useChannelPartners(queryParams);
  const teamQc = useQueryClient();
  const syncTeamCaches = () => {
    teamQc.invalidateQueries({ queryKey: ['channelPartners'] });
    teamQc.invalidateQueries({ queryKey: ['channelPartner'] });
    teamQc.invalidateQueries({ queryKey: ['agents'] });
    teamQc.invalidateQueries({ queryKey: ['agent'] });
  };

  const partners = data?.data?.items || [];
  const totalCount = data?.data?.totalCount || 0;
  const stats = data?.data?.stats;
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);

  // Web parity: ManageUsersController.ApprovePartner (provisions the Partner login) / RejectPartner
  const handlePartnerAction = (partner: ChannelPartner, action: 'approve' | 'reject') => {
    const approve = action === 'approve';
    Alert.alert(
      approve ? 'Approve Partner?' : 'Reject Partner?',
      approve
        ? `Approve ${partner.companyName}? A Partner login account will be activated.`
        : `Are you sure you want to reject ${partner.companyName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: approve ? 'Yes, Approve' : 'Yes, Reject',
          style: approve ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setActionBusyId(partner.partnerId);
              const res: any = approve
                ? await ChannelPartnerService.approvePartner(partner.partnerId)
                : await ChannelPartnerService.rejectPartner(partner.partnerId);
              if (approve && res?.data?.password) Alert.alert('Partner Approved', res.message);
              else Toast.show({ type: 'success', text1: approve ? 'Approved' : 'Rejected', text2: res?.message });
              syncTeamCaches();
            } catch (err: any) {
              Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || err.message || 'Action failed' });
            } finally {
              setActionBusyId(null);
            }
          },
        },
      ]
    );
  };
  const totalPages = data?.data?.totalPages || 1;

  // Re-fetch when screen comes back into focus
  // Refetch on return only when the cached data is stale — create/edit/delete mutations
  // already invalidate this query, so a forced refetch on every focus was redundant.
  useFocusEffect(
    useCallback(() => {
      if (isStale) refetch();
    }, [isStale, refetch])
  );

  const handleExportCSV = async () => {
    if (partners.length === 0) {
      Toast.show({ type: 'info', text1: 'No data', text2: 'No records to export.' });
      return;
    }
    await exportToCSV({
      data: partners,
      fileName: `Partners_Export_${new Date().toISOString().split('T')[0]}`,
      columns: [
        { header: 'Partner ID', key: 'partnerId' },
        { header: 'Company Name', key: 'companyName' },
        { header: 'Contact Person', key: 'contactPerson' },
        { header: 'Email', key: 'email' },
        { header: 'Phone', key: 'phone' },
        { header: 'Address', key: 'address', formatter: (val) => val || 'N/A' },
        { header: 'Plan', key: 'subscriptionPlan', formatter: (val) => val || 'N/A' },
        { header: 'Commission', key: 'commissionPercentage', formatter: (val) => `${val}%` },
        { header: 'Status', key: 'status' },
        { header: 'Created Date', key: 'createdOn', formatter: (val) => (val ? val.split('T')[0] : 'N/A') },
      ],
    });
  };

  const handleExportExcel = async () => {
    if (partners.length === 0) {
      Toast.show({ type: 'info', text1: 'No data', text2: 'No records to export.' });
      return;
    }
    await exportToExcel({
      data: partners,
      fileName: `Partners_Export_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'ChannelPartners',
      columns: [
        { header: 'Partner ID', key: 'partnerId' },
        { header: 'Company Name', key: 'companyName' },
        { header: 'Contact Person', key: 'contactPerson' },
        { header: 'Email', key: 'email' },
        { header: 'Phone', key: 'phone' },
        { header: 'Address', key: 'address', formatter: (val) => val || 'N/A' },
        { header: 'Plan', key: 'subscriptionPlan', formatter: (val) => val || 'N/A' },
        { header: 'Commission', key: 'commissionPercentage', formatter: (val) => `${val}%` },
        { header: 'Status', key: 'status' },
        { header: 'Created Date', key: 'createdOn', formatter: (val) => (val ? val.split('T')[0] : 'N/A') },
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

  if (!eligibilityLoading && !hasPartnerPlanEligibility) {
    return (
      <PartnerPlanUpgradeCard
        title="Channel Partners Not Included In Your Plan"
        message="Channel Partner management is only available on plans with Partner capabilities (Enterprise and Unlimited). Upgrade your plan to manage channel partners."
      />
    );
  }

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
            placeholder="Search company, contact, email..."
            placeholderTextColor={subTextColor}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Onboard Button */}
        <TouchableOpacity
          onPress={() => router.push('/admin/teammanagement/channelpartner/createchannel')}
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
          {/* Status Dropdown */}
          <View style={{ flex: 1, position: 'relative' }}>
            <TouchableOpacity
              onPress={() => setStatusDropdownOpen(!statusDropdownOpen)}
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

      {/* Partners List content */}
      {isLoading && !isRefetching ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={brandColor} />
          <Text style={{ color: subTextColor, marginTop: 12, fontSize: 12 }}>Loading partner records...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomSpacing, flexGrow: 1, gap: 12 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[brandColor]} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Header (web: "Channel Partner" banner + Total / Pending / Approved / Rejected) */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>Channel Partner</Text>
            <Text style={{ fontSize: 11, color: subTextColor, fontWeight: '500' }}>{totalCount} total</Text>
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

          {partners.length === 0 ? (
            <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 32, alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
              <Users size={32} color={subTextColor} style={{ marginBottom: 12 }} />
              <Text style={{ color: textColor, fontWeight: '600', fontSize: 14 }}>No Partners Found</Text>
              <Text style={{ color: subTextColor, fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                Try adjusting your search query or status filter.
              </Text>
            </View>
          ) : (
            partners.map((partner) => {
              const statusConfig = getStatusConfig(partner.status);
              const StatusIcon = statusConfig.icon;
              return (
                <TouchableOpacity
                  key={partner.partnerId}
                  onPress={() => router.push(`/admin/teammanagement/channelpartner/PartnerDetails?id=${partner.partnerId}`)}
                  style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor: borderCol, padding: 16 }}
                >
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
                      <Building2 size={20} color={brandColor} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{partner.companyName}</Text>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: brandColor, marginTop: 2 }}>
                        Contact: {partner.contactPerson}
                      </Text>
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
                        {partner.status}
                      </Text>
                    </View>
                  </View>

                  {/* Row 2: Details Grid */}
                  <View style={{ gap: 5, marginBottom: 12, paddingHorizontal: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Mail size={12} color={subTextColor} />
                      <Text style={{ fontSize: 12, color: subTextColor }}>{partner.email}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Phone size={12} color={subTextColor} />
                      <Text style={{ fontSize: 12, color: subTextColor }}>{partner.phone}</Text>
                    </View>
                    {partner.address && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MapPin size={12} color={subTextColor} />
                        <Text style={{ fontSize: 11, color: subTextColor }} numberOfLines={1}>{partner.address}</Text>
                      </View>
                    )}
                  </View>

                  {/* Row 3: Subscription & Commission Grid */}
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
                      <Text style={{ fontSize: 8, color: subTextColor, fontWeight: '700', textTransform: 'uppercase' }}>Subdomain</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Globe size={11} color={textColor} />
                        <Text style={{ fontSize: 11, color: textColor, fontWeight: '700' }}>
                          {partner.subdomain || 'N/A'}
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 8, color: subTextColor, fontWeight: '700', textTransform: 'uppercase' }}>Plan</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Layers size={11} color={textColor} />
                        <Text style={{ fontSize: 11, color: textColor, fontWeight: '700' }}>
                          {partner.subscriptionPlan || 'Trial'}
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 8, color: subTextColor, fontWeight: '700', textTransform: 'uppercase' }}>Commission</Text>
                      <Text style={{ fontSize: 11, color: textColor, fontWeight: '700', marginTop: 2 }}>
                        {partner.commissionPercentage ? `${partner.commissionPercentage}%` : '5%'}
                      </Text>
                    </View>
                  </View>

                  {/* Approve / Reject (web Channel Partner actions) */}
                  {(partner.status === 'Pending' || !partner.status || partner.status === 'Rejected') && (
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                      <TouchableOpacity
                        onPress={() => handlePartnerAction(partner, 'approve')}
                        disabled={actionBusyId === partner.partnerId}
                        style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: '#10b98115', borderWidth: 1, borderColor: '#10b98140' }}
                      >
                        {actionBusyId === partner.partnerId ? (
                          <ActivityIndicator size="small" color="#10b981" />
                        ) : (
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#10b981' }}>Approve</Text>
                        )}
                      </TouchableOpacity>
                      {partner.status !== 'Rejected' && (
                        <TouchableOpacity
                          onPress={() => handlePartnerAction(partner, 'reject')}
                          disabled={actionBusyId === partner.partnerId}
                          style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: '#ef444415', borderWidth: 1, borderColor: '#ef444440' }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#ef4444' }}>Reject</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Documents Badge */}
                  {partner.documents && partner.documents.length > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 2 }}>
                      <FileText size={12} color={subTextColor} />
                      <Text style={{ fontSize: 10, color: subTextColor, fontWeight: '600' }}>
                        {partner.documents.length} document(s) uploaded
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
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
