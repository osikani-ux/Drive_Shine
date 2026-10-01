import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, Calendar, BookOpen, Users, Package, CreditCard, Receipt, FileBarChart, Settings, LogOut, Bell, Search, Menu, X, Wrench, DollarSign, Shield, Mail } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { firebaseAuth, requireFirebase } from '../firebase';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'bookings', label: 'Bookings', icon: BookOpen },
  { id: 'messages', label: 'Messages', icon: Mail },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'memberships', label: 'Memberships', icon: Shield },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'expenses', label: 'Expenses', icon: DollarSign },
  { id: 'reports', label: 'Reports', icon: FileBarChart },
  { id: 'profile', label: 'Profile', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function MainLayout({ children, currentPage, onNavigate }: LayoutProps) {
  const { state, dispatch, currentUser, addNotification } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = state.notifications.filter(n => !n.read).length;

  const searchResults = searchQuery.length > 1 ? {
    customers: state.customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)),
    bookings: state.bookings.filter(b => {
      const customer = state.customers.find(c => c.id === b.customerId);
      return customer?.name.toLowerCase().includes(searchQuery.toLowerCase());
    }),
    vehicles: state.vehicles.filter(v => `${v.make} ${v.model}`.toLowerCase().includes(searchQuery.toLowerCase()) || v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase())),
  } : null;

  const handleLogout = () => {
    void signOut(requireFirebase(firebaseAuth, 'Authentication')).catch(error => {
      console.error('Firebase sign-out failed:', error);
    });
    dispatch({ type: 'LOGOUT' });
  };

  const pageTitles: Record<string, string> = {
    dashboard: 'Command Center',
    calendar: 'Calendar',
    bookings: 'Bookings',
    messages: 'Contact Messages',
    customers: 'Customers',
    services: 'Services',
    inventory: 'Inventory',
    memberships: 'Memberships',
    payments: 'Payments',
    expenses: 'Expenses',
    reports: 'Reports & Analytics',
    profile: 'My Profile',
    settings: 'Settings',
  };

  return (
    <div className="flex h-screen bg-[#f4f3ef] overflow-hidden">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-navy-900 text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="p-5 border-b border-navy-700">
          <a href="/Drive_Shine-main/index.html" className="flex items-center gap-3" aria-label="Visit Drive&Shine website">
            <img
              src="/Drive_Shine-main/images/logo.png"
              alt=""
              className="w-14 h-12 object-contain shrink-0"
            />
            <div>
              <h1 className="font-bold text-sm">Drive&Shine</h1>
              <p className="text-xs text-navy-300">Visit Website</p>
            </div>
          </a>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors ${
                currentPage === item.id
                  ? 'bg-amber-600 text-white'
                  : 'text-navy-200 hover:bg-navy-800 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-navy-700">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-navy-200 hover:bg-navy-800 hover:text-white transition-colors">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{pageTitles[currentPage] || 'Drive&Shine'}</h2>
              <p className="text-xs text-slate-500 hidden sm:block">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <button onClick={() => setShowSearch(!showSearch)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
                <Search size={18} />
              </button>
              {showSearch && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 animate-fadeIn">
                  <div className="p-3">
                    <input
                      type="text"
                      placeholder="Search customers, bookings, vehicles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      autoFocus
                    />
                  </div>
                  {searchResults && (searchResults.customers.length > 0 || searchResults.bookings.length > 0 || searchResults.vehicles.length > 0) && (
                    <div className="border-t border-slate-100 max-h-64 overflow-y-auto">
                      {searchResults.customers.length > 0 && (
                        <div className="p-3">
                          <p className="text-xs font-medium text-slate-500 mb-1">Customers</p>
                          {searchResults.customers.slice(0, 3).map(c => (
                            <div key={c.id} className="text-sm py-1 text-slate-700 cursor-pointer hover:bg-slate-50 px-2 rounded" onClick={() => { onNavigate('customers'); setShowSearch(false); setSearchQuery(''); }}>
                              {c.name} • {c.phone}
                            </div>
                          ))}
                        </div>
                      )}
                      {searchResults.vehicles.length > 0 && (
                        <div className="p-3">
                          <p className="text-xs font-medium text-slate-500 mb-1">Vehicles</p>
                          {searchResults.vehicles.slice(0, 3).map(v => (
                            <div key={v.id} className="text-sm py-1 text-slate-700 cursor-pointer hover:bg-slate-50 px-2 rounded">
                              {v.year} {v.make} {v.model} • {v.plateNumber}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {searchResults && searchResults.customers.length === 0 && searchResults.bookings.length === 0 && searchResults.vehicles.length === 0 && searchQuery.length > 1 && (
                    <div className="p-4 text-center text-sm text-slate-500">No results found</div>
                  )}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 relative">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 animate-fadeIn">
                  <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-medium text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' })} className="text-xs text-amber-600 hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {state.notifications.slice(0, 8).map(n => (
                      <div
                        key={n.id}
                        className={`p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 ${!n.read ? 'bg-amber-50/50' : ''}`}
                        onClick={() => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id })}
                      >
                        <p className="text-sm font-medium text-slate-800">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                      </div>
                    ))}
                    {state.notifications.length === 0 && (
                      <div className="p-4 text-center text-sm text-slate-500">No notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100">
                <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {currentUser?.name.charAt(0) || 'A'}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden md:block">{currentUser?.name || 'Admin'}</span>
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50 animate-fadeIn">
                  <div className="p-3 border-b border-slate-100">
                    <p className="text-sm font-medium">{currentUser?.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{currentUser?.role}</p>
                  </div>
                  <button onClick={() => { onNavigate('profile'); setShowProfileMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">My Profile</button>
                  <button onClick={() => { onNavigate('settings'); setShowProfileMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">Settings</button>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
