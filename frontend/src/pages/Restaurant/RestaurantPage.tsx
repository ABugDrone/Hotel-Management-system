/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Filter, Loader2, Minus, Plus, RefreshCw, Search, Utensils, X } from 'lucide-react';
import apiClient from '../../api/client';

interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
}

interface FoodOrder {
  id: string;
  guest_id: string;
  assignment_id: string;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED' | 'PAID';
  total_amount: number;
  notes: string;
  created_at: string;
  guest?: { name: string; room_number: string; };
  items?: OrderItem[];
}

interface OrderItem {
  id: string;
  food_item_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  food_item?: FoodItem;
}

const RestaurantPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [newOrder, setNewOrder] = useState({ guest_id: '', assignment_id: '', notes: '' });
  const [newFoodItem, setNewFoodItem] = useState({ name: '', description: '', price: 0, category: 'MAIN_COURSE', available: true });
  const [orderItems, setOrderItems] = useState<Array<{ food_item_id: string; quantity: number; }>>([]);

  const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4000); };
  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };

  const { data: foodItems = [], isLoading: isLoadingFoodItems } = useQuery({
    queryKey: ['food-items'],
    queryFn: async () => { const res = await apiClient.get('/api/v1/restaurant/items'); return res.data; },
  });

  const { data: foodOrders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['food-orders', selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      const res = await apiClient.get(`/api/v1/restaurant/orders?${params}`);
      return res.data;
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => { const res = await apiClient.post('/api/v1/restaurant/orders', orderData); return res.data; },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-orders'] });
      setIsCreateOrderDialogOpen(false);
      setNewOrder({ guest_id: '', assignment_id: '', notes: '' });
      setOrderItems([]);
      showSuccess('Food order created successfully');
    },
    onError: (error: any) => showError(error.response?.data?.detail || 'Failed to create order'),
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await apiClient.patch(`/api/v1/restaurant/orders/${orderId}/status`, { status });
      return res.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['food-orders'] }); showSuccess('Order status updated'); },
    onError: (error: any) => showError(error.response?.data?.detail || 'Failed to update order status'),
  });

  const addFoodItemMutation = useMutation({
    mutationFn: async (itemData: any) => { const res = await apiClient.post('/api/v1/restaurant/items', itemData); return res.data; },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-items'] });
      setIsAddItemDialogOpen(false);
      setNewFoodItem({ name: '', description: '', price: 0, category: 'MAIN_COURSE', available: true });
      showSuccess('Food item added successfully');
    },
    onError: (error: any) => showError(error.response?.data?.detail || 'Failed to add food item'),
  });

  const filteredOrders = foodOrders.filter((order: FoodOrder) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return order.id.toLowerCase().includes(q) || order.guest_id.toLowerCase().includes(q) ||
      (order.guest?.name || '').toLowerCase().includes(q) || (order.guest?.room_number || '').toLowerCase().includes(q);
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-accent-warm bg-status-yellow bg-opacity-10';
      case 'PREPARING': return 'text-accent-primary bg-accent-primary bg-opacity-10';
      case 'READY': return 'text-status-green bg-status-green bg-opacity-10';
      case 'DELIVERED': return 'text-text-muted bg-bg-elevated';
      case 'PAID': return 'text-status-green bg-status-green bg-opacity-10';
      case 'CANCELLED': return 'text-status-red bg-status-red bg-opacity-10';
      default: return 'text-text-muted bg-bg-elevated';
    }
  };

  const addItemToOrder = (foodItem: FoodItem) => {
    const existing = orderItems.find(i => i.food_item_id === foodItem.id);
    if (existing) setOrderItems(orderItems.map(i => i.food_item_id === foodItem.id ? { ...i, quantity: i.quantity + 1 } : i));
    else setOrderItems([...orderItems, { food_item_id: foodItem.id, quantity: 1 }]);
  };

  const removeItemFromOrder = (foodItemId: string) => setOrderItems(orderItems.filter(i => i.food_item_id !== foodItemId));

  const updateItemQuantity = (foodItemId: string, quantity: number) => {
    if (quantity <= 0) removeItemFromOrder(foodItemId);
    else setOrderItems(orderItems.map(i => i.food_item_id === foodItemId ? { ...i, quantity } : i));
  };

  const calculateOrderTotal = () =>
    orderItems.reduce((total, item) => {
      const fi = foodItems.find((f: FoodItem) => f.id === item.food_item_id);
      return total + (fi?.price || 0) * item.quantity;
    }, 0);

  const submitOrder = () => {
    if (!newOrder.guest_id || !newOrder.assignment_id || orderItems.length === 0) {
      showError('Please fill all required fields and add at least one item');
      return;
    }
    createOrderMutation.mutate({ ...newOrder, items: orderItems });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Utensils size={28} className="text-accent-primary" />
            Restaurant Management
          </h2>
          <p className="text-text-muted mt-1">Manage food orders, menu items, and restaurant operations</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => queryClient.invalidateQueries()} className="px-4 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors flex items-center gap-2 min-h-[44px]">
            <RefreshCw size={18} /> Refresh
          </button>
          <button onClick={() => setIsCreateOrderDialogOpen(true)} className="btn-primary gap-2">
            <Plus size={20} /> New Order
          </button>
          <button onClick={() => setIsAddItemDialogOpen(true)} className="px-4 py-2 rounded font-medium border border-border text-text-primary hover:bg-bg-elevated transition-colors flex items-center gap-2 min-h-[44px]">
            <Utensils size={18} /> Add Menu Item
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-status-red bg-opacity-10 border border-status-red border-opacity-20 rounded flex items-start gap-3 text-status-red text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" /><p>{errorMsg}</p>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-status-green bg-opacity-10 border border-status-green border-opacity-20 rounded flex items-start gap-3 text-status-green text-sm">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" /><p>{successMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Pending Orders</p>
          <p className="text-3xl font-bold text-accent-warm mt-2">{foodOrders.filter((o: FoodOrder) => o.status === 'PENDING').length}</p>
          <p className="text-xs text-text-muted mt-1">Awaiting preparation</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Preparing</p>
          <p className="text-3xl font-bold text-accent-primary mt-2">{foodOrders.filter((o: FoodOrder) => o.status === 'PREPARING').length}</p>
          <p className="text-xs text-text-muted mt-1">In kitchen</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Ready for Delivery</p>
          <p className="text-3xl font-bold text-status-green mt-2">{foodOrders.filter((o: FoodOrder) => o.status === 'READY').length}</p>
          <p className="text-xs text-text-muted mt-1">Awaiting delivery</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Today's Revenue</p>
          <p className="text-3xl font-bold text-accent-primary mt-2">
            {formatCurrency(foodOrders.filter((o: FoodOrder) => o.status === 'PAID').reduce((t: number, o: FoodOrder) => t + o.total_amount, 0))}
          </p>
          <p className="text-xs text-text-muted mt-1">From paid orders</p>
        </div>
      </div>

      <div className="card-surface">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input placeholder="Search orders by ID, guest name, or room..." className="input-base pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="input-base text-sm max-w-[160px]">
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="DELIVERED">Delivered</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
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
            <h3 className="text-lg font-semibold">Food Orders</h3>
            <p className="text-sm text-text-muted">{filteredOrders.length} orders found</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bg-elevated border-b border-border">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Guest</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingOrders ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center"><Loader2 size={32} className="animate-spin mx-auto text-accent-primary" /></td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-text-muted">No food orders found</td></tr>
              ) : (
                filteredOrders.map((order: FoodOrder) => (
                  <tr key={order.id} className="hover:bg-bg-elevated transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs">{order.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{order.guest?.name || order.guest_id}</div>
                      <div className="text-xs text-text-muted">Room: {order.guest?.room_number || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusStyle(order.status)}`}>{order.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold">{formatCurrency(order.total_amount)}</td>
                    <td className="px-6 py-4 text-sm">{formatDate(order.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatusMutation.mutate({ orderId: order.id, status: e.target.value })}
                          className="input-base text-sm max-w-[140px] py-1.5"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PREPARING">Preparing</option>
                          <option value="READY">Ready</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="PAID">Paid</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between mb-4 px-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold">Menu Items</h3>
            <p className="text-sm text-text-muted">{foodItems.length} items available</p>
          </div>
        </div>
        <div className="p-6 pt-0">
          {isLoadingFoodItems ? (
            <div className="py-12 flex justify-center"><Loader2 size={32} className="animate-spin text-accent-primary" /></div>
          ) : foodItems.length === 0 ? (
            <div className="py-12 text-center text-text-muted">No menu items found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {foodItems.map((item: FoodItem) => (
                <div key={item.id} className="bg-bg-elevated border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-text-muted mt-0.5">{item.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${item.available ? 'text-status-green bg-status-green bg-opacity-10' : 'text-status-red bg-status-red bg-opacity-10'}`}>
                          {item.available ? 'Available' : 'Unavailable'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase text-text-muted bg-bg-elevated border border-border">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xl font-bold">{formatCurrency(item.price)}</p>
                      <button
                        onClick={() => addItemToOrder(item)}
                        disabled={!item.available}
                        className="mt-2 px-3 py-1.5 rounded text-sm font-medium border border-border text-text-muted hover:bg-bg-elevated transition-colors disabled:opacity-50"
                      >
                        Add to Order
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isCreateOrderDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsCreateOrderDialogOpen(false)} className="absolute right-4 top-4 text-text-muted hover:text-text-primary"><X size={24} /></button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><Utensils className="text-accent-primary" /> Create New Food Order</h3>
            <p className="text-sm text-text-muted mb-6">Create a new food order for a guest</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Guest ID</label>
                  <input className="input-base" value={newOrder.guest_id} onChange={(e) => setNewOrder({ ...newOrder, guest_id: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Assignment ID</label>
                  <input className="input-base" value={newOrder.assignment_id} onChange={(e) => setNewOrder({ ...newOrder, assignment_id: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Order Notes</label>
                <textarea className="input-base min-h-[80px] resize-none" value={newOrder.notes} onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })} placeholder="Special instructions, allergies, etc." />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-text-muted">Order Items</label>
                  <span className="text-lg font-bold">Total: {formatCurrency(calculateOrderTotal())}</span>
                </div>
                {orderItems.length === 0 ? (
                  <div className="text-center py-4 text-text-muted border border-border rounded-md">No items added to order</div>
                ) : (
                  <div className="space-y-2">
                    {orderItems.map((item) => {
                      const fi = foodItems.find((f: FoodItem) => f.id === item.food_item_id);
                      if (!fi) return null;
                      return (
                        <div key={item.food_item_id} className="flex items-center justify-between border border-border rounded-md p-3">
                          <div>
                            <div className="font-medium">{fi.name}</div>
                            <div className="text-sm text-text-muted">{formatCurrency(fi.price)} &times; {item.quantity} = {formatCurrency(fi.price * item.quantity)}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateItemQuantity(item.food_item_id, item.quantity - 1)} className="w-8 h-8 rounded border border-border text-text-muted hover:bg-bg-elevated flex items-center justify-center"><Minus size={14} /></button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button onClick={() => updateItemQuantity(item.food_item_id, item.quantity + 1)} className="w-8 h-8 rounded border border-border text-text-muted hover:bg-bg-elevated flex items-center justify-center"><Plus size={14} /></button>
                            <button onClick={() => removeItemFromOrder(item.food_item_id)} className="px-3 py-1.5 rounded text-sm font-medium text-status-red hover:bg-status-red hover:bg-opacity-10 transition-colors">Remove</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Available Menu Items</label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {foodItems.filter((item: FoodItem) => item.available).map((item: FoodItem) => (
                    <div key={item.id} className="flex items-center justify-between border border-border rounded-md p-2">
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-text-muted">{formatCurrency(item.price)}</div>
                      </div>
                      <button onClick={() => addItemToOrder(item)} className="px-2 py-1 rounded text-xs font-medium border border-border text-text-muted hover:bg-bg-elevated transition-colors">Add</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsCreateOrderDialogOpen(false)} className="px-6 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors">Cancel</button>
              <button onClick={submitOrder} disabled={createOrderMutation.isPending || orderItems.length === 0} className="btn-primary px-8">
                {createOrderMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddItemDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsAddItemDialogOpen(false)} className="absolute right-4 top-4 text-text-muted hover:text-text-primary"><X size={24} /></button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><Utensils className="text-accent-primary" /> Add Menu Item</h3>
            <p className="text-sm text-text-muted mb-6">Add a new item to the restaurant menu</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Item Name</label>
                <input className="input-base" value={newFoodItem.name} onChange={(e) => setNewFoodItem({ ...newFoodItem, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Description</label>
                <textarea className="input-base min-h-[80px] resize-none" value={newFoodItem.description} onChange={(e) => setNewFoodItem({ ...newFoodItem, description: e.target.value })} placeholder="Brief description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Price</label>
                  <input className="input-base" type="number" min="0" step="0.01" value={newFoodItem.price} onChange={(e) => setNewFoodItem({ ...newFoodItem, price: parseFloat(e.target.value) || 0 })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Category</label>
                  <select className="input-base" value={newFoodItem.category} onChange={(e) => setNewFoodItem({ ...newFoodItem, category: e.target.value })}>
                    <option value="APPETIZER">Appetizer</option>
                    <option value="MAIN_COURSE">Main Course</option>
                    <option value="DESSERT">Dessert</option>
                    <option value="BEVERAGE">Beverage</option>
                    <option value="SNACK">Snack</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="available" checked={newFoodItem.available} onChange={(e) => setNewFoodItem({ ...newFoodItem, available: e.target.checked })} className="rounded border-border bg-bg-elevated" />
                <label htmlFor="available" className="text-sm text-text-primary">Available for ordering</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsAddItemDialogOpen(false)} className="px-6 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors">Cancel</button>
              <button onClick={() => addFoodItemMutation.mutate(newFoodItem)} disabled={addFoodItemMutation.isPending} className="btn-primary px-8">
                {addFoodItemMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantPage;
