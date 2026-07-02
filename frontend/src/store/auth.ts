/**
 * Developer: DroneBug Technologies
 * GitHub: https://github.com/ABugDrone
 * App: Amirable Hotel Management System
 * License: Proprietary
 */

import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('amirable_token'),
  user: JSON.parse(localStorage.getItem('amirable_user') || 'null'),
  isAuthenticated: !!localStorage.getItem('amirable_token'),
  setAuth: (token, user) => {
    localStorage.setItem('amirable_token', token);
    localStorage.setItem('amirable_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('amirable_token');
    localStorage.removeItem('amirable_user');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
