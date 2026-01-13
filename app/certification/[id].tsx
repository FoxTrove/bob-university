import { View, Text, ScrollView, Image, Pressable, Alert, RefreshControl, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeContainer } from '../../components/layout/SafeContainer';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useCertifications, useSubmitCertification } from '../../lib/hooks/useCertifications';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Card } from '../../components/ui/Card';

export default function CertificationDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { certifications, loading, error, refetch } = useCertifications();
  const { submitApplication, submitting } = useSubmitCertification();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [initializingPayment, setInitializingPayment] = useState(false);
  
  // Submission State
  const [pickedVideo, setPickedVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const cert = certifications.find(c => c.id === id);

  if (loading) {
    return (
        <SafeContainer>
            <LoadingSpinner fullScreen message="Loading details..." />
        </SafeContainer>
    );
  }

  if (!cert) {
    return (
        <SafeContainer>
            <View className="flex-1 items-center justify-center p-6">
                <Text className="text-text text-lg mb-4">Certification not found</Text>
                <Button title="Go Back" onPress={() => router.back()} variant="outline" />
            </View>
        </SafeContainer>
    );
  }
  
  const userStatus = cert.user_status?.status;
  const isQualified = cert.is_qualified;
  const isUnderReview = userStatus === 'submitted' || userStatus === 'resubmitted';
  
  const handleApply = async () => {
    // Check if payment is required
    if (cert.price_cents > 0) {
        handlePurchase();
        return;
    }
    
    // If no payment required (or already paid - though logic for "paid but not submitted" might need checking)
    // For now, assume if price > 0 and not approved/submitted, we rely on purchase flow OR if we have a way to detect "purchased but not submitted"
    // The current schema uses `user_certifications` to track status. If row exists, they likely "started" it.
    // If this is a purely paid certification, maybe we should check if they purchased it first?
    // However, the prompt says "Once a user signs up AND PAYS... they are given immediate access videos... once fully watched... it unlocks instructions".
    // So this `handleApply` button logic in the original code was a bit ambiguous.
    // Let's assume for this specific flow:
    // 1. User pays -> Access videos.
    // 2. User watches videos -> Unlocks submission.
    // So if isQualified is TRUE, they must have already paid (or it's free) and watched everything.
    
    // So here, `handleApply` is actually `handleSubmitApplication`
    handleSubmitFlow();
  };

  const pickVideo = async () => {
    try {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: false, // Videos often too large/complex for simple editors
            quality: 1,
        });

        if (!result.canceled) {
            setPickedVideo(result.assets[0]);
            setVideoUrlInput(''); // Clear URL input if picking file
        }
    } catch (err) {
        Alert.alert("Error", "Failed to pick video");
    }
  };

  const uploadVideoToSupabase = async (asset: ImagePicker.ImagePickerAsset): Promise<string | null> => {
      try {
          const arrayBuffer = await fetch(asset.uri).then(res => res.arrayBuffer());
          const fileExt = asset.uri.split('.').pop() || 'mov';
          const fileName = `${cert.id}/${Date.now()}.${fileExt}`;
          
          const { data, error: uploadError } = await supabase.storage
            .from('certification-submissions')
            .upload(fileName, arrayBuffer, {
                contentType: asset.mimeType || 'video/quicktime',
                upsert: false
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('certification-submissions')
            .getPublicUrl(fileName);
            
          return publicUrl;
      } catch (err) {
          console.error('Upload error:', err);
          return null;
      }
  };

  const handleSubmitFlow = async () => {
    if (!pickedVideo && !videoUrlInput.trim()) {
        Alert.alert("Missing Video", "Please upload a video or provide a video URL URL to submit.");
        return;
    }

    Alert.alert(
        "Submit Application",
        "Are you sure you want to submit your application for this certification?",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Submit", 
                onPress: async () => {
                    setUploading(true);
                    let finalUrl = videoUrlInput.trim();

                    if (pickedVideo) {
                        const uploadedUrl = await uploadVideoToSupabase(pickedVideo);
                        if (!uploadedUrl) {
                            setUploading(false);
                            Alert.alert("Upload Failed", "Could not upload video. Please try again or use a URL link.");
                            return;
                        }
                        finalUrl = uploadedUrl;
                    }

                    const success = await submitApplication(cert.id, finalUrl);
                    setUploading(false);
                    
                    if (success) {
                        setPickedVideo(null);
                        setVideoUrlInput('');
                        Alert.alert("Success", "Your application has been submitted!");
                        refetch();
                    } else {
                        Alert.alert("Error", "Failed to submit application. Please try again.");
                    }
                }
            }
        ]
    );
  };

  const handlePurchase = async () => {
      // ... existing purchase logic ...
      try {
          setInitializingPayment(true);
          
          const { data, error } = await supabase.functions.invoke('payment-sheet', {
              body: { 
                  amountCents: cert.price_cents,
                  certificationId: cert.id,
                  description: `Certification: ${cert.title}`
              }
          });

          if (error) throw error;
          if (!data?.paymentIntent) throw new Error('Failed to create payment intent');

          const { error: initError } = await initPaymentSheet({
              merchantDisplayName: 'Bob University',
              customerId: data.customer,
              customerEphemeralKeySecret: data.ephemeralKey,
              paymentIntentClientSecret: data.paymentIntent,
              allowsDelayedPaymentMethods: false,
              defaultBillingDetails: {
                  name: 'Student'
              }
          });
          
          if (initError) throw initError;

          const { error: presentError } = await presentPaymentSheet();

          if (presentError) {
              if (presentError.code === 'Canceled') {
                  return;
              }
              throw presentError;
          }

          // Optimized: We don't verify with backend here, just show success.
          // In real app, webhook handles enrollment. 
          // For now, manually create a 'pending' record or assume webhook handles it.
          // BUT: Payment gives access to videos. It does NOT submit the application yet.
          // So we should just refetch to unlock the videos.
          Alert.alert("Success", "Payment successful! You now have access to the certification videos.");
          refetch();

      } catch (err) {
          console.error(err);
          Alert.alert("Payment Failed", err instanceof Error ? err.message : "An error occurred during payment.");
      } finally {
          setInitializingPayment(false);
      }
  };

  const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
  }).format(cert.price_cents / 100);

  return (
    <>
        <Stack.Screen 
            options={{
                title: 'Certification Details',
                headerTitleStyle: { color: 'white' },
                headerStyle: { backgroundColor: 'black' },
                headerTintColor: '#3b82f6',
                headerBackTitle: 'Back'
            }} 
        />
        <SafeContainer edges={['bottom']}>
        <ScrollView 
            className="flex-1 bg-background"
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
            contentContainerStyle={{ paddingBottom: 40 }}
        >
            <View className="h-48 bg-surfaceHighlight w-full items-center justify-center relative overflow-hidden">
                 {cert.badge_image_url ? (
                     <Image 
                        source={{ uri: cert.badge_image_url }} 
                        className="w-full h-full opacity-50 absolute"
                        resizeMode="cover"
                     />
                 ) : null}
                 <View className="z-10 items-center">
                     <Ionicons 
                        name="ribbon" 
                        size={64} 
                        color={userStatus === 'approved' ? '#22c55e' : (userStatus === 'submitted' ? '#eab308' : '#3b82f6')} 
                     />
                 </View>
            </View>

            <View className="p-6">
                <View className="items-center mb-6">
                     <Text className="text-2xl font-bold text-primary text-center mb-2">{cert.title}</Text>
                     {(!userStatus || userStatus === 'rejected') && (
                        <Text className="text-xl font-bold text-white text-center">{formattedPrice}</Text>
                     )}
                     
                     <View className="mt-2">
                        {userStatus === 'approved' && <Badge label="Certified" variant="success" />}
                        {isUnderReview && <Badge label="Under Review" variant="warning" />}
                        {userStatus === 'pending' && <Badge label="Awaiting Submission" variant="info" />}
                        {userStatus === 'rejected' && <Badge label="Needs Work" variant="error" />}
                        {!userStatus && isQualified && <Badge label="Ready to Apply" variant="success" />}
                        {!userStatus && !isQualified && <Badge label="In Progress" variant="info" />}
                     </View>
                </View>

                {/* Status-specific messages */}
                {isUnderReview ? (
                    <View className="bg-surfaceHighlight p-6 rounded-xl items-center mb-8">
                        <Ionicons name="hourglass-outline" size={48} color="#eab308" className="mb-4" />
                        <Text className="text-white font-bold text-lg mb-2">Submission Received</Text>
                        <Text className="text-textMuted text-center">
                            Your application is under review. You will receive a notification when an admin has reviewed your work.
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text className="text-textMuted mb-8 text-center">{cert.description}</Text>
                        
                        {/* Requirements Breakdown */}
                        <View className="mb-8">
                            <Text className="text-lg font-bold text-text mb-4">Requirements</Text>
                            <View className="bg-surface rounded-xl overflow-hidden">
                                {cert.requirements_breakdown?.map((req, index) => (
                                    <View 
                                        key={req.moduleId} 
                                        className={`p-4 flex-row items-center border-b border-border ${index === cert.requirements_breakdown!.length - 1 ? 'border-b-0' : ''}`}
                                    >
                                        <View className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${req.completed ? 'bg-green-500/20' : 'bg-surfaceHighlight'}`}>
                                            {req.completed ? (
                                                <Ionicons name="checkmark" size={14} color="#22c55e" />
                                            ) : (
                                                <View className="w-2 h-2 rounded-full bg-textMuted" />
                                            )}
                                        </View>
                                        <View className="flex-1">
                                            <Text className={`font-medium ${req.completed ? 'text-text' : 'text-textMuted'}`}>
                                                Complete "{req.title}"
                                            </Text>
                                            <Text className="text-xs text-textMuted mt-1">
                                                {req.completedVideos} / {req.totalVideos} videos
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                                {(!cert.requirements_breakdown || cert.requirements_breakdown.length === 0) && (
                                    <View className="p-4">
                                        <Text className="text-textMuted">No specific module requirements.</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </>
                )}

                {/* Available / Apply Flow */}
                {(!userStatus || userStatus === 'rejected' || userStatus === 'pending') && (
                    <View>
                        {isQualified ? (
                            <View>
                                <View className="bg-surface p-4 rounded-xl mb-6">
                                    <Text className="text-lg font-bold text-text mb-2">Submit Your Work</Text>
                                    <Text className="text-textMuted mb-4">
                                        Upload a video demonstrating the techniques learned in this certification.
                                    </Text>
                                    
                                    {/* Video Picker */}
                                    <Pressable 
                                        onPress={pickVideo}
                                        className="h-40 bg-background rounded-lg border border-dashed border-textMuted items-center justify-center mb-4"
                                    >
                                        {pickedVideo ? (
                                            <View className="items-center">
                                                <Ionicons name="videocam" size={32} color="#3b82f6" className="mb-2" />
                                                <Text className="text-primary font-medium">Video Selected</Text>
                                                <Text className="text-textMuted text-xs mt-1">Tap to change</Text>
                                            </View>
                                        ) : (
                                            <View className="items-center">
                                                <Ionicons name="cloud-upload-outline" size={32} color="#71717a" className="mb-2" />
                                                <Text className="text-textMuted font-medium">Tap to upload video</Text>
                                                <Text className="text-textMuted text-xs mt-1">Max 100MB</Text>
                                            </View>
                                        )}
                                    </Pressable>
                                    
                                    <Text className="text-center text-textMuted text-xs mb-2">- OR -</Text>
                                    
                                    {/* URL Input */}
                                    <TextInput
                                        className="bg-background text-text p-4 rounded-lg mb-4"
                                        placeholder="Paste video URL (YouTube, Vimeo, etc.)"
                                        placeholderTextColor="#71717a"
                                        value={videoUrlInput}
                                        onChangeText={setVideoUrlInput}
                                        autoCapitalize="none"
                                    />

                                    <Button 
                                        title={uploading ? "Uploading..." : "Submit Application"}
                                        onPress={handleSubmitFlow}
                                        loading={submitting || uploading}
                                        fullWidth
                                        size="lg"
                                        disabled={(!pickedVideo && !videoUrlInput.trim()) || submitting || uploading}
                                    />
                                </View>
                            </View>
                        ) : (
                             <View>
                                 <View className="bg-surfaceHighlight p-4 rounded-lg flex-row items-center mb-6">
                                     <Ionicons name="lock-closed-outline" size={24} color="#9ca3af" className="mr-3" />
                                     <Text className="text-textMuted flex-1">
                                         Complete all requirements above to unlock the application.
                                     </Text>
                                 </View>
                                 
                                 {/* If payment required and NOT qualified, maybe show purchase button? 
                                     Actually, if they haven't paid, they can't see videos. 
                                     So we likely need a "Purchase to Start" button here if they haven't paid.
                                     Assuming price_cents > 0 means payment required.
                                 */}
                                 {!userStatus && cert.price_cents > 0 && (
                                     <Button 
                                        title={`Purchase for ${formattedPrice}`}
                                        onPress={handlePurchase}
                                        loading={initializingPayment}
                                        fullWidth
                                        variant="outline"
                                     />
                                 )}
                             </View>
                        )}
                    </View>
                )}
                
                {/* Feedback Display */}
                {userStatus === 'rejected' && cert.user_status?.feedback && (
                    <View className="mt-8 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                        <Text className="text-red-500 font-bold mb-2">Review Feedback</Text>
                        <Text className="text-red-400">{cert.user_status.feedback}</Text>
                    </View>
                )}

            </View>
        </ScrollView>
        </SafeContainer>
    </>
  );
}
