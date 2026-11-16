import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRemoteConfig } from '../../hooks/useRemoteConfig';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import { AlertTriangle, ExternalLink } from 'lucide-react-native';

export function ForceUpdateModal() {
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);
  const { isForceUpdateRequired, config, installedVersion } = useRemoteConfig();

  if (!isForceUpdateRequired) {
    return null;
  }

  const isIos = Platform.OS === 'ios';
  const storeName = isIos ? 'Apple App Store' : 'Google Play Store';

  const handleOpenStore = () => {
    const url = isIos
      ? config.appStoreUrl || 'https://apps.apple.com/app/id6816377854'
      : config.playStoreUrl || 'https://play.google.com/store/apps/details?id=com.ultrakey.crm';
    Linking.openURL(url).catch((err) => {
      console.error('[ForceUpdate] Could not open store URL:', err);
    });
  };

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;

  return (
    <Modal visible={true} transparent={false} animationType="fade">
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}>
          <View style={styles.iconCircle}>
            <AlertTriangle size={36} color="#ef4444" />
          </View>

          <Text style={[styles.title, { color: textColor }]}>
            App Update Required
          </Text>

          <Text style={[styles.versionText, { color: subTextColor }]}>
            Current: v{installedVersion} • Required: v{config.minimumSupportedVersion}+
          </Text>

          <Text style={[styles.message, { color: subTextColor }]}>
            This release includes critical native framework, security and architecture updates.
            To continue using UPropTech, please install the latest version from {storeName}.
          </Text>

          <TouchableOpacity
            onPress={handleOpenStore}
            style={styles.updateButton}
            activeOpacity={0.8}
          >
            <View style={styles.btnRow}>
              <Text style={styles.btnText}>Update on {storeName}</Text>
              <ExternalLink size={16} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ef444415',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  message: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  updateButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
