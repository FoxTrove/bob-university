import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MuxVideoPlayer } from '../../components/video';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { useEntitlement } from '../../lib/hooks/useEntitlement';
import { AssessmentQuestion, QuestionType, QuestionOption } from './components/AssessmentQuestion';

const { width } = Dimensions.get('window');

// Steps definition
// 0: Welcome (Video)
// 1: Assessment
// 2: Upsell (if not premium)
// 3-5: Guide Steps

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
  const [assessmentIndex, setAssessmentIndex] = useState(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  // MUX ID
  const WELCOME_VIDEO_MUX_PLAYBACK_ID = "PLACEHOLDER_ID"; 

  // --- LOGIC ---

  const saveAssessmentProgress = async (newAnswers: Record<string, any>) => {
    if (!user?.id) return;
    try {
        await supabase
            .from('profiles')
            .update({ skills_assessment: newAnswers })
            .eq('id', user.id);
    } catch (e) {
        console.warn("Failed to save partial assessment", e);
    }
  };

  const handleNext = async () => {
    if (loading) return;

    if (currentStep === 0) {
      // Welcome -> Assessment
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // Assessment Logic
      if (assessmentIndex < ASSESSMENT_QUESTIONS.length - 1) {
          setAssessmentIndex(i => i + 1);
      } else {
          // Assessment Done -> Upsell or Guide
          // Save final assessment state
          await saveAssessmentProgress(assessmentAnswers);
          
          if (isPremium) {
            setCurrentStep(3); // Skip Upsell
          } else {
            setCurrentStep(2); // Go to Upsell
          }
      }
    } else if (currentStep === 2) {
      // Upsell -> Guide
      setCurrentStep(3);
    } else if (currentStep >= 3 && currentStep < 3 + GUIDE_STEPS.length - 1) {
      // Advance Guide
      setCurrentStep(c => c + 1);
    } else {
      // Finish
      await finishOnboarding();
    }
  };
  
  const handleAssessmentAnswer = (val: string | string[]) => {
      const currentQ = ASSESSMENT_QUESTIONS[assessmentIndex];
      const newAnswers = { ...assessmentAnswers, [currentQ.id]: val };
      setAssessmentAnswers(newAnswers);
      // Optional: Auto-advance for single choice? 
      // User might want to change answer, so explicit Next button is improved UX validation
  };

  const handleSubscribe = () => {
    router.push('/subscribe');
  };

  const finishOnboarding = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
        // 1. Update DB
        const { error } = await supabase
            .from('profiles')
            .update({ 
                has_completed_onboarding: true,
                skills_assessment: assessmentAnswers // Verify save again
            })
            .eq('id', user.id);

        if (error) { 
            console.error('Error finish onboarding:', error);
        }
        
        // 2. Refresh Local State (CRITICAL to fix loop)
        await refreshProfile();
        
        // 3. Close Modal
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tabs)');
        }
    } catch (e) {
        console.error(e);
        // Force close even on error to unblock user
        if (router.canGoBack()) router.back();
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
            <MuxVideoPlayer
                playbackId={WELCOME_VIDEO_MUX_PLAYBACK_ID}
                title="Welcome"
                autoPlay={false}
                canSeekFuture={true}
            />
        </View>
        <Text className="text-gray-200 text-center text-base px-2 font-sans">
            We're excited to help you master the art of the Bob and grow your salon business.
        </Text>
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
        <TouchableOpacity onPress={() => setCurrentStep(3)} className="py-2">
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

  } else if (currentStep === 2) {
      content = renderUpsell();
      showNext = false; 
  } else {
      // Guide steps map to 3, 4, 5
      const guideIndex = currentStep - 3;
      content = renderGuide(guideIndex);
      if (guideIndex === GUIDE_STEPS.length - 1) {
          nextLabel = loading ? "Finishing..." : "Start Learning";
      }
  }

  // Helper for disabled state
  const isNextDisabled = () => {
      if (loading) return true;
      if (currentStep === 1) {
          const currentQ = ASSESSMENT_QUESTIONS[assessmentIndex];
          const hasAnswer = assessmentAnswers[currentQ.id];
          if (!hasAnswer || (Array.isArray(hasAnswer) && hasAnswer.length === 0)) return true;
      }
      return false;
  };

  return (
    <View className="flex-1 justify-center items-center px-4 bg-black/80">
        {/* Card Container */}
        <View className="bg-neutral-900 w-full rounded-3xl p-6 shadow-2xl shadow-black/50 border border-white/10">
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
  );
}
