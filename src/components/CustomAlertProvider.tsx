import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Alert,
  AlertButton,
  AlertOptions,
} from 'react-native';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Trash2,
  LogOut,
} from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getAdminTheme } from '../theme/adminTheme';

export interface CustomAlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: AlertOptions;
}

interface CustomAlertContextType {
  showAlert: (config: CustomAlertConfig) => void;
  hideAlert: () => void;
}

const CustomAlertContext = createContext<CustomAlertContextType | null>(null);

export const useCustomAlert = () => {
  const context = useContext(CustomAlertContext);
  if (!context) {
    throw new Error('useCustomAlert must be used within a CustomAlertProvider');
  }
  return context;
};

// Global reference for Alert.alert override
let globalShowAlert: ((config: CustomAlertConfig) => void) | null = null;

export function CustomAlertProvider({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const theme = getAdminTheme(isDark);

  const [alertConfig, setAlertConfig] = useState<CustomAlertConfig | null>(null);
  const [visible, setVisible] = useState(false);

  const showAlert = useCallback((config: CustomAlertConfig) => {
    setAlertConfig(config);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
    setAlertConfig(null);
  }, []);

  useEffect(() => {
    globalShowAlert = showAlert;

    // Global override of React Native's Alert.alert
    const originalAlert = Alert.alert;
    Alert.alert = (
      title: string,
      message?: string,
      buttons?: AlertButton[],
      options?: AlertOptions
    ) => {
      if (globalShowAlert) {
        globalShowAlert({ title, message, buttons, options });
      } else {
        originalAlert(title, message, buttons, options);
      }
    };

    return () => {
      Alert.alert = originalAlert;
      globalShowAlert = null;
    };
  }, [showAlert]);

  const handleButtonPress = (btn?: AlertButton) => {
    hideAlert();
    if (btn?.onPress) {
      btn.onPress();
    }
  };

  const title = alertConfig?.title || '';
  const message = alertConfig?.message || '';
  const buttons = alertConfig?.buttons && alertConfig.buttons.length > 0
    ? alertConfig.buttons
    : [{ text: 'OK', style: 'default' as const }];

  const isDestructive = buttons.some((b) => b.style === 'destructive') ||
    title.toLowerCase().includes('delete') ||
    title.toLowerCase().includes('remove') ||
    title.toLowerCase().includes('logout') ||
    title.toLowerCase().includes('log out');

  const isSuccess = title.toLowerCase().includes('success') ||
    title.toLowerCase().includes('saved') ||
    title.toLowerCase().includes('completed') ||
    title.toLowerCase().includes('copied');

  const isWarning = title.toLowerCase().includes('warning') ||
    title.toLowerCase().includes('validation') ||
    title.toLowerCase().includes('required');

  const isError = title.toLowerCase().includes('error') ||
    title.toLowerCase().includes('failed') ||
    title.toLowerCase().includes('denied');

  const renderIcon = () => {
    if (title.toLowerCase().includes('logout') || title.toLowerCase().includes('log out')) {
      return (
        <View style={[styles.iconContainer, { backgroundColor: '#ef444418', borderColor: '#ef444435' }]}>
          <LogOut size={26} color="#ef4444" />
        </View>
      );
    }
    if (title.toLowerCase().includes('delete') || title.toLowerCase().includes('remove')) {
      return (
        <View style={[styles.iconContainer, { backgroundColor: '#ef444418', borderColor: '#ef444435' }]}>
          <Trash2 size={26} color="#ef4444" />
        </View>
      );
    }
    if (isDestructive || isError) {
      return (
        <View style={[styles.iconContainer, { backgroundColor: '#ef444418', borderColor: '#ef444435' }]}>
          <XCircle size={26} color="#ef4444" />
        </View>
      );
    }
    if (isSuccess) {
      return (
        <View style={[styles.iconContainer, { backgroundColor: '#10b98118', borderColor: '#10b98135' }]}>
          <CheckCircle2 size={26} color="#10b981" />
        </View>
      );
    }
    if (isWarning) {
      return (
        <View style={[styles.iconContainer, { backgroundColor: '#f59e0b18', borderColor: '#f59e0b35' }]}>
          <AlertTriangle size={26} color="#f59e0b" />
        </View>
      );
    }
    return (
      <View style={[styles.iconContainer, { backgroundColor: '#3b82f618', borderColor: '#3b82f635' }]}>
        <Info size={26} color="#3b82f6" />
      </View>
    );
  };

  const isTwoButtons = buttons.length === 2;

  return (
    <CustomAlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {visible && (
        <Modal
          visible={visible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            if (alertConfig?.options?.cancelable) {
              hideAlert();
            }
          }}
        >
          <View style={styles.overlay}>
            <TouchableWithoutFeedback
              onPress={() => {
                if (alertConfig?.options?.cancelable || buttons.length <= 1) {
                  hideAlert();
                }
              }}
            >
              <View style={StyleSheet.absoluteFill} />
            </TouchableWithoutFeedback>

            <View
              style={[
                styles.dialogCard,
                {
                  backgroundColor: theme.cardBg,
                  borderColor: theme.border,
                },
              ]}
            >
              {renderIcon()}

              {title ? (
                <Text style={[styles.dialogTitle, { color: theme.textPrimary }]}>
                  {title}
                </Text>
              ) : null}

              {message ? (
                <Text style={[styles.dialogMessage, { color: theme.textSecondary }]}>
                  {message}
                </Text>
              ) : null}

              <View
                style={[
                  styles.buttonContainer,
                  isTwoButtons ? styles.buttonRow : styles.buttonColumn,
                ]}
              >
                {buttons.map((btn, index) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestruct = btn.style === 'destructive';

                  let btnBg = theme.brand;
                  let textColor = '#ffffff';
                  let borderWidth = 0;
                  let borderColor = 'transparent';

                  if (isCancel) {
                    btnBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
                    textColor = theme.textPrimary;
                    borderWidth = 1;
                    borderColor = theme.border;
                  } else if (isDestruct) {
                    btnBg = '#ef4444';
                    textColor = '#ffffff';
                  }

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleButtonPress(btn)}
                      style={[
                        styles.btn,
                        isTwoButtons && styles.btnFlex,
                        {
                          backgroundColor: btnBg,
                          borderWidth,
                          borderColor,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.btnText,
                          {
                            color: textColor,
                            fontWeight: isCancel ? '600' : '700',
                          },
                        ]}
                      >
                        {btn.text || 'OK'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </CustomAlertContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 99999,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  dialogMessage: {
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 6,
  },
  buttonContainer: {
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonColumn: {
    flexDirection: 'column',
    gap: 10,
  },
  btn: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnFlex: {
    flex: 1,
  },
  btnText: {
    fontSize: 14,
  },
});
