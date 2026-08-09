'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  businessId: string;
  businessName?: string;
  spaceName?: string;
  qrCodeUrl?: string | null;
  ownerPhone?: string | null;
  notes?: string;
}

export interface StoreGroup {
  businessId: string;
  businessName: string;
  spaceName?: string;
  qrCodeUrl?: string | null;
  ownerPhone?: string | null;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

interface CartContextType {
  items: CartItem[];
  groupedByBusiness: StoreGroup[];
  isMultiStore: boolean;
  businessCount: number;
  businessId: string | null; // Primer comercio o comercio principal
  businessName: string | null;
  addItem: (item: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string | null;
    businessId: string;
    businessName?: string;
    spaceName?: string;
    qrCodeUrl?: string | null;
    ownerPhone?: string | null;
    notes?: string;
  }) => boolean;
  removeItem: (productId: string) => void;
  removeBusinessItems: (businessId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  deliveryFee: number;
  total: number;
  totalItems: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Cargar carrito desde localStorage en cliente
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pedidostrinidad_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        setItems(parsed.items || []);
      }
    } catch (e) {
      console.error('Error al cargar carrito:', e);
    }
  }, []);

  // Guardar en localStorage ante cambios
  useEffect(() => {
    try {
      localStorage.setItem(
        'pedidostrinidad_cart',
        JSON.stringify({ items })
      );
    } catch (e) {
      console.error('Error al guardar carrito:', e);
    }
  }, [items]);

  // Agrupación de productos por comercio de forma reactiva y memorizada
  const groupedByBusiness: StoreGroup[] = useMemo(() => {
    const groupsMap = new Map<string, StoreGroup>();

    items.forEach((item) => {
      const bId = item.businessId || 'comercio-general';
      const existing = groupsMap.get(bId);

      if (existing) {
        existing.items.push(item);
        existing.subtotal = Number((existing.subtotal + item.price * item.quantity).toFixed(2));
        existing.itemCount += item.quantity;
      } else {
        groupsMap.set(bId, {
          businessId: bId,
          businessName: item.businessName || 'Comercio Asociado',
          spaceName: item.spaceName,
          qrCodeUrl: item.qrCodeUrl,
          ownerPhone: item.ownerPhone,
          items: [item],
          subtotal: Number((item.price * item.quantity).toFixed(2)),
          itemCount: item.quantity,
        });
      }
    });

    return Array.from(groupsMap.values());
  }, [items]);

  const isMultiStore = groupedByBusiness.length > 1;
  const businessCount = groupedByBusiness.length;
  const businessId = groupedByBusiness[0]?.businessId || null;
  const businessName = isMultiStore
    ? `${groupedByBusiness.length} Comercios (${groupedByBusiness.map((g) => g.businessName).join(', ')})`
    : groupedByBusiness[0]?.businessName || null;

  const addItem = (newItem: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string | null;
    businessId: string;
    businessName?: string;
    spaceName?: string;
    qrCodeUrl?: string | null;
    ownerPhone?: string | null;
    notes?: string;
  }): boolean => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === newItem.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += newItem.quantity;
        if (newItem.notes) updated[existingIndex].notes = newItem.notes;
        return updated;
      } else {
        return [
          ...prev,
          {
            id: newItem.id,
            name: newItem.name,
            price: newItem.price,
            quantity: newItem.quantity,
            imageUrl: newItem.imageUrl,
            businessId: newItem.businessId,
            businessName: newItem.businessName,
            spaceName: newItem.spaceName,
            qrCodeUrl: newItem.qrCodeUrl,
            ownerPhone: newItem.ownerPhone,
            notes: newItem.notes,
          },
        ];
      }
    });

    return true;
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  };

  const removeBusinessItems = (bId: string) => {
    setItems((prev) => prev.filter((i) => i.businessId !== bId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = Number(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
  );

  // Tarifa estándar base de delivery en Trinidad
  const deliveryFee = items.length > 0 ? 10.0 : 0.0;
  const total = Number((subtotal + deliveryFee).toFixed(2));
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        groupedByBusiness,
        isMultiStore,
        businessCount,
        businessId,
        businessName,
        addItem,
        removeItem,
        removeBusinessItems,
        updateQuantity,
        clearCart,
        subtotal,
        deliveryFee,
        total,
        totalItems,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser utilizado dentro de un CartProvider');
  }
  return context;
}
