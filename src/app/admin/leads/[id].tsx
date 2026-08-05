import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Linking,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  RefreshCw,
  Phone,
  Mail,
  MessageSquare,
  User,
  Home,
  Activity,
  CalendarCheck,
  FileText,
  Paperclip,
  MapPin,
  GitCommit,
  Clock,
  Star,
  Building,
  AlertCircle,
  Tag,
  Briefcase,
  Plus,
  Send,
  Upload,
  X,
  FileCheck,
  Receipt,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { useLeadStore } from '../../../admin/store/useLeadStore';

// Safe date formatters
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return 'N/A';
  }
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const strHours = String(hours).padStart(2, '0');
    return `${day} ${month} ${d.getFullYear()}, ${strHours}:${minutes} ${ampm}`;
  } catch {
    return 'N/A';
  }
}

type TabType =
  | 'contact'
  | 'requirements'
  | 'activities'
  | 'followups'
  | 'notes'
  | 'documents'
  | 'sitevisits'
  | 'transitions';

export default function LeadDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const leadId = params.id;
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const {
    selectedLeadDetails,
    isLoadingDetails,
    detailsError,
    fetchLeadDetails,
    addLeadNote,
    addLeadFollowUp,
    uploadLeadDocument,
  } = useLeadStore();

  const [activeTab, setActiveTab] = useState<TabType>('contact');
  const [refreshing, setRefreshing] = useState(false);

  // Form States
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Follow-up / Site Visit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'followup' | 'sitevisit'>('followup');
  const [formStage, setFormStage] = useState('Site Visit Requested');
  const [formStatus, setFormStatus] = useState('Scheduled');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0] + 'T10:00:00');
  const [formTime, setFormTime] = useState('10:00 AM');
  const [formComments, setFormComments] = useState('');
  const [formRating, setFormRating] = useState('5');
  const [formInterest, setFormInterest] = useState('Interested');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (leadId) {
      fetchLeadDetails(leadId);
    }
  }, [leadId]);

  const onRefresh = async () => {
    if (!leadId) return;
    setRefreshing(true);
    await fetchLeadDetails(leadId);
    setRefreshing(false);
  };

  // Dynamic Admin Theme Colors (from admin.css)
  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg;
  const brandCol = adminTheme.brand;

  const contact = selectedLeadDetails?.contactInformation;
  const requirements = selectedLeadDetails?.propertyRequirements;
  const activities = selectedLeadDetails?.activities || [];
  const followUps = selectedLeadDetails?.followUps || [];
  const notes = selectedLeadDetails?.notes || [];
  const documents = selectedLeadDetails?.documents || [];
  const siteVisits = selectedLeadDetails?.siteVisits || [];
  const transitions = selectedLeadDetails?.transitions || [];

  const handleCall = () => {
    if (contact?.phone) {
      Linking.openURL(`tel:${contact.phone}`);
    }
  };

  const handleEmail = () => {
    if (contact?.email) {
      Linking.openURL(`mailto:${contact.email}`);
    }
  };

  const handleWhatsApp = () => {
    if (contact?.phone) {
      const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
      Linking.openURL(`https://wa.me/${cleanPhone}`);
    }
  };

  // Handlers for Submitting Data
  const handleAddNote = async () => {
    if (!newNoteText.trim() || !leadId) return;
    setIsSubmittingNote(true);
    const success = await addLeadNote(leadId, newNoteText.trim());
    setIsSubmittingNote(false);
    if (success) {
      setNewNoteText('');
    } else {
      Alert.alert('Note Error', 'Failed to add note. Please try again.');
    }
  };

  const openScheduleModal = (type: 'followup' | 'sitevisit') => {
    setModalType(type);
    setFormStage(type === 'sitevisit' ? 'Site Visit Requested' : 'Phone Call');
    setFormStatus('Scheduled');
    setFormComments('');
    setIsModalOpen(true);
  };

  const handleSubmitModalForm = async () => {
    if (!leadId) return;
    setIsSubmittingForm(true);

    const payload = {
      stage: formStage,
      status: formStatus,
      followUpDate: formDate,
      followUpTime: formTime,
      comments: formComments,
      interestStatus: formInterest,
      rating: formRating,
    };

    const success = await addLeadFollowUp(leadId, payload);
    setIsSubmittingForm(false);
    if (success) {
      setIsModalOpen(false);
    } else {
      Alert.alert('Submission Error', 'Failed to schedule entry. Please try again.');
    }
  };

  const handleUploadDocument = async () => {
    if (!leadId) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setIsUploading(true);

        const formData = new FormData();
        const fileName = asset.fileName || `doc_${Date.now()}.jpg`;
        const mimeType = asset.mimeType || 'image/jpeg';

        // Append file object formatted for React Native FormData
        formData.append('file', {
          uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
          name: fileName,
          type: mimeType,
        } as any);

        const success = await uploadLeadDocument(leadId, formData);
        setIsUploading(false);

        if (success) {
          Alert.alert('Success', 'Document uploaded successfully!');
        } else {
          Alert.alert('Upload Failed', 'Document upload failed. Please try again.');
        }
      }
    } catch (err: any) {
      setIsUploading(false);
      Alert.alert('Error', err.message || 'Failed to select document.');
    }
  };

  // Render Rating Pill
  const renderRatingBadge = (rating?: string | null) => {
    if (!rating) return null;
    let badgeBg = '#3b82f615';
    let textCol = '#3b82f6';
    if (rating.toLowerCase() === 'hot') {
      badgeBg = '#ef444415';
      textCol = '#ef4444';
    } else if (rating.toLowerCase() === 'warm') {
      badgeBg = '#f59e0b15';
      textCol = '#f59e0b';
    } else if (rating.toLowerCase() === 'cold') {
      badgeBg = '#06b6d415';
      textCol = '#06b6d4';
    }

    return (
      <View style={[styles.ratingBadge, { backgroundColor: badgeBg }]}>
        <Star size={12} color={textCol} fill={textCol} />
        <Text style={[styles.ratingText, { color: textCol }]}>{rating}</Text>
      </View>
    );
  };

  const tabs: { key: TabType; label: string; count?: number; icon: any }[] = [
    { key: 'contact', label: 'Contact', icon: User },
    { key: 'requirements', label: 'Requirements', icon: Home },
    { key: 'activities', label: 'Activities', count: activities.length, icon: Activity },
    { key: 'followups', label: 'Follow Ups', count: followUps.length, icon: CalendarCheck },
    { key: 'notes', label: 'Notes', count: notes.length, icon: FileText },
    { key: 'documents', label: 'Documents', count: documents.length, icon: Paperclip },
    { key: 'sitevisits', label: 'Site Visits', count: siteVisits.length, icon: MapPin },
    { key: 'transitions', label: 'Transitions', count: transitions.length, icon: GitCommit },
  ];

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {isLoadingDetails && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ color: subTextColor, marginTop: 12, fontSize: 14 }}>
            Fetching lead full details...
          </Text>
        </View>
      ) : detailsError ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <AlertCircle size={48} color="#ef4444" />
          <Text style={{ color: textColor, fontSize: 16, fontWeight: '600', marginTop: 12, textAlign: 'center' }}>
            Failed to Load Lead Details
          </Text>
          <Text style={{ color: subTextColor, fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 20 }}>
            {detailsError}
          </Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
            <Text style={{ color: '#ffffff', fontWeight: '600' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Lead Hero Profile Card */}
          <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={styles.heroRow}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>
                  {(contact?.fullName || 'L').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={[styles.leadName, { color: textColor }]}>
                    {contact?.fullName || 'Unnamed Lead'}
                  </Text>
                  {renderRatingBadge(contact?.rating)}
                </View>
                <Text style={[styles.leadSub, { color: subTextColor }]}>
                  {contact?.email || 'No email provided'}
                </Text>
                <Text style={[styles.leadSub, { color: subTextColor }]}>
                  {contact?.phone || 'No phone provided'}
                </Text>
              </View>
            </View>

            {/* Status Badges */}
            <View style={styles.badgeRow}>
              <View style={[styles.pillBadge, { backgroundColor: '#3b82f615' }]}>
                <Tag size={12} color="#3b82f6" />
                <Text style={[styles.pillBadgeText, { color: '#3b82f6' }]}>
                  {contact?.status || 'Active'}
                </Text>
              </View>
              {contact?.stage && (
                <View style={[styles.pillBadge, { backgroundColor: '#8b5cf615' }]}>
                  <Briefcase size={12} color="#8b5cf6" />
                  <Text style={[styles.pillBadgeText, { color: '#8b5cf6' }]}>
                    {contact.stage}
                  </Text>
                </View>
              )}
              {contact?.source && (
                <View style={[styles.pillBadge, { backgroundColor: '#10b98115' }]}>
                  <Building size={12} color="#10b981" />
                  <Text style={[styles.pillBadgeText, { color: '#10b981' }]}>
                    {contact.source}
                  </Text>
                </View>
              )}
            </View>

            {/* Action Bar */}
            <View style={[styles.actionRow, { borderTopColor: borderCol }]}>
              <TouchableOpacity
                onPress={handleCall}
                disabled={!contact?.phone}
                style={[styles.actionBtn, { backgroundColor: contact?.phone ? '#10b98115' : inputBg }]}
              >
                <Phone size={16} color={contact?.phone ? '#10b981' : subTextColor} />
                <Text style={[styles.actionBtnText, { color: contact?.phone ? '#10b981' : subTextColor }]}>
                  Call
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleWhatsApp}
                disabled={!contact?.phone}
                style={[styles.actionBtn, { backgroundColor: contact?.phone ? '#22c55e15' : inputBg }]}
              >
                <MessageSquare size={16} color={contact?.phone ? '#22c55e' : subTextColor} />
                <Text style={[styles.actionBtnText, { color: contact?.phone ? '#22c55e' : subTextColor }]}>
                  WhatsApp
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleEmail}
                disabled={!contact?.email}
                style={[styles.actionBtn, { backgroundColor: contact?.email ? '#3b82f615' : inputBg }]}
              >
                <Mail size={16} color={contact?.email ? '#3b82f6' : subTextColor} />
                <Text style={[styles.actionBtnText, { color: contact?.email ? '#3b82f6' : subTextColor }]}>
                  Email
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Horizontal Scrollable Tabs */}
          <View style={{ paddingTop: 16 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            >
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={[
                      styles.tabPill,
                      {
                        backgroundColor: isActive ? '#3b82f6' : cardBg,
                        borderColor: isActive ? '#3b82f6' : borderCol,
                      },
                    ]}
                  >
                    <IconComponent size={14} color={isActive ? '#ffffff' : subTextColor} />
                    <Text style={[styles.tabPillText, { color: isActive ? '#ffffff' : textColor }]}>
                      {tab.label}
                    </Text>
                    {typeof tab.count === 'number' && (
                      <View
                        style={[
                          styles.tabCountBadge,
                          { backgroundColor: isActive ? '#ffffff30' : inputBg },
                        ]}
                      >
                        <Text style={[styles.tabCountText, { color: isActive ? '#ffffff' : subTextColor }]}>
                          {tab.count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Tab Content Section */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            {/* TAB 1: Contact Information */}
            {activeTab === 'contact' && (
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Contact Information</Text>
                <View style={styles.gridContainer}>
                  <GridItem label="Lead ID" value={`#${contact?.leadId || 'N/A'}`} textColor={textColor} subTextColor={subTextColor} />
                  <GridItem label="Full Name" value={contact?.fullName || 'N/A'} textColor={textColor} subTextColor={subTextColor} />
                  <GridItem label="Email" value={contact?.email || 'N/A'} textColor={textColor} subTextColor={subTextColor} />
                  <GridItem label="Phone" value={contact?.phone || 'N/A'} textColor={textColor} subTextColor={subTextColor} />
                  <GridItem label="Stage" value={contact?.stage || 'N/A'} textColor={textColor} subTextColor={subTextColor} />
                  <GridItem label="Status" value={contact?.status || 'N/A'} textColor={textColor} subTextColor={subTextColor} />
                  <GridItem label="Source" value={contact?.source || 'N/A'} textColor={textColor} subTextColor={subTextColor} />
                  <GridItem label="Rating" value={contact?.rating || 'N/A'} textColor={textColor} subTextColor={subTextColor} />
                  <GridItem label="Handover Status" value={contact?.handoverStatus || 'N/A'} textColor={textColor} subTextColor={subTextColor} />
                  <GridItem label="Assigned Agent" value={contact?.assignedToAgentName || (contact?.assignedToAgentId ? `Agent #${contact.assignedToAgentId}` : 'Admin')} textColor={textColor} subTextColor={subTextColor} />
                  <GridItem label="Follow-Up Date" value={formatDateTime(contact?.followUpDate)} textColor={textColor} subTextColor={subTextColor} />
                  <GridItem label="Created Date" value={formatDateTime(contact?.createdDate)} textColor={textColor} subTextColor={subTextColor} />
                </View>

                {contact?.comments ? (
                  <View style={[styles.commentBox, { backgroundColor: inputBg, borderColor: borderCol }]}>
                    <Text style={[styles.commentTitle, { color: subTextColor }]}>Executive Comments:</Text>
                    <Text style={[styles.commentText, { color: textColor }]}>{contact.comments}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* TAB 2: Property Requirements */}
            {activeTab === 'requirements' && (
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Property Requirements</Text>
                <View style={styles.gridContainer}>
                  <GridItem label="Group Name" value={requirements?.groupName || 'N/A'} textColor={textColor} subTextColor={subTextColor} />
                  <GridItem label="Preferred Location" value={requirements?.preferredLocation || 'N/A'} textColor={textColor} subTextColor={subTextColor} />
                  <GridItem label="Property Type" value={requirements?.propertyType || 'N/A'} textColor={textColor} subTextColor={subTextColor} />
                  <GridItem label="Requirement Type" value={requirements?.type || 'N/A'} textColor={textColor} subTextColor={subTextColor} />
                  <GridItem label="BHK Configuration" value={requirements?.bhk || 'N/A'} textColor={textColor} subTextColor={subTextColor} />
                  <GridItem label="Area (Sq. Ft.)" value={requirements?.sqft ? `${requirements.sqft} sqft` : 'N/A'} textColor={textColor} subTextColor={subTextColor} />
                  <GridItem label="Facing" value={requirements?.facing || 'N/A'} textColor={textColor} subTextColor={subTextColor} />
                </View>

                {requirements?.requirement ? (
                  <View style={[styles.commentBox, { backgroundColor: inputBg, borderColor: borderCol }]}>
                    <Text style={[styles.commentTitle, { color: subTextColor }]}>Detailed Requirement:</Text>
                    <Text style={[styles.commentText, { color: textColor }]}>{requirements.requirement}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* TAB 3: Activities */}
            {activeTab === 'activities' && (
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Activity History</Text>
                {activities.length === 0 ? (
                  <EmptyState text="No activity logs recorded yet." subTextColor={subTextColor} />
                ) : (
                  <View style={styles.timelineList}>
                    {activities.map((act, index) => (
                      <View key={act.historyId || index} style={styles.timelineItem}>
                        <View style={styles.timelineDotContainer}>
                          <View style={styles.timelineDot} />
                          {index !== activities.length - 1 && <View style={[styles.timelineLine, { backgroundColor: borderCol }]} />}
                        </View>
                        <View style={[styles.timelineCard, { backgroundColor: inputBg, borderColor: borderCol }]}>
                          <Text style={[styles.timelineActivity, { color: textColor }]}>{act.activity}</Text>
                          <View style={styles.timelineMeta}>
                            <Clock size={12} color={subTextColor} />
                            <Text style={[styles.timelineTime, { color: subTextColor }]}>
                              {formatDateTime(act.activityDate)}
                            </Text>
                            {act.executiveId && (
                              <Text style={[styles.timelineTime, { color: subTextColor }]}>
                                · Exec #{act.executiveId}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* TAB 4: Follow Ups */}
            {activeTab === 'followups' && (
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>Follow Ups & Schedule</Text>
                  <TouchableOpacity
                    onPress={() => openScheduleModal('followup')}
                    style={styles.addBtnSmall}
                  >
                    <Plus size={14} color="#ffffff" />
                    <Text style={styles.addBtnSmallText}>+ Add Follow-up</Text>
                  </TouchableOpacity>
                </View>

                {followUps.length === 0 ? (
                  <EmptyState text="No follow-up records found." subTextColor={subTextColor} />
                ) : (
                  <View style={{ gap: 12 }}>
                    {followUps.map((item) => (
                      <View key={item.followUpId} style={[styles.cardItem, { backgroundColor: inputBg, borderColor: borderCol }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <CalendarCheck size={16} color="#3b82f6" />
                            <Text style={[styles.cardItemTitle, { color: textColor }]}>
                              {item.stage || 'Follow Up'}
                            </Text>
                          </View>
                          <View style={[styles.pillBadge, { backgroundColor: item.status === 'Completed' ? '#10b98115' : '#f59e0b15' }]}>
                            <Text style={[styles.pillBadgeText, { color: item.status === 'Completed' ? '#10b981' : '#f59e0b' }]}>
                              {item.status || 'Pending'}
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.cardItemSub, { color: subTextColor, marginTop: 6 }]}>
                          Date: {formatDate(item.followUpDate)} {item.followUpTime ? `· ${item.followUpTime}` : ''}
                        </Text>

                        {item.comments ? (
                          <Text style={[styles.cardItemDesc, { color: textColor, marginTop: 6 }]}>
                            {item.comments}
                          </Text>
                        ) : null}

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                          {item.interestStatus && (
                            <Text style={{ fontSize: 12, color: subTextColor }}>
                              Interest: <Text style={{ color: textColor, fontWeight: '600' }}>{item.interestStatus}</Text>
                            </Text>
                          )}
                          {item.rating && (
                            <Text style={{ fontSize: 12, color: subTextColor }}>
                              Rating: <Text style={{ color: '#f59e0b', fontWeight: '600' }}>{item.rating} ★</Text>
                            </Text>
                          )}
                          {item.executiveId && (
                            <Text style={{ fontSize: 12, color: subTextColor }}>
                              Executive: #{item.executiveId}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* TAB 5: Notes */}
            {activeTab === 'notes' && (
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Internal Notes & Remarks</Text>

                {/* Add Note Input Box */}
                <View style={[styles.addNoteBox, { backgroundColor: inputBg, borderColor: borderCol }]}>
                  <TextInput
                    style={[styles.noteInput, { color: textColor }]}
                    placeholder="Type an internal remark or comment..."
                    placeholderTextColor={subTextColor}
                    multiline
                    value={newNoteText}
                    onChangeText={setNewNoteText}
                  />
                  <TouchableOpacity
                    onPress={handleAddNote}
                    disabled={isSubmittingNote || !newNoteText.trim()}
                    style={[
                      styles.sendNoteBtn,
                      { opacity: isSubmittingNote || !newNoteText.trim() ? 0.5 : 1 },
                    ]}
                  >
                    {isSubmittingNote ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Send size={14} color="#ffffff" />
                        <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 13 }}>Add Note</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {notes.length === 0 ? (
                  <EmptyState text="No notes added for this lead yet." subTextColor={subTextColor} />
                ) : (
                  <View style={{ gap: 12, marginTop: 14 }}>
                    {notes.map((note) => (
                      <View key={note.noteId} style={[styles.cardItem, { backgroundColor: inputBg, borderColor: borderCol }]}>
                        <Text style={[styles.cardItemDesc, { color: textColor }]}>{note.noteText}</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                          <Text style={{ fontSize: 11, color: subTextColor }}>
                            {formatDateTime(note.createdOn)}
                          </Text>
                          {note.executiveId && (
                            <Text style={{ fontSize: 11, color: subTextColor }}>
                              By Exec #{note.executiveId}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* TAB 6: Documents & Financial Sub-sections */}
            {activeTab === 'documents' && (
              <View style={{ gap: 16 }}>
                {/* File Upload Header Bar */}
                <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>Lead Documents</Text>
                    <TouchableOpacity
                      onPress={handleUploadDocument}
                      disabled={isUploading}
                      style={styles.addBtnSmall}
                    >
                      {isUploading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Upload size={14} color="#ffffff" />
                          <Text style={styles.addBtnSmallText}>Upload Document</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  {documents.length === 0 ? (
                    <EmptyState text="No documents uploaded yet." subTextColor={subTextColor} />
                  ) : (
                    <View style={{ gap: 10, marginTop: 14 }}>
                      {documents.map((doc) => (
                        <TouchableOpacity
                          key={doc.uploadId}
                          style={[styles.docItem, { backgroundColor: inputBg, borderColor: borderCol }]}
                          onPress={() => {
                            if (doc.filePath) {
                              Linking.openURL(doc.filePath);
                            }
                          }}
                        >
                          <Paperclip size={20} color="#3b82f6" />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.docName, { color: textColor }]} numberOfLines={1}>
                              {doc.fileName}
                            </Text>
                            <Text style={{ fontSize: 11, color: subTextColor }}>
                              {doc.fileType || 'Document'} · {formatDateTime(doc.uploadedOn)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Sub-section 1: Quotations */}
                <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <FileSpreadsheet size={18} color="#0284c7" />
                      <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>Quotations</Text>
                    </View>
                    <TouchableOpacity style={[styles.addBtnSmall, { backgroundColor: '#0284c7' }]}>
                      <Plus size={14} color="#ffffff" />
                      <Text style={styles.addBtnSmallText}>+ New Quotation</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: 13, color: subTextColor }}>No quotations available.</Text>
                </View>

                {/* Sub-section 2: Booking Documents */}
                <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <FileCheck size={18} color="#16a34a" />
                    <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>Booking Documents</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: subTextColor }}>No booking documents available.</Text>
                </View>

                {/* Sub-section 3: Invoice Documents */}
                <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Receipt size={18} color="#0284c7" />
                      <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>Invoice Documents</Text>
                    </View>
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#0284c7', width: 30, height: 30 }]}>
                      <Plus size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: 13, color: subTextColor }}>No invoice documents available.</Text>
                </View>

                {/* Sub-section 4: Payments */}
                <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <CreditCard size={18} color="#d97706" />
                      <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>Payments</Text>
                    </View>
                    <TouchableOpacity style={[styles.addBtnSmall, { backgroundColor: '#d97706' }]}>
                      <Plus size={14} color="#ffffff" />
                      <Text style={styles.addBtnSmallText}>+ Record Payment</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: 13, color: subTextColor }}>No payments recorded.</Text>
                </View>
              </View>
            )}

            {/* TAB 7: Site Visits */}
            {activeTab === 'sitevisits' && (
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0 }]}>Site Visits</Text>
                  <TouchableOpacity
                    onPress={() => openScheduleModal('sitevisit')}
                    style={styles.addBtnSmall}
                  >
                    <Plus size={14} color="#ffffff" />
                    <Text style={styles.addBtnSmallText}>+ Schedule Visit</Text>
                  </TouchableOpacity>
                </View>

                {siteVisits.length === 0 ? (
                  <EmptyState text="No site visits recorded." subTextColor={subTextColor} />
                ) : (
                  <View style={{ gap: 12 }}>
                    {siteVisits.map((visit) => (
                      <View key={visit.followUpId} style={[styles.cardItem, { backgroundColor: inputBg, borderColor: borderCol }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <MapPin size={16} color="#ec4899" />
                            <Text style={[styles.cardItemTitle, { color: textColor }]}>
                              {visit.stage || 'Site Visit'}
                            </Text>
                          </View>
                          <View style={[styles.pillBadge, { backgroundColor: visit.status === 'Completed' ? '#10b98115' : '#f59e0b15' }]}>
                            <Text style={[styles.pillBadgeText, { color: visit.status === 'Completed' ? '#10b981' : '#f59e0b' }]}>
                              {visit.status || 'Scheduled'}
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.cardItemSub, { color: subTextColor, marginTop: 6 }]}>
                          Date: {formatDate(visit.followUpDate)} {visit.followUpTime ? `· ${visit.followUpTime}` : ''}
                        </Text>

                        {visit.comments ? (
                          <Text style={[styles.cardItemDesc, { color: textColor, marginTop: 6 }]}>
                            {visit.comments}
                          </Text>
                        ) : null}

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                          {visit.propertyId && (
                            <Text style={{ fontSize: 12, color: subTextColor }}>
                              Property ID: <Text style={{ color: textColor, fontWeight: '600' }}>#{visit.propertyId}</Text>
                            </Text>
                          )}
                          {visit.interestStatus && (
                            <Text style={{ fontSize: 12, color: subTextColor }}>
                              Interest: <Text style={{ color: textColor, fontWeight: '600' }}>{visit.interestStatus}</Text>
                            </Text>
                          )}
                          {visit.rating && (
                            <Text style={{ fontSize: 12, color: subTextColor }}>
                              Rating: <Text style={{ color: '#f59e0b', fontWeight: '600' }}>{visit.rating} ★</Text>
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* TAB 8: Stage Transitions */}
            {activeTab === 'transitions' && (
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Stage Transition History</Text>
                {transitions.length === 0 ? (
                  <EmptyState text="No stage transitions recorded yet." subTextColor={subTextColor} />
                ) : (
                  <View style={styles.timelineList}>
                    {transitions.map((item, index) => (
                      <View key={item.historyId || index} style={styles.timelineItem}>
                        <View style={styles.timelineDotContainer}>
                          <View style={[styles.timelineDot, { backgroundColor: '#8b5cf6' }]} />
                          {index !== transitions.length - 1 && <View style={[styles.timelineLine, { backgroundColor: borderCol }]} />}
                        </View>
                        <View style={[styles.timelineCard, { backgroundColor: inputBg, borderColor: borderCol }]}>
                          <Text style={[styles.timelineActivity, { color: textColor }]}>{item.activity}</Text>
                          <View style={styles.timelineMeta}>
                            <Clock size={12} color={subTextColor} />
                            <Text style={[styles.timelineTime, { color: subTextColor }]}>
                              {formatDateTime(item.activityDate)}
                            </Text>
                            {item.executiveId && (
                              <Text style={[styles.timelineTime, { color: subTextColor }]}>
                                · Exec #{item.executiveId}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Modal for Adding Follow-Up or Scheduling Site Visit */}
      <Modal visible={isModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                {modalType === 'sitevisit' ? 'Schedule Site Visit' : 'Add Follow-up'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X size={20} color={subTextColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              <Text style={[styles.inputLabel, { color: subTextColor }]}>Stage</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: inputBg, color: textColor }]}
                value={formStage}
                onChangeText={setFormStage}
              />

              <Text style={[styles.inputLabel, { color: subTextColor }]}>Status</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: inputBg, color: textColor }]}
                value={formStatus}
                onChangeText={setFormStatus}
              />

              <Text style={[styles.inputLabel, { color: subTextColor }]}>Date & Time (ISO)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: inputBg, color: textColor }]}
                value={formDate}
                onChangeText={setFormDate}
              />

              <Text style={[styles.inputLabel, { color: subTextColor }]}>Interest Status</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: inputBg, color: textColor }]}
                value={formInterest}
                onChangeText={setFormInterest}
              />

              <Text style={[styles.inputLabel, { color: subTextColor }]}>Comments</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: inputBg, color: textColor, height: 70 }]}
                multiline
                placeholder="Enter remarks or schedule comments..."
                placeholderTextColor={subTextColor}
                value={formComments}
                onChangeText={setFormComments}
              />
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                style={[styles.modalBtn, { backgroundColor: inputBg }]}
              >
                <Text style={{ color: textColor, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitModalForm}
                disabled={isSubmittingForm}
                style={[styles.modalBtn, { backgroundColor: '#3b82f6', flex: 1 }]}
              >
                {isSubmittingForm ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={{ color: '#ffffff', fontWeight: '600' }}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Subcomponents
function GridItem({
  label,
  value,
  textColor,
  subTextColor,
}: {
  label: string;
  value: string;
  textColor: string;
  subTextColor: string;
}) {
  return (
    <View style={styles.gridCell}>
      <Text style={[styles.gridLabel, { color: subTextColor }]}>{label}</Text>
      <Text style={[styles.gridValue, { color: textColor }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function EmptyState({ text, subTextColor }: { text: string; subTextColor: string }) {
  return (
    <View style={{ paddingVertical: 24, alignItems: 'center' }}>
      <Text style={{ fontSize: 13, color: subTextColor, textAlign: 'center' }}>{text}</Text>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 40,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 16 : 12,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarLarge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  leadName: {
    fontSize: 18,
    fontWeight: '700',
  },
  leadSub: {
    fontSize: 12,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridCell: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 14,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  commentBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
  },
  commentTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineDotContainer: {
    alignItems: 'center',
    marginRight: 10,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  timelineActivity: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  timelineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  timelineTime: {
    fontSize: 11,
  },
  cardItem: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  cardItemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardItemSub: {
    fontSize: 12,
  },
  cardItemDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  docName: {
    fontSize: 13,
    fontWeight: '600',
  },
  addBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnSmallText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  addNoteBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  noteInput: {
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  sendNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 13,
  },
  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
