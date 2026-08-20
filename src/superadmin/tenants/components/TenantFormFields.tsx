import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlansQuery } from '../../plans/hooks/usePlans';
import { Plan } from '../../plans/models/Plan';
import { useTheme } from '../../../contexts/ThemeContext';

interface TenantFormFieldsProps {
  formData: any;
  setFormData: (updater: (prev: any) => any) => void;
  isEdit: boolean;
  validationErrors: Record<string, string>;
}

function formatPrice(price: number) {
  return '₹' + price.toLocaleString('en-IN');
}

const PLAN_TYPE_COLORS: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  Basic: { bg: '#f0fdf4', border: '#bbf7d0', badge: '#16a34a', text: '#15803d' },
  Standard: { bg: '#eff6ff', border: '#bfdbfe', badge: '#2563eb', text: '#1d4ed8' },
  Enterprise: { bg: '#fdf4ff', border: '#e9d5ff', badge: '#9333ea', text: '#7e22ce' },
};

function getColors(planType: string) {
  return PLAN_TYPE_COLORS[planType] ?? PLAN_TYPE_COLORS['Standard'];
}

export const TenantFormFields = ({
  formData,
  setFormData,
  isEdit,
  validationErrors,
}: TenantFormFieldsProps) => {
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const { isDark } = useTheme();

  // Dynamic Theme Colors
  const textColor = isDark ? '#f1f5f9' : '#334155';
  const labelColor = isDark ? '#cbd5e1' : '#475569';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderCol = isDark ? '#334155' : '#cbd5e1';
  const inputBg = isDark ? '#0f172a' : '#ffffff';
  const labelBg = isDark ? '#1e293b' : '#f1f5f9';
  const modalBg = isDark ? '#1e293b' : '#ffffff';
  const modalHeaderBorder = isDark ? '#334155' : '#f1f5f9';
  const planCardBg = isDark ? '#0f172a' : '#ffffff';

  const updateField = (key: string, value: string | number) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  // Fetch plans from the API
  const { data: plansResponse, isLoading: plansLoading, isError: plansError } = usePlansQuery();
  const plans: Plan[] = plansResponse?.data ?? [];
  const activePlans = plans.filter((p) => p.isActive);

  // In edit mode the API only returns plan name (no planId).
  // Match by planId first (after user picks a plan), then fall back to plan name.
  const selectedPlan =
    activePlans.find((p) => p.planId === formData.planId && formData.planId !== 0) ??
    activePlans.find((p) => p.planName === formData.plan) ??
    null;

  // Once plans load, auto-resolve planId from the plan name so the selector
  // shows the existing plan pre-selected without the user having to tap it.
  React.useEffect(() => {
    if (activePlans.length > 0 && formData.planId === 0 && formData.plan) {
      const matched = activePlans.find((p) => p.planName === formData.plan);
      if (matched) {
        setFormData((prev: any) => ({ ...prev, planId: matched.planId }));
      }
    }
  }, [activePlans, formData.plan, formData.planId]);

  const handleSelectPlan = (plan: Plan) => {
    setFormData((prev: any) => ({
      ...prev,
      planId: plan.planId,
      plan: plan.planName,
    }));
    setPlanModalVisible(false);
  };

  return (
    <View style={{ gap: 16 }}>
      {/* Company Name */}
      <View>
        <Text style={{ color: labelColor, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Company Name</Text>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 48,
          borderWidth: 1,
          borderColor: validationErrors.companyName ? '#ef4444' : borderCol,
          backgroundColor: validationErrors.companyName ? (isDark ? '#7f1d1d15' : '#fef2f2') : inputBg,
          borderRadius: 10,
          paddingHorizontal: 12,
          gap: 10,
        }}>
          <Ionicons name="business-outline" size={18} color={validationErrors.companyName ? '#ef4444' : (isDark ? '#94a3b8' : '#64748b')} />
          <TextInput
            style={{
              flex: 1,
              height: '100%',
              fontSize: 14,
              color: textColor,
            }}
            value={formData.companyName}
            onChangeText={(v) => updateField('companyName', v)}
            placeholder="e.g. Alpha Realty"
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          />
        </View>
        {validationErrors.companyName && (
          <Text style={{ color: '#ef4444', fontSize: 10, marginTop: 4, fontWeight: '600' }}>{validationErrors.companyName}</Text>
        )}
      </View>

      {/* Subdomain (Only for Create) */}
      {!isEdit && (
        <View>
          <Text style={{ color: labelColor, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Subdomain Prefix</Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 48,
            borderWidth: 1,
            borderColor: validationErrors.subdomain ? '#ef4444' : borderCol,
            backgroundColor: validationErrors.subdomain ? (isDark ? '#7f1d1d15' : '#fef2f2') : inputBg,
            borderRadius: 10,
            paddingLeft: 12,
          }}>
            <Ionicons name="globe-outline" size={18} color={validationErrors.subdomain ? '#ef4444' : (isDark ? '#94a3b8' : '#64748b')} style={{ marginRight: 10 }} />
            <TextInput
              style={{
                flex: 1,
                height: '100%',
                fontSize: 14,
                color: textColor,
              }}
              value={formData.subdomain}
              onChangeText={(v) => updateField('subdomain', v.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="e.g. alpharealty"
              autoCapitalize="none"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            />
            <View style={{
              height: '100%',
              justifyContent: 'center',
              backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
              borderLeftWidth: 1,
              borderLeftColor: borderCol,
              borderTopRightRadius: 9,
              borderBottomRightRadius: 9,
              paddingHorizontal: 12,
            }}>
              <Text style={{ color: subTextColor, fontSize: 13, fontWeight: '600' }}>.uproptech.com</Text>
            </View>
          </View>
          {validationErrors.subdomain ? (
            <Text style={{ color: '#ef4444', fontSize: 10, marginTop: 4, fontWeight: '600' }}>{validationErrors.subdomain}</Text>
          ) : (
            <Text style={{ color: subTextColor, fontSize: 10, marginTop: 4 }}>Lower case letters, numbers, and dashes only.</Text>
          )}
        </View>
      )}

      {/* Contact Person */}
      <View>
        <Text style={{ color: labelColor, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Contact Person</Text>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 48,
          borderWidth: 1,
          borderColor: validationErrors.contactPerson ? '#ef4444' : borderCol,
          backgroundColor: validationErrors.contactPerson ? (isDark ? '#7f1d1d15' : '#fef2f2') : inputBg,
          borderRadius: 10,
          paddingHorizontal: 12,
          gap: 10,
        }}>
          <Ionicons name="person-outline" size={18} color={validationErrors.contactPerson ? '#ef4444' : (isDark ? '#94a3b8' : '#64748b')} />
          <TextInput
            style={{
              flex: 1,
              height: '100%',
              fontSize: 14,
              color: textColor,
            }}
            value={formData.contactPerson}
            onChangeText={(v) => updateField('contactPerson', v)}
            placeholder="e.g. Jane Smith"
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          />
        </View>
        {validationErrors.contactPerson && (
          <Text style={{ color: '#ef4444', fontSize: 10, marginTop: 4, fontWeight: '600' }}>{validationErrors.contactPerson}</Text>
        )}
      </View>

      {/* Email */}
      <View>
        <Text style={{ color: labelColor, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Email Address</Text>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 48,
          borderWidth: 1,
          borderColor: validationErrors.email ? '#ef4444' : borderCol,
          backgroundColor: validationErrors.email ? (isDark ? '#7f1d1d15' : '#fef2f2') : inputBg,
          borderRadius: 10,
          paddingHorizontal: 12,
          gap: 10,
        }}>
          <Ionicons name="mail-outline" size={18} color={validationErrors.email ? '#ef4444' : (isDark ? '#94a3b8' : '#64748b')} />
          <TextInput
            style={{
              flex: 1,
              height: '100%',
              fontSize: 14,
              color: textColor,
            }}
            value={formData.email}
            onChangeText={(v) => updateField('email', v)}
            placeholder="e.g. contact@company.com"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          />
        </View>
        {validationErrors.email && (
          <Text style={{ color: '#ef4444', fontSize: 10, marginTop: 4, fontWeight: '600' }}>{validationErrors.email}</Text>
        )}
      </View>

      {/* Phone */}
      <View>
        <Text style={{ color: labelColor, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Phone Number</Text>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 48,
          borderWidth: 1,
          borderColor: validationErrors.phone ? '#ef4444' : borderCol,
          backgroundColor: validationErrors.phone ? (isDark ? '#7f1d1d15' : '#fef2f2') : inputBg,
          borderRadius: 10,
          paddingHorizontal: 12,
          gap: 10,
        }}>
          <Ionicons name="call-outline" size={18} color={validationErrors.phone ? '#ef4444' : (isDark ? '#94a3b8' : '#64748b')} />
          <TextInput
            style={{
              flex: 1,
              height: '100%',
              fontSize: 14,
              color: textColor,
            }}
            value={formData.phone}
            onChangeText={(v) => updateField('phone', v)}
            placeholder="e.g. 9876543210"
            keyboardType="phone-pad"
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          />
        </View>
        {validationErrors.phone && (
          <Text style={{ color: '#ef4444', fontSize: 10, marginTop: 4, fontWeight: '600' }}>{validationErrors.phone}</Text>
        )}
      </View>

      {/* ── Plan Selector ── */}
      <View>
        <Text style={{ color: labelColor, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
          Subscription Plan <Text style={{ color: '#ef4444' }}>*</Text>
        </Text>

        {plansLoading ? (
          <View style={{ height: 48, borderWidth: 1, borderColor: borderCol, backgroundColor: inputBg, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
            <ActivityIndicator size="small" color="#1e73be" />
            <Text style={{ color: subTextColor, fontSize: 12 }}>Loading plans…</Text>
          </View>
        ) : plansError ? (
          <View style={{ height: 48, borderWidth: 1, borderColor: '#fca5a5', backgroundColor: isDark ? '#7f1d1d20' : '#fef2f2', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>Failed to load plans. Check connection.</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setPlanModalVisible(true)}
            activeOpacity={0.75}
            style={{
              height: 48,
              borderWidth: 1,
              borderColor: validationErrors.plan ? '#ef4444' : borderCol,
              backgroundColor: validationErrors.plan ? (isDark ? '#7f1d1d15' : '#fef2f2') : inputBg,
              borderRadius: 10,
              paddingHorizontal: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {selectedPlan ? (
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {/* Coloured dot */}
                <View
                  style={{
                    backgroundColor: getColors(selectedPlan.planType).badge,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: textColor, fontWeight: '700', fontSize: 13 }}>{selectedPlan.planName}</Text>
                  <Text style={{ color: subTextColor, fontSize: 10 }}>
                    {formatPrice(selectedPlan.monthlyPrice)}/mo · {formatPrice(selectedPlan.yearlyPrice)}/yr
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: getColors(selectedPlan.planType).bg,
                    borderColor: getColors(selectedPlan.planType).border,
                    borderWidth: 1,
                    borderRadius: 20,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ color: getColors(selectedPlan.planType).text, fontSize: 9, fontWeight: '700' }}>
                    {selectedPlan.planType}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Ionicons name="card-outline" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text style={{ color: subTextColor, fontSize: 14, flex: 1 }}>Select a subscription plan…</Text>
              </View>
            )}
            <Ionicons name="chevron-down" size={16} color={isDark ? '#64748b' : '#94a3b8'} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )}

        {validationErrors.plan && (
          <Text style={{ color: '#ef4444', fontSize: 10, marginTop: 4, fontWeight: '600' }}>{validationErrors.plan}</Text>
        )}
      </View>

      {/* Max Users (Only for Edit) */}
      {isEdit && (
        <View>
          <Text style={{ color: labelColor, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Max Users Limit</Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 48,
            borderWidth: 1,
            borderColor: validationErrors.maxUsers ? '#ef4444' : borderCol,
            backgroundColor: validationErrors.maxUsers ? (isDark ? '#7f1d1d15' : '#fef2f2') : inputBg,
            borderRadius: 10,
            paddingHorizontal: 12,
            gap: 10,
          }}>
            <Ionicons name="people-outline" size={18} color={validationErrors.maxUsers ? '#ef4444' : (isDark ? '#94a3b8' : '#64748b')} />
            <TextInput
              style={{
                flex: 1,
                height: '100%',
                fontSize: 14,
                color: textColor,
              }}
              value={formData.maxUsers?.toString()}
              onChangeText={(v) => updateField('maxUsers', parseInt(v, 10) || 0)}
              placeholder="e.g. 50"
              keyboardType="number-pad"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            />
          </View>
          {validationErrors.maxUsers && (
            <Text style={{ color: '#ef4444', fontSize: 10, marginTop: 4, fontWeight: '600' }}>{validationErrors.maxUsers}</Text>
          )}
        </View>
      )}

      {/* Referral Code (Only for Create) */}
      {!isEdit && (
        <View>
          <Text style={{ color: labelColor, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Referral Code (Optional)</Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 48,
            borderWidth: 1,
            borderColor: borderCol,
            backgroundColor: inputBg,
            borderRadius: 10,
            paddingHorizontal: 12,
            gap: 10,
          }}>
            <Ionicons name="gift-outline" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
            <TextInput
              style={{
                flex: 1,
                height: '100%',
                fontSize: 14,
                color: textColor,
              }}
              value={formData.referralCode}
              onChangeText={(v) => updateField('referralCode', v)}
              placeholder="e.g. PR7394"
              autoCapitalize="characters"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            />
          </View>
        </View>
      )}

      {/* ── Plan Selection Modal ── */}
      <Modal
        visible={planModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPlanModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }}
          onPress={() => setPlanModalVisible(false)}
        >
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: modalBg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            overflow: 'hidden',
            maxHeight: '85%',
          }}>
            {/* Modal Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: modalHeaderBorder,
            }}>
              <View>
                <Text style={{ color: textColor, fontWeight: '700', fontSize: 16 }}>Choose a Plan</Text>
                <Text style={{ color: subTextColor, fontSize: 12, marginTop: 2 }}>Select the subscription tier for this tenant</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPlanModalVisible(false)}
                style={{
                  backgroundColor: isDark ? '#334155' : '#f1f5f9',
                  padding: 6,
                  borderRadius: 20,
                }}
              >
                <Ionicons name="close" size={18} color={isDark ? '#cbd5e1' : '#475569'} />
              </TouchableOpacity>
            </View>

            {/* Plan Cards */}
            <ScrollView
              contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {activePlans.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Ionicons name="cube-outline" size={48} color={isDark ? '#475569' : '#cbd5e1'} />
                  <Text style={{ color: subTextColor, fontWeight: '600', marginTop: 12, fontSize: 14 }}>No active plans found</Text>
                </View>
              ) : (
                activePlans.map((plan) => {
                  const colors = getColors(plan.planType);
                  const isSelected = formData.planId === plan.planId;
                  return (
                    <TouchableOpacity
                      key={plan.planId}
                      onPress={() => handleSelectPlan(plan)}
                      activeOpacity={0.8}
                      style={{
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? colors.badge : borderCol,
                        backgroundColor: isSelected ? (isDark ? '#1e293b' : colors.bg) : planCardBg,
                        borderRadius: 10,
                        padding: 16,
                        marginBottom: 4,
                      }}
                    >
                      {/* Plan Header Row */}
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ color: textColor, fontWeight: '700', fontSize: 16 }}>{plan.planName}</Text>
                            {isSelected && (
                              <View style={{ backgroundColor: colors.badge, borderRadius: 10, padding: 2 }}>
                                <Ionicons name="checkmark" size={12} color="#fff" />
                              </View>
                            )}
                          </View>
                          {plan.description ? (
                            <Text style={{ color: subTextColor, fontSize: 12, marginTop: 2 }}>{plan.description}</Text>
                          ) : null}
                        </View>
                        <View
                          style={{
                            backgroundColor: colors.bg,
                            borderColor: colors.border,
                            borderWidth: 1,
                            borderRadius: 20,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            marginLeft: 8,
                          }}
                        >
                          <Text style={{ color: colors.text, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
                            {plan.planType}
                          </Text>
                        </View>
                      </View>

                      {/* Pricing */}
                      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                        <View style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                          <Text style={{ color: subTextColor, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>Monthly</Text>
                          <Text style={{ color: textColor, fontWeight: '700', fontSize: 14, marginTop: 2 }}>
                            {formatPrice(plan.monthlyPrice)}
                          </Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                          <Text style={{ color: subTextColor, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>Yearly</Text>
                          <Text style={{ color: textColor, fontWeight: '700', fontSize: 14, marginTop: 2 }}>
                            {formatPrice(plan.yearlyPrice)}
                          </Text>
                        </View>
                      </View>

                      {/* Usage Limits */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {[
                          { label: 'Users', value: plan.maxUsers === -1 ? '∞' : plan.maxUsers },
                          { label: 'Agents', value: plan.maxAgents === -1 ? '∞' : plan.maxAgents },
                          { label: 'Leads/mo', value: plan.maxLeadsPerMonth === -1 ? '∞' : plan.maxLeadsPerMonth.toLocaleString() },
                          { label: 'Partners', value: plan.maxPartners === -1 ? '∞' : plan.maxPartners },
                        ].map((item) => (
                          <View
                            key={item.label}
                            style={{
                              backgroundColor: isDark ? '#1e293b' : '#ffffff',
                              borderWidth: 1,
                              borderColor: borderCol,
                              borderRadius: 8,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ color: textColor, fontWeight: '700', fontSize: 12 }}>{item.value}</Text>
                            <Text style={{ color: subTextColor, fontSize: 10 }}>{item.label}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Feature Chips */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                        {plan.hasWhatsAppIntegration && <FeatureChip label="WhatsApp" />}
                        {plan.hasFacebookIntegration && <FeatureChip label="Facebook" />}
                        {plan.hasEmailIntegration && <FeatureChip label="Email" />}
                        {plan.hasAdvancedReports && <FeatureChip label="Reports" />}
                        {plan.hasCustomBranding && <FeatureChip label="Branding" />}
                        {plan.hasPrioritySupport && <FeatureChip label="Priority Support" />}
                        {plan.hasCustomAPIAccess && <FeatureChip label="API Access" />}
                        {plan.hasImpersonation && <FeatureChip label="Impersonation" />}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

function FeatureChip({ label }: { label: string }) {
  const { isDark } = useTheme();
  return (
    <View style={{
      backgroundColor: isDark ? '#1e3a8a30' : '#f0f9ff',
      borderColor: isDark ? '#1d4ed850' : '#e0f2fe',
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 2,
    }}>
      <Text style={{ color: '#0284c7', fontSize: 10, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}
