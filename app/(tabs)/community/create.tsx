import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeContainer } from '../../../components/layout/SafeContainer';
import { MentionInput, extractMentionUserIds } from '../../../components/community/MentionInput';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';

type CategoryKey = 'show_your_work' | 'questions' | 'tips' | 'general';

interface MediaItem {
  uri: string;
  type: 'image' | 'video';
  mimeType?: string;
}

const categories: { key: CategoryKey; label: string; icon: string }[] = [
  { key: 'show_your_work', label: 'Show Your Work', icon: 'camera-outline' },
  { key: 'questions', label: 'Question', icon: 'help-circle-outline' },
  { key: 'tips', label: 'Tips & Tricks', icon: 'bulb-outline' },
  { key: 'general', label: 'General', icon: 'chatbubble-outline' },
];

export default function CreatePostScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [content, setContent] = useState('');
  const [category, setCategory] = useState<CategoryKey>('general');
  const [isFeedbackRequest, setIsFeedbackRequest] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const contentInputRef = useRef<TextInput>(null);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 4 - media.length,
    });

    if (!result.canceled && result.assets) {
      const newMedia: MediaItem[] = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
        mimeType: asset.mimeType,
      }));
      setMedia((prev) => [...prev, ...newMedia].slice(0, 4));
    }
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadMedia = async (): Promise<{ url: string; type: 'image' | 'video' }[]> => {
    const uploadedUrls: { url: string; type: 'image' | 'video' }[] = [];

    for (const item of media) {
      const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const ext = item.mimeType?.split('/')[1] || 'jpg';
      const filePath = `${fileName}.${ext}`;

      // Fetch the file and convert to blob
      const response = await fetch(item.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('community-media')
        .upload(filePath, blob, {
          contentType: item.mimeType || 'image/jpeg',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('community-media')
        .getPublicUrl(filePath);

      uploadedUrls.push({
        url: urlData.publicUrl,
        type: item.type,
      });
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a post');
      return;
    }

    if (!content.trim() && media.length === 0) {
      Alert.alert('Error', 'Please add some content or media to your post');
      return;
    }

    setUploading(true);

    try {
      // Check if user is banned from community
      const { data: isBanned } = await supabase.rpc('is_user_banned', { check_user_id: user.id });
      if (isBanned) {
        Alert.alert(
          'Cannot Post',
          'Your account has been restricted from posting in the community. Please contact support if you believe this is an error.'
        );
        setUploading(false);
        return;
      }

      // Upload media files first
      let mediaUrls: { url: string; type: 'image' | 'video' }[] = [];
      if (media.length > 0) {
        mediaUrls = await uploadMedia();
      }

      // Create the post
      const { data: newPost, error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          content: content.trim() || null,
          media_urls: mediaUrls,
          category,
          is_feedback_request: isFeedbackRequest,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Extract and save mentions
      if (content.trim() && newPost) {
        const mentionedUserIds = await extractMentionUserIds(content);
        if (mentionedUserIds.length > 0) {
          const mentionInserts = mentionedUserIds.map(mentionedUserId => ({
            mentioned_user_id: mentionedUserId,
            mentioned_by_user_id: user.id,
            post_id: newPost.id,
          }));

          await supabase.from('community_mentions').insert(mentionInserts);
        }
      }

      Alert.alert('Success', 'Your post has been published!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeContainer edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#71717a" />
          </Pressable>
          <Text className="text-lg font-semibold">Create Post</Text>
          <Pressable
            onPress={handleSubmit}
            disabled={uploading || (!content.trim() && media.length === 0)}
            className={`px-4 py-2 rounded-full ${
              uploading || (!content.trim() && media.length === 0)
                ? 'bg-gray-300'
                : 'bg-primary'
            }`}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-semibold">Post</Text>
            )}
          </Pressable>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Category Selector */}
          <Text className="text-textMuted text-sm mb-2">Category</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <Pressable
                key={cat.key}
                onPress={() => setCategory(cat.key)}
                className={`flex-row items-center px-4 py-2 rounded-full border ${
                  category === cat.key
                    ? 'bg-primary border-primary'
                    : 'bg-surface border-border'
                }`}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={18}
                  color={category === cat.key ? 'white' : '#71717a'}
                />
                <Text
                  className={`ml-2 font-medium ${
                    category === cat.key ? 'text-white' : 'text-textMuted'
                  }`}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Content Input */}
          <MentionInput
            inputRef={contentInputRef}
            value={content}
            onChangeText={setContent}
            placeholder="What's on your mind? Use @ to tag people..."
            placeholderTextColor="#a1a1aa"
            multiline
            numberOfLines={6}
            className="bg-surface border border-border rounded-xl p-4 text-text min-h-[150px] text-base mb-4"
            textAlignVertical="top"
            maxLength={2000}
          />

          {/* Character Count */}
          <Text className="text-textMuted text-xs text-right mb-4">
            {content.length}/2000
          </Text>

          {/* Feedback Request Toggle */}
          <View className="flex-row items-center justify-between bg-surface border border-border rounded-xl p-4 mb-6">
            <View className="flex-1 mr-4">
              <Text className="text-text font-medium">Request Feedback</Text>
              <Text className="text-textMuted text-sm">
                Let the community know you want constructive critique
              </Text>
            </View>
            <Switch
              value={isFeedbackRequest}
              onValueChange={setIsFeedbackRequest}
              trackColor={{ false: '#d1d5db', true: '#C68976' }}
              thumbColor="white"
            />
          </View>

          {/* Media Preview */}
          {media.length > 0 && (
            <View className="mb-4">
              <Text className="text-textMuted text-sm mb-2">
                Media ({media.length}/4)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {media.map((item, index) => (
                  <View key={index} className="w-[48%] h-32 relative">
                    <Image
                      source={{ uri: item.uri }}
                      className="w-full h-full rounded-lg"
                      resizeMode="cover"
                    />
                    {item.type === 'video' && (
                      <View className="absolute inset-0 items-center justify-center">
                        <View className="bg-black/50 rounded-full p-2">
                          <Ionicons name="play" size={24} color="white" />
                        </View>
                      </View>
                    )}
                    <Pressable
                      onPress={() => removeMedia(index)}
                      className="absolute top-1 right-1 bg-black/70 rounded-full p-1"
                    >
                      <Ionicons name="close" size={16} color="white" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Add Media Button */}
          {media.length < 4 && (
            <Pressable
              onPress={pickMedia}
              className="flex-row items-center justify-center border-2 border-dashed border-border rounded-xl py-8"
            >
              <Ionicons name="images-outline" size={24} color="#3b82f6" />
              <Text className="text-primary font-medium ml-2">
                Add Photos or Videos
              </Text>
            </Pressable>
          )}

          {/* Spacer for bottom */}
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeContainer>
  );
}
