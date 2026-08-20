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
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import Toast from 'react-native-toast-message';
import {
  UserX,
  Search,
  CheckSquare,
  Square,
  UserPlus,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Home,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react-native';
import { UnassignedLeadService } from '../../../admin/services/UnassignedLeadService';
import { UnassignedLeadItem } from '../../../admin/models/UnassignedLeadTypes';

// List of active organization users / executives for assignment selection
const AGENT_OPTIONS = [
  { id: 5, name: 'Executive Agent 5 (Rahul)', role: 'Agent' },
  { id: 2, name: 'Ramesh Kumar', role: 'Agent' },
  { id: 3, name: 'Neha Sharma', role: 'Agent' },
  { id: 4, name: 'Sanjay Gupta', role: 'Manager' },
];

export default function UnassignedLeadsScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const adminTheme = getAdminTheme(isDark);

  // Color tokens
  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg;
  const brandCol = adminTheme.brand;

  // State
  const [leads, setLeads] = useState<UnassignedLeadItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Selection state
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);

  // Assign Executive Modal state
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [selectedExecutiveId, setSelectedExecutiveId] = useState<number>(5);
  const [assignLoading, setAssignLoading] = useState<boolean>(false);

  // Delete Lead Modal state
  const [deleteLeadTarget, setDeleteLeadTarget] = useState<UnassignedLeadItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Fetch unassigned leads
  const fetchUnassignedLeads = useCallback(async (currentPage: number, searchQuery: string) => {
    try {
      setLoading(true);
      const res = await UnassignedLeadService.getUnassignedLeads(currentPage, 10, searchQuery);
      if (res && res.success && res.data && res.data.items) {
        setLeads(res.data.items);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.totalCount || res.data.items.length);
      } else {
        setLeads([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (err) {
      setLeads([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUnassignedLeads(page, search);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [page, search, fetchUnassignedLeads]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUnassignedLeads(page, search);
  };

  const handleSearchChange = (text: string) => {
    setSearch(text);
    setPage(1); // Reset page to 1 for a new search query
  };

  // Toggle selection of lead
  const toggleSelectLead = (id: number) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all visible leads
  const toggleSelectAll = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((l) => l.leadId));
    }
  };

  // Assign Executive action
  const handleAssignSubmit = async () => {
    if (selectedLeadIds.length === 0) return;
    try {
      setAssignLoading(true);
      const res = await UnassignedLeadService.assignExecutive({
        leadIds: selectedLeadIds,
        executiveId: selectedExecutiveId,
      });

      Toast.show({
        type: 'success',
        text1: 'Leads Assigned',
        text2: res.message || `${selectedLeadIds.length} lead(s) assigned successfully.`,
      });

      setSelectedLeadIds([]);
      setShowAssignModal(false);
      fetchUnassignedLeads(page, search);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Assignment Failed',
        text2: 'Could not assign leads to executive.',
      });
    } finally {
      setAssignLoading(false);
    }
  };

  // Delete Lead action
  const handleDeleteSubmit = async () => {
    if (!deleteLeadTarget) return;
    try {
      setDeleteLoading(true);
      const res = await UnassignedLeadService.deleteLead(deleteLeadTarget.leadId);

      Toast.show({
        type: 'success',
        text1: 'Lead Deleted',
        text2: res.message || `Lead #${deleteLeadTarget.leadId} deleted successfully.`,
      });

      setDeleteLeadTarget(null);
      fetchUnassignedLeads(page, search);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: 'Failed to delete unassigned lead.',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleNavigateToLead = (leadId: number) => {
    if (leadId) {
      router.push(`/admin/leads/${leadId}`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Search and Action Bar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', gap: 10 }}>
        {/* Search Input Box */}
        <View
          style={{
            flex: 1,
            height: 42,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: borderCol,
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: cardBg,
          }}
        >
          <Search size={16} color={subTextColor} style={{ marginRight: 8 }} />
          <TextInput
            style={{ flex: 1, color: textColor, fontSize: 13 }}
            placeholder="Search unassigned leads..."
            placeholderTextColor={subTextColor}
            value={search}
            onChangeText={handleSearchChange}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => handleSearchChange('')}>
              <X size={16} color={subTextColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Dynamic Action Button / Count Badge */}
        {selectedLeadIds.length > 0 ? (
          <TouchableOpacity
            onPress={() => setShowAssignModal(true)}
            style={{
              backgroundColor: brandCol,
              paddingHorizontal: 16,
              height: 42,
              borderRadius: 14,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              gap: 6,
            }}
          >
            <UserPlus size={14} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>
              Assign ({selectedLeadIds.length})
            </Text>
          </TouchableOpacity>
        ) : (
          <View
            style={{
              paddingHorizontal: 14,
              height: 42,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: borderCol,
              backgroundColor: inputBg,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor }}>
              {totalCount} Unassigned
            </Text>
          </View>
        )}
      </View>

      {/* Selection Header Bar */}
      {leads.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: cardBg,
            borderBottomWidth: 1,
            borderBottomColor: borderCol,
          }}
        >
          <TouchableOpacity
            onPress={toggleSelectAll}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            {selectedLeadIds.length === leads.length ? (
              <CheckSquare size={18} color={brandCol} />
            ) : (
              <Square size={18} color={subTextColor} />
            )}
            <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>
              Select All ({leads.length})
            </Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 11, color: subTextColor }}>
            {selectedLeadIds.length} selected
          </Text>
        </View>
      )}

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[brandCol]} />}
      >
        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={brandCol} />
            <Text style={{ color: subTextColor, marginTop: 12, fontSize: 13 }}>
              Loading unassigned leads...
            </Text>
          </View>
        ) : leads.length === 0 ? (
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 16,
              padding: 32,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: borderCol,
            }}
          >
            <UserX size={40} color={subTextColor} style={{ opacity: 0.5 }} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, marginTop: 12 }}>
              No Unassigned Leads Found
            </Text>
            <Text style={{ fontSize: 12, color: subTextColor, textAlign: 'center', marginTop: 4 }}>
              All incoming leads have been assigned to agents or no webhook leads match your search criteria.
            </Text>
          </View>
        ) : (
          leads.map((lead) => {
            const isSelected = selectedLeadIds.includes(lead.leadId);
            return (
              <View
                key={lead.leadId}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: isSelected ? brandCol : borderCol,
                  padding: 16,
                }}
              >
                {/* Top Row: Checkbox, Name, Handover Status & Delete */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <TouchableOpacity onPress={() => toggleSelectLead(lead.leadId)}>
                      {isSelected ? (
                        <CheckSquare size={20} color={brandCol} />
                      ) : (
                        <Square size={20} color={subTextColor} />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleNavigateToLead(lead.leadId)}
                      style={{ flex: 1 }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>
                          {lead.fullName}
                        </Text>
                        <ExternalLink size={14} color={subTextColor} />
                      </View>
                      <Text style={{ fontSize: 11, color: subTextColor, marginTop: 1 }}>
                        Lead ID: #{lead.leadId} • {lead.source || 'Webhook'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {/* Handover Status Tag */}
                    <View
                      style={{
                        backgroundColor: '#f59e0b15',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#f59e0b' }}>
                        {lead.handoverStatus || 'Admin'}
                      </Text>
                    </View>

                    {/* Delete Lead Button */}
                    <TouchableOpacity
                      onPress={() => setDeleteLeadTarget(lead)}
                      style={{ padding: 4 }}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Contact Info Row */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:${lead.phone}`)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Phone size={12} color={brandCol} />
                    <Text style={{ fontSize: 12, color: textColor, textDecorationLine: 'underline' }}>
                      {lead.phone}
                    </Text>
                  </TouchableOpacity>
                  {lead.email ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`mailto:${lead.email}`)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                      <Mail size={12} color={subTextColor} />
                      <Text style={{ fontSize: 12, color: textColor }}>{lead.email}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Property Requirement Badges */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {lead.propertyType && (
                    <View
                      style={{
                        backgroundColor: inputBg,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Home size={10} color={subTextColor} />
                      <Text style={{ fontSize: 11, color: textColor, fontWeight: '500' }}>
                        {lead.propertyType}
                      </Text>
                    </View>
                  )}

                  {lead.bhk && (
                    <View
                      style={{
                        backgroundColor: inputBg,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: textColor, fontWeight: '500' }}>
                        {lead.bhk} BHK
                      </Text>
                    </View>
                  )}

                  {lead.preferredLocation && (
                    <View
                      style={{
                        backgroundColor: inputBg,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <MapPin size={10} color={subTextColor} />
                      <Text style={{ fontSize: 11, color: textColor, fontWeight: '500' }}>
                        {lead.preferredLocation}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Requirement / Comments Details */}
                {lead.requirement && (
                  <Text style={{ fontSize: 12, color: subTextColor, marginTop: 8, fontStyle: 'italic' }}>
                    Requirement: {lead.requirement}
                  </Text>
                )}

                {/* Card Footer Action Bar */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 12,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: borderCol,
                  }}
                >
                  <Text style={{ fontSize: 10, color: subTextColor }}>
                    Created: {lead.createdDate ? new Date(lead.createdDate).toLocaleDateString() : 'Today'}
                  </Text>

                  {/* Single Assign Executive Button */}
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedLeadIds([lead.leadId]);
                      setShowAssignModal(true);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: adminTheme.badgeBg,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                    }}
                  >
                    <UserPlus size={12} color={brandCol} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: adminTheme.badgeText }}>
                      Assign Agent
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 16,
              marginTop: 12,
            }}
          >
            <TouchableOpacity
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: cardBg,
                opacity: page === 1 ? 0.4 : 1,
                borderWidth: 1,
                borderColor: borderCol,
              }}
            >
              <ChevronLeft size={18} color={textColor} />
            </TouchableOpacity>

            <Text style={{ fontSize: 13, color: textColor, fontWeight: '600' }}>
              Page {page} of {totalPages}
            </Text>

            <TouchableOpacity
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: cardBg,
                opacity: page === totalPages ? 0.4 : 1,
                borderWidth: 1,
                borderColor: borderCol,
              }}
            >
              <ChevronRight size={18} color={textColor} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Assign Executive Modal */}
      <Modal visible={showAssignModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: cardBg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              gap: 16,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>
                Assign Lead to Executive
              </Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <X size={20} color={subTextColor} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: subTextColor }}>
              Select an Executive Agent to assign {selectedLeadIds.length} lead(s):
            </Text>

            {/* Agent Options Selector */}
            <View style={{ gap: 8 }}>
              {AGENT_OPTIONS.map((agent) => {
                const isSelected = selectedExecutiveId === agent.id;
                return (
                  <TouchableOpacity
                    key={agent.id}
                    onPress={() => setSelectedExecutiveId(agent.id)}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isSelected ? brandCol : borderCol,
                      backgroundColor: isSelected ? adminTheme.badgeBg : bgColor,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>
                        {agent.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                        Role: {agent.role}
                      </Text>
                    </View>
                    {isSelected && (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: brandCol,
                        }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Submit Assignment Button */}
            <TouchableOpacity
              onPress={handleAssignSubmit}
              disabled={assignLoading}
              style={{
                height: 48,
                backgroundColor: brandCol,
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              {assignLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>
                  Confirm Lead Assignment
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Lead Confirmation Modal */}
      <Modal visible={!!deleteLeadTarget} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 340,
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View style={{ backgroundColor: '#ef444415', padding: 12, borderRadius: 24 }}>
              <ShieldAlert size={32} color="#ef4444" />
            </View>

            <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, textAlign: 'center' }}>
              Delete Unassigned Lead?
            </Text>

            <Text style={{ fontSize: 13, color: subTextColor, textAlign: 'center' }}>
              Are you sure you want to delete lead <Text style={{ fontWeight: '700', color: textColor }}>{deleteLeadTarget?.fullName}</Text>? This action cannot be undone.
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, width: '100%' }}>
              <TouchableOpacity
                onPress={() => setDeleteLeadTarget(null)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: borderCol,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: textColor, fontSize: 13, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteSubmit}
                disabled={deleteLoading}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#ef4444',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {deleteLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
