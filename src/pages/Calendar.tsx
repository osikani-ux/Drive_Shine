import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { getMonthDays, getWeekDays, formatTime, getStatusColor } from '../utils';
import { isSameDay, isSameMonth, format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { Booking } from '../types';
import { v4 as uuidv4 } from 'uuid';

type ViewType = 'month' | 'week' | 'day' | 'agenda';

export default function CalendarPage() {
  const { state, dispatch, addAuditLog, addNotification } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    customerId: '', vehicleId: '', serviceId: '', date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00', endTime: '10:00', staffId: '', notes: '',
  });

  const monthDays = getMonthDays(currentDate);
  const weekDays = getWeekDays(currentDate);

  const getBookingsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return state.bookings.filter(b => b.date === dateStr);
  };

  const navigate = (dir: 'prev' | 'next' | 'today') => {
    if (dir === 'today') { setCurrentDate(new Date()); return; }
    const fns: Record<ViewType, (d: Date, n: number) => Date> = {
      month: dir === 'prev' ? subMonths : addMonths,
      week: dir === 'prev' ? subWeeks : addWeeks,
      day: dir === 'prev' ? subDays : addDays,
      agenda: dir === 'prev' ? subWeeks : addWeeks,
    };
    setCurrentDate(fns[view](currentDate, 1));
  };

  const handleStatusChange = (status: Booking['status']) => {
    if (!selectedBooking) return;
    const updated = { ...selectedBooking, status };
    dispatch({ type: 'UPDATE_BOOKING', payload: updated });
    setSelectedBooking(updated);
    addAuditLog('booking_updated', 'booking', selectedBooking.id, { status });
  };

  const openNewBooking = (date = currentDate, startTime = '09:00') => {
    const [hour, minute] = startTime.split(':').map(Number);
    const endHour = (hour + 1) % 24;
    setForm({
      customerId: '', vehicleId: '', serviceId: '', date: format(date, 'yyyy-MM-dd'),
      startTime, endTime: `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      staffId: '', notes: '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleCreateBooking = (event: React.FormEvent) => {
    event.preventDefault();
    if (form.endTime <= form.startTime) {
      setFormError('End time must be after the start time.');
      return;
    }
    const service = state.services.find(item => item.id === form.serviceId);
    if (!service) return;

    const booking: Booking = {
      id: uuidv4(), ...form, price: service.price,
      paymentStatus: 'pending', status: 'pending', createdAt: format(new Date(), 'yyyy-MM-dd'),
    };
    dispatch({ type: 'ADD_BOOKING', payload: booking });
    addAuditLog('booking_created', 'booking', booking.id, form);
    addNotification('New Booking', `New booking created for ${state.customers.find(customer => customer.id === form.customerId)?.name}`, 'booking');
    setShowForm(false);
  };

  const handleServiceChange = (serviceId: string) => {
    const service = state.services.find(item => item.id === serviceId);
    const [hour, minute] = form.startTime.split(':').map(Number);
    const endMinutes = hour * 60 + minute + (service?.duration ?? 60);
    const endTime = `${String(Math.floor(endMinutes / 60) % 24).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
    setForm({ ...form, serviceId, endTime });
    setFormError('');
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Controls */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('prev')} className="p-2 rounded-lg hover:bg-slate-100"><ChevronLeft size={18} /></button>
          <button onClick={() => navigate('today')} className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50">Today</button>
          <button onClick={() => navigate('next')} className="p-2 rounded-lg hover:bg-slate-100"><ChevronRight size={18} /></button>
          <h3 className="text-lg font-semibold ml-2">
            {view === 'month' && format(currentDate, 'MMMM yyyy')}
            {view === 'week' && `Week of ${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`}
            {view === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
            {view === 'agenda' && 'Upcoming Bookings'}
          </h3>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {(['month', 'week', 'day', 'agenda'] as ViewType[]).map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-sm rounded-md capitalize ${view === v ? 'bg-white shadow-sm font-medium' : 'hover:bg-slate-200'}`}>
              {v}
            </button>
          ))}
        </div>
        <button onClick={() => openNewBooking()} className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
          <Plus size={16} /> New Booking
        </button>
      </div>

      {/* Month View */}
      {view === 'month' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="p-2 text-center text-xs font-medium text-slate-500 bg-slate-50">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day, i) => {
              const dayBookings = getBookingsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isSameDay(day, new Date());
              return (
                <div key={i} className={`min-h-[80px] lg:min-h-[100px] border-b border-r border-slate-100 p-1 ${!isCurrentMonth ? 'bg-slate-50' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isCurrentDay ? 'bg-amber-600 text-white' : 'text-slate-600'}`}>
                      {format(day, 'd')}
                    </div>
                    <button onClick={() => openNewBooking(day)} aria-label={`Schedule booking on ${format(day, 'MMMM d, yyyy')}`} title="Schedule booking" className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-amber-100 hover:text-amber-700">
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 3).map(b => {
                      const customer = state.customers.find(c => c.id === b.customerId);
                      return (
                        <button
                          key={b.id}
                          onClick={() => setSelectedBooking(b)}
                          className={`w-full text-left text-[10px] lg:text-xs px-1 py-0.5 rounded truncate ${
                            b.status === 'completed' ? 'bg-green-100 text-green-800' :
                            b.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            b.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                            'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {b.startTime} {customer?.name.split(' ')[0]}
                        </button>
                      );
                    })}
                    {dayBookings.length > 3 && (
                      <p className="text-[10px] text-slate-500 px-1">+{dayBookings.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
          <div className="grid grid-cols-8 min-w-[700px]">
            <div className="border-r border-slate-100 p-2 bg-slate-50"><p className="text-xs font-medium text-slate-500">Time</p></div>
            {weekDays.map((day, i) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div key={i} className={`border-r border-slate-100 p-2 ${isToday ? 'bg-amber-50' : 'bg-slate-50'}`}>
                  <p className={`text-xs font-medium text-center ${isToday ? 'text-amber-600' : 'text-slate-500'}`}>{format(day, 'EEE d')}</p>
                </div>
              );
            })}
          </div>
          {Array.from({ length: 12 }, (_, i) => i + 7).map(hour => (
            <div key={hour} className="grid grid-cols-8 min-w-[700px] border-t border-slate-100">
              <div className="border-r border-slate-100 p-2"><p className="text-xs text-slate-500">{hour}:00</p></div>
              {weekDays.map((day, di) => {
                const dayBookings = getBookingsForDate(day).filter(b => parseInt(b.startTime.split(':')[0]) === hour);
                return (
                  <div key={di} role="button" tabIndex={0} aria-label={`Schedule booking ${format(day, 'EEEE, MMMM d')} at ${hour}:00`} onClick={() => openNewBooking(day, `${String(hour).padStart(2, '0')}:00`)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openNewBooking(day, `${String(hour).padStart(2, '0')}:00`); } }} className="border-r border-slate-100 p-1 min-h-[50px] cursor-pointer hover:bg-amber-50/50 focus:outline-none focus:ring-1 focus:ring-amber-400">
                    {dayBookings.map(b => {
                      const customer = state.customers.find(c => c.id === b.customerId);
                      const service = state.services.find(s => s.id === b.serviceId);
                      return (
                        <button key={b.id} onClick={event => { event.stopPropagation(); setSelectedBooking(b); }} className="w-full text-left text-[10px] p-1 rounded bg-amber-100 text-amber-800 mb-0.5 hover:bg-amber-200">
                          <p className="font-medium truncate">{customer?.name}</p>
                          <p className="truncate">{service?.name}</p>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Day View */}
      {view === 'day' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          {Array.from({ length: 14 }, (_, i) => i + 7).map(hour => {
            const hourBookings = getBookingsForDate(currentDate).filter(b => parseInt(b.startTime.split(':')[0]) === hour);
            return (
              <div key={hour} className="flex border-t border-slate-100 min-h-[60px]">
                <div className="w-20 p-3 border-r border-slate-100 bg-slate-50"><p className="text-sm font-medium text-slate-600">{hour}:00</p></div>
                <div role="button" tabIndex={0} aria-label={`Schedule booking ${format(currentDate, 'MMMM d')} at ${hour}:00`} onClick={() => openNewBooking(currentDate, `${String(hour).padStart(2, '0')}:00`)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openNewBooking(currentDate, `${String(hour).padStart(2, '0')}:00`); } }} className="flex-1 p-2 flex flex-wrap gap-2 cursor-pointer hover:bg-amber-50/50 focus:outline-none focus:ring-1 focus:ring-amber-400">
                  {hourBookings.map(b => {
                    const customer = state.customers.find(c => c.id === b.customerId);
                    const service = state.services.find(s => s.id === b.serviceId);
                    const vehicle = state.vehicles.find(v => v.id === b.vehicleId);
                    return (
                      <button key={b.id} onClick={event => { event.stopPropagation(); setSelectedBooking(b); }} className="p-3 rounded-lg bg-amber-50 border border-amber-100 hover:bg-amber-100 text-left max-w-xs">
                        <p className="font-medium text-sm text-slate-800">{customer?.name}</p>
                        <p className="text-xs text-slate-500">{vehicle?.year} {vehicle?.make} {vehicle?.model}</p>
                        <p className="text-xs text-amber-600 mt-1">{service?.name} • {formatTime(b.startTime)} - {formatTime(b.endTime)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${getStatusColor(b.status)}`}>{b.status.replace('_', ' ')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Agenda View */}
      {view === 'agenda' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <div className="space-y-3">
            {state.bookings
              .filter(b => b.date >= new Date().toISOString().split('T')[0])
              .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
              .slice(0, 20)
              .map(b => {
                const customer = state.customers.find(c => c.id === b.customerId);
                const vehicle = state.vehicles.find(v => v.id === b.vehicleId);
                const service = state.services.find(s => s.id === b.serviceId);
                return (
                  <button key={b.id} onClick={() => setSelectedBooking(b)} className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 text-left border border-slate-100">
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-bold text-amber-600">{formatTime(b.startTime)}</p>
                      <p className="text-xs text-slate-500">{format(new Date(b.date), 'MMM d')}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{customer?.name}</p>
                      <p className="text-sm text-slate-500">{vehicle?.year} {vehicle?.make} {vehicle?.model}</p>
                      <p className="text-sm text-amber-600">{service?.name}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(b.status)}`}>{b.status.replace('_', ' ')}</span>
                  </button>
                );
              })}
            {state.bookings.filter(b => b.date >= new Date().toISOString().split('T')[0]).length === 0 && (
              <p className="text-center text-slate-500 py-8">No upcoming bookings</p>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl w-full max-w-lg p-6 animate-fadeIn max-h-[90vh] overflow-y-auto" onClick={event => event.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Schedule Booking</h3>
              <button onClick={() => setShowForm(false)} aria-label="Close booking form" className="p-1 hover:bg-slate-100 rounded">×</button>
            </div>
            {formError && <p role="alert" className="mb-3 text-sm text-red-600">{formError}</p>}
            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Customer *</label>
                  <select required value={form.customerId} onChange={event => setForm({ ...form, customerId: event.target.value, vehicleId: '' })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value="">Select customer</option>
                    {state.customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Vehicle *</label>
                  <select required value={form.vehicleId} onChange={event => setForm({ ...form, vehicleId: event.target.value })} disabled={!form.customerId} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value="">Select vehicle</option>
                    {state.vehicles.filter(vehicle => vehicle.customerId === form.customerId).map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.year} {vehicle.make} {vehicle.model}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Service *</label>
                  <select required value={form.serviceId} onChange={event => handleServiceChange(event.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value="">Select service</option>
                    {state.services.filter(service => service.active).map(service => <option key={service.id} value={service.id}>{service.name} - GH₵{service.price}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Staff *</label>
                  <select required value={form.staffId} onChange={event => setForm({ ...form, staffId: event.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value="">Select staff</option>
                    {state.users.filter(user => user.role !== 'admin' || state.users.length <= 3).map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Date *</label>
                  <input type="date" required value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Start *</label>
                    <input type="time" required value={form.startTime} onChange={event => setForm({ ...form, startTime: event.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">End *</label>
                    <input type="time" required value={form.endTime} onChange={event => setForm({ ...form, endTime: event.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Notes</label>
                <textarea value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" rows={2} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">Create Booking</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6 animate-fadeIn max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Booking Details</h3>
            {(() => {
              const customer = state.customers.find(c => c.id === selectedBooking.customerId);
              const vehicle = state.vehicles.find(v => v.id === selectedBooking.vehicleId);
              const service = state.services.find(s => s.id === selectedBooking.serviceId);
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-xs text-slate-500">Customer</p><p className="text-sm font-medium">{customer?.name}</p></div>
                    <div><p className="text-xs text-slate-500">Phone</p><p className="text-sm font-medium">{customer?.phone}</p></div>
                    <div><p className="text-xs text-slate-500">Vehicle</p><p className="text-sm font-medium">{vehicle?.year} {vehicle?.make} {vehicle?.model}</p></div>
                    <div><p className="text-xs text-slate-500">Plate</p><p className="text-sm font-medium">{vehicle?.plateNumber}</p></div>
                    <div><p className="text-xs text-slate-500">Service</p><p className="text-sm font-medium">{service?.name}</p></div>
                    <div><p className="text-xs text-slate-500">Price</p><p className="text-sm font-medium">GH₵{selectedBooking.price}</p></div>
                    <div><p className="text-xs text-slate-500">Date</p><p className="text-sm font-medium">{format(new Date(selectedBooking.date), 'MMM d, yyyy')}</p></div>
                    <div><p className="text-xs text-slate-500">Time</p><p className="text-sm font-medium">{formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}</p></div>
                  </div>
                  {selectedBooking.notes && <div><p className="text-xs text-slate-500">Notes</p><p className="text-sm">{selectedBooking.notes}</p></div>}
                </div>
              );
            })()}
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`px-3 py-1.5 text-xs rounded-lg border ${selectedBooking.status === status ? 'bg-amber-600 text-white border-amber-600' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setSelectedBooking(null)} className="mt-4 w-full py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
