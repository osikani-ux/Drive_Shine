import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CalendarDays, DollarSign, Users, Shield, Clock, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { formatCurrency, getStockStatus } from '../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const { state } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayBookings = state.bookings.filter(b => b.date === today);
  const todayRevenue = state.payments.filter(p => p.date === today && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingBookings = state.bookings.filter(b => b.status === 'pending' || b.status === 'confirmed');
  const lowStockItems = state.inventory.filter(i => getStockStatus(i.quantity, i.minStock) !== 'in_stock');
  const activeMemberships = state.memberships.filter(m => {
    const expiry = new Date(m.expiryDate);
    return expiry > new Date();
  });
  const completedToday = state.bookings.filter(b => b.date === today && b.status === 'completed');

  const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenue = state.payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Revenue by day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const revenueByDay = last7Days.map(day => ({
    day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
    revenue: state.payments.filter(p => p.date === day && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    bookings: state.bookings.filter(b => b.date === day).length,
  }));

  // Service distribution
  const serviceData = state.services.map(s => ({
    name: s.name,
    bookings: state.bookings.filter(b => b.serviceId === s.id).length,
  })).filter(s => s.bookings > 0).sort((a, b) => b.bookings - a.bookings).slice(0, 5);

  const COLORS = ['#d4a017', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  // Payment methods
  const paymentMethods = [
    { name: 'Cash', value: state.payments.filter(p => p.method === 'cash' && p.status === 'paid').reduce((s, p) => s + p.amount, 0) },
    { name: 'Mobile Money', value: state.payments.filter(p => p.method === 'mobile_money' && p.status === 'paid').reduce((s, p) => s + p.amount, 0) },
    { name: 'Card', value: state.payments.filter(p => p.method === 'card' && p.status === 'paid').reduce((s, p) => s + p.amount, 0) },
    { name: 'Bank Transfer', value: state.payments.filter(p => p.method === 'bank_transfer' && p.status === 'paid').reduce((s, p) => s + p.amount, 0) },
  ].filter(p => p.value > 0);

  const stats = [
    { label: 'Total Bookings', value: state.bookings.length, icon: CalendarDays, color: 'bg-amber-500', change: '+12%' },
    { label: "Today's Revenue", value: formatCurrency(todayRevenue), icon: DollarSign, color: 'bg-green-500', change: '+8%' },
    { label: 'Total Customers', value: state.customers.length, icon: Users, color: 'bg-purple-500', change: '+5%' },
    { label: 'Active Memberships', value: activeMemberships.length, icon: Shield, color: 'bg-indigo-500', change: '+3%' },
    { label: 'Pending Bookings', value: pendingBookings.length, icon: Clock, color: 'bg-amber-500', change: '-2%' },
    { label: 'Low Stock Items', value: lowStockItems.length, icon: AlertTriangle, color: 'bg-red-500', change: '' },
    { label: 'Completed Today', value: completedToday.length, icon: CheckCircle, color: 'bg-emerald-500', change: '' },
    { label: 'Net Profit', value: formatCurrency(netProfit), icon: TrendingUp, color: 'bg-cyan-500', change: '+15%' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Date/Time Banner */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {state.users.find(u => u.id === state.currentUserId)?.name || 'Admin'}</h1>
            <p className="text-navy-300 mt-1">Here's what's happening at Drive&Shine today.</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
            <p className="text-navy-300 text-sm mt-1">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon size={20} className="text-white" />
              </div>
              {stat.change && <span className="text-xs text-green-600 font-medium">{stat.change}</span>}
            </div>
            <p className="text-2xl font-bold mt-3 text-slate-800">{stat.value}</p>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Revenue (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => [`GH₵${value}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#d4a017" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings Chart */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Bookings (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Popular Services */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Popular Services</h3>
          {serviceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={serviceData} dataKey="bookings" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}>
                  {serviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-500">No data available</p>}
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Payment Methods</h3>
          {paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((pm, i) => {
                const total = paymentMethods.reduce((s, p) => s + p.value, 0);
                const pct = ((pm.value / total) * 100).toFixed(0);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{pm.name}</span>
                      <span className="font-medium">{formatCurrency(pm.value)} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-sm text-slate-500">No data available</p>}
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Today's Schedule</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {todayBookings.length > 0 ? todayBookings.map(b => {
              const customer = state.customers.find(c => c.id === b.customerId);
              const service = state.services.find(s => s.id === b.serviceId);
              return (
                <div key={b.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                  <div className="text-xs font-medium text-slate-500 min-w-[60px]">{b.startTime}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{customer?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{service?.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    b.status === 'completed' ? 'bg-green-100 text-green-700' :
                    b.status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
                    b.status === 'confirmed' ? 'bg-amber-100 text-amber-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{b.status.replace('_', ' ')}</span>
                </div>
              );
            }) : <p className="text-sm text-slate-500">No bookings for today</p>}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <AlertTriangle size={18} /> Low Stock Alerts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockItems.map(item => (
              <div key={item.id} className="bg-white rounded-lg p-3 border border-amber-100">
                <p className="text-sm font-medium text-slate-800">{item.name}</p>
                <p className="text-xs text-slate-500">
                  {item.quantity} {item.unit} remaining (min: {item.minStock})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
