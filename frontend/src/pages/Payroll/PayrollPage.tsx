/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Calculator, CheckCircle2, Filter, Loader2, Plus, RefreshCw, Search, X } from 'lucide-react';
import apiClient from '../../api/client';

interface PayrollRecord {
  id: string;
  staff_id: string;
  period_start: string;
  period_end: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  status: 'PENDING' | 'PROCESSED' | 'PAID' | 'CANCELLED';
  payment_date: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  staff?: { employee_id: string; full_name: string; position: string; };
}

interface SalaryAdvance {
  id: string;
  staff_id: string;
  amount: number;
  repayment_date: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REPAID';
  notes: string | null;
  created_at: string;
}

const PayrollPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [isAdvanceDialogOpen, setIsAdvanceDialogOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [processData, setProcessData] = useState({
    period_start: new Date().toISOString().slice(0, 8) + '01',
    period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
  });
  const [advanceData, setAdvanceData] = useState({ staff_id: '', amount: 0, repayment_date: '', notes: '' });

  const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4000); };
  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };

  const { data: payroll = [], isLoading } = useQuery({
    queryKey: ['payroll', selectedMonth, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedStatus) params.append('status', selectedStatus);
      const res = await apiClient.get(`/api/v1/payroll?${params}`);
      return res.data;
    },
  });

  const { data: salaryAdvances = [] } = useQuery({
    queryKey: ['salary-advances'],
    queryFn: async () => { const res = await apiClient.get('/api/v1/payroll/advances'); return res.data; },
  });

  const processPayrollMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiClient.post('/api/v1/payroll/process', data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payroll'] }); setIsProcessDialogOpen(false); showSuccess('Payroll processed successfully'); },
    onError: (error: any) => showError(error.response?.data?.detail || 'Failed to process payroll'),
  });

  const requestAdvanceMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiClient.post('/api/v1/payroll/advances', data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['salary-advances'] }); setIsAdvanceDialogOpen(false); setAdvanceData({ staff_id: '', amount: 0, repayment_date: '', notes: '' }); showSuccess('Salary advance requested'); },
    onError: (error: any) => showError(error.response?.data?.detail || 'Failed to request advance'),
  });

  const filtered = payroll.filter((r: PayrollRecord) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.staff_id.toLowerCase().includes(q) || (r.staff?.employee_id || '').toLowerCase().includes(q) || (r.staff?.full_name || '').toLowerCase().includes(q);
  });

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A';

  const statusStyle = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-status-green bg-status-green bg-opacity-10';
      case 'PROCESSED': return 'text-accent-primary bg-accent-primary bg-opacity-10';
      case 'PENDING': return 'text-accent-warm bg-status-yellow bg-opacity-10';
      case 'CANCELLED': return 'text-status-red bg-status-red bg-opacity-10';
      default: return 'text-text-muted bg-bg-elevated';
    }
  };

  const advanceStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-status-green bg-status-green bg-opacity-10';
      case 'REJECTED': return 'text-status-red bg-status-red bg-opacity-10';
      case 'REPAID': return 'text-accent-primary bg-accent-primary bg-opacity-10';
      case 'PENDING': return 'text-accent-warm bg-status-yellow bg-opacity-10';
      default: return 'text-text-muted bg-bg-elevated';
    }
  };

  const totals = payroll.reduce((acc: any, r: PayrollRecord) => {
    if (r.status === 'PAID') { acc.totalPaid += r.net_salary; acc.totalRecords++; }
    return acc;
  }, { totalPaid: 0, totalRecords: 0 });

  const submitPayroll = () => {
    if (!processData.period_start || !processData.period_end) { showError('Please select period dates'); return; }
    processPayrollMutation.mutate(processData);
  };

  const submitAdvance = () => {
    if (!advanceData.staff_id || !advanceData.amount || advanceData.amount <= 0) { showError('Please fill all required fields'); return; }
    requestAdvanceMutation.mutate(advanceData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Calculator size={28} className="text-accent-primary" />
            Payroll Management
          </h2>
          <p className="text-text-muted mt-1">Process and manage staff payroll</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => queryClient.invalidateQueries()} className="px-4 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors flex items-center gap-2 min-h-[44px]">
            <RefreshCw size={18} /> Refresh
          </button>
          <button onClick={() => setIsAdvanceDialogOpen(true)} className="px-4 py-2 rounded font-medium border border-border text-text-primary hover:bg-bg-elevated transition-colors flex items-center gap-2 min-h-[44px]">
            <Plus size={18} /> Salary Advance
          </button>
          <button onClick={() => setIsProcessDialogOpen(true)} className="btn-primary gap-2">
            <Calculator size={20} /> Process Payroll
          </button>
        </div>
      </div>

      {errorMsg && (<div className="p-3 bg-status-red bg-opacity-10 border border-status-red border-opacity-20 rounded flex items-start gap-3 text-status-red text-sm"><AlertCircle size={18} className="shrink-0 mt-0.5" /><p>{errorMsg}</p></div>)}
      {successMsg && (<div className="p-3 bg-status-green bg-opacity-10 border border-status-green border-opacity-20 rounded flex items-start gap-3 text-status-green text-sm"><CheckCircle2 size={18} className="shrink-0 mt-0.5" /><p>{successMsg}</p></div>)}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Total Payroll</p>
          <p className="text-3xl font-bold mt-2">{payroll.length}</p>
          <p className="text-xs text-text-muted mt-1">Payroll records</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Paid</p>
          <p className="text-3xl font-bold text-status-green mt-2">{totals.totalRecords}</p>
          <p className="text-xs text-text-muted mt-1">Records paid</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Total Paid</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(totals.totalPaid)}</p>
          <p className="text-xs text-text-muted mt-1">Amount disbursed</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Pending</p>
          <p className="text-3xl font-bold text-accent-warm mt-2">{payroll.filter((p: PayrollRecord) => p.status === 'PENDING').length}</p>
          <p className="text-xs text-text-muted mt-1">Awaiting payment</p>
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
              <label className="block text-xs font-medium text-text-muted mb-1">Month</label>
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="input-base text-sm max-w-[160px]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Status</label>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="input-base text-sm max-w-[140px]">
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSED">Processed</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
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
            <h3 className="text-lg font-semibold">Payroll Records</h3>
            <p className="text-sm text-text-muted">{filtered.length} payroll records found</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bg-elevated border-b border-border">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Period</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Basic</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Allowances</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Deductions</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Net Salary</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><Loader2 size={32} className="animate-spin mx-auto text-accent-primary" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-text-muted">No payroll records found</td></tr>
              ) : (
                filtered.map((record: PayrollRecord) => (
                  <tr key={record.id} className="hover:bg-bg-elevated transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium">{record.staff?.full_name || 'Unknown'}</div>
                      <div className="text-xs text-text-muted">{record.staff?.position || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{formatDate(record.period_start)} - {formatDate(record.period_end)}</td>
                    <td className="px-6 py-4">{formatCurrency(record.basic_salary)}</td>
                    <td className="px-6 py-4">{formatCurrency(record.allowances)}</td>
                    <td className="px-6 py-4">{formatCurrency(record.deductions)}</td>
                    <td className="px-6 py-4 font-bold">{formatCurrency(record.net_salary)}</td>
                    <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusStyle(record.status)}`}>{record.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {salaryAdvances.length > 0 && (
        <div className="card-surface overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-6 pt-6">
            <div>
              <h3 className="text-lg font-semibold">Salary Advances</h3>
              <p className="text-sm text-text-muted">{salaryAdvances.length} advance requests</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-bg-elevated border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Staff ID</th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Request Date</th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Repayment</th>
                  <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {salaryAdvances.slice(0, 5).map((advance: SalaryAdvance) => (
                  <tr key={advance.id} className="hover:bg-bg-elevated transition-colors">
                    <td className="px-6 py-4 font-mono">{advance.staff_id}</td>
                    <td className="px-6 py-4 font-semibold">{formatCurrency(advance.amount)}</td>
                    <td className="px-6 py-4 text-sm">{formatDate(advance.created_at)}</td>
                    <td className="px-6 py-4 text-sm">{formatDate(advance.repayment_date)}</td>
                    <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${advanceStatusStyle(advance.status)}`}>{advance.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isProcessDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsProcessDialogOpen(false)} className="absolute right-4 top-4 text-text-muted hover:text-text-primary"><X size={24} /></button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><Calculator className="text-accent-primary" /> Process Payroll</h3>
            <p className="text-sm text-text-muted mb-6">Process payroll for a specific period</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-text-muted mb-1.5">Period Start *</label><input className="input-base" type="date" value={processData.period_start} onChange={(e) => setProcessData({ ...processData, period_start: e.target.value })} required /></div>
                <div><label className="block text-sm font-medium text-text-muted mb-1.5">Period End *</label><input className="input-base" type="date" value={processData.period_end} onChange={(e) => setProcessData({ ...processData, period_end: e.target.value })} required /></div>
              </div>
              <p className="text-sm text-text-muted">This will calculate payroll for all active staff members for the selected period.</p>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsProcessDialogOpen(false)} className="px-6 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors">Cancel</button>
              <button onClick={submitPayroll} disabled={processPayrollMutation.isPending} className="btn-primary px-8">
                {processPayrollMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : 'Process Payroll'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdvanceDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsAdvanceDialogOpen(false)} className="absolute right-4 top-4 text-text-muted hover:text-text-primary"><X size={24} /></button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><Calculator className="text-accent-primary" /> Request Salary Advance</h3>
            <p className="text-sm text-text-muted mb-6">Request a salary advance for a staff member</p>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-text-muted mb-1.5">Staff ID *</label><input className="input-base" value={advanceData.staff_id} onChange={(e) => setAdvanceData({ ...advanceData, staff_id: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-text-muted mb-1.5">Amount *</label><input className="input-base" type="number" min="0" value={advanceData.amount} onChange={(e) => setAdvanceData({ ...advanceData, amount: parseFloat(e.target.value) || 0 })} required /></div>
                <div><label className="block text-sm font-medium text-text-muted mb-1.5">Repayment Date</label><input className="input-base" type="date" value={advanceData.repayment_date} onChange={(e) => setAdvanceData({ ...advanceData, repayment_date: e.target.value })} /></div>
              </div>
              <div><label className="block text-sm font-medium text-text-muted mb-1.5">Notes</label><textarea className="input-base min-h-[80px] resize-none" value={advanceData.notes} onChange={(e) => setAdvanceData({ ...advanceData, notes: e.target.value })} placeholder="Reason for advance..." /></div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsAdvanceDialogOpen(false)} className="px-6 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors">Cancel</button>
              <button onClick={submitAdvance} disabled={requestAdvanceMutation.isPending} className="btn-primary px-8">
                {requestAdvanceMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : 'Request Advance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollPage;
