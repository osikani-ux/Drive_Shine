import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, X } from 'lucide-react';
import { formatDate, formatCurrency, getStatusColor, getMembershipStatus } from '../utils';
import { Membership, MembershipType } from '../types';
import { v4 as uuidv4 } from 'uuid';

export default function MembershipsPage() {
  const { state, dispatch, addAuditLog, addNotification } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null);
  const [showDetail, setShowDetail] = useState<Membership | null>(null);

  const [form, setForm] = useState({
    customerId: '', type: 'basic' as MembershipType, price: 100,
    startDate: new Date().toISOString().split('T')[0], expiryDate: new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
    includedServices: 4, paymentStatus: 'paid' as 'paid' | 'pending',
  });

  const filteredMemberships = state.memberships.map(m => ({
    ...m,
    computedStatus: getMembershipStatus(m.startDate, m.expiryDate),
  })).filter(m => {
    const customer = state.customers.find(c => c.id === m.customerId);
    const matchSearch = !search || customer?.name.toLowerCase().includes(search.toLowerCase()) || customer?.phone.includes(search);
    const matchType = typeFilter === 'all' || m.type === typeFilter;
    const matchStatus = statusFilter === 'all' || m.computedStatus === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const status = getMembershipStatus(form.startDate, form.expiryDate);
    if (editingMembership) {
      dispatch({ type: 'UPDATE_MEMBERSHIP', payload: { ...editingMembership, ...form, status } });
      addAuditLog('membership_updated', 'membership', editingMembership.id, form);
    } else {
      const newMembership: Membership = {
        id: uuidv4(), ...form, status, servicesUsed: 0,
      };
      dispatch({ type: 'ADD_MEMBERSHIP', payload: newMembership });
      addAuditLog('membership_created', 'membership', newMembership.id, form);
      addNotification('New Membership', `Membership created for ${state.customers.find(c => c.id === form.customerId)?.name}`, 'membership');
    }
    setShowForm(false);
    setEditingMembership(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this membership?')) {
      dispatch({ type: 'DELETE_MEMBERSHIP', payload: id });
    }
  };

  const membershipPrices: Record<MembershipType, number> = { basic: 100, premium: 200, vip: 500, custom: 0 };
  const membershipServices: Record<MembershipType, number> = { basic: 4, premium: 8, vip: 20, custom: 0 };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="all">All Types</option>
            <option value="basic">Basic</option><option value="premium">Premium</option><option value="vip">VIP</option><option value="custom">Custom</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="all">All Status</option>
            <option value="active">Active</option><option value="expiring_soon">Expiring Soon</option><option value="expired">Expired</option>
          </select>
          {(search || typeFilter !== 'all' || statusFilter !== 'all') && (
            <button onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); }} className="text-sm text-amber-600 hover:underline">Clear Filters</button>
          )}
        </div>
        <button onClick={() => { setEditingMembership(null); setForm({ customerId: '', type: 'basic', price: 100, startDate: new Date().toISOString().split('T')[0], expiryDate: new Date(Date.now() + 30*86400000).toISOString().split('T')[0], includedServices: 4, paymentStatus: 'paid' }); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
          <Plus size={16} /> New Membership
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left p-3 font-medium text-slate-600">Customer</th>
                <th className="text-left p-3 font-medium text-slate-600">Type</th>
                <th className="text-left p-3 font-medium text-slate-600 hidden md:table-cell">Price</th>
                <th className="text-left p-3 font-medium text-slate-600 hidden lg:table-cell">Services</th>
                <th className="text-left p-3 font-medium text-slate-600 hidden md:table-cell">Expiry</th>
                <th className="text-left p-3 font-medium text-slate-600">Status</th>
                <th className="text-left p-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMemberships.map(m => {
                const customer = state.customers.find(c => c.id === m.customerId);
                return (
                  <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-3"><p className="font-medium">{customer?.name}</p><p className="text-xs text-slate-500">{customer?.phone}</p></td>
                    <td className="p-3"><span className="capitalize font-medium">{m.type}</span></td>
                    <td className="p-3 hidden md:table-cell">{formatCurrency(m.price)}</td>
                    <td className="p-3 hidden lg:table-cell">{m.servicesUsed}/{m.includedServices}</td>
                    <td className="p-3 hidden md:table-cell">{formatDate(m.expiryDate)}</td>
                    <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(m.computedStatus)}`}>{m.computedStatus.replace(/_/g, ' ')}</span></td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={() => setShowDetail(m)} className="px-2 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200">View</button>
                        <button onClick={() => { setEditingMembership(m); setForm({ customerId: m.customerId, type: m.type, price: m.price, startDate: m.startDate, expiryDate: m.expiryDate, includedServices: m.includedServices, paymentStatus: m.paymentStatus }); setShowForm(true); }}
                          className="px-2 py-1 text-xs bg-amber-50 text-amber-600 rounded hover:bg-amber-100">Edit</button>
                        <button onClick={() => handleDelete(m.id)} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">Del</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredMemberships.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-500">No memberships found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6 animate-fadeIn max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingMembership ? 'Edit Membership' : 'New Membership'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="text-sm font-medium">Customer *</label>
                <select required value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                  <option value="">Select customer</option>
                  {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium">Type *</label>
                <select required value={form.type} onChange={e => { const t = e.target.value as MembershipType; setForm({...form, type: t, price: membershipPrices[t], includedServices: membershipServices[t]}); }}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                  <option value="basic">Basic</option><option value="premium">Premium</option><option value="vip">VIP</option><option value="custom">Custom</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium">Price *</label><input type="number" required value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="text-sm font-medium">Included Services *</label><input type="number" required value={form.includedServices} onChange={e => setForm({...form, includedServices: parseInt(e.target.value)})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium">Start Date *</label><input type="date" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="text-sm font-medium">Expiry Date *</label><input type="date" required value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">{editingMembership ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6 animate-fadeIn max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Membership Details</h3>
              <button onClick={() => setShowDetail(null)} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
            </div>
            {(() => {
              const customer = state.customers.find(c => c.id === showDetail.customerId);
              const computedStatus = getMembershipStatus(showDetail.startDate, showDetail.expiryDate);
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-slate-500">Customer</p><p className="font-medium">{customer?.name}</p></div>
                    <div><p className="text-slate-500">Phone</p><p className="font-medium">{customer?.phone}</p></div>
                    <div><p className="text-slate-500">Type</p><p className="font-medium capitalize">{showDetail.type}</p></div>
                    <div><p className="text-slate-500">Price</p><p className="font-medium">{formatCurrency(showDetail.price)}</p></div>
                    <div><p className="text-slate-500">Start Date</p><p className="font-medium">{formatDate(showDetail.startDate)}</p></div>
                    <div><p className="text-slate-500">Expiry Date</p><p className="font-medium">{formatDate(showDetail.expiryDate)}</p></div>
                    <div><p className="text-slate-500">Services Used</p><p className="font-medium">{showDetail.servicesUsed}/{showDetail.includedServices}</p></div>
                    <div><p className="text-slate-500">Status</p><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(computedStatus)}`}>{computedStatus.replace(/_/g, ' ')}</span></div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">Services Remaining</p>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div className="bg-amber-600 h-3 rounded-full" style={{ width: `${(showDetail.servicesUsed / showDetail.includedServices) * 100}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{showDetail.includedServices - showDetail.servicesUsed} of {showDetail.includedServices} remaining</p>
                  </div>
                </div>
              );
            })()}
            <button onClick={() => setShowDetail(null)} className="mt-4 w-full py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
