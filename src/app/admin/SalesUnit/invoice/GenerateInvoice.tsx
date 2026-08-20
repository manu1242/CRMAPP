import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Search,
    ChevronDown,
    FileText,
    Building,
    Calendar,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import { useGenerateInvoice } from '../../../../admin/hooks/useInvoices';
import { useBookings } from '../../../../admin/hooks/useBookings';
import { BookingItem } from '../../../../admin/models/BookingTypes';

const STATUS_OPTIONS = ['Generated', 'Sent', 'Paid', 'Partial', 'Overdue', 'Cancelled'];

// ─── Inline Dropdown ──────────────────────────────────────────────────────────
interface InlineDropdownProps<T> {
    isOpen: boolean;
    onToggle: () => void;
    selectedLabel: string;
    placeholder: string;
    items: T[];
    loading?: boolean;
    searchKey: keyof T;
    labelKey: keyof T;
    secondaryLabelKey?: keyof T;
    onSelect: (item: T) => void;
    theme: any;
}

function InlineDropdown<T>({
    isOpen, onToggle, selectedLabel, placeholder,
    items, loading = false, searchKey, labelKey, secondaryLabelKey, onSelect, theme,
}: InlineDropdownProps<T>) {
    const [searchText, setSearchText] = useState('');
    const filtered = items.filter((item) =>
        String(item[searchKey] || '').toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <View style={{ gap: 4 }}>
            <TouchableOpacity
                onPress={onToggle}
                activeOpacity={0.8}
                style={[styles.selectBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
            >
                <Text style={{ color: selectedLabel ? theme.textPrimary : theme.textMuted, fontSize: 14, flex: 1 }} numberOfLines={1}>
                    {selectedLabel || placeholder}
                </Text>
                {loading ? <ActivityIndicator size="small" color={theme.brand} /> : <ChevronDown size={18} color={theme.textSecondary} />}
            </TouchableOpacity>

            {isOpen && (
                <View style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 12, backgroundColor: theme.secondaryBg, marginTop: 4, padding: 8, maxHeight: 220, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', height: 38, borderRadius: 8, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.inputBg, paddingHorizontal: 10, gap: 6, marginBottom: 8 }}>
                        <Search size={14} color={theme.textSecondary} />
                        <TextInput style={{ flex: 1, fontSize: 13, color: theme.textPrimary, paddingVertical: 0 }} placeholder="Type to filter..." placeholderTextColor={theme.textMuted} value={searchText} onChangeText={setSearchText} />
                    </View>
                    <ScrollView style={{ flexGrow: 0 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                        {filtered.length > 0 ? filtered.map((item, idx) => {
                            const label = String(item[labelKey] || '');
                            const sec = secondaryLabelKey ? String(item[secondaryLabelKey] || '') : '';
                            return (
                                <TouchableOpacity key={idx} onPress={() => { onSelect(item); setSearchText(''); }} style={{ paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: idx === filtered.length - 1 ? 0 : 1, borderBottomColor: theme.border }}>
                                    <Text style={{ fontSize: 13, fontWeight: '500', color: theme.textPrimary }}>{label}</Text>
                                    {sec ? <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>{sec}</Text> : null}
                                </TouchableOpacity>
                            );
                        }) : (
                            <View style={{ padding: 12, alignItems: 'center' }}><Text style={{ color: theme.textSecondary, fontSize: 12 }}>No records found</Text></View>
                        )}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function GenerateInvoiceScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const theme = getAdminTheme(isDark);

    const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
    const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().split('T')[0];
    });
    const [customAmount, setCustomAmount] = useState('0.00');
    const [taxAmount] = useState('0');
    const [status, setStatus] = useState('Generated');
    const [notes, setNotes] = useState('');

    const [isBookingOpen, setBookingOpen] = useState(false);
    const [isStatusOpen, setStatusOpen] = useState(false);

    const { data: bookingsRes, isLoading: isBookingsLoading } = useBookings(1, 100);
    const bookingsList = bookingsRes?.data?.items ?? [];

    const generateInvoiceMutation = useGenerateInvoice();

    const handleBookingSelect = (booking: BookingItem) => {
        setSelectedBooking(booking);
        setCustomAmount(booking.totalAmount.toString());
        setBookingOpen(false);
    };

    const handleSubmit = () => {
        if (!selectedBooking) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select a Booking.' });
            return;
        }
        if (!invoiceDate) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter Invoice Date.' });
            return;
        }
        if (!dueDate) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter Due Date.' });
            return;
        }
        const amt = parseFloat(customAmount);
        if (isNaN(amt) || amt < 0) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter a valid Amount.' });
            return;
        }

        const payload: any = {
            bookingId: selectedBooking.bookingId,
            amount: amt,
            taxAmount: parseFloat(taxAmount) || 0,
            totalAmount: amt + (parseFloat(taxAmount) || 0),
            invoiceDate: `${invoiceDate}T00:00:00Z`,
            dueDate: `${dueDate}T00:00:00Z`,
            status,
            notes: notes.trim() || null,
        };

        generateInvoiceMutation.mutate(payload, {
            onSuccess: (res: any) => {
                Toast.show({ type: 'success', text1: 'Success', text2: res.message || 'Invoice generated successfully!' });
                router.replace('/admin/SalesUnit/invoice');
            },
            onError: (err: any) => {
                let errMsg = 'Failed to generate invoice.';
                if (err.response?.data) {
                    if (err.response.data.message) {
                        errMsg = err.response.data.message;
                    } else if (err.response.data.errors) {
                        const errorsObj = err.response.data.errors;
                        const errorDetails = Object.keys(errorsObj)
                            .map((key) => `${key}: ${errorsObj[key].join(', ')}`)
                            .join('; ');
                        if (errorDetails) errMsg = errorDetails;
                    } else if (typeof err.response.data === 'string') {
                        errMsg = err.response.data;
                    }
                } else if (err.message) {
                    errMsg = err.message;
                }
                Toast.show({ type: 'error', text1: 'Error', text2: errMsg });
            },
        });
    };

    const totalAmountCalc = (parseFloat(customAmount) || 0) + (parseFloat(taxAmount) || 0);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, backgroundColor: theme.primaryBg }}
            keyboardVerticalOffset={insets.top}
        >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top + 12 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={22} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Generate Invoice</Text>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom + 100, 120) }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={{ gap: 16 }}>

                    {/* ── Select Booking ──────────────────────────────── */}
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Select Booking</Text>
                    <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <Building size={16} color={theme.brand} />
                            <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '700' }}>Booking</Text>
                        </View>
                        <Text style={[styles.inputLabel, { color: theme.textSecondary, marginBottom: 6 }]}>
                            Choose Booking <Text style={{ color: '#ef4444' }}>*</Text>
                        </Text>
                        <InlineDropdown
                            isOpen={isBookingOpen}
                            onToggle={() => { setBookingOpen(!isBookingOpen); setStatusOpen(false); }}
                            selectedLabel={selectedBooking ? `${selectedBooking.bookingNumber} (${selectedBooking.leadName})` : ''}
                            placeholder="Search bookings..."
                            items={bookingsList}
                            loading={isBookingsLoading}
                            searchKey="bookingNumber"
                            labelKey="bookingNumber"
                            secondaryLabelKey="leadName"
                            onSelect={handleBookingSelect}
                            theme={theme}
                        />
                    </View>

                    {/* ── Invoice Details ─────────────────────────────── */}
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Invoice Details</Text>
                    <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border, gap: 14 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: -4 }}>
                            <FileText size={16} color={theme.brand} />
                            <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '700' }}>Details</Text>
                        </View>

                        {/* Invoice Date & Amount row */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                    Invoice Date <Text style={{ color: '#ef4444' }}>*</Text>
                                </Text>
                                <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                    <TextInput style={[styles.textInput, { color: theme.textPrimary }]} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textMuted} value={invoiceDate} onChangeText={setInvoiceDate} />
                                    <Calendar size={14} color={theme.textSecondary} />
                                </View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                    Amount (₹) <Text style={{ color: '#ef4444' }}>*</Text>
                                </Text>
                                <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                    <Text style={{ color: theme.textPrimary, fontSize: 13, marginRight: 4 }}>₹</Text>
                                    <TextInput style={[styles.textInput, { color: theme.textPrimary }]} placeholder="0.00" placeholderTextColor={theme.textMuted} keyboardType="numeric" value={customAmount} onChangeText={setCustomAmount} />
                                </View>
                            </View>
                        </View>

                        {/* Due Date & Total row */}
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                    Due Date <Text style={{ color: '#ef4444' }}>*</Text>
                                </Text>
                                <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                                    <TextInput style={[styles.textInput, { color: theme.textPrimary }]} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textMuted} value={dueDate} onChangeText={setDueDate} />
                                    <Calendar size={14} color={theme.textSecondary} />
                                </View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Total Amount</Text>
                                <View style={[styles.inputRow, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
                                    <Text style={{ color: '#d97706', fontSize: 13, fontWeight: '700', marginRight: 4 }}>₹</Text>
                                    <TextInput style={[styles.textInput, { color: '#d97706', fontWeight: '700' }]} value={String(totalAmountCalc)} editable={false} />
                                </View>
                            </View>
                        </View>

                        {/* Status */}
                        <View>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                                Status <Text style={{ color: '#ef4444' }}>*</Text>
                            </Text>
                            <InlineDropdown
                                isOpen={isStatusOpen}
                                onToggle={() => { setStatusOpen(!isStatusOpen); setBookingOpen(false); }}
                                selectedLabel={status}
                                placeholder="Select status..."
                                items={STATUS_OPTIONS.map(s => ({ statusName: s }))}
                                searchKey="statusName"
                                labelKey="statusName"
                                onSelect={(item) => { setStatus(item.statusName); setStatusOpen(false); }}
                                theme={theme}
                            />
                        </View>
                    </View>

                    {/* ── Notes ───────────────────────────────────────── */}
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Notes (Optional)</Text>
                    <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                        <TextInput
                            style={[styles.notesArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                            multiline
                            numberOfLines={4}
                            placeholder="Additional invoice notes..."
                            placeholderTextColor={theme.textMuted}
                            value={notes}
                            onChangeText={setNotes}
                        />
                    </View>

                    {/* ── Submit ──────────────────────────────────────── */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={generateInvoiceMutation.isPending}
                        style={[styles.submitBtn, { backgroundColor: theme.brand }]}
                    >
                        {generateInvoiceMutation.isPending ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>Generate Invoice</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 8 },
    backBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '600' },
    sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: -8 },
    card: { borderRadius: 16, borderWidth: 1, padding: 16 },
    inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
    selectBox: { flexDirection: 'row', height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'space-between' },
    inputRow: { flexDirection: 'row', height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, alignItems: 'center', marginTop: 6 },
    textInput: { flex: 1, fontSize: 13 },
    notesArea: { borderRadius: 12, borderWidth: 1, padding: 12, textAlignVertical: 'top', fontSize: 13, minHeight: 80 },
    submitBtn: { height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
});
