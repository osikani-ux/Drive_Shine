import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Camera, Save, X } from 'lucide-react';

export default function ProfilePage() {
  const { state, dispatch, currentUser, addAuditLog } = useApp();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: currentUser?.name || '', email: currentUser?.email || '',
    phone: currentUser?.phone || '', avatar: currentUser?.avatar || '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [notification, setNotification] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    dispatch({ type: 'UPDATE_USER', payload: { ...currentUser, ...form } });
    addAuditLog('profile_updated', 'user', currentUser.id, form);
    setEditing(false);
    setNotification('Profile updated successfully');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please upload a JPG, PNG, or WEBP image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const avatar = reader.result as string;
      setForm({ ...form, avatar });
      if (currentUser) {
        dispatch({ type: 'UPDATE_USER', payload: { ...currentUser, avatar } });
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirm) {
      alert('Passwords do not match');
      return;
    }
    if (passwordForm.newPass.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    if (!currentUser) return;
    dispatch({ type: 'UPDATE_USER', payload: { ...currentUser, password: passwordForm.newPass } });
    addAuditLog('password_changed', 'user', currentUser.id, {});
    setShowPasswordForm(false);
    setPasswordForm({ current: '', newPass: '', confirm: '' });
    setNotification('Password changed successfully');
    setTimeout(() => setNotification(''), 3000);
  };

  if (!currentUser) return <div>Please log in</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {notification && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm">{notification}</div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-navy-900 to-navy-700 h-24" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-amber-600 border-4 border-white flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                {form.avatar ? <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" /> : currentUser.name.charAt(0)}
              </div>
              <button onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 bg-amber-600 rounded-full flex items-center justify-center text-white hover:bg-amber-700">
                <Camera size={14} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold text-slate-800">{currentUser.name}</h2>
              <p className="text-sm text-slate-500 capitalize">{currentUser.role}</p>
            </div>
          </div>

          {form.avatar && (
            <button onClick={() => { setForm({ ...form, avatar: '' }); if (currentUser) dispatch({ type: 'UPDATE_USER', payload: { ...currentUser, avatar: '' } }); }}
              className="mt-2 text-xs text-red-600 hover:underline">Remove photo</button>
          )}
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Personal Information</h3>
          {!editing && <button onClick={() => setEditing(true)} className="text-sm text-amber-600 hover:underline">Edit</button>}
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Full Name</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} disabled={!editing}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-600" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} disabled={!editing}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-600" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} disabled={!editing}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-600" />
          </div>
          {editing && (
            <div className="flex gap-2">
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
                <Save size={14} /> Save Changes
              </button>
              <button type="button" onClick={() => { setEditing(false); setForm({ name: currentUser.name, email: currentUser.email, phone: currentUser.phone, avatar: currentUser.avatar || '' }); }}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50">Cancel</button>
            </div>
          )}
        </form>
      </div>

      {/* Password */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Password</h3>
          {!showPasswordForm && <button onClick={() => setShowPasswordForm(true)} className="text-sm text-amber-600 hover:underline">Change Password</button>}
        </div>
        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div><label className="text-sm font-medium">New Password *</label><input type="password" required minLength={6} value={passwordForm.newPass} onChange={e => setPasswordForm({...passwordForm, newPass: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium">Confirm Password *</label><input type="password" required value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" /></div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">Update Password</button>
              <button type="button" onClick={() => setShowPasswordForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        )}
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Recent Activity</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {state.auditLogs.filter(l => l.userId === currentUser.id).slice(0, 10).map(log => (
            <div key={log.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">{log.action.replace(/_/g, ' ')}</p>
                <p className="text-xs text-slate-500">{log.entity} {log.entityId ? `#${log.entityId.slice(0, 6)}` : ''}</p>
              </div>
              <p className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
            </div>
          ))}
          {state.auditLogs.filter(l => l.userId === currentUser.id).length === 0 && (
            <p className="text-sm text-slate-500">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
