/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Bell, Building, CheckCircle2, CreditCard, Database, Globe, Loader2, Moon, Palette, Save, Settings, Shield, Sun } from 'lucide-react';
import apiClient from '../../api/client';
import { useTheme } from '../../context/ThemeContext';

interface AppSettings {
  hotel_name: string; hotel_address: string; hotel_phone: string; hotel_email: string;
  currency: string; timezone: string; check_in_time: string; check_out_time: string;
  tax_rate: number; late_checkout_fee: number;
  auto_backup_enabled: boolean; auto_backup_time: string; retention_days: number;
  smtp_host: string; smtp_port: number; smtp_username: string; smtp_password: string;
  theme_primary_color: string; theme_secondary_color: string; theme_accent_color: string;
  theme_background_color: string; theme_sidebar_color: string; theme_font_family: string; theme_dark_mode: boolean;
}

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4000); };
  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => { const res = await apiClient.get('/api/v1/settings'); return res.data; },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<AppSettings>) => { const res = await apiClient.patch('/api/v1/settings', updatedSettings); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings'] }); showSuccess('Settings updated successfully'); },
    onError: (error: any) => showError(error.response?.data?.detail || 'Failed to update settings'),
  });

  const [formData, setFormData] = useState<Partial<AppSettings>>({
    hotel_name: '', hotel_address: '', hotel_phone: '', hotel_email: '',
    currency: 'NGN', timezone: 'Africa/Lagos', check_in_time: '14:00', check_out_time: '12:00',
    tax_rate: 7.5, late_checkout_fee: 5000,
    auto_backup_enabled: true, auto_backup_time: '02:00', retention_days: 30,
    smtp_host: '', smtp_port: 587, smtp_username: '', smtp_password: '',
    theme_primary_color: '#4F7FFF', theme_secondary_color: '#64748b', theme_accent_color: '#F5A623',
    theme_background_color: '#0F1117', theme_sidebar_color: '#1A1D27', theme_font_family: 'Inter', theme_dark_mode: true,
  });

  useEffect(() => { if (settings) setFormData(settings); }, [settings]);

  const handleChange = (field: keyof AppSettings, value: any) => setFormData({ ...formData, [field]: value });
  const handleSave = () => updateSettingsMutation.mutate(formData);

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-text-muted mb-1.5">Hotel Name *</label><input className="input-base" value={formData.hotel_name || ''} onChange={(e) => handleChange('hotel_name', e.target.value)} placeholder="Amirable Hotel" /></div>
        <div><label className="block text-sm font-medium text-text-muted mb-1.5">Hotel Phone</label><input className="input-base" value={formData.hotel_phone || ''} onChange={(e) => handleChange('hotel_phone', e.target.value)} placeholder="+234 800 123 4567" /></div>
      </div>
      <div><label className="block text-sm font-medium text-text-muted mb-1.5">Hotel Address</label><textarea className="input-base min-h-[80px] resize-none" value={formData.hotel_address || ''} onChange={(e) => handleChange('hotel_address', e.target.value)} placeholder="123 Hotel Street, Lagos, Nigeria" /></div>
      <div><label className="block text-sm font-medium text-text-muted mb-1.5">Hotel Email</label><input className="input-base" type="email" value={formData.hotel_email || ''} onChange={(e) => handleChange('hotel_email', e.target.value)} placeholder="info@amirablehotel.com" /></div>
    </div>
  );

  const renderBusinessTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><label className="block text-sm font-medium text-text-muted mb-1.5">Currency</label>
          <select className="input-base" value={formData.currency || 'NGN'} onChange={(e) => handleChange('currency', e.target.value)}>
            <option value="NGN">Nigerian Naira (₦)</option>
            <option value="USD">US Dollar ($)</option>
            <option value="EUR">Euro (€)</option>
            <option value="GBP">British Pound (£)</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium text-text-muted mb-1.5">Timezone</label>
          <select className="input-base" value={formData.timezone || 'Africa/Lagos'} onChange={(e) => handleChange('timezone', e.target.value)}>
            <option value="Africa/Lagos">West Africa Time (WAT)</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="Europe/London">London (GMT)</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium text-text-muted mb-1.5">Tax Rate (%)</label><input className="input-base" type="number" min="0" max="100" step="0.1" value={formData.tax_rate || 0} onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value))} /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-text-muted mb-1.5">Check-in Time</label><input className="input-base" type="time" value={formData.check_in_time || '14:00'} onChange={(e) => handleChange('check_in_time', e.target.value)} /></div>
        <div><label className="block text-sm font-medium text-text-muted mb-1.5">Check-out Time</label><input className="input-base" type="time" value={formData.check_out_time || '12:00'} onChange={(e) => handleChange('check_out_time', e.target.value)} /></div>
      </div>
      <div><label className="block text-sm font-medium text-text-muted mb-1.5">Late Check-out Fee</label><input className="input-base" type="number" min="0" value={formData.late_checkout_fee || 0} onChange={(e) => handleChange('late_checkout_fee', parseFloat(e.target.value))} /></div>
    </div>
  );

  const renderBackupTab = () => (
    <div className="space-y-6">
      <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
        <input type="checkbox" checked={formData.auto_backup_enabled || false} onChange={(e) => handleChange('auto_backup_enabled', e.target.checked)} className="rounded border-border bg-bg-elevated" />
        Enable Automatic Backups
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-text-muted mb-1.5">Backup Time</label><input className="input-base" type="time" value={formData.auto_backup_time || '02:00'} onChange={(e) => handleChange('auto_backup_time', e.target.value)} disabled={!formData.auto_backup_enabled} /></div>
        <div><label className="block text-sm font-medium text-text-muted mb-1.5">Retention Period (days)</label><input className="input-base" type="number" min="1" max="365" value={formData.retention_days || 30} onChange={(e) => handleChange('retention_days', parseInt(e.target.value))} disabled={!formData.auto_backup_enabled} /></div>
      </div>
    </div>
  );

  const renderEmailTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-text-muted mb-1.5">SMTP Host</label><input className="input-base" value={formData.smtp_host || ''} onChange={(e) => handleChange('smtp_host', e.target.value)} placeholder="smtp.gmail.com" /></div>
        <div><label className="block text-sm font-medium text-text-muted mb-1.5">SMTP Port</label><input className="input-base" type="number" min="1" max="65535" value={formData.smtp_port || 587} onChange={(e) => handleChange('smtp_port', parseInt(e.target.value))} /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-text-muted mb-1.5">SMTP Username</label><input className="input-base" value={formData.smtp_username || ''} onChange={(e) => handleChange('smtp_username', e.target.value)} placeholder="your-email@gmail.com" /></div>
        <div><label className="block text-sm font-medium text-text-muted mb-1.5">SMTP Password</label><input className="input-base" type="password" value={formData.smtp_password || ''} onChange={(e) => handleChange('smtp_password', e.target.value)} placeholder="••••••••" /></div>
      </div>
      <div className="p-4 bg-bg-elevated border border-border rounded-lg">
        <p className="font-semibold mb-1">Email Settings Note</p>
        <p className="text-sm text-text-muted">Configure SMTP settings for sending email notifications, receipts, and reports. For Gmail, you may need to use an App Password if 2-factor authentication is enabled.</p>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="p-4 bg-accent-primary bg-opacity-10 border border-accent-primary border-opacity-20 rounded-lg flex items-start gap-3">
        <Shield size={20} className="text-accent-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-accent-primary">Security Features</p>
          <p className="text-sm text-text-muted mt-1">Amirable Hotel Management System includes built-in security features: Password hashing with bcrypt, JWT-based authentication, Role-based access control, Audit logging, Automatic session timeout.</p>
        </div>
      </div>
      <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-lg border border-border">
        <div><p className="font-semibold">Session Timeout</p><p className="text-sm text-text-muted">Automatic logout after inactivity</p></div>
        <select className="input-base max-w-[140px]" defaultValue="15">
          <option value="5">5 minutes</option>
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="60">60 minutes</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
        <input type="checkbox" defaultChecked className="rounded border-border bg-bg-elevated" />
        Force password change every 90 days
      </label>
      <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
        <input type="checkbox" defaultChecked className="rounded border-border bg-bg-elevated" />
        Lock account after 5 failed login attempts
      </label>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <p className="font-semibold mb-3">Theme Mode</p>
        <p className="text-sm text-text-muted mb-4">Choose between dark and light mode. Dark mode is the default.</p>
        <div className="flex gap-4">
          <button onClick={() => setTheme('dark')} className={`flex-1 p-6 rounded-lg border-2 transition-all text-center ${theme === 'dark' ? 'border-accent-primary bg-accent-primary bg-opacity-10' : 'border-border bg-bg-elevated hover:border-text-muted'}`}>
            <Moon size={32} className={`mx-auto mb-2 ${theme === 'dark' ? 'text-accent-primary' : 'text-text-muted'}`} />
            <p className={`font-semibold ${theme === 'dark' ? 'text-accent-primary' : 'text-text-primary'}`}>Dark Mode</p>
            <p className="text-xs text-text-muted mt-1">Default • Easy on the eyes</p>
          </button>
          <button onClick={() => setTheme('light')} className={`flex-1 p-6 rounded-lg border-2 transition-all text-center ${theme === 'light' ? 'border-accent-primary bg-accent-primary bg-opacity-10' : 'border-border bg-bg-elevated hover:border-text-muted'}`}>
            <Sun size={32} className={`mx-auto mb-2 ${theme === 'light' ? 'text-accent-primary' : 'text-text-muted'}`} />
            <p className={`font-semibold ${theme === 'light' ? 'text-accent-primary' : 'text-text-primary'}`}>Light Mode</p>
            <p className="text-xs text-text-muted mt-1">Brighter interface</p>
          </button>
        </div>
      </div>
      <div className="border-t border-border pt-6">
        <p className="font-semibold mb-4">Theme Customization</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-text-muted mb-1.5">Primary Color</label><input className="input-base" type="color" value={formData.theme_primary_color || '#4F7FFF'} onChange={(e) => handleChange('theme_primary_color', e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-text-muted mb-1.5">Font Family</label><select className="input-base" value={formData.theme_font_family || 'Inter'} onChange={(e) => handleChange('theme_font_family', e.target.value)}><option value="Inter">Inter</option><option value="System UI">System UI</option><option value="Arial">Arial</option></select></div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <p className="font-semibold mb-3">Email Notifications</p>
        <div className="space-y-2">
          {[
            { id: 'email_receipts', label: 'Send email receipts for payments' },
            { id: 'email_checkin', label: 'Send check-in confirmation emails' },
            { id: 'email_checkout', label: 'Send check-out summary emails' },
          ].map(item => (
            <label key={item.id} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-border bg-bg-elevated" />{item.label}
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="font-semibold mb-3">System Alerts</p>
        <div className="space-y-2">
          {[
            { id: 'alert_low_stock', label: 'Low inventory alerts' },
            { id: 'alert_overdue', label: 'Overdue payment alerts' },
            { id: 'alert_maintenance', label: 'Room maintenance alerts' },
          ].map(item => (
            <label key={item.id} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-border bg-bg-elevated" />{item.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'general', label: 'General', icon: <Building size={16} /> },
    { id: 'business', label: 'Business', icon: <CreditCard size={16} /> },
    { id: 'backup', label: 'Backup', icon: <Database size={16} /> },
    { id: 'email', label: 'Email', icon: <Globe size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralTab();
      case 'business': return renderBusinessTab();
      case 'backup': return renderBackupTab();
      case 'email': return renderEmailTab();
      case 'security': return renderSecurityTab();
      case 'appearance': return renderAppearanceTab();
      case 'notifications': return renderNotificationsTab();
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Settings size={28} className="text-accent-primary" />
            Settings
          </h2>
          <p className="text-text-muted mt-1">Configure application settings and preferences</p>
        </div>
        <button onClick={handleSave} disabled={updateSettingsMutation.isPending} className="btn-primary gap-2">
          {updateSettingsMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {errorMsg && (<div className="p-3 bg-status-red bg-opacity-10 border border-status-red border-opacity-20 rounded flex items-start gap-3 text-status-red text-sm"><AlertCircle size={18} className="shrink-0 mt-0.5" /><p>{errorMsg}</p></div>)}
      {successMsg && (<div className="p-3 bg-status-green bg-opacity-10 border border-status-green border-opacity-20 rounded flex items-start gap-3 text-status-green text-sm"><CheckCircle2 size={18} className="shrink-0 mt-0.5" /><p>{successMsg}</p></div>)}

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-56 shrink-0">
          <div className="bg-bg-surface border border-border rounded-lg overflow-hidden">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors min-h-[44px] text-left ${activeTab === tab.id ? 'bg-accent-primary text-white' : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="card-surface">
            <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
              {tabs.find(t => t.id === activeTab)?.icon}
              {tabs.find(t => t.id === activeTab)?.label} Settings
            </h3>
            <p className="text-sm text-text-muted mb-6">Configure {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} settings</p>
            {isLoading ? (
              <div className="py-8 flex justify-center"><Loader2 size={32} className="animate-spin text-accent-primary" /></div>
            ) : renderTabContent()}
          </div>
        </div>
      </div>

      <div className="card-surface">
        <h3 className="text-lg font-semibold mb-4">System Information</h3>
        <p className="text-sm text-text-muted mb-4">Technical details about the application</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div><p className="text-sm text-text-muted">Application Version</p><p className="font-medium">1.0.0</p></div>
          <div><p className="text-sm text-text-muted">Build Date</p><p className="font-medium">{new Date().toLocaleDateString()}</p></div>
          <div><p className="text-sm text-text-muted">License</p><p className="font-medium">Proprietary</p></div>
          <div><p className="text-sm text-text-muted">Developer</p><p className="font-medium">DroneBug Technologies</p></div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
