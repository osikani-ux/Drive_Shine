import { format, isToday, isTomorrow, isYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, isSameMonth, differenceInDays } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function formatCurrency(amount: number): string {
  return `GH₵${amount.toFixed(2)}`;
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM dd, yyyy');
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

export function getRelativeDate(date: string): string {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return formatDate(date);
}

export function getStockStatus(quantity: number, minStock: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (quantity === 0) return 'out_of_stock';
  if (quantity <= minStock) return 'low_stock';
  return 'in_stock';
}

export function getMembershipStatus(startDate: string, expiryDate: string): 'active' | 'expiring_soon' | 'expired' {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = differenceInDays(expiry, now);
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 7) return 'expiring_soon';
  return 'active';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-amber-100 text-amber-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-orange-100 text-orange-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    expiring_soon: 'bg-amber-100 text-amber-800',
    expired: 'bg-red-100 text-red-800',
    in_stock: 'bg-green-100 text-green-800',
    low_stock: 'bg-amber-100 text-amber-800',
    out_of_stock: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}

export function exportToExcel(data: any[], filename: string): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPDF(data: any[], filename: string, title: string): void {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Drive&Shine', 14, 22);
  doc.setFontSize(12);
  doc.text(title, 14, 32);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);
  
  if (data.length > 0) {
    const headers = Object.keys(data[0]).map(k => k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1'));
    const rows = data.map(row => Object.values(row).map(v => String(v ?? '')));
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 48,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [30, 58, 95] },
    });
  }
  
  doc.save(`${filename}.pdf`);
}

export function generateReceipt(payment: any, booking: any, customer: any, vehicle: any, service: any, user: any): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(30, 58, 95);
  doc.text('DRIVE&SHINE', 105, 25, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Professional Car Wash & Detailing', 105, 33, { align: 'center' });
  
  // Line
  doc.setDrawColor(30, 58, 95);
  doc.setLineWidth(0.5);
  doc.line(20, 38, 190, 38);
  
  // Receipt title
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('RECEIPT', 105, 50, { align: 'center' });
  
  // Details
  doc.setFontSize(10);
  let y = 65;
  const addLine = (label: string, value: string) => {
    doc.setTextColor(100);
    doc.text(label, 25, y);
    doc.setTextColor(0);
    doc.text(value, 80, y);
    y += 8;
  };
  
  addLine('Receipt No:', `RCP-${payment.id.slice(0, 8).toUpperCase()}`);
  addLine('Payment ID:', payment.id.slice(0, 8).toUpperCase());
  addLine('Booking ID:', booking.id.slice(0, 8).toUpperCase());
  addLine('Date:', format(new Date(payment.date), 'MMMM dd, yyyy'));
  y += 5;
  
  doc.setDrawColor(200);
  doc.line(20, y, 190, y);
  y += 10;
  
  addLine('Customer:', customer?.name || 'N/A');
  addLine('Phone:', customer?.phone || 'N/A');
  addLine('Vehicle:', vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'N/A');
  addLine('Plate:', vehicle?.plateNumber || 'N/A');
  addLine('Service:', service?.name || 'N/A');
  y += 5;
  
  doc.setDrawColor(200);
  doc.line(20, y, 190, y);
  y += 10;
  
  addLine('Payment Method:', payment.method.replace('_', ' ').toUpperCase());
  addLine('Status:', payment.status.toUpperCase());
  addLine('Processed By:', user?.name || 'Admin');
  y += 5;
  
  // Total
  doc.setDrawColor(30, 58, 95);
  doc.setLineWidth(1);
  doc.line(20, y, 190, y);
  y += 12;
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 95);
  doc.text('TOTAL', 25, y);
  doc.text(`GH₵${payment.amount.toFixed(2)}`, 185, y, { align: 'right' });
  
  // Footer
  y += 25;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Thank you for choosing Drive&Shine!', 105, y, { align: 'center' });
  doc.text('www.driveshine.com | +233 20 1234567', 105, y + 6, { align: 'center' });
  
  doc.save(`receipt-${payment.id.slice(0, 8)}.pdf`);
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getMonthDays(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

export function validatePhone(phone: string): boolean {
  return /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*$/.test(phone) && phone.length >= 8;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
