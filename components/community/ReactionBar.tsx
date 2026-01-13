import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ReactionBarProps {
  likesCount: number;
  commentsCount: number;
  userReactions?: string[];
  onReact?: (type: string) => void;
  onComment?: () => void;
  showLabels?: boolean;
}

const reactions = [
  { type: 'like', icon: 'heart-outline', activeIcon: 'heart', color: '#ef4444' },
  { type: 'fire', emoji: '🔥' },
  { type: 'haircut', emoji: '💇' },
  { type: 'helpful', emoji: '💡' },
];

export function ReactionBar({
  likesCount,
  commentsCount,
  userReactions = [],
  onReact,
  onComment,
  showLabels = false,
}: ReactionBarProps) {
  return (
    <View className="pt-3 border-t border-border mt-1">
      {/* Action Buttons Row */}
      <View className="flex-row items-center">
        {/* Reactions */}
        <View className="flex-row items-center">
          {reactions.map((r) => {
            const isActive = userReactions.includes(r.type);

            return (
              <Pressable
                key={r.type}
                onPress={(e) => {
                  e.stopPropagation();
                  onReact?.(r.type);
                }}
                className={`items-center justify-center w-10 h-10 rounded-full ${
                  isActive ? 'bg-primary/10' : ''
                }`}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.6 : 1,
                  transform: [{ scale: pressed ? 0.9 : 1 }],
                })}
              >
                {r.emoji ? (
                  <Text className={`text-lg ${isActive ? '' : 'opacity-50'}`}>
                    {r.emoji}
                  </Text>
                ) : (
                  <Ionicons
                    name={(isActive ? r.activeIcon : r.icon) as any}
                    size={20}
                    color={isActive ? r.color : '#9ca3af'}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Spacer */}
        <View className="flex-1" />

        {/* Stats */}
        <View className="flex-row items-center">
          {likesCount > 0 && (
            <Text className="text-textMuted text-sm mr-3">
              {likesCount} {likesCount === 1 ? 'reaction' : 'reactions'}
            </Text>
          )}
          <Pressable
            onPress={onComment}
            className="flex-row items-center"
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#9ca3af" />
            <Text className="text-textMuted text-sm ml-1">{commentsCount}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
