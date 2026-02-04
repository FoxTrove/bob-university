import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, LayoutAnimation, Platform, UIManager, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { SafeContainer } from '../../components/layout/SafeContainer';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Ionicons } from '@expo/vector-icons';
import type { Profile, Salon, Module, SalonCertificationTickets, CertificationTicketAssignment, CertificationSetting } from '../../lib/database.types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ModuleProgress {
  id: string;
  title: string;
  completedVideos: number;
  totalVideos: number;
}

interface StaffWithProgress extends Profile {
  completedVideos: number;
  totalVideos: number;
  moduleProgress: ModuleProgress[];
}

interface TicketAssignmentWithDetails extends CertificationTicketAssignment {
  assignedToProfile?: Profile;
  certification?: CertificationSetting;
}

export default function TeamTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffWithProgress[]>([]);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [ticketPool, setTicketPool] = useState<SalonCertificationTickets | null>(null);
  const [ticketAssignments, setTicketAssignments] = useState<TicketAssignmentWithDetails[]>([]);

  useEffect(() => {
    fetchSalonData();
  }, [user?.id]);

  async function fetchSalonData() {
    if (!user?.id) return;
    try {
      // 1. Get Owner's Salon
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (salonError && salonError.code !== 'PGRST116') throw salonError;
      setSalon(salonData);

      // 2. Get Staff members with progress
      if (salonData) {
        const { data: staffData, error: staffError } = await supabase
          .from('profiles')
          .select('*')
          .eq('salon_id', salonData.id);

        if (staffError) throw staffError;

        // 3. Get modules with their videos for progress calculation
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select(`
            id,
            title,
            videos (
              id,
              is_published
            )
          `)
          .eq('is_published', true)
          .order('sort_order', { ascending: true });

        if (modulesError) throw modulesError;

        // 4. Get video progress for each staff member
        const staffWithProgress: StaffWithProgress[] = await Promise.all(
          (staffData || []).map(async (member) => {
            const { data: progressData } = await supabase
              .from('video_progress')
              .select('video_id')
              .eq('user_id', member.id)
              .eq('completed', true);

            const completedVideoIds = new Set(progressData?.map((p) => p.video_id) || []);

            // Calculate per-module progress
            const moduleProgress: ModuleProgress[] = (modulesData || []).map((module) => {
              const publishedVideos = (module.videos || []).filter((v: { is_published: boolean | null }) => v.is_published === true);
              const totalVideos = publishedVideos.length;
              const completedVideos = publishedVideos.filter((v: { id: string }) => completedVideoIds.has(v.id)).length;

              return {
                id: module.id,
                title: module.title,
                completedVideos,
                totalVideos,
              };
            }).filter((m) => m.totalVideos > 0); // Only include modules with videos

            // Calculate overall progress
            const totalVideos = moduleProgress.reduce((sum, m) => sum + m.totalVideos, 0);
            const completedVideos = moduleProgress.reduce((sum, m) => sum + m.completedVideos, 0);

            return {
              ...member,
              completedVideos,
              totalVideos,
              moduleProgress,
            };
          })
        );

        setStaff(staffWithProgress);

        // 5. Fetch certification ticket pool
        const { data: ticketData } = await supabase
          .from('salon_certification_tickets')
          .select('*')
          .eq('salon_id', salonData.id)
          .single();

        setTicketPool(ticketData);

        // 6. Fetch ticket assignments with profiles and certifications
        const { data: assignmentsData } = await supabase
          .from('certification_ticket_assignments')
          .select('*')
          .eq('salon_id', salonData.id)
          .order('assigned_at', { ascending: false });

        if (assignmentsData && assignmentsData.length > 0) {
          // Get unique user IDs and certification IDs
          const userIds = [...new Set(assignmentsData.map(a => a.assigned_to_user_id))];
          const certIds = [...new Set(assignmentsData.map(a => a.certification_id))];

          // Fetch profiles for assigned users
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);

          // Fetch certification settings
          const { data: certifications } = await supabase
            .from('certification_settings')
            .select('*')
            .in('id', certIds);

          // Map assignments with their related data
          const assignmentsWithDetails: TicketAssignmentWithDetails[] = assignmentsData.map(assignment => ({
            ...assignment,
            assignedToProfile: profiles?.find(p => p.id === assignment.assigned_to_user_id),
            certification: certifications?.find(c => c.id === assignment.certification_id),
          }));

          setTicketAssignments(assignmentsWithDetails);
        } else {
          setTicketAssignments([]);
        }
      }
    } catch (e) {
      console.error('Error fetching salon data:', e);
    } finally {
      setLoading(false);
    }
  }

  async function generateAccessCode(email?: string) {
    if (!user?.id || !salon?.id) {
      Alert.alert('Error', 'No salon found for this user.');
      return null;
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 2); // 48 hours

    const { error } = await supabase.from('staff_access_codes').insert({
      owner_id: user.id,
      salon_id: salon.id,
      code: code,
      max_uses: 1,
      expires_at: expiresAt.toISOString(),
      invited_email: email || null,
      invite_sent_at: email ? new Date().toISOString() : null,
    });

    if (error) throw error;
    return code;
  }

  async function handleGenerateCodeOnly() {
    setGenerating(true);
    try {
      const code = await generateAccessCode();
      if (code) {
        setGeneratedCode(code);
        setShowEmailForm(false);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to generate code';
      Alert.alert('Error', message);
    } finally {
      setGenerating(false);
    }
  }

  function parseEmails(input: string): string[] {
    return input
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0);
  }

  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async function sendEmailInvite() {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in.');
      return;
    }

    const emails = parseEmails(inviteEmail);

    if (emails.length === 0) {
      Alert.alert('Error', 'Please enter at least one email address.');
      return;
    }

    setSendingInvite(true);

    // Get owner profile once for all emails
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Track results for each email
    const results: { email: string; success: boolean; code?: string; error?: string }[] = [];

    // Process each email - validate and send individually
    for (const email of emails) {
      // Validate this email first
      if (!validateEmail(email)) {
        results.push({ email, success: false, error: 'Invalid email format' });
        continue;
      }

      try {
        const code = await generateAccessCode(email);
        if (!code) {
          results.push({ email, success: false, error: 'Failed to generate code' });
          continue;
        }

        // Send the invite email via edge function
        const { error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            to: email,
            template: 'team-invite',
            data: {
              salonName: salon?.name,
              ownerName: ownerProfile?.full_name,
              accessCode: code,
              expiresIn: 'in 48 hours',
            },
            skip_preference_check: true,
          },
        });

        if (emailError) {
          results.push({ email, success: false, error: emailError.message || 'Failed to send' });
        } else {
          results.push({ email, success: true, code });
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to send invite';
        results.push({ email, success: false, error: message });
      }
    }

    setSendingInvite(false);

    // Build result message
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (successful.length > 0 && failed.length === 0) {
      // All succeeded
      if (successful.length === 1) {
        setGeneratedCode(successful[0].code!);
        Alert.alert('Invite Sent!', `An invitation has been sent to ${successful[0].email}`);
      } else {
        Alert.alert(
          'Invites Sent!',
          `${successful.length} invitations sent successfully:\n${successful.map(r => `• ${r.email}`).join('\n')}`
        );
      }
      setInviteEmail('');
      setShowEmailForm(false);
    } else if (successful.length === 0 && failed.length > 0) {
      // All failed
      Alert.alert(
        'Failed to Send',
        `Unable to send invites:\n${failed.map(r => `• ${r.email}: ${r.error}`).join('\n')}`
      );
    } else {
      // Mixed results - partial success
      Alert.alert(
        'Partial Success',
        `Sent: ${successful.length}\n${successful.map(r => `✓ ${r.email}`).join('\n')}\n\nFailed: ${failed.length}\n${failed.map(r => `✗ ${r.email}: ${r.error}`).join('\n')}`
      );
      // Clear only successful emails from input (leave failed ones for retry)
      const failedEmails = failed.map(r => r.email);
      setInviteEmail(failedEmails.join(', '));
    }
  }

  function confirmRemoveStaff(member: Profile) {
    Alert.alert(
      'Remove from Team',
      `Are you sure you want to remove ${member.full_name || member.email} from your team? They will lose access to salon training.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => handleRemoveStaff(member.id),
        },
      ]
    );
  }

  async function handleRemoveStaff(memberId: string) {
    setRemovingId(memberId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ salon_id: null })
        .eq('id', memberId);

      if (error) throw error;

      // Remove from local state
      setStaff((prev) => prev.filter((m) => m.id !== memberId));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to remove staff member';
      Alert.alert('Error', message);
    } finally {
      setRemovingId(null);
    }
  }

  function toggleExpanded(memberId: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === memberId ? null : memberId);
  }

  function getProgressPercent(completed: number, total: number): number {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  if (loading) {
    return (
      <SafeContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#a855f7" />
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer>
      <ScrollView className="flex-1 bg-background">
        <View className="p-6">
          <Text className="text-3xl font-serifBold text-primary mb-2">My Team</Text>
          <Text className="text-textMuted mb-4">
            {salon?.name || 'Your Salon'} • {staff.length} / {salon?.max_staff || 5} Staff Members
          </Text>

          {/* Team Certification Overview */}
          {staff.length > 0 && (
            <View className="flex-row items-center bg-surfaceHighlight rounded-xl p-3 mb-6">
              <View className="bg-[#C68976]/20 p-2 rounded-full mr-3">
                <Ionicons name="ribbon" size={20} color="#C68976" />
              </View>
              <View className="flex-1">
                <Text className="text-text font-bold">
                  {staff.filter((m) => m.is_certified).length} of {staff.length} team members certified
                </Text>
                <Text className="text-textMuted text-xs">
                  {staff.filter((m) => m.is_certified).length === staff.length
                    ? 'Congratulations! Your whole team is certified.'
                    : 'Certified members have a badge on their avatar.'}
                </Text>
              </View>
            </View>
          )}

          {/* Certification Tickets Dashboard */}
          {ticketPool && (
            <Card className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="bg-purple-500/20 p-2 rounded-full mr-3">
                    <Ionicons name="ticket" size={20} color="#a855f7" />
                  </View>
                  <Text className="text-text font-bold text-lg">Certification Tickets</Text>
                </View>
                <View className="bg-purple-500/10 px-3 py-1 rounded-full">
                  <Text className="text-purple-500 font-bold">
                    {ticketPool.available_tickets} available / {ticketPool.total_tickets - ticketPool.available_tickets} assigned
                  </Text>
                </View>
              </View>

              <Text className="text-textMuted text-sm mb-4">
                Assign tickets to team members so they can get certified at no extra cost.
              </Text>

              {/* Ticket Assignments List */}
              {ticketAssignments.length > 0 ? (
                <View className="border-t border-surfaceHighlight pt-3">
                  <Text className="text-textMuted text-xs font-medium mb-2 uppercase">Assignment History</Text>
                  {ticketAssignments.map((assignment) => (
                    <View key={assignment.id} className="flex-row items-center py-2 border-b border-surfaceHighlight last:border-b-0">
                      <Avatar
                        name={assignment.assignedToProfile?.full_name || assignment.assignedToProfile?.email || 'Unknown'}
                        source={assignment.assignedToProfile?.avatar_url}
                        size="sm"
                        className="mr-3"
                      />
                      <View className="flex-1">
                        <Text className="text-text font-medium">
                          {assignment.assignedToProfile?.full_name || 'Team Member'}
                        </Text>
                        <Text className="text-textMuted text-xs">
                          {assignment.certification?.title || 'Certification'} • {assignment.status}
                        </Text>
                      </View>
                      <View className={`px-2 py-1 rounded-full ${
                        assignment.status === 'redeemed' ? 'bg-green-500/20' :
                        assignment.status === 'assigned' ? 'bg-blue-500/20' :
                        assignment.status === 'expired' ? 'bg-gray-500/20' :
                        'bg-red-500/20'
                      }`}>
                        <Text className={`text-xs font-medium ${
                          assignment.status === 'redeemed' ? 'text-green-600' :
                          assignment.status === 'assigned' ? 'text-blue-600' :
                          assignment.status === 'expired' ? 'text-gray-600' :
                          'text-red-600'
                        }`}>
                          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="bg-surfaceHighlight rounded-lg p-4 items-center">
                  <Ionicons name="ticket-outline" size={24} color="#71717a" />
                  <Text className="text-textMuted text-sm mt-2 text-center">
                    No tickets assigned yet. Assign tickets to help your team get certified.
                  </Text>
                </View>
              )}
            </Card>
          )}

          {/* Invite Staff Section */}
          {showEmailForm ? (
            <Card className="mb-6 bg-surfaceHighlight">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-text font-bold">Invite via Email</Text>
                <TouchableOpacity onPress={() => setShowEmailForm(false)}>
                  <Ionicons name="close" size={20} color="#71717a" />
                </TouchableOpacity>
              </View>
              <TextInput
                className="bg-surface border border-surfaceHighlight rounded-lg px-4 py-3 text-text mb-2"
                placeholder="Enter email addresses (comma-separated)"
                placeholderTextColor="#71717a"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={inviteEmail}
                onChangeText={setInviteEmail}
                editable={!sendingInvite}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              {/* Email count helper */}
              {(() => {
                const emails = inviteEmail
                  .split(',')
                  .map(e => e.trim())
                  .filter(e => e.length > 0);
                const count = emails.length;
                return (
                  <Text className="text-textMuted text-xs mb-3">
                    {count === 0
                      ? 'Separate multiple emails with commas'
                      : count === 1
                        ? '1 email entered'
                        : `${count} emails entered`}
                  </Text>
                );
              })()}
              <TouchableOpacity
                className="bg-purple-500 py-3 px-4 rounded-lg flex-row items-center justify-center"
                onPress={sendEmailInvite}
                disabled={sendingInvite}
              >
                {sendingInvite ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#ffffff" />
                    <Text className="text-white font-bold ml-2">
                      {(() => {
                        const emails = inviteEmail
                          .split(',')
                          .map(e => e.trim())
                          .filter(e => e.length > 0);
                        return emails.length > 1 ? 'Send Invites' : 'Send Invite';
                      })()}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Card>
          ) : (
            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center bg-purple-500/20 py-3 px-4 rounded-xl"
                onPress={() => setShowEmailForm(true)}
                disabled={generating}
              >
                <Ionicons name="mail-outline" size={20} color="#a855f7" />
                <Text className="text-purple-500 font-bold ml-2">Invite via Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-purple-500/20 py-3 px-4 rounded-xl"
                onPress={handleGenerateCodeOnly}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#a855f7" />
                ) : (
                  <Ionicons name="key-outline" size={20} color="#a855f7" />
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Generated Code Display */}
          {generatedCode && (
            <Card className="mb-6 bg-surfaceHighlight border border-purple-500">
              <View className="flex-row justify-between items-start">
                <View>
                  <Text className="text-text font-bold text-lg mb-1">New Access Code</Text>
                  <Text className="text-textMuted text-sm mb-2">
                    Share this code with your stylist.
                  </Text>
                  <Text className="text-4xl font-mono text-purple-500 font-bold tracking-widest my-2">
                    {generatedCode}
                  </Text>
                  <Text className="text-textMuted text-xs">Expires in 48 hours. One-time use.</Text>
                </View>
                <TouchableOpacity onPress={() => setGeneratedCode(null)}>
                  <Ionicons name="close" size={20} color="#71717a" />
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Staff List */}
          {staff.length === 0 ? (
            <Card className="items-center py-8">
              <View className="bg-purple-500/10 p-4 rounded-full mb-4">
                <Ionicons name="people" size={32} color="#a855f7" />
              </View>
              <Text className="text-text font-bold text-lg">No Staff Yet</Text>
              <Text className="text-textMuted text-center px-4 mt-2">
                Generate an access code and share it with your stylists to give them access to
                training.
              </Text>
            </Card>
          ) : (
            <View className="gap-4">
              {staff.map((member) => {
                const progressPercent = getProgressPercent(member.completedVideos, member.totalVideos);
                const isExpanded = expandedId === member.id;

                return (
                  <Card key={member.id} className="p-3">
                    <TouchableOpacity
                      onPress={() => toggleExpanded(member.id)}
                      activeOpacity={0.7}
                      className="flex-row items-center"
                    >
                      <Avatar
                        name={member.full_name || member.email}
                        source={member.avatar_url}
                        size="md"
                        level={member.community_level ?? undefined}
                        isCertified={member.is_certified ?? undefined}
                        className="mr-3"
                      />
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-text font-bold">{member.full_name || 'Stylist'}</Text>
                          <View className="flex-row items-center">
                            <Text className="text-primary font-bold mr-2">{progressPercent}%</Text>
                            <Ionicons
                              name={isExpanded ? 'chevron-up' : 'chevron-down'}
                              size={16}
                              color="#71717a"
                            />
                          </View>
                        </View>
                        <Text className="text-textMuted text-xs mb-2">{member.email}</Text>
                        <ProgressBar
                          progress={progressPercent}
                          size="sm"
                          variant={progressPercent === 100 ? 'success' : 'brand'}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Expanded Module Progress */}
                    {isExpanded && (
                      <View className="mt-4 pt-3 border-t border-surfaceHighlight">
                        <View className="flex-row justify-between items-center mb-3">
                          <Text className="text-textMuted text-sm font-medium">Module Progress</Text>
                          <TouchableOpacity
                            onPress={() => confirmRemoveStaff(member)}
                            disabled={removingId === member.id}
                            className="flex-row items-center"
                          >
                            {removingId === member.id ? (
                              <ActivityIndicator size="small" color="#ef4444" />
                            ) : (
                              <>
                                <Ionicons name="person-remove-outline" size={14} color="#ef4444" />
                                <Text className="text-red-500 text-xs ml-1">Remove</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                        {member.moduleProgress.length === 0 ? (
                          <Text className="text-textMuted text-sm italic">No modules available</Text>
                        ) : (
                          member.moduleProgress.map((module) => {
                            const modulePercent = getProgressPercent(module.completedVideos, module.totalVideos);
                            return (
                              <View key={module.id} className="mb-3">
                                <View className="flex-row justify-between items-center mb-1">
                                  <Text className="text-text text-sm flex-1 mr-2" numberOfLines={1}>
                                    {module.title}
                                  </Text>
                                  <Text className="text-textMuted text-xs">
                                    {module.completedVideos}/{module.totalVideos}
                                  </Text>
                                </View>
                                <ProgressBar
                                  progress={modulePercent}
                                  size="sm"
                                  variant={modulePercent === 100 ? 'success' : 'default'}
                                />
                              </View>
                            );
                          })
                        )}
                      </View>
                    )}
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeContainer>
  );
}
