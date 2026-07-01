/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Box, CheckCircle2, Filter, Loader2, Plus, RefreshCw, Search, TrendingDown, TrendingUp, X } from 'lucide-react';
import apiClient from '../../api/client';

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  current_quantity: number;
  minimum_quantity: number;
  unit_cost: number;
  total_value: number;
  last_restocked: string | null;
  supplier: string | null;
  location: string | null;
  low_stock: boolean;
}

interface InventoryTransaction {
  id: string;
  item_id: string;
  transaction_type: 'RESTOCK' | 'CONSUMPTION' | 'ADJUSTMENT' | 'DAMAGE' | 'TRANSFER';
  quantity: number;
  unit_cost: number;
  total_cost: number;
  reference: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  item?: InventoryItem;
}

const InventoryPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [newItem, setNewItem] = useState({
    name: '', description: '', category: 'FOOD', unit: 'pcs', current_quantity: 0,
    minimum_quantity: 10, unit_cost: 0, supplier: '', location: '',
  });
  const [newTransaction, setNewTransaction] = useState({
    transaction_type: 'RESTOCK' as const, quantity: 0, unit_cost: 0, reference: '', notes: '',
  });

  const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4000); };
  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };

  const { data: inventoryItems = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['inventory-items', selectedCategory, showLowStock],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (showLowStock) params.append('low_stock', 'true');
      const res = await apiClient.get(`/api/v1/inventory/items?${params}`);
      return res.data;
    },
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['inventory-transactions'],
    queryFn: async () => { const res = await apiClient.get('/api/v1/inventory/transactions'); return res.data; },
  });

  const addItemMutation = useMutation({
    mutationFn: async (itemData: any) => { const res = await apiClient.post('/api/v1/inventory/items', itemData); return res.data; },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      setIsAddItemDialogOpen(false);
      setNewItem({ name: '', description: '', category: 'FOOD', unit: 'pcs', current_quantity: 0, minimum_quantity: 10, unit_cost: 0, supplier: '', location: '' });
      showSuccess('Inventory item added successfully');
    },
    onError: (error: any) => showError(error.response?.data?.detail || 'Failed to add inventory item'),
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => { const res = await apiClient.post('/api/v1/inventory/transactions', transactionData); return res.data; },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      setIsTransactionDialogOpen(false);
      setNewTransaction({ transaction_type: 'RESTOCK', quantity: 0, unit_cost: 0, reference: '', notes: '' });
      setSelectedItem(null);
      showSuccess('Inventory transaction recorded successfully');
    },
    onError: (error: any) => showError(error.response?.data?.detail || 'Failed to record transaction'),
  });

  const filteredItems = inventoryItems.filter((item: InventoryItem) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) || (item.supplier || '').toLowerCase().includes(q);
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const getStockStatusStyle = (item: InventoryItem) => {
    if (item.current_quantity === 0) return { style: 'text-status-red bg-status-red bg-opacity-10', text: 'Out of Stock' };
    if (item.low_stock) return { style: 'text-accent-warm bg-status-yellow bg-opacity-10', text: 'Low Stock' };
    if (item.current_quantity > item.minimum_quantity * 2) return { style: 'text-status-green bg-status-green bg-opacity-10', text: 'Good Stock' };
    return { style: 'text-text-muted bg-bg-elevated', text: 'In Stock' };
  };

  const getTransactionTypeStyle = (type: string) => {
    switch (type) {
      case 'RESTOCK': return { style: 'text-status-green bg-status-green bg-opacity-10', icon: TrendingUp };
      case 'CONSUMPTION': return { style: 'text-accent-primary bg-accent-primary bg-opacity-10', icon: TrendingDown };
      case 'ADJUSTMENT': return { style: 'text-accent-warm bg-status-yellow bg-opacity-10', icon: null };
      case 'DAMAGE': return { style: 'text-status-red bg-status-red bg-opacity-10', icon: AlertCircle };
      case 'TRANSFER': return { style: 'text-text-muted bg-bg-elevated', icon: null };
      default: return { style: 'text-text-muted bg-bg-elevated', icon: null };
    }
  };

  const totalInventoryValue = inventoryItems.reduce((t: number, item: InventoryItem) => t + item.total_value, 0);

  const submitTransaction = () => {
    if (!selectedItem) return;
    if (newTransaction.quantity <= 0) { showError('Please enter a valid quantity'); return; }
    createTransactionMutation.mutate({ ...newTransaction, item_id: selectedItem.id, unit_cost: newTransaction.unit_cost || selectedItem.unit_cost });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Box size={28} className="text-accent-primary" />
            Inventory Management
          </h2>
          <p className="text-text-muted mt-1">Manage hotel inventory, stock levels, and transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => queryClient.invalidateQueries()} className="px-4 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors flex items-center gap-2 min-h-[44px]">
            <RefreshCw size={18} /> Refresh
          </button>
          <button onClick={() => setIsAddItemDialogOpen(true)} className="btn-primary gap-2">
            <Plus size={20} /> Add Item
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
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Total Items</p>
          <p className="text-3xl font-bold mt-2">{inventoryItems.length}</p>
          <p className="text-xs text-text-muted mt-1">Items in inventory</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Low Stock Items</p>
          <p className="text-3xl font-bold text-accent-warm mt-2">{inventoryItems.filter((i: InventoryItem) => i.low_stock).length}</p>
          <p className="text-xs text-text-muted mt-1">Need restocking</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Out of Stock</p>
          <p className="text-3xl font-bold text-status-red mt-2">{inventoryItems.filter((i: InventoryItem) => i.current_quantity === 0).length}</p>
          <p className="text-xs text-text-muted mt-1">Zero quantity</p>
        </div>
        <div className="card-surface">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Total Value</p>
          <p className="text-3xl font-bold text-status-green mt-2">{formatCurrency(totalInventoryValue)}</p>
          <p className="text-xs text-text-muted mt-1">Inventory worth</p>
        </div>
      </div>

      <div className="card-surface">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input placeholder="Search items by name, description, or supplier..." className="input-base pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap items-end">
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="input-base text-sm max-w-[180px]">
              <option value="">All Categories</option>
              <option value="FOOD">Food</option>
              <option value="BEVERAGE">Beverage</option>
              <option value="CLEANING">Cleaning Supplies</option>
              <option value="AMENITIES">Amenities</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OFFICE">Office Supplies</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer min-h-[44px]">
              <input type="checkbox" checked={showLowStock} onChange={(e) => setShowLowStock(e.target.checked)} className="rounded border-border bg-bg-elevated" />
              Low Stock Only
            </label>
            <button className="px-4 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors flex items-center gap-2 min-h-[44px]">
              <Filter size={18} /> Filter
            </button>
          </div>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between mb-4 px-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold">Inventory Items</h3>
            <p className="text-sm text-text-muted">{filteredItems.length} items found</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bg-elevated border-b border-border">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Item</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Min</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Unit Cost</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Total Value</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingItems ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center"><Loader2 size={32} className="animate-spin mx-auto text-accent-primary" /></td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-text-muted">No inventory items found</td></tr>
              ) : (
                filteredItems.map((item: InventoryItem) => {
                  const stock = getStockStatusStyle(item);
                  return (
                    <tr key={item.id} className="hover:bg-bg-elevated transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-text-muted">{item.description}</div>
                        {item.supplier && <div className="text-xs text-text-muted">Supplier: {item.supplier}</div>}
                      </td>
                      <td className="px-6 py-4"><span className="px-2 py-0.5 rounded text-xs font-bold uppercase text-text-muted bg-bg-elevated border border-border">{item.category}</span></td>
                      <td className="px-6 py-4 font-semibold">{item.current_quantity} {item.unit}</td>
                      <td className="px-6 py-4 text-text-muted">{item.minimum_quantity} {item.unit}</td>
                      <td className="px-6 py-4">{formatCurrency(item.unit_cost)}</td>
                      <td className="px-6 py-4 font-semibold">{formatCurrency(item.total_value)}</td>
                      <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${stock.style}`}>{stock.text}</span></td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setSelectedItem(item); setNewTransaction({ transaction_type: 'RESTOCK', quantity: 0, unit_cost: item.unit_cost, reference: '', notes: '' }); setIsTransactionDialogOpen(true); }}
                            className="px-3 py-1.5 rounded text-sm font-medium border border-border text-text-muted hover:bg-bg-elevated transition-colors"
                          >
                            Record Transaction
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between mb-4 px-6 pt-6">
          <div>
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
            <p className="text-sm text-text-muted">Latest inventory transactions</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bg-elevated border-b border-border">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Item</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Unit Cost</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Total Cost</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingTransactions ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><Loader2 size={32} className="animate-spin mx-auto text-accent-primary" /></td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-text-muted">No transactions found</td></tr>
              ) : (
                transactions.slice(0, 10).map((tx: InventoryTransaction) => {
                  const tt = getTransactionTypeStyle(tx.transaction_type);
                  return (
                    <tr key={tx.id} className="hover:bg-bg-elevated transition-colors">
                      <td className="px-6 py-4 text-sm">{formatDate(tx.created_at)}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{tx.item?.name || 'Unknown'}</div>
                        <div className="text-xs text-text-muted">ID: {tx.item_id.substring(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${tt.style}`}>{tx.transaction_type}</span></td>
                      <td className="px-6 py-4 font-semibold">{tx.quantity} {tx.item?.unit || ''}</td>
                      <td className="px-6 py-4">{formatCurrency(tx.unit_cost)}</td>
                      <td className="px-6 py-4 font-semibold">{formatCurrency(tx.total_cost)}</td>
                      <td className="px-6 py-4 text-sm max-w-[200px] truncate">{tx.notes || 'N/A'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddItemDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsAddItemDialogOpen(false)} className="absolute right-4 top-4 text-text-muted hover:text-text-primary"><X size={24} /></button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><Box className="text-accent-primary" /> Add Inventory Item</h3>
            <p className="text-sm text-text-muted mb-6">Add a new item to the inventory</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Item Name</label>
                <input className="input-base" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Description</label>
                <textarea className="input-base min-h-[80px] resize-none" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="Brief description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Category</label>
                  <select className="input-base" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>
                    <option value="FOOD">Food</option>
                    <option value="BEVERAGE">Beverage</option>
                    <option value="CLEANING">Cleaning Supplies</option>
                    <option value="AMENITIES">Amenities</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="OFFICE">Office Supplies</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Unit</label>
                  <select className="input-base" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}>
                    <option value="pcs">Pieces</option>
                    <option value="kg">Kilograms</option>
                    <option value="l">Liters</option>
                    <option value="box">Boxes</option>
                    <option value="pack">Packs</option>
                    <option value="bottle">Bottles</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Current Qty</label>
                  <input className="input-base" type="number" min="0" value={newItem.current_quantity} onChange={(e) => setNewItem({ ...newItem, current_quantity: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Min Qty</label>
                  <input className="input-base" type="number" min="1" value={newItem.minimum_quantity} onChange={(e) => setNewItem({ ...newItem, minimum_quantity: parseInt(e.target.value) || 1 })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Unit Cost</label>
                  <input className="input-base" type="number" min="0" step="0.01" value={newItem.unit_cost} onChange={(e) => setNewItem({ ...newItem, unit_cost: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Supplier</label>
                  <input className="input-base" value={newItem.supplier} onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })} placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Location</label>
                  <input className="input-base" value={newItem.location} onChange={(e) => setNewItem({ ...newItem, location: e.target.value })} placeholder="Storage location" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsAddItemDialogOpen(false)} className="px-6 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors">Cancel</button>
              <button onClick={() => addItemMutation.mutate(newItem)} disabled={addItemMutation.isPending} className="btn-primary px-8">
                {addItemMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isTransactionDialogOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="card-surface w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => { setIsTransactionDialogOpen(false); setSelectedItem(null); }} className="absolute right-4 top-4 text-text-muted hover:text-text-primary"><X size={24} /></button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><Box className="text-accent-primary" /> Record Transaction</h3>
            <p className="text-sm text-text-muted mb-6">Record a transaction for {selectedItem.name}</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-bg-elevated rounded-lg border border-border">
                  <span className="text-sm text-text-muted">Current Stock</span>
                  <span className="font-semibold">{selectedItem.current_quantity} {selectedItem.unit}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-bg-elevated rounded-lg border border-border">
                  <span className="text-sm text-text-muted">Unit Cost</span>
                  <span className="font-semibold">{formatCurrency(selectedItem.unit_cost)}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Transaction Type</label>
                <select className="input-base" value={newTransaction.transaction_type} onChange={(e) => {
                  const type = e.target.value;
                  setNewTransaction({ ...newTransaction, transaction_type: type as any, unit_cost: type === 'RESTOCK' ? newTransaction.unit_cost : selectedItem.unit_cost });
                }}>
                  <option value="RESTOCK">Restock</option>
                  <option value="CONSUMPTION">Consumption</option>
                  <option value="ADJUSTMENT">Adjustment</option>
                  <option value="DAMAGE">Damage</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Quantity</label>
                  <input className="input-base" type="number" min="0" value={newTransaction.quantity} onChange={(e) => setNewTransaction({ ...newTransaction, quantity: parseFloat(e.target.value) || 0 })} required />
                </div>
                {newTransaction.transaction_type === 'RESTOCK' && (
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Unit Cost</label>
                    <input className="input-base" type="number" min="0" step="0.01" value={newTransaction.unit_cost} onChange={(e) => setNewTransaction({ ...newTransaction, unit_cost: parseFloat(e.target.value) || 0 })} />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Reference</label>
                  <input className="input-base" value={newTransaction.reference} onChange={(e) => setNewTransaction({ ...newTransaction, reference: e.target.value })} placeholder="Invoice #, PO #" />
                </div>
                <div className="flex justify-between items-center p-3 bg-bg-elevated rounded-lg border border-border">
                  <span className="text-sm text-text-muted">Total Cost</span>
                  <span className="font-semibold">{formatCurrency(newTransaction.quantity * newTransaction.unit_cost)}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Notes</label>
                <textarea className="input-base min-h-[80px] resize-none" value={newTransaction.notes} onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })} placeholder="Additional notes..." />
              </div>
              <div className="flex justify-between items-center p-3 bg-bg-elevated rounded-lg border border-border">
                <span className="text-sm text-text-muted">New Stock Level</span>
                <span className="font-semibold text-lg">
                  {(() => {
                    let nq = selectedItem.current_quantity;
                    if (newTransaction.transaction_type === 'RESTOCK') nq += newTransaction.quantity;
                    else if (['CONSUMPTION', 'DAMAGE'].includes(newTransaction.transaction_type)) nq -= newTransaction.quantity;
                    return `${nq} ${selectedItem.unit}`;
                  })()}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => { setIsTransactionDialogOpen(false); setSelectedItem(null); }} className="px-6 py-2 rounded font-medium text-text-muted hover:bg-bg-elevated transition-colors">Cancel</button>
              <button onClick={submitTransaction} disabled={createTransactionMutation.isPending || newTransaction.quantity <= 0} className="btn-primary px-8">
                {createTransactionMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : 'Record Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
