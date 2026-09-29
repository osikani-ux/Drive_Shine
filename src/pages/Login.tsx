import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';

export default function LoginPage() {
  const { state, dispatch, addAuditLog } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = state.users.find(u => u.email === email && u.password === password);
    if (!user) {
      setError('Invalid email or password');
      return;
    }
    dispatch({ type: 'LOGIN', payload: user.id });
    addAuditLog('login', 'user', user.id, {});
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const user = state.users.find(u => u.email === resetEmail);
    if (user) {
      setResetSent(true);
    } else {
      setError('Email not found');
    }
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const userId = uuidv4();
    dispatch({
      type: 'ADD_USER',
      payload: {
        id: userId, name, email, phone, role: 'admin', password,
        createdAt: new Date().toISOString().split('T')[0],
      },
    });
    dispatch({ type: 'LOGIN', payload: userId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">D&S</div>
          <h1 className="text-2xl font-bold text-white">Drive&Shine</h1>
          <p className="text-navy-300 text-sm mt-1">Command Center</p>
        </div>

        {!showForgot ? (
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <h2 className="text-xl font-bold text-slate-800 mb-6">{state.users.length === 0 ? 'Set Up Admin Account' : 'Sign In'}</h2>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}
            {state.users.length === 0 ? (
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Name</label>
                  <input required value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" autoComplete="name" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" autoComplete="email" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Phone</label>
                  <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" autoComplete="tel" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" autoComplete="new-password" />
                </div>
                <button type="submit" className="w-full py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors">Create Admin Account</button>
              </form>
            ) : (
              <>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      autoComplete="email" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Password</label>
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      autoComplete="current-password" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors">
                    Sign In
                  </button>
                </form>
                <button onClick={() => setShowForgot(true)} className="w-full mt-4 text-sm text-amber-600 hover:underline text-center">
                  Forgot password?
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Reset Password</h2>
            {resetSent ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">✓</div>
                <p className="text-sm text-slate-600">Password reset instructions have been sent to your email.</p>
                <button onClick={() => { setShowForgot(false); setResetSent(false); }} className="mt-4 text-sm text-amber-600 hover:underline">Back to login</button>
              </div>
            ) : (
              <>
                {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                    <input type="email" required value={resetEmail} onChange={e => { setResetEmail(e.target.value); setError(''); }}
                      className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700">
                    Send Reset Link
                  </button>
                </form>
                <button onClick={() => { setShowForgot(false); setError(''); }} className="w-full mt-4 text-sm text-slate-600 hover:underline text-center">
                  Back to login
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
