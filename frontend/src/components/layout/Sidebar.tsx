/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { LayoutDashboard, BedDouble, Users, CreditCard, Utensils, Package, ScrollText, UserCog, ClipboardCheck, Wallet, FileBarChart, ShieldAlert, DatabaseBackup, Settings, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

const SidebarItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-2 ${
        isActive 
          ? 'bg-bg-elevated text-accent-primary border-accent-primary' 
          : 'text-text-muted border-transparent hover:bg-bg-elevated hover:text-text-primary'
      }`
    }
  >
    <Icon size={20} />
    <span>{label}</span>
  </NavLink>
);

export const Sidebar = () => {
  const { logout, user } = useAuthStore();

  const menuItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/rooms', icon: BedDouble, label: 'Rooms' },
    { to: '/guests', icon: Users, label: 'Guests' },
    { to: '/payments', icon: CreditCard, label: 'Payments' },
    { to: '/restaurant', icon: Utensils, label: 'Restaurant' },
    { to: '/inventory', icon: Package, label: 'Inventory' },
    { to: '/debts', icon: ScrollText, label: 'Debts' },
    { to: '/staff', icon: UserCog, label: 'Staff' },
    { to: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
    { to: '/payroll', icon: Wallet, label: 'Payroll' },
    { to: '/reports', icon: FileBarChart, label: 'Reports' },
    { to: '/audit', icon: ShieldAlert, label: 'Audit' },
    { to: '/backup', icon: DatabaseBackup, label: 'Backup' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-[240px] h-screen bg-bg-surface border-r border-border flex flex-col fixed left-0 top-0 overflow-y-auto z-50">
      <div className="p-6">
        <h1 className="text-xl font-bold text-accent-primary tracking-tight">AMIRABLE</h1>
        <p className="text-[10px] text-text-muted mt-1 uppercase tracking-widest">Hotel Management</p>
      </div>
      
      <nav className="flex-1 mt-4">
        {menuItems.map((item) => (
          <SidebarItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-status-red hover:bg-bg-elevated w-full rounded transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
        <div className="mt-4 px-4">
          <p className="text-[10px] text-text-muted">v1.0.0</p>
          <p className="text-[10px] text-text-muted">DroneBug Technologies</p>
        </div>
      </div>
    </div>
  );
};
