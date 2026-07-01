/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BedDouble, Users, CreditCard, Utensils, Package, ScrollText, UserCog, ClipboardCheck, Wallet, FileBarChart, ShieldAlert, DatabaseBackup, Settings } from 'lucide-react';

const bottomItems = [
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

export const BottomNav = () => (
  <nav className="h-[68px] bg-bg-surface border-t border-border flex items-center overflow-x-auto overflow-y-hidden px-4 gap-1 shrink-0 scrollbar-none">
    {bottomItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors min-w-[72px] min-h-[52px] ${
            isActive
              ? 'bg-accent-primary bg-opacity-10 text-accent-primary'
              : 'text-text-muted hover:bg-bg-elevated hover:text-text-primary'
          }`
        }
      >
        <item.icon size={18} />
        <span className="whitespace-nowrap">{item.label}</span>
      </NavLink>
    ))}
  </nav>
);
