import React from 'react';
import { Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

interface MentionTextProps {
  children: string;
  className?: string;
}

// Parse text and render @mentions as clickable links
export function MentionText({ children, className = '' }: MentionTextProps) {
  const router = useRouter();

  if (!children) return null;

  // Split text by @mentions
  const parts = children.split(/(@[A-Za-z\s]+?)(?=\s@|\s[^@]|$)/g);

  const handleMentionPress = async (username: string) => {
    // Remove @ symbol
    const name = username.slice(1).trim();

    try {
      // Look up user by name
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('full_name', name)
        .single();

      if (error || !data) {
        console.log('User not found:', name);
        return;
      }

      router.push(`/community/profile/${data.id}`);
    } catch (error) {
      console.error('Error looking up user:', error);
    }
  };

  return (
    <Text className={className}>
      {parts.map((part, index) => {
        // Check if this part is a mention
        if (part.startsWith('@')) {
          return (
            <Text
              key={index}
              className="text-primary font-semibold"
              onPress={() => handleMentionPress(part)}
            >
              {part}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
}
