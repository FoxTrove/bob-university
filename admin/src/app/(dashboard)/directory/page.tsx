import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/Header';
import Link from 'next/link';
import { Users, MapPin, Award, Eye, EyeOff, Edit, Globe } from 'lucide-react';

interface StylistProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  profile_photo_url: string | null;
  salon_name: string | null;
  city: string | null;
  state: string | null;
  country: string;
  instagram_handle: string | null;
  booking_url: string | null;
  is_public: boolean;
  created_at: string;
  profile: {
    email: string;
    full_name: string | null;
  } | null;
  certifications: {
    status: string;
    approved_at: string | null;
  }[];
  certification: {
    status: string;
    approved_at: string | null;
  } | null;
}

async function getStylistProfiles(): Promise<StylistProfile[]> {
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from('stylist_profiles')
    .select(`
      *,
      profile:profiles (
        email,
        full_name
      ),
      certifications:user_certifications (
        status,
        approved_at
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching stylist profiles:', error);
    return [];
  }

  return (profiles || []).map(p => {
    const certifications = (Array.isArray(p.certifications)
      ? p.certifications
      : []) as StylistProfile['certifications'];
    const approved = certifications.find((c) => c.status === 'approved') || null;
    return {
      ...p,
      certifications,
      certification: approved || certifications[0] || null,
    };
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function DirectoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profiles = await getStylistProfiles();

  const publicProfiles = profiles.filter(p => p.is_public);
  const certifiedProfiles = profiles.filter(p => p.certifications.some((c) => c.status === 'approved'));
  const totalProfiles = profiles.length;

  return (
    <>
      <Header user={user} title="Stylist Directory" />
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Profiles</p>
                <p className="text-2xl font-semibold">{totalProfiles}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Globe className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Public Profiles</p>
                <p className="text-2xl font-semibold">{publicProfiles.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Certified Stylists</p>
                <p className="text-2xl font-semibold">{certifiedProfiles.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <EyeOff className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Hidden Profiles</p>
                <p className="text-2xl font-semibold">{totalProfiles - publicProfiles.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <p className="text-gray-600">
            Manage stylist profiles for the public directory. Certified stylists can create their
            profiles from the mobile app and choose to be listed publicly.
          </p>
        </div>

        {/* Profiles Table */}
        {profiles.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No stylist profiles yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Profiles will appear here when certified stylists create their directory listings.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stylist
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visibility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {profile.profile_photo_url ? (
                          <img
                            src={profile.profile_photo_url}
                            alt={profile.display_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">{profile.display_name}</div>
                          <div className="text-sm text-gray-500">
                            {profile.profile?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {profile.city || profile.state ? (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                          {[profile.city, profile.state].filter(Boolean).join(', ')}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {profile.salon_name || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      {profile.certification?.status === 'approved' ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          <Award className="w-3 h-3 mr-1" />
                          Certified
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Not certified</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {profile.is_public ? (
                        <span className="inline-flex items-center text-sm text-green-600">
                          <Eye className="w-4 h-4 mr-1" />
                          Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-sm text-gray-400">
                          <EyeOff className="w-4 h-4 mr-1" />
                          Hidden
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(profile.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/directory/${profile.id}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
