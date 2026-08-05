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
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import { useChannelPartners } from '../../../../admin/hooks/useChannelPartners';
import { ChannelPartner } from '../../../../admin/models/ChannelPartnerTypes';
import Toast from 'react-native-toast-message';
import XLSX from 'xlsx';
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

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
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
  };

  const { data, isLoading, isRefetching, refetch } = useChannelPartners(queryParams);

  const partners = data?.data?.items || [];
  const totalCount = data?.data?.totalCount || 0;
  const totalPages = data?.data?.totalPages || 1;

  // Re-fetch when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleExportCSV = () => {
    if (partners.length === 0) {
      Toast.show({ type: 'info', text1: 'No data', text2: 'No records to export.' });
      return;
    }
    let csv = 'Partner ID,Company Name,Contact Person,Email,Phone,Address,Plan,Commission,Status,Created Date\n';
    partners.forEach((p) => {
      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return '';
        let formatted = String(val).replace(/"/g, '""');
        if (formatted.includes(',') || formatted.includes('"') || formatted.includes('\n')) {
          formatted = `"${formatted}"`;
        }
        return formatted;
      };

      csv += [
        p.partnerId,
        escapeCSV(p.companyName),
        escapeCSV(p.contactPerson),
        escapeCSV(p.email),
        escapeCSV(p.phone),
        escapeCSV(p.address),
        escapeCSV(p.subscriptionPlan || 'N/A'),
        `${p.commissionPercentage}%`,
        escapeCSV(p.status),
        p.createdOn ? p.createdOn.split('T')[0] : 'N/A',
      ].join(',') + '\n';
    });

    if (Platform.OS === 'web') {
      const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
        download: `Partners_Export_${new Date().toISOString().split('T')[0]}.csv`,
      });
      a.click();
      Toast.show({ type: 'success', text1: 'Export Success', text2: 'CSV downloaded' });
    } else {
      alert('CSV Export Generated!\nDownload is supported in web mode.');
    }
  };

  const handleExportExcel = () => {
    if (partners.length === 0) {
      Toast.show({ type: 'info', text1: 'No data', text2: 'No records to export.' });
      return;
    }
    const headers = ['Partner ID', 'Company Name', 'Contact Person', 'Email', 'Phone', 'Address', 'Plan', 'Commission', 'Status', 'Created Date'];
    const rows = [
      headers,
      ...partners.map((p) => [
        p.partnerId,
        p.companyName,
        p.contactPerson,
        p.email,
        p.phone,
        p.address || 'N/A',
        p.subscriptionPlan || 'N/A',
        `${p.commissionPercentage}%`,
        p.status,
        p.createdOn ? p.createdOn.split('T')[0] : 'N/A',
      ]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'ChannelPartners');

    if (Platform.OS === 'web') {
      XLSX.writeFile(wb, `Partners_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      Toast.show({ type: 'success', text1: 'Export Success', text2: 'Excel downloaded' });
    } else {
      alert('Excel Export Generated!\nDownload is supported in web mode.');
    }
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
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[brandColor]} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Header summary info */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>Channel Partners</Text>
            <Text style={{ fontSize: 11, color: subTextColor, fontWeight: '500' }}>{totalCount} total</Text>
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
