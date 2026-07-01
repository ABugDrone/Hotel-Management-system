/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Archive, CheckCircle2, Cloud, Database, Download, HardDrive, Loader2, RefreshCw, Trash2, Upload, Usb, X } from 'lucide-react';
import apiClient from '../../api/client';

interface Backup {
  id: string;
  filename: string;
  size: number;
  backup_type: 'AUTO' | 'MANUAL' | 'SCHEDULED';
  created_at: string;
  created_by: string;
  notes: string | null;
  restore_status: 'AVAILABLE' | 'RESTORED' | 'CORRUPTED';
}

const BackupPage = () => {
  const queryClient = useQueryClient();
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [restoreNotes, setRestoreNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4000); };
  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };

  const { data: backups = [], isLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => { const res = await apiClient.get('/api/v1/backup'); return res.data; },
  });

  const { data: systemInfo } = useQuery({
    queryKey: ['system-info'],
    queryFn: async () => { const res = await apiClient.get('/api/v1/backup/system-info'); return res.data; },
  });

  const createBackupMutation = useMutation({
    mutationFn: async (notes: string) => { const res = await apiClient.post('/api/v1/backup/create', { notes }); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['backups'] }); showSuccess('Backup created successfully'); },
    onError: (error: any) => showError(error.response?.data?.detail || 'Failed to create backup'),
  });

  const restoreBackupMutation = useMutation({
    mutationFn: async ({ backupId, notes }: { backupId: string; notes: string }) => {
      const res = await apiClient.post(`/api/v1/backup/${backupId}/restore`, { notes }); return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      setRestoreDialogOpen(false);
      setSelectedBackup(null);
      setRestoreNotes('');
      showSuccess('Restore initiated. The system will restart.');
    },
    onError: (error: any) => showError(error.response?.data?.detail || 'Failed to restore backup'),
  });

  const deleteBackupMutation = useMutation({
    mutationFn: async (backupId: string) => { const res = await apiClient.delete(`/api/v1/backup/${backupId}`); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['backups'] }); showSuccess('Backup deleted successfully'); },
    onError: (error: any) => showError(error.response?.data?.detail || 'Failed to delete backup'),
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDateTime = (d: string) => new Date(d).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const typeStyle = (type: string) => {
    switch (type) {
      case 'AUTO': return 'text-accent-primary bg-accent-primary bg-opacity-10';
      case 'MANUAL': return 'text-status-green bg-status-green bg-opacity-10';
      case 'SCHEDULED': return 'text-text-muted bg-bg-elevated border border-border';
      default: return 'text-text-muted bg-bg-elevated';
    }
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'text-status-green bg-status-green bg-opacity-10';
      case 'RESTORED': return 'text-accent-primary bg-accent-primary bg-opacity-10';
      case 'CORRUPTED': return 'text-status-red bg-status-red bg-opacity-10';
      default: return 'text-text-muted bg-bg-elevated';
    }
  };

  const handleCreateBackup = () => createBackupMutation.mutate(`Manual backup created on ${new Date().toLocaleString()}`);
  const handleDeleteBackup = (id: string) => { if (confirm('Are you sure you want to delete this backup?')) deleteBackupMutation.mutate(id); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Archive size={28} className="text-accent-primary" />
            Backup & Restore
          </h2>
          <p className="text-text-muted mt-1">Manage database backups and system restoration</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => queryClient.invalidateQueries()} className="px-4 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors flex items-center gap-2 min-h-[44px]">
            <RefreshCw size={18} /> Refresh
          </button>
          <button onClick={handleCreateBackup} className="btn-primary gap-2">
            <Archive size={20} /> Create Backup
          </button>
        </div>
      </div>

      {errorMsg && (<div className="p-3 bg-status-red bg-opacity-10 border border-status-red border-opacity-20 rounded flex items-start gap-3 text-status-red text-sm"><AlertCircle size={18} className="shrink-0 mt-0.5" /><p>{errorMsg}</p></div>)}
      {successMsg && (<div className="p-3 bg-status-green bg-opacity-10 border border-status-green border-opacity-20 rounded flex items-start gap-3 text-status-green text-sm"><CheckCircle2 size={18} className="shrink-0 mt-0.5" /><p>{successMsg}</p></div>)}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Total Backups</p>
          <p className="text-3xl font-bold mt-2">{backups.length}</p>
          <p className="text-xs text-text-muted mt-1">Database backups</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Total Size</p>
          <p className="text-3xl font-bold mt-2">{formatFileSize(backups.reduce((t: number, b: Backup) => t + b.size, 0))}</p>
          <p className="text-xs text-text-muted mt-1">Combined backup size</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Last Backup</p>
          <p className="text-3xl font-bold mt-2">{backups.length > 0 ? new Date(backups[0].created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : 'Never'}</p>
          <p className="text-xs text-text-muted mt-1">Most recent backup</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Auto Backup</p>
          <p className="text-3xl font-bold text-status-green mt-2">Daily</p>
          <p className="text-xs text-text-muted mt-1">12:00 AM</p>
        </div>
      </div>

      {systemInfo && (
        <div className="card-surface">
          <h3 className="text-lg font-semibold mb-4">System Information</h3>
          <p className="text-sm text-text-muted mb-4">Current system status and database info</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-text-muted mb-1"><Database size={16} /><span>Database Size</span></div>
              <div className="font-semibold">{formatFileSize(systemInfo.db_size || 0)}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-text-muted mb-1"><HardDrive size={16} /><span>Free Space</span></div>
              <div className="font-semibold">{formatFileSize(systemInfo.free_space || 0)}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-text-muted mb-1"><Cloud size={16} /><span>Backup Path</span></div>
              <div className="font-mono text-sm truncate">{systemInfo.backup_path || 'N/A'}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-text-muted mb-1"><RefreshCw size={16} /><span>Last Check</span></div>
              <div className="font-semibold">{formatDateTime(systemInfo.last_check || new Date().toISOString())}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-surface">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <p className="text-sm text-text-muted mb-4">Common backup operations</p>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-text-muted mb-1">Create New Backup</p>
              <p className="text-xs text-text-muted mb-2">Create a manual backup of the current database</p>
              <button onClick={handleCreateBackup} className="btn-primary w-full gap-2"><Archive size={18} /> Create Manual Backup</button>
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted mb-1">Upload Backup File</p>
              <p className="text-xs text-text-muted mb-2">Upload a backup file from external storage</p>
              <div className="flex items-center gap-2">
                <input type="file" accept=".db,.sqlite,.backup" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="input-base flex-1 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-accent-primary file:text-white file:font-medium file:text-xs" />
                <button disabled={!uploadFile} className="px-4 py-2 rounded font-medium border border-border text-text-muted hover:bg-bg-elevated transition-colors disabled:opacity-50 flex items-center gap-2 min-h-[44px]">
                  <Upload size={18} /> Upload
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted mb-1">Export to USB</p>
              <p className="text-xs text-text-muted mb-2">Export latest backup to removable drive</p>
              <button className="w-full px-4 py-2 rounded font-medium border border-border text-text-primary hover:bg-bg-elevated transition-colors flex items-center justify-center gap-2 min-h-[44px]">
                <Usb size={18} /> Export to USB
              </button>
            </div>
          </div>
        </div>

        <div className="card-surface">
          <h3 className="text-lg font-semibold mb-4">Backup Settings</h3>
          <p className="text-sm text-text-muted mb-4">Configure backup preferences</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Auto Backup Schedule</label>
              <select className="input-base" defaultValue="DAILY">
                <option value="DISABLED">Disabled</option>
                <option value="HOURLY">Hourly</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Retention Period</label>
              <select className="input-base" defaultValue="30">
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Backup Location</label>
              <input className="input-base" defaultValue="C:\AmirableHotel\backups\" />
            </div>
            <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-border bg-bg-elevated" />
              Compress backups
            </label>
            <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
              <input type="checkbox" className="rounded border-border bg-bg-elevated" />
              Encrypt backups
            </label>
            <button className="btn-primary w-full">Save Settings</button>
          </div>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between mb-4 px-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold">Backup History</h3>
            <p className="text-sm text-text-muted">{backups.length} backup files available</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bg-elevated border-b border-border">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Filename</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Size</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center"><Loader2 size={32} className="animate-spin mx-auto text-accent-primary" /></td></tr>
              ) : backups.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-text-muted">No backups found</td></tr>
              ) : (
                backups.map((backup: Backup) => (
                  <tr key={backup.id} className="hover:bg-bg-elevated transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium">{backup.filename}</div>
                      <div className="text-xs text-text-muted truncate max-w-[200px]">{backup.notes || 'No notes'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{formatDateTime(backup.created_at)}</td>
                    <td className="px-6 py-4 text-sm">{formatFileSize(backup.size)}</td>
                    <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${typeStyle(backup.backup_type)}`}>{backup.backup_type}</span></td>
                    <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusStyle(backup.restore_status)}`}>{backup.restore_status}</span></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-text-muted hover:text-accent-primary transition-colors" title="Download"><Download size={18} /></button>
                        {backup.restore_status === 'AVAILABLE' && (
                          <button onClick={() => { setSelectedBackup(backup); setRestoreDialogOpen(true); }} className="px-3 py-1.5 rounded text-sm font-medium border border-border text-text-muted hover:bg-bg-elevated transition-colors">Restore</button>
                        )}
                        <button onClick={() => handleDeleteBackup(backup.id)} className="p-2 text-text-muted hover:text-status-red transition-colors" title="Delete"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {restoreDialogOpen && selectedBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => { setRestoreDialogOpen(false); setSelectedBackup(null); }} className="absolute right-4 top-4 text-text-muted hover:text-text-primary"><X size={24} /></button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><Archive className="text-accent-warm" /> Restore from Backup</h3>
            <p className="text-sm text-text-muted mb-6">This will restore the system from backup. All current data will be replaced.</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-bg-elevated rounded-lg border border-border">
                <span className="text-sm text-text-muted">Backup File</span>
                <span className="font-medium">{selectedBackup.filename}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-bg-elevated rounded-lg border border-border">
                  <span className="text-sm text-text-muted">Created</span>
                  <span>{formatDateTime(selectedBackup.created_at)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-bg-elevated rounded-lg border border-border">
                  <span className="text-sm text-text-muted">Size</span>
                  <span>{formatFileSize(selectedBackup.size)}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Restore Notes</label>
                <textarea className="input-base min-h-[80px] resize-none" value={restoreNotes} onChange={(e) => setRestoreNotes(e.target.value)} placeholder="Reason for restoration..." />
              </div>
              <div className="p-4 bg-status-red bg-opacity-10 border border-status-red border-opacity-20 rounded flex items-start gap-3">
                <AlertCircle size={20} className="text-status-red shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-status-red">Warning</p>
                  <p className="text-sm text-status-red mt-1">This action cannot be undone. All current data will be permanently replaced with data from the backup. The system will restart after restoration.</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => { setRestoreDialogOpen(false); setSelectedBackup(null); }} className="px-6 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors">Cancel</button>
              <button onClick={() => restoreBackupMutation.mutate({ backupId: selectedBackup.id, notes: restoreNotes || `Restored from backup ${selectedBackup.filename}` })} disabled={restoreBackupMutation.isPending} className="px-8 py-2 rounded font-medium bg-status-red hover:bg-opacity-90 text-white transition-all flex items-center gap-2 disabled:opacity-50 min-h-[44px]">
                {restoreBackupMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupPage;
