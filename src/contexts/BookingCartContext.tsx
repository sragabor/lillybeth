'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface CartItem {
  roomTypeId: string;
  roomTypeName: string;
  accommodationId: string;
  accommodationName: string;
  quantity: number;
  pricePerNight: number | null;
  capacity: number;
  guestCounts: number[]; // Guest count per room (length = quantity, each value between 1 and capacity)
}

interface BookingDates {
  checkIn: string | null;
  checkOut: string | null;
}

interface BookingCartContextType {
  items: CartItem[];
  dates: BookingDates;
  totalRooms: number;
  addOrUpdateItem: (item: Omit<CartItem, 'quantity' | 'guestCounts'> & { quantity: number; guestCounts?: number[] }) => void;
  removeItem: (roomTypeId: string) => void;
  clearCart: () => void;
  getItemQuantity: (roomTypeId: string) => number;
  setDates: (checkIn: string | null, checkOut: string | null) => void;
  updateGuestCount: (roomTypeId: string, roomIndex: number, guestCount: number) => void;
}

const BookingCartContext = createContext<BookingCartContextType | undefined>(undefined);

export function BookingCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [dates, setDatesState] = useState<BookingDates>({ checkIn: null, checkOut: null });

  const addOrUpdateItem = useCallback((item: Omit<CartItem, 'guestCounts'> & { guestCounts?: number[] }) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.roomTypeId === item.roomTypeId);

      if (item.quantity <= 0) {
        // Remove item if quantity is 0 or less
        return prev.filter((i) => i.roomTypeId !== item.roomTypeId);
      }

      // Initialize guestCounts: use provided values or default to capacity for each room
      let guestCounts = item.guestCounts || [];

      // If existing item, try to preserve existing guest counts
      if (existingIndex >= 0) {
        const existingItem = prev[existingIndex];
        const existingCounts = existingItem.guestCounts || [];

        // Adjust array length to match new quantity
        if (item.quantity > existingCounts.length) {
          // Adding rooms: fill new slots with capacity
          guestCounts = [
            ...existingCounts,
            ...Array(item.quantity - existingCounts.length).fill(item.capacity),
          ];
        } else {
          // Removing rooms: truncate array
          guestCounts = existingCounts.slice(0, item.quantity);
        }
      } else if (guestCounts.length === 0) {
        // New item: initialize all rooms with capacity as default
        guestCounts = Array(item.quantity).fill(item.capacity);
      }

      const fullItem: CartItem = {
        ...item,
        guestCounts,
      };

      if (existingIndex >= 0) {
        // Update existing item
        const updated = [...prev];
        updated[existingIndex] = fullItem;
        return updated;
      }

      // Add new item
      return [...prev, fullItem];
    });
  }, []);

  const removeItem = useCallback((roomTypeId: string) => {
    setItems((prev) => prev.filter((i) => i.roomTypeId !== roomTypeId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDatesState({ checkIn: null, checkOut: null });
  }, []);

  const getItemQuantity = useCallback((roomTypeId: string) => {
    const item = items.find((i) => i.roomTypeId === roomTypeId);
    return item?.quantity || 0;
  }, [items]);

  const setDates = useCallback((checkIn: string | null, checkOut: string | null) => {
    setDatesState({ checkIn, checkOut });
  }, []);

  const updateGuestCount = useCallback((roomTypeId: string, roomIndex: number, guestCount: number) => {
    setItems((prev) => {
      const itemIndex = prev.findIndex((i) => i.roomTypeId === roomTypeId);
      if (itemIndex < 0) return prev;

      const item = prev[itemIndex];
      if (roomIndex < 0 || roomIndex >= item.quantity) return prev;

      // Clamp guestCount between 1 and capacity
      const clampedCount = Math.max(1, Math.min(guestCount, item.capacity));

      const newGuestCounts = [...(item.guestCounts || [])];
      // Ensure array is long enough
      while (newGuestCounts.length < item.quantity) {
        newGuestCounts.push(item.capacity);
      }
      newGuestCounts[roomIndex] = clampedCount;

      const updated = [...prev];
      updated[itemIndex] = { ...item, guestCounts: newGuestCounts };
      return updated;
    });
  }, []);

  const totalRooms = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <BookingCartContext.Provider
      value={{
        items,
        dates,
        totalRooms,
        addOrUpdateItem,
        removeItem,
        clearCart,
        getItemQuantity,
        setDates,
        updateGuestCount,
      }}
    >
      {children}
    </BookingCartContext.Provider>
  );
}

export function useBookingCart() {
  const context = useContext(BookingCartContext);
  if (!context) {
    throw new Error('useBookingCart must be used within a BookingCartProvider');
  }
  return context;
}
