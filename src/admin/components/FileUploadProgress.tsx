import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';

interface FileUploadProgressProps {
  fileName: string;
  progress: number; // 0 to 100
  status: 'uploading' | 'success' | 'error';
  errorMessage?: string;
  onRetry?: () => void;
  onCancel?: () => void;
}

export default function FileUploadProgress({
  fileName,
  progress,
  status,
  errorMessage,
  onRetry,
  onCancel,
}: FileUploadProgressProps) {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const brandCol = adminTheme.brand;

  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isUploading = status === 'uploading';

  return (
    <View style={[styles.container, { backgroundColor: cardBg, borderColor: isError ? '#ef4444' : borderCol }]}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.fileName, { color: textColor }]} numberOfLines={1}>
            {fileName}
          </Text>
          <Text style={[styles.statusText, { color: isError ? '#ef4444' : isSuccess ? brandCol : subTextColor }]}>
            {isSuccess ? 'Upload Complete' : isError ? (errorMessage || 'Upload failed') : `Uploading ${progress}%`}
          </Text>
        </View>

        <View style={styles.actionWrap}>
          {isSuccess && <CheckCircle2 size={18} color={brandCol} />}
          {isError && onRetry && (
            <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
              <RefreshCw size={14} color="#ef4444" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          )}
          {isUploading && onCancel && (
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
              <X size={14} color={subTextColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Progress Track */}
      {isUploading && (
        <View style={[styles.track, { backgroundColor: adminTheme.inputBg }]}>
          <View
            style={[
              styles.fill,
              {
                width: `${Math.min(100, Math.max(0, progress))}%`,
                backgroundColor: brandCol,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginVertical: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  actionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  retryText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
  },
  cancelBtn: {
    padding: 4,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});

