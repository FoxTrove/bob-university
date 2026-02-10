import { View, Text, ScrollView, Image, Pressable, Alert, RefreshControl, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeContainer } from '../../components/layout/SafeContainer';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useCertifications, useSubmitCertification, ValueProp } from '../../lib/hooks/useCertifications';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

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
    if (cert.price_cents > 0) {
        handlePurchase();
        return;
    }
    handleSubmitFlow();
  };

  const pickVideo = async () => {
    try {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            setPickedVideo(result.assets[0]);
            setVideoUrlInput('');
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
        Alert.alert("Missing Video", "Please upload a video or provide a video URL to submit.");
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

  // Default value props if none are set
  const valueProps: ValueProp[] = cert.value_props?.length ? cert.value_props : [
    { label: 'Exclusive Video Tutorials', value: '10+ Hours', icon: 'videocam' },
    { label: 'Personal Review by Ray', value: 'Included', icon: 'person' },
    { label: 'Official Certification Badge', value: 'Lifetime', icon: 'ribbon' },
    { label: 'Directory Listing', value: 'Premium', icon: 'map' },
  ];

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
        return <Badge label="In Progress" variant="info" />;
    }
  };

  return (
    <>
        <Stack.Screen
            options={{
                title: '',
                headerTransparent: true,
                headerTintColor: '#fff',
                headerBackTitle: 'Back',
                headerLeft: () => (
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="flex-row items-center bg-black/40 rounded-full px-3 py-2"
                    >
                        <Ionicons name="chevron-back" size={20} color="#fff" />
                        <Text className="text-white font-medium ml-1">Back</Text>
                    </TouchableOpacity>
                ),
            }}
        />
        <SafeContainer edges={['bottom']}>
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
            contentContainerStyle={{ paddingBottom: 40 }}
        >
            {/* Hero Section with Feature Image */}
            <View className="h-64 bg-surfaceHighlight w-full relative overflow-hidden">
                 {cert.feature_image_url ? (
                     <Image
                        source={{ uri: cert.feature_image_url }}
                        className="w-full h-full absolute"
                        resizeMode="cover"
                     />
                 ) : cert.badge_image_url ? (
                     <Image
                        source={{ uri: cert.badge_image_url }}
                        className="w-full h-full absolute opacity-30"
                        resizeMode="cover"
                     />
                 ) : null}
                 {/* Gradient overlay */}
                 <View className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                 <View className="absolute bottom-0 left-0 right-0 p-6">
                     <View className="flex-row items-center mb-3">
                         <View className="bg-primary/20 p-3 rounded-full mr-3">
                             <Ionicons
                                name="ribbon"
                                size={32}
                                color={userStatus === 'approved' ? '#22c55e' : (userStatus === 'submitted' ? '#eab308' : '#C68976')}
                             />
                         </View>
                         {getStatusBadge()}
                     </View>
                     <Text className="text-3xl font-serifBold text-white">{cert.title}</Text>
                 </View>
            </View>

            <View className="p-6">
                {/* Price Banner */}
                {(!userStatus || userStatus === 'rejected') && (
                    <View className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-6">
                        <View className="flex-row items-center justify-between">
                            <View>
                                <Text className="text-textMuted text-sm">Investment</Text>
                                <Text className="text-3xl font-bold text-primary">{formattedPrice}</Text>
                            </View>
                            <View className="bg-green-500/20 px-3 py-1.5 rounded-full">
                                <Text className="text-green-400 font-medium text-sm">One-time payment</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Status-specific messages */}
                {isUnderReview ? (
                    <Card className="mb-6">
                        <View className="items-center py-4">
                            <View className="bg-yellow-500/20 p-4 rounded-full mb-4">
                                <Ionicons name="hourglass-outline" size={48} color="#eab308" />
                            </View>
                            <Text className="text-white font-bold text-xl mb-2">Submission Received</Text>
                            <Text className="text-textMuted text-center leading-6">
                                Your application is under review. You will receive a notification when an admin has reviewed your work.
                            </Text>
                        </View>
                    </Card>
                ) : (
                    <>
                        {/* Description */}
                        <Text className="text-gray-300 text-base leading-7 mb-8">{cert.description}</Text>

                        {/* Value Proposition Section */}
                        {(!userStatus || userStatus === 'rejected') && (
                            <View className="mb-8">
                                <Text className="text-lg font-bold text-white mb-4">What's Included</Text>
                                <Card padding="none" className="overflow-hidden">
                                    {valueProps.map((prop, index) => (
                                        <View
                                            key={index}
                                            className={`flex-row items-center p-4 ${index !== valueProps.length - 1 ? 'border-b border-border' : ''}`}
                                        >
                                            <View className="bg-primary/10 p-2.5 rounded-full mr-4">
                                                <Ionicons
                                                    name={(prop.icon as any) || 'checkmark-circle'}
                                                    size={20}
                                                    color="#C68976"
                                                />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-white font-medium">{prop.label}</Text>
                                            </View>
                                            <Text className="text-primary font-bold">{prop.value}</Text>
                                        </View>
                                    ))}
                                </Card>
                                <View className="mt-4 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                    <View className="flex-row items-center">
                                        <Ionicons name="flash" size={20} color="#22c55e" />
                                        <Text className="text-green-400 font-medium ml-2">
                                            Total Value: $500+ — Yours for {formattedPrice}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Requirements Breakdown */}
                        <View className="mb-8">
                            <Text className="text-lg font-bold text-white mb-4">Requirements</Text>
                            <Card padding="none" className="overflow-hidden">
                                {cert.requirements_breakdown?.map((req, index) => (
                                    <View
                                        key={req.moduleId}
                                        className={`p-4 flex-row items-center ${index !== cert.requirements_breakdown!.length - 1 ? 'border-b border-border' : ''}`}
                                    >
                                        <View className={`w-8 h-8 rounded-full items-center justify-center mr-4 ${req.completed ? 'bg-green-500/20' : 'bg-surface'}`}>
                                            {req.completed ? (
                                                <Ionicons name="checkmark" size={18} color="#22c55e" />
                                            ) : (
                                                <Text className="text-textMuted text-sm font-medium">{index + 1}</Text>
                                            )}
                                        </View>
                                        <View className="flex-1">
                                            <Text className={`font-medium ${req.completed ? 'text-white' : 'text-gray-400'}`}>
                                                Complete "{req.title}"
                                            </Text>
                                            <Text className="text-sm text-textMuted mt-0.5">
                                                {req.completedVideos} / {req.totalVideos} videos completed
                                            </Text>
                                        </View>
                                        {req.completed && (
                                            <View className="bg-green-500/20 px-2 py-1 rounded-full">
                                                <Text className="text-green-400 text-xs font-medium">Done</Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                                {(!cert.requirements_breakdown || cert.requirements_breakdown.length === 0) && (
                                    <View className="p-4">
                                        <Text className="text-textMuted">No specific module requirements.</Text>
                                    </View>
                                )}
                            </Card>
                        </View>
                    </>
                )}

                {/* Available / Apply Flow */}
                {(!userStatus || userStatus === 'rejected' || userStatus === 'pending') && (
                    <View>
                        {isQualified ? (
                            <View>
                                <Card className="mb-6">
                                    <Text className="text-xl font-bold text-white mb-2">Submit Your Work</Text>
                                    <Text className="text-gray-400 mb-6 leading-6">
                                        Upload a video demonstrating the techniques learned in this certification.
                                    </Text>

                                    {/* Video Picker */}
                                    <Pressable
                                        onPress={pickVideo}
                                        className="h-40 bg-surface rounded-xl border-2 border-dashed border-gray-600 items-center justify-center mb-4"
                                    >
                                        {pickedVideo ? (
                                            <View className="items-center">
                                                <View className="bg-primary/20 p-3 rounded-full mb-3">
                                                    <Ionicons name="videocam" size={32} color="#C68976" />
                                                </View>
                                                <Text className="text-primary font-bold">Video Selected</Text>
                                                <Text className="text-textMuted text-sm mt-1">Tap to change</Text>
                                            </View>
                                        ) : (
                                            <View className="items-center">
                                                <View className="bg-surface p-3 rounded-full mb-3">
                                                    <Ionicons name="cloud-upload-outline" size={32} color="#71717a" />
                                                </View>
                                                <Text className="text-gray-400 font-medium">Tap to upload video</Text>
                                                <Text className="text-textMuted text-sm mt-1">Max 100MB</Text>
                                            </View>
                                        )}
                                    </Pressable>

                                    <View className="flex-row items-center my-4">
                                        <View className="flex-1 h-px bg-border" />
                                        <Text className="text-textMuted text-xs mx-4">OR</Text>
                                        <View className="flex-1 h-px bg-border" />
                                    </View>

                                    {/* URL Input */}
                                    <TextInput
                                        className="bg-surface text-white p-4 rounded-xl border border-border mb-6"
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
                                </Card>
                            </View>
                        ) : (
                             <View>
                                 <Card className="mb-6">
                                     <View className="flex-row items-center">
                                         <View className="bg-surface p-3 rounded-full mr-4">
                                             <Ionicons name="lock-closed-outline" size={24} color="#9ca3af" />
                                         </View>
                                         <View className="flex-1">
                                             <Text className="text-white font-medium">Application Locked</Text>
                                             <Text className="text-gray-400 text-sm mt-1">
                                                 Complete all requirements above to unlock
                                             </Text>
                                         </View>
                                     </View>
                                 </Card>

                                 {!userStatus && cert.price_cents > 0 && (
                                     <Button
                                        title={`Get Started for ${formattedPrice}`}
                                        onPress={handlePurchase}
                                        loading={initializingPayment}
                                        fullWidth
                                        size="lg"
                                     />
                                 )}
                             </View>
                        )}
                    </View>
                )}

                {/* Feedback Display */}
                {userStatus === 'rejected' && cert.user_status?.feedback && (
                    <Card className="mt-6 border border-red-500/30 bg-red-500/10">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="alert-circle" size={20} color="#ef4444" />
                            <Text className="text-red-400 font-bold ml-2">Review Feedback</Text>
                        </View>
                        <Text className="text-red-300 leading-6">{cert.user_status.feedback}</Text>
                    </Card>
                )}

            </View>
        </ScrollView>
        </SafeContainer>
    </>
  );
}
