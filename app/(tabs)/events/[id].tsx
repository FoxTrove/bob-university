import { View, Text, ScrollView, Image, Alert, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeContainer } from '../../../components/layout/SafeContainer';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Tables } from '../../../lib/database.types';
import { useStripe } from '@stripe/stripe-react-native';
import { useAuth } from '../../../lib/auth';
import { useProfile } from '../../../lib/hooks/useProfile';

type Event = Tables<'events'>;
type PrivateEventInvitation = Tables<'private_event_invitations'>;

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_certified: boolean | null;
}

interface InvitationWithProfile extends PrivateEventInvitation {
  invited_user?: TeamMember | null;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationCount, setRegistrationCount] = useState(0);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { user } = useAuth();
  const { userType, profile } = useProfile();

  // Private event invitation state
  const [invitations, setInvitations] = useState<InvitationWithProfile[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMode, setInviteMode] = useState<'team' | 'external'>('team');
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [externalEmail, setExternalEmail] = useState('');
  const [externalName, setExternalName] = useState('');
  const [sendingInvites, setSendingInvites] = useState(false);

  const isSalonOwner = userType === 'salon_owner';
  const isPrivateEvent = event?.is_private === true;
  const isEventOwner = isPrivateEvent && event?.salon_id === profile?.salon_id && isSalonOwner;

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  useEffect(() => {
    if (isEventOwner && event) {
      fetchInvitations();
      fetchTeamMembers();
    }
  }, [isEventOwner, event?.id]);

  const fetchEventDetails = async () => {
    try {
      if (!id) return;
      const eventId = Array.isArray(id) ? id[0] : id;

      // Fetch event details
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);

      // Fetch registration count
      const { count } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .in('status', ['confirmed', 'pending']);

      setRegistrationCount(count || 0);

      // Check if user is already registered
      if (user) {
        const { data: registration } = await supabase
          .from('event_registrations')
          .select('id')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .in('status', ['confirmed', 'pending'])
          .maybeSingle();

        setIsRegistered(!!registration);
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      Alert.alert('Error', 'Could not load event details');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = useCallback(async () => {
    if (!event?.id) return;

    try {
      const { data, error } = await supabase
        .from('private_event_invitations')
        .select(`
          *,
          invited_user:profiles!private_event_invitations_invited_user_id_fkey(
            id, email, full_name, avatar_url, is_certified
          )
        `)
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations((data as InvitationWithProfile[]) || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  }, [event?.id]);

  const fetchTeamMembers = useCallback(async () => {
    if (!profile?.salon_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, is_certified')
        .eq('salon_id', profile.salon_id);

      if (error) throw error;
      setTeamMembers((data as TeamMember[]) || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  }, [profile?.salon_id]);

  const handleSendTeamInvites = async () => {
    if (selectedTeamMembers.length === 0) {
      Alert.alert('No Selection', 'Please select at least one team member to invite.');
      return;
    }

    if (!event || !profile?.salon_id || !user) return;

    setSendingInvites(true);

    try {
      // Filter out already invited team members
      const alreadyInvited = invitations
        .filter(inv => inv.invited_user_id)
        .map(inv => inv.invited_user_id);

      const newInvites = selectedTeamMembers.filter(id => !alreadyInvited.includes(id));

      if (newInvites.length === 0) {
        Alert.alert('Already Invited', 'All selected team members have already been invited.');
        setSendingInvites(false);
        return;
      }

      const invitationsToInsert = newInvites.map(userId => ({
        event_id: event.id,
        salon_id: profile.salon_id!,
        invited_user_id: userId,
        invited_by_user_id: user.id,
        status: 'pending',
      }));

      const { error } = await supabase
        .from('private_event_invitations')
        .insert(invitationsToInsert);

      if (error) throw error;

      Alert.alert('Success', `${newInvites.length} invitation(s) sent!`);
      setSelectedTeamMembers([]);
      setShowInviteModal(false);
      fetchInvitations();
    } catch (error) {
      console.error('Error sending invites:', error);
      Alert.alert('Error', 'Failed to send invitations. Please try again.');
    } finally {
      setSendingInvites(false);
    }
  };

  const handleSendExternalInvite = async () => {
    const email = externalEmail.trim().toLowerCase();

    if (!email) {
      Alert.alert('Required', 'Please enter an email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!event || !profile?.salon_id || !user) return;

    // Check if already invited
    const alreadyInvited = invitations.some(inv => inv.invited_email?.toLowerCase() === email);
    if (alreadyInvited) {
      Alert.alert('Already Invited', 'This email has already been invited.');
      return;
    }

    setSendingInvites(true);

    try {
      const { error } = await supabase
        .from('private_event_invitations')
        .insert({
          event_id: event.id,
          salon_id: profile.salon_id,
          invited_email: email,
          invited_name: externalName.trim() || null,
          invited_by_user_id: user.id,
          status: 'pending',
        });

      if (error) throw error;

      Alert.alert('Success', 'Invitation sent!');
      setExternalEmail('');
      setExternalName('');
      setShowInviteModal(false);
      fetchInvitations();
    } catch (error) {
      console.error('Error sending external invite:', error);
      Alert.alert('Error', 'Failed to send invitation. Please try again.');
    } finally {
      setSendingInvites(false);
    }
  };

  const toggleTeamMemberSelection = (memberId: string) => {
    setSelectedTeamMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return { color: '#22c55e', bgColor: 'bg-green-500/20', label: 'Accepted' };
      case 'declined':
        return { color: '#ef4444', bgColor: 'bg-red-500/20', label: 'Declined' };
      case 'expired':
        return { color: '#6b7280', bgColor: 'bg-gray-500/20', label: 'Expired' };
      default:
        return { color: '#f59e0b', bgColor: 'bg-amber-500/20', label: 'Pending' };
    }
  };

  // Calculate the applicable price (early bird or regular)
  const getApplicablePrice = (): number => {
    if (!event) return 0;

    // Check if early bird pricing is active
    if (event.early_bird_price_cents && event.early_bird_deadline) {
      const deadline = new Date(event.early_bird_deadline);
      if (new Date() < deadline) {
        return event.early_bird_price_cents;
      }
    }

    return event.price_cents || 0;
  };

  const isEarlyBird = (): boolean => {
    if (!event?.early_bird_price_cents || !event?.early_bird_deadline) return false;
    return new Date() < new Date(event.early_bird_deadline);
  };

  const isSoldOut = (): boolean => {
    if (!event?.max_capacity) return false;
    return registrationCount >= event.max_capacity;
  };

  const handlePurchase = async () => {
    if (!event) return;
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to book an event ticket.');
      router.push('/(auth)/sign-in');
      return;
    }

    // Check if already registered
    if (isRegistered) {
      Alert.alert('Already Registered', 'You are already registered for this event.');
      return;
    }

    // Check if sold out
    if (isSoldOut()) {
      Alert.alert('Sold Out', 'This event is at full capacity.');
      return;
    }

    setPurchasing(true);

    try {
      const amountCents = getApplicablePrice();
      const ticketType = isEarlyBird() ? 'early_bird' : 'general';

      if (amountCents === 0) {
        const { error: regError } = await supabase.from('event_registrations').insert({
          event_id: event.id,
          user_id: user.id,
          status: 'confirmed',
          ticket_type: ticketType,
          amount_paid_cents: 0,
          registered_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
        });

        if (regError) throw regError;

        setIsRegistered(true);
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
            ticket_type: ticketType,
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

        setIsRegistered(true);
        Alert.alert('Success', 'Your ticket is confirmed!');
      }

    } catch (error) {
      console.error('Purchase error:', error);
      const message = error instanceof Error ? error.message : 'Payment failed';
      Alert.alert('Payment Failed', message);
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
                 <Text className="text-text text-lg">{event.venue_name || event.location}</Text>
                 {event.venue_address && (
                   <Text className="text-textMuted">{event.venue_address}</Text>
                 )}
               </View>
             </View>

          {/* Capacity indicator */}
          {event.max_capacity && (
            <View className="flex-row items-center">
              <Ionicons name="people" size={20} color="#3b82f6" className="mr-3" />
              <Text className="text-text">
                {registrationCount} / {event.max_capacity} spots filled
              </Text>
            </View>
          )}

        {/* Description */}
        <View>
            <Text className="text-xl font-bold text-primary mb-2">About this Event</Text>
            <Text className="text-textMuted leading-6">{event.description}</Text>
        </View>

        {/* Private Event Badge */}
        {isPrivateEvent && (
          <View className="flex-row items-center bg-purple-500/20 p-3 rounded-lg">
            <Ionicons name="lock-closed" size={18} color="#8b5cf6" />
            <Text className="text-purple-500 font-medium ml-2">Private Event</Text>
          </View>
        )}

        {/* Invitations Section - Only for salon owner of this private event */}
        {isEventOwner && (
          <Card className="p-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Ionicons name="people" size={20} color="#8b5cf6" />
                <Text className="text-lg font-bold text-text ml-2">Invitations</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowInviteModal(true)}
                className="bg-primary rounded-lg px-3 py-2 flex-row items-center"
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text className="text-white font-medium ml-1 text-sm">Invite</Text>
              </TouchableOpacity>
            </View>

            {invitations.length === 0 ? (
              <Text className="text-textMuted text-center py-4">
                No invitations sent yet. Tap "Invite" to invite team members or guests.
              </Text>
            ) : (
              <View className="space-y-2">
                {invitations.map((invitation) => {
                  const statusBadge = getStatusBadge(invitation.status);
                  const displayName = invitation.invited_user
                    ? invitation.invited_user.full_name || invitation.invited_user.email
                    : invitation.invited_name || invitation.invited_email || 'Guest';
                  const isTeamMember = !!invitation.invited_user_id;

                  return (
                    <View
                      key={invitation.id}
                      className="flex-row items-center p-3 bg-surfaceHighlight rounded-lg mb-2"
                    >
                      {isTeamMember && invitation.invited_user ? (
                        <Avatar
                          name={displayName}
                          source={invitation.invited_user.avatar_url}
                          size="sm"
                          isCertified={invitation.invited_user.is_certified ?? undefined}
                          className="mr-3"
                        />
                      ) : (
                        <View className="w-8 h-8 rounded-full bg-gray-600 items-center justify-center mr-3">
                          <Ionicons name="mail-outline" size={16} color="#9ca3af" />
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="text-text font-medium">{displayName}</Text>
                        <Text className="text-textMuted text-xs">
                          {isTeamMember ? 'Team Member' : 'External Guest'}
                        </Text>
                      </View>
                      <View className={`px-2 py-1 rounded-full ${statusBadge.bgColor}`}>
                        <Text style={{ color: statusBadge.color }} className="text-xs font-medium">
                          {statusBadge.label}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Summary */}
            {invitations.length > 0 && (
              <View className="mt-4 pt-4 border-t border-border">
                <View className="flex-row justify-around">
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-text">{invitations.length}</Text>
                    <Text className="text-textMuted text-xs">Total</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-green-500">
                      {invitations.filter(i => i.status === 'accepted').length}
                    </Text>
                    <Text className="text-textMuted text-xs">Accepted</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-amber-500">
                      {invitations.filter(i => i.status === 'pending').length}
                    </Text>
                    <Text className="text-textMuted text-xs">Pending</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-red-500">
                      {invitations.filter(i => i.status === 'declined').length}
                    </Text>
                    <Text className="text-textMuted text-xs">Declined</Text>
                  </View>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Action Button */}
        <View className="pt-4 pb-8">
            {isRegistered ? (
              <View className="bg-green-500/20 p-4 rounded-xl items-center">
                <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
                <Text className="text-green-500 font-bold mt-2">You're registered!</Text>
              </View>
            ) : isSoldOut() ? (
              <View className="bg-red-500/20 p-4 rounded-xl items-center">
                <Ionicons name="close-circle" size={32} color="#ef4444" />
                <Text className="text-red-500 font-bold mt-2">Sold Out</Text>
              </View>
            ) : (
              <>
                <Button
                  title={
                    getApplicablePrice() === 0
                      ? 'Register - Free'
                      : `Book Ticket - $${(getApplicablePrice() / 100).toFixed(2)}`
                  }
                  onPress={handlePurchase}
                  loading={purchasing}
                  size="lg"
                  fullWidth
                />
                {isEarlyBird() && (
                  <Text className="text-xs text-green-500 text-center mt-2">
                    Early bird pricing! Regular price: ${((event.price_cents || 0) / 100).toFixed(2)}
                  </Text>
                )}
                {getApplicablePrice() > 0 && (
                  <Text className="text-xs text-textMuted text-center mt-2">
                    Secure payment via Stripe
                  </Text>
                )}
              </>
            )}
        </View>
        </View>
      </ScrollView>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <SafeContainer edges={['top']}>
          <View className="flex-1 bg-background">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <Text className="text-primary text-base">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-bold text-text">Invite Attendees</Text>
              <View className="w-12" />
            </View>

            {/* Tab Selector */}
            <View className="flex-row p-4 gap-2">
              <TouchableOpacity
                onPress={() => setInviteMode('team')}
                className={`flex-1 py-3 rounded-lg items-center ${
                  inviteMode === 'team' ? 'bg-primary' : 'bg-surfaceHighlight'
                }`}
              >
                <Text className={inviteMode === 'team' ? 'text-white font-medium' : 'text-textMuted'}>
                  Team Members
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setInviteMode('external')}
                className={`flex-1 py-3 rounded-lg items-center ${
                  inviteMode === 'external' ? 'bg-primary' : 'bg-surfaceHighlight'
                }`}
              >
                <Text className={inviteMode === 'external' ? 'text-white font-medium' : 'text-textMuted'}>
                  External Guest
                </Text>
              </TouchableOpacity>
            </View>

            {inviteMode === 'team' ? (
              /* Team Members Tab */
              <ScrollView className="flex-1 px-4">
                {teamMembers.length === 0 ? (
                  <View className="items-center py-8">
                    <Ionicons name="people-outline" size={48} color="#6b7280" />
                    <Text className="text-textMuted mt-2">No team members found</Text>
                  </View>
                ) : (
                  <>
                    <Text className="text-textMuted text-sm mb-3">
                      Select team members to invite ({selectedTeamMembers.length} selected)
                    </Text>
                    {teamMembers.map((member) => {
                      const isSelected = selectedTeamMembers.includes(member.id);
                      const isAlreadyInvited = invitations.some(
                        inv => inv.invited_user_id === member.id
                      );

                      return (
                        <TouchableOpacity
                          key={member.id}
                          onPress={() => !isAlreadyInvited && toggleTeamMemberSelection(member.id)}
                          disabled={isAlreadyInvited}
                          className={`flex-row items-center p-3 rounded-lg mb-2 ${
                            isAlreadyInvited
                              ? 'bg-surfaceHighlight/50 opacity-60'
                              : isSelected
                              ? 'bg-purple-500/20 border border-purple-500'
                              : 'bg-surfaceHighlight'
                          }`}
                        >
                          <View
                            className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                              isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-500'
                            }`}
                          >
                            {isSelected && (
                              <Ionicons name="checkmark" size={14} color="#ffffff" />
                            )}
                          </View>
                          <Avatar
                            name={member.full_name || member.email}
                            source={member.avatar_url}
                            size="sm"
                            isCertified={member.is_certified ?? undefined}
                            className="mr-3"
                          />
                          <View className="flex-1">
                            <Text className="text-text font-medium">
                              {member.full_name || 'Team Member'}
                            </Text>
                            <Text className="text-textMuted text-xs">{member.email}</Text>
                          </View>
                          {isAlreadyInvited && (
                            <View className="bg-green-500/20 px-2 py-1 rounded-full">
                              <Text className="text-green-500 text-xs">Invited</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}
              </ScrollView>
            ) : (
              /* External Guest Tab */
              <View className="flex-1 px-4">
                <Text className="text-textMuted text-sm mb-3">
                  Enter the email address of the guest you want to invite
                </Text>

                <View className="mb-4">
                  <Text className="text-text font-medium mb-2">Email Address *</Text>
                  <TextInput
                    value={externalEmail}
                    onChangeText={setExternalEmail}
                    placeholder="guest@example.com"
                    placeholderTextColor="#6b7280"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="bg-surfaceHighlight text-text p-4 rounded-lg"
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-text font-medium mb-2">Name (Optional)</Text>
                  <TextInput
                    value={externalName}
                    onChangeText={setExternalName}
                    placeholder="Guest's name"
                    placeholderTextColor="#6b7280"
                    autoCapitalize="words"
                    className="bg-surfaceHighlight text-text p-4 rounded-lg"
                  />
                </View>
              </View>
            )}

            {/* Send Button */}
            <View className="p-4 border-t border-border">
              <Button
                title={
                  sendingInvites
                    ? 'Sending...'
                    : inviteMode === 'team'
                    ? `Send ${selectedTeamMembers.length} Invitation${selectedTeamMembers.length !== 1 ? 's' : ''}`
                    : 'Send Invitation'
                }
                onPress={inviteMode === 'team' ? handleSendTeamInvites : handleSendExternalInvite}
                loading={sendingInvites}
                disabled={
                  sendingInvites ||
                  (inviteMode === 'team' && selectedTeamMembers.length === 0) ||
                  (inviteMode === 'external' && !externalEmail.trim())
                }
                fullWidth
              />
            </View>
          </View>
        </SafeContainer>
      </Modal>
    </SafeContainer>
  );
}
