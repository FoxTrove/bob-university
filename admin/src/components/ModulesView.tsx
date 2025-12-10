'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  FolderOpen,
  Edit,
  Trash2,
  Video,
  GripVertical,
  LayoutGrid,
  List,
  Clock,
  Eye,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createClient } from '@/lib/supabase/client';

interface Module {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  videos: { id: string }[];
  total_duration?: number;
  total_views?: number;
}

// Sortable Module Card for Grid View
function SortableModuleCard({
  module,
  onDelete,
}: {
  module: Module;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg shadow overflow-hidden ${isDragging ? 'shadow-xl' : ''}`}
    >
      <div className="relative h-32 bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
        {module.thumbnail_url ? (
          <img
            src={module.thumbnail_url}
            alt={module.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <FolderOpen className="w-12 h-12 text-white/80" />
        )}
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 p-1.5 bg-black/30 rounded cursor-grab active:cursor-grabbing hover:bg-black/50"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4 text-white" />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{module.title}</h3>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              module.is_published
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {module.is_published ? 'Published' : 'Draft'}
          </span>
        </div>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {module.description || 'No description'}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <Video className="w-4 h-4 mr-1" />
            {module.videos?.length || 0} videos
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href={`/modules/${module.id}`}
              className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={() => onDelete(module.id)}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sortable Module Row for List View
function SortableModuleRow({
  module,
  onDelete,
}: {
  module: Module;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const totalDuration = module.total_duration || 0;
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);
  const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-gray-50 ${isDragging ? 'bg-blue-50 shadow-lg' : ''}`}
    >
      <td className="px-4 py-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center">
          <div className="w-16 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded flex items-center justify-center mr-3 overflow-hidden flex-shrink-0">
            {module.thumbnail_url ? (
              <img
                src={module.thumbnail_url}
                alt={module.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <FolderOpen className="w-5 h-5 text-white/80" />
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/modules/${module.id}`}
              className="font-medium text-gray-900 hover:text-blue-600 truncate block"
            >
              {module.title}
            </Link>
            <p className="text-xs text-gray-500 truncate max-w-xs">
              {module.description || 'No description'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            module.is_published
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {module.is_published ? 'Published' : 'Draft'}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        <div className="flex items-center">
          <Video className="w-4 h-4 mr-1" />
          {module.videos?.length || 0}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          {durationStr}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        <div className="flex items-center">
          <Eye className="w-4 h-4 mr-1" />
          {module.total_views || 0}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end space-x-2">
          <Link
            href={`/modules/${module.id}`}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={() => onDelete(module.id)}
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

export function ModulesView({ initialModules }: { initialModules: Module[] }) {
  const [modules, setModules] = useState(initialModules);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = modules.findIndex((m) => m.id === active.id);
      const newIndex = modules.findIndex((m) => m.id === over.id);

      const newModules = arrayMove(modules, oldIndex, newIndex);
      setModules(newModules);

      // Update sort_order in database
      const updates = newModules.map((module, index) => ({
        id: module.id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('modules')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }
    }
  };

  const handleDelete = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module? Videos will be unassigned but not deleted.')) {
      return;
    }

    const { error } = await supabase.from('modules').delete().eq('id', moduleId);

    if (!error) {
      setModules(modules.filter((m) => m.id !== moduleId));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <p className="text-gray-600">{modules.length} modules</p>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
        <Link
          href="/modules/new"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Module
        </Link>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {viewMode === 'grid' ? (
          <SortableContext
            items={modules.map((m) => m.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <SortableModuleCard
                  key={module.id}
                  module={module}
                  onDelete={handleDelete}
                />
              ))}
              {modules.length === 0 && (
                <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
                  <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No modules yet. Create your first module to organize videos.
                  </p>
                </div>
              )}
            </div>
          </SortableContext>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Videos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <SortableContext
                items={modules.map((m) => m.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody className="bg-white divide-y divide-gray-200">
                  {modules.map((module) => (
                    <SortableModuleRow
                      key={module.id}
                      module={module}
                      onDelete={handleDelete}
                    />
                  ))}
                  {modules.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No modules yet. Create your first module to organize videos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </SortableContext>
            </table>
          </div>
        )}
      </DndContext>

      <p className="text-xs text-gray-500 mt-4">
        Drag modules to reorder them
      </p>
    </div>
  );
}
