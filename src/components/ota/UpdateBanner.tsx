import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { useOtaUpdate } from '../../hooks/useOtaUpdate';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { ArrowUpCircle, RefreshCw, X, CheckCircle2 } from 'lucide-react-native';

export function UpdateBanner() {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const {
    isUpdateAvailable,
    isUpdateReady,
    isDownloading,
    progress,
    availableUpdate,
    downloadUpdate,
    applyUpdate,
    dismissUpdate,
  } = useOtaUpdate();

  const [dismissed, setDismissed] = useState(false);

  if (dismissed || (!isUpdateAvailable && !isUpdateReady)) {
    return null;
  }

  const handleAction = async () => {
    if (isUpdateReady) {
      await applyUpdate();
    } else if (isUpdateAvailable) {
      await downloadUpdate();
    }
  };

  const handleDismiss = async () => {
    setDismissed(true);
    await dismissUpdate();
  };

  const cardBg = isDark ? '#18181b' : '#ffffff';
  const borderCol = isUpdateReady ? '#10b981' : isDark ? '#27272a' : '#e2e8f0';
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.bannerCard,
          {
            backgroundColor: cardBg,
            borderColor: borderCol,
            shadowColor: isDark ? '#000' : '#64748b',
          },
        ]}
      >
        <View style={styles.contentRow}>
          {/* Icon */}
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isUpdateReady
                  ? '#10b98118'
                  : '#3b82f618',
              },
            ]}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : isUpdateReady ? (
              <CheckCircle2 size={18} color="#10b981" />
            ) : (
              <ArrowUpCircle size={18} color="#3b82f6" />
            )}
          </View>

          {/* Text Information */}
          <View style={styles.textColumn}>
            <Text style={[styles.title, { color: textColor }]}>
              {isUpdateReady
                ? 'Update Ready to Install'
                : isDownloading
                ? `Downloading Update (${progress}%)`
                : 'New Version Available'}
            </Text>
            <Text style={[styles.subtitle, { color: subTextColor }]} numberOfLines={1}>
              {isUpdateReady
                ? 'Restart app to apply latest improvements'
                : availableUpdate?.releaseNotes
                ? availableUpdate.releaseNotes
                : 'Over-the-air performance and feature updates'}
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={handleAction}
            disabled={isDownloading}
            style={[
              styles.actionBtn,
              {
                backgroundColor: isUpdateReady ? '#10b981' : '#3b82f6',
                opacity: isDownloading ? 0.7 : 1,
              },
            ]}
            activeOpacity={0.8}
          >
            {isDownloading ? (
              <Text style={styles.actionBtnText}>{progress}%</Text>
            ) : isUpdateReady ? (
              <View style={styles.btnRow}>
                <RefreshCw size={12} color="#ffffff" />
                <Text style={styles.actionBtnText}>Restart</Text>
              </View>
            ) : (
              <Text style={styles.actionBtnText}>Update</Text>
            )}
          </TouchableOpacity>

          {/* Dismiss Button (for optional updates) */}
          {!availableUpdate?.isMandatory && !isDownloading && (
            <TouchableOpacity
              onPress={handleDismiss}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={subTextColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Progress Bar when downloading */}
        {isDownloading && (
          <View style={[styles.progressTrack, { backgroundColor: isDark ? '#27272a' : '#f1f5f9' }]}>
            <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: '#3b82f6' }]} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 99999,
  },
  bannerCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
    marginLeft: 2,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});
