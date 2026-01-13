import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../ui/Avatar';
import { ReactionBar } from './ReactionBar';
import { MentionText } from './MentionText';

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string | null;
  media_urls: { url: string; type: 'image' | 'video' }[];
  category: 'show_your_work' | 'questions' | 'tips' | 'general';
  is_feedback_request: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    community_level?: number;
    is_certified?: boolean;
  };
  user_reactions?: { reaction_type: string }[];
}

interface PostCardProps {
  post: CommunityPost;
  onReact?: (postId: string, type: string) => void;
}

const categoryConfig: Record<string, { label: string; icon: string; color: string }> = {
  show_your_work: { label: 'Show Your Work', icon: 'camera', color: '#8b5cf6' },
  questions: { label: 'Question', icon: 'help-circle', color: '#3b82f6' },
  tips: { label: 'Tips & Tricks', icon: 'bulb', color: '#f59e0b' },
  general: { label: 'General', icon: 'chatbubble', color: '#6b7280' },
};

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function PostCard({ post, onReact }: PostCardProps) {
  const router = useRouter();
  const userReactions = post.user_reactions?.map(r => r.reaction_type) || [];
  const category = categoryConfig[post.category] || categoryConfig.general;

  const handleProfilePress = (e: any) => {
    e.stopPropagation();
    if (post.profile?.id) {
      router.push(`/community/profile/${post.profile.id}`);
    }
  };

  return (
    <Link href={`/community/${post.id}`} asChild>
      <Pressable>
        <View className="bg-surface rounded-2xl mb-4 overflow-hidden border border-border">
          {/* Feedback Request Banner */}
          {post.is_feedback_request && (
            <View className="bg-amber-500/10 px-4 py-2 flex-row items-center">
              <Ionicons name="megaphone" size={16} color="#f59e0b" />
              <Text className="text-amber-600 text-sm font-semibold ml-2">
                Requesting Feedback
              </Text>
            </View>
          )}

          <View className="p-4">
            {/* Author Header */}
            <View className="flex-row items-center mb-3">
              <Pressable onPress={handleProfilePress}>
                <Avatar
                  name={post.profile?.full_name || 'User'}
                  source={post.profile?.avatar_url || undefined}
                  size="md"
                  level={post.profile?.community_level}
                  isCertified={post.profile?.is_certified}
                />
              </Pressable>
              <Pressable onPress={handleProfilePress} className="ml-3 flex-1">
                <Text className="font-bold text-text text-base">
                  {post.profile?.full_name || 'Anonymous'}
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <Ionicons name={category.icon as any} size={12} color={category.color} />
                  <Text className="text-textMuted text-xs ml-1">{category.label}</Text>
                  <Text className="text-textMuted text-xs mx-1.5">·</Text>
                  <Text className="text-textMuted text-xs">{timeAgo(post.created_at)}</Text>
                </View>
              </Pressable>
            </View>

            {/* Content */}
            {post.content && (
              <MentionText className="text-text text-base leading-6 mb-3">
                {post.content.length > 300 ? post.content.slice(0, 300) + '...' : post.content}
              </MentionText>
            )}

            {/* Media Grid */}
            {post.media_urls.length > 0 && (
              <View className="mb-3 rounded-xl overflow-hidden">
                {post.media_urls.length === 1 ? (
                  <Image
                    source={{ uri: post.media_urls[0].url }}
                    className="w-full h-52 bg-gray-200"
                    resizeMode="cover"
                  />
                ) : post.media_urls.length === 2 ? (
                  <View className="flex-row">
                    {post.media_urls.map((media, index) => (
                      <Image
                        key={index}
                        source={{ uri: media.url }}
                        className="flex-1 h-40 bg-gray-200"
                        style={{ marginLeft: index > 0 ? 2 : 0 }}
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                ) : (
                  <View className="flex-row flex-wrap">
                    {post.media_urls.slice(0, 4).map((media, index) => (
                      <View
                        key={index}
                        style={{
                          width: '50%',
                          height: 100,
                          paddingLeft: index % 2 === 1 ? 1 : 0,
                          paddingRight: index % 2 === 0 ? 1 : 0,
                          paddingBottom: index < 2 ? 1 : 0,
                          paddingTop: index >= 2 ? 1 : 0,
                        }}
                      >
                        <Image
                          source={{ uri: media.url }}
                          className="w-full h-full bg-gray-200"
                          resizeMode="cover"
                        />
                        {index === 3 && post.media_urls.length > 4 && (
                          <View className="absolute inset-0 bg-black/60 items-center justify-center">
                            <Text className="text-white text-xl font-bold">
                              +{post.media_urls.length - 4}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Reaction Bar */}
            <ReactionBar
              likesCount={post.likes_count}
              commentsCount={post.comments_count}
              userReactions={userReactions}
              onReact={(type) => onReact?.(post.id, type)}
            />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
