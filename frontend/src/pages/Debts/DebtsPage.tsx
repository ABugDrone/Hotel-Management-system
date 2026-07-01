/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Filter, Loader2, Plus, RefreshCw, Search, X, DollarSign, CheckCircle2 } from 'lucide-react';
import apiClient from '../../api/client';

interface Debt {
  id: string;
  guest_id: string;
  assignment_id: string;
  amount_owed: number;
  status: 'OUTSTANDING' | 'CONTACTED' | 'PROMISED_PAYMENT' | 'PAID' | 'WRITTEN_OFF';
  last_contact_date: string | null;
  next_follow_up: string | null;
  contact_method: string | null;
  contact_notes: string | null;
  promised_payment_date: string | null;
  promised_amount: number | null;
  actual_amount_paid: number | null;
  actual_payment_date: string | null;
  created_at: string;
  updated_at: string;
  guest?: { name: string; phone: string; };
  room?: { number: string; };
}

interface OutstandingAssignment {
  assignment_id: string;
  guest_id: string;
  amount_owed: number;
}

const DebtsPage = () => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [newDebt, setNewDebt] = useState({
    guest_id: '',
    assignment_id: '',
    amount_owed: 0,
    status: 'OUTSTANDING' as const,
    contact_method: '',
    contact_notes: '',
    next_follow_up: '',
    promised_payment_date: '',
    promised_amount: 0,
  });
  const [paymentAmount, setPaymentAmount] = useState('');

  const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4000); };
  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };

  const { data: debts = [], isLoading: isLoadingDebts, refetch: refetchDebts } = useQuery({
    queryKey: ['debts', selectedStatus, minAmount, maxAmount],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      if (minAmount) params.append('min_amount', minAmount);
      if (maxAmount) params.append('max_amount', maxAmount);
      const response = await apiClient.get(`/api/v1/debts/?${params}`);
      return response.data;
    },
  });

  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['debt-summary'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/debts/summary');
      return response.data;
    },
  });

  const { data: outstandingAssignments = [] } = useQuery({
    queryKey: ['outstanding-assignments'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/debts/find-outstanding');
      return response.data.outstanding_assignments || [];
    },
  });

  const createDebtMutation = useMutation({
    mutationFn: async (debtData: any) => {
      const response = await apiClient.post('/api/v1/debts/', debtData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debt-summary'] });
      queryClient.invalidateQueries({ queryKey: ['outstanding-assignments'] });
      setIsCreateDialogOpen(false);
      setNewDebt({ guest_id: '', assignment_id: '', amount_owed: 0, status: 'OUTSTANDING', contact_method: '', contact_notes: '', next_follow_up: '', promised_payment_date: '', promised_amount: 0 });
      showSuccess('Debt record created successfully');
    },
    onError: (error: any) => {
      showError(error.response?.data?.detail || 'Failed to create debt record');
    },
  });

  const updateDebtMutation = useMutation({
    mutationFn: async ({ debtId, data }: { debtId: string; data: any }) => {
      const response = await apiClient.patch(`/api/v1/debts/${debtId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debt-summary'] });
      setIsPaymentDialogOpen(false);
      setSelectedDebt(null);
      setPaymentAmount('');
      showSuccess('Payment recorded successfully');
    },
    onError: (error: any) => {
      showError(error.response?.data?.detail || 'Failed to record payment');
    },
  });

  const filteredDebts = debts.filter((debt: Debt) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return debt.id.toLowerCase().includes(q) || debt.guest_id.toLowerCase().includes(q) ||
      (debt.guest?.name || '').toLowerCase().includes(q) || (debt.guest?.phone || '').toLowerCase().includes(q);
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'OUTSTANDING': return 'text-status-red bg-status-red bg-opacity-10';
      case 'CONTACTED': return 'text-accent-warm bg-status-yellow bg-opacity-10';
      case 'PROMISED_PAYMENT': return 'text-accent-primary bg-accent-primary bg-opacity-10';
      case 'PAID': return 'text-status-green bg-status-green bg-opacity-10';
      case 'WRITTEN_OFF': return 'text-text-muted bg-bg-elevated';
      default: return 'text-text-muted bg-bg-elevated';
    }
  };

  const handlePayment = () => {
    if (!selectedDebt || !paymentAmount) return;
    const payment = parseFloat(paymentAmount);
    if (isNaN(payment) || payment <= 0) {
      showError('Please enter a valid payment amount');
      return;
    }
    const updateData: any = { actual_amount_paid: payment };
    if (payment >= selectedDebt.amount_owed) updateData.status = 'PAID';
    updateDebtMutation.mutate({ debtId: selectedDebt.id, data: updateData });
  };

  const createDebtFromAssignment = (assignment: OutstandingAssignment) => {
    setNewDebt({ ...newDebt, guest_id: assignment.guest_id, assignment_id: assignment.assignment_id, amount_owed: assignment.amount_owed });
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <DollarSign size={28} className="text-accent-primary" />
            Debt Recovery
          </h2>
          <p className="text-text-muted mt-1">Manage outstanding debts and payment recovery</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetchDebts()} className="px-4 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors flex items-center gap-2 min-h-[44px]">
            <RefreshCw size={18} /> Refresh
          </button>
          <button onClick={() => setIsCreateDialogOpen(true)} className="btn-primary gap-2">
            <Plus size={20} /> New Debt Record
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-status-red bg-opacity-10 border border-status-red border-opacity-20 rounded flex items-start gap-3 text-status-red text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>{errorMsg}</p>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-status-green bg-opacity-10 border border-status-green border-opacity-20 rounded flex items-start gap-3 text-status-green text-sm">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <p>{successMsg}</p>
        </div>
      )}

      {!isLoadingSummary && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-surface">
            <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Outstanding Debts</p>
            <p className="text-3xl font-bold text-status-red mt-2">{formatCurrency(summary.total_outstanding)}</p>
            <p className="text-xs text-text-muted mt-1">{summary.debt_count} total records</p>
          </div>
          <div className="card-surface">
            <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Contacted</p>
            <p className="text-3xl font-bold text-accent-warm mt-2">{formatCurrency(summary.total_contacted)}</p>
          </div>
          <div className="card-surface">
            <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Promised Payments</p>
            <p className="text-3xl font-bold text-accent-primary mt-2">{formatCurrency(summary.total_promised)}</p>
          </div>
          <div className="card-surface">
            <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Recovered</p>
            <p className="text-3xl font-bold text-status-green mt-2">{formatCurrency(summary.total_recovered)}</p>
          </div>
        </div>
      )}

      <div className="card-surface">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              placeholder="Search debts by ID, guest name, or phone..."
              className="input-base pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="input-base text-sm max-w-[160px]">
              <option value="">All Status</option>
              <option value="OUTSTANDING">Outstanding</option>
              <option value="CONTACTED">Contacted</option>
              <option value="PROMISED_PAYMENT">Promised Payment</option>
              <option value="PAID">Paid</option>
              <option value="WRITTEN_OFF">Written Off</option>
            </select>
            <input placeholder="Min" className="input-base text-sm max-w-[100px]" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
            <input placeholder="Max" className="input-base text-sm max-w-[100px]" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
            <button className="px-4 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors flex items-center gap-2 min-h-[44px]">
              <Filter size={18} /> Filter
            </button>
          </div>
        </div>
      </div>

      {outstandingAssignments.length > 0 && (
        <div className="card-surface">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Potential Debts to Record</h3>
              <p className="text-sm text-text-muted">{outstandingAssignments.length} assignments with outstanding balances</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-bg-elevated border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Assignment ID</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Guest ID</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Amount Owed</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {outstandingAssignments.map((assignment: OutstandingAssignment) => (
                  <tr key={assignment.assignment_id} className="hover:bg-bg-elevated transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{assignment.assignment_id}</td>
                    <td className="px-4 py-3 font-mono text-xs">{assignment.guest_id}</td>
                    <td className="px-4 py-3 font-semibold text-status-red">{formatCurrency(assignment.amount_owed)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => createDebtFromAssignment(assignment)} className="btn-primary text-sm py-1.5 px-3 min-h-[36px]">
                        Create Debt Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between mb-4 px-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold">Debt Recovery Records</h3>
            <p className="text-sm text-text-muted">{filteredDebts.length} records found</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bg-elevated border-b border-border">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Guest</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Amount Owed</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Last Contact</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Next Follow-up</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingDebts ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 size={32} className="animate-spin mx-auto text-accent-primary" />
                  </td>
                </tr>
              ) : filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                    No debt records found
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt: Debt) => (
                  <tr key={debt.id} className="hover:bg-bg-elevated transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs">{debt.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{debt.guest?.name || debt.guest_id}</div>
                      <div className="text-xs text-text-muted">Assignment: {debt.assignment_id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 font-semibold">{formatCurrency(debt.amount_owed)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusStyle(debt.status)}`}>
                        {debt.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{formatDate(debt.last_contact_date)}</td>
                    <td className="px-6 py-4 text-sm">{formatDate(debt.next_follow_up)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {debt.status !== 'PAID' && debt.status !== 'WRITTEN_OFF' && (
                          <button
                            onClick={() => { setSelectedDebt(debt); setPaymentAmount(debt.amount_owed.toString()); setIsPaymentDialogOpen(true); }}
                            className="px-3 py-1.5 rounded text-sm font-medium border border-border text-text-muted hover:bg-bg-elevated transition-colors"
                          >
                            Record Payment
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsCreateDialogOpen(false)} className="absolute right-4 top-4 text-text-muted hover:text-text-primary">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <DollarSign className="text-accent-warm" />
              Create Debt Recovery Record
            </h3>
            <p className="text-sm text-text-muted mb-6">Record a new debt for recovery tracking</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Guest ID</label>
                  <input className="input-base" value={newDebt.guest_id} onChange={(e) => setNewDebt({ ...newDebt, guest_id: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Assignment ID</label>
                  <input className="input-base" value={newDebt.assignment_id} onChange={(e) => setNewDebt({ ...newDebt, assignment_id: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Amount Owed</label>
                <input className="input-base" type="number" min="0" step="0.01" value={newDebt.amount_owed} onChange={(e) => setNewDebt({ ...newDebt, amount_owed: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Status</label>
                <select className="input-base" value={newDebt.status} onChange={(e) => setNewDebt({ ...newDebt, status: e.target.value as any })}>
                  <option value="OUTSTANDING">Outstanding</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="PROMISED_PAYMENT">Promised Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Contact Method</label>
                <input className="input-base" value={newDebt.contact_method} onChange={(e) => setNewDebt({ ...newDebt, contact_method: e.target.value })} placeholder="Phone, Email, etc." />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Contact Notes</label>
                <textarea className="input-base min-h-[80px] resize-none" value={newDebt.contact_notes} onChange={(e) => setNewDebt({ ...newDebt, contact_notes: e.target.value })} placeholder="Notes from contact attempt..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button type="button" onClick={() => setIsCreateDialogOpen(false)} className="px-6 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors">Cancel</button>
              <button onClick={() => createDebtMutation.mutate(newDebt)} disabled={createDebtMutation.isPending} className="btn-primary px-8">
                {createDebtMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : 'Create Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPaymentDialogOpen && selectedDebt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => { setIsPaymentDialogOpen(false); setSelectedDebt(null); }} className="absolute right-4 top-4 text-text-muted hover:text-text-primary">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <CheckCircle2 className="text-status-green" />
              Record Payment
            </h3>
            <p className="text-sm text-text-muted mb-6">Record payment for debt recovery</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-bg-elevated rounded-lg border border-border">
                <span className="text-sm text-text-muted">Debt ID</span>
                <span className="font-mono text-sm">{selectedDebt.id.substring(0, 8)}...</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-bg-elevated rounded-lg border border-border">
                <span className="text-sm text-text-muted">Amount Owed</span>
                <span className="font-bold text-status-red">{formatCurrency(selectedDebt.amount_owed)}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Payment Amount</label>
                <input className="input-base" type="number" min="0" max={selectedDebt.amount_owed} step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Enter payment amount" />
              </div>
              {paymentAmount && (
                <div className="flex justify-between items-center p-3 bg-bg-elevated rounded-lg border border-border">
                  <span className="text-sm text-text-muted">Remaining Balance</span>
                  <span className={`font-bold ${selectedDebt.amount_owed - parseFloat(paymentAmount) <= 0 ? 'text-status-green' : 'text-accent-warm'}`}>
                    {formatCurrency(Math.max(0, selectedDebt.amount_owed - parseFloat(paymentAmount)))}
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button type="button" onClick={() => { setIsPaymentDialogOpen(false); setSelectedDebt(null); }} className="px-6 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors">Cancel</button>
              <button onClick={handlePayment} disabled={updateDebtMutation.isPending || !paymentAmount} className="btn-primary px-8">
                {updateDebtMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtsPage;
