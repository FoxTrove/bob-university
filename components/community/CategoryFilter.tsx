import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface Category {
  key: string;
  label: string;
  icon?: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selected: string;
  onSelect: (key: string) => void;
}

const categoryIcons: Record<string, { icon: string; color: string }> = {
  all: { icon: 'grid', color: '#6b7280' },
  show_your_work: { icon: 'camera', color: '#8b5cf6' },
  questions: { icon: 'help-circle', color: '#3b82f6' },
  tips: { icon: 'bulb', color: '#f59e0b' },
  feedback: { icon: 'megaphone', color: '#ef4444' },
  general: { icon: 'chatbubble', color: '#6b7280' },
};

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <View className="bg-background">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
      >
        {categories.map((cat, index) => {
          const isSelected = selected === cat.key;
          const iconConfig = categoryIcons[cat.key] || categoryIcons.general;

          return (
            <Pressable
              key={cat.key}
              onPress={() => onSelect(cat.key)}
              style={({ pressed }) => ({
                marginRight: index < categories.length - 1 ? 10 : 0,
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
              className={`flex-row items-center px-4 py-2.5 rounded-full ${
                isSelected
                  ? 'bg-primary'
                  : 'bg-surface border border-border'
              }`}
            >
              <Ionicons
                name={iconConfig.icon as any}
                size={16}
                color={isSelected ? 'white' : iconConfig.color}
              />
              <Text
                className={`text-sm font-medium ml-2 ${
                  isSelected ? 'text-white' : 'text-text'
                }`}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
