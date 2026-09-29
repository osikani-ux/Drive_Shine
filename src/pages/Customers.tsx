import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, X, Phone, Mail, MapPin, Car } from 'lucide-react';
import { formatDate, formatCurrency, getStatusColor } from '../utils';
import { Customer, Vehicle } from '../types';
import { v4 as uuidv4 } from 'uuid';

export default function CustomersPage() {
  const { state, dispatch, addAuditLog, addNotification } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showProfile, setShowProfile] = useState<Customer | null>(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [form, setForm] = useState({ name: '', phone: '', email: '', location: '', status: 'active' as 'active' | 'inactive' });
  const [vehicleForm, setVehicleForm] = useState({ make: '', model: '', year: new Date().getFullYear(), color: '', plateNumber: '', type: 'sedan' as Vehicle['type'], notes: '' });

  const locations = [...new Set(state.customers.map(c => c.location))];

  const filteredCustomers = state.customers.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchLocation = locationFilter === 'all' || c.location === locationFilter;
    return matchSearch && matchStatus && matchLocation;
  });

  const totalPages = Math.ceil(filteredCustomers.length / perPage);
  const paginatedCustomers = filteredCustomers.slice((page - 1) * perPage, page * perPage);

  const getCustomerStats = (customerId: string) => {
    const bookings = state.bookings.filter(b => b.customerId === customerId);
    const totalSpent = state.payments.filter(p => {
      const booking = state.bookings.find(b => b.id === p.bookingId);
      return booking?.customerId === customerId && p.status === 'paid';
    }).reduce((sum, p) => sum + p.amount, 0);
    return { visits: bookings.length, totalSpent, lastService: bookings.length > 0 ? bookings.sort((a, b) => b.date.localeCompare(a.date))[0].date : null };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      dispatch({ type: 'UPDATE_CUSTOMER', payload: { ...editingCustomer, ...form } });
      addAuditLog('customer_updated', 'customer', editingCustomer.id, form);
    } else {
      const newCustomer: Customer = { id: uuidv4(), ...form, createdAt: new Date().toISOString().split('T')[0] };
      dispatch({ type: 'ADD_CUSTOMER', payload: newCustomer });
      addAuditLog('customer_created', 'customer', newCustomer.id, form);
      addNotification('New Customer', `${form.name} has been added`, 'system');
    }
    setShowForm(false);
    setEditingCustomer(null);
    setForm({ name: '', phone: '', email: '', location: '', status: 'active' });
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showProfile) return;
    const newVehicle: Vehicle = { id: uuidv4(), customerId: showProfile.id, ...vehicleForm };
    dispatch({ type: 'ADD_VEHICLE', payload: newVehicle });
    setShowVehicleForm(false);
    setVehicleForm({ make: '', model: '', year: new Date().getFullYear(), color: '', plateNumber: '', type: 'sedan', notes: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      dispatch({ type: 'DELETE_CUSTOMER', payload: id });
      addAuditLog('customer_deleted', 'customer', id, {});
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by name, phone, email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={locationFilter} onChange={e => { setLocationFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="all">All Locations</option>
            {locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          {(search || statusFilter !== 'all' || locationFilter !== 'all') && (
            <button onClick={() => { setSearch(''); setStatusFilter('all'); setLocationFilter('all'); setPage(1); }} className="text-sm text-amber-600 hover:underline">Clear Filters</button>
          )}
        </div>
        <button onClick={() => { setForm({ name: '', phone: '', email: '', location: '', status: 'active' }); setEditingCustomer(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left p-3 font-medium text-slate-600">Name</th>
                <th className="text-left p-3 font-medium text-slate-600 hidden md:table-cell">Phone</th>
                <th className="text-left p-3 font-medium text-slate-600 hidden lg:table-cell">Location</th>
                <th className="text-left p-3 font-medium text-slate-600 hidden lg:table-cell">Visits</th>
                <th className="text-left p-3 font-medium text-slate-600 hidden sm:table-cell">Total Spent</th>
                <th className="text-left p-3 font-medium text-slate-600">Status</th>
                <th className="text-left p-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map(c => {
                const stats = getCustomerStats(c.id);
                return (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-3">
                      <button onClick={() => setShowProfile(c)} className="font-medium text-amber-600 hover:underline">{c.name}</button>
                      <p className="text-xs text-slate-500">{c.email}</p>
                    </td>
                    <td className="p-3 hidden md:table-cell">{c.phone}</td>
                    <td className="p-3 hidden lg:table-cell">{c.location}</td>
                    <td className="p-3 hidden lg:table-cell">{stats.visits}</td>
                    <td className="p-3 hidden sm:table-cell">{formatCurrency(stats.totalSpent)}</td>
                    <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(c.status)}`}>{c.status}</span></td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setShowProfile(c)} className="px-2 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200">View</button>
                        <button onClick={() => { setEditingCustomer(c); setForm({ name: c.name, phone: c.phone, email: c.email, location: c.location, status: c.status }); setShowForm(true); }}
                          className="px-2 py-1 text-xs bg-amber-50 text-amber-600 rounded hover:bg-amber-100">Edit</button>
                        <button onClick={() => handleDelete(c.id)} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedCustomers.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">No customers match your search</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">Showing {(page-1)*perPage+1}-{Math.min(page*perPage, filteredCustomers.length)} of {filteredCustomers.length} records</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Previous</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page + i - 2;
                if (p < 1 || p > totalPages) return null;
                return <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 text-sm border rounded ${page === p ? 'bg-amber-600 text-white' : 'hover:bg-slate-50'}`}>{p}</button>;
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Phone *</label>
                <input type="tel" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
                  {editingCustomer ? 'Update' : 'Add Customer'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowProfile(null)}>
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 animate-fadeIn max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Customer Profile</h3>
              <button onClick={() => setShowProfile(null)} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
            </div>
            {(() => {
              const stats = getCustomerStats(showProfile.id);
              const vehicles = state.vehicles.filter(v => v.customerId === showProfile.id);
              const bookings = state.bookings.filter(b => b.customerId === showProfile.id).sort((a, b) => b.date.localeCompare(a.date));
              const membership = state.memberships.find(m => m.customerId === showProfile.id);
              const payments = state.payments.filter(p => bookings.some(b => b.id === p.bookingId));

              return (
                <div className="space-y-6">
                  {/* Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3"><Phone size={16} className="text-slate-400" /><div><p className="text-xs text-slate-500">Phone</p><p className="text-sm font-medium">{showProfile.phone}</p></div></div>
                    <div className="flex items-center gap-3"><Mail size={16} className="text-slate-400" /><div><p className="text-xs text-slate-500">Email</p><p className="text-sm font-medium">{showProfile.email}</p></div></div>
                    <div className="flex items-center gap-3"><MapPin size={16} className="text-slate-400" /><div><p className="text-xs text-slate-500">Location</p><p className="text-sm font-medium">{showProfile.location}</p></div></div>
                    <div><p className="text-xs text-slate-500">Status</p><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(showProfile.status)}`}>{showProfile.status}</span></div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-amber-600">{stats.visits}</p><p className="text-xs text-slate-500">Visits</p></div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalSpent)}</p><p className="text-xs text-slate-500">Total Spent</p></div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-purple-600">{vehicles.length}</p><p className="text-xs text-slate-500">Vehicles</p></div>
                  </div>

                  {/* Vehicles */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm flex items-center gap-2"><Car size={16} /> Vehicles</h4>
                      <button onClick={() => setShowVehicleForm(true)} className="text-xs text-amber-600 hover:underline">+ Add Vehicle</button>
                    </div>
                    {vehicles.length > 0 ? vehicles.map(v => (
                      <div key={v.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{v.year} {v.make} {v.model}</p>
                          <p className="text-xs text-slate-500">{v.color} • {v.plateNumber} • {v.type}</p>
                        </div>
                      </div>
                    )) : <p className="text-sm text-slate-500">No vehicles registered</p>}
                  </div>

                  {/* Membership */}
                  {membership && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Membership</h4>
                      <div className="p-3 bg-indigo-50 rounded-lg">
                        <p className="text-sm font-medium capitalize">{membership.type} Membership</p>
                        <p className="text-xs text-slate-500">{membership.servicesUsed}/{membership.includedServices} services used • Expires: {formatDate(membership.expiryDate)}</p>
                      </div>
                    </div>
                  )}

                  {/* Recent Bookings */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Recent Bookings</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {bookings.slice(0, 5).map(b => {
                        const service = state.services.find(s => s.id === b.serviceId);
                        return (
                          <div key={b.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">{service?.name}</p>
                              <p className="text-xs text-slate-500">{formatDate(b.date)} • {b.startTime}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(b.status)}`}>{b.status.replace('_', ' ')}</span>
                          </div>
                        );
                      })}
                      {bookings.length === 0 && <p className="text-sm text-slate-500">No bookings yet</p>}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Vehicle Form Modal */}
      {showVehicleForm && showProfile && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setShowVehicleForm(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Add Vehicle</h3>
              <button onClick={() => setShowVehicleForm(false)} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddVehicle} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium">Make *</label><input type="text" required value={vehicleForm.make} onChange={e => setVehicleForm({...vehicleForm, make: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="text-sm font-medium">Model *</label><input type="text" required value={vehicleForm.model} onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="text-sm font-medium">Year *</label><input type="number" required value={vehicleForm.year} onChange={e => setVehicleForm({...vehicleForm, year: parseInt(e.target.value)})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="text-sm font-medium">Color *</label><input type="text" required value={vehicleForm.color} onChange={e => setVehicleForm({...vehicleForm, color: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="text-sm font-medium">Plate Number *</label><input type="text" required value={vehicleForm.plateNumber} onChange={e => setVehicleForm({...vehicleForm, plateNumber: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="text-sm font-medium">Type</label>
                  <select value={vehicleForm.type} onChange={e => setVehicleForm({...vehicleForm, type: e.target.value as any})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                    <option value="sedan">Sedan</option><option value="suv">SUV</option><option value="truck">Truck</option><option value="van">Van</option><option value="hatchback">Hatchback</option><option value="coupe">Coupe</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">Add Vehicle</button>
                <button type="button" onClick={() => setShowVehicleForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
