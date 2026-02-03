import { View, Text, ScrollView, Switch, ActivityIndicator } from 'react-native';
import React from 'react';
import { SafeContainer } from '../components/layout/SafeContainer';
import { Card } from '../components/ui/Card';
import { BackButton } from '../components/ui/BackButton';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationPreferences, NotificationPreferences } from '../lib/hooks/useNotificationPreferences';

interface PreferenceToggleProps {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

function PreferenceToggle({ label, description, value, onValueChange, disabled }: PreferenceToggleProps) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-border last:border-b-0">
      <View className="flex-1 mr-4">
        <Text className="text-text font-medium">{label}</Text>
        <Text className="text-textMuted text-sm">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#3f3f46', true: '#C68976' }}
        thumbColor={value ? '#ffffff' : '#a1a1aa'}
      />
    </View>
  );
}

interface PreferenceSectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  children: React.ReactNode;
}

function PreferenceSection({ title, icon, iconColor, children }: PreferenceSectionProps) {
  return (
    <View className="mb-6">
      <View className="flex-row items-center mb-3">
        <View className="bg-surface p-2 rounded-full mr-2" style={{ backgroundColor: `${iconColor}20` }}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text className="text-textMuted text-sm font-medium uppercase tracking-wider">{title}</Text>
      </View>
      <Card padding="none" className="px-4">
        {children}
      </Card>
    </View>
  );
}

export default function NotificationSettings() {
  const { preferences, loading, error, updatePreference } = useNotificationPreferences();

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!preferences) return;
    updatePreference(key, !preferences[key]);
  };

  if (loading) {
    return (
      <SafeContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#C68976" />
        </View>
      </SafeContainer>
    );
  }

  if (error) {
    return (
      <SafeContainer>
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text className="text-red-500 text-center mt-4">{error}</Text>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer>
      <ScrollView className="flex-1 bg-background">
        <View className="p-6">
          <BackButton />
          <Text className="text-3xl font-serifBold text-primary mb-2 mt-4">Notifications</Text>
          <Text className="text-textMuted mb-8">Choose which emails you'd like to receive</Text>

          {/* Account & Security */}
          <PreferenceSection title="Account & Security" icon="shield-checkmark-outline" iconColor="#22c55e">
            <View className="py-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <Text className="text-text font-medium">Security Alerts</Text>
                  <Text className="text-textMuted text-sm">Password resets and account security</Text>
                </View>
                <View className="bg-green-500/20 px-3 py-1 rounded-full">
                  <Text className="text-green-500 text-xs font-medium">Always On</Text>
                </View>
              </View>
            </View>
          </PreferenceSection>

          {/* Learning & Progress */}
          <PreferenceSection title="Learning & Progress" icon="book-outline" iconColor="#3b82f6">
            <PreferenceToggle
              label="New Content"
              description="New modules and video releases"
              value={preferences?.learning_updates ?? true}
              onValueChange={() => handleToggle('learning_updates')}
            />
            <PreferenceToggle
              label="Milestones"
              description="Course completions and achievements"
              value={preferences?.progress_milestones ?? true}
              onValueChange={() => handleToggle('progress_milestones')}
            />
          </PreferenceSection>

          {/* Subscription & Billing */}
          <PreferenceSection title="Subscription & Billing" icon="card-outline" iconColor="#a855f7">
            <PreferenceToggle
              label="Payment Receipts"
              description="Confirmation of payments"
              value={preferences?.payment_receipts ?? true}
              onValueChange={() => handleToggle('payment_receipts')}
            />
            <PreferenceToggle
              label="Subscription Updates"
              description="Renewal reminders and plan changes"
              value={preferences?.subscription_updates ?? true}
              onValueChange={() => handleToggle('subscription_updates')}
            />
          </PreferenceSection>

          {/* Certification */}
          <PreferenceSection title="Certification" icon="ribbon-outline" iconColor="#f59e0b">
            <PreferenceToggle
              label="Certification Updates"
              description="Application status and results"
              value={preferences?.certification_updates ?? true}
              onValueChange={() => handleToggle('certification_updates')}
            />
          </PreferenceSection>

          {/* Events */}
          <PreferenceSection title="Events" icon="calendar-outline" iconColor="#ec4899">
            <PreferenceToggle
              label="Ticket Confirmations"
              description="Event registration details"
              value={preferences?.event_confirmations ?? true}
              onValueChange={() => handleToggle('event_confirmations')}
            />
            <PreferenceToggle
              label="Event Reminders"
              description="Upcoming event notifications"
              value={preferences?.event_reminders ?? true}
              onValueChange={() => handleToggle('event_reminders')}
            />
          </PreferenceSection>

          {/* Marketing */}
          <PreferenceSection title="Marketing" icon="megaphone-outline" iconColor="#C68976">
            <PreferenceToggle
              label="Promotional Offers"
              description="Special deals and discounts"
              value={preferences?.promotional_emails ?? true}
              onValueChange={() => handleToggle('promotional_emails')}
            />
            <PreferenceToggle
              label="Newsletter"
              description="Weekly tips and updates"
              value={preferences?.newsletter ?? true}
              onValueChange={() => handleToggle('newsletter')}
            />
            <PreferenceToggle
              label="Tips & Tutorials"
              description="Educational content and styling tips"
              value={preferences?.tips_and_tutorials ?? true}
              onValueChange={() => handleToggle('tips_and_tutorials')}
            />
          </PreferenceSection>

          {/* Community */}
          <PreferenceSection title="Community" icon="people-outline" iconColor="#06b6d4">
            <PreferenceToggle
              label="Community Activity"
              description="Comments, replies, and mentions"
              value={preferences?.community_notifications ?? true}
              onValueChange={() => handleToggle('community_notifications')}
            />
          </PreferenceSection>

          <Text className="text-textMuted text-xs text-center mt-4 mb-8">
            You can unsubscribe from any email by clicking the unsubscribe link in the footer.
          </Text>
        </View>
      </ScrollView>
    </SafeContainer>
  );
}
