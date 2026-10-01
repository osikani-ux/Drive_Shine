import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/Calendar';
import BookingsPage from './pages/Bookings';
import CustomersPage from './pages/Customers';
import ServicesPage from './pages/Services';
import InventoryPage from './pages/Inventory';
import MembershipsPage from './pages/Memberships';
import PaymentsPage from './pages/Payments';
import ExpensesPage from './pages/Expenses';
import ReportsPage from './pages/Reports';
import ProfilePage from './pages/Profile';
import SettingsPage from './pages/Settings';
import LoginPage from './pages/Login';
import ContactMessagesPage from './pages/ContactMessages';

function AppContent() {
  const { state, authReady } = useApp();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!authReady) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center text-white" role="status">
        Connecting to Firebase…
      </div>
    );
  }

  if (!state.currentUserId) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'calendar': return <CalendarPage />;
      case 'bookings': return <BookingsPage />;
      case 'messages': return <ContactMessagesPage />;
      case 'customers': return <CustomersPage />;
      case 'services': return <ServicesPage />;
      case 'inventory': return <InventoryPage />;
      case 'memberships': return <MembershipsPage />;
      case 'payments': return <PaymentsPage />;
      case 'expenses': return <ExpensesPage />;
      case 'reports': return <ReportsPage />;
      case 'profile': return <ProfilePage />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <MainLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </MainLayout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
