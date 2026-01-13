import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Keyboard,
  TextInputProps,
} from 'react-native';
import { Avatar } from '../ui/Avatar';
import { supabase } from '../../lib/supabase';

interface MentionUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  community_level: number;
  is_certified: boolean;
  is_ray: boolean;
}

interface MentionInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  onMentionsChange?: (mentions: { userId: string; username: string }[]) => void;
  inputRef?: React.RefObject<TextInput>;
}

export function MentionInput({
  value,
  onChangeText,
  onMentionsChange,
  inputRef,
  ...textInputProps
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [cursorPosition, setCursorPosition] = useState(0);
  const localInputRef = useRef<TextInput>(null);
  const actualInputRef = inputRef || localInputRef;

  // Track mentions in the text
  const [mentions, setMentions] = useState<{ userId: string; username: string }[]>([]);

  const searchUsers = useCallback(async (query: string) => {
    try {
      const { data, error } = await supabase.rpc('search_users_for_mention', {
        search_query: query,
        limit_count: 5,
      });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSuggestions([]);
    }
  }, []);

  // Detect @ mentions as user types
  const handleTextChange = (text: string) => {
    onChangeText(text);

    // Find if we're in a mention context
    const textBeforeCursor = text.slice(0, cursorPosition + (text.length - value.length));
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      // Check if there's a space between @ and cursor
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      const hasSpaceAfterAt = textAfterAt.includes(' ');

      if (!hasSpaceAfterAt) {
        // We're in a mention context
        setMentionStartIndex(lastAtIndex);
        setMentionQuery(textAfterAt);
        setShowSuggestions(true);
        searchUsers(textAfterAt);
        return;
      }
    }

    // Not in mention context
    setShowSuggestions(false);
    setMentionQuery('');
    setMentionStartIndex(-1);
  };

  const handleSelectionChange = (event: any) => {
    setCursorPosition(event.nativeEvent.selection.start);
  };

  const handleSelectUser = (user: MentionUser) => {
    if (mentionStartIndex === -1) return;

    // Replace @query with @username
    const beforeMention = value.slice(0, mentionStartIndex);
    const afterMention = value.slice(mentionStartIndex + mentionQuery.length + 1);
    const newText = `${beforeMention}@${user.full_name} ${afterMention}`;

    onChangeText(newText);

    // Track the mention
    const newMentions = [...mentions, { userId: user.id, username: user.full_name }];
    setMentions(newMentions);
    onMentionsChange?.(newMentions);

    // Hide suggestions
    setShowSuggestions(false);
    setMentionQuery('');
    setMentionStartIndex(-1);

    // Keep focus on input
    actualInputRef.current?.focus();
  };

  const renderSuggestion = ({ item }: { item: MentionUser }) => (
    <Pressable
      onPress={() => handleSelectUser(item)}
      className="flex-row items-center px-3 py-2.5 border-b border-border"
      style={({ pressed }) => ({ backgroundColor: pressed ? '#f5f5f5' : '#fff' })}
    >
      <Avatar
        name={item.full_name}
        source={item.avatar_url || undefined}
        size="sm"
        level={item.community_level}
        isCertified={item.is_certified}
      />
      <View className="ml-3 flex-1">
        <View className="flex-row items-center">
          <Text className="font-semibold text-text">{item.full_name}</Text>
          {item.is_ray && (
            <View className="bg-primary/10 px-2 py-0.5 rounded-full ml-2">
              <Text className="text-primary text-xs font-medium">Creator</Text>
            </View>
          )}
          {item.is_certified && !item.is_ray && (
            <View className="bg-green-500/10 px-2 py-0.5 rounded-full ml-2">
              <Text className="text-green-600 text-xs font-medium">Certified</Text>
            </View>
          )}
        </View>
        <Text className="text-textMuted text-xs">Level {item.community_level}</Text>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1">
      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <View className="absolute bottom-full left-0 right-0 bg-white border border-border rounded-xl mb-2 shadow-lg z-50 max-h-48 overflow-hidden">
          <View className="px-3 py-2 border-b border-border bg-gray-50">
            <Text className="text-xs text-textMuted font-medium">Tag someone</Text>
          </View>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      <TextInput
        ref={actualInputRef}
        value={value}
        onChangeText={handleTextChange}
        onSelectionChange={handleSelectionChange}
        {...textInputProps}
      />
    </View>
  );
}

// Helper function to parse mentions from text
export function parseMentions(text: string): string[] {
  const mentionRegex = /@([A-Za-z\s]+?)(?=\s@|\s[^@]|$)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1].trim());
  }
  return mentions;
}

// Helper function to extract mention user IDs from text
export async function extractMentionUserIds(text: string): Promise<string[]> {
  const mentionedNames = parseMentions(text);
  if (mentionedNames.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('full_name', mentionedNames);

    if (error) throw error;
    return data?.map(p => p.id) || [];
  } catch (error) {
    console.error('Error extracting mention IDs:', error);
    return [];
  }
}
