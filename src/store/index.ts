import { AppState } from '../types';

const STORAGE_KEY = 'driveshine_state';

function createEmptyState(): AppState {
  return {
    users: [],
    customers: [],
    vehicles: [],
    services: [],
    bookings: [],
    payments: [],
    inventory: [],
    inventoryTransactions: [],
    memberships: [],
    expenses: [],
    notifications: [],
    auditLogs: [],
    currentUserId: null,
  };
}

export function loadState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as AppState;
  } catch (error) {
    console.error('Failed to load state:', error);
  }
  const state = createEmptyState();
  saveState(state);
  return state;
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

export function resetState(): AppState {
  const state = createEmptyState();
  saveState(state);
  return state;
}