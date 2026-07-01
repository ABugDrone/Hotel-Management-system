/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { Moon, Sun, User } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useTheme } from '../../context/ThemeContext';

export const Topbar = () => {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-bg-surface border-b border-border flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* Breadcrumbs or Page Title could go here */}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-muted hover:text-accent-primary hover:border-accent-primary transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="text-right">
          <p className="text-sm font-medium text-text-primary">{user?.full_name}</p>
          <span className="text-[10px] bg-bg-elevated text-accent-primary px-2 py-0.5 rounded border border-border uppercase font-bold tracking-wider">
            {user?.role.replace('_', ' ')}
          </span>
        </div>
        <div className="w-10 h-10 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-muted">
          <User size={20} />
        </div>
      </div>
    </header>
  );
};
