import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAdminEmail, firebaseAuth, firebaseConfigured, requireFirebase } from '../firebase';

function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'code' in error) {
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Firebase rejected the password for the configured administrator account.';
      case 'auth/operation-not-allowed':
        return 'Enable Email/Password sign-in in Firebase Authentication settings.';
      case 'auth/too-many-requests':
        return 'Firebase has temporarily blocked sign-in after repeated attempts. Wait for the temporary block to clear before trying again.';
      case 'auth/network-request-failed':
        return 'Could not reach Firebase. Check your internet connection and try again.';
      case 'auth/invalid-email':
        return 'Enter a valid administrator email address.';
      case 'auth/user-disabled':
        return 'This Firebase account is disabled. Contact the project administrator.';
    }
  }
  return error instanceof Error ? error.message : 'The Firebase request failed.';
}

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!firebaseConfigured) {
      setError('Firebase is not configured. Set the VITE_FIREBASE_* values in the local environment and restart the app.');
      return;
    }

    try {
      const auth = requireFirebase(firebaseAuth, 'Authentication');
      await signInWithEmailAndPassword(auth, firebaseAdminEmail, password);
    } catch (loginError) {
      setError(errorMessage(loginError));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/Drive_Shine-main/images/logo.png"
            alt="Drive&Shine Mobile Detailing"
            className="w-48 h-32 object-contain mx-auto mb-2"
          />
          <h1 className="text-2xl font-bold text-white">Drive&Shine</h1>
          <p className="text-navy-300 text-sm mt-1">Command Center</p>
          <p className="text-xs mt-2 text-amber-200" role="status">
            {firebaseConfigured ? `Firebase cloud data · ${firebaseAdminEmail}` : 'Firebase setup is required'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Admin Sign In</h2>
          {!firebaseConfigured && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm mb-4">
              Firebase configuration is missing. Add the project settings to `.env` and restart the development server.
            </div>
          )}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4" role="alert">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Administrator Email</label>
              <input type="email" readOnly value={firebaseAdminEmail} className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-lg text-sm bg-slate-50" autoComplete="username" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input type="password" required value={password} onChange={event => setPassword(event.target.value)} className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-lg text-sm" autoComplete="current-password" />
            </div>
            <button disabled={!firebaseConfigured} type="submit" className="w-full py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50">
              Sign In
            </button>
          </form>
        </div>
        <a href="/Drive_Shine-main/index.html" className="block text-center text-sm text-navy-300 hover:text-white mt-5">
          Back to Drive&Shine website
        </a>
      </div>
    </div>
  );
}
