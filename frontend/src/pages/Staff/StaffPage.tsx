/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Filter, Loader2, Plus, RefreshCw, Search, Users, X } from 'lucide-react';
import apiClient from '../../api/client';

interface StaffMember {
  id: string;
  employee_id: string;
  full_name: string;
  position: string;
  department: string;
  employment_type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
  hire_date: string;
  salary: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  contact_number: string;
  email: string;
  address: string;
  emergency_contact: string;
  notes: string | null;
  created_at: string;
}

const StaffPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [newStaff, setNewStaff] = useState({
    employee_id: '', full_name: '', position: '', department: 'RECEPTION',
    employment_type: 'FULL_TIME' as const, hire_date: new Date().toISOString().split('T')[0],
    salary: 0, status: 'ACTIVE' as const, contact_number: '', email: '',
    address: '', emergency_contact: '', notes: '',
  });

  const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4000); };
  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff', selectedDepartment, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedDepartment) params.append('department', selectedDepartment);
      if (selectedStatus) params.append('status', selectedStatus);
      const res = await apiClient.get(`/api/v1/staff?${params}`);
      return res.data;
    },
  });

  const addStaffMutation = useMutation({
    mutationFn: async (staffData: any) => { const res = await apiClient.post('/api/v1/staff', staffData); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['staff'] }); setIsAddDialogOpen(false); showSuccess('Staff member added successfully'); },
    onError: (error: any) => showError(error.response?.data?.detail || 'Failed to add staff member'),
  });

  const filteredStaff = staff.filter((member: StaffMember) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return member.employee_id.toLowerCase().includes(q) || member.full_name.toLowerCase().includes(q) ||
      member.position.toLowerCase().includes(q) || member.email.toLowerCase().includes(q);
  });

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  const statusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-status-green bg-status-green bg-opacity-10';
      case 'INACTIVE': return 'text-status-red bg-status-red bg-opacity-10';
      case 'ON_LEAVE': return 'text-accent-warm bg-status-yellow bg-opacity-10';
      default: return 'text-text-muted bg-bg-elevated';
    }
  };

  const typeStyle = (type: string) => {
    switch (type) {
      case 'FULL_TIME': return 'text-status-green bg-status-green bg-opacity-10';
      case 'PART_TIME': return 'text-accent-primary bg-accent-primary bg-opacity-10';
      case 'CONTRACT': return 'text-text-muted bg-bg-elevated border border-border';
      default: return 'text-text-muted bg-bg-elevated';
    }
  };

  const submitStaff = () => {
    if (!newStaff.employee_id || !newStaff.full_name || !newStaff.position) {
      showError('Please fill all required fields');
      return;
    }
    addStaffMutation.mutate(newStaff);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Users size={28} className="text-accent-primary" />
            Staff Management
          </h2>
          <p className="text-text-muted mt-1">Manage hotel staff and employee information</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => queryClient.invalidateQueries()} className="px-4 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors flex items-center gap-2 min-h-[44px]">
            <RefreshCw size={18} /> Refresh
          </button>
          <button onClick={() => setIsAddDialogOpen(true)} className="btn-primary gap-2">
            <Plus size={20} /> Add Staff
          </button>
        </div>
      </div>

      {errorMsg && (<div className="p-3 bg-status-red bg-opacity-10 border border-status-red border-opacity-20 rounded flex items-start gap-3 text-status-red text-sm"><AlertCircle size={18} className="shrink-0 mt-0.5" /><p>{errorMsg}</p></div>)}
      {successMsg && (<div className="p-3 bg-status-green bg-opacity-10 border border-status-green border-opacity-20 rounded flex items-start gap-3 text-status-green text-sm"><CheckCircle2 size={18} className="shrink-0 mt-0.5" /><p>{successMsg}</p></div>)}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Total Staff</p>
          <p className="text-3xl font-bold mt-2">{staff.length}</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Active</p>
          <p className="text-3xl font-bold text-status-green mt-2">{staff.filter((s: StaffMember) => s.status === 'ACTIVE').length}</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">On Leave</p>
          <p className="text-3xl font-bold text-accent-warm mt-2">{staff.filter((s: StaffMember) => s.status === 'ON_LEAVE').length}</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Monthly Salary</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(staff.reduce((t: number, s: StaffMember) => t + s.salary, 0))}</p>
        </div>
      </div>

      <div className="card-surface">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input placeholder="Search staff..." className="input-base pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="input-base text-sm max-w-[160px]">
              <option value="">All Departments</option>
              <option value="RECEPTION">Reception</option>
              <option value="HOUSEKEEPING">Housekeeping</option>
              <option value="KITCHEN">Kitchen</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="MANAGEMENT">Management</option>
            </select>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="input-base text-sm max-w-[140px]">
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
            <button className="px-4 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors flex items-center gap-2 min-h-[44px]">
              <Filter size={18} /> Filter
            </button>
          </div>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between mb-4 px-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold">Staff Members</h3>
            <p className="text-sm text-text-muted">{filteredStaff.length} staff members found</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bg-elevated border-b border-border">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Position</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Salary</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><Loader2 size={32} className="animate-spin mx-auto text-accent-primary" /></td></tr>
              ) : filteredStaff.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-text-muted">No staff members found</td></tr>
              ) : (
                filteredStaff.map((member: StaffMember) => (
                  <tr key={member.id} className="hover:bg-bg-elevated transition-colors group">
                    <td className="px-6 py-4 font-mono text-sm">{member.employee_id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{member.full_name}</div>
                      <div className="text-xs text-text-muted">{member.email}</div>
                    </td>
                    <td className="px-6 py-4">{member.position}</td>
                    <td className="px-6 py-4"><span className="px-2 py-0.5 rounded text-xs font-bold uppercase text-text-muted bg-bg-elevated border border-border">{member.department}</span></td>
                    <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${typeStyle(member.employment_type)}`}>{member.employment_type.replace('_', ' ')}</span></td>
                    <td className="px-6 py-4 font-semibold">{formatCurrency(member.salary)}</td>
                    <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusStyle(member.status)}`}>{member.status.replace('_', ' ')}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-xl shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsAddDialogOpen(false)} className="absolute right-4 top-4 text-text-muted hover:text-text-primary"><X size={24} /></button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><Users className="text-accent-primary" /> Add Staff Member</h3>
            <p className="text-sm text-text-muted mb-6">Add a new staff member to the hotel</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-text-muted mb-1.5">Employee ID *</label><input className="input-base" value={newStaff.employee_id} onChange={(e) => setNewStaff({ ...newStaff, employee_id: e.target.value })} required /></div>
                <div><label className="block text-sm font-medium text-text-muted mb-1.5">Full Name *</label><input className="input-base" value={newStaff.full_name} onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-text-muted mb-1.5">Position *</label><input className="input-base" value={newStaff.position} onChange={(e) => setNewStaff({ ...newStaff, position: e.target.value })} required /></div>
                <div><label className="block text-sm font-medium text-text-muted mb-1.5">Department</label>
                  <select className="input-base" value={newStaff.department} onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}>
                    <option value="RECEPTION">Reception</option>
                    <option value="HOUSEKEEPING">Housekeeping</option>
                    <option value="KITCHEN">Kitchen</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="MANAGEMENT">Management</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-text-muted mb-1.5">Employment Type</label>
                  <select className="input-base" value={newStaff.employment_type} onChange={(e) => setNewStaff({ ...newStaff, employment_type: e.target.value as any })}>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-text-muted mb-1.5">Hire Date</label><input className="input-base" type="date" value={newStaff.hire_date} onChange={(e) => setNewStaff({ ...newStaff, hire_date: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-text-muted mb-1.5">Salary</label><input className="input-base" type="number" min="0" value={newStaff.salary} onChange={(e) => setNewStaff({ ...newStaff, salary: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-text-muted mb-1.5">Contact Number</label><input className="input-base" value={newStaff.contact_number} onChange={(e) => setNewStaff({ ...newStaff, contact_number: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-text-muted mb-1.5">Email</label><input className="input-base" type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} /></div>
              </div>
              <div><label className="block text-sm font-medium text-text-muted mb-1.5">Address</label><textarea className="input-base min-h-[60px] resize-none" value={newStaff.address} onChange={(e) => setNewStaff({ ...newStaff, address: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-text-muted mb-1.5">Emergency Contact</label><input className="input-base" value={newStaff.emergency_contact} onChange={(e) => setNewStaff({ ...newStaff, emergency_contact: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsAddDialogOpen(false)} className="px-6 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors">Cancel</button>
              <button onClick={submitStaff} disabled={addStaffMutation.isPending} className="btn-primary px-8">
                {addStaffMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : 'Add Staff Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;
