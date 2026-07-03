import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, DollarSign, Plus, Loader2, AlertCircle, Utensils, BedDouble, CreditCard } from 'lucide-react';
import client from '../../api/client';
import { Guest } from '../../types';

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

interface StaySummary {
  assignment_id: string;
  guest_name: string;
  room_number: string;
  check_in_date: string;
  balance: number;
}

export const GuestBillPage = () => {
  const { guestId } = useParams<{ guestId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showChargeForm, setShowChargeForm] = useState(false);
  const [chargeDesc, setChargeDesc] = useState('');
  const [chargeAmount, setChargeAmount] = useState(0);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');

  const { data: guest } = useQuery<Guest>({
    queryKey: ['guest', guestId],
    queryFn: async () => {
      const res = await client.get(`/api/v1/guests/${guestId}`);
      return res.data;
    },
    enabled: !!guestId,
  });

  const { data: assignments } = useQuery<StaySummary[]>({
    queryKey: ['guest-assignments', guestId],
    queryFn: async () => {
      const res = await client.get(`/api/v1/rooms/assignments/guest/${guestId}`);
      return res.data;
    },
    enabled: !!guestId,
  });

  const { data: ledger, isLoading: ledgerLoading } = useQuery<LedgerEntry[]>({
    queryKey: ['guest-ledger', guestId],
    queryFn: async () => {
      const res = await client.get(`/api/v1/payments/ledger/guest/${guestId}`);
      return res.data;
    },
    enabled: !!guestId,
  });

  const { data: foodOrders } = useQuery<FoodOrder[]>({
    queryKey: ['guest-food-orders', guestId],
    queryFn: async () => {
      const res = await client.get('/api/v1/restaurant/orders');
      const allOrders: FoodOrder[] = res.data;
      return allOrders.filter(o => o.guest_id === guestId);
    },
    enabled: !!guestId,
  });

  const addChargeMutation = useMutation({
    mutationFn: async () => {
      const res = await client.post('/api/v1/payments/charge', {
        assignment_id: selectedAssignmentId || (assignments && assignments.length > 0 ? assignments[0].assignment_id : ''),
        guest_id: guestId,
        description: chargeDesc,
        amount: chargeAmount,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-ledger', guestId] });
      setShowChargeForm(false);
      setChargeDesc('');
      setChargeAmount(0);
    },
  });

  const charges = ledger?.filter(e => e.entry_type === 'charge') || [];
  const payments = ledger?.filter(e => e.entry_type === 'payment') || [];
  const totalCharges = charges.reduce((s, e) => s + e.amount, 0);
  const totalPayments = payments.reduce((s, e) => s + e.amount, 0);
  const foodTotal = foodOrders?.reduce((s, o) => s + o.total_amount, 0) || 0;
  const balance = totalCharges + foodTotal - totalPayments;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/guests')} className="p-2 text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <User size={28} className="text-accent-primary" />
            {guest?.full_name || 'Loading...'}
          </h2>
          <p className="text-text-muted mt-1">{guest?.phone} {guest?.email ? `· ${guest.email}` : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-surface">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BedDouble size={20} className="text-accent-primary" />
              Charges
            </h3>
            {charges.length === 0 ? (
              <p className="text-text-muted py-4 text-center">No charges recorded</p>
            ) : (
              <div className="space-y-2">
                {charges.map((entry) => (
                  <div key={entry.id} className="flex justify-between text-sm py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium">{entry.description}</p>
                      <p className="text-xs text-text-muted">{new Date(entry.created_at).toLocaleString()}</p>
                    </div>
                    <span className="font-bold">₦{entry.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {foodOrders && foodOrders.length > 0 && (
            <div className="card-surface">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Utensils size={20} className="text-accent-primary" />
                Food Orders
              </h3>
              <div className="space-y-2">
                {foodOrders.map((order) => (
                  <div key={order.id} className="text-sm py-2 border-b border-border last:border-0">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-text-muted">{new Date(order.created_at).toLocaleDateString()} · {order.status}</p>
                      </div>
                      <span className="font-bold">₦{order.total_amount.toLocaleString()}</span>
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div className="mt-1 ml-4 text-xs text-text-muted space-y-0.5">
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

          <div className="card-surface">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard size={20} className="text-status-green" />
                Payments Made
              </h3>
            </div>
            {payments.length === 0 ? (
              <p className="text-text-muted py-4 text-center">No payments recorded</p>
            ) : (
              <div className="space-y-2">
                {payments.map((entry) => (
                  <div key={entry.id} className="flex justify-between text-sm py-2 border-b border-border last:border-0 text-status-green">
                    <div>
                      <p className="font-medium">{entry.description}</p>
                      <p className="text-xs text-text-muted">{new Date(entry.created_at).toLocaleString()}</p>
                    </div>
                    <span className="font-bold">-₦{entry.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-surface">
            <h3 className="text-lg font-semibold mb-4">Balance Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Room Charges</span>
                <span className="font-medium">₦{totalCharges.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Food Orders</span>
                <span className="font-medium">₦{foodTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Payments</span>
                <span className="font-medium text-status-green">-₦{totalPayments.toLocaleString()}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                <span>Balance</span>
                <span className={balance > 0 ? 'text-status-red' : 'text-status-green'}>
                  ₦{balance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="card-surface">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Plus size={20} className="text-accent-primary" />
                Add Charge
              </h3>
              <button
                onClick={() => setShowChargeForm(!showChargeForm)}
                className="btn-primary text-sm px-3 py-1.5"
              >
                {showChargeForm ? 'Cancel' : 'New'}
              </button>
            </div>
            {showChargeForm && (
              <div className="space-y-3">
                {assignments && assignments.length > 0 && (
                  <div>
                    <label className="block text-sm text-text-muted mb-1">Stay</label>
                    <select
                      value={selectedAssignmentId || (assignments.length > 0 ? assignments[0].assignment_id : '')}
                      onChange={e => setSelectedAssignmentId(e.target.value)}
                      className="input-base w-full"
                    >
                      {assignments.map(a => (
                        <option key={a.assignment_id} value={a.assignment_id}>
                          Room {a.room_number} ({new Date(a.check_in_date).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm text-text-muted mb-1">Description</label>
                  <input
                    value={chargeDesc}
                    onChange={e => setChargeDesc(e.target.value)}
                    className="input-base w-full"
                    placeholder="e.g., Mini bar, Extra towel, Damage fee"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-muted mb-1">Amount (₦)</label>
                  <input
                    type="number"
                    value={chargeAmount}
                    onChange={e => setChargeAmount(Number(e.target.value))}
                    className="input-base w-full"
                    min={0}
                  />
                </div>
                <button
                  onClick={() => addChargeMutation.mutate()}
                  disabled={addChargeMutation.isPending || !chargeDesc || chargeAmount <= 0}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {addChargeMutation.isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <><Plus size={18} /> Add Charge</>
                  )}
                </button>
                {addChargeMutation.isError && (
                  <p className="text-status-red text-sm flex items-center gap-1">
                    <AlertCircle size={14} /> Failed to add charge
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};