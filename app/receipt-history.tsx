import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeContainer } from '../components/layout/SafeContainer';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface ReceiptItem {
  id: string;
  product_type: 'subscription' | 'event' | 'certification' | 'other';
  plan: string | null;
  amount_cents: number;
  currency: string;
  status: 'completed' | 'pending' | 'refunded' | 'failed';
  occurred_at: string;
  metadata: Record<string, unknown>;
}

const productTypeLabels: Record<string, string> = {
  subscription: 'Subscription',
  event: 'Event Registration',
  certification: 'Certification',
  other: 'Purchase',
};

const productTypeIcons: Record<string, string> = {
  subscription: 'card-outline',
  event: 'calendar-outline',
  certification: 'ribbon-outline',
  other: 'receipt-outline',
};

const statusColors: Record<string, { bg: string; text: string }> = {
  completed: { bg: 'bg-green-500/20', text: 'text-green-500' },
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-500' },
  refunded: { bg: 'bg-blue-500/20', text: 'text-blue-500' },
  failed: { bg: 'bg-red-500/20', text: 'text-red-500' },
};

function formatCurrency(amountCents: number, currency: string): string {
  const amount = amountCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getProductDescription(item: ReceiptItem): string {
  if (item.product_type === 'subscription') {
    const planName = item.plan ? item.plan.charAt(0).toUpperCase() + item.plan.slice(1) : 'Premium';
    return `${planName} Subscription`;
  }
  if (item.product_type === 'event' && item.metadata?.event_title) {
    return item.metadata.event_title as string;
  }
  if (item.product_type === 'certification') {
    return 'Certification Application';
  }
  return productTypeLabels[item.product_type] || 'Purchase';
}

export default function ReceiptHistory() {
  const router = useRouter();
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReceipts = async () => {
    if (!user?.id) return;

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('revenue_ledger')
        .select('id, product_type, plan, amount_cents, currency, status, occurred_at, metadata')
        .eq('user_id', user.id)
        .order('occurred_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setReceipts(data || []);
    } catch (err) {
      console.error('Error fetching receipts:', err);
      setError('Failed to load receipts. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [user?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReceipts();
  };

  const groupReceiptsByMonth = (items: ReceiptItem[]) => {
    const groups: Record<string, ReceiptItem[]> = {};
    items.forEach((item) => {
      const date = new Date(item.occurred_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(item);
    });
    return groups;
  };

  const groupedReceipts = groupReceiptsByMonth(receipts);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Receipt History',
          headerTitleStyle: { color: 'white' },
          headerStyle: { backgroundColor: 'black' },
          headerTintColor: '#3b82f6',
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Text className="text-primary font-medium text-lg">Back</Text>
            </Pressable>
          ),
        }}
      />
      <SafeContainer edges={['bottom']}>
        <ScrollView
          className="flex-1 bg-background"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#3b82f6"
            />
          }
        >
          <View className="p-6">
            {loading ? (
              <View className="py-20 items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="text-textMuted mt-4">Loading receipts...</Text>
              </View>
            ) : error ? (
              <View className="py-20 items-center">
                <Ionicons name="alert-circle" size={48} color="#ef4444" />
                <Text className="text-red-500 mt-4 text-center">{error}</Text>
              </View>
            ) : receipts.length === 0 ? (
              <View className="py-20 items-center">
                <View className="bg-gray-700/50 w-20 h-20 rounded-full items-center justify-center mb-4">
                  <Ionicons name="receipt-outline" size={40} color="#71717a" />
                </View>
                <Text className="text-text font-serifBold text-xl mb-2">No Receipts Yet</Text>
                <Text className="text-textMuted text-center px-8">
                  Your purchase and subscription history will appear here.
                </Text>
              </View>
            ) : (
              Object.entries(groupedReceipts).map(([month, items]) => (
                <View key={month} className="mb-6">
                  <Text className="text-textMuted text-sm font-medium uppercase tracking-wider mb-3">
                    {month}
                  </Text>
                  <Card padding="none">
                    {items.map((item, index) => {
                      const statusStyle = statusColors[item.status] || statusColors.completed;
                      const isLast = index === items.length - 1;
                      return (
                        <View
                          key={item.id}
                          className={`p-4 flex-row items-center ${
                            !isLast ? 'border-b border-border' : ''
                          }`}
                        >
                          <View
                            className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                              item.status === 'refunded' ? 'bg-blue-500/20' : 'bg-primary/20'
                            }`}
                          >
                            <Ionicons
                              name={productTypeIcons[item.product_type] as any}
                              size={20}
                              color={item.status === 'refunded' ? '#3b82f6' : '#C68976'}
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-text font-medium">
                              {getProductDescription(item)}
                            </Text>
                            <View className="flex-row items-center mt-1">
                              <Text className="text-textMuted text-sm">
                                {formatDate(item.occurred_at)}
                              </Text>
                              {item.status !== 'completed' && (
                                <View
                                  className={`ml-2 px-2 py-0.5 rounded-full ${statusStyle.bg}`}
                                >
                                  <Text className={`text-xs font-medium capitalize ${statusStyle.text}`}>
                                    {item.status}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <Text
                            className={`font-semibold ${
                              item.status === 'refunded' ? 'text-blue-500' : 'text-text'
                            }`}
                          >
                            {item.status === 'refunded' ? '-' : ''}
                            {formatCurrency(item.amount_cents, item.currency)}
                          </Text>
                        </View>
                      );
                    })}
                  </Card>
                </View>
              ))
            )}

            {/* Footer Info */}
            {receipts.length > 0 && (
              <View className="mt-4 mb-8">
                <Text className="text-textMuted text-xs text-center">
                  For detailed invoices or billing questions,{'\n'}
                  please contact support@bobuniversity.com
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeContainer>
    </>
  );
}
