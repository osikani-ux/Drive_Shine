import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, X, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils';
import { Service } from '../types';
import { v4 as uuidv4 } from 'uuid';

export default function ServicesPage() {
  const { state, dispatch, addAuditLog } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: 0, duration: 30, category: '', active: true });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      dispatch({ type: 'UPDATE_SERVICE', payload: { ...editing, ...form } });
    } else {
      dispatch({ type: 'ADD_SERVICE', payload: { id: uuidv4(), ...form } });
      addAuditLog('service_created', 'service', '', form);
    }
    setShowForm(false); setEditing(null);
    setForm({ name: '', description: '', price: 0, duration: 30, category: '', active: true });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this service?')) {
      dispatch({ type: 'DELETE_SERVICE', payload: id });
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{state.services.length} services</p>
        <button onClick={() => { setEditing(null); setForm({ name: '', description: '', price: 0, duration: 30, category: '', active: true }); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
          <Plus size={16} /> Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.services.map(s => (
          <div key={s.id} className={`bg-white rounded-xl p-5 border shadow-sm ${s.active ? 'border-slate-100' : 'border-slate-200 opacity-60'}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">{s.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{s.description}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${s.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {s.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div><p className="text-lg font-bold text-amber-600">{formatCurrency(s.price)}</p><p className="text-xs text-slate-500">Price</p></div>
              <div><p className="text-lg font-bold text-slate-700">{s.duration}<span className="text-xs font-normal"> min</span></p><p className="text-xs text-slate-500">Duration</p></div>
              <div><p className="text-sm font-medium text-slate-600">{s.category}</p><p className="text-xs text-slate-500">Category</p></div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => { setEditing(s); setForm({ name: s.name, description: s.description, price: s.price, duration: s.duration, category: s.category, active: s.active }); setShowForm(true); }}
                className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-1"><Edit size={14} /> Edit</button>
              <button onClick={() => dispatch({ type: 'UPDATE_SERVICE', payload: { ...s, active: !s.active } })}
                className="flex-1 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">{s.active ? 'Disable' : 'Enable'}</button>
              <button onClick={() => handleDelete(s.id)} className="py-2 px-3 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editing ? 'Edit Service' : 'Add Service'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="text-sm font-medium">Name *</label><input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="text-sm font-medium">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" rows={2} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-sm font-medium">Price *</label><input type="number" required value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value)})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="text-sm font-medium">Duration (min) *</label><input type="number" required value={form.duration} onChange={e => setForm({...form, duration: parseInt(e.target.value)})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
                <div><label className="text-sm font-medium">Category *</label><input type="text" required value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="rounded" /><span className="text-sm">Active</span></label>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">{editing ? 'Update' : 'Add'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
