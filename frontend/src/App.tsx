/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { loadConfig, AppConfig } from './config';
import { initApiClient } from './api/client';
import { LoginPage } from './pages/Login/LoginPage';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { RoomsPage } from './pages/Rooms/RoomsPage';
import { GuestsPage } from './pages/Guests/GuestsPage';
import { PaymentsPage } from './pages/Payments/PaymentsPage';
import DebtsPage from './pages/Debts/DebtsPage';
import RestaurantPage from './pages/Restaurant/RestaurantPage';
import InventoryPage from './pages/Inventory/InventoryPage';
import StaffPage from './pages/Staff/StaffPage';
import AttendancePage from './pages/Attendance/AttendancePage';
import PayrollPage from './pages/Payroll/PayrollPage';
import ReportsPage from './pages/Reports/ReportsPage';
import AuditPage from './pages/Audit/AuditPage';
import BackupPage from './pages/Backup/BackupPage';
import SettingsPage from './pages/Settings/SettingsPage';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';

const queryClient = new QueryClient();

function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    loadConfig().then((cfg) => {
      setConfig(cfg);
      initApiClient(cfg.api_base_url);
    });
  }, []);

  if (!config) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/guests" element={<GuestsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/debts" element={<DebtsPage />} />
            <Route path="/restaurant" element={<RestaurantPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/payroll" element={<PayrollPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/backup" element={<BackupPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* Future routes will go here */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
