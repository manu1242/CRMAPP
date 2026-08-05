import React from 'react';
import { View, FlatList } from 'react-native';
import AuthHeader from '../../components/AuthHeader';
import WorkspaceCard from '../../components/WorkspaceCard';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function SelectWorkspaceScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const role = user?.role?.toLowerCase();

  const workspaces = [
    { id: '1', name: 'Production Workspace', url: 'prod.crmapp.com' },
    { id: '2', name: 'Sandbox Workspace', url: 'sandbox.crmapp.com' },
  ];

  const handleSelect = (url: string) => {
    if (role === 'superadmin') {
      router.replace('/superadmin/dashboard');
    } else {
      router.replace('/admin/dashboard');
    }
  };

  return (
    <View className="flex-1 bg-primary-bg px-4 pt-12">
      <AuthHeader title="Select Workspace" subtitle="Choose a workspace to continue" />
      <FlatList
        data={workspaces}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pt-4"
        renderItem={({ item }) => (
          <WorkspaceCard 
            name={item.name}
            url={item.url}
            onPress={() => handleSelect(item.url)}
          />
        )}
      />
    </View>
  );
}
