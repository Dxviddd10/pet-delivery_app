import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Product } from '@/lib/schemas';

export type CartLine = { product: Product; quantity: number };

type CartContextValue = {
  vetId: string | null;
  lines: CartLine[];
  count: number;
  subtotal: number;
  /** Devuelve 'other_vet' si el carrito ya tiene productos de otra veterinaria. */
  add: (product: Product) => 'ok' | 'other_vet' | 'no_stock';
  replaceWith: (product: Product) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const vetId = lines[0]?.product.vet_id ?? null;

  const add = useCallback<CartContextValue['add']>(
    (product) => {
      if (product.stock < 1) return 'no_stock';
      if (vetId && vetId !== product.vet_id) return 'other_vet';
      setLines((prev) => {
        const found = prev.find((l) => l.product.id === product.id);
        if (!found) return [...prev, { product, quantity: 1 }];
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: Math.min(l.quantity + 1, product.stock) } : l,
        );
      });
      return 'ok';
    },
    [vetId],
  );

  const replaceWith = useCallback((product: Product) => setLines([{ product, quantity: 1 }]), []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.product.id !== productId)
        : prev.map((l) =>
            l.product.id === productId ? { ...l, quantity: Math.min(quantity, l.product.stock) } : l,
          ),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      vetId,
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: lines.reduce((n, l) => n + l.quantity * l.product.price, 0),
      add,
      replaceWith,
      setQuantity,
      clear,
    }),
    [vetId, lines, add, replaceWith, setQuantity, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
