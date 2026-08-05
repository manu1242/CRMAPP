import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface WorkspaceCardProps {
  name: string;
  url: string;
  onPress: () => void;
}

export default function WorkspaceCard({ name, url, onPress }: WorkspaceCardProps) {
  return (
    <TouchableOpacity className="card-custom flex-row items-center justify-between mb-3" onPress={onPress}>
      <View>
        <Text className="text-base font-bold text-primary-text">{name}</Text>
        <Text className="text-xs text-secondary-text mt-1">{url}</Text>
      </View>
      <Text className="text-lg text-accent font-bold">→</Text>
    </TouchableOpacity>
  );
}
