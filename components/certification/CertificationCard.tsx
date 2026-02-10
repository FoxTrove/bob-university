import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Certification } from '../../lib/hooks/useCertifications';

interface CertificationCardProps {
  certification: Certification;
  onRefresh?: () => void;
}

export function CertificationCard({ certification, onRefresh }: CertificationCardProps) {
  const router = useRouter();

  const userStatus = certification.user_status?.status;
  const isQualified = certification.is_qualified;
  const progressPercent = certification.progress_percentage || 0;

  const handlePress = () => {
    router.push(`/certification/${certification.id}`);
  };

  const getStatusBadge = () => {
    switch (userStatus) {
      case 'approved':
        return <Badge label="Certified" variant="success" />;
      case 'submitted':
      case 'resubmitted':
        return <Badge label="Under Review" variant="warning" />;
      case 'pending':
        return <Badge label="Awaiting Submission" variant="info" />;
      case 'rejected':
        return <Badge label="Needs Work" variant="error" />;
      default:
        if (isQualified) {
            return <Badge label="Ready to Apply" variant="success" />;
        }
        return <Badge label={`${progressPercent}%`} variant="info" />;
    }
  };

  const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
  }).format(certification.price_cents / 100);

  const getStatusIcon = () => {
    switch (userStatus) {
      case 'approved':
        return { name: 'checkmark-circle', color: '#22c55e' };
      case 'submitted':
      case 'resubmitted':
        return { name: 'hourglass-outline', color: '#eab308' };
      case 'rejected':
        return { name: 'alert-circle', color: '#ef4444' };
      default:
        return { name: 'ribbon', color: '#C68976' };
    }
  };

  const statusIcon = getStatusIcon();

  return (
    <Pressable onPress={handlePress}>
      <Card padding="none" className="mb-4 overflow-hidden">
        {/* Hero Image Section */}
        <View className="h-44 bg-surfaceHighlight w-full relative">
          {certification.feature_image_url || certification.badge_image_url ? (
            <Image
              source={{ uri: certification.feature_image_url || certification.badge_image_url || undefined }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="flex-1 items-center justify-center bg-gradient-to-br from-primary/20 to-surfaceHighlight">
              <View className="bg-primary/20 p-4 rounded-full">
                <Ionicons name="ribbon" size={48} color="#C68976" />
              </View>
            </View>
          )}
          {/* Gradient overlay */}
          <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Status Badge */}
          <View className="absolute top-3 right-3">
            {getStatusBadge()}
          </View>

          {/* Title on image */}
          <View className="absolute bottom-0 left-0 right-0 p-4">
            <View className="flex-row items-center mb-2">
              <View className="bg-black/50 p-2 rounded-full mr-2">
                <Ionicons name={statusIcon.name as any} size={20} color={statusIcon.color} />
              </View>
              <Text className="text-xl font-serifBold text-white flex-1" numberOfLines={1}>
                {certification.title}
              </Text>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View className="p-4">
          {/* Description */}
          {certification.description && (
            <Text className="text-gray-400 text-sm mb-4" numberOfLines={2}>
              {certification.description}
            </Text>
          )}

          {/* Progress Section - Only for in-progress certifications */}
          {!isQualified && !userStatus && (
            <View className="mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-textMuted text-sm">Progress</Text>
                <Text className="text-primary font-bold text-sm">{progressPercent}%</Text>
              </View>
              <ProgressBar progress={progressPercent / 100} />
            </View>
          )}

          {/* Footer Row */}
          <View className="flex-row items-center justify-between">
            {/* Price or Status */}
            <View className="flex-row items-center">
              {userStatus === 'approved' ? (
                <View className="flex-row items-center bg-green-500/10 px-3 py-1.5 rounded-full">
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <Text className="text-green-400 font-medium text-sm ml-1">Certified</Text>
                </View>
              ) : userStatus === 'submitted' || userStatus === 'resubmitted' ? (
                <View className="flex-row items-center bg-yellow-500/10 px-3 py-1.5 rounded-full">
                  <Ionicons name="hourglass-outline" size={16} color="#eab308" />
                  <Text className="text-yellow-400 font-medium text-sm ml-1">Under Review</Text>
                </View>
              ) : (
                <Text className="text-2xl font-bold text-primary">{formattedPrice}</Text>
              )}
            </View>

            {/* Action */}
            <View className="flex-row items-center bg-primary/10 px-4 py-2 rounded-full">
              <Text className="text-primary font-medium text-sm mr-1">
                {userStatus === 'approved' ? 'View' : isQualified ? 'Apply Now' : 'Details'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#C68976" />
            </View>
          </View>

          {/* Rejection Feedback */}
          {userStatus === 'rejected' && certification.user_status?.feedback && (
            <View className="mt-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
              <View className="flex-row items-center mb-1">
                <Ionicons name="alert-circle" size={14} color="#ef4444" />
                <Text className="text-red-400 text-xs font-bold ml-1">Feedback:</Text>
              </View>
              <Text className="text-red-300 text-sm" numberOfLines={2}>{certification.user_status.feedback}</Text>
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );
}
