import React, { createContext, useContext, useReducer, useEffect, useRef, useState, ReactNode } from 'react';
import { AppState, Customer, Vehicle, Service, Booking, Payment, InventoryItem, InventoryTransaction, Membership, Expense, Notification, AuditLog, User } from '../types';
import { loadState, mergeWebsiteBookings, saveState, resetState, WebsiteBooking } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { onSnapshot, runTransaction, setDoc } from 'firebase/firestore';
import { appStateRef, firebaseAdminEmail, firebaseAuth, firebaseConfigured, firestore, requireFirebase, websiteBookingsRef } from '../firebase';

type Action =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'LOGIN'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'ADD_VEHICLE'; payload: Vehicle }
  | { type: 'UPDATE_VEHICLE'; payload: Vehicle }
  | { type: 'DELETE_VEHICLE'; payload: string }
  | { type: 'ADD_SERVICE'; payload: Service }
  | { type: 'UPDATE_SERVICE'; payload: Service }
  | { type: 'DELETE_SERVICE'; payload: string }
  | { type: 'ADD_BOOKING'; payload: Booking }
  | { type: 'UPDATE_BOOKING'; payload: Booking }
  | { type: 'DELETE_BOOKING'; payload: string }
  | { type: 'ADD_PAYMENT'; payload: Payment }
  | { type: 'UPDATE_PAYMENT'; payload: Payment }
  | { type: 'ADD_INVENTORY'; payload: InventoryItem }
  | { type: 'UPDATE_INVENTORY'; payload: InventoryItem }
  | { type: 'DELETE_INVENTORY'; payload: string }
  | { type: 'ADD_INVENTORY_TRANSACTION'; payload: InventoryTransaction }
  | { type: 'ADD_MEMBERSHIP'; payload: Membership }
  | { type: 'UPDATE_MEMBERSHIP'; payload: Membership }
  | { type: 'DELETE_MEMBERSHIP'; payload: string }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'ADD_AUDIT_LOG'; payload: AuditLog }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'RESET_STATE' };

function reducer(state: AppState, action: Action): AppState {
  let newState: AppState;
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;
    case 'LOGIN':
      newState = { ...state, currentUserId: action.payload };
      break;
    case 'LOGOUT':
      newState = { ...state, currentUserId: null };
      break;
    case 'ADD_USER':
      newState = { ...state, users: [...state.users, action.payload] };
      break;
    case 'ADD_CUSTOMER':
      newState = { ...state, customers: [...state.customers, action.payload] };
      break;
    case 'UPDATE_CUSTOMER':
      newState = { ...state, customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c) };
      break;
    case 'DELETE_CUSTOMER':
      newState = { ...state, customers: state.customers.filter(c => c.id !== action.payload) };
      break;
    case 'ADD_VEHICLE':
      newState = { ...state, vehicles: [...state.vehicles, action.payload] };
      break;
    case 'UPDATE_VEHICLE':
      newState = { ...state, vehicles: state.vehicles.map(v => v.id === action.payload.id ? action.payload : v) };
      break;
    case 'DELETE_VEHICLE':
      newState = { ...state, vehicles: state.vehicles.filter(v => v.id !== action.payload) };
      break;
    case 'ADD_SERVICE':
      newState = { ...state, services: [...state.services, action.payload] };
      break;
    case 'UPDATE_SERVICE':
      newState = { ...state, services: state.services.map(s => s.id === action.payload.id ? action.payload : s) };
      break;
    case 'DELETE_SERVICE':
      newState = { ...state, services: state.services.filter(s => s.id !== action.payload) };
      break;
    case 'ADD_BOOKING':
      newState = { ...state, bookings: [...state.bookings, action.payload] };
      break;
    case 'UPDATE_BOOKING':
      newState = { ...state, bookings: state.bookings.map(b => b.id === action.payload.id ? action.payload : b) };
      break;
    case 'DELETE_BOOKING':
      newState = { ...state, bookings: state.bookings.filter(b => b.id !== action.payload) };
      break;
    case 'ADD_PAYMENT':
      newState = { ...state, payments: [...state.payments, action.payload] };
      break;
    case 'UPDATE_PAYMENT':
      newState = { ...state, payments: state.payments.map(p => p.id === action.payload.id ? action.payload : p) };
      break;
    case 'ADD_INVENTORY':
      newState = { ...state, inventory: [...state.inventory, action.payload] };
      break;
    case 'UPDATE_INVENTORY':
      newState = { ...state, inventory: state.inventory.map(i => i.id === action.payload.id ? action.payload : i) };
      break;
    case 'DELETE_INVENTORY':
      newState = { ...state, inventory: state.inventory.filter(i => i.id !== action.payload) };
      break;
    case 'ADD_INVENTORY_TRANSACTION':
      newState = { ...state, inventoryTransactions: [...state.inventoryTransactions, action.payload] };
      break;
    case 'ADD_MEMBERSHIP':
      newState = { ...state, memberships: [...state.memberships, action.payload] };
      break;
    case 'UPDATE_MEMBERSHIP':
      newState = { ...state, memberships: state.memberships.map(m => m.id === action.payload.id ? action.payload : m) };
      break;
    case 'DELETE_MEMBERSHIP':
      newState = { ...state, memberships: state.memberships.filter(m => m.id !== action.payload) };
      break;
    case 'ADD_EXPENSE':
      newState = { ...state, expenses: [...state.expenses, action.payload] };
      break;
    case 'DELETE_EXPENSE':
      newState = { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) };
      break;
    case 'ADD_NOTIFICATION':
      newState = { ...state, notifications: [action.payload, ...state.notifications] };
      break;
    case 'MARK_NOTIFICATION_READ':
      newState = { ...state, notifications: state.notifications.map(n => n.id === action.payload ? { ...n, read: true } : n) };
      break;
    case 'MARK_ALL_NOTIFICATIONS_READ':
      newState = { ...state, notifications: state.notifications.map(n => ({ ...n, read: true })) };
      break;
    case 'ADD_AUDIT_LOG':
      newState = { ...state, auditLogs: [action.payload, ...state.auditLogs] };
      break;
    case 'UPDATE_USER':
      newState = { ...state, users: state.users.map(u => u.id === action.payload.id ? action.payload : u) };
      break;
    case 'RESET_STATE':
      newState = resetState();
      break;
    default:
      return state;
  }
  saveState(newState);
  return newState;
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  currentUser: User | null;
  authReady: boolean;
  addAuditLog: (action: string, entity: string, entityId: string, metadata?: Record<string, any>) => void;
  addNotification: (title: string, message: string, type: Notification['type']) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, () => ({ ...loadState(), currentUserId: null }));
  const [authReady, setAuthReady] = useState(false);
  const currentState = useRef(state);
  const applyingRemoteState = useRef(false);

  useEffect(() => {
    currentState.current = state;
  }, [state]);

  useEffect(() => {
    if (!firebaseConfigured) {
      setAuthReady(true);
      return;
    }

    const auth = requireFirebase(firebaseAuth, 'Authentication');
    const db = requireFirebase(firestore, 'Firestore');
    const stateRef = requireFirebase(appStateRef, 'Firestore');
    const bookingCollection = requireFirebase(websiteBookingsRef, 'Firestore');
    let generation = 0;
    let unsubscribeState: (() => void) | undefined;
    let unsubscribeBookings: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, user => {
      const currentGeneration = ++generation;
      unsubscribeState?.();
      unsubscribeBookings?.();
      unsubscribeState = undefined;
      unsubscribeBookings = undefined;
      setAuthReady(true);

      if (!user) {
        dispatch({ type: 'LOGOUT' });
        return;
      }
      if (user.email?.toLowerCase() !== firebaseAdminEmail) {
        dispatch({ type: 'LOGOUT' });
        void signOut(auth);
        return;
      }
      void (async () => {
        const admin: User = {
          id: user.uid,
          name: user.displayName || user.email!.split('@')[0],
          email: user.email!,
          phone: '',
          role: 'admin',
          password: '',
          createdAt: new Date().toISOString().slice(0, 10),
        };
        const localState = loadState();
        const initialState: AppState = {
          ...localState,
          users: [admin],
          currentUserId: user.uid,
        };
        const persistedState = await runTransaction(db, async transaction => {
          const stored = await transaction.get(stateRef);
          if (stored.exists()) return stored.data() as Partial<AppState>;
          const safeState = {
            ...initialState,
            users: initialState.users.map(({ password: _password, ...safeUser }) => safeUser),
          };
          transaction.set(stateRef, safeState);
          return safeState;
        });
        if (currentGeneration !== generation) return;

        const loadedState = {
          ...initialState,
          ...persistedState,
          users: [admin],
          currentUserId: user.uid,
        } as AppState;
        saveState(loadedState);
        currentState.current = loadedState;
        applyingRemoteState.current = true;
        dispatch({ type: 'SET_STATE', payload: loadedState });

        unsubscribeState = onSnapshot(stateRef, snapshot => {
          if (!snapshot.exists() || currentGeneration !== generation) return;
          const remoteState = {
            ...loadedState,
            ...snapshot.data(),
            users: [admin],
            currentUserId: user.uid,
          } as AppState;
          saveState(remoteState);
          currentState.current = remoteState;
          applyingRemoteState.current = true;
          dispatch({ type: 'SET_STATE', payload: remoteState });
        }, error => console.error('Firebase app state listener failed:', error));

        unsubscribeBookings = onSnapshot(bookingCollection, snapshot => {
          if (currentGeneration !== generation) return;
          const bookings: WebsiteBooking[] = snapshot.docs.map(item => ({
            ...item.data(),
            id: item.id,
          } as WebsiteBooking));
          const updatedState = mergeWebsiteBookings(currentState.current, { bookings });
          if (updatedState === currentState.current) return;
          saveState(updatedState);
          currentState.current = updatedState;
          dispatch({ type: 'SET_STATE', payload: updatedState });
        }, error => console.error('Firebase website bookings listener failed:', error));
      })().catch(error => {
        if (currentGeneration !== generation) return;
        console.error('Firebase cloud initialization failed:', error);
        dispatch({ type: 'LOGOUT' });
        void signOut(auth);
      });
    });

    return () => {
      generation += 1;
      unsubscribeAuth();
      unsubscribeState?.();
      unsubscribeBookings?.();
    };
  }, []);

  useEffect(() => {
    if (!firebaseConfigured || !authReady || !state.currentUserId || applyingRemoteState.current) {
      applyingRemoteState.current = false;
      return;
    }
    const stateRef = requireFirebase(appStateRef, 'Firestore');
    const { users, currentUserId, ...data } = state;
    const timer = window.setTimeout(() => {
      void setDoc(stateRef, { ...data, currentUserId, users: users.map(({ password: _password, ...user }) => user) })
        .catch(error => console.error('Firebase app state save failed:', error));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [state, authReady]);

  useEffect(() => {
    const channel = typeof BroadcastChannel === 'undefined'
      ? null
      : new BroadcastChannel('drive-shine-website-bookings');
    if (channel) {
      channel.onmessage = (event: MessageEvent<{ type?: string }>) => {
        if (event.data?.type === 'booking-updated') dispatch({ type: 'SET_STATE', payload: loadState() });
      };
    }
    const refreshFromStorage = (event: StorageEvent) => {
      if (event.key === 'drive-shine-command-center-v1' || event.key === 'driveshine_state') {
        dispatch({ type: 'SET_STATE', payload: loadState() });
      }
    };

    window.addEventListener('storage', refreshFromStorage);
    return () => {
      window.removeEventListener('storage', refreshFromStorage);
      channel?.close();
    };
  }, []);

  const currentUser = state.users.find(u => u.id === state.currentUserId) || null;

  const addAuditLog = (action: string, entity: string, entityId: string, metadata: Record<string, any> = {}) => {
    dispatch({
      type: 'ADD_AUDIT_LOG',
      payload: {
        id: uuidv4(),
        userId: state.currentUserId || '',
        action,
        entity,
        entityId,
        metadata,
        timestamp: new Date().toISOString(),
      }
    });
  };

  const addNotification = (title: string, message: string, type: Notification['type']) => {
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: uuidv4(),
        title,
        message,
        type,
        read: false,
        date: new Date().toISOString().split('T')[0],
      }
    });
  };

  return (
    <AppContext.Provider value={{ state, dispatch, currentUser, authReady, addAuditLog, addNotification }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
