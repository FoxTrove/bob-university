import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, Dimensions, Image, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MuxVideoPlayer } from '../../components/video';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useEntitlement } from '../../lib/hooks/useEntitlement';
import { AssessmentQuestion, QuestionType, QuestionOption } from './components/AssessmentQuestion';
import logger from '../../lib/utils/logger';

const { width } = Dimensions.get('window');

// Total steps: Welcome (1) + User Type (1) + Assessment (4) + Guide (3) = 9 (upsell is conditional)
const TOTAL_BASE_STEPS = 9;

// Steps definition
// 0: Welcome (Video)
// 1: User Type Selection
// 2: Assessment (stylists only)
// 3: Upsell (if not premium)
// 4-6: Guide Steps

// User Type options
type UserType = 'salon_owner' | 'individual_stylist' | 'client';

const USER_TYPE_OPTIONS = [
  {
    value: 'salon_owner' as UserType,
    label: 'Salon Owner',
    description: 'Looking to grow the skills of your team',
    icon: 'business-outline'
  },
  {
    value: 'individual_stylist' as UserType,
    label: 'Individual Stylist',
    description: 'Looking to grow your business',
    icon: 'cut-outline'
  },
  {
    value: 'client' as UserType,
    label: 'Client / Customer',
    description: 'Looking to find a stylist',
    icon: 'search-outline'
  },
];

// Assessment Configuration
interface QuestionConfig {
  id: string;
  question: string;
  type: QuestionType;
  options?: QuestionOption[];
}

const ASSESSMENT_QUESTIONS: QuestionConfig[] = [
  {
    id: 'role',
    question: "What describes you best?",
    type: 'single',
    options: [
      { value: 'stylist', label: 'Professional Stylist', icon: 'cut-outline' },
      { value: 'owner', label: 'Salon Owner', icon: 'business-outline' },
      { value: 'student', label: 'Student / Apprentice', icon: 'school-outline' },
      { value: 'educator', label: 'Educator', icon: 'book-outline' }
    ]
  },
  {
    id: 'experience',
    question: "How long have you been cutting?",
    type: 'single',
    options: [
      { value: '0-2', label: '0-2 Years', icon: 'time-outline' },
      { value: '3-5', label: '3-5 Years', icon: 'ribbon-outline' },
      { value: '5-10', label: '5-10 Years', icon: 'trophy-outline' },
      { value: '10+', label: '10+ Years', icon: 'star-outline' }
    ]
  },
  {
    id: 'goal',
    question: "What is your primary goal?",
    type: 'single', // Changed to single for simplicity as per request "primary goal"
    options: [
      { value: 'master_bob', label: 'Master the Bob', icon: 'shapes-outline' },
      { value: 'grow_revenue', label: 'Grow My Revenue', icon: 'trending-up-outline' },
      { value: 'train_staff', label: 'Train My Staff', icon: 'people-outline' },
      { value: 'inspiration', label: 'Daily Inspiration', icon: 'bulb-outline' }
    ]
  },
   {
    id: 'challenge',
    question: "Biggest challenge right now?",
    type: 'single',
    options: [
      { value: 'precision', label: 'Precision Cutting', icon: 'scan-outline' },
      { value: 'consultation', label: 'Client Consultations', icon: 'chatbubbles-outline' },
      { value: 'pricing', label: 'Pricing & Business', icon: 'cash-outline' },
      { value: 'styling', label: 'Styling & Finishing', icon: 'brush-outline' }
    ]
  }
];

const GUIDE_STEPS = [
  {
    title: "Learn at Your Pace",
    desc: "Watch high-quality tutorials on any device. Pause, rewind, and practice whenever you want.",
    icon: "phone-portrait-outline"
  },
  {
    title: "Track Your Progress",
    desc: "See exactly where you are in each module. Pick up right where you left off.",
    icon: "checkmark-circle-outline"
  },
  {
    title: "Join the Community",
    desc: "Connect with thousands of other stylists mastering their craft alongside you.",
    icon: "people-outline"
  }
];

export default function OnboardingWizard() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { isPremium } = useEntitlement();
  const [currentStep, setCurrentStep] = useState(0);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [assessmentIndex, setAssessmentIndex] = useState(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // MUX ID
  const WELCOME_VIDEO_MUX_PLAYBACK_ID = process.env.EXPO_PUBLIC_ONBOARDING_MUX_PLAYBACK_ID || null;
  const welcomeFallbackImage = require('../../assets/Bob Company app photos/img_1614.jpg');

  // Calculate overall progress (0-1)
  const calculateProgress = () => {
    if (currentStep === 0) return 0;
    if (currentStep === 1) return 1 / TOTAL_BASE_STEPS; // User type selection
    if (currentStep === 2) {
      // Assessment step - progress based on questions answered
      return (2 + assessmentIndex) / TOTAL_BASE_STEPS;
    }
    if (currentStep === 3) {
      // Upsell - halfway through
      return 6 / TOTAL_BASE_STEPS;
    }
    // Guide steps (4, 5, 6 -> indices 0, 1, 2)
    const guideIndex = currentStep - 4;
    return (6 + guideIndex + 1) / TOTAL_BASE_STEPS;
  };

  // Animate progress bar
  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: calculateProgress(),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, assessmentIndex]);

  // Skip onboarding entirely
  const handleSkip = async () => {
    if (loading) return;
    await finishOnboarding();
  };

  // --- LOGIC ---

  const saveAssessmentProgress = async (newAnswers: Record<string, any>) => {
    if (!user?.id) return;
    try {
        await supabase
            .from('profiles')
            .update({ skills_assessment: newAnswers })
            .eq('id', user.id);
    } catch (e) {
        logger.warn("Failed to save partial assessment", e);
    }
  };

  const handleNext = async () => {
    if (loading) return;

    if (currentStep === 0) {
      // Welcome -> User Type Selection
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // User Type Selection -> Assessment or Finish (for clients)
      if (!userType) return;

      // Save user type to database
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ user_type: userType })
          .eq('id', user.id);
      }

      if (userType === 'client') {
        // Clients skip assessment and go directly to finish -> directory
        await finishOnboarding(true); // Pass flag to route to directory
      } else {
        // Stylists and salon owners continue to assessment
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      // Assessment Logic
      if (assessmentIndex < ASSESSMENT_QUESTIONS.length - 1) {
          setAssessmentIndex(i => i + 1);
      } else {
          // Assessment Done -> Upsell or Guide
          // Save final assessment state
          await saveAssessmentProgress(assessmentAnswers);

          if (isPremium) {
            setCurrentStep(4); // Skip Upsell
          } else {
            setCurrentStep(3); // Go to Upsell
          }
      }
    } else if (currentStep === 3) {
      // Upsell -> Guide
      setCurrentStep(4);
    } else if (currentStep >= 4 && currentStep < 4 + GUIDE_STEPS.length - 1) {
      // Advance Guide
      setCurrentStep(c => c + 1);
    } else {
      // Finish
      await finishOnboarding();
    }
  };
  
  const handleAssessmentAnswer = (val: string | string[]) => {
      const currentQ = ASSESSMENT_QUESTIONS[assessmentIndex];
      logger.debug('Onboarding', 'Answer received:', currentQ.id, val);
      const newAnswers = { ...assessmentAnswers, [currentQ.id]: val };
      setAssessmentAnswers(newAnswers);
      logger.debug('Onboarding', 'New answers state:', newAnswers);

      // Auto-advance for single choice questions after a brief delay
      if (currentQ.type === 'single' && val) {
        setTimeout(() => {
          if (assessmentIndex < ASSESSMENT_QUESTIONS.length - 1) {
            setAssessmentIndex(i => i + 1);
          } else {
            // Last question - save and move to next step
            saveAssessmentProgress(newAnswers);
            if (isPremium) {
              setCurrentStep(4); // Skip Upsell, go to Guide
            } else {
              setCurrentStep(3); // Go to Upsell
            }
          }
        }, 300);
      }
  };

  const handleSubscribe = () => {
    router.push('/subscribe');
  };

  const finishOnboarding = async (isClient: boolean = false) => {
    if (!user?.id) return;
    setLoading(true);
    try {
        // 1. Update DB - prioritize has_completed_onboarding, assessment is optional
        const updateData: any = {
            has_completed_onboarding: true,
        };

        if (userType) {
            updateData.user_type = userType;
        }

        if (Object.keys(assessmentAnswers).length > 0) {
            updateData.skills_assessment = assessmentAnswers;
        }

        const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id);

        if (error) {
            console.error('Error saving onboarding:', error);
            // Try to at least mark onboarding as complete
            await supabase
                .from('profiles')
                .update({ has_completed_onboarding: true })
                .eq('id', user.id);
        }

        // 2. Refresh Local State (CRITICAL to fix loop)
        await refreshProfile();

        // 3. Route based on user type
        if (isClient || userType === 'client') {
            // Clients go directly to the directory
            router.replace('/(tabs)/directory');
        } else if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tabs)');
        }
    } catch (e) {
        console.error('Onboarding error:', e);
        // Force close even on error to unblock user
        try {
            await supabase
                .from('profiles')
                .update({ has_completed_onboarding: true })
                .eq('id', user.id);
            await refreshProfile();
        } catch (retryError) {
            console.error('Retry failed:', retryError);
        }
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)');
    } finally {
        setLoading(false);
    }
  };

  // --- RENDERERS ---

  const renderWelcome = () => (
    <View className="items-center">
        <Text className="text-2xl font-bold text-white mb-2 text-center font-serifBold">
            Welcome to Bob University!
        </Text>
        <Text className="text-gray-400 text-center mb-6 font-sans">
            A personal message from Ray.
        </Text>
        <View className="w-full aspect-video bg-black rounded-xl overflow-hidden mb-6 shadow-sm shadow-black/20">
            {WELCOME_VIDEO_MUX_PLAYBACK_ID ? (
                <MuxVideoPlayer
                    playbackId={WELCOME_VIDEO_MUX_PLAYBACK_ID}
                    title="Welcome"
                    autoPlay={false}
                    canSeekFuture={true}
                />
            ) : (
                <View className="w-full h-full items-center justify-center bg-black">
                    <Image
                        source={welcomeFallbackImage}
                        className="w-full h-full opacity-80"
                        resizeMode="cover"
                    />
                    <View className="absolute inset-0 bg-black/40" />
                    <Text className="absolute text-white text-base font-semibold">
                        Welcome video coming soon
                    </Text>
                </View>
            )}
        </View>
        <Text className="text-gray-200 text-center text-base px-2 font-sans">
            We're excited to help you master the art of the Bob and grow your salon business.
        </Text>
    </View>
  );

  const renderUserTypeSelection = () => (
    <View className="items-center">
        <Text className="text-2xl font-bold text-white mb-2 text-center font-serifBold">
            How can we help you?
        </Text>
        <Text className="text-gray-400 text-center mb-6 font-sans">
            Select the option that best describes you.
        </Text>

        <View className="w-full space-y-3">
            {USER_TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                        setUserType(option.value);
                        // Auto-advance after a brief delay
                        setTimeout(() => {
                            if (option.value === 'client') {
                                // Clients finish immediately
                                finishOnboarding(true);
                            } else {
                                setCurrentStep(2);
                            }
                        }, 300);
                    }}
                    className={`flex-row items-center p-4 rounded-xl border ${
                        userType === option.value
                            ? 'bg-primary/20 border-primary'
                            : 'bg-white/5 border-white/10'
                    }`}
                >
                    <View className={`p-3 rounded-full mr-4 ${
                        userType === option.value ? 'bg-primary/30' : 'bg-white/10'
                    }`}>
                        <Ionicons
                            name={option.icon as any}
                            size={24}
                            color={userType === option.value ? '#C68976' : '#9CA3AF'}
                        />
                    </View>
                    <View className="flex-1">
                        <Text className={`font-bold text-base ${
                            userType === option.value ? 'text-white' : 'text-gray-200'
                        } font-serifBold`}>
                            {option.label}
                        </Text>
                        <Text className="text-gray-400 text-sm font-sans">
                            {option.description}
                        </Text>
                    </View>
                    {userType === option.value && (
                        <Ionicons name="checkmark-circle" size={24} color="#C68976" />
                    )}
                </TouchableOpacity>
            ))}
        </View>
    </View>
  );

  const renderAssessment = () => {
      const q = ASSESSMENT_QUESTIONS[assessmentIndex];
      const answer = assessmentAnswers[q.id];
      
      return (
          <AssessmentQuestion 
            question={q.question}
            type={q.type}
            options={q.options}
            value={answer}
            onChange={handleAssessmentAnswer}
            onNext={handleNext}
          />
      );
  };

  const renderUpsell = () => (
    <View className="items-center">
         <View className="bg-primary/20 p-4 rounded-full mb-4">
            <Ionicons name="star" size={40} color="#C68976" />
         </View>
         <Text className="text-2xl font-bold text-white text-center mb-2 font-serifBold">
            Go Pro
        </Text>
        <Text className="text-gray-400 text-center text-base mb-6 font-sans">
            Unlock the full potential of your career.
        </Text>
        
        <View className="w-full space-y-4 mb-6">
            {[
                { icon: 'videocam', title: '150+ Exclusive Videos', desc: 'Master the Bob with our full library.' },
                { icon: 'school', title: 'Get Certified', desc: 'Earn your official Bob University certification.' },
                { icon: 'cut', title: 'Stylist Directory', desc: 'Get listed and found by new clients.' },
            ].map((b, i) => (
                <View key={i} className="flex-row items-center bg-white/5 p-3 rounded-lg border border-white/10">
                    <View className="bg-primary/20 p-2 rounded-full mr-3">
                        <Ionicons name={b.icon as any} size={20} color="#C68976" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-white font-bold text-sm font-serifBold">{b.title}</Text>
                         <Text className="text-gray-400 text-xs font-sans">{b.desc}</Text>
                    </View>
                </View>
            ))}
        </View>
        
        <Button
            className="w-full mb-3"
            onPress={handleSubscribe}
            size="lg"
            variant="primary"
        >
          <Text className="text-white font-bold">Unlock Full Access</Text>
        </Button>
        <TouchableOpacity onPress={() => setCurrentStep(4)} className="py-2">
            <Text className="text-gray-400 text-sm font-bold">Maybe Later</Text>
        </TouchableOpacity>
    </View>
  );

  const renderGuide = (stepIndex: number) => {
      const item = GUIDE_STEPS[stepIndex];
      return (
        <View className="items-center py-6">
             <View className="bg-white/5 p-6 rounded-full mb-6 border border-white/10">
                <Ionicons name={item.icon as any} size={56} color="#C68976" />
             </View>

             <Text className="text-2xl font-bold text-white text-center mb-4 min-h-[40px] font-serifBold">
                {item.title}
             </Text>
             <Text className="text-gray-300 text-center text-base px-2 min-h-[60px] font-sans">
                {item.desc}
             </Text>
             
             {/* Dots */}
             <View className="flex-row justify-center space-x-2 mt-8">
                {GUIDE_STEPS.map((_, i) => (
                    <View 
                        key={i} 
                        className={`h-2 rounded-full ${i === stepIndex ? 'w-6 bg-primary' : 'w-2 bg-white/20'}`}
                    />
                ))}
            </View>
        </View>
      );
  };

  // Main Render Logic
  let content;
  let showNext = true;
  let nextLabel = "Next";

  if (currentStep === 0) {
      content = renderWelcome();
      nextLabel = "Get Started";
  } else if (currentStep === 1) {
      content = renderUserTypeSelection();
      showNext = false; // User type auto-advances on selection
  } else if (currentStep === 2) {
      content = renderAssessment();
      // Logic to disable Next if no answer selected?
      const currentQ = ASSESSMENT_QUESTIONS[assessmentIndex];
      const hasAnswer = assessmentAnswers[currentQ.id];
      if (!hasAnswer && currentQ.type !== 'text') { // Allow empty text? Probably not.
          // For now, let's strictly require an answer
          // Actually, let's keep it simple, if no answer, disable button logic in handleNext?
          // Or just disable button visually
      }
      // Check if button disabled
     if (!hasAnswer || (Array.isArray(hasAnswer) && hasAnswer.length === 0)) {
         // showNext = false; // Or show disabled button? Button component handles disabled
     }

  } else if (currentStep === 3) {
      content = renderUpsell();
      showNext = false;
  } else {
      // Guide steps map to 4, 5, 6
      const guideIndex = currentStep - 4;
      content = renderGuide(guideIndex);
      if (guideIndex === GUIDE_STEPS.length - 1) {
          nextLabel = loading ? "Finishing..." : "Start Learning";
      }
  }

  // Helper for disabled state
  const isNextDisabled = () => {
      if (loading) {
        logger.debug('Onboarding', 'Next disabled: loading');
        return true;
      }
      if (currentStep === 1) {
          // User type selection - disabled if no type selected
          if (!userType) {
            return true;
          }
      }
      if (currentStep === 2) {
          const currentQ = ASSESSMENT_QUESTIONS[assessmentIndex];
          const hasAnswer = assessmentAnswers[currentQ.id];
          logger.debug('Onboarding', 'Checking answer for', currentQ.id, ':', hasAnswer, 'assessmentAnswers:', assessmentAnswers);
          if (!hasAnswer || (Array.isArray(hasAnswer) && hasAnswer.length === 0)) {
            logger.debug('Onboarding', 'Next disabled: no answer');
            return true;
          }
      }
      logger.debug('Onboarding', 'Next enabled');
      return false;
  };

  return (
    <View className="flex-1 justify-center items-center px-4 bg-black/80">
        {/* Card Container */}
        <View className="bg-neutral-900 w-full rounded-3xl shadow-2xl shadow-black/50 border border-white/10 overflow-hidden relative">
            {/* Progress Bar */}
            {currentStep > 0 && (
              <View className="h-1 bg-white/10">
                <Animated.View
                  className="h-full bg-primary"
                  style={{
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }}
                />
              </View>
            )}

            {/* Skip Button - larger touch area for better mobile UX */}
            {currentStep > 0 && currentStep !== 1 && currentStep !== 3 && (
              <Pressable
                onPress={handleSkip}
                disabled={loading}
                style={({ pressed }) => ({
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 100,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  opacity: pressed ? 0.6 : 1,
                })}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Text className="text-gray-300 text-sm font-semibold">Skip</Text>
              </Pressable>
            )}

            <View className="p-6">
              {content}

              {showNext && (
                  <View className="mt-8">
                      <Button
                          size="lg"
                          fullWidth
                          onPress={handleNext}
                          disabled={isNextDisabled()}
                          variant={isNextDisabled() ? "outline" : "primary"}
                      >
                        <Text className={isNextDisabled() ? "text-gray-500" : "text-white font-bold"}>
                            {nextLabel}
                        </Text>
                      </Button>
                  </View>
              )}
            </View>
        </View>
    </View>
  );
}
