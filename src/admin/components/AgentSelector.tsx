import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Modal,
} from 'react-native';
import { Search, Check, User, X, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { LeadService } from '../services/LeadService';

export interface AgentOption {
  userId: number;
  username: string;
  role?: string;
  email?: string;
  phone?: string;
}

interface AgentSelectorProps {
  selectedAgentId: number | null;
  onSelect: (agent: AgentOption | null) => void;
  visible: boolean;
  onClose: () => void;
  allowUnassign?: boolean;
  title?: string;
  availableAgents?: AgentOption[];
}

export default function AgentSelector({
  selectedAgentId,
  onSelect,
  visible,
  onClose,
  allowUnassign = true,
  title = 'Select Assignee',
  availableAgents,
}: AgentSelectorProps) {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const [agents, setAgents] = useState<AgentOption[]>(availableAgents || []);
  const [loading, setLoading] = useState<boolean>(!availableAgents || availableAgents.length === 0);
  const [search, setSearch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (availableAgents && availableAgents.length > 0) {
        setAgents(availableAgents);
        setLoading(false);
        setError(null);
      } else {
        loadAgents();
      }
    }
  }, [visible, availableAgents]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await LeadService.getAssignableAgents();
      if (res && res.success && res.data) {
        setAgents(res.data);
      } else {
        setAgents([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.username.toLowerCase().includes(q) ||
      (a.role && a.role.toLowerCase().includes(q)) ||
      (a.email && a.email.toLowerCase().includes(q))
    );
  });

  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg;
  const brandCol = adminTheme.brand;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: cardBg, borderColor: borderCol }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: borderCol }]}>
            <View>
              <Text style={[styles.title, { color: textColor }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: subTextColor }]}>
                Select an active agent from your organization
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={subTextColor} />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={[styles.searchBox, { backgroundColor: inputBg, borderColor: borderCol }]}>
            <Search size={16} color={subTextColor} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search by name, role or email..."
              placeholderTextColor={subTextColor}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <X size={14} color={subTextColor} />
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={brandCol} />
              <Text style={{ color: subTextColor, fontSize: 13, marginTop: 8 }}>
                Loading available agents...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorWrap}>
              <ShieldAlert size={24} color="#ef4444" />
              <Text style={[styles.errorText, { color: textColor }]}>{error}</Text>
              <TouchableOpacity onPress={loadAgents} style={[styles.retryBtn, { backgroundColor: brandCol }]}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredAgents}
              keyExtractor={(item) => String(item.userId)}
              ListHeaderComponent={
                allowUnassign ? (
                  <TouchableOpacity
                    style={[
                      styles.agentRow,
                      { borderBottomColor: borderCol },
                      selectedAgentId === null && { backgroundColor: `${brandCol}12` },
                    ]}
                    onPress={() => {
                      onSelect(null);
                      onClose();
                    }}
                  >
                    <View style={[styles.avatarCircle, { backgroundColor: 'rgba(100, 116, 139, 0.15)' }]}>
                      <User size={16} color={subTextColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.agentName, { color: textColor, fontStyle: 'italic' }]}>
                        Leave Unassigned
                      </Text>
                      <Text style={[styles.agentMeta, { color: subTextColor }]}>
                        No agent assigned
                      </Text>
                    </View>
                    {selectedAgentId === null && <Check size={18} color={brandCol} />}
                  </TouchableOpacity>
                ) : null
              }
              renderItem={({ item }) => {
                const isSelected = selectedAgentId === item.userId;
                const initial = (item.username || 'A').charAt(0).toUpperCase();

                return (
                  <TouchableOpacity
                    style={[
                      styles.agentRow,
                      { borderBottomColor: borderCol },
                      isSelected && { backgroundColor: `${brandCol}15` },
                    ]}
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                  >
                    <View style={[styles.avatarCircle, { backgroundColor: `${brandCol}20` }]}>
                      <Text style={[styles.avatarInitial, { color: brandCol }]}>{initial}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.agentName, { color: textColor }]}>{item.username}</Text>
                      <Text style={[styles.agentMeta, { color: subTextColor }]}>
                        {item.role || 'Sales Agent'} {item.phone ? `· ${item.phone}` : ''}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color={brandCol} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Text style={{ color: subTextColor, fontSize: 13 }}>
                    No team members match "{search}"
                  </Text>
                </View>
              }
              style={{ maxHeight: 360 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontWeight: '700',
    fontSize: 14,
  },
  agentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  agentMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  loadingWrap: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorWrap: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyWrap: {
    padding: 28,
    alignItems: 'center',
  },
});
