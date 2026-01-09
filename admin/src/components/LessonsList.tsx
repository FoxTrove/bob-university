'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Plus, Search, LayoutGrid, List as ListIcon, Filter, Play, Check, ChevronDown, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { VideoRow } from './VideoRow';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  mux_playback_id: string | null;
  is_published: boolean;
  is_free: boolean;
  duration_seconds: number | null;
  created_at: string;
  modules?: {
    id: string;
    title: string;
  } | null;
}

interface LessonsListProps {
  initialVideos: Video[];
}

type ViewMode = 'list' | 'grid';
type SortOption = 'newest' | 'oldest' | 'title';

function FilterDropdown({ 
    title, 
    options, 
    selected, 
    onChange 
}: { 
    title: string; 
    options: string[]; 
    selected: string[]; 
    onChange: (val: string[]) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (option: string) => {
        const newSelected = selected.includes(option)
            ? selected.filter(s => s !== option)
            : [...selected, option];
        onChange(newSelected);
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 bg-white ${selected.length > 0 ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-300 text-gray-700'}`}
            >
                <span>{title}</span>
                {selected.length > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 text-xs text-white bg-blue-600 rounded-full">
                        {selected.length}
                    </span>
                )}
                <ChevronDown className="w-4 h-4" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                    <div className="p-2 space-y-1">
                        {options.map((option) => (
                            <div
                                key={option}
                                onClick={() => toggleOption(option)}
                                className="flex items-center px-2 py-2 text-sm text-gray-700 rounded hover:bg-gray-100 cursor-pointer"
                            >
                                <div className={`w-4 h-4 mr-3 border rounded flex items-center justify-center ${selected.includes(option) ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`}>
                                    {selected.includes(option) && <Check className="w-3 h-3 text-white" />}
                                </div>
                                {option}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function LessonsList({ initialVideos }: LessonsListProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchTerm, setSearchTerm] = useState('');

  // Filters
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedAccess, setSelectedAccess] = useState<string[]>([]);

  // Derived Options
  const distinctModules = Array.from(new Set(initialVideos.map(v => v.modules?.title).filter(Boolean))) as string[];
  const statusOptions = ['Published', 'Draft'];
  const accessOptions = ['Free', 'Premium'];

  useEffect(() => {
    // Load preferences
    const savedView = localStorage.getItem('lessonsViewMode') as ViewMode;
    const savedSort = localStorage.getItem('lessonsSortBy') as SortOption;
    
    // Load filters
    try {
        const savedMods = localStorage.getItem('lessonsFilterModules');
        const savedStats = localStorage.getItem('lessonsFilterStatus');
        const savedAccess = localStorage.getItem('lessonsFilterAccess');
        
        if (savedView) setViewMode(savedView);
        if (savedSort) setSortBy(savedSort);
        if (savedMods) setSelectedModules(JSON.parse(savedMods));
        if (savedStats) setSelectedStatus(JSON.parse(savedStats));
        if (savedAccess) setSelectedAccess(JSON.parse(savedAccess));
    } catch (e) {
        console.error('Failed to parse saved filters', e);
    }
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('lessonsViewMode', mode);
  };

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    localStorage.setItem('lessonsSortBy', sort);
  };

  const updateFilters = (key: string, val: string[], setter: (v: string[]) => void) => {
      setter(val);
      localStorage.setItem(key, JSON.stringify(val));
  };

  const clearFilters = () => {
      updateFilters('lessonsFilterModules', [], setSelectedModules);
      updateFilters('lessonsFilterStatus', [], setSelectedStatus);
      updateFilters('lessonsFilterAccess', [], setSelectedAccess);
      setSearchTerm('');
  };

  const processedVideos = initialVideos
    .filter(video => {
      // Search
      const matchesSearch = 
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.modules?.title?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Module Filter
      const moduleName = video.modules?.title || 'Unassigned';
      const matchesModule = selectedModules.length === 0 || selectedModules.includes(moduleName);

      // Status Filter
      const status = video.is_published ? 'Published' : 'Draft';
      const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(status);

      // Access Filter
      const access = video.is_free ? 'Free' : 'Premium';
      const matchesAccess = selectedAccess.length === 0 || selectedAccess.includes(access);

      return matchesSearch && matchesModule && matchesStatus && matchesAccess;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasActiveFilters = selectedModules.length > 0 || selectedStatus.length > 0 || selectedAccess.length > 0 || searchTerm;

  return (
    <div className="p-6">
       {/* Actions Bar */}
       <div className="space-y-4 mb-6">
         {/* Top Row: Count & New Lesson */}
         <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
                {processedVideos.length} <span className="text-gray-500 text-sm font-normal">lessons</span>
            </h2>
             <Link
                href="/videos/upload"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
                <Plus className="w-4 h-4 mr-2" />
                New Lesson
            </Link>
         </div>
         
         {/* Filter Row */}
         <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             {/* Search */}
             <div className="relative flex-1 min-w-[200px] w-full md:w-auto">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                 <input
                    type="text"
                    placeholder="Search lessons..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                 />
             </div>
             
             {/* Filters Group */}
             <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                 <FilterDropdown 
                    title="Module" 
                    options={distinctModules} 
                    selected={selectedModules} 
                    onChange={(val) => updateFilters('lessonsFilterModules', val, setSelectedModules)} 
                 />
                 <FilterDropdown 
                    title="Status" 
                    options={statusOptions} 
                    selected={selectedStatus} 
                    onChange={(val) => updateFilters('lessonsFilterStatus', val, setSelectedStatus)} 
                 />
                 <FilterDropdown 
                    title="Access" 
                    options={accessOptions} 
                    selected={selectedAccess} 
                    onChange={(val) => updateFilters('lessonsFilterAccess', val, setSelectedAccess)} 
                 />
                 
                 {hasActiveFilters && (
                     <button 
                        onClick={clearFilters}
                        className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                     >
                         <X className="w-4 h-4 mr-1" />
                         Clear
                     </button>
                 )}
             </div>

             <div className="hidden md:block w-px h-8 bg-gray-200 mx-2"></div>

             {/* Sort & View */}
             <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                    className="pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="title">A-Z</option>
                </select>
                
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
                        <ListIcon className="w-4 h-4" />
                    </button>
                </div>
             </div>
         </div>
       </div>

       {/* Content */}
       {processedVideos.length === 0 ? (
         <div className="bg-white rounded-lg shadow-sm p-12 text-center border">
           <Play className="w-12 h-12 text-gray-300 mx-auto mb-4" />
           <p className="text-gray-500">No lessons found matching your criteria.</p>
         </div>
       ) : viewMode === 'list' ? (
         <div className="bg-white rounded-lg shadow overflow-hidden">
           <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50">
               <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Video</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                 <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
               </tr>
             </thead>
             <tbody className="bg-white divide-y divide-gray-200">
               {processedVideos.map((video) => (
                 <VideoRow key={video.id} video={video} />
               ))}
             </tbody>
           </table>
         </div>
       ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {processedVideos.map(video => {
               const thumb = video.thumbnail_url || (video.mux_playback_id
                 ? `https://image.mux.com/${video.mux_playback_id}/thumbnail.jpg?width=640&height=360&fit_mode=smartcrop`
                 : null);

               return (
                  <div key={video.id} className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow group overflow-hidden cursor-pointer" onClick={() => router.push(`/videos/${video.id}`)}>
                      {/* Thumbnail */}
                      <div className="aspect-video bg-gray-100 relative">
                        {thumb ? (
                            <img src={thumb} alt={video.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Play className="w-10 h-10 opacity-50" />
                            </div>
                        )}
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                             {formatDuration(video.duration_seconds)}
                        </div>
                        
                        {/* Status Badges Overlay */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${video.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {video.is_published ? 'Published' : 'Draft'}
                            </span>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="p-4">
                          <h3 className="font-medium text-gray-900 truncate" title={video.title}>{video.title}</h3>
                          <div className="text-xs text-gray-500 mt-1 mb-3">
                              {video.modules?.title || 'Unassigned'}
                          </div>
                      </div>
                  </div>
               );
           })}
         </div>
       )}
    </div>
  );
}
