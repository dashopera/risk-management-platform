import { create } from 'zustand';
import type { Notification } from '@/types/types';

interface AppState {
  notifications: Notification[];
  unreadCount: number;
  sidebarCollapsed: boolean;
  setNotifications: (notifications: Notification[]) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  notifications: [],
  unreadCount: 0,
  sidebarCollapsed: false,
  setNotifications: (notifications) => set({
    notifications,
    unreadCount: notifications.filter(n => !n.is_read).length,
  }),
  markAsRead: (id) => set((state) => {
    const notifications = state.notifications.map(n =>
      n.id === id ? { ...n, is_read: true } : n
    );
    return { notifications, unreadCount: notifications.filter(n => !n.is_read).length };
  }),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, is_read: true })),
    unreadCount: 0,
  })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
