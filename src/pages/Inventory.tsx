import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, X, Package, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { formatCurrency, getStockStatus, getStatusColor } from '../utils';
import { InventoryItem, InventoryTransaction } from '../types';
import { v4 as uuidv4 } from 'uuid';

export default function InventoryPage() {
  const { state, dispatch, currentUser, addAuditLog, addNotification } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showStockForm, setShowStockForm] = useState<{ item: InventoryItem; type: 'in' | 'out' } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [form, setForm] = useState({ name: '', category: '', quantity: 0, unit: '', minStock: 0, costPerUnit: 0, supplier: '' });
  const [stockForm, setStockForm] = useState({ quantity: 0, reason: '' });

  const categories = [...new Set(state.inventory.map(i => i.category))];

  const filteredItems = state.inventory.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || i.category === categoryFilter;
    const status = getStockStatus(i.quantity, i.minStock);
    const matchStock = stockFilter === 'all' || status === stockFilter;
    return matchSearch && matchCategory && matchStock;
  });

  const totalPages = Math.ceil(filteredItems.length / perPage);
  const paginatedItems = filteredItems.slice((page - 1) * perPage, page * perPage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      dispatch({ type: 'UPDATE_INVENTORY', payload: { ...editingItem, ...form, lastUpdated: new Date().toISOString().split('T')[0] } });
    } else {
      const newItem: InventoryItem = { id: uuidv4(), ...form, lastUpdated: new Date().toISOString().split('T')[0] };
      dispatch({ type: 'ADD_INVENTORY', payload: newItem });
      addAuditLog('inventory_created', 'inventory', newItem.id, form);
    }
    setShowForm(false);
    setEditingItem(null);
    setForm({ name: '', category: '', quantity: 0, unit: '', minStock: 0, costPerUnit: 0, supplier: '' });
  };

  const handleStockTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showStockForm) return;
    const { item, type } = showStockForm;

    if (type === 'out' && stockForm.quantity > item.quantity) {
      alert(`Insufficient stock. Only ${item.quantity} ${item.unit} available.`);
      return;
    }

    const newQuantity = type === 'in' ? item.quantity + stockForm.quantity : item.quantity - stockForm.quantity;
    const transaction: InventoryTransaction = {
      id: uuidv4(), itemId: item.id,
      type: type === 'in' ? 'stock_in' : 'stock_out',
      quantity: stockForm.quantity, previousQuantity: item.quantity, newQuantity,
      reason: stockForm.reason, userId: currentUser?.id || '',
      date: new Date().toISOString(),
    };

    dispatch({ type: 'UPDATE_INVENTORY', payload: { ...item, quantity: newQuantity, lastUpdated: new Date().toISOString().split('T')[0] } });
    dispatch({ type: 'ADD_INVENTORY_TRANSACTION', payload: transaction });
    addAuditLog(`inventory_stock_${type}`, 'inventory', item.id, { quantity: stockForm.quantity });
    
    if (type === 'out' && newQuantity <= item.minStock) {
      addNotification('Low Stock Alert', `${item.name} is now below minimum stock level`, 'inventory');
    }

    setShowStockForm(null);
    setStockForm({ quantity: 0, reason: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      dispatch({ type: 'DELETE_INVENTORY', payload: id });
      addAuditLog('inventory_deleted', 'inventory', id, {});
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search items..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={stockFilter} onChange={e => { setStockFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="all">All Stock</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
          {(search || categoryFilter !== 'all' || stockFilter !== 'all') && (
            <button onClick={() => { setSearch(''); setCategoryFilter('all'); setStockFilter('all'); setPage(1); }} className="text-sm text-amber-600 hover:underline">Clear Filters</button>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHistory(true)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">History</button>
          <button onClick={() => { setForm({ name: '', category: '', quantity: 0, unit: '', minStock: 0, costPerUnit: 0, supplier: '' }); setEditingItem(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left p-3 font-medium text-slate-600">Item</th>
                <th className="text-left p-3 font-medium text-slate-600 hidden md:table-cell">Category</th>
                <th className="text-left p-3 font-medium text-slate-600">Qty</th>
                <th className="text-left p-3 font-medium text-slate-600 hidden lg:table-cell">Cost/Unit</th>
                <th className="text-left p-3 font-medium text-slate-600 hidden lg:table-cell">Total Value</th>
                <th className="text-left p-3 font-medium text-slate-600 hidden sm:table-cell">Supplier</th>
                <th className="text-left p-3 font-medium text-slate-600">Status</th>
                <th className="text-left p-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map(item => {
                const status = getStockStatus(item.quantity, item.minStock);
                return (
                  <tr key={item.id} className={`border-b border-slate-50 hover:bg-slate-50 ${status === 'low_stock' ? 'bg-amber-50/50' : status === 'out_of_stock' ? 'bg-red-50/50' : ''}`}>
                    <td className="p-3"><p className="font-medium">{item.name}</p><p className="text-xs text-slate-500">{item.unit}</p></td>
                    <td className="p-3 hidden md:table-cell">{item.category}</td>
                    <td className="p-3 font-medium">{item.quantity}</td>
                    <td className="p-3 hidden lg:table-cell">{formatCurrency(item.costPerUnit)}</td>
                    <td className="p-3 hidden lg:table-cell">{formatCurrency(item.quantity * item.costPerUnit)}</td>
                    <td className="p-3 hidden sm:table-cell">{item.supplier}</td>
                    <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(status)}`}>{status.replace(/_/g, ' ')}</span></td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <button onClick={() => { setShowStockForm({ item, type: 'in' }); setStockForm({ quantity: 0, reason: '' }); }}
                          className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100" title="Stock In">+In</button>
                        <button onClick={() => { setShowStockForm({ item, type: 'out' }); setStockForm({ quantity: 0, reason: '' }); }}
                          className="px-2 py-1 text-xs bg-orange-50 text-orange-600 rounded hover:bg-orange-100" title="Stock Out">-Out</button>
                        <button onClick={() => { setEditingItem(item); setForm({ name: item.name, category: item.category, quantity: item.quantity, unit: item.unit, minStock: item.minStock, costPerUnit: item.costPerUnit, supplier: item.supplier }); setShowForm(true); }}
                          className="px-2 py-1 text-xs bg-amber-50 text-amber-600 rounded hover:bg-amber-100">Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">Del</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedItems.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-slate-500">No inventory items found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Item Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6 animate-fadeIn max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingItem ? 'Edit Item' : 'Add Inventory Item'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="text-sm font-medium">Item Name *</label><input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium">Category *</label><input type="text" required value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="text-sm font-medium">Unit *</label><input type="text" required value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="pieces, liters..." /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-sm font-medium">Quantity *</label><input type="number" required min="0" value={form.quantity} onChange={e => setForm({...form, quantity: parseInt(e.target.value) || 0})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="text-sm font-medium">Min Stock *</label><input type="number" required min="0" value={form.minStock} onChange={e => setForm({...form, minStock: parseInt(e.target.value) || 0})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="text-sm font-medium">Cost/Unit *</label><input type="number" required min="0" step="0.01" value={form.costPerUnit} onChange={e => setForm({...form, costPerUnit: parseFloat(e.target.value) || 0})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <div><label className="text-sm font-medium">Supplier</label><input type="text" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">{editingItem ? 'Update' : 'Add Item'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Transaction Modal */}
      {showStockForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowStockForm(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-6 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">
              {showStockForm.type === 'in' ? '📦 Stock In' : '📤 Stock Out'}: {showStockForm.item.name}
            </h3>
            <p className="text-sm text-slate-500 mb-4">Current stock: {showStockForm.item.quantity} {showStockForm.item.unit}</p>
            <form onSubmit={handleStockTransaction} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Quantity *</label>
                <input type="number" required min="1" max={showStockForm.type === 'out' ? showStockForm.item.quantity : undefined}
                  value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: parseInt(e.target.value) || 0})}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                {showStockForm.type === 'in' && <p className="text-xs text-green-600 mt-1">New total: {showStockForm.item.quantity + stockForm.quantity} {showStockForm.item.unit}</p>}
                {showStockForm.type === 'out' && <p className="text-xs text-orange-600 mt-1">New total: {showStockForm.item.quantity - stockForm.quantity} {showStockForm.item.unit}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Reason *</label>
                <input type="text" required value={stockForm.reason} onChange={e => setStockForm({...stockForm, reason: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="e.g., Used for services, Restocked..." />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className={`flex-1 py-2 text-white rounded-lg text-sm font-medium ${showStockForm.type === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                  Confirm {showStockForm.type === 'in' ? 'Stock In' : 'Stock Out'}
                </button>
                <button type="button" onClick={() => setShowStockForm(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowHistory(false)}>
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 animate-fadeIn max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Inventory Transaction History</h3>
              <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
            </div>
            <div className="space-y-2">
              {state.inventoryTransactions.sort((a, b) => b.date.localeCompare(a.date)).map(t => {
                const item = state.inventory.find(i => i.id === t.itemId);
                const user = state.users.find(u => u.id === t.userId);
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'stock_in' ? 'bg-green-100' : t.type === 'stock_out' ? 'bg-orange-100' : 'bg-amber-100'}`}>
                      {t.type === 'stock_in' ? <ArrowDownCircle size={16} className="text-green-600" /> : <ArrowUpCircle size={16} className="text-orange-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{t.quantity} {item?.unit} • {t.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{t.previousQuantity} → {t.newQuantity}</p>
                      <p className="text-xs text-slate-400">{user?.name} • {new Date(t.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
              {state.inventoryTransactions.length === 0 && <p className="text-center text-slate-500 py-4">No transactions yet</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
