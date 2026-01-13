import React, { useState } from 'react';
import { View, Text, Pressable, Image, Alert } from 'react-native';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { Certification, useSubmitCertification } from '../../lib/hooks/useCertifications';

interface CertificationCardProps {
  certification: Certification;
  onRefresh?: () => void;
}

export function CertificationCard({ certification, onRefresh }: CertificationCardProps) {
  const router = useRouter();
  const { submitApplication, submitting } = useSubmitCertification();
  const [localSubmitting, setLocalSubmitting] = useState(false);

  // Status priority: Check user_status first, then qualification
  const userStatus = certification.user_status?.status;
  const isQualified = certification.is_qualified;
  const progressPercent = certification.progress_percentage || 0;

  const handleSubmit = async () => {
      Alert.alert(
          "Submit Application",
          "Are you sure you want to submit your application for this certification? An admin will review your progress.",
          [
              { text: "Cancel", style: "cancel" },
              { 
                  text: "Submit", 
                  onPress: async () => {
                      setLocalSubmitting(true);
                      const success = await submitApplication(certification.id);
                      setLocalSubmitting(false);
                      if (success) {
                          Alert.alert("Success", "Your application has been submitted!");
                          onRefresh?.();
                      } else {
                          Alert.alert("Error", "Failed to submit application. Please try again.");
                      }
                  }
              }
          ]
      );
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
        // Not submitted yet
        if (isQualified) {
            return <Badge label="Ready to Apply" variant="success" />;
        }
        return <Badge label={`${progressPercent}% Complete`} variant="info" />;
    }
  };

  const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
  }).format(certification.price_cents / 100);

  return (
    <Card padding="none" className="mb-4 overflow-hidden">
      <View className="h-40 bg-surfaceHighlight w-full relative">
        {certification.badge_image_url ? (
          <Image
            source={{ uri: certification.badge_image_url }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
            <View className="flex-1 items-center justify-center bg-surfaceHighlight">
                <Ionicons name="ribbon-outline" size={48} color="#52525b" />
            </View>
        )}
        <View className="absolute top-3 right-3">
             {getStatusBadge()}
        </View>
      </View>
      
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-2">
            <Text className="text-xl font-serifBold text-text flex-1 mr-2">{certification.title}</Text>
            {(!userStatus || userStatus === 'rejected') && (
                 <Text className="text-primary font-bold">{formattedPrice}</Text>
            )}
        </View>
        
        {certification.description && (
            <Text className="text-textMuted text-sm line-clamp-2 mb-4" numberOfLines={2}>
              {certification.description}
            </Text>
        )}

        {/* Progress Bar */}
        {!isQualified && !userStatus && (
            <View className="w-full h-2 bg-surfaceHighlight rounded-full overflow-hidden mb-4">
                <View 
                    className="h-full bg-primary" 
                    style={{ width: `${progressPercent}%` }}
                />
            </View>
        )}
        
        {/* Action Buttons */}
        <View className="flex-row items-center justify-between mt-2">
             <Link href={`/certification/${certification.id}`} asChild>
                <Pressable className="flex-row items-center">
                    <Text className="text-primary font-medium text-sm">View Requirements</Text>
                    <Ionicons name="arrow-forward" size={16} color="#3b82f6" className="ml-1" />
                </Pressable>
             </Link>

             {isQualified && (!userStatus || userStatus === 'rejected') && (
                 <Pressable 
                    onPress={handleSubmit}
                    disabled={localSubmitting || submitting}
                    className={`bg-primary px-4 py-2 rounded-lg ${localSubmitting ? 'opacity-50' : ''}`}
                 >
                     <Text className="text-white font-bold text-sm">
                         {localSubmitting ? 'Submitting...' : 'Apply Now'}
                     </Text>
                 </Pressable>
             )}
        </View>
        
        {userStatus === 'rejected' && certification.user_status?.feedback && (
            <View className="mt-4 p-3 bg-red-500/10 rounded-lg">
                <Text className="text-red-500 text-xs font-bold mb-1">Feedback:</Text>
                <Text className="text-red-400 text-xs">{certification.user_status.feedback}</Text>
            </View>
        )}
      </View>
    </Card>
  );
}
