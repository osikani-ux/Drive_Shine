import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, X } from 'lucide-react';
import { formatDate, formatCurrency, exportToCSV, exportToExcel, exportToPDF } from '../utils';
import { Expense } from '../types';
import { v4 as uuidv4 } from 'uuid';

export default function ExpensesPage() {
  const { state, dispatch, currentUser, addAuditLog } = useApp();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: '', description: '', amount: 0, date: new Date().toISOString().split('T')[0], paymentMethod: 'cash', supplier: '' });

  const categories = ['Water', 'Cleaning Chemicals', 'Electricity', 'Equipment', 'Staff Expenses', 'Maintenance', 'Transport', 'Other'];

  const filteredExpenses = state.expenses.filter(e => {
    const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase()) || e.supplier.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || e.category === categoryFilter;
    return matchSearch && matchCategory;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newExpense: Expense = {
      id: uuidv4(), ...form, addedBy: currentUser?.id || '',
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
    addAuditLog('expense_created', 'expense', newExpense.id, form);
    setShowForm(false);
    setForm({ category: '', description: '', amount: 0, date: new Date().toISOString().split('T')[0], paymentMethod: 'cash', supplier: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this expense?')) {
      dispatch({ type: 'DELETE_EXPENSE', payload: id });
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const data = filteredExpenses.map(e => ({
      Date: e.date, Category: e.category, Description: e.description,
      Amount: e.amount, Method: e.paymentMethod, Supplier: e.supplier,
    }));
    if (format === 'csv') exportToCSV(data, 'expenses');
    else if (format === 'excel') exportToExcel(data, 'expenses');
    else exportToPDF(data, 'expenses', 'Expense Report');
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <div className="relative group">
            <button className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Export ▾</button>
            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border hidden group-hover:block z-10">
              <button onClick={() => handleExport('csv')} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">CSV</button>
              <button onClick={() => handleExport('excel')} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">Excel</button>
              <button onClick={() => handleExport('pdf')} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">PDF</button>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
        <p className="text-sm text-slate-500">Total Expenses (filtered)</p>
        <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
        <p className="text-xs text-slate-400">{filteredExpenses.length} records</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left p-3 font-medium text-slate-600">Date</th>
                <th className="text-left p-3 font-medium text-slate-600">Category</th>
                <th className="text-left p-3 font-medium text-slate-600 hidden md:table-cell">Description</th>
                <th className="text-left p-3 font-medium text-slate-600">Amount</th>
                <th className="text-left p-3 font-medium text-slate-600 hidden sm:table-cell">Method</th>
                <th className="text-left p-3 font-medium text-slate-600 hidden lg:table-cell">Supplier</th>
                <th className="text-left p-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(e => (
                <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="p-3">{formatDate(e.date)}</td>
                  <td className="p-3"><span className="text-xs px-2 py-0.5 bg-slate-100 rounded">{e.category}</span></td>
                  <td className="p-3 hidden md:table-cell">{e.description}</td>
                  <td className="p-3 font-medium text-red-600">{formatCurrency(e.amount)}</td>
                  <td className="p-3 hidden sm:table-cell capitalize">{e.paymentMethod.replace('_', ' ')}</td>
                  <td className="p-3 hidden lg:table-cell">{e.supplier}</td>
                  <td className="p-3"><button onClick={() => handleDelete(e.id)} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">Delete</button></td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-500">No expenses found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Add Expense</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="text-sm font-medium">Category *</label>
                <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium">Description *</label><input type="text" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium">Amount *</label><input type="number" required step="0.01" value={form.amount} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="text-sm font-medium">Date *</label><input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium">Payment Method</label>
                  <select value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                    <option value="cash">Cash</option><option value="mobile_money">Mobile Money</option><option value="card">Card</option><option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div><label className="text-sm font-medium">Supplier</label><input type="text" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">Add Expense</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
