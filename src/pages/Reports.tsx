import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, exportToCSV, exportToExcel, exportToPDF } from '../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Download } from 'lucide-react';

type Period = 'today' | 'week' | 'month' | 'last_month' | '3months' | '6months' | 'year' | 'custom';

export default function ReportsPage() {
  const { state } = useApp();
  const [period, setPeriod] = useState<Period>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date = now;
    switch (period) {
      case 'today': start = new Date(now.toISOString().split('T')[0]); break;
      case 'week': start = new Date(now.getTime() - 7 * 86400000); break;
      case 'month': start = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'last_month': start = new Date(now.getFullYear(), now.getMonth() - 1, 1); end = new Date(now.getFullYear(), now.getMonth(), 0); break;
      case '3months': start = new Date(now.getTime() - 90 * 86400000); break;
      case '6months': start = new Date(now.getTime() - 180 * 86400000); break;
      case 'year': start = new Date(now.getFullYear(), 0, 1); break;
      case 'custom': start = customStart ? new Date(customStart) : new Date(now.getTime() - 30 * 86400000); end = customEnd ? new Date(customEnd) : now; break;
      default: start = new Date(now.getTime() - 30 * 86400000);
    }
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  }, [period, customStart, customEnd]);

  const filteredPayments = state.payments.filter(p => p.date >= dateRange.start && p.date <= dateRange.end);
  const filteredBookings = state.bookings.filter(b => b.date >= dateRange.start && b.date <= dateRange.end);
  const filteredExpenses = state.expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end);

  const revenue = filteredPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const expenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const profit = revenue - expenses;
  const completedBookings = filteredBookings.filter(b => b.status === 'completed').length;
  const cancelledBookings = filteredBookings.filter(b => b.status === 'cancelled').length;

  // Revenue by date
  const revenueByDate = useMemo(() => {
    const map: Record<string, number> = {};
    filteredPayments.filter(p => p.status === 'paid').forEach(p => {
      map[p.date] = (map[p.date] || 0) + p.amount;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), amount,
    }));
  }, [filteredPayments]);

  // Expenses by date
  const expensesByDate = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => { map[e.date] = (map[e.date] || 0) + e.amount; });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), amount,
    }));
  }, [filteredExpenses]);

  // Profit chart data
  const profitData = useMemo(() => {
    const dates = [...new Set([...revenueByDate.map(d => d.date), ...expensesByDate.map(d => d.date)])];
    return dates.map(date => ({
      date,
      revenue: revenueByDate.find(d => d.date === date)?.amount || 0,
      expenses: expensesByDate.find(d => d.date === date)?.amount || 0,
      profit: (revenueByDate.find(d => d.date === date)?.amount || 0) - (expensesByDate.find(d => d.date === date)?.amount || 0),
    }));
  }, [revenueByDate, expensesByDate]);

  // Popular services
  const popularServices = useMemo(() => {
    const map: Record<string, number> = {};
    filteredBookings.forEach(b => {
      const service = state.services.find(s => s.id === b.serviceId);
      if (service) map[service.name] = (map[service.name] || 0) + 1;
    });
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, count]) => ({ name, count }));
  }, [filteredBookings, state.services]);

  // Payment methods
  const paymentMethodData = useMemo(() => {
    const methods = ['cash', 'mobile_money', 'card', 'bank_transfer'];
    return methods.map(m => ({
      name: m.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: filteredPayments.filter(p => p.method === m && p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    })).filter(d => d.value > 0);
  }, [filteredPayments]);

  const COLORS = ['#d4a017', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const data = [
      { Metric: 'Revenue', Value: formatCurrency(revenue) },
      { Metric: 'Expenses', Value: formatCurrency(expenses) },
      { Metric: 'Net Profit', Value: formatCurrency(profit) },
      { Metric: 'Total Bookings', Value: filteredBookings.length },
      { Metric: 'Completed', Value: completedBookings },
      { Metric: 'Cancelled', Value: cancelledBookings },
    ];
    if (format === 'csv') exportToCSV(data, 'report');
    else if (format === 'excel') exportToExcel(data, 'report');
    else exportToPDF(data, 'report', 'Business Report');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Period Selector */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-700">Period:</span>
        <div className="flex flex-wrap gap-1">
          {([['today', 'Today'], ['week', 'This Week'], ['month', 'This Month'], ['last_month', 'Last Month'], ['3months', '3 Months'], ['6months', '6 Months'], ['year', 'This Year'], ['custom', 'Custom']] as [Period, string][]).map(([val, label]) => (
            <button key={val} onClick={() => setPeriod(val)}
              className={`px-3 py-1.5 text-sm rounded-lg ${period === val ? 'bg-amber-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>
              {label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="px-2 py-1 border rounded text-sm" />
            <span className="text-sm">to</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="px-2 py-1 border rounded text-sm" />
          </div>
        )}
        <div className="ml-auto">
          <div className="relative group">
            <button className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm hover:bg-slate-50">
              <Download size={14} /> Export
            </button>
            <div className="absolute right-0 top-full mt-1 w-28 bg-white rounded-lg shadow-lg border hidden group-hover:block z-10">
              <button onClick={() => handleExport('csv')} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">CSV</button>
              <button onClick={() => handleExport('excel')} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">Excel</button>
              <button onClick={() => handleExport('pdf')} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">PDF</button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500">Revenue</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(revenue)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500">Expenses</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(expenses)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500">Net Profit</p>
          <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(profit)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500">Bookings</p>
          <p className="text-2xl font-bold text-amber-600">{filteredBookings.length}</p>
          <p className="text-xs text-slate-400">{completedBookings} completed • {cancelledBookings} cancelled</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueByDate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => [`GH₵${v}`, 'Revenue']} />
              <Area type="monotone" dataKey="amount" fill="#d4a017" fillOpacity={0.1} stroke="#d4a017" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Profit Analysis</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Popular Services</h3>
          {popularServices.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={popularServices} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}>
                  {popularServices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-500 py-8">No data for this period</p>}
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Payment Methods</h3>
          {paymentMethodData.length > 0 ? (
            <div className="space-y-3">
              {paymentMethodData.map((pm, i) => {
                const total = paymentMethodData.reduce((s, p) => s + p.value, 0);
                const pct = ((pm.value / total) * 100).toFixed(0);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{pm.name}</span>
                      <span className="font-medium">{formatCurrency(pm.value)} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-center text-slate-500 py-8">No data for this period</p>}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-3">Customer Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Total Customers</span><span className="font-medium">{state.customers.length}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Active Customers</span><span className="font-medium">{state.customers.filter(c => c.status === 'active').length}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">New (this period)</span><span className="font-medium">{state.customers.filter(c => c.createdAt >= dateRange.start).length}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-3">Membership Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Total Memberships</span><span className="font-medium">{state.memberships.length}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Active</span><span className="font-medium text-green-600">{state.memberships.filter(m => new Date(m.expiryDate) > new Date()).length}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Expired</span><span className="font-medium text-red-600">{state.memberships.filter(m => new Date(m.expiryDate) <= new Date()).length}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-3">Inventory Value</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Total Items</span><span className="font-medium">{state.inventory.length}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Total Value</span><span className="font-medium">{formatCurrency(state.inventory.reduce((s, i) => s + i.quantity * i.costPerUnit, 0))}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Low Stock Items</span><span className="font-medium text-amber-600">{state.inventory.filter(i => i.quantity <= i.minStock).length}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
