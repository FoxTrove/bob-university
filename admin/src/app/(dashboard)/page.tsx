import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import { Video, Users, FolderOpen, TrendingUp } from 'lucide-react';

async function getStats() {
  const supabase = await createClient();

  const [
    { count: videoCount },
    { count: moduleCount },
    { count: userCount },
    { count: subscriberCount },
  ] = await Promise.all([
    supabase.from('videos').select('*', { count: 'exact', head: true }),
    supabase.from('modules').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('entitlements')
      .select('*', { count: 'exact', head: true })
      .eq('plan', 'premium'),
  ]);

  return {
    videos: videoCount || 0,
    modules: moduleCount || 0,
    users: userCount || 0,
    subscribers: subscriberCount || 0,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const stats = await getStats();

  const statCards = [
    {
      name: 'Total Videos',
      value: stats.videos,
      icon: Video,
      color: 'bg-blue-500',
    },
    {
      name: 'Modules',
      value: stats.modules,
      icon: FolderOpen,
      color: 'bg-purple-500',
    },
    {
      name: 'Total Users',
      value: stats.users,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      name: 'Subscribers',
      value: stats.subscribers,
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  return (
    <>
      <Header user={user} title="Dashboard" />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a
                href="/videos/upload"
                className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Video className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-sm font-medium text-blue-900">Upload New Video</span>
              </a>
              <a
                href="/modules/new"
                className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <FolderOpen className="w-5 h-5 text-purple-600 mr-3" />
                <span className="text-sm font-medium text-purple-900">Create New Module</span>
              </a>
              <a
                href="/notifications/new"
                className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <TrendingUp className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-sm font-medium text-green-900">Send Push Notification</span>
              </a>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <p className="text-gray-500 text-sm">Activity feed coming soon...</p>
          </div>
        </div>
      </div>
    </>
  );
}
