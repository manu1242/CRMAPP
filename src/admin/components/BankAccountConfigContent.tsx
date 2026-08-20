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
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../contexts/ThemeContext';
import { getAdminTheme } from '../../theme/adminTheme';
import {
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Landmark,
  ShieldCheck,
  X,
  CheckCircle,
} from 'lucide-react-native';
import {
  bankAccountService,
  BankAccount,
} from '../services/BankAccountService';

export default function BankAccountConfigContent() {
  const router = useRouter();
  const { isDark } = useTheme();
  const adminTheme = getAdminTheme(isDark);

  const bgColor = adminTheme.primaryBg;
  const cardBg = adminTheme.cardBg;
  const textColor = adminTheme.textPrimary;
  const subTextColor = adminTheme.textSecondary;
  const borderCol = adminTheme.border;
  const inputBg = adminTheme.inputBg || (isDark ? '#1e293b' : '#f8fafc');
  const brandColor = adminTheme.brand || '#8b5cf6';

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number>(0);

  // Form Fields
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountType, setAccountType] = useState('Savings');
  const [isActive, setIsActive] = useState(false);

  const fetchBankAccounts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await bankAccountService.getBankAccounts();
      if (res && res.success && res.data) {
        setBankAccounts(res.data);
      } else {
        setBankAccounts([]);
      }
    } catch (err: any) {
      console.warn('Error fetching bank accounts:', err?.message);
      Toast.show({
        type: 'error',
        text1: 'Fetch Error',
        text2: err?.message || 'Failed to fetch bank accounts',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  const openAddModal = useCallback(() => {
    setEditId(0);
    setAccountHolderName('');
    setAccountNumber('');
    setBankName('');
    setIfscCode('');
    setBranchName('');
    setAccountType('Savings');
    setIsActive(bankAccounts.length === 0);
    setModalVisible(true);
  }, [bankAccounts.length]);

  const openEditModal = useCallback((account: BankAccount) => {
    setEditId(account.id || 0);
    setAccountHolderName(account.accountHolderName);
    setAccountNumber(account.accountNumber);
    setBankName(account.bankName);
    setIfscCode(account.ifscCode);
    setBranchName(account.branchName);
    setAccountType(account.accountType);
    setIsActive(account.isActive);
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!accountHolderName.trim() || !accountNumber.trim() || !bankName.trim() || !ifscCode.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all required fields.',
      });
      return;
    }

    setSaving(true);
    try {
      const payload: BankAccount = {
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        bankName: bankName.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        branchName: branchName.trim(),
        accountType,
        isActive,
      };

      if (editId > 0) {
        payload.id = editId;
      }

      const res = await bankAccountService.saveBankAccount(payload);
      if (res && res.success) {
        Toast.show({
          type: 'success',
          text1: editId > 0 ? 'Account Updated' : 'Account Saved',
          text2: res.message || 'Bank account details saved successfully!',
        });
        setModalVisible(false);
        fetchBankAccounts();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Save Failed',
          text2: res.message || 'Failed to save bank account details',
        });
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: err.message || 'Server error saving bank account details',
      });
    } finally {
      setSaving(false);
    }
  }, [accountHolderName, accountNumber, bankName, ifscCode, branchName, accountType, isActive, editId, fetchBankAccounts]);

  const handleDelete = useCallback((id: number | undefined, name: string) => {
    if (!id) return;
    Alert.alert(
      'Delete Bank Account',
      `Are you sure you want to delete the account: "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await bankAccountService.deleteBankAccount(id);
              if (res && res.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Account Deleted',
                  text2: 'Bank account removed successfully.',
                });
                fetchBankAccounts();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Delete Failed',
                  text2: res.message || 'Failed to delete bank account',
                });
              }
            } catch (err: any) {
              Toast.show({
                type: 'error',
                text1: 'Server Error',
                text2: err.message || 'Server error deleting account',
              });
            }
          },
        },
      ]
    );
  }, [fetchBankAccounts]);

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Top Header Bar */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: cardBg,
          borderBottomWidth: 1,
          borderBottomColor: borderCol,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }} activeOpacity={0.7}>
            <ArrowLeft size={22} color={textColor} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>Bank Accounts</Text>
        </View>

        <TouchableOpacity
          onPress={openAddModal}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: brandColor,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            gap: 4,
          }}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchBankAccounts(true)} colors={[brandColor]} />
        }
      >
        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={brandColor} />
            <Text style={{ marginTop: 12, color: subTextColor, fontSize: 13 }}>Loading accounts list...</Text>
          </View>
        ) : bankAccounts.length === 0 ? (
          <View style={{ paddingVertical: 80, alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Landmark size={32} color={subTextColor} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>No Bank Accounts Linked</Text>
            <Text style={{ fontSize: 13, color: subTextColor, textAlign: 'center', paddingHorizontal: 40, lineHeight: 18 }}>
              Link your organization bank account details to enable payout processing and track sales settlements.
            </Text>
            <TouchableOpacity
              onPress={openAddModal}
              style={{
                backgroundColor: brandColor,
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 8,
                marginTop: 10,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Link Bank Account</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {bankAccounts.map((account) => (
              <View
                key={account.id}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: borderCol,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    backgroundColor: account.isActive
                      ? isDark
                        ? `${brandColor}22`
                        : `${brandColor}0a`
                      : 'transparent',
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: borderCol,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Landmark size={20} color={account.isActive ? brandColor : subTextColor} />
                      <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                        {account.bankName}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: account.isActive
                          ? isDark
                            ? `${brandColor}40`
                            : `${brandColor}15`
                          : isDark
                            ? '#27272a'
                            : '#e2e8f0',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: account.isActive ? brandColor : subTextColor,
                        }}
                      >
                        {account.accountType.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: textColor,
                      letterSpacing: 1.5,
                      marginBottom: 12,
                    }}
                  >
                    {account.accountNumber.replace(/\d(?=\d{4})/g, '•')}
                  </Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <View>
                      <Text style={{ fontSize: 9, color: subTextColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                        Account Holder
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                        {account.accountHolderName}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 9, color: subTextColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                        IFSC Code
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                        {account.ifscCode}
                      </Text>
                    </View>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  }}
                >
                  <View style={{ flex: 1, marginRight: 16 }}>
                    <Text style={{ fontSize: 11, color: subTextColor }} numberOfLines={1}>
                      Branch: {account.branchName || 'N/A'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    {account.isActive ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <ShieldCheck size={14} color="#10b981" />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#10b981' }}>Active default</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={async () => {
                          try {
                            const updated = { ...account, isActive: true };
                            const res = await bankAccountService.saveBankAccount(updated);
                            if (res && res.success) {
                              Toast.show({
                                type: 'success',
                                text1: 'Default Account Changed',
                                text2: `${account.bankName} is now the default account.`,
                              });
                              fetchBankAccounts();
                            }
                          } catch (err: any) {
                            Toast.show({
                              type: 'error',
                              text1: 'Error',
                              text2: err.message || 'Failed to update status',
                            });
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '600', color: brandColor }}>Set default</Text>
                      </TouchableOpacity>
                    )}

                    <View style={{ width: 1, height: 16, backgroundColor: borderCol }} />

                    <TouchableOpacity onPress={() => openEditModal(account)} activeOpacity={0.7}>
                      <Edit3 size={16} color="#3b82f6" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleDelete(account.id, account.bankName)} activeOpacity={0.7}>
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ADD/EDIT ACCOUNT MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{
              backgroundColor: cardBg,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderWidth: 1,
              borderColor: borderCol,
              maxHeight: '90%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: borderCol,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>
                {editId > 0 ? 'Edit Bank Account' : 'Link New Bank Account'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                <X size={20} color={textColor} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 6 }}>
                  Bank Name *
                </Text>
                <TextInput
                  style={{
                    height: 42,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    backgroundColor: inputBg,
                    color: textColor,
                    fontSize: 13,
                  }}
                  placeholder="e.g. HDFC Bank, ICICI Bank"
                  placeholderTextColor={subTextColor}
                  value={bankName}
                  onChangeText={setBankName}
                />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 6 }}>
                  Account Holder Name *
                </Text>
                <TextInput
                  style={{
                    height: 42,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    backgroundColor: inputBg,
                    color: textColor,
                    fontSize: 13,
                  }}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={subTextColor}
                  value={accountHolderName}
                  onChangeText={setAccountHolderName}
                />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 6 }}>
                  Account Number *
                </Text>
                <TextInput
                  style={{
                    height: 42,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    backgroundColor: inputBg,
                    color: textColor,
                    fontSize: 13,
                  }}
                  keyboardType="numeric"
                  placeholder="e.g. 501002345678"
                  placeholderTextColor={subTextColor}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 6 }}>
                  IFSC Code *
                </Text>
                <TextInput
                  style={{
                    height: 42,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    backgroundColor: inputBg,
                    color: textColor,
                    fontSize: 13,
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  placeholder="e.g. HDFC0000123"
                  placeholderTextColor={subTextColor}
                  value={ifscCode}
                  onChangeText={setIfscCode}
                />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 6 }}>
                  Branch Name
                </Text>
                <TextInput
                  style={{
                    height: 42,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: borderCol,
                    paddingHorizontal: 12,
                    backgroundColor: inputBg,
                    color: textColor,
                    fontSize: 13,
                  }}
                  placeholder="e.g. Downtown Branch"
                  placeholderTextColor={subTextColor}
                  value={branchName}
                  onChangeText={setBranchName}
                />
              </View>

              <View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: subTextColor, marginBottom: 6 }}>
                  Account Type
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {['Savings', 'Current'].map((type) => {
                    const isSelected = accountType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setAccountType(type)}
                        style={{
                          flex: 1,
                          height: 40,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: isSelected ? brandColor : borderCol,
                          backgroundColor: isSelected ? (isDark ? `${brandColor}20` : `${brandColor}0d`) : inputBg,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: isSelected ? '700' : '500',
                            color: isSelected ? brandColor : textColor,
                          }}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderTopWidth: 1,
                  borderTopColor: borderCol,
                  marginTop: 6,
                }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>
                    Set as Default Account
                  </Text>
                  <Text style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
                    Automatically deactivates other linked accounts
                  </Text>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: '#71717a', true: brandColor }}
                  thumbColor="#fff"
                />
              </View>

              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{
                  backgroundColor: brandColor,
                  height: 44,
                  borderRadius: 10,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 10,
                  marginBottom: Platform.OS === 'ios' ? 24 : 10,
                }}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <CheckCircle size={16} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>
                      Save Account
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
