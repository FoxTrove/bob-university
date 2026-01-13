import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeContainer } from '../../../../components/layout/SafeContainer';
import { Avatar } from '../../../../components/ui/Avatar';
import { CircularProgress, getLevelProgress, LEVEL_THRESHOLDS } from '../../../../components/ui/CircularProgress';
import { PostCard, CommunityPost } from '../../../../components/community/PostCard';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../lib/auth';

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  community_level: number;
  community_points: number;
  is_certified: boolean;
  created_at: string;
}

interface ProfileStats {
  postsCount: number;
  reactionsReceived: number;
  commentsReceived: number;
}

const levelTitles: Record<number, string> = {
  1: 'Newcomer',
  2: 'Contributor',
  3: 'Regular',
  4: 'Active Member',
  5: 'Engaged',
  6: 'Enthusiast',
  7: 'Expert',
  8: 'Master',
  9: 'Legend',
  10: 'Community Champion',
};

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [stats, setStats] = useState<ProfileStats>({ postsCount: 0, reactionsReceived: 0, commentsReceived: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isOwnProfile = user?.id === id;

  const fetchProfile = useCallback(async () => {
    if (!id) return;

    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, community_level, community_points, is_certified, created_at')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch user's posts
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select(`
          *,
          profile:profiles!community_posts_user_id_fkey (
            id, full_name, avatar_url, community_level, is_certified
          )
        `)
        .eq('user_id', id)
        .eq('is_published', true)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch user's reactions on these posts
      if (user && postsData) {
        const postIds = postsData.map(p => p.id);
        if (postIds.length > 0) {
          const { data: reactions } = await supabase
            .from('community_reactions')
            .select('post_id, reaction_type')
            .eq('user_id', user.id)
            .in('post_id', postIds);

          const reactionsByPost = new Map<string, { reaction_type: string }[]>();
          reactions?.forEach(r => {
            if (!reactionsByPost.has(r.post_id)) {
              reactionsByPost.set(r.post_id, []);
            }
            reactionsByPost.get(r.post_id)!.push({ reaction_type: r.reaction_type });
          });

          postsData.forEach(post => {
            post.user_reactions = reactionsByPost.get(post.id) || [];
          });
        }
      }

      setPosts(postsData || []);

      // Calculate stats
      const postsCount = postsData?.length || 0;

      // Get total reactions received on all posts
      let reactionsReceived = 0;
      let commentsReceived = 0;
      postsData?.forEach(post => {
        reactionsReceived += post.likes_count || 0;
        commentsReceived += post.comments_count || 0;
      });

      setStats({ postsCount, reactionsReceived, commentsReceived });

    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
  }, [fetchProfile]);

  const handleReact = async (postId: string, reactionType: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    const hasReacted = post?.user_reactions?.some(r => r.reaction_type === reactionType);

    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;

      const newReactions = hasReacted
        ? p.user_reactions?.filter(r => r.reaction_type !== reactionType) || []
        : [...(p.user_reactions || []), { reaction_type: reactionType }];

      return {
        ...p,
        user_reactions: newReactions,
        likes_count: hasReacted ? p.likes_count - 1 : p.likes_count + 1,
      };
    }));

    try {
      if (hasReacted) {
        await supabase
          .from('community_reactions')
          .delete()
          .match({ post_id: postId, user_id: user.id, reaction_type: reactionType });
      } else {
        await supabase
          .from('community_reactions')
          .insert({ post_id: postId, user_id: user.id, reaction_type: reactionType });
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      onRefresh();
    }
  };

  const renderHeader = () => {
    if (!profile) return null;

    const levelTitle = levelTitles[Math.min(profile.community_level || 1, 10)];
    const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const currentLevel = profile.community_level || 1;
    const currentPoints = profile.community_points || 0;
    const { progress, nextThreshold, pointsToNext } = getLevelProgress(currentPoints, currentLevel);
    const isMaxLevel = currentLevel >= 10;

    return (
      <View className="bg-surface border-b border-border">
        {/* Profile Header */}
        <View className="items-center pt-6 pb-4 px-4">
          {/* Avatar with Progress Ring */}
          <CircularProgress
            progress={progress}
            size={100}
            strokeWidth={4}
          >
            <Avatar
              name={profile.full_name || 'User'}
              source={profile.avatar_url || undefined}
              size="xl"
              level={profile.community_level}
              isCertified={profile.is_certified}
            />
          </CircularProgress>

          {/* Points to Next Level */}
          {!isMaxLevel ? (
            <View className="flex-row items-center mt-3 bg-gray-100 px-3 py-1.5 rounded-full">
              <Ionicons name="trending-up" size={14} color="#C68976" />
              <Text className="text-textMuted text-xs ml-1.5">
                <Text className="font-semibold text-primary">{pointsToNext}</Text> points to Level {currentLevel + 1}
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center mt-3 bg-amber-100 px-3 py-1.5 rounded-full">
              <Ionicons name="star" size={14} color="#f59e0b" />
              <Text className="text-amber-700 text-xs font-medium ml-1.5">Max Level Achieved!</Text>
            </View>
          )}

          <Text className="text-xl font-bold text-text mt-3">
            {profile.full_name || 'Anonymous'}
          </Text>

          {/* Level & Title */}
          <View className="flex-row items-center mt-1">
            <Text className="text-primary font-semibold">Level {currentLevel}</Text>
            <Text className="text-textMuted mx-2">•</Text>
            <Text className="text-textMuted">{levelTitle}</Text>
          </View>

          {/* Certified Badge */}
          {profile.is_certified && (
            <View className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-full mt-2">
              <Ionicons name="checkmark-circle" size={16} color="#C68976" />
              <Text className="text-primary font-medium ml-1">Certified Stylist</Text>
            </View>
          )}

          {/* Member Since */}
          <Text className="text-textMuted text-sm mt-2">
            Member since {memberSince}
          </Text>
        </View>

        {/* Stats Row */}
        <View className="flex-row border-t border-border">
          <View className="flex-1 items-center py-4 border-r border-border">
            <Text className="text-xl font-bold text-text">{stats.postsCount}</Text>
            <Text className="text-textMuted text-sm">Posts</Text>
          </View>
          <View className="flex-1 items-center py-4 border-r border-border">
            <Text className="text-xl font-bold text-text">{stats.reactionsReceived}</Text>
            <Text className="text-textMuted text-sm">Reactions</Text>
          </View>
          <View className="flex-1 items-center py-4">
            <Text className="text-xl font-bold text-text">{currentPoints}</Text>
            <Text className="text-textMuted text-sm">Points</Text>
          </View>
        </View>

        {/* Posts Section Header */}
        <View className="px-4 py-3 bg-background">
          <Text className="font-semibold text-text">Posts</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeContainer>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#C68976" />
        </View>
      </SafeContainer>
    );
  }

  if (!profile) {
    return (
      <SafeContainer>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-textMuted">User not found</Text>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-border bg-background">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#000" />
        </Pressable>
        <Text className="text-lg font-semibold flex-1">Profile</Text>
        {isOwnProfile && (
          <Pressable onPress={() => router.push('/profile/edit')}>
            <Ionicons name="settings-outline" size={24} color="#71717a" />
          </Pressable>
        )}
      </View>

      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <PostCard post={item} onReact={handleReact} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View className="items-center py-12 px-8">
            <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
            <Text className="text-textMuted mt-3 text-center">
              {isOwnProfile ? "You haven't posted anything yet" : "No posts yet"}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C68976"
            colors={['#C68976']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeContainer>
  );
}
