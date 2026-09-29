import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, X, Receipt, Printer } from 'lucide-react';
import { formatDate, formatCurrency, getStatusColor, generateReceipt } from '../utils';
import { Payment } from '../types';
import { v4 as uuidv4 } from 'uuid';

export default function PaymentsPage() {
  const { state, dispatch, currentUser, addAuditLog, addNotification } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [viewReceipt, setViewReceipt] = useState<Payment | null>(null);

  const [form, setForm] = useState({ bookingId: '', amount: 0, method: 'cash' as Payment['method'], status: 'paid' as Payment['status'] });

  const filteredPayments = state.payments.filter(p => {
    const booking = state.bookings.find(b => b.id === p.bookingId);
    const customer = booking ? state.customers.find(c => c.id === booking.customerId) : null;
    const matchSearch = !search || customer?.name.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search);
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchMethod = methodFilter === 'all' || p.method === methodFilter;
    return matchSearch && matchStatus && matchMethod;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const booking = state.bookings.find(b => b.id === form.bookingId);
    if (!booking) return;

    const newPayment: Payment = {
      id: uuidv4(), bookingId: form.bookingId, amount: form.amount,
      method: form.method, date: new Date().toISOString().split('T')[0],
      status: form.status, createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_PAYMENT', payload: newPayment });

    if (form.status === 'paid') {
      dispatch({ type: 'UPDATE_BOOKING', payload: { ...booking, paymentStatus: 'paid' } });
    }

    addAuditLog('payment_created', 'payment', newPayment.id, { amount: form.amount });
    addNotification('Payment Received', `Payment of ${formatCurrency(form.amount)} received`, 'payment');
    setShowForm(false);
    setForm({ bookingId: '', amount: 0, method: 'cash', status: 'paid' });
  };

  const handlePrintReceipt = (payment: Payment) => {
    const booking = state.bookings.find(b => b.id === payment.bookingId);
    const customer = booking ? state.customers.find(c => c.id === booking.customerId) : null;
    const vehicle = booking ? state.vehicles.find(v => v.id === booking.vehicleId) : null;
    const service = booking ? state.services.find(s => s.id === booking.serviceId) : null;
    generateReceipt(payment, booking, customer, vehicle, service, currentUser);
  };

  const unpaidBookings = state.bookings.filter(b => b.paymentStatus !== 'paid' && b.status !== 'cancelled');

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search payments..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="all">All Status</option>
            <option value="paid">Paid</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="refunded">Refunded</option>
          </select>
          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="all">All Methods</option>
            <option value="cash">Cash</option><option value="mobile_money">Mobile Money</option><option value="card">Card</option><option value="bank_transfer">Bank Transfer</option>
          </select>
          {(search || statusFilter !== 'all' || methodFilter !== 'all') && (
            <button onClick={() => { setSearch(''); setStatusFilter('all'); setMethodFilter('all'); }} className="text-sm text-amber-600 hover:underline">Clear</button>
          )}
        </div>
        <button onClick={() => { setForm({ bookingId: unpaidBookings[0]?.id || '', amount: 0, method: 'cash', status: 'paid' }); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
          <Plus size={16} /> Record Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500">Total Revenue</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(state.payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0))}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500">Pending</p>
          <p className="text-xl font-bold text-amber-600">{formatCurrency(state.payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0))}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500">Refunded</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(state.payments.filter(p => p.status === 'refunded').reduce((s, p) => s + p.amount, 0))}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500">Total Payments</p>
          <p className="text-xl font-bold text-amber-600">{state.payments.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left p-3 font-medium text-slate-600">Customer</th>
                <th className="text-left p-3 font-medium text-slate-600 hidden md:table-cell">Service</th>
                <th className="text-left p-3 font-medium text-slate-600">Amount</th>
                <th className="text-left p-3 font-medium text-slate-600 hidden sm:table-cell">Method</th>
                <th className="text-left p-3 font-medium text-slate-600 hidden md:table-cell">Date</th>
                <th className="text-left p-3 font-medium text-slate-600">Status</th>
                <th className="text-left p-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(p => {
                const booking = state.bookings.find(b => b.id === p.bookingId);
                const customer = booking ? state.customers.find(c => c.id === booking.customerId) : null;
                const service = booking ? state.services.find(s => s.id === booking.serviceId) : null;
                return (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-3 font-medium">{customer?.name || 'Unknown'}</td>
                    <td className="p-3 hidden md:table-cell">{service?.name}</td>
                    <td className="p-3 font-medium">{formatCurrency(p.amount)}</td>
                    <td className="p-3 hidden sm:table-cell capitalize">{p.method.replace('_', ' ')}</td>
                    <td className="p-3 hidden md:table-cell">{formatDate(p.date)}</td>
                    <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(p.status)}`}>{p.status}</span></td>
                    <td className="p-3">
                      <button onClick={() => handlePrintReceipt(p)} className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 flex items-center gap-1">
                        <Receipt size={12} /> Receipt
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-500">No payments found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Record Payment</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="text-sm font-medium">Booking *</label>
                <select required value={form.bookingId} onChange={e => {
                  const booking = state.bookings.find(b => b.id === e.target.value);
                  setForm({...form, bookingId: e.target.value, amount: booking?.price || 0});
                }} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select booking</option>
                  {unpaidBookings.map(b => {
                    const c = state.customers.find(cu => cu.id === b.customerId);
                    const s = state.services.find(se => se.id === b.serviceId);
                    return <option key={b.id} value={b.id}>{c?.name} - {s?.name} (GH₵{b.price})</option>;
                  })}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium">Amount *</label><input type="number" required step="0.01" value={form.amount} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="text-sm font-medium">Method *</label>
                  <select value={form.method} onChange={e => setForm({...form, method: e.target.value as any})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                    <option value="cash">Cash</option><option value="mobile_money">Mobile Money</option><option value="card">Card</option><option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
              <div><label className="text-sm font-medium">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                  <option value="paid">Paid</option><option value="pending">Pending</option><option value="failed">Failed</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">Record Payment</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
