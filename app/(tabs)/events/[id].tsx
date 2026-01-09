
import { View, Text, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeContainer } from '../../../components/layout/SafeContainer';
import { Button } from '../../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Database } from '../../../lib/database.types';
import { useStripe } from '@stripe/stripe-react-native';
import { useAuth } from '../../../lib/auth';

type Event = Database['public']['Tables']['events']['Row'] & {
  thumbnail_url: string | null;
  poster_url?: string | null;
  promo_video_url?: string | null;
  location_name: string | null;
  address: string | null;
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { user } = useAuth();

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      if (!id) return;
      const eventId = Array.isArray(id) ? id[0] : id;

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data as Event); // Cast to Event type
    } catch (error) {
      console.error('Error fetching event details:', error);
      Alert.alert('Error', 'Could not load event details');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!event) return;
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to book an event ticket.');
      router.push('/(auth)/sign-in');
      return;
    }
    setPurchasing(true);

    try {
      const amountCents = event.price_cents || 0;

      if (amountCents === 0) {
        await supabase.from('event_registrations').insert({
          event_id: event.id,
          user_id: user.id,
          status: 'confirmed',
          ticket_type: 'general',
          amount_paid_cents: 0,
          registered_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
        });
        Alert.alert('Success', 'Your ticket is confirmed!');
        return;
      }

      // 1. Fetch PaymentIntent from our Edge Function
      const { data, error } = await supabase.functions.invoke('payment-sheet', {
        body: {
            amountCents,
            description: `Ticket for ${event.title}`,
            eventId: event.id,
        },
      });

      if (error || !data) {
        throw new Error(error?.message || 'Failed to initialize payment');
      }

      const { paymentIntent, ephemeralKey, customer } = data;
      const paymentIntentId = typeof paymentIntent === 'string'
        ? paymentIntent.split('_secret_')[0]
        : null;

      // 2. Initialize the Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Bob University',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        defaultBillingDetails: {
          name: 'Bob University Student',
        },
        returnURL: 'bob-university://stripe-redirect',
      });

      if (initError) {
         throw new Error(initError.message);
      }

      // 3. Present the Payment Sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        Alert.alert(`Error code: ${paymentError.code}`, paymentError.message);
      } else {
        const { error: registrationError } = await supabase
          .from('event_registrations')
          .insert({
            event_id: event.id,
            user_id: user.id,
            status: 'confirmed',
            ticket_type: 'general',
            amount_paid_cents: amountCents,
            payment_id: paymentIntentId,
            registered_at: new Date().toISOString(),
            confirmed_at: new Date().toISOString(),
          });

        if (registrationError) {
          console.error('Registration insert failed:', registrationError);
          Alert.alert('Payment confirmed', 'We received your payment. Ticket confirmation is still processing.');
          return;
        }
        Alert.alert('Success', 'Your ticket is confirmed!');
      }

    } catch (error: any) {
      console.error('Purchase error:', error);
      Alert.alert('Payment Failed', error.message);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <SafeContainer>
        <View className="flex-1 items-center justify-center">
          <Text className="text-secondary">Loading...</Text>
        </View>
      </SafeContainer>
    );
  }

  if (!event) {
    return (
      <SafeContainer>
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-text text-xl font-bold mb-2">Event not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeContainer>
    );
  }

  const date = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const time = new Date(event.event_date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <SafeContainer edges={['top']}>
      <ScrollView className="flex-1 bg-background">
        <View className="relative h-64 w-full">
           <Image 
            source={{ uri: event.poster_url || event.thumbnail_url || 'https://via.placeholder.com/400x200' }} 
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute top-4 left-4 z-10">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white/90 p-2 rounded-full"
            >
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
          </View>
          <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
             <Text className="text-white text-2xl font-bold">{event.title}</Text>
          </View>
        </View>

        <View className="p-4 space-y-6">
          {/* Promo Video Section */}
          {event.promo_video_url && (
            <View>
              <Text className="text-lg font-semibold text-primary mb-2">Event Preview</Text>
              <View className="w-full h-48 bg-black rounded-lg overflow-hidden items-center justify-center">
                 {/* Placeholder for Video Player - implementing strict Video component later if needed, for now just Image or simple view */}
                 <Text className="text-white text-center">Video Player Placeholder</Text>
                 <Text className="text-gray-400 text-xs text-center px-4 mt-2">{event.promo_video_url}</Text>
              </View>
            </View>
          )}

          {/* Details */}
            
             <View className="flex-row items-center">
              <Ionicons name="calendar" size={20} color="#3b82f6" className="mr-3" />
              <Text className="text-text text-lg">{date}</Text>
            </View>
             <View className="flex-row items-center">
              <Ionicons name="time" size={20} color="#3b82f6" className="mr-3" />
              <Text className="text-text text-lg">{time}</Text>
            </View>
             <View className="flex-row items-center">
               <Ionicons name="location" size={20} color="#3b82f6" className="mr-3" />
               <View className="flex-1">
                 <Text className="text-text text-lg">{event.location_name}</Text>
                 <Text className="text-textMuted">{event.address}</Text>
               </View>
             </View>
        
        {/* Description */}
        <View>
            <Text className="text-xl font-bold text-primary mb-2">About this Event</Text>
            <Text className="text-textMuted leading-6">{event.description}</Text>
        </View>

        {/* Action Button */}
        <View className="pt-4 pb-8">
            <Button 
                title={`Book Ticket - $${((event.price_cents || 0) / 100).toFixed(2)}`} 
                onPress={handlePurchase}
                loading={purchasing}
                size="lg"
                fullWidth
            />
             <Text className="text-xs text-textMuted text-center mt-2">
                Secure payment via Stripe
            </Text>
        </View>
        </View>
      </ScrollView>
    </SafeContainer>
  );
}
