import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeContainer } from '../../../components/layout/SafeContainer';
import { PostCard, CommunityPost } from '../../../components/community/PostCard';
import { CategoryFilter, Category } from '../../../components/community/CategoryFilter';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';

const categories: Category[] = [
  { key: 'all', label: 'All' },
  { key: 'show_your_work', label: 'Work' },
  { key: 'questions', label: 'Questions' },
  { key: 'tips', label: 'Tips' },
  { key: 'feedback', label: 'Feedback' },
];

const PAGE_SIZE = 20;

export default function CommunityScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchPosts = useCallback(async (reset = false) => {
    if (!reset && loadingMore) return;

    const currentPage = reset ? 0 : page;

    try {
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          profile:profiles!community_posts_user_id_fkey (
            id, full_name, avatar_url, community_level, is_certified
          )
        `)
        .eq('is_published', true)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      // Apply category filter
      if (category !== 'all') {
        if (category === 'feedback') {
          query = query.eq('is_feedback_request', true);
        } else {
          query = query.eq('category', category);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        // Transform Supabase data to match CommunityPost interface
        const transformedPosts: CommunityPost[] = data.map(p => ({
          id: p.id,
          user_id: p.user_id,
          content: p.content,
          media_urls: (p.media_urls as { url: string; type: 'image' | 'video' }[]) || [],
          category: (p.category as CommunityPost['category']) || 'general',
          is_feedback_request: p.is_feedback_request ?? false,
          likes_count: p.likes_count ?? 0,
          comments_count: p.comments_count ?? 0,
          created_at: p.created_at || new Date().toISOString(),
          profile: p.profile ? {
            id: p.profile.id,
            full_name: p.profile.full_name,
            avatar_url: p.profile.avatar_url,
            community_level: p.profile.community_level ?? undefined,
            is_certified: p.profile.is_certified ?? undefined,
          } : undefined,
          user_reactions: [],
        }));

        // Fetch user's reactions for these posts
        if (user) {
          const postIds = transformedPosts.map(p => p.id);
          const { data: reactions } = await supabase
            .from('community_reactions')
            .select('post_id, reaction_type')
            .eq('user_id', user.id)
            .in('post_id', postIds);

          // Map reactions to posts
          const reactionsByPost = new Map<string, { reaction_type: string }[]>();
          reactions?.forEach(r => {
            if (!reactionsByPost.has(r.post_id)) {
              reactionsByPost.set(r.post_id, []);
            }
            reactionsByPost.get(r.post_id)!.push({ reaction_type: r.reaction_type });
          });

          transformedPosts.forEach(post => {
            post.user_reactions = reactionsByPost.get(post.id) || [];
          });
        }

        if (reset) {
          setPosts(transformedPosts);
        } else {
          setPosts(prev => [...prev, ...transformedPosts]);
        }
        setHasMore(data.length === PAGE_SIZE);
        setPage(currentPage + 1);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [category, page, user, loadingMore]);

  useEffect(() => {
    setLoading(true);
    setPage(0);
    setPosts([]);
    fetchPosts(true);
  }, [category]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(0);
    await fetchPosts(true);
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      setLoadingMore(true);
      fetchPosts(false);
    }
  }, [loading, loadingMore, hasMore, fetchPosts]);

  const handleReact = async (postId: string, reactionType: string) => {
    if (!user) return;

    // Find current post and check if user already reacted
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
      // Revert optimistic update on error
      onRefresh();
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#C68976" />
      </View>
    );
  };

  const renderHeader = () => (
    <View className="mb-2">
      {/* Welcome message for first-time visitors or when no posts */}
      {posts.length > 0 && posts.length < 5 && (
        <View className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="sparkles" size={20} color="#C68976" />
            <Text className="text-primary font-semibold ml-2">Welcome to the Community!</Text>
          </View>
          <Text className="text-textMuted text-sm">
            Share your work, ask questions, and connect with fellow stylists mastering the art of the bob.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeContainer edges={['top']}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-2xl font-bold text-text">Community</Text>
              <Text className="text-textMuted text-sm mt-0.5">Share & learn together</Text>
            </View>
            <Pressable
              onPress={() => router.push('/community/create')}
              className="bg-primary px-4 py-2.5 rounded-full flex-row items-center"
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <Ionicons name="create-outline" size={18} color="white" />
              <Text className="text-white font-semibold ml-1.5">Post</Text>
            </Pressable>
          </View>
        </View>

        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selected={category}
          onSelect={setCategory}
        />

        {/* Feed */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#C68976" />
            <Text className="text-textMuted mt-3">Loading posts...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <View className="bg-surface w-24 h-24 rounded-full items-center justify-center mb-4">
              <Ionicons name="chatbubbles-outline" size={48} color="#C68976" />
            </View>
            <Text className="text-text text-xl font-semibold text-center">
              No posts yet
            </Text>
            <Text className="text-textMuted text-center mt-2 leading-6">
              Be the first to share something with the community! Show your work, ask questions, or share tips.
            </Text>
            <Pressable
              onPress={() => router.push('/community/create')}
              className="bg-primary px-6 py-3.5 rounded-full mt-6 flex-row items-center"
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="text-white font-semibold ml-1">Create First Post</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={posts}
            renderItem={({ item }) => (
              <PostCard post={item} onReact={handleReact} />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingTop: 8 }}
            ListHeaderComponent={renderHeader}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#C68976"
                colors={['#C68976']}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeContainer>
  );
}
