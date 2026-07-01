/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';

export const MainLayout = () => {
  return (
    <div className="flex h-screen bg-bg-base">
      <Sidebar />
      <div className="flex-1 ml-[240px] flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-8 pb-6">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
};
