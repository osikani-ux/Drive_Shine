import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, Filter, X } from 'lucide-react';
import { formatTime, getStatusColor, formatDate } from '../utils';
import { Booking, BookingStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

export default function BookingsPage() {
  const { state, dispatch, addAuditLog, addNotification } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [showDetail, setShowDetail] = useState<Booking | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [form, setForm] = useState({
    customerId: '', vehicleId: '', serviceId: '', date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00', endTime: '10:00', staffId: '', notes: '', status: 'pending' as BookingStatus,
  });

  const filteredBookings = state.bookings.filter(b => {
    const customer = state.customers.find(c => c.id === b.customerId);
    const matchSearch = !search || customer?.name.toLowerCase().includes(search.toLowerCase()) || b.id.includes(search);
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));

  const totalPages = Math.ceil(filteredBookings.length / perPage);
  const paginatedBookings = filteredBookings.slice((page - 1) * perPage, page * perPage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const service = state.services.find(s => s.id === form.serviceId);
    if (!service) return;

    if (editingBooking) {
      const updated = { ...editingBooking, ...form, price: service.price };
      dispatch({ type: 'UPDATE_BOOKING', payload: updated });
      addAuditLog('booking_updated', 'booking', editingBooking.id, form);
      addNotification('Booking Updated', `Booking for ${state.customers.find(c => c.id === form.customerId)?.name} updated`, 'booking');
    } else {
      const newBooking: Booking = {
        id: uuidv4(), ...form, price: service.price,
        paymentStatus: 'pending', createdAt: new Date().toISOString().split('T')[0],
      };
      dispatch({ type: 'ADD_BOOKING', payload: newBooking });
      addAuditLog('booking_created', 'booking', newBooking.id, form);
      addNotification('New Booking', `New booking created for ${state.customers.find(c => c.id === form.customerId)?.name}`, 'booking');
    }
    setShowForm(false);
    setEditingBooking(null);
    resetForm();
  };

  const resetForm = () => setForm({
    customerId: '', vehicleId: '', serviceId: '', date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00', endTime: '10:00', staffId: '', notes: '', status: 'pending',
  });

  const openEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setForm({
      customerId: booking.customerId, vehicleId: booking.vehicleId, serviceId: booking.serviceId,
      date: booking.date, startTime: booking.startTime, endTime: booking.endTime,
      staffId: booking.staffId, notes: booking.notes, status: booking.status,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this booking?')) {
      dispatch({ type: 'DELETE_BOOKING', payload: id });
      addAuditLog('booking_deleted', 'booking', id, {});
    }
  };

  const customerVehicles = form.customerId ? state.vehicles.filter(v => v.customerId === form.customerId) : [];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search bookings..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {(search || statusFilter !== 'all') && (
            <button onClick={() => { setSearch(''); setStatusFilter('all'); }} className="text-sm text-amber-600 hover:underline">Clear</button>
          )}
        </div>
        <button onClick={() => { resetForm(); setEditingBooking(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
          <Plus size={16} /> New Booking
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left p-3 font-medium text-slate-600">Customer</th>
                <th className="text-left p-3 font-medium text-slate-600 hidden md:table-cell">Service</th>
                <th className="text-left p-3 font-medium text-slate-600">Date</th>
                <th className="text-left p-3 font-medium text-slate-600 hidden lg:table-cell">Time</th>
                <th className="text-left p-3 font-medium text-slate-600 hidden sm:table-cell">Price</th>
                <th className="text-left p-3 font-medium text-slate-600">Status</th>
                <th className="text-left p-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBookings.map(b => {
                const customer = state.customers.find(c => c.id === b.customerId);
                const service = state.services.find(s => s.id === b.serviceId);
                return (
                  <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-3"><p className="font-medium">{customer?.name}</p><p className="text-xs text-slate-500">{customer?.phone}</p></td>
                    <td className="p-3 hidden md:table-cell">{service?.name}</td>
                    <td className="p-3">{formatDate(b.date)}</td>
                    <td className="p-3 hidden lg:table-cell">{formatTime(b.startTime)}</td>
                    <td className="p-3 hidden sm:table-cell">GH₵{b.price}</td>
                    <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(b.status)}`}>{b.status.replace('_', ' ')}</span></td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setShowDetail(b)} className="px-2 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200">View</button>
                        <button onClick={() => openEdit(b)} className="px-2 py-1 text-xs bg-amber-50 text-amber-600 rounded hover:bg-amber-100">Edit</button>
                        <button onClick={() => handleDelete(b.id)} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedBookings.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">No bookings found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">Showing {(page-1)*perPage+1}-{Math.min(page*perPage, filteredBookings.length)} of {filteredBookings.length}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 text-sm border rounded ${page === p ? 'bg-amber-600 text-white' : 'hover:bg-slate-50'}`}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl w-full max-w-lg p-6 animate-fadeIn max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingBooking ? 'Edit Booking' : 'New Booking'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Customer *</label>
                  <select required value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value, vehicleId: ''})}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value="">Select customer</option>
                    {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Vehicle *</label>
                  <select required value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" disabled={!form.customerId}>
                    <option value="">Select vehicle</option>
                    {customerVehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Service *</label>
                  <select required value={form.serviceId} onChange={e => setForm({...form, serviceId: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value="">Select service</option>
                    {state.services.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name} - GH₵{s.price}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Staff *</label>
                  <select required value={form.staffId} onChange={e => setForm({...form, staffId: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value="">Select staff</option>
                    {state.users.filter(u => u.role !== 'admin' || state.users.length <= 3).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Date *</label>
                  <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Start *</label>
                    <input type="time" required value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">End *</label>
                    <input type="time" required value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" rows={2} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
                  {editingBooking ? 'Update Booking' : 'Create Booking'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Booking Details</h3>
            {(() => {
              const customer = state.customers.find(c => c.id === showDetail.customerId);
              const vehicle = state.vehicles.find(v => v.id === showDetail.vehicleId);
              const service = state.services.find(s => s.id === showDetail.serviceId);
              return (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-slate-500">Customer</p><p className="font-medium">{customer?.name}</p></div>
                    <div><p className="text-slate-500">Phone</p><p className="font-medium">{customer?.phone}</p></div>
                    <div><p className="text-slate-500">Vehicle</p><p className="font-medium">{vehicle?.year} {vehicle?.make} {vehicle?.model}</p></div>
                    <div><p className="text-slate-500">Plate</p><p className="font-medium">{vehicle?.plateNumber}</p></div>
                    <div><p className="text-slate-500">Service</p><p className="font-medium">{service?.name}</p></div>
                    <div><p className="text-slate-500">Price</p><p className="font-medium">GH₵{showDetail.price}</p></div>
                    <div><p className="text-slate-500">Date</p><p className="font-medium">{formatDate(showDetail.date)}</p></div>
                    <div><p className="text-slate-500">Time</p><p className="font-medium">{formatTime(showDetail.startTime)} - {formatTime(showDetail.endTime)}</p></div>
                  </div>
                  <div><p className="text-slate-500">Status</p><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(showDetail.status)}`}>{showDetail.status.replace('_', ' ')}</span></div>
                  {showDetail.notes && <div><p className="text-slate-500">Notes</p><p>{showDetail.notes}</p></div>}
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
