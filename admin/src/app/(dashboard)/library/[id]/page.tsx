'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import { User } from '@supabase/supabase-js';
import MuxPlayer from '@mux/mux-player-react';
import { ArrowLeft, Save, Trash2, CheckCircle, XCircle, X } from 'lucide-react';
import Link from 'next/link';

interface LibraryItem {
  id: string;
  title: string;
  filename: string | null;
  mux_asset_id: string;
  mux_playback_id: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export default function LibraryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  
  const [item, setItem] = useState<LibraryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [filename, setFilename] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);

    const { data, error } = await supabase
      .from('video_library')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching library item:', error);
      setError('Failed to load video');
    } else {
      setItem(data);
      setTitle(data.title);
      setFilename(data.filename || '');
    }
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  async function handleSave() {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const { error: updateError } = await supabase
      .from('video_library')
      .update({
        title: title.trim(),
        filename: filename.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccessMessage('Video details saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setSaving(false);
  }
  
  async function handleDelete() {
      if (!confirm('Are you sure you want to delete this video from the library? This might break Lessons using it.')) {
          return;
      }
      
      setDeleting(true);
      const { error: deleteError } = await supabase
        .from('video_library')
        .delete()
        .eq('id', id);
        
      if (deleteError) {
          setError(deleteError.message);
          setDeleting(false);
      } else {
          router.push('/library');
      }
  }

  if (loading) {
    return (
      <>
        <Header user={user} title="Edit Video" />
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <Header user={user} title="Video Not Found" />
        <div className="p-6 text-center">
            <div className="text-gray-500 mb-4">Video not found.</div>
            <Link href="/library" className="text-blue-600 hover:underline">Back to Library</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header user={user} title="Edit Video Details" />
      <div className="p-6 max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          href="/library"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
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

        <div className="bg-white rounded-lg shadow overflow-hidden">
             {/* Player Section */}
             <div className="aspect-video bg-black w-full">
                 {item.mux_playback_id ? (
                     <MuxPlayer
                        streamType="on-demand"
                        playbackId={item.mux_playback_id}
                        metadata={{
                            video_id: item.id,
                            video_title: item.title,
                        }}
                        className="w-full h-full"
                     />
                 ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-500">
                         No Playback ID available
                     </div>
                 )}
             </div>
             
             {/* Form Section */}
             <div className="p-6">
                 <div className="grid gap-6">
                     <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">
                             Title
                         </label>
                         <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                         />
                     </div>
                     
                     <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">
                             Original Filename
                         </label>
                         <input
                            type="text"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700 bg-gray-50"
                         />
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 pt-4 border-t">
                         <div>
                             <span className="font-medium text-gray-700">Mux Asset ID:</span> {item.mux_asset_id}
                         </div>
                         <div>
                             <span className="font-medium text-gray-700">Created:</span> {new Date(item.created_at).toLocaleDateString()}
                         </div>
                     </div>
                 </div>
                 
                 <div className="mt-8 flex items-center justify-between">
                     <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center text-red-600 hover:text-red-700 disabled:opacity-50"
                     >
                         <Trash2 className="w-4 h-4 mr-2" />
                         {deleting ? 'Deleting...' : 'Delete Video'}
                     </button>
                     
                     <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                     >
                         <Save className="w-4 h-4 mr-2" />
                         {saving ? 'Saving...' : 'Save Changes'}
                     </button>
                 </div>
             </div>
        </div>
      </div>
    </>
  );
}
