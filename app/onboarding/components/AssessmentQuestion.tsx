import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../components/ui/Button';

export type QuestionType = 'single' | 'multiple' | 'text';

export interface QuestionOption {
  value: string;
  label: string;
  icon?: string;
}

export interface AssessmentQuestionProps {
  question: string;
  type: QuestionType;
  options?: QuestionOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  onNext: () => void;
}

export function AssessmentQuestion({
  question,
  type,
  options = [],
  value,
  onChange,
  onNext,
}: AssessmentQuestionProps) {
  
  const handleSelect = (optionValue: string) => {
    if (type === 'single') {
      onChange(optionValue);
    } else if (type === 'multiple') {
      // Toggle logic for multiple
      const current = Array.isArray(value) ? value : [];
      if (current.includes(optionValue)) {
        onChange(current.filter(v => v !== optionValue));
      } else {
        onChange([...current, optionValue]);
      }
    }
  };

  const isSelected = (optionValue: string) => {
    if (type === 'single') return value === optionValue;
    if (type === 'multiple') return Array.isArray(value) && value.includes(optionValue);
    return false;
  };

  return (
    <View className="w-full">
      <Text className="text-2xl font-bold text-white text-center mb-6 font-serifBold">
        {question}
      </Text>

      <View className="space-y-3 mb-8">
        {type === 'text' ? (
           <View className="bg-white/5 border border-white/10 rounded-xl p-4">
             <TextInput
                className="text-white text-lg font-sans min-h-[100px]"
                multiline
                placeholder="Type your answer here..."
                placeholderTextColor="#666"
                value={value as string}
                onChangeText={onChange}
                textAlignVertical="top"
             />
           </View>
        ) : (
          options.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => handleSelect(option.value)}
              className={`flex-row items-center p-4 rounded-xl border ${
                isSelected(option.value)
                  ? 'bg-primary/20 border-primary'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              {option.icon && (
                 <View className={`mr-4 p-2 rounded-full ${isSelected(option.value) ? 'bg-primary/20' : 'bg-white/10'}`}>
                    <Ionicons 
                        name={option.icon as any} 
                        size={20} 
                        color={isSelected(option.value) ? '#C68976' : '#999'} 
                    />
                 </View>
              )}
              <Text
                className={`text-lg font-sans flex-1 ${
                  isSelected(option.value) ? 'text-white font-bold' : 'text-gray-300'
                }`}
              >
                {option.label}
              </Text>
              
              <View className={`w-6 h-6 rounded-full border items-center justify-center ${
                  isSelected(option.value) ? 'border-primary bg-primary' : 'border-gray-500'
              }`}>
                 {isSelected(option.value) && <Ionicons name="checkmark" size={14} color="white" />}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

    </View>
  );
}
