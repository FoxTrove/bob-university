import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeContainer } from '../../../components/layout/SafeContainer';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { ReactionBar } from '../../../components/community/ReactionBar';
import { MentionInput, extractMentionUserIds } from '../../../components/community/MentionInput';
import { MentionText } from '../../../components/community/MentionText';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';

interface PostDetail {
  id: string;
  user_id: string;
  content: string | null;
  media_urls: { url: string; type: 'image' | 'video' }[];
  category: string;
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
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    community_level?: number;
    is_certified?: boolean;
  };
}

const categoryLabels: Record<string, string> = {
  show_your_work: 'Show Your Work',
  questions: 'Question',
  tips: 'Tips & Tricks',
  general: 'General',
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

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const commentInputRef = useRef<TextInput>(null);

  const fetchPost = useCallback(async () => {
    if (!id) return;

    try {
      // Fetch post
      const { data: postData, error: postError } = await supabase
        .from('community_posts')
        .select(`
          *,
          profile:profiles!community_posts_user_id_fkey (
            id, full_name, avatar_url, community_level, is_certified
          )
        `)
        .eq('id', id)
        .single();

      if (postError) throw postError;
      setPost(postData);

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('community_comments')
        .select(`
          *,
          profile:profiles!community_comments_user_id_fkey (
            id, full_name, avatar_url, community_level, is_certified
          )
        `)
        .eq('post_id', id)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;
      setComments(commentsData || []);

      // Fetch user's reactions and comment likes
      if (user) {
        const { data: reactionsData } = await supabase
          .from('community_reactions')
          .select('reaction_type')
          .eq('post_id', id)
          .eq('user_id', user.id);

        setUserReactions(reactionsData?.map(r => r.reaction_type) || []);

        // Fetch user's comment likes
        if (commentsData && commentsData.length > 0) {
          const commentIds = commentsData.map(c => c.id);
          const { data: commentLikesData } = await supabase
            .from('community_comment_likes')
            .select('comment_id')
            .eq('user_id', user.id)
            .in('comment_id', commentIds);

          setLikedComments(new Set(commentLikesData?.map(l => l.comment_id) || []));
        }
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleReact = async (type: string) => {
    if (!user || !post) return;

    const hasReacted = userReactions.includes(type);

    // Optimistic update
    setUserReactions(prev =>
      hasReacted ? prev.filter(r => r !== type) : [...prev, type]
    );
    setPost(prev =>
      prev
        ? { ...prev, likes_count: hasReacted ? prev.likes_count - 1 : prev.likes_count + 1 }
        : prev
    );

    try {
      if (hasReacted) {
        await supabase
          .from('community_reactions')
          .delete()
          .match({ post_id: post.id, user_id: user.id, reaction_type: type });
      } else {
        await supabase
          .from('community_reactions')
          .insert({ post_id: post.id, user_id: user.id, reaction_type: type });
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      fetchPost(); // Revert on error
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) return;

    const hasLiked = likedComments.has(commentId);

    // Optimistic update
    setLikedComments(prev => {
      const next = new Set(prev);
      if (hasLiked) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });

    setComments(prev =>
      prev.map(c =>
        c.id === commentId
          ? { ...c, likes_count: hasLiked ? Math.max(0, c.likes_count - 1) : c.likes_count + 1 }
          : c
      )
    );

    try {
      if (hasLiked) {
        await supabase
          .from('community_comment_likes')
          .delete()
          .match({ comment_id: commentId, user_id: user.id });
      } else {
        await supabase
          .from('community_comment_likes')
          .insert({ comment_id: commentId, user_id: user.id });
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      fetchPost(); // Revert on error
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !post || !commentText.trim()) return;

    setSubmitting(true);
    try {
      // Insert the comment
      const { data: newComment, error } = await supabase
        .from('community_comments')
        .insert({
          post_id: post.id,
          user_id: user.id,
          content: commentText.trim(),
        })
        .select('id')
        .single();

      if (error) throw error;

      // Extract and save mentions
      const mentionedUserIds = await extractMentionUserIds(commentText);
      if (mentionedUserIds.length > 0 && newComment) {
        const mentionInserts = mentionedUserIds.map(mentionedUserId => ({
          mentioned_user_id: mentionedUserId,
          mentioned_by_user_id: user.id,
          comment_id: newComment.id,
        }));

        await supabase.from('community_mentions').insert(mentionInserts);
      }

      setCommentText('');
      fetchPost(); // Refresh comments
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = () => {
    Alert.alert(
      'Report Post',
      'Why are you reporting this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam', onPress: () => submitReport('spam') },
        { text: 'Harassment', onPress: () => submitReport('harassment') },
        { text: 'Inappropriate', onPress: () => submitReport('inappropriate') },
      ]
    );
  };

  const submitReport = async (reason: string) => {
    if (!user || !post) return;

    try {
      await supabase.from('community_reports').insert({
        reporter_id: user.id,
        post_id: post.id,
        reason,
      });
      Alert.alert('Reported', 'Thank you for reporting. Our team will review this post.');
    } catch (error) {
      console.error('Error reporting:', error);
    }
  };

  if (loading) {
    return (
      <SafeContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeContainer>
    );
  }

  if (!post) {
    return (
      <SafeContainer>
        <View className="flex-1 items-center justify-center">
          <Text className="text-textMuted">Post not found</Text>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="flex-row items-center p-4 border-b border-border">
          <Pressable onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
          <Text className="text-lg font-semibold flex-1">Post</Text>
          <Pressable onPress={handleReport}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#71717a" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="p-4">
            {/* Author */}
            <View className="flex-row items-center mb-4">
              <Pressable onPress={() => post.profile?.id && router.push(`/community/profile/${post.profile.id}`)}>
                <Avatar
                  name={post.profile?.full_name || 'User'}
                  source={post.profile?.avatar_url || undefined}
                  size="md"
                  level={post.profile?.community_level}
                  isCertified={post.profile?.is_certified}
                />
              </Pressable>
              <Pressable
                onPress={() => post.profile?.id && router.push(`/community/profile/${post.profile.id}`)}
                className="ml-3 flex-1"
              >
                <Text className="font-bold text-text text-lg">
                  {post.profile?.full_name || 'Anonymous'}
                </Text>
                <Text className="text-textMuted">{timeAgo(post.created_at)}</Text>
              </Pressable>
              {post.is_feedback_request && (
                <Badge label="Feedback Request" variant="warning" />
              )}
            </View>

            {/* Content */}
            {post.content && (
              <MentionText className="text-text text-base mb-4">{post.content}</MentionText>
            )}

            {/* Media */}
            {post.media_urls.length > 0 && (
              <View className="mb-4">
                {post.media_urls.map((media, index) => (
                  <Image
                    key={index}
                    source={{ uri: media.url }}
                    className="w-full h-72 rounded-lg mb-2"
                    resizeMode="cover"
                  />
                ))}
              </View>
            )}

            {/* Category */}
            <Badge
              label={categoryLabels[post.category] || 'General'}
              variant="outline"
              size="sm"
            />

            {/* Reactions */}
            <ReactionBar
              likesCount={post.likes_count}
              commentsCount={comments.length}
              userReactions={userReactions}
              onReact={handleReact}
            />
          </View>

          {/* Comments Section */}
          <View className="border-t border-border">
            <Text className="px-4 py-3 font-semibold text-text">
              Comments ({comments.length})
            </Text>

            {comments.map((comment) => {
              const hasLiked = likedComments.has(comment.id);
              return (
                <View key={comment.id} className="px-4 py-3 border-b border-border">
                  <View className="flex-row items-start">
                    <Pressable onPress={() => comment.profile?.id && router.push(`/community/profile/${comment.profile.id}`)}>
                      <Avatar
                        name={comment.profile?.full_name || 'User'}
                        source={comment.profile?.avatar_url || undefined}
                        size="sm"
                        level={comment.profile?.community_level}
                        isCertified={comment.profile?.is_certified}
                      />
                    </Pressable>
                    <View className="ml-3 flex-1">
                      <View className="flex-row items-center">
                        <Pressable onPress={() => comment.profile?.id && router.push(`/community/profile/${comment.profile.id}`)}>
                          <Text className="font-semibold text-text">
                            {comment.profile?.full_name || 'Anonymous'}
                          </Text>
                        </Pressable>
                        <Text className="text-textMuted text-xs ml-2">
                          {timeAgo(comment.created_at)}
                        </Text>
                      </View>
                      <MentionText className="text-text mt-1">{comment.content}</MentionText>
                      {/* Like Button */}
                      <View className="flex-row items-center mt-2">
                        <Pressable
                          onPress={() => handleLikeComment(comment.id)}
                          className="flex-row items-center"
                          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                        >
                          <Ionicons
                            name={hasLiked ? 'heart' : 'heart-outline'}
                            size={16}
                            color={hasLiked ? '#ef4444' : '#9ca3af'}
                          />
                          {comment.likes_count > 0 && (
                            <Text className={`text-xs ml-1 ${hasLiked ? 'text-red-500' : 'text-textMuted'}`}>
                              {comment.likes_count}
                            </Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}

            {comments.length === 0 && (
              <View className="px-4 py-8 items-center">
                <Text className="text-textMuted">No comments yet. Be the first!</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border p-4 pb-8">
          <View className="flex-row items-end">
            <MentionInput
              inputRef={commentInputRef}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a comment... Use @ to tag"
              placeholderTextColor="#71717a"
              className="flex-1 bg-surface border border-border rounded-2xl px-4 py-3 text-text mr-2 max-h-24"
              multiline
              maxLength={1000}
            />
            <Pressable
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || submitting}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                commentText.trim() ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={18} color="white" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeContainer>
  );
}
