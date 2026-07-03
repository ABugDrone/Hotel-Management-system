/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

export type RoomStatus = 'available' | 'occupied' | 'dirty' | 'maintenance' | 'reserved';

export interface Room {
  id: string;
  number: string;
  room_type: string;
  status: RoomStatus;
  price_per_night: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  id_type?: string;
  id_number?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'pos';

export interface Payment {
  id: string;
  method: PaymentMethod;
  amount: number;
  description?: string;
  assignment_id: string;
  guest_id: string;
  ledger_id: string;
  recorded_by: string;
  created_at: string;
}
