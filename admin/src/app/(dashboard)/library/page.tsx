'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/Header';
import { User } from '@supabase/supabase-js';
import { Play, Plus, Search, LayoutGrid, List, Filter } from 'lucide-react';
import Link from 'next/link';

interface LibraryItem {
  id: string;
  title: string;
  filename: string | null;
  mux_asset_id: string;
  mux_playback_id: string | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  created_at: string;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'title' | 'duration';

export default function VideoLibraryPage() {
  const supabase = createClient();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<User | null>(null);
  
  // New UI states
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'grid';
    const savedView = localStorage.getItem('libraryViewMode') as ViewMode | null;
    return savedView === 'grid' || savedView === 'list' ? savedView : 'grid';
  });
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    if (typeof window === 'undefined') return 'newest';
    const savedSort = localStorage.getItem('librarySortBy') as SortOption | null;
    return savedSort === 'newest' || savedSort === 'oldest' || savedSort === 'title' || savedSort === 'duration'
      ? savedSort
      : 'newest';
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);

    const { data } = await supabase
      .from('video_library')
      .select('*')
      .order('created_at', { ascending: false });
    
    setItems(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('libraryViewMode', mode);
  };

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    localStorage.setItem('librarySortBy', sort);
  };

  const getThumbnail = (item: LibraryItem) => {
    if (item.thumbnail_url) return item.thumbnail_url;
    if (item.mux_playback_id) return `https://image.mux.com/${item.mux_playback_id}/thumbnail.png?width=640&height=360&fit_mode=smartcrop`;
    return null;
  };

  const processedItems = items
    .filter(item => 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.filename?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'duration':
          return (b.duration_seconds || 0) - (a.duration_seconds || 0);
        default:
          return 0;
      }
    });

  return (
    <>
      <Header user={user} title="Video Library" />
      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search library..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative w-48 hidden sm:block">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title (A-Z)</option>
                <option value="duration">Duration (Longest)</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            {/* View Mode Toggle */}
             <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button
                    onClick={() => handleViewModeChange('grid')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                    onClick={() => handleViewModeChange('list')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <List className="w-4 h-4" />
                </button>
            </div>
          </div>
          
          <Link
            href="/videos/upload" 
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload New Video
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : processedItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border">
            <Play className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No videos found</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
                // Grid View
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {processedItems.map((item) => {
                        const thumb = getThumbnail(item);
                        return (
                        <Link key={item.id} href={`/library/${item.id}`} className="block">
                          <div className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
                              {/* Thumbnail Area */}
                              <div className="aspect-video bg-gray-100 relative">
                              {thumb ? (
                                  <img 
                                  src={thumb} 
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                      // Fallback if image fails
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                  }}
                                  />
                              ) : null}
                              {/* Fallback Icon (initially hidden if thumb exists) */}
                              <div className={`w-full h-full flex items-center justify-center text-gray-400 absolute inset-0 bg-gray-100 ${thumb ? 'hidden' : ''}`}>
                                  <Play className="w-10 h-10 opacity-50" />
                              </div>
                              
                              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                                  {formatDuration(item.duration_seconds)}
                              </div>
                              </div>

                              {/* Content */}
                              <div className="p-4">
                              <h3 className="font-medium text-gray-900 truncate" title={item.title}>
                                  {item.title}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                  {item.filename || 'No filename'}
                              </p>
                              
                              <div className="flex items-center justify-between mt-4">
                                  <span className="text-xs text-gray-400">
                                  {new Date(item.created_at).toLocaleDateString()}
                                  </span>
                              </div>
                              </div>
                          </div>
                        </Link>
                        );
                    })}
                </div>
            ) : (
                // List View
                 <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Preview</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {processedItems.map((item) => {
                                const thumb = getThumbnail(item);
                                return (
                                <tr 
                                    key={item.id} 
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => window.location.href = `/library/${item.id}`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="w-16 h-9 bg-gray-100 rounded overflow-hidden relative">
                                            {thumb ? (
                                                <img src={thumb} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Play className="w-4 h-4 text-gray-300" />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{item.title}</div>
                                        <div className="text-xs text-gray-500 md:hidden">{item.filename}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.filename || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDuration(item.duration_seconds)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                 </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
