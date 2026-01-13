import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TranscriptSectionProps {
  transcript: string | null;
}

export function TranscriptSection({ transcript }: TranscriptSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!transcript) return null;

  return (
    <View className="mt-4 border-t border-border pt-4">
      <Pressable 
        onPress={() => setIsExpanded(!isExpanded)}
        className="flex-row items-center justify-between mb-4"
      >
        <Text className="text-lg font-bold text-primary">Transcript</Text>
        <Ionicons 
          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
          size={24} 
          color="#666" 
        />
      </Pressable>

      {isExpanded && (
        <View className="bg-surface rounded-lg p-4 h-64">
            <ScrollView nestedScrollEnabled>
                <Text className="text-textMuted leading-6">
                    {transcript}
                </Text>
            </ScrollView>
        </View>
      )}
    </View>
  );
}
