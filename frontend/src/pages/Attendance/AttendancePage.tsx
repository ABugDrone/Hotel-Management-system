/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CalendarDays, Check, CheckCircle2, Filter, Loader2, Plus, RefreshCw, Search, X as XIcon } from 'lucide-react';
import apiClient from '../../api/client';

interface AttendanceRecord {
  id: string;
  staff_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_LEAVE' | 'HALF_DAY';
  notes: string | null;
  staff?: { employee_id: string; full_name: string; department: string; };
}

const AttendancePage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isMarkDialogOpen, setIsMarkDialogOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [attendanceData, setAttendanceData] = useState({
    staff_id: '', date: new Date().toISOString().split('T')[0],
    check_in: '', check_out: '', status: 'PRESENT' as const, notes: '',
  });

  const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4000); };
  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ['attendance', selectedDate, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedDate) params.append('date', selectedDate);
      if (selectedStatus) params.append('status', selectedStatus);
      const res = await apiClient.get(`/api/v1/attendance?${params}`);
      return res.data;
    },
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiClient.post('/api/v1/attendance', data); return res.data; },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setIsMarkDialogOpen(false);
      setAttendanceData({ staff_id: '', date: new Date().toISOString().split('T')[0], check_in: '', check_out: '', status: 'PRESENT', notes: '' });
      showSuccess('Attendance marked successfully');
    },
    onError: (error: any) => showError(error.response?.data?.detail || 'Failed to mark attendance'),
  });

  const filtered = attendance.filter((r: AttendanceRecord) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.staff_id.toLowerCase().includes(q) || (r.staff?.employee_id || '').toLowerCase().includes(q) || (r.staff?.full_name || '').toLowerCase().includes(q);
  });

  const formatTime = (t: string | null) => {
    if (!t) return 'N/A';
    return new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'text-status-green bg-status-green bg-opacity-10';
      case 'ABSENT': return 'text-status-red bg-status-red bg-opacity-10';
      case 'LATE': return 'text-accent-warm bg-status-yellow bg-opacity-10';
      case 'ON_LEAVE': return 'text-accent-primary bg-accent-primary bg-opacity-10';
      case 'HALF_DAY': return 'text-text-muted bg-bg-elevated border border-border';
      default: return 'text-text-muted bg-bg-elevated';
    }
  };

  const calcHours = (ci: string | null, co: string | null) => {
    if (!ci || !co) return 'N/A';
    const diff = new Date(co).getTime() - new Date(ci).getTime();
    return `${(diff / 3600000).toFixed(1)}h`;
  };

  const submitAttendance = () => {
    if (!attendanceData.staff_id || !attendanceData.date) { showError('Please fill all required fields'); return; }
    markAttendanceMutation.mutate(attendanceData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <CalendarDays size={28} className="text-accent-primary" />
            Attendance Tracking
          </h2>
          <p className="text-text-muted mt-1">Track staff attendance and working hours</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => queryClient.invalidateQueries()} className="px-4 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors flex items-center gap-2 min-h-[44px]">
            <RefreshCw size={18} /> Refresh
          </button>
          <button onClick={() => setIsMarkDialogOpen(true)} className="btn-primary gap-2">
            <Plus size={20} /> Mark Attendance
          </button>
        </div>
      </div>

      {errorMsg && (<div className="p-3 bg-status-red bg-opacity-10 border border-status-red border-opacity-20 rounded flex items-start gap-3 text-status-red text-sm"><AlertCircle size={18} className="shrink-0 mt-0.5" /><p>{errorMsg}</p></div>)}
      {successMsg && (<div className="p-3 bg-status-green bg-opacity-10 border border-status-green border-opacity-20 rounded flex items-start gap-3 text-status-green text-sm"><CheckCircle2 size={18} className="shrink-0 mt-0.5" /><p>{successMsg}</p></div>)}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Today's Present</p>
          <p className="text-3xl font-bold text-status-green mt-2">{attendance.filter((a: AttendanceRecord) => a.status === 'PRESENT').length}</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Absent</p>
          <p className="text-3xl font-bold text-status-red mt-2">{attendance.filter((a: AttendanceRecord) => a.status === 'ABSENT').length}</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Late</p>
          <p className="text-3xl font-bold text-accent-warm mt-2">{attendance.filter((a: AttendanceRecord) => a.status === 'LATE').length}</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">On Leave</p>
          <p className="text-3xl font-bold text-accent-primary mt-2">{attendance.filter((a: AttendanceRecord) => a.status === 'ON_LEAVE').length}</p>
        </div>
      </div>

      <div className="card-surface">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input placeholder="Search by staff ID or name..." className="input-base pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex gap-2 items-end">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Date</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input-base text-sm max-w-[160px]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Status</label>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="input-base text-sm max-w-[140px]">
                <option value="">All Status</option>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="HALF_DAY">Half Day</option>
              </select>
            </div>
            <button className="px-4 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors flex items-center gap-2 min-h-[44px]">
              <Filter size={18} /> Filter
            </button>
          </div>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between mb-4 px-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold">Attendance Records</h3>
            <p className="text-sm text-text-muted">{filtered.length} records found for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bg-elevated border-b border-border">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Check In</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Hours</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><Loader2 size={32} className="animate-spin mx-auto text-accent-primary" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-text-muted">No attendance records found</td></tr>
              ) : (
                filtered.map((record: AttendanceRecord) => (
                  <tr key={record.id} className="hover:bg-bg-elevated transition-colors">
                    <td className="px-6 py-4 font-mono text-sm">{record.staff?.employee_id || record.staff_id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{record.staff?.full_name || 'Unknown'}</div>
                      <div className="text-xs text-text-muted">ID: {record.staff_id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4">{record.staff?.department || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">{formatTime(record.check_in)}</td>
                    <td className="px-6 py-4 text-sm">{formatTime(record.check_out)}</td>
                    <td className="px-6 py-4 text-sm">{calcHours(record.check_in, record.check_out)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase ${statusStyle(record.status)}`}>
                        {record.status === 'PRESENT' && <Check size={14} />}
                        {record.status === 'ABSENT' && <XIcon size={14} />}
                        {record.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isMarkDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsMarkDialogOpen(false)} className="absolute right-4 top-4 text-text-muted hover:text-text-primary"><XIcon size={24} /></button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><CalendarDays className="text-accent-primary" /> Mark Attendance</h3>
            <p className="text-sm text-text-muted mb-6">Mark attendance for a staff member</p>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-text-muted mb-1.5">Staff ID *</label><input className="input-base" value={attendanceData.staff_id} onChange={(e) => setAttendanceData({ ...attendanceData, staff_id: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-text-muted mb-1.5">Date *</label><input className="input-base" type="date" value={attendanceData.date} onChange={(e) => setAttendanceData({ ...attendanceData, date: e.target.value })} required /></div>
                <div><label className="block text-sm font-medium text-text-muted mb-1.5">Status</label>
                  <select className="input-base" value={attendanceData.status} onChange={(e) => setAttendanceData({ ...attendanceData, status: e.target.value as any })}>
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LATE">Late</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="HALF_DAY">Half Day</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-text-muted mb-1.5">Check In</label><input className="input-base" type="time" value={attendanceData.check_in} onChange={(e) => setAttendanceData({ ...attendanceData, check_in: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-text-muted mb-1.5">Check Out</label><input className="input-base" type="time" value={attendanceData.check_out} onChange={(e) => setAttendanceData({ ...attendanceData, check_out: e.target.value })} /></div>
              </div>
              <div><label className="block text-sm font-medium text-text-muted mb-1.5">Notes</label><input className="input-base" value={attendanceData.notes} onChange={(e) => setAttendanceData({ ...attendanceData, notes: e.target.value })} placeholder="Optional notes..." /></div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsMarkDialogOpen(false)} className="px-6 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors">Cancel</button>
              <button onClick={submitAttendance} disabled={markAttendanceMutation.isPending} className="btn-primary px-8">
                {markAttendanceMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : 'Mark Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
