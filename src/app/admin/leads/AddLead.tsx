import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Modal,
    Platform,
    useWindowDimensions,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    UserPlus,
    X,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Check,
    Search,
    CalendarDays,
    FileCheck,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useQuery } from '@tanstack/react-query';

import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import { PropertyService } from '../../../admin/services/PropertyService';
import {
    useAddLeadMutation,
    useUpdateLeadMutation,
    useLeadFormOptionsQuery,
    useLeadDetailsQuery,
} from '../../../admin/hooks/useLeadsQuery';
import { AddLeadPayload } from '../../../admin/models/LeadTypes';

// Initial Fallback Dropdown Option Values (used before API loads or as error recovery)
const FALLBACK_STAGES = [
    'New',
    'Office Meeting',
    'Site Visit Requested',
    'Site Visit Done',
    'Quotation',
    'Quotation Sent',
    'Negotiation',
    'Booked',
];
const FALLBACK_STATUSES = ['Active', 'New', 'Contacted', 'Qualified', 'Lost', 'Cold', 'Warm', 'Hot'];
const FALLBACK_SOURCES = ['Website', 'Referral', 'Walk-in', 'Social Media', 'Advertisement', 'Other'];
const FALLBACK_RATINGS = ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'];
const FALLBACK_FACINGS = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'];
const FALLBACK_TYPES = ['Residential', 'Commercial'];
const FALLBACK_PROPERTY_TYPES = ['Apartment', 'Villa', 'Plot', 'Office', 'Shop'];
const FALLBACK_BHKS = ['1BHK', '2BHK', '3BHK', '4BHK', '5BHK'];

export default function AddLead() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const leadId = id ? (Array.isArray(id) ? id[0] : id) : null;
    const isEditMode = !!leadId;

    const { isDark } = useTheme();
    const adminTheme = getAdminTheme(isDark);
    const { width } = useWindowDimensions();

    // Responsive mode: columns on desktop, stack on mobile
    const isLargeScreen = width > 768;

    // Form State
    const [form, setForm] = useState({
        name: '',
        contact: '',
        email: '',
        stage: '',
        status: '',
        source: '',
        followUpDate: '',
        rating: '',
        preferredLocation: '',
        sqft: '',
        facing: '',
        type: '',
        propertyType: '',
        bhk: '',
        locationDistance: '',
        requirement: '',
        assignedToAgentId: null as number | null,
        assignedToAgentName: '',
        comments: '',
    });

    // Selector Modal state
    const [selectorConfig, setSelectorConfig] = useState<{
        visible: boolean;
        title: string;
        options: { value: string; label: string }[];
        field: string;
    } | null>(null);

    const [execQuery, setExecQuery] = useState('');

    // Custom Calendar state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(new Date());

    // Dynamic Theme Colors
    const bgColor = adminTheme.primaryBg;
    const cardBg = adminTheme.cardBg;
    const textColor = adminTheme.textPrimary;
    const subTextColor = adminTheme.textSecondary;
    const borderCol = adminTheme.border;
    const inputBg = adminTheme.inputBg;
    const brandCol = adminTheme.brand;

    // ── TanStack Queries & Mutations ──

    // 1. Fetch Form Dropdown Options
    const { data: apiOptionsData } = useLeadFormOptionsQuery();

    // 2. Fetch Lead Details (Edit Mode)
    const { data: leadDetailsRes, isLoading: isLoadingDetails } = useLeadDetailsQuery(leadId || undefined);

    // 3. Fetch Executives list
    const { data: executives = [] } = useQuery({
        queryKey: ['executives'],
        queryFn: async () => {
            const res = await PropertyService.getExecutives();
            if (!res.success) throw new Error('Failed to fetch executives');
            return res.executives || [];
        },
    });

    // 4. Save/Update Mutations
    const addLeadMutation = useAddLeadMutation();
    const updateLeadMutation = useUpdateLeadMutation();
    const isSubmitting = addLeadMutation.isPending || updateLeadMutation.isPending;

    // Populate form details in edit mode
    useEffect(() => {
        if (isEditMode && leadDetailsRes?.success && leadDetailsRes.data) {
            const contact = leadDetailsRes.data.contactInformation || {};
            const requirements = leadDetailsRes.data.propertyRequirements || {};

            let parsedDate = '';
            if (contact.followUpDate) {
                parsedDate = contact.followUpDate.split('T')[0];
            }

            setForm({
                name: contact.fullName || '',
                contact: contact.phone || '',
                email: contact.email || '',
                stage: contact.stage || '',
                status: contact.status || '',
                source: contact.source || '',
                followUpDate: parsedDate,
                rating: contact.rating || '',
                preferredLocation: requirements.preferredLocation || '',
                sqft: requirements.sqft ? String(requirements.sqft) : '',
                facing: requirements.facing || '',
                type: requirements.type || '',
                propertyType: requirements.propertyType || '',
                bhk: requirements.bhk || '',
                locationDistance: contact.locationDistance || requirements.locationDistance || '',
                requirement: requirements.requirement || '',
                assignedToAgentId: contact.assignedToAgentId || contact.executiveId || null,
                assignedToAgentName: contact.assignedToAgentName || '',
                comments: contact.comments || '',
            });
        }
    }, [isEditMode, leadDetailsRes]);

    // Compute Options dynamically from API or fallbacks
    const options = useMemo(() => {
        const rawData = apiOptionsData?.data || {};

        const optionMapper = (arr: any[], defaultArr: string[]) => {
            if (Array.isArray(arr) && arr.length > 0) return arr;
            return defaultArr.map((item) => ({ value: item, label: item }));
        };

        return {
            stages: optionMapper(rawData.stages, FALLBACK_STAGES),
            statuses: optionMapper(rawData.statuses, FALLBACK_STATUSES),
            sources: optionMapper(rawData.sources, FALLBACK_SOURCES),
            ratings: Array.isArray(rawData.ratings) && rawData.ratings.length > 0
                ? rawData.ratings
                : FALLBACK_RATINGS.map((r, i) => ({ value: String(i + 1), label: r })),
            facings: optionMapper(rawData.facings, FALLBACK_FACINGS),
            types: optionMapper(rawData.types, FALLBACK_TYPES),
            propertyTypes: optionMapper(rawData.propertyTypes, FALLBACK_PROPERTY_TYPES),
            bhks: optionMapper(rawData.bhks, FALLBACK_BHKS),
        };
    }, [apiOptionsData]);

    // Dynamic matching helper for select input labels
    const getOptionLabel = (field: keyof typeof options, val: string) => {
        if (!val) return '';
        const list = options[field];
        if (list) {
            const match = list.find((item: any) => item.value === val);
            if (match) return match.label;
        }
        return val;
    };

    // Asterisk styling
    const renderAsterisk = () => <Text style={{ color: '#ef4444' }}> *</Text>;

    const openSelector = (title: string, optList: { value: string; label: string }[], field: string) => {
        setSelectorConfig({
            visible: true,
            title,
            options: optList,
            field,
        });
        if (field === 'executive') {
            setExecQuery('');
        }
    };

    const filteredOptions = useMemo(() => {
        if (!selectorConfig) return [];
        return selectorConfig.options;
    }, [selectorConfig]);

    const filteredExecutives = useMemo(() => {
        return executives.filter((e) =>
            e.fullName.toLowerCase().includes(execQuery.toLowerCase())
        );
    }, [executives, execQuery]);

    const selectOption = (optVal: string) => {
        if (selectorConfig) {
            setForm((prev) => ({ ...prev, [selectorConfig.field]: optVal }));
            setSelectorConfig(null);
        }
    };

    // Date picker math helpers
    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstWeekdayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handleMonthChange = (nav: 'prev' | 'next') => {
        const nextMonth = new Date(calendarMonth);
        nextMonth.setMonth(nextMonth.getMonth() + (nav === 'prev' ? -1 : 1));
        setCalendarMonth(nextMonth);
    };

    const renderCalendar = () => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const totalDays = daysInMonth(year, month);
        const startOffset = firstWeekdayOfMonth(year, month);

        const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        const cells = [];

        const monthsStr = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        for (let i = 0; i < startOffset; i++) {
            cells.push(<View key={`empty-${i}`} style={styles.calendarDayEmpty} />);
        }

        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = form.followUpDate === dateStr;

            cells.push(
                <TouchableOpacity
                    key={`day-${day}`}
                    onPress={() => {
                        setForm((prev) => ({ ...prev, followUpDate: dateStr }));
                        setShowDatePicker(false);
                    }}
                    style={[
                        styles.calendarDayBtn,
                        isSelected && { backgroundColor: '#1b6ca8' },
                    ]}
                >
                    <Text style={[styles.calendarDayText, { color: isSelected ? '#ffffff' : textColor }]}>
                        {day}
                    </Text>
                </TouchableOpacity>
            );
        }

        return (
            <View style={[styles.calendarBox, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <View style={styles.calendarHeaderRow}>
                    <TouchableOpacity onPress={() => handleMonthChange('prev')} style={styles.calendarNavBtn}>
                        <ChevronLeft size={18} color={textColor} />
                    </TouchableOpacity>
                    <Text style={[styles.calendarHeaderTitle, { color: textColor }]}>
                        {monthsStr[month]} {year}
                    </Text>
                    <TouchableOpacity onPress={() => handleMonthChange('next')} style={styles.calendarNavBtn}>
                        <ChevronRight size={18} color={textColor} />
                    </TouchableOpacity>
                </View>

                <View style={styles.weekHeaderRow}>
                    {weekDays.map((w) => (
                        <Text key={w} style={[styles.weekDayLabel, { color: subTextColor }]}>
                            {w}
                        </Text>
                    ))}
                </View>

                <View style={styles.daysGrid}>{cells}</View>
            </View>
        );
    };

    const handleSave = () => {
        // Validate required fields
        const required = [
            { key: 'name', label: 'Name' },
            { key: 'contact', label: 'Contact (10 digits)' },
            { key: 'email', label: 'Email' },
            { key: 'stage', label: 'Stage' },
            { key: 'status', label: 'Status' },
            { key: 'source', label: 'Source' },
            { key: 'preferredLocation', label: 'Preferred Location' },
            { key: 'sqft', label: 'Sqft' },
            { key: 'facing', label: 'Facing' },
            { key: 'assignedToAgentId', label: 'Executive' },
        ];

        const missing = required.filter((r) => {
            if (r.key === 'assignedToAgentId') {
                return form.assignedToAgentId === null;
            }
            return !form[r.key as keyof typeof form]?.toString()?.trim();
        });

        if (missing.length > 0) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: `Please provide value for the following required fields:\n${missing
                    .map((m) => `• ${m.label}`)
                    .join('\n')}`,
            });
            return;
        }

        if (form.contact.replace(/[^0-9]/g, '').length !== 10) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Contact must be a valid 10-digit number.',
            });
            return;
        }

        const payload: AddLeadPayload = {
            fullName: form.name.trim(),
            phone: form.contact.trim(),
            email: form.email.trim(),
            stage: form.stage,
            status: form.status,
            source: form.source,
            followUpDate: form.followUpDate ? `${form.followUpDate}T00:00:00` : undefined,
            rating: form.rating || undefined,
            preferredLocation: form.preferredLocation.trim(),
            sqft: form.sqft.trim(),
            facing: form.facing,
            type: form.type || undefined,
            propertyType: form.propertyType || undefined,
            bhk: form.bhk || undefined,
            comments: form.comments ? form.comments.trim() : undefined,
            executiveId: form.assignedToAgentId || undefined,
        };

        if (isEditMode && leadId) {
            updateLeadMutation.mutate(
                { id: leadId, payload },
                {
                    onSuccess: (res) => {
                        if (res.success) {
                            Toast.show({
                                type: 'success',
                                text1: 'Success',
                                text2: res.message || 'Lead updated successfully.',
                            });
                            router.back();
                        } else {
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: res.message || 'Failed to update lead.',
                            });
                        }
                    },
                    onError: (err: any) => {
                        const msg = err.response?.data?.message || err.message || 'Update failed.';
                        Toast.show({
                            type: 'error',
                            text1: 'Error',
                            text2: msg,
                        });
                    },
                }
            );
        } else {
            addLeadMutation.mutate(payload, {
                onSuccess: (res) => {
                    if (res.success) {
                        Toast.show({
                            type: 'success',
                            text1: 'Success',
                            text2: res.message || 'Lead created successfully.',
                        });
                        router.back();
                    } else {
                        Toast.show({
                            type: 'error',
                            text1: 'Error',
                            text2: res.message || 'Failed to create lead.',
                        });
                    }
                },
                onError: (err: any) => {
                    const msg = err.response?.data?.message || err.message || 'Creation failed.';
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: msg,
                    });
                },
            });
        }
    };

    if (isEditMode && isLoadingDetails) {
        return (
            <View style={[styles.loaderWrap, { backgroundColor: bgColor }]}>
                <ActivityIndicator size="large" color={brandCol} />
                <Text style={{ color: subTextColor, marginTop: 12 }}>Loading lead details...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={[styles.mainCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                    {/* Header Bar */}
                    <View style={[styles.headerBar, { backgroundColor: '#1b6ca8' }]}>
                        <View style={styles.headerTitleLeft}>
                            <UserPlus size={20} color="#ffffff" />
                            <Text style={styles.headerTitleText}>
                                {isEditMode ? 'Edit Lead Details' : 'Add New Lead'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                            <X size={18} color="#ffffff" />
                        </TouchableOpacity>
                    </View>

                    {/* Form Content */}
                    <View style={styles.formBody}>
                        {/* ── Section: PERSONAL INFO ── */}
                        <Text style={[styles.sectionTitle, { color: isDark ? '#38bdf8' : '#1b6ca8', borderBottomColor: borderCol }]}>
                            PERSONAL INFO
                        </Text>
                        <View style={styles.fieldsGrid}>
                            {/* Name */}
                            <View style={[styles.fieldWrap, isLargeScreen ? { width: '31.3%' } : { width: '100%' }]}>
                                <Text style={[styles.fieldLabel, { color: textColor }]}>
                                    Name{renderAsterisk()}
                                </Text>
                                <TextInput
                                    style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                                    placeholder="Full name"
                                    placeholderTextColor={subTextColor}
                                    value={form.name}
                                    onChangeText={(val) => setForm((prev) => ({ ...prev, name: val }))}
                                />
                            </View>

                            {/* Contact */}
                            <View style={[styles.fieldWrap, isLargeScreen ? { width: '31.3%' } : { width: '100%' }]}>
                                <Text style={[styles.fieldLabel, { color: textColor }]}>
                                    Contact{renderAsterisk()}
                                </Text>
                                <TextInput
                                    style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                                    placeholder="10-digit number"
                                    placeholderTextColor={subTextColor}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    value={form.contact}
                                    onChangeText={(val) => setForm((prev) => ({ ...prev, contact: val }))}
                                />
                            </View>

                            {/* Email */}
                            <View style={[styles.fieldWrap, isLargeScreen ? { width: '31.3%' } : { width: '100%' }]}>
                                <Text style={[styles.fieldLabel, { color: textColor }]}>
                                    Email{renderAsterisk()}
                                </Text>
                                <TextInput
                                    style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                                    placeholder="email@example.com"
                                    placeholderTextColor={subTextColor}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={form.email}
                                    onChangeText={(val) => setForm((prev) => ({ ...prev, email: val }))}
                                />
                            </View>
                        </View>

                        {/* ── Section: LEAD DETAILS ── */}
                        <Text style={[styles.sectionTitle, { color: isDark ? '#38bdf8' : '#1b6ca8', borderBottomColor: borderCol }]}>
                            LEAD DETAILS
                        </Text>
                        <View style={styles.fieldsGrid}>
                            {/* Stage */}
                            <View style={[styles.fieldWrap, isLargeScreen ? { width: '31.3%' } : { width: '100%' }]}>
                                <Text style={[styles.fieldLabel, { color: textColor }]}>
                                    Stage{renderAsterisk()}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => openSelector('Select Stage', options.stages, 'stage')}
                                    style={[styles.selectInput, { backgroundColor: inputBg, borderColor: borderCol }]}
                                >
                                    <Text style={[styles.selectText, { color: form.stage ? textColor : subTextColor }]} numberOfLines={1}>
                                        {getOptionLabel('stages', form.stage) || 'Select Stage'}
                                    </Text>
                                    <ChevronDown size={16} color={subTextColor} />
                                </TouchableOpacity>
                            </View>

                            {/* Status */}
                            <View style={[styles.fieldWrap, isLargeScreen ? { width: '31.3%' } : { width: '100%' }]}>
                                <Text style={[styles.fieldLabel, { color: textColor }]}>
                                    Status{renderAsterisk()}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => openSelector('Select Status', options.statuses, 'status')}
                                    style={[styles.selectInput, { backgroundColor: inputBg, borderColor: borderCol }]}
                                >
                                    <Text style={[styles.selectText, { color: form.status ? textColor : subTextColor }]} numberOfLines={1}>
                                        {getOptionLabel('statuses', form.status) || 'Select Status'}
                                    </Text>
                                    <ChevronDown size={16} color={subTextColor} />
                                </TouchableOpacity>
                            </View>

                            {/* Source */}
                            <View style={[styles.fieldWrap, isLargeScreen ? { width: '31.3%' } : { width: '100%' }]}>
                                <Text style={[styles.fieldLabel, { color: textColor }]}>
                                    Source{renderAsterisk()}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => openSelector('Select Source', options.sources, 'source')}
                                    style={[styles.selectInput, { backgroundColor: inputBg, borderColor: borderCol }]}
                                >
                                    <Text style={[styles.selectText, { color: form.source ? textColor : subTextColor }]} numberOfLines={1}>
                                        {getOptionLabel('sources', form.source) || 'Select Source'}
                                    </Text>
                                    <ChevronDown size={16} color={subTextColor} />
                                </TouchableOpacity>
                            </View>

                            {/* Follow Up Date */}
                            <View style={[styles.fieldWrap, isLargeScreen ? { width: '31.3%' } : { width: '100%' }]}>
                                <Text style={[styles.fieldLabel, { color: textColor }]}>
                                    Follow Up Date
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(true)}
                                    style={[styles.selectInput, { backgroundColor: inputBg, borderColor: borderCol }]}
                                >
                                    <Text style={[styles.selectText, { color: form.followUpDate ? textColor : subTextColor }]} numberOfLines={1}>
                                        {form.followUpDate || 'Select date'}
                                    </Text>
                                    <CalendarDays size={16} color={subTextColor} />
                                </TouchableOpacity>
                            </View>

                            {/* Rating */}
                            <View style={[styles.fieldWrap, isLargeScreen ? { width: '31.3%' } : { width: '100%' }]}>
                                <Text style={[styles.fieldLabel, { color: textColor }]}>
                                    Rating
                                </Text>
                                <TouchableOpacity
                                    onPress={() => openSelector('Select Rating', options.ratings, 'rating')}
                                    style={[styles.selectInput, { backgroundColor: inputBg, borderColor: borderCol }]}
                                >
                                    <Text style={[styles.selectText, { color: form.rating ? textColor : subTextColor }]} numberOfLines={1}>
                                        {getOptionLabel('ratings', form.rating) || 'Select Rating'}
                                    </Text>
                                    <ChevronDown size={16} color={subTextColor} />
                                </TouchableOpacity>
                            </View>

                            {isLargeScreen && <View style={{ width: '31.3%' }} />}
                        </View>

                        {/* ── Section: PROPERTY DETAILS ── */}
                        <Text style={[styles.sectionTitle, { color: isDark ? '#38bdf8' : '#1b6ca8', borderBottomColor: borderCol }]}>
                            PROPERTY DETAILS
                        </Text>
                        <View style={styles.fieldsGrid}>
                            {/* Preferred Location */}
                            <View style={[styles.fieldWrap, isLargeScreen ? { width: '31.3%' } : { width: '100%' }]}>
                                <Text style={[styles.fieldLabel, { color: textColor }]}>
                                    Preferred Location{renderAsterisk()}
                                </Text>
                                <TextInput
                                    style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                                    placeholder="e.g. Hyderabad"
                                    placeholderTextColor={subTextColor}
                                    value={form.preferredLocation}
                                    onChangeText={(val) => setForm((prev) => ({ ...prev, preferredLocation: val }))}
                                />
                            </View>

                            {/* Sqft */}
                            <View style={[styles.fieldWrap, isLargeScreen ? { width: '31.3%' } : { width: '100%' }]}>
                                <Text style={[styles.fieldLabel, { color: textColor }]}>
                                    Sqft{renderAsterisk()}
                                </Text>
                                <TextInput
                                    style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                                    placeholder="e.g. 1200"
                                    placeholderTextColor={subTextColor}
                                    keyboardType="numeric"
                                    value={form.sqft}
                                    onChangeText={(val) => setForm((prev) => ({ ...prev, sqft: val }))}
                                />
                            </View>

                            {/* Facing */}
                            <View style={[styles.fieldWrap, isLargeScreen ? { width: '31.3%' } : { width: '100%' }]}>
                                <Text style={[styles.fieldLabel, { color: textColor }]}>
                                    Facing{renderAsterisk()}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => openSelector('Select Facing', options.facings, 'facing')}
                                    style={[styles.selectInput, { backgroundColor: inputBg, borderColor: borderCol }]}
                                >
                                    <Text style={[styles.selectText, { color: form.facing ? textColor : subTextColor }]} numberOfLines={1}>
                                        {getOptionLabel('facings', form.facing) || 'Select Facing'}
                                    </Text>
                                    <ChevronDown size={16} color={subTextColor} />
                                </TouchableOpacity>
                            </View>

                            {/* Type */}
                            <View style={[styles.fieldWrap, isLargeScreen ? { width: '31.3%' } : { width: '100%' }]}>
                                <Text style={[styles.fieldLabel, { color: textColor }]}>
                                    Type
                                </Text>
                                <TouchableOpacity
                                    onPress={() => openSelector('Select Type', options.types, 'type')}
                                    style={[styles.selectInput, { backgroundColor: inputBg, borderColor: borderCol }]}
                                >
                                    <Text style={[styles.selectText, { color: form.type ? textColor : subTextColor }]} numberOfLines={1}>
                                        {getOptionLabel('types', form.type) || 'Select Type'}
                                    </Text>
                                    <ChevronDown size={16} color={subTextColor} />
                                </TouchableOpacity>
                            </View>

                            {/* Property Type */}
                            <View style={[styles.fieldWrap, isLargeScreen ? { width: '31.3%' } : { width: '100%' }]}>
                                <Text style={[styles.fieldLabel, { color: textColor }]}>
                                    Property Type
                                </Text>
                                <TouchableOpacity
                                    onPress={() => openSelector('Select Property Type', options.propertyTypes, 'propertyType')}
                                    style={[styles.selectInput, { backgroundColor: inputBg, borderColor: borderCol }]}
                                >
                                    <Text style={[styles.selectText, { color: form.propertyType ? textColor : subTextColor }]} numberOfLines={1}>
                                        {getOptionLabel('propertyTypes', form.propertyType) || 'Select Property Type'}
                                    </Text>
                                    <ChevronDown size={16} color={subTextColor} />
                                </TouchableOpacity>
                            </View>

                            {/* BHK */}
                            <View style={[styles.fieldWrap, isLargeScreen ? { width: '31.3%' } : { width: '100%' }]}>
                                <Text style={[styles.fieldLabel, { color: textColor }]}>
                                    BHK
                                </Text>
                                <TouchableOpacity
                                    onPress={() => openSelector('Select BHK', options.bhks, 'bhk')}
                                    style={[styles.selectInput, { backgroundColor: inputBg, borderColor: borderCol }]}
                                >
                                    <Text style={[styles.selectText, { color: form.bhk ? textColor : subTextColor }]} numberOfLines={1}>
                                        {getOptionLabel('bhks', form.bhk) || 'Select BHK'}
                                    </Text>
                                    <ChevronDown size={16} color={subTextColor} />
                                </TouchableOpacity>
                            </View>

                            {/* Location Distance */}
                            <View style={[styles.fieldWrap, isLargeScreen ? { width: '31.3%' } : { width: '100%' }]}>
                                <Text style={[styles.fieldLabel, { color: textColor }]}>
                                    Location Distance
                                </Text>
                                <TextInput
                                    style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                                    placeholder="e.g. 5km"
                                    placeholderTextColor={subTextColor}
                                    value={form.locationDistance}
                                    onChangeText={(val) => setForm((prev) => ({ ...prev, locationDistance: val }))}
                                />
                            </View>

                            {/* Requirement */}
                            <View style={[styles.fieldWrap, isLargeScreen ? { width: '31.3%' } : { width: '100%' }]}>
                                <Text style={[styles.fieldLabel, { color: textColor }]}>
                                    Requirement
                                </Text>
                                <TextInput
                                    style={[styles.textInput, { backgroundColor: inputBg, color: textColor, borderColor: borderCol }]}
                                    placeholder="Requirement"
                                    placeholderTextColor={subTextColor}
                                    value={form.requirement}
                                    onChangeText={(val) => setForm((prev) => ({ ...prev, requirement: val }))}
                                />
                            </View>

                            {/* Executive */}
                            <View style={[styles.fieldWrap, isLargeScreen ? { width: '31.3%' } : { width: '100%' }]}>
                                <Text style={[styles.fieldLabel, { color: textColor }]}>
                                    Executive{renderAsterisk()}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => openSelector('Search Executives', [], 'executive')}
                                    style={[styles.selectInput, { backgroundColor: inputBg, borderColor: borderCol }]}
                                >
                                    <Text style={[styles.selectText, { color: form.assignedToAgentId ? textColor : subTextColor }]} numberOfLines={1}>
                                        {form.assignedToAgentName || 'Search executives...'}
                                    </Text>
                                    <ChevronDown size={16} color={subTextColor} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* ── Section: COMMENTS ── */}
                        <Text style={[styles.sectionTitle, { color: isDark ? '#38bdf8' : '#1b6ca8', borderBottomColor: borderCol }]}>
                            COMMENTS
                        </Text>
                        <View style={{ width: '100%', marginBottom: 12 }}>
                            <TextInput
                                style={[
                                    styles.textArea,
                                    { backgroundColor: inputBg, color: textColor, borderColor: borderCol },
                                ]}
                                placeholder="Add any notes or comments..."
                                placeholderTextColor={subTextColor}
                                multiline
                                numberOfLines={3}
                                value={form.comments}
                                onChangeText={(val) => setForm((prev) => ({ ...prev, comments: val }))}
                            />
                        </View>
                    </View>

                    {/* Bottom Actions Row */}
                    <View style={[styles.bottomActions, { borderTopColor: borderCol }]}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            disabled={isSubmitting}
                            style={[styles.btnCancel, { backgroundColor: isDark ? '#27272a' : '#f1f5f9' }]}
                        >
                            <Text style={[styles.btnCancelText, { color: isDark ? '#d4d4d8' : '#64748b' }]}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleSave} disabled={isSubmitting} style={[styles.btnSave, { backgroundColor: '#1b6ca8', opacity: isSubmitting ? 0.7 : 1 }]}>
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <>
                                    <FileCheck size={16} color="#ffffff" style={{ marginRight: 6 }} />
                                    <Text style={styles.btnSaveText}>{isEditMode ? 'Update Lead' : 'Save Lead'}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* ── Reusable Selector Popup Modal ── */}
            <Modal visible={selectorConfig !== null} transparent animationType="fade">
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setSelectorConfig(null)}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.selectorCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                        <Text style={[styles.selectorTitle, { color: textColor }]}>
                            {selectorConfig?.title}
                        </Text>

                        {/* Search Input for Executives */}
                        {selectorConfig?.field === 'executive' && (
                            <View style={[styles.modalSearchBox, { backgroundColor: inputBg, borderColor: borderCol }]}>
                                <Search size={16} color={subTextColor} />
                                <TextInput
                                    style={[styles.modalSearchInput, { color: textColor }]}
                                    placeholder="Type to filter..."
                                    placeholderTextColor={subTextColor}
                                    value={execQuery}
                                    onChangeText={setExecQuery}
                                />
                            </View>
                        )}

                        <ScrollView style={styles.selectorList} showsVerticalScrollIndicator={true}>
                            {selectorConfig?.field === 'executive' ? (
                                filteredExecutives.map((exec) => {
                                    const isSelected = form.assignedToAgentId === exec.userId;
                                    return (
                                        <TouchableOpacity
                                            key={exec.userId}
                                            onPress={() => {
                                                setForm((prev) => ({
                                                    ...prev,
                                                    assignedToAgentId: exec.userId,
                                                    assignedToAgentName: exec.fullName,
                                                }));
                                                setSelectorConfig(null);
                                            }}
                                            style={[
                                                styles.selectorItem,
                                                isSelected && { backgroundColor: isDark ? '#1a2e40' : '#f0f9ff' },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.selectorItemText,
                                                    { color: isSelected ? '#1b6ca8' : textColor, fontWeight: isSelected ? '700' : '400' },
                                                ]}
                                            >
                                                {exec.fullName}
                                            </Text>
                                            {isSelected && <Check size={14} color="#1b6ca8" />}
                                        </TouchableOpacity>
                                    );
                                })
                            ) : (
                                filteredOptions.map((opt) => {
                                    const isSelected = form[selectorConfig?.field as keyof typeof form] === opt.value;
                                    return (
                                        <TouchableOpacity
                                            key={opt.value}
                                            onPress={() => selectOption(opt.value)}
                                            style={[
                                                styles.selectorItem,
                                                isSelected && { backgroundColor: isDark ? '#1a2e40' : '#f0f9ff' },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.selectorItemText,
                                                    { color: isSelected ? '#1b6ca8' : textColor, fontWeight: isSelected ? '700' : '400' },
                                                ]}
                                            >
                                                {opt.label}
                                            </Text>
                                            {isSelected && <Check size={14} color="#1b6ca8" />}
                                        </TouchableOpacity>
                                    );
                                })
                            )}

                            {selectorConfig?.field === 'executive' && filteredExecutives.length === 0 && (
                                <Text style={[styles.emptyLabel, { color: subTextColor }]}>No executives match search</Text>
                            )}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── Custom DatePicker Calendar Modal ── */}
            <Modal visible={showDatePicker} transparent animationType="fade">
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowDatePicker(false)}
                    style={styles.modalOverlay}
                >
                    {renderCalendar()}
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loaderWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: Platform.OS === 'web' ? 24 : 12,
        paddingBottom: 60,
        alignItems: 'center',
    },
    mainCard: {
        width: '100%',
        maxWidth: 1000,
        borderRadius: 8,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    headerTitleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitleText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    closeBtn: {
        padding: 4,
    },
    formBody: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.2,
        marginTop: 20,
        marginBottom: 12,
        paddingBottom: 4,
        borderBottomWidth: 1,
    },
    fieldsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
        marginBottom: 8,
    },
    fieldWrap: {
        marginBottom: 12,
        gap: 4,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    textInput: {
        height: 38,
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        fontSize: 13,
    },
    selectInput: {
        height: 38,
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectText: {
        fontSize: 13,
        flex: 1,
    },
    textArea: {
        height: 80,
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 13,
        textAlignVertical: 'top',
    },
    bottomActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 16,
        borderTopWidth: 1,
        gap: 10,
    },
    btnCancel: {
        paddingHorizontal: 16,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
    },
    btnCancelText: {
        fontSize: 13,
        fontWeight: '600',
    },
    btnSave: {
        paddingHorizontal: 16,
        height: 36,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
    },
    btnSaveText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '700',
    },

    // Selector Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    selectorCard: {
        width: '90%',
        maxWidth: 360,
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        maxHeight: '70%',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    selectorTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 12,
    },
    selectorList: {
        marginTop: 6,
    },
    selectorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 6,
        marginVertical: 1,
    },
    selectorItemText: {
        fontSize: 13,
    },
    emptyLabel: {
        fontSize: 12,
        textAlign: 'center',
        paddingVertical: 12,
    },
    modalSearchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 36,
        marginBottom: 10,
        gap: 8,
    },
    modalSearchInput: {
        flex: 1,
        fontSize: 13,
        height: '100%',
    },

    // Custom Calendar Modal
    calendarBox: {
        width: 320,
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        elevation: 8,
    },
    calendarHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    calendarNavBtn: {
        padding: 6,
    },
    calendarHeaderTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    weekHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    weekDayLabel: {
        width: 38,
        textAlign: 'center',
        fontSize: 11,
        fontWeight: '600',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: 6,
    },
    calendarDayBtn: {
        width: 38,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
    },
    calendarDayText: {
        fontSize: 12,
        fontWeight: '500',
    },
    calendarDayEmpty: {
        width: 38,
        height: 32,
    },
});