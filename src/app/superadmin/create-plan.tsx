import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  StatusBar,
  BackHandler,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCreatePlanMutation, useUpdatePlanMutation, usePlanDetailQuery } from '../../superadmin/plans/hooks/usePlans';
import { PlanCreateRequest } from '../../superadmin/plans/models/Plan';
import { useTheme } from '../../contexts/ThemeContext';

// ─── Reusable form field components ───────────────────────────────────────────
function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  const { isDark } = useTheme();
  return (
    <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 6, color: isDark ? '#cbd5e1' : '#475569' }}>
      {label}
      {required && <Text style={{ color: '#ef4444' }}> *</Text>}
    </Text>
  );
}

function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = 'default',
  required,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: any;
  required?: boolean;
}) {
  const { isDark } = useTheme();
  const inputBg = isDark ? '#0f172a' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const borderCol = isDark ? '#334155' : '#cbd5e1';

  return (
    <View style={{ marginBottom: 16 }}>
      <FieldLabel label={label} required={required} />
      <TextInput
        style={{
          height: 44,
          borderWidth: 1,
          borderColor: error ? '#ef4444' : borderCol,
          backgroundColor: error ? (isDark ? '#7f1d1d20' : '#fef2f2') : inputBg,
          borderRadius: 10,
          paddingHorizontal: 12,
          color: textColor,
          fontSize: 14,
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
        keyboardType={keyboardType}
      />
      {error ? <Text style={{ color: '#ef4444', fontSize: 10, marginTop: 4, fontWeight: '600' }}>{error}</Text> : null}
    </View>
  );
}

function ToggleRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  const { isDark } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: isDark ? '#334155' : '#f1f5f9' }}>
      <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 14, fontWeight: '500', flex: 1 }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: isDark ? '#1e293b' : '#e2e8f0', true: '#bfdbfe' }}
        thumbColor={value ? '#1e73be' : (isDark ? '#475569' : '#94a3b8')}
      />
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{ color: '#1e73be', fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginTop: 4 }}>
      {title}
    </Text>
  );
}

const SUPPORT_LEVELS = ['Email', 'Chat', 'Phone', 'Dedicated'];
const PLAN_TYPES = ['Basic', 'Standard', 'Enterprise'];

// ─── Default blank form ────────────────────────────────────────────────────────
const DEFAULT_FORM: PlanCreateRequest = {
  planName: '',
  description: '',
  monthlyPrice: 0,
  yearlyPrice: 0,
  maxUsers: 5,
  maxAgents: 2,
  maxLeadsPerMonth: 500,
  maxPartners: 5,
  maxStorageGB: 5,
  hasWhatsAppIntegration: false,
  hasFacebookIntegration: false,
  hasEmailIntegration: true,
  hasCustomAPIAccess: false,
  hasAdvancedReports: false,
  hasCustomBranding: false,
  hasPrioritySupport: false,
  hasImpersonation: false,
  supportLevel: 'Email',
  planType: 'Basic',
  isActive: true,
  sortOrder: 1,
  showOnLandingPage: true,
};

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function CreateEditPlanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id ? parseInt(params.id, 10) : undefined;
  const isEdit = !!editId;
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Theme colors
  const bgColor = isDark ? '#0f172a' : '#f3f4f6';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#f1f5f9';
  const headerBg = isDark ? '#1e293b' : '#0f172a';

  // For edit mode, prefill from API
  const { data: existingPlan } = usePlanDetailQuery(editId ?? 0);

  const [form, setForm] = useState<PlanCreateRequest>(DEFAULT_FORM);

  useEffect(() => {
    if (isEdit && existingPlan?.data) {
      const p = existingPlan.data;
      setForm({
        planName: p.planName,
        description: p.description ?? '',
        monthlyPrice: p.monthlyPrice,
        yearlyPrice: p.yearlyPrice,
        maxUsers: p.maxUsers,
        maxAgents: p.maxAgents,
        maxLeadsPerMonth: p.maxLeadsPerMonth,
        maxPartners: p.maxPartners,
        maxStorageGB: p.maxStorageGB,
        hasWhatsAppIntegration: p.hasWhatsAppIntegration,
        hasFacebookIntegration: p.hasFacebookIntegration,
        hasEmailIntegration: p.hasEmailIntegration,
        hasCustomAPIAccess: p.hasCustomAPIAccess,
        hasAdvancedReports: p.hasAdvancedReports,
        hasCustomBranding: p.hasCustomBranding,
        hasPrioritySupport: p.hasPrioritySupport,
        hasImpersonation: p.hasImpersonation,
        supportLevel: p.supportLevel,
        planType: p.planType,
        isActive: p.isActive,
        sortOrder: p.sortOrder,
        showOnLandingPage: p.showOnLandingPage ?? true,
      });
    }
  }, [existingPlan, isEdit]);

  // Handle Android physical back button override to go to plans list
  useEffect(() => {
    const backAction = () => {
      router.replace('/superadmin/plans');
      return true; // prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [router]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreatePlanMutation();
  const updateMutation = useUpdatePlanMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const setField = (key: keyof PlanCreateRequest, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.planName.trim()) e.planName = 'Plan name is required';
    if (!form.monthlyPrice || form.monthlyPrice <= 0) e.monthlyPrice = 'Enter a valid monthly price';
    if (!form.yearlyPrice || form.yearlyPrice <= 0) e.yearlyPrice = 'Enter a valid yearly price';
    if (!form.maxUsers || form.maxUsers < -1) e.maxUsers = 'Enter max users (-1 for unlimited)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (isEdit && editId) {
      updateMutation.mutate(
        { id: editId, data: form },
        { onSuccess: () => router.replace('/superadmin/plans') }
      );
    } else {
      createMutation.mutate(form, { onSuccess: () => router.replace('/superadmin/plans') });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, paddingTop: insets.top }} edges={['bottom', 'left', 'right']}>
      <View style={{ flex: 1, backgroundColor: bgColor }}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={bgColor} />
        {/* Title Block */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>
            {isEdit ? 'Edit Plan' : 'Create New Plan'}
          </Text>
          <Text style={{ color: subTextColor, fontSize: 11, marginTop: 2, fontWeight: '500' }}>
            {isEdit ? 'Update the subscription plan details' : 'Define a new SaaS subscription tier'}
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 32), gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Basic Details ── */}
          <View style={{ backgroundColor: cardBg, borderRadius: 10, borderWidth: 1, borderColor: borderCol, padding: 16 }}>
            <SectionHeader title="Basic Details" />

            <TextField
              label="Plan Name"
              required
              value={form.planName}
              onChangeText={(v) => setField('planName', v)}
              placeholder="e.g. Standard Pro"
              error={errors.planName}
            />
            <TextField
              label="Description"
              value={form.description ?? ''}
              onChangeText={(v) => setField('description', v)}
              placeholder="e.g. Perfect for growing real estate agencies"
            />

            {/* Plan Type Selector */}
            <View style={{ marginBottom: 16 }}>
              <FieldLabel label="Plan Type" required />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {PLAN_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setField('planType', t)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: form.planType === t ? '#1e73be' : borderCol,
                      backgroundColor: form.planType === t ? '#1e73be' : (isDark ? '#0f172a' : '#ffffff'),
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: form.planType === t ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569') }}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Support Level Selector */}
            <View style={{ marginBottom: 4 }}>
              <FieldLabel label="Support Level" />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {SUPPORT_LEVELS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setField('supportLevel', s)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: form.supportLevel === s ? '#1e73be' : borderCol,
                      backgroundColor: form.supportLevel === s ? '#1e73be' : (isDark ? '#0f172a' : '#ffffff'),
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: form.supportLevel === s ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569') }}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* ── Pricing ── */}
          <View style={{ backgroundColor: cardBg, borderRadius: 10, borderWidth: 1, borderColor: borderCol, padding: 16 }}>
            <SectionHeader title="Pricing (₹)" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextField
                  label="Monthly Price"
                  required
                  value={form.monthlyPrice > 0 ? String(form.monthlyPrice) : ''}
                  onChangeText={(v) => setField('monthlyPrice', parseFloat(v) || 0)}
                  keyboardType="numeric"
                  placeholder="e.g. 1999"
                  error={errors.monthlyPrice}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextField
                  label="Yearly Price"
                  required
                  value={form.yearlyPrice > 0 ? String(form.yearlyPrice) : ''}
                  onChangeText={(v) => setField('yearlyPrice', parseFloat(v) || 0)}
                  keyboardType="numeric"
                  placeholder="e.g. 19990"
                  error={errors.yearlyPrice}
                />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextField
                  label="Sort Order"
                  value={String(form.sortOrder)}
                  onChangeText={(v) => setField('sortOrder', parseInt(v, 10) || 1)}
                  keyboardType="numeric"
                  placeholder="1"
                />
              </View>
            </View>
          </View>

          {/* ── Usage Limits ── */}
          <View style={{ backgroundColor: cardBg, borderRadius: 10, borderWidth: 1, borderColor: borderCol, padding: 16 }}>
            <SectionHeader title="Usage Limits (-1 = Unlimited)" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextField label="Max Users" required value={String(form.maxUsers)} onChangeText={(v) => setField('maxUsers', parseInt(v, 10) || -1)} keyboardType="numeric" error={errors.maxUsers} />
              </View>
              <View style={{ flex: 1 }}>
                <TextField label="Max Agents" value={String(form.maxAgents)} onChangeText={(v) => setField('maxAgents', parseInt(v, 10) || -1)} keyboardType="numeric" />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextField label="Leads / Month" value={String(form.maxLeadsPerMonth)} onChangeText={(v) => setField('maxLeadsPerMonth', parseInt(v, 10) || -1)} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <TextField label="Max Partners" value={String(form.maxPartners)} onChangeText={(v) => setField('maxPartners', parseInt(v, 10) || -1)} keyboardType="numeric" />
              </View>
            </View>
            <TextField label="Storage (GB)" value={String(form.maxStorageGB)} onChangeText={(v) => setField('maxStorageGB', parseInt(v, 10) || -1)} keyboardType="numeric" />
          </View>

          {/* ── Features ── */}
          <View style={{ backgroundColor: cardBg, borderRadius: 10, borderWidth: 1, borderColor: borderCol, padding: 16 }}>
            <SectionHeader title="Feature Flags" />
            <ToggleRow label="WhatsApp Integration" value={form.hasWhatsAppIntegration} onValueChange={(v) => setField('hasWhatsAppIntegration', v)} />
            <ToggleRow label="Facebook Integration" value={form.hasFacebookIntegration} onValueChange={(v) => setField('hasFacebookIntegration', v)} />
            <ToggleRow label="Email Integration" value={form.hasEmailIntegration} onValueChange={(v) => setField('hasEmailIntegration', v)} />
            <ToggleRow label="Custom API Access" value={form.hasCustomAPIAccess} onValueChange={(v) => setField('hasCustomAPIAccess', v)} />
            <ToggleRow label="Advanced Reports" value={form.hasAdvancedReports} onValueChange={(v) => setField('hasAdvancedReports', v)} />
            <ToggleRow label="Custom Branding" value={form.hasCustomBranding} onValueChange={(v) => setField('hasCustomBranding', v)} />
            <ToggleRow label="Priority Support" value={form.hasPrioritySupport} onValueChange={(v) => setField('hasPrioritySupport', v)} />
            <ToggleRow label="Impersonation" value={form.hasImpersonation} onValueChange={(v) => setField('hasImpersonation', v)} />
          </View>

          {/* ── Visibility ── */}
          <View style={{ backgroundColor: cardBg, borderRadius: 10, borderWidth: 1, borderColor: borderCol, padding: 16 }}>
            <SectionHeader title="Visibility" />
            <ToggleRow label="Active" value={form.isActive} onValueChange={(v) => setField('isActive', v)} />
            <ToggleRow label="Show on Landing Page" value={form.showOnLandingPage} onValueChange={(v) => setField('showOnLandingPage', v)} />
          </View>

          {/* ── Actions ── */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.replace('/superadmin/plans')}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: isDark ? '#334155' : '#e2e8f0',
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
              }}
            >
              <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontWeight: '700', fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isPending}
              style={{
                flex: 2,
                backgroundColor: '#1e73be',
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
              }}
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>
                  {isEdit ? 'Save Changes' : 'Create Plan'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
