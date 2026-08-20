import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { getAdminTheme } from '../../../theme/adminTheme';
import {
    Shield,
    ShieldCheck,
    CheckCircle,
    AlertCircle,
    Save,
    ChevronRight,
    ArrowLeft,
    Home,
    Users,
    ListTodo,
    Calendar,
    CreditCard,
    Settings,
    LayoutDashboard,
    MessageSquare,
    CheckSquare,
    Receipt,
    Wallet,
    DollarSign,
    TrendingUp,
} from 'lucide-react-native';

const getModuleIcon = (moduleName: string, color: string, size = 16) => {
    const name = (moduleName || '').toLowerCase().trim();
    if (name.includes('lead')) return <ListTodo size={size} color={color} />;
    if (name.includes('task') || name.includes('todo')) return <CheckSquare size={size} color={color} />;
    if (name.includes('propert')) return <Home size={size} color={color} />;
    if (name.includes('book')) return <Calendar size={size} color={color} />;
    if (name.includes('invoice') || name.includes('receipt') || name.includes('bill')) return <Receipt size={size} color={color} />;
    if (name.includes('expense') || name.includes('payout')) return <Wallet size={size} color={color} />;
    if (name.includes('revenue') || name.includes('profit') || name.includes('income') || name.includes('earning')) return <DollarSign size={size} color={color} />;
    if (name.includes('sale') || name.includes('deal') || name.includes('chart')) return <TrendingUp size={size} color={color} />;
    if (name.includes('user') || name.includes('member') || name.includes('config') || name.includes('manage')) return <Users size={size} color={color} />;
    if (name.includes('chat') || name.includes('bot') || name.includes('support')) return <MessageSquare size={size} color={color} />;
    if (name.includes('sub')) return <CreditCard size={size} color={color} />;
    if (name.includes('setting') || name.includes('system') || name.includes('workspace')) return <Settings size={size} color={color} />;
    if (name.includes('dash') || name.includes('overview') || name.includes('stat') || name.includes('report')) return <LayoutDashboard size={size} color={color} />;

    return <Shield size={size} color={color} />;
};
import {
    roleManagementService,
    RolePermissionsMatrixResponse,
} from '../../../admin/services/roleManagementService';
import { useRolePermissionsStore } from '../../../hooks/useRolePermissionsStore';

export default function RolePermissions() {
    const router = useRouter();
    const { roleName } = useLocalSearchParams<{ roleName: string }>();

    const { isDark } = useTheme();
    const adminTheme = getAdminTheme(isDark);

    const bgColor = adminTheme.primaryBg;
    const cardBg = adminTheme.cardBg;
    const textColor = adminTheme.textPrimary;
    const subTextColor = adminTheme.textSecondary;
    const borderCol = adminTheme.border;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { cache, fetchPermissionsForRole, updateCache } = useRolePermissionsStore();

    const [permissionsMatrix, setPermissionsMatrix] = useState<RolePermissionsMatrixResponse | null>(null);
    const [permState, setPermState] = useState<Record<string, boolean>>({});
    const [initialPermState, setInitialPermState] = useState<Record<string, boolean>>({});
    const [activeModuleId, setActiveModuleId] = useState<number | null>(null);

    useEffect(() => {
        if (!roleName) return;

        const loadData = async () => {
            const cachedData = cache[roleName];
            if (cachedData) {
                setPermissionsMatrix(cachedData);
                const initialState: Record<string, boolean> = {};
                if (cachedData.modules) {
                    cachedData.modules.forEach((mod) => {
                        mod.pages.forEach((page) => {
                            if (page.permissions) {
                                Object.entries(page.permissions).forEach(([permType, isAllowed]) => {
                                    initialState[`${page.pageId}_${permType}`] = !!isAllowed;
                                });
                            }
                        });
                    });
                }
                setPermState(initialState);
                setInitialPermState(initialState);
                setLoading(false);
            } else {
                setLoading(true);
                setError(null);
                const res = await fetchPermissionsForRole(roleName);
                if (res) {
                    setPermissionsMatrix(res);
                    const initialState: Record<string, boolean> = {};
                    if (res.modules) {
                        res.modules.forEach((mod) => {
                            mod.pages.forEach((page) => {
                                if (page.permissions) {
                                    Object.entries(page.permissions).forEach(([permType, isAllowed]) => {
                                        initialState[`${page.pageId}_${permType}`] = !!isAllowed;
                                    });
                                }
                            });
                        });
                    }
                    setPermState(initialState);
                    setInitialPermState(initialState);
                } else {
                    setError('Failed to load permissions matrix');
                }
                setLoading(false);
            }
        };

        loadData();
    }, [roleName, cache, fetchPermissionsForRole]);

    const toggleModuleExpanded = (moduleId: number) => {
        setActiveModuleId((prev) => (prev === moduleId ? null : moduleId));
    };

    const togglePermission = (pageId: number, permType: string) => {
        const key = `${pageId}_${permType}`;
        setPermState((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handlesave = async () => {
        if (!roleName || !permissionsMatrix) return;
        setSaving(true);

        const permissionsPayload: Array<{ pageId: number; permissionName: string; isAllowed: boolean }> = [];
        if (permissionsMatrix.modules) {
            permissionsMatrix.modules.forEach((mod) => {
                mod.pages.forEach((page) => {
                    (permissionsMatrix.availablePermissionTypes || ['View', 'Create', 'Edit', 'Delete', 'Export', 'Bulk Upload']).forEach(
                        (permType) => {
                            const key = `${page.pageId}_${permType}`;
                            const isAllowed = !!permState[key];
                            permissionsPayload.push({
                                pageId: page.pageId,
                                permissionName: permType,
                                isAllowed,
                            });
                        }
                    );
                });
            });
        }

        try {
            const res = await roleManagementService.saveRolePermissions({
                roleName,
                permissions: permissionsPayload as any,
            });

            if (res && res.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Permissions Saved',
                    text2: res.message || 'Permissions updated successfully!',
                });
                setInitialPermState({ ...permState });

                const updatedMatrix = { ...permissionsMatrix };
                if (updatedMatrix.modules) {
                    updatedMatrix.modules = updatedMatrix.modules.map(mod => {
                        const updatedMod = { ...mod };
                        updatedMod.pages = updatedMod.pages.map(page => {
                            const updatedPage = { ...page };
                            const pagePermissions: Record<string, boolean> = {};
                            (permissionsMatrix.availablePermissionTypes || ['View', 'Create', 'Edit', 'Delete', 'Export', 'Bulk Upload']).forEach(
                                (permType) => {
                                    pagePermissions[permType] = !!permState[`${page.pageId}_${permType}`];
                                }
                            );
                            updatedPage.permissions = pagePermissions as any;
                            return updatedPage;
                        });
                        return updatedMod;
                    });
                }
                updateCache(roleName, updatedMatrix);
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Save Failed',
                    text2: res.message || 'Failed to save permissions',
                });
            }
        } catch (err: any) {
            Toast.show({
                type: 'error',
                text1: 'Server Error',
                text2: err.message || 'Server error saving permissions',
            });
        } finally {
            setSaving(false);
        }
    };

    const isChanged = useMemo(() => {
        const allKeys = Array.from(new Set([...Object.keys(permState), ...Object.keys(initialPermState)]));
        return allKeys.some((k) => !!permState[k] !== !!initialPermState[k]);
    }, [permState, initialPermState]);

    return (
        <View style={{ flex: 1, backgroundColor: bgColor }}>
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#10b981" />
                    <Text style={{ marginTop: 10, fontSize: 13, color: subTextColor }}>
                        Loading permissions matrix...
                    </Text>
                </View>
            ) : error ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <AlertCircle size={36} color="#ef4444" />
                    <Text style={{ color: '#ef4444', fontWeight: '600', marginTop: 10, fontSize: 14, textAlign: 'center' }}>
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={() => roleName && fetchPermissionsForRole(roleName, true)}
                        style={{
                            marginTop: 15,
                            backgroundColor: '#ef4444',
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                            borderRadius: 8,
                        }}
                    >
                        <Text style={{ color: '#ffffff', fontWeight: '700' }}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : permissionsMatrix ? (
                <View style={{ flex: 1 }}>


                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {permissionsMatrix.modules && permissionsMatrix.modules.length > 0 ? (
                            permissionsMatrix.modules.map((mod) => {
                                const isExpanded = activeModuleId === mod.moduleId;
                                return (
                                    <View
                                        key={mod.moduleId}
                                        style={{
                                            backgroundColor: cardBg,
                                            borderRadius: 14,
                                            borderWidth: 1,
                                            borderColor: borderCol,
                                            overflow: 'hidden',
                                            marginBottom: 12,
                                        }}
                                    >
                                        {/* Accordion Header */}
                                        <TouchableOpacity
                                            onPress={() => toggleModuleExpanded(mod.moduleId)}
                                            activeOpacity={0.7}
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: 16,
                                                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                                                borderBottomWidth: isExpanded ? 1 : 0,
                                                borderBottomColor: borderCol,
                                                borderLeftWidth: isExpanded ? 4 : 0,
                                                borderLeftColor: '#10b981',
                                            }}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                {getModuleIcon(mod.moduleName, '#10b981', 18)}
                                                <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>
                                                    {mod.moduleName} Module
                                                </Text>
                                            </View>
                                            <ChevronRight
                                                size={18}
                                                color={subTextColor}
                                                style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                                            />
                                        </TouchableOpacity>

                                        {/* Accordion Content */}
                                        {isExpanded && (
                                            <View style={{ padding: 16, gap: 12 }}>
                                                {mod.pages.map((page) => (
                                                    <View
                                                        key={page.pageId}
                                                        style={{
                                                            backgroundColor: bgColor,
                                                            borderRadius: 10,
                                                            padding: 12,
                                                            borderWidth: 1,
                                                            borderColor: borderCol,
                                                        }}
                                                    >
                                                        <Text style={{ fontSize: 13, fontWeight: '600', color: textColor, marginBottom: 8 }}>
                                                            {page.pageName} ({page.pageKey})
                                                        </Text>

                                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                                            {(
                                                                permissionsMatrix.availablePermissionTypes || [
                                                                    'View',
                                                                    'Create',
                                                                    'Edit',
                                                                    'Delete',
                                                                    'Export',
                                                                    'Bulk Upload',
                                                                ]
                                                            ).map((permType) => {
                                                                const key = `${page.pageId}_${permType}`;
                                                                const isChecked = !!permState[key];
                                                                return (
                                                                    <TouchableOpacity
                                                                        key={permType}
                                                                        onPress={() => togglePermission(page.pageId, permType)}
                                                                        style={{
                                                                            paddingHorizontal: 10,
                                                                            paddingVertical: 6,
                                                                            borderRadius: 6,
                                                                            backgroundColor: isChecked ? '#10b98120' : cardBg,
                                                                            borderWidth: 1,
                                                                            borderColor: isChecked ? '#10b981' : borderCol,
                                                                            flexDirection: 'row',
                                                                            alignItems: 'center',
                                                                            gap: 6,
                                                                        }}
                                                                    >
                                                                        {isChecked ? (
                                                                            <CheckCircle size={12} color="#10b981" />
                                                                        ) : (
                                                                            <View
                                                                                style={{
                                                                                    width: 12,
                                                                                    height: 12,
                                                                                    borderRadius: 6,
                                                                                    borderWidth: 1,
                                                                                    borderColor: borderCol,
                                                                                }}
                                                                            />
                                                                        )}
                                                                        <Text
                                                                            style={{
                                                                                fontSize: 11,
                                                                                fontWeight: isChecked ? '700' : '500',
                                                                                color: isChecked ? '#10b981' : subTextColor,
                                                                            }}
                                                                        >
                                                                            {permType}
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                );
                                                            })}
                                                        </View>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                );
                            })
                        ) : (
                            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                                <Text style={{ fontSize: 13, color: subTextColor }}>No module pages configured</Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Bottom Actions Bar */}
                    {isChanged && (
                        <View
                            style={{
                                flexDirection: 'row',
                                gap: 12,
                                padding: 16,
                                backgroundColor: cardBg,
                                borderTopWidth: 1,
                                borderTopColor: borderCol,
                            }}
                        >
                            <TouchableOpacity
                                onPress={handlesave}
                                disabled={saving}
                                style={{
                                    flex: 1,
                                    height: 44,
                                    borderRadius: 10,
                                    backgroundColor: '#10b981',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    gap: 6,
                                }}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Save size={16} color="#fff" />
                                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Save Matrix</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            ) : null}
        </View>
    );
}
