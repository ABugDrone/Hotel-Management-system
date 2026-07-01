/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Loader2, RefreshCw, Search, Shield, User } from 'lucide-react';
import apiClient from '../../api/client';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: { username: string; full_name: string; role: string; };
}

const AuditPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', selectedAction, selectedEntity, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedAction) params.append('action', selectedAction);
      if (selectedEntity) params.append('entity', selectedEntity);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const res = await apiClient.get(`/api/v1/audit?${params}`);
      return res.data;
    },
  });

  const filtered = auditLogs.filter((log: AuditLog) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return log.user_id.toLowerCase().includes(q) || (log.user?.username || '').toLowerCase().includes(q) ||
      (log.user?.full_name || '').toLowerCase().includes(q) || log.action.toLowerCase().includes(q) ||
      (log.entity_id || '').toLowerCase().includes(q);
  });

  const formatDateTime = (d: string) => new Date(d).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const actionStyle = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD')) return 'text-status-green bg-status-green bg-opacity-10';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'text-accent-warm bg-status-yellow bg-opacity-10';
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'text-status-red bg-status-red bg-opacity-10';
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'text-accent-primary bg-accent-primary bg-opacity-10';
    return 'text-text-muted bg-bg-elevated';
  };

  const parseDetails = (details: any) => {
    if (!details) return 'No details';
    if (typeof details === 'string') return details;
    try { return typeof details === 'object' ? JSON.stringify(details, null, 2) : String(details); }
    catch { return 'Unable to parse details'; }
  };

  const getActions = () => [...new Set<string>(auditLogs.map((l: AuditLog) => l.action))].sort();
  const getEntities = () => [...new Set<string>(auditLogs.map((l: AuditLog) => l.entity))].sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Shield size={28} className="text-accent-primary" />
            Audit Logs
          </h2>
          <p className="text-text-muted mt-1">View system activity and user actions</p>
        </div>
        <button className="px-4 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors flex items-center gap-2 min-h-[44px]">
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Total Logs</p>
          <p className="text-3xl font-bold mt-2">{auditLogs.length}</p>
          <p className="text-xs text-text-muted mt-1">System activities</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Today's Logs</p>
          <p className="text-3xl font-bold mt-2">{auditLogs.filter((l: AuditLog) => new Date(l.created_at).toDateString() === new Date().toDateString()).length}</p>
          <p className="text-xs text-text-muted mt-1">Today's activities</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Unique Users</p>
          <p className="text-3xl font-bold mt-2">{new Set(auditLogs.map((l: AuditLog) => l.user_id)).size}</p>
          <p className="text-xs text-text-muted mt-1">Active users</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Most Active Entity</p>
          <p className="text-3xl font-bold mt-2 truncate">
            {(() => {
              const counts: Record<string, number> = {};
              auditLogs.forEach((l: AuditLog) => { counts[l.entity] = (counts[l.entity] || 0) + 1; });
              const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
              return top ? top[0] : 'N/A';
            })()}
          </p>
          <p className="text-xs text-text-muted mt-1">Frequently modified</p>
        </div>
      </div>

      <div className="card-surface">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Action</label>
            <select className="input-base" value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)}>
              <option value="">All Actions</option>
              {getActions().map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Entity</label>
            <select className="input-base" value={selectedEntity} onChange={(e) => setSelectedEntity(e.target.value)}>
              <option value="">All Entities</option>
              {getEntities().map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Start Date</label>
            <input className="input-base" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">End Date</label>
            <input className="input-base" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card-surface">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted z-10" />
          <input placeholder="Search audit logs by user, action, or entity ID..." className="input-base pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      <div className="card-surface">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Audit Logs</h3>
            <p className="text-sm text-text-muted">{filtered.length} audit entries found</p>
          </div>
        </div>
        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 size={32} className="animate-spin text-accent-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-text-muted">No audit logs found</div>
        ) : (
          <div className="space-y-3">
            {filtered.slice(0, 50).map((log: AuditLog) => (
              <div key={log.id} className="bg-bg-elevated border border-border rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${actionStyle(log.action)}`}>{log.action}</span>
                      <span className="text-sm text-text-muted">on {log.entity} {log.entity_id && <span className="font-mono ml-1">({log.entity_id.substring(0, 8)}...)</span>}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User size={14} className="text-text-muted" />
                      <span className="font-medium">{log.user?.full_name || log.user_id}</span>
                      <span className="text-text-muted">({log.user?.username || 'Unknown'})</span>
                      {log.user?.role && <span className="px-2 py-0.5 rounded text-xs font-bold uppercase text-text-muted bg-bg-elevated border border-border">{log.user.role}</span>}
                    </div>
                    {log.details && (
                      <div className="mt-2">
                        <div className="flex items-center gap-1 text-sm text-text-muted mb-1">
                          <Eye size={12} /><span>Details:</span>
                        </div>
                        <pre className="text-xs bg-bg-base p-2 rounded-md overflow-x-auto text-text-muted">{parseDetails(log.details)}</pre>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-text-muted md:text-right">
                    <div>{formatDateTime(log.created_at)}</div>
                    {log.ip_address && <div className="font-mono text-xs">{log.ip_address}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card-surface">
        <h3 className="text-lg font-semibold mb-4">Common Audit Actions</h3>
        <p className="text-sm text-text-muted mb-6">Frequently performed actions in the system</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-bg-elevated border border-border rounded-lg p-4">
            <h4 className="font-semibold flex items-center gap-2 mb-2"><Shield size={16} className="text-accent-primary" /> Security Actions</h4>
            <ul className="space-y-1 text-sm text-text-muted">
              {['USER_LOGIN - User authentication', 'USER_LOGOUT - User session end', 'PASSWORD_CHANGE - Password updates', 'ROLE_CHANGE - Permission modifications'].map((item, i) => (
                <li key={i} className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-text-muted" />{item}</li>
              ))}
            </ul>
          </div>
          <div className="bg-bg-elevated border border-border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Guest Management</h4>
            <ul className="space-y-1 text-sm text-text-muted">
              {['GUEST_CHECKIN - Guest registration', 'GUEST_CHECKOUT - Check-out processing', 'GUEST_UPDATE - Profile modifications', 'GUEST_DELETE - Record removal'].map((item, i) => (
                <li key={i} className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-text-muted" />{item}</li>
              ))}
            </ul>
          </div>
          <div className="bg-bg-elevated border border-border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Financial Operations</h4>
            <ul className="space-y-1 text-sm text-text-muted">
              {['PAYMENT_CREATE - Payment recording', 'PAYMENT_UPDATE - Payment modifications', 'PAYMENT_DELETE - Payment removal', 'RECEIPT_GENERATE - Receipt creation'].map((item, i) => (
                <li key={i} className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-text-muted" />{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditPage;
