'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  PauseCircle,
  PlayCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';

interface Entitlement {
  plan: string | null;
  status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  stripe_subscription_id: string | null;
}

interface SubscriptionRecord {
  source: string;
  status: string;
  plan: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  external_id: string | null;
}

export interface SubscriptionRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  entitlement: Entitlement | null;
  subscriptionRecord: SubscriptionRecord | null;
}

interface SubscriptionQueryRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  entitlements: Entitlement[] | null;
  subscription_records: SubscriptionRecord[] | null;
}

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function SubscriptionsTable({ initialRows }: { initialRows: SubscriptionRow[] }) {
  const supabase = createClient();
  const [rows, setRows] = useState(initialRows);
  const [actionState, setActionState] = useState<Record<string, string>>({});
  const [planOptions, setPlanOptions] = useState<Array<{ plan: string; price_id: string }>>([]);
  const [planSelection, setPlanSelection] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadPlans() {
      const { data } = await supabase
        .from('subscription_plans')
        .select('plan, stripe_price_id')
        .eq('is_active', true);

      if (data) {
        setPlanOptions(
          data.map((item) => ({ plan: item.plan, price_id: item.stripe_price_id }))
        );
      }
    }

    loadPlans();
  }, [supabase]);

  const getSource = (row: SubscriptionRow) => {
    if (row.subscriptionRecord?.source) return row.subscriptionRecord.source;
    if (row.entitlement?.stripe_subscription_id) return 'stripe';
    return 'unknown';
  };

  const getSubscriptionId = (row: SubscriptionRow) =>
    row.subscriptionRecord?.external_id || row.entitlement?.stripe_subscription_id || null;

  const handleAction = async (row: SubscriptionRow, action: string) => {
    const source = getSource(row);
    const subscriptionId = getSubscriptionId(row);
    if (source !== 'stripe' || !subscriptionId) return;

    setActionState((prev) => ({ ...prev, [row.id]: action }));
    try {
      const { data, error } = await supabase.functions.invoke('admin-subscription', {
        body: {
          action,
          source: 'stripe',
          subscription_id: subscriptionId,
          price_id: action === 'update_plan' ? planSelection[row.id] : undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const { data: refreshed } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          entitlements (
            plan,
            status,
            current_period_start,
            current_period_end,
            cancel_at_period_end,
            stripe_subscription_id
          ),
          subscription_records (
            source,
            status,
            plan,
            current_period_start,
            current_period_end,
            cancel_at_period_end,
            external_id
          )
        `)
        .in('id', rows.map((item) => item.id));

      if (refreshed) {
        const nextRows = (refreshed as SubscriptionQueryRow[]).map((item) => ({
          id: item.id,
          email: item.email,
          full_name: item.full_name,
          role: item.role,
          entitlement: item.entitlements?.[0] || null,
          subscriptionRecord: item.subscription_records?.[0] || null,
        }));
        setRows(nextRows);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionState((prev) => ({ ...prev, [row.id]: '' }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Source
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Plan
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Renewal
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row) => {
            const source = getSource(row);
            const entitlement = row.entitlement;
            const record = row.subscriptionRecord;
            const status = record?.status || entitlement?.status || 'unknown';
            const plan = record?.plan || entitlement?.plan || 'free';
            const renewal = record?.current_period_end || entitlement?.current_period_end || null;
            const isPaused = status === 'paused';
            const isCanceling = Boolean(record?.cancel_at_period_end || entitlement?.cancel_at_period_end);
            const isStripe = source === 'stripe';
            const busy = actionState[row.id];

            return (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {row.full_name || 'No name'}
                  </div>
                  <div className="text-sm text-gray-500">{row.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                  {source === 'stripe' ? 'Stripe' : source === 'apple' ? 'Apple' : source === 'google' ? 'Google' : 'Unknown'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                  {plan}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    {status}
                  </span>
                  {isCanceling && (
                    <div className="text-xs text-yellow-600 mt-1">Canceling</div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(renewal)}
                </td>
                <td className="px-6 py-4 text-right">
                  {isStripe ? (
                    <div className="inline-flex items-center gap-2">
                      <select
                        value={planSelection[row.id] || ''}
                        onChange={(event) =>
                          setPlanSelection((prev) => ({
                            ...prev,
                            [row.id]: event.target.value,
                          }))
                        }
                        className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-700 bg-white"
                      >
                        <option value="">Change Plan</option>
                        {planOptions.map((option) => (
                          <option key={option.plan} value={option.price_id}>
                            {option.plan}
                          </option>
                        ))}
                      </select>
                      {planSelection[row.id] && (
                        <button
                          onClick={() => handleAction(row, 'update_plan')}
                          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700"
                        >
                          Update
                        </button>
                      )}
                      {isPaused ? (
                        <button
                          onClick={() => handleAction(row, 'resume_from_pause')}
                          className="inline-flex items-center text-xs text-green-600 hover:text-green-700"
                        >
                          <PlayCircle className="w-4 h-4 mr-1" />
                          Resume
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(row, 'pause')}
                          className="inline-flex items-center text-xs text-yellow-600 hover:text-yellow-700"
                        >
                          <PauseCircle className="w-4 h-4 mr-1" />
                          Pause
                        </button>
                      )}
                      {isCanceling ? (
                        <button
                          onClick={() => handleAction(row, 'resume')}
                          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700"
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Undo Cancel
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(row, 'cancel')}
                          className="inline-flex items-center text-xs text-red-600 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancel
                        </button>
                      )}
                      {busy && (
                        <span className="text-xs text-gray-400">Working...</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Pending API setup</span>
                  )}
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                No subscriptions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
