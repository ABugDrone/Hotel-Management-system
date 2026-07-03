import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, BedDouble, Utensils, Loader2, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react';
import client from '../../api/client';
import { PaymentMethod } from '../../types';

interface StaySummary {
  assignment_id: string;
  guest_name: string;
  room_number: string;
  check_in_date: string;
  balance: number;
}

interface LedgerEntry {
  id: string;
  entry_type: string;
  description: string;
  amount: number;
  running_balance: number;
  created_at: string;
}

interface FoodOrderItem {
  id: string;
  food_item_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  food_item?: { name: string; price: number };
}

interface FoodOrder {
  id: string;
  guest_id: string;
  assignment_id: string;
  status: string;
  total_amount: number;
  notes?: string;
  created_at: string;
  items?: FoodOrderItem[];
}

interface DirtyRoom {
  id: string;
  number: string;
  status: string;
}

interface CheckOutRequest {
  assignment_id: string;
  payment_method?: string;
  amount_paid: number;
}

const statusColor = (s: string) => {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };
  return map[s] || 'bg-gray-100 text-gray-800';
};

const paymentMethodOptions: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'pos', label: 'POS' },
];

export const CheckoutPage = () => {
  const queryClient = useQueryClient();
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const { data: activeStays, isLoading: staysLoading } = useQuery<StaySummary[]>({
    queryKey: ['active-stays'],
    queryFn: async () => {
      const res = await client.get('/api/v1/rooms/assignments/active');
      return res.data;
    },
    refetchInterval: 10000,
  });

  const { data: dirtyRooms, isLoading: dirtyLoading } = useQuery<DirtyRoom[]>({
    queryKey: ['dirty-rooms'],
    queryFn: async () => {
      const res = await client.get('/api/v1/rooms/', { params: { status: 'dirty' } });
      return res.data;
    },
    refetchInterval: 10000,
  });

  const { data: ledgerEntries } = useQuery<LedgerEntry[]>({
    queryKey: ['ledger', selectedAssignment],
    queryFn: async () => {
      const res = await client.get(`/api/v1/payments/ledger/assignment/${selectedAssignment}`);
      return res.data;
    },
    enabled: !!selectedAssignment,
  });

  const { data: foodOrders } = useQuery<FoodOrder[]>({
    queryKey: ['food-orders', selectedAssignment],
    queryFn: async () => {
      const res = await client.get('/api/v1/restaurant/orders', {
        params: { assignment_id: selectedAssignment }
      });
      return res.data;
    },
    enabled: !!selectedAssignment,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (data: CheckOutRequest) => {
      const res = await client.post('/api/v1/rooms/check-out', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-stays'] });
      queryClient.invalidateQueries({ queryKey: ['dirty-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setSelectedAssignment(null);
      setAmountPaid(0);
      setCheckoutError(null);
    },
    onError: (err: any) => {
      setCheckoutError(err.response?.data?.detail || 'Checkout failed');
    },
  });

  const cleanMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const res = await client.patch(`/api/v1/rooms/${roomId}/status`, null, {
        params: { status: 'available' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dirty-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room-stats'] });
    },
  });

  const selectedStay = activeStays?.find(s => s.assignment_id === selectedAssignment);
  const charges = ledgerEntries?.filter(e => e.entry_type === 'charge') || [];
  const payments = ledgerEntries?.filter(e => e.entry_type === 'payment') || [];
  const totalCharges = charges.reduce((sum, e) => sum + e.amount, 0);
  const totalPayments = payments.reduce((sum, e) => sum + e.amount, 0);
  const netBalance = selectedStay?.balance ?? (totalCharges - totalPayments);

  const handleCheckout = () => {
    if (!selectedAssignment) return;
    checkoutMutation.mutate({
      assignment_id: selectedAssignment,
      payment_method: paymentMethod,
      amount_paid: amountPaid,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <LogOut size={28} className="text-accent-primary" />
            Check-out
          </h2>
          <p className="text-text-muted mt-1">Manage guest checkout, payments, and room cleaning</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card-surface">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BedDouble size={20} className="text-accent-primary" />
              Active Stays ({activeStays?.length || 0})
            </h3>
            {staysLoading ? (
              <div className="flex justify-center py-8"><Loader2 size={32} className="animate-spin text-accent-primary" /></div>
            ) : !activeStays?.length ? (
              <p className="text-text-muted py-8 text-center">No active stays</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-muted">Guest</th>
                      <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-muted">Room</th>
                      <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-muted">Check-in</th>
                      <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-muted">Balance</th>
                      <th className="px-4 py-3 text-xs uppercase tracking-wider text-text-muted"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {activeStays.map((stay) => (
                      <tr
                        key={stay.assignment_id}
                        className={`hover:bg-bg-elevated transition-colors cursor-pointer ${
                          selectedAssignment === stay.assignment_id ? 'bg-bg-elevated' : ''
                        }`}
                        onClick={() => {
                          setSelectedAssignment(stay.assignment_id);
                          setAmountPaid(Math.max(0, stay.balance));
                          setCheckoutError(null);
                        }}
                      >
                        <td className="px-4 py-3 font-medium">{stay.guest_name}</td>
                        <td className="px-4 py-3">{stay.room_number}</td>
                        <td className="px-4 py-3 text-sm text-text-muted">
                          {new Date(stay.check_in_date).toLocaleDateString()}
                        </td>
                        <td className={`px-4 py-3 font-bold ${stay.balance > 0 ? 'text-status-red' : 'text-status-green'}`}>
                          ₦{stay.balance.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${statusColor('active')}`}>
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selectedStay && (
            <div className="card-surface mt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-accent-primary" />
                Bill Summary — {selectedStay.guest_name} (Room {selectedStay.room_number})
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Room Charges</h4>
                  {charges.length === 0 ? (
                    <p className="text-sm text-text-muted">No charges recorded</p>
                  ) : (
                    <div className="space-y-1">
                      {charges.map((entry) => (
                        <div key={entry.id} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
                          <span>{entry.description}</span>
                          <span className="font-medium">₦{entry.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {foodOrders && foodOrders.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Utensils size={16} /> Restaurant Orders
                    </h4>
                    <div className="space-y-1">
                      {foodOrders.map((order) => (
                        <div key={order.id} className="border-b border-border pb-2 mb-2 last:border-0">
                          <div className="flex justify-between text-sm">
                            <span className="text-text-muted">
                              Order #{order.id.slice(0, 8)} — {new Date(order.created_at).toLocaleDateString()}
                            </span>
                            <span className="font-medium">₦{order.total_amount.toLocaleString()}</span>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div className="ml-4 mt-1 text-xs text-text-muted">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between">
                                  <span>{item.food_item?.name || 'Item'} x{item.quantity}</span>
                                  <span>₦{item.subtotal.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {payments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Payments Made</h4>
                    <div className="space-y-1">
                      {payments.map((entry) => (
                        <div key={entry.id} className="flex justify-between text-sm py-1 border-b border-border last:border-0 text-status-green">
                          <span>{entry.description}</span>
                          <span className="font-medium">-₦{entry.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Outstanding Balance</span>
                  <span className={netBalance > 0 ? 'text-status-red' : 'text-status-green'}>
                    ₦{netBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-4 space-y-4">
                <h4 className="font-semibold">Process Checkout</h4>
                {checkoutError && (
                  <div className="p-3 bg-status-red bg-opacity-10 border border-status-red border-opacity-20 rounded flex items-start gap-2 text-status-red text-sm">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{checkoutError}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="input-base w-full"
                    >
                      {paymentMethodOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Amount Paid (₦)</label>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={e => setAmountPaid(Number(e.target.value))}
                      className="input-base w-full"
                      min={0}
                      step={100}
                    />
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={checkoutMutation.isPending || amountPaid < 0}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {checkoutMutation.isPending ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <><LogOut size={20} /> Complete Check-out</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="card-surface">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-accent-primary" />
              Dirty Rooms — Cleaning
            </h3>
            {dirtyLoading ? (
              <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-accent-primary" /></div>
            ) : !dirtyRooms?.length ? (
              <p className="text-text-muted py-8 text-center">All rooms are clean</p>
            ) : (
              <div className="space-y-3">
                {dirtyRooms.map((room) => (
                  <div key={room.id} className="p-3 bg-bg-elevated rounded border border-border flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{room.number}</p>
                      <p className="text-xs text-text-muted">Waiting for cleaning</p>
                    </div>
                    <button
                      onClick={() => cleanMutation.mutate(room.id)}
                      disabled={cleanMutation.isPending}
                      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                    >
                      {cleanMutation.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <><CheckCircle2 size={14} /> Mark Clean</>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};