import React from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import AuthHeader from '../../components/AuthHeader';
import WorkspaceCard from '../../components/WorkspaceCard';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useSafeObserve } from '../../../api/observe';

export default function SelectWorkspaceScreen() {
  const router = useRouter();
  const { markInteractive } = useSafeObserve();

  React.useEffect(() => {
    markInteractive();
  }, [markInteractive]);

  const pendingWorkspaces = useAuthStore((state) => state.pendingWorkspaces);
  const loginWithWorkspace = useAuthStore((state) => state.loginWithWorkspace);
  const isLoading = useAuthStore((state) => state.isLoading);

  const handleSelect = async (tenantId: number, role: string) => {
    const result = await loginWithWorkspace(tenantId);
    if (result === 'success') {
      const normalizedRole = role?.toLowerCase();
      if (normalizedRole === 'superadmin') {
        router.replace('/superadmin/dashboard');
      } else {
        router.replace('/admin/dashboard');
      }
    }
    // 'error' is handled by toast + error state in store
  };

  return (
    <View className="flex-1 bg-primary-bg px-4 pt-12">
      <AuthHeader title="Select Workspace" subtitle="Choose a workspace to continue" />
      {isLoading ? (
        <ActivityIndicator className="mt-8" />
      ) : (
        <FlatList
          data={pendingWorkspaces ?? []}
          keyExtractor={(item) => String(item.tenantId)}
          contentContainerClassName="pt-4"
          renderItem={({ item }) => (
            <WorkspaceCard
              name={item.companyName}
              url={item.subdomain ? `${item.subdomain}.uproptech.com` : `Tenant #${item.tenantId}`}
              onPress={() => handleSelect(item.tenantId, item.role)}
            />
          )}
        />
      )}
    </View>
  );
}
