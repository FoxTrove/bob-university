'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Save,
  Trash2,
  MapPin,
  Award,
  Eye,
  EyeOff,
  Instagram,
  Link as LinkIcon,
  Mail,
  Phone,
  Building2,
  Globe,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react';
import Link from 'next/link';

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
  latitude: number | null;
  longitude: number | null;
  contact_email: string | null;
  phone: string | null;
  instagram_handle: string | null;
  booking_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface UserCertification {
  id: string;
  status: string;
  approved_at: string | null;
}

interface Profile {
  email: string;
  full_name: string | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function DirectoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [stylistProfile, setStylistProfile] = useState<StylistProfile | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [certification, setCertification] = useState<UserCertification | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [salonName, setSalonName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('USA');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);

    // Get current user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser ? { email: currentUser.email || '' } : null);

    // Load stylist profile
    const { data: profileData, error: profileError } = await supabase
      .from('stylist_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (profileError) {
      setError('Failed to load stylist profile');
      setLoading(false);
      return;
    }

    setStylistProfile(profileData);
    setDisplayName(profileData.display_name);
    setBio(profileData.bio || '');
    setProfilePhotoUrl(profileData.profile_photo_url || '');
    setSalonName(profileData.salon_name || '');
    setCity(profileData.city || '');
    setState(profileData.state || '');
    setCountry(profileData.country || 'USA');
    setLatitude(profileData.latitude?.toString() || '');
    setLongitude(profileData.longitude?.toString() || '');
    setContactEmail(profileData.contact_email || '');
    setPhone(profileData.phone || '');
    setInstagramHandle(profileData.instagram_handle || '');
    setBookingUrl(profileData.booking_url || '');
    setIsPublic(profileData.is_public);

    // Load user profile info
    const { data: userData } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', profileData.user_id)
      .single();

    if (userData) {
      setUserProfile(userData);
    }

    // Load certification status
    const { data: certData } = await supabase
      .from('user_certifications')
      .select('id, status, approved_at')
      .eq('user_id', profileData.user_id)
      .single();

    if (certData) {
      setCertification(certData);
    }

    setLoading(false);
  }

  async function handleSave() {
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error: updateError } = await supabase
        .from('stylist_profiles')
        .update({
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          profile_photo_url: profilePhotoUrl.trim() || null,
          salon_name: salonName.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          country: country.trim() || 'USA',
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          contact_email: contactEmail.trim() || null,
          phone: phone.trim() || null,
          instagram_handle: instagramHandle.trim() || null,
          booking_url: bookingUrl.trim() || null,
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setSuccessMessage('Profile saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this stylist profile? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('stylist_profiles')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      router.push('/directory');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile');
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header user={user} title="Edit Stylist Profile" />
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </>
    );
  }

  if (!stylistProfile) {
    return (
      <>
        <Header user={user} title="Edit Stylist Profile" />
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">Profile not found</p>
            <Link href="/directory" className="text-blue-600 hover:underline mt-2 inline-block">
              Back to Directory
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header user={user} title="Edit Stylist Profile" />
      <div className="p-6">
        {/* Back Link */}
        <Link
          href="/directory"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Directory
        </Link>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center">
            <XCircle className="w-5 h-5 mr-2" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Profile Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Name as shown in directory"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief bio about the stylist..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Photo URL
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={profilePhotoUrl}
                      onChange={(e) => setProfilePhotoUrl(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://..."
                    />
                    {profilePhotoUrl && (
                      <img
                        src={profilePhotoUrl}
                        alt="Profile preview"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Building2 className="w-4 h-4 inline mr-1" />
                      Salon Name
                    </label>
                    <input
                      type="text"
                      value={salonName}
                      onChange={(e) => setSalonName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Instagram className="w-4 h-4 inline mr-1" />
                      Instagram Handle
                    </label>
                    <input
                      type="text"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="@username"
                    />
                  </div>
                </div>

                <h3 className="text-md font-medium text-gray-900 pt-4 border-t">Location</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 40.7128"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., -74.0060"
                    />
                  </div>
                </div>

                <h3 className="text-md font-medium text-gray-900 pt-4 border-t">Contact</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <LinkIcon className="w-4 h-4 inline mr-1" />
                    Booking URL
                  </label>
                  <input
                    type="url"
                    value={bookingUrl}
                    onChange={(e) => setBookingUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Save/Delete Actions */}
              <div className="mt-6 pt-6 border-t flex items-center justify-between">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center px-4 py-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleting ? 'Deleting...' : 'Delete Profile'}
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Visibility Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Directory Visibility</h3>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3">
                  {isPublic ? (
                    <span className="flex items-center text-green-600">
                      <Eye className="w-4 h-4 mr-1" />
                      Public
                    </span>
                  ) : (
                    <span className="flex items-center text-gray-500">
                      <EyeOff className="w-4 h-4 mr-1" />
                      Hidden
                    </span>
                  )}
                </span>
              </label>
              <p className="mt-2 text-sm text-gray-500">
                {isPublic
                  ? 'This profile is visible in the public directory.'
                  : 'This profile is hidden from the public directory.'}
              </p>
            </div>

            {/* User Info Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">User Account</h3>
              {userProfile && (
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-500">Name:</span>{' '}
                    {userProfile.full_name || 'Not set'}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">Email:</span> {userProfile.email}
                  </p>
                </div>
              )}
            </div>

            {/* Certification Status Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Certification Status</h3>
              {certification ? (
                <div>
                  {certification.status === 'approved' ? (
                    <div className="flex items-center text-green-600">
                      <Award className="w-5 h-5 mr-2" />
                      <span className="font-medium">Ray-Certified Stylist</span>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      Status: <span className="capitalize">{certification.status}</span>
                    </div>
                  )}
                  {certification.approved_at && (
                    <p className="text-sm text-gray-500 mt-2">
                      Certified: {formatDate(certification.approved_at)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Not certified yet</p>
              )}
              <Link
                href="/certifications"
                className="text-blue-600 hover:underline text-sm mt-2 inline-block"
              >
                View certification details
              </Link>
            </div>

            {/* Metadata Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Profile Info</h3>
              <div className="space-y-2 text-sm text-gray-500">
                <p>Created: {formatDate(stylistProfile.created_at)}</p>
                <p>Updated: {formatDate(stylistProfile.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
