'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import { formatCurrency } from '@/lib/analytics';

interface UserWithEntitlement {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string | null;
  entitlements: Array<{
    plan: string | null;
    status: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
  }>;
  ltv_cents: number;
}

type StatusFilter = 'all' | 'premium' | 'canceled' | 'free';
type SortField = 'name' | 'email' | 'joined' | 'ltv' | 'plan';
type SortDirection = 'asc' | 'desc';

interface UsersTableProps {
  users: UserWithEntitlement[];
}

function formatDate(dateString: string | null) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getUserStatus(user: UserWithEntitlement): 'premium' | 'canceled' | 'free' {
  const entitlement = user.entitlements?.[0];
  if (entitlement?.status === 'canceled') return 'canceled';
  if (entitlement?.status === 'active' && (entitlement?.plan === 'individual' || entitlement?.plan === 'salon')) {
    return 'premium';
  }
  return 'free';
}

export function UsersTable({ users }: UsersTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('joined');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users;

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchLower) ||
          user.full_name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((user) => getUserStatus(user) === statusFilter);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortField) {
        case 'name':
          aVal = a.full_name?.toLowerCase() || '';
          bVal = b.full_name?.toLowerCase() || '';
          break;
        case 'email':
          aVal = a.email?.toLowerCase() || '';
          bVal = b.email?.toLowerCase() || '';
          break;
        case 'joined':
          aVal = a.created_at || '';
          bVal = b.created_at || '';
          break;
        case 'ltv':
          aVal = a.ltv_cents || 0;
          bVal = b.ltv_cents || 0;
          break;
        case 'plan':
          const statusOrder = { premium: 0, canceled: 1, free: 2 };
          aVal = statusOrder[getUserStatus(a)];
          bVal = statusOrder[getUserStatus(b)];
          break;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, search, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {(['all', 'premium', 'canceled', 'free'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === status
                  ? status === 'premium'
                    ? 'bg-purple-100 text-purple-800'
                    : status === 'canceled'
                    ? 'bg-red-100 text-red-800'
                    : status === 'free'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-blue-100 text-blue-800'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-1 text-xs">
                  ({users.filter((u) => getUserStatus(u) === status).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 border-b border-gray-200">
        Showing {filteredAndSortedUsers.length} of {users.length} users
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                User <SortIcon field="name" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('plan')}
              >
                Plan <SortIcon field="plan" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subscribed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expires
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('joined')}
              >
                Joined <SortIcon field="joined" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('ltv')}
              >
                LTV <SortIcon field="ltv" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedUsers.map((profile) => {
              const entitlement = profile.entitlements?.[0];
              const status = getUserStatus(profile);
              const isPremium = status === 'premium';
              const isCanceled = status === 'canceled';
              const planLabel = isCanceled
                ? 'Canceled'
                : entitlement?.plan === 'salon'
                  ? 'Salon'
                  : entitlement?.plan === 'individual'
                    ? 'Individual'
                    : 'Free';

              return (
                <tr key={profile.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.full_name || ''}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-500 font-medium">
                            {(profile.full_name || profile.email || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/users/${profile.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600"
                        >
                          {profile.full_name || 'No name'}
                        </Link>
                        <p className="text-sm text-gray-500">{profile.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        isPremium
                          ? 'bg-purple-100 text-purple-800'
                          : isCanceled
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {planLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(entitlement?.current_period_start ?? null)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(entitlement?.current_period_end ?? null)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(profile.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatCurrency(profile.ltv_cents || 0)}
                  </td>
                  <td className="px-6 py-4">
                    {profile.role === 'admin' ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Admin
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">User</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredAndSortedUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {search || statusFilter !== 'all'
                    ? 'No users match your filters.'
                    : 'No users yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
