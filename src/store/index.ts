import { AppState, Booking, Notification, Vehicle } from '../types';

const STORAGE_KEY = 'driveshine_state';
const WEBSITE_BOOKINGS_KEY = 'drive-shine-command-center-v1';

export interface WebsiteBooking {
  id: string;
  customer: string;
  phone: string;
  vehicle: string;
  package: string;
  date: string;
  time: string;
  email: string;
  address: string;
  notes: string;
}

interface WebsiteCustomer {
  name: string;
  phone: string;
  email: string;
  address: string;
}

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
    if (stored) {
      const state = JSON.parse(stored) as AppState;
      const importedState = mergeWebsiteBookings(state);
      if (importedState !== state) saveState(importedState);
      return importedState;
    }
  } catch (error) {
    console.error('Failed to load state:', error);
  }
  const state = createEmptyState();
  const importedState = mergeWebsiteBookings(state);
  saveState(importedState);
  return importedState;
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

export function mergeWebsiteBookings(
  state: AppState,
  remoteData?: { bookings?: WebsiteBooking[]; customers?: WebsiteCustomer[] },
): AppState {
  let websiteData: { bookings?: WebsiteBooking[]; customers?: WebsiteCustomer[] } | undefined = remoteData;
  if (!websiteData) {
    let stored: string | null;
    try {
      stored = localStorage.getItem(WEBSITE_BOOKINGS_KEY);
    } catch (error) {
      console.error('Failed to read website booking requests:', error);
      return state;
    }
    if (!stored) return state;
    try {
      websiteData = JSON.parse(stored) as { bookings?: WebsiteBooking[]; customers?: WebsiteCustomer[] };
    } catch (error) {
      console.error('Failed to read website booking requests:', error);
      return state;
    }
  }

  if (!websiteData || !Array.isArray(websiteData.bookings)) return state;

  const websiteCustomers = Array.isArray(websiteData.customers) ? websiteData.customers : [];
  const customers = [...state.customers];
  const vehicles = [...state.vehicles];
  const services = [...state.services];
  const bookings = [...state.bookings];
  const notifications = [...state.notifications];
  let imported = false;

  for (const candidate of websiteData.bookings) {
    if (!candidate || typeof candidate !== 'object') continue;
    const request = candidate as Partial<WebsiteBooking>;
    if (
      typeof request.id !== 'string'
      || typeof request.customer !== 'string'
      || typeof request.package !== 'string'
      || typeof request.date !== 'string'
      || !/^\d{4}-\d{2}-\d{2}$/.test(request.date)
    ) continue;

    const customerName = request.customer;
    const packageName = request.package;
    const bookingId = `website-${request.id}`;
    if (bookings.some(booking => booking.id === bookingId)) continue;

    const phone = typeof request.phone === 'string' ? request.phone : '';
    const websiteCustomer = websiteCustomers.find(customer =>
      customer && typeof customer.name === 'string'
      && customer.name.toLowerCase() === request.customer?.toLowerCase()
      && (!customer.phone || customer.phone === phone)
    );
    let customer = customers.find(item =>
      item.name.toLowerCase() === customerName.toLowerCase()
      && (!phone || item.phone === phone)
    );

    if (!customer) {
      customer = {
        id: `website-customer-${request.id}`,
        name: customerName,
        phone,
        email: websiteCustomer?.email || request.email || '',
        location: websiteCustomer?.address || request.address || '',
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
      };
      customers.push(customer);
    }

    let service = services.find(item => item.name.toLowerCase() === packageName.toLowerCase());
    if (!service) {
      service = {
        id: `website-service-${encodeURIComponent(packageName).replace(/%/g, '-')}`,
        name: packageName,
        description: 'Requested through the Drive&Shine website.',
        price: 0,
        duration: 60,
        category: 'Website request',
        active: true,
      };
      services.push(service);
    }

    const startTime = to24HourTime(request.time || '');
    const endTime = addOneHour(startTime);
    const vehicleId = `website-vehicle-${request.id}`;
    const vehicle: Vehicle = {
      id: vehicleId,
      customerId: customer.id,
      make: 'Not provided',
      model: request.vehicle || 'Vehicle details needed',
      year: new Date().getFullYear(),
      color: 'Not provided',
      plateNumber: '',
      type: mapVehicleType(request.vehicle || ''),
      notes: 'Vehicle details submitted through the website booking form.',
    };

    const booking: Booking = {
      id: bookingId,
      customerId: customer.id,
      vehicleId,
      serviceId: service.id,
      date: request.date,
      startTime,
      endTime,
      staffId: '',
      price: service.price,
      paymentStatus: 'pending',
      status: 'pending',
      notes: [
        request.address ? `Service location: ${request.address}` : '',
        request.email ? `Email: ${request.email}` : '',
        request.notes ? `Notes: ${request.notes}` : '',
      ].filter(Boolean).join('\n'),
      createdAt: new Date().toISOString().split('T')[0],
    };

    const notification: Notification = {
      id: bookingId,
      title: 'New website booking',
      message: `${customerName} requested ${packageName}.`,
      type: 'booking',
      read: false,
      date: request.date,
    };

    vehicles.push(vehicle);
    bookings.push(booking);
    notifications.unshift(notification);
    imported = true;
  }

  return imported ? { ...state, customers, vehicles, services, bookings, notifications } : state;
}

function to24HourTime(time: string): string {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '09:00';
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hours += 12;
  return `${String(hours).padStart(2, '0')}:${match[2]}`;
}

function addOneHour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(2000, 0, 1, hours, minutes + 60).toTimeString().slice(0, 5);
}

function mapVehicleType(type: string): Vehicle['type'] {
  switch (type.toLowerCase()) {
    case 'coupe':
      return 'coupe';
    case 'suv':
    case 'luxury or exotic':
      return 'suv';
    case 'truck':
      return 'truck';
    default:
      return 'sedan';
  }
}

export function resetState(): AppState {
  const state = createEmptyState();
  saveState(state);
  return state;
}