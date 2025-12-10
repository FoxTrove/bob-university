'use client';

import { useRouter } from 'next/navigation';
import { Play, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface VideoRowProps {
  video: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    mux_playback_id: string | null;
    is_published: boolean;
    is_free: boolean;
    duration_seconds: number | null;
    modules?: {
      title: string;
    } | null;
  };
}

export function VideoRow({ video }: VideoRowProps) {
  const router = useRouter();

  const thumbnailSrc = video.thumbnail_url
    || (video.mux_playback_id
      ? `https://image.mux.com/${video.mux_playback_id}/thumbnail.jpg?width=160&height=90&fit_mode=smartcrop`
      : null);

  const handleRowClick = () => {
    router.push(`/videos/${video.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/videos/${video.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement delete confirmation
  };

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer"
      onClick={handleRowClick}
    >
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="w-20 h-12 bg-gray-200 rounded flex items-center justify-center mr-4 overflow-hidden">
            {thumbnailSrc ? (
              <img
                src={thumbnailSrc}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Play className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{video.title}</p>
            {video.mux_playback_id && (
              <p className="text-xs text-green-600">Mux Ready</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {video.modules?.title || 'Unassigned'}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            video.is_published
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {video.is_published ? 'Published' : 'Draft'}
        </span>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            video.is_free
              ? 'bg-blue-100 text-blue-800'
              : 'bg-purple-100 text-purple-800'
          }`}
        >
          {video.is_free ? 'Free' : 'Premium'}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {video.duration_seconds
          ? `${Math.floor(video.duration_seconds / 60)}:${(video.duration_seconds % 60).toString().padStart(2, '0')}`
          : '-'}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={handleEditClick}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-2 text-gray-500 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
