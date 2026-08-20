import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ChevronLeft,
    FileText,
    Ban,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../../theme/adminTheme';
import { useBookingDetail, useCancelBooking } from '../../../../admin/hooks/useBookings';

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'N/A';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
        return 'N/A';
    }
}

function formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '₹0.00';
    return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export default function BookingDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const bookingId = id ? parseInt(id, 10) : 0;

    const { isDark } = useTheme();
    const theme = getAdminTheme(isDark);

    const { data: detailResponse, isLoading } = useBookingDetail(bookingId);
    const booking = detailResponse?.data;

    const cancelBookingMutation = useCancelBooking();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Confirmed':
            case 'Completed':
                return { bg: isDark ? '#064e3b' : '#d1fae5', text: isDark ? '#34d399' : '#059669' };
            case 'Cancelled':
                return { bg: isDark ? '#7f1d1d' : '#fee2e2', text: isDark ? '#f87171' : '#dc2626' };
            case 'Pending':
            default:
                return { bg: isDark ? '#27272a' : '#f3f4f6', text: isDark ? '#d4d4d8' : '#4b5563' };
        }
    };

    const handleCancelBooking = () => {
        // Show a toast confirm instead of Alert
        Toast.show({
            type: 'error',
            text1: 'Confirm Cancellation',
            text2: 'Tap cancel button again to confirm.',
            visibilityTime: 3000,
        });

        cancelBookingMutation.mutate(bookingId, {
            onSuccess: () => {
                Toast.show({ type: 'success', text1: 'Cancelled', text2: 'Booking cancelled successfully.' });
                router.back();
            },
            onError: (err: any) => {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: err.response?.data?.message || err.message || 'Could not cancel booking.',
                });
            },
        });
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.primaryBg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.brand} />
                <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Loading booking details...</Text>
            </View>
        );
    }

    if (!booking) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.primaryBg, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '700' }}>Booking Not Found</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
                    <Text style={{ color: theme.brand, fontWeight: '600' }}>← Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const statusColors = getStatusColor(booking.status);

    return (
        <View style={{ flex: 1, backgroundColor: theme.primaryBg }}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={22} color={theme.textPrimary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                        {booking.bookingNumber}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.statusText, { color: statusColors.text }]}>{booking.status}</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Client & Property Info ─────────────────────────── */}
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Client & Property Info</Text>
                <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                    {[
                        { label: 'Client', value: booking.leadName },
                        { label: 'Email', value: booking.leadEmail },
                        { label: 'Phone', value: booking.Contact },
                        { label: 'Property', value: booking.propertyName },
                        { label: 'Unit/Flat', value: booking.flatNumber },
                        booking.quotationNumber ? { label: 'Quotation', value: booking.quotationNumber } : null,
                        { label: 'Booking Date', value: formatDate(booking.bookingDate) },
                        { label: 'Agreement Date', value: formatDate(booking.agreementDate) },
                        { label: 'Possession Date', value: formatDate(booking.possessionDate) },
                        { label: 'Payment Type', value: booking.paymentType },
                    ]
                        .filter(Boolean)
                        .map((row, i) => (
                            <View key={i} style={{ marginTop: i === 0 ? 0 : 6 }}>
                                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                                    <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>{row!.label}: </Text>
                                    {row!.value ?? 'N/A'}
                                </Text>
                            </View>
                        ))}
                </View>

                {/* ── Financial Summary ──────────────────────────────── */}
                <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: 16 }]}>Financial Summary</Text>
                <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border, gap: 8 }]}>
                    <View style={styles.summaryRow}>
                        <Text style={{ color: theme.textSecondary }}>Booking Amount</Text>
                        <Text style={{ color: theme.textPrimary, fontWeight: '500' }}>{formatCurrency(booking.bookingAmount)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={{ color: theme.textSecondary }}>Total Commitment</Text>
                        <Text style={{ color: theme.textPrimary, fontWeight: '500' }}>{formatCurrency(booking.totalCommitment)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={{ color: theme.textSecondary }}>Paid Amount</Text>
                        <Text style={{ color: '#059669', fontWeight: '600' }}>{formatCurrency(booking.paidAmount)}</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <View style={styles.summaryRow}>
                        <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 14 }}>Outstanding Balance</Text>
                        <Text style={{ color: theme.brand, fontWeight: '700', fontSize: 15 }}>{formatCurrency(booking.outstandingAmount)}</Text>
                    </View>
                </View>

                {/* ── Installments ──────────────────────────────────── */}
                {booking.installments && booking.installments.length > 0 && (
                    <>
                        <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: 16 }]}>
                            Milestone Installments
                        </Text>
                        <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border, padding: 0, overflow: 'hidden' }]}>
                            <View style={[styles.tableHeader, { backgroundColor: theme.inputBg, borderBottomColor: theme.border }]}>
                                <Text style={[styles.thText, { flex: 2, color: theme.textSecondary }]}>Milestone</Text>
                                <Text style={[styles.thText, { flex: 1.5, color: theme.textSecondary, textAlign: 'center' }]}>Due Date</Text>
                                <Text style={[styles.thText, { flex: 1.5, color: theme.textSecondary, textAlign: 'right' }]}>Amount</Text>
                            </View>
                            {booking.installments.map((inst) => (
                                <View key={inst.installmentId} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                                    <View style={{ flex: 2 }}>
                                        <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '600' }}>{inst.milestoneName}</Text>
                                        <Text style={{ color: inst.status === 'Paid' ? '#059669' : '#d97706', fontSize: 11 }}>{inst.status}</Text>
                                    </View>
                                    <Text style={{ flex: 1.5, color: theme.textPrimary, fontSize: 12, textAlign: 'center' }}>
                                        {formatDate(inst.dueDate)}
                                    </Text>
                                    <Text style={{ flex: 1.5, color: theme.textPrimary, fontSize: 13, fontWeight: '600', textAlign: 'right' }}>
                                        {formatCurrency(inst.amount)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* ── Documents ─────────────────────────────────────── */}
                {booking.documents && booking.documents.length > 0 && (
                    <>
                        <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: 16 }]}>Booking Documents</Text>
                        <View style={{ gap: 8 }}>
                            {booking.documents.map((doc) => (
                                <View
                                    key={doc.documentId}
                                    style={[styles.docRow, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}
                                >
                                    <FileText size={16} color={theme.brand} />
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Text style={{ color: theme.textPrimary, fontSize: 12, fontWeight: '600' }}>{doc.documentName}</Text>
                                        <Text style={{ color: theme.textMuted, fontSize: 10 }}>
                                            Type: {doc.documentType} · Uploaded {formatDate(doc.uploadedOn)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* ── Notes ─────────────────────────────────────────── */}
                {booking.notes ? (
                    <>
                        <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: 16 }]}>Notes</Text>
                        <View style={[styles.card, { backgroundColor: theme.secondaryBg, borderColor: theme.border }]}>
                            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{booking.notes}</Text>
                        </View>
                    </>
                ) : null}

                {/* ── Cancel Action ─────────────────────────────────── */}
                {booking.status !== 'Cancelled' && (
                    <TouchableOpacity
                        onPress={handleCancelBooking}
                        disabled={cancelBookingMutation.isPending}
                        style={[styles.cancelBtn, { backgroundColor: '#fee2e2', marginTop: 24 }]}
                    >
                        {cancelBookingMutation.isPending ? (
                            <ActivityIndicator size="small" color="#dc2626" />
                        ) : (
                            <>
                                <Ban size={16} color="#dc2626" />
                                <Text style={{ color: '#dc2626', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>
                                    Cancel Booking
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        gap: 8,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusText: { fontSize: 11, fontWeight: '700' },
    sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
    card: { borderRadius: 16, borderWidth: 1, padding: 16 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    divider: { height: 1, marginVertical: 4 },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
    },
    thText: { fontSize: 11, fontWeight: '700' },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    docRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    cancelBtn: {
        flexDirection: 'row',
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
