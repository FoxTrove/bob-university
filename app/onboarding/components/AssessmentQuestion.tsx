import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import logger from '../../../lib/utils/logger';

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
    logger.debug('Assessment', 'Option selected:', optionValue);
    if (type === 'single') {
      onChange(optionValue);
    } else if (type === 'multiple') {
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

      <View className="mb-5">
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
          options.map((option) => {
            const selected = isSelected(option.value);
            return (
              <Pressable
                key={option.value}
                onPress={() => handleSelect(option.value)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  marginBottom: 12,
                })}
              >
                <View
                  className={`flex-row items-center p-4 rounded-xl border ${
                    selected
                      ? 'bg-primary/20 border-primary'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  {option.icon && (
                     <View className={`mr-4 p-2 rounded-full ${selected ? 'bg-primary/20' : 'bg-white/10'}`}>
                        <Ionicons
                            name={option.icon as any}
                            size={20}
                            color={selected ? '#C68976' : '#999'}
                        />
                     </View>
                  )}
                  <Text
                    className={`text-lg font-sans flex-1 ${
                      selected ? 'text-white font-bold' : 'text-gray-300'
                    }`}
                  >
                    {option.label}
                  </Text>

                  <View className={`w-6 h-6 rounded-full border items-center justify-center ${
                      selected ? 'border-primary bg-primary' : 'border-gray-500'
                  }`}>
                     {selected && <Ionicons name="checkmark" size={14} color="white" />}
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}
