/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Filter, Plus, Receipt, Calendar, TrendingUp, Loader2, X, AlertCircle, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import client from '../../api/client';

interface Payment {
  id: string;
  method: 'cash' | 'bank_transfer' | 'pos';
  amount: number;
  description?: string;
  recorded_by: string;
  created_at: string;
  assignment_id: string;
  guest_id: string;
}

interface PaymentStats {
  date: string;
  total_amount: number;
  breakdown: {
    [key: string]: {
      amount: number;
      count: number;
    };
  };
}

const paymentSchema = z.object({
  assignment_id: z.string().min(1, 'Assignment is required'),
  guest_id: z.string().min(1, 'Guest is required'),
  method: z.enum(['cash', 'bank_transfer', 'pos'], {
    required_error: 'Payment method is required',
  }),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export const PaymentsPage = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch payments with expanded data
  const { data: payments, isLoading: isPaymentsLoading } = useQuery<Payment[]>({
    queryKey: ['payments'],
    queryFn: async () => {
      const res = await client.get('/api/v1/payments/');
      return res.data;
    },
  });

  // Fetch guests for dropdown
  const { data: guests } = useQuery({
    queryKey: ['all-guests'],
    queryFn: async () => {
      const res = await client.get('/api/v1/guests/');
      return res.data;
    },
  });

  // Fetch active assignments for dropdown
  const { data: activeAssignments } = useQuery({
    queryKey: ['active-assignments'],
    queryFn: async () => {
      const res = await client.get('/api/v1/rooms/assignments/active');
      return res.data;
    },
  });

  // Fetch daily stats
  const { data: dailyStats, isLoading: isStatsLoading } = useQuery<PaymentStats>({
    queryKey: ['payment-stats', dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFilter) params.append('date', dateFilter);
      const res = await client.get(`/api/v1/payments/daily-summary?${params}`);
      return res.data;
    },
  });

  // Fetch payment methods stats
  const { data: methodStats } = useQuery({
    queryKey: ['payment-method-stats'],
    queryFn: async () => {
      const res = await client.get('/api/v1/payments/methods/stats');
      return res.data;
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      return client.post('/api/v1/payments/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
      queryClient.invalidateQueries({ queryKey: ['payment-method-stats'] });
      setIsAddModalOpen(false);
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      return client.delete(`/api/v1/payments/${paymentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
      queryClient.invalidateQueries({ queryKey: ['payment-method-stats'] });
    },
  });

  const generateReceiptMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      // Try to download PDF receipt
      try {
        const response = await client.get(`/api/v1/payments/${paymentId}/receipt-pdf`, {
          responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `receipt_${paymentId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        return { success: true, message: 'PDF receipt downloaded' };
      } catch (error) {
        console.error('PDF generation failed:', error);
        
        // Fallback to HTML receipt
        const res = await client.post('/api/v1/payments/receipt', {
          payment_id: paymentId,
          include_ledger: true,
          include_guest_info: true,
        });
        
        // Open HTML in new window
        const htmlContent = res.data.receipt_data?.html_content || 
          `<h3>Receipt for Payment ${paymentId}</h3><p>HTML receipt generation fallback</p>`;
        const newWindow = window.open();
        newWindow?.document.write(htmlContent);
        newWindow?.document.close();
        
        return { success: true, message: 'HTML receipt generated', fallback: true };
      }
    },
    onSuccess: (data) => {
      if (!data.fallback) {
        // Show success toast for PDF
        alert(`PDF receipt downloaded successfully for payment`);
      }
    },
    onError: (error) => {
      console.error('Receipt generation error:', error);
      alert('Failed to generate receipt. Please try again.');
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
  });

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'bg-status-green';
      case 'bank_transfer': return 'bg-accent-primary';
      case 'pos': return 'bg-status-yellow';
      default: return 'bg-text-muted';
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'bank_transfer': return 'Bank Transfer';
      case 'pos': return 'POS';
      default: return method;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Helper function to get guest info
  const getGuestInfo = (guestId: string) => {
    const guest = guests?.find((g: any) => g.id === guestId);
    return guest ? `${guest.full_name}` : 'Unknown Guest';
  };

  // Helper function to get room info from assignments
  const getRoomInfo = (assignmentId: string) => {
    const stay = activeAssignments?.find((s: any) => s.assignment_id === assignmentId);
    return stay ? `Room ${stay.room_number}` : 'Unknown Room';
  };

  const filteredPayments = payments?.filter(payment => {
    if (dateFilter && payment.created_at.split('T')[0] !== dateFilter) return false;
    if (methodFilter && payment.method !== methodFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <CreditCard size={28} className="text-accent-primary" />
          Payment Management
        </h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary gap-2"
        >
          <Plus size={20} />
          Record Payment
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Today's Revenue</p>
              {isStatsLoading ? (
                <Loader2 className="animate-spin text-text-muted mt-2" size={20} />
              ) : (
                <p className="text-3xl font-bold text-status-green mt-2">
                  {formatCurrency(dailyStats?.total_amount || 0)}
                </p>
              )}
            </div>
            <TrendingUp size={32} className="text-status-green opacity-50" />
          </div>
        </div>

        <div className="card-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Cash Payments</p>
              {isStatsLoading ? (
                <Loader2 className="animate-spin text-text-muted mt-2" size={20} />
              ) : (
                <p className="text-3xl font-bold text-accent-primary mt-2">
                  {formatCurrency(dailyStats?.breakdown?.cash?.amount || 0)}
                </p>
              )}
            </div>
            <CreditCard size={32} className="text-accent-primary opacity-50" />
          </div>
        </div>

        <div className="card-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Total Payments</p>
              {isPaymentsLoading ? (
                <Loader2 className="animate-spin text-text-muted mt-2" size={20} />
              ) : (
                <p className="text-3xl font-bold text-accent-warm mt-2">
                  {payments?.length || 0}
                </p>
              )}
            </div>
            <FileText size={32} className="text-accent-warm opacity-50" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-surface">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-text-muted" />
            <span className="text-sm font-medium text-text-muted">Filter by:</span>
          </div>
          <div className="flex-1 flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-text-muted" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="input-base text-sm max-w-[180px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-text-muted" />
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="input-base text-sm max-w-[180px]"
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="pos">POS</option>
              </select>
            </div>
            <button
              onClick={() => {
                setDateFilter('');
                setMethodFilter('');
              }}
              className="text-sm text-text-muted hover:text-text-primary px-3 py-2 hover:bg-bg-elevated rounded"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Payment Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-text-muted font-medium uppercase tracking-wider">
                <th className="pb-3 px-4">Date & Time</th>
                <th className="pb-3 px-4">Method</th>
                <th className="pb-3 px-4">Amount</th>
                <th className="pb-3 px-4">Guest</th>
                <th className="pb-3 px-4">Room</th>
                <th className="pb-3 px-4">Description</th>
                <th className="pb-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isPaymentsLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Loader2 size={32} className="animate-spin text-accent-primary mx-auto" />
                  </td>
                </tr>
              ) : filteredPayments?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center gap-3">
                      <CreditCard size={48} className="opacity-30" />
                      <p>No payments found</p>
                      {dateFilter || methodFilter ? (
                        <button
                          onClick={() => {
                            setDateFilter('');
                            setMethodFilter('');
                          }}
                          className="text-sm text-accent-primary hover:underline"
                        >
                          Clear filters to see all payments
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments?.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-border hover:bg-bg-elevated transition-colors group"
                  >
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <p className="font-medium">{new Date(payment.created_at).toLocaleDateString()}</p>
                        <p className="text-xs text-text-muted">{new Date(payment.created_at).toLocaleTimeString()}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${getMethodColor(payment.method)} text-white`}>
                        {getMethodLabel(payment.method)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-status-green">{formatCurrency(payment.amount)}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm font-medium">{getGuestInfo(payment.guest_id)}</p>
                      <p className="text-xs text-text-muted">ID: {payment.guest_id.substring(0, 8)}...</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm">{getRoomInfo(payment.assignment_id)}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm max-w-[200px] truncate" title={payment.description}>
                        {payment.description || 'Payment'}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => generateReceiptMutation.mutate(payment.id)}
                          className="p-1.5 text-text-muted hover:text-accent-primary"
                          title="Generate Receipt"
                        >
                          <Receipt size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
                              deletePaymentMutation.mutate(payment.id);
                            }
                          }}
                          className="p-1.5 text-text-muted hover:text-status-red"
                          title="Delete Payment"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Method Breakdown */}
      {methodStats && methodStats.length > 0 && (
        <div className="card-surface">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-accent-primary" />
            Payment Method Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {methodStats.map((stat: any) => (
              <div key={stat.method} className="bg-bg-elevated p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getMethodColor(stat.method)} text-white`}>
                    {getMethodLabel(stat.method)}
                  </span>
                  <span className="text-sm text-text-muted">{stat.payment_count} payments</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(stat.total_amount)}</p>
                <div className="mt-3">
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent-primary rounded-full" 
                      style={{ width: `${Math.min(stat.percentage || 33, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
            >
              <X size={24} />
            </button>
            
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <CreditCard className="text-accent-primary" />
              Record New Payment
            </h3>

            <form onSubmit={handleSubmit((data) => addPaymentMutation.mutate(data))} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Select Active Stay</label>
                  <select
                    {...register('assignment_id')}
                    className={`input-base ${errors.assignment_id ? 'border-status-red' : ''}`}
                  >
                    <option value="">Choose active stay...</option>
                    {activeAssignments?.map((stay: any) => (
                      <option key={stay.assignment_id} value={stay.assignment_id}>
                        {stay.room_number} - {stay.guest_name} (Balance: ₦{stay.balance?.toLocaleString() || '0'})
                      </option>
                    ))}
                  </select>
                  {errors.assignment_id && <p className="text-status-red text-xs mt-1">{errors.assignment_id.message}</p>}
                  <p className="text-[10px] text-text-muted mt-2">Only active stays with open ledger are shown</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Select Guest</label>
                  <select
                    {...register('guest_id')}
                    className={`input-base ${errors.guest_id ? 'border-status-red' : ''}`}
                  >
                    <option value="">Choose guest...</option>
                    {guests?.map((guest: any) => (
                      <option key={guest.id} value={guest.id}>
                        {guest.full_name} ({guest.phone})
                      </option>
                    ))}
                  </select>
                  {errors.guest_id && <p className="text-status-red text-xs mt-1">{errors.guest_id.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Payment Method</label>
                  <select
                    {...register('method')}
                    className={`input-base ${errors.method ? 'border-status-red' : ''}`}
                  >
                    <option value="">Select method...</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="pos">POS</option>
                  </select>
                  {errors.method && <p className="text-status-red text-xs mt-1">{errors.method.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Amount (₦)</label>
                  <input
                    {...register('amount', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className={`input-base ${errors.amount ? 'border-status-red' : ''}`}
                  />
                  {errors.amount && <p className="text-status-red text-xs mt-1">{errors.amount.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Description (Optional)</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="Add payment description..."
                  className={`input-base resize-none ${errors.description ? 'border-status-red' : ''}`}
                />
              </div>

              {addPaymentMutation.isError && (
                <div className="p-3 bg-status-red bg-opacity-10 border border-status-red border-opacity-20 rounded flex items-start gap-3 text-status-red text-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{(addPaymentMutation.error as any).response?.data?.detail || 'Failed to record payment'}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated">
                  Cancel
                </button>
                <button type="submit" disabled={addPaymentMutation.isPending} className="btn-primary px-8">
                  {addPaymentMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};