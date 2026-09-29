export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  password: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  type: 'sedan' | 'suv' | 'truck' | 'van' | 'hatchback' | 'coupe';
  notes: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // minutes
  category: string;
  active: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface Booking {
  id: string;
  customerId: string;
  vehicleId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  staffId: string;
  price: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  status: BookingStatus;
  notes: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: 'cash' | 'mobile_money' | 'card' | 'bank_transfer';
  date: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  supplier: string;
  lastUpdated: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  type: 'stock_in' | 'stock_out' | 'adjustment' | 'return';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  userId: string;
  date: string;
}

export type MembershipType = 'basic' | 'premium' | 'vip' | 'custom';
export type MembershipStatus = 'active' | 'expiring_soon' | 'expired';

export interface Membership {
  id: string;
  customerId: string;
  type: MembershipType;
  price: number;
  startDate: string;
  expiryDate: string;
  includedServices: number;
  servicesUsed: number;
  paymentStatus: 'pending' | 'paid';
  status: MembershipStatus;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: string;
  supplier: string;
  addedBy: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'inventory' | 'membership' | 'system';
  read: boolean;
  date: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export interface AppState {
  users: User[];
  customers: Customer[];
  vehicles: Vehicle[];
  services: Service[];
  bookings: Booking[];
  payments: Payment[];
  inventory: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  memberships: Membership[];
  expenses: Expense[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  currentUserId: string | null;
}
