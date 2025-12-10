'use client';

import { User } from '@supabase/supabase-js';

interface HeaderProps {
  user: User | null;
  title: string;
}

export function Header({ user, title }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {user?.email}
          </span>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
