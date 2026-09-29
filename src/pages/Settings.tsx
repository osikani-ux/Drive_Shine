import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RotateCcw, Users, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { state, dispatch, currentUser } = useApp();
  const [showReset, setShowReset] = useState(false);

  const handleReset = () => {
    dispatch({ type: 'RESET_STATE' });
    setShowReset(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Business Info */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Business Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-slate-50">
            <span className="text-sm text-slate-500">Business Name</span>
            <span className="text-sm font-medium">Drive&Shine</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-50">
            <span className="text-sm text-slate-500">Currency</span>
            <span className="text-sm font-medium">Ghana Cedi (GH₵)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-50">
            <span className="text-sm text-slate-500">Total Users</span>
            <span className="text-sm font-medium">{state.users.length}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-50">
            <span className="text-sm text-slate-500">Total Customers</span>
            <span className="text-sm font-medium">{state.customers.length}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-50">
            <span className="text-sm text-slate-500">Total Bookings</span>
            <span className="text-sm font-medium">{state.bookings.length}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-slate-500">Audit Logs</span>
            <span className="text-sm font-medium">{state.auditLogs.length}</span>
          </div>
        </div>
      </div>

      {/* Staff/Users */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Users size={18} /> Staff Members</h3>
        <div className="space-y-2">
          {state.users.map(u => (
            <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-sm font-medium">{u.name.charAt(0)}</div>
                <div>
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'manager' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Roles */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Shield size={18} /> Role Permissions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2 pr-4">Permission</th><th className="text-center py-2 px-2">Admin</th><th className="text-center py-2 px-2">Manager</th><th className="text-center py-2 px-2">Staff</th></tr></thead>
            <tbody>
              {['View Dashboard', 'Manage Bookings', 'Manage Customers', 'Manage Inventory', 'View Reports', 'Manage Payments', 'Manage Services', 'Manage Settings'].map(perm => (
                <tr key={perm} className="border-b border-slate-50">
                  <td className="py-2 pr-4 text-slate-600">{perm}</td>
                  <td className="py-2 px-2 text-center text-green-600">✓</td>
                  <td className="py-2 px-2 text-center">{perm === 'Manage Settings' ? '—' : <span className="text-green-600">✓</span>}</td>
                  <td className="py-2 px-2 text-center">{['Manage Settings', 'Manage Services', 'View Reports'].includes(perm) ? '—' : <span className="text-green-600">✓</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
        <h3 className="font-semibold text-red-800 mb-2">Danger Zone</h3>
        <p className="text-sm text-slate-500 mb-4">Clear all workspace data, including staff accounts, and sign out. This cannot be undone.</p>
        <button onClick={() => setShowReset(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
          <RotateCcw size={14} /> Reset All Data
        </button>
      </div>

      {showReset && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Confirm Reset</h3>
            <p className="text-sm text-slate-500 mb-4">This will permanently delete all workspace data and sign you out. Are you sure?</p>
            <div className="flex gap-2">
              <button onClick={handleReset} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Yes, Reset</button>
              <button onClick={() => setShowReset(false)} className="flex-1 py-2 border rounded-lg text-sm hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
