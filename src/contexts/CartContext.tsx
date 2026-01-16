import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    retail_price: number;
    images: string[];
  };
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  cartId: string | null;
  itemCount: number;
  subtotal: number;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartId, setCartId] = useState<string | null>(null);

  const getSessionId = () => {
    let sessionId = localStorage.getItem("cart_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("cart_session_id", sessionId);
    }
    return sessionId;
  };

  const getOrCreateCart = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const sessionId = getSessionId();

    let query = supabase.from("carts").select("id").eq("status", "active");
    
    if (user) {
      query = query.eq("user_id", user.id);
    } else {
      query = query.eq("session_id", sessionId);
    }

    const { data: existingCart } = await query.single();

    if (existingCart) {
      return existingCart.id;
    }

    const { data: newCart, error } = await supabase
      .from("carts")
      .insert({
        user_id: user?.id || null,
        session_id: user ? null : sessionId,
        status: "active",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();

    if (error) throw error;
    return newCart.id;
  }, []);

  const fetchCartItems = useCallback(async () => {
    try {
      setLoading(true);
      const id = await getOrCreateCart();
      setCartId(id);

      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          product_id,
          quantity,
          unit_price
        `)
        .eq("cart_id", id);

      if (error) throw error;

      // Fetch product details separately
      if (data && data.length > 0) {
        const productIds = data.map(item => item.product_id);
        const { data: products } = await supabase
          .from("products")
          .select("id, name, slug, sku, retail_price, images")
          .in("id", productIds);

        const itemsWithProducts = data.map(item => ({
          ...item,
          product: products?.find(p => p.id === item.product_id)
        }));

        setItems(itemsWithProducts);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  }, [getOrCreateCart]);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  const addItem = async (productId: string, quantity = 1) => {
    try {
      const id = cartId || await getOrCreateCart();
      
      // Get product price
      const { data: product } = await supabase
        .from("products")
        .select("retail_price, name")
        .eq("id", productId)
        .single();

      if (!product) throw new Error("Producto no encontrado");

      // Check if item already in cart
      const existingItem = items.find(item => item.product_id === productId);
      
      if (existingItem) {
        await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
        const { error } = await supabase.from("cart_items").insert({
          cart_id: id,
          product_id: productId,
          quantity,
          unit_price: product.retail_price,
        });

        if (error) throw error;
        toast.success(`${product.name} agregado al carrito`);
        await fetchCartItems();
      }
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Error al agregar producto");
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
      if (error) throw error;
      setItems(items.filter(item => item.id !== itemId));
      toast.success("Producto eliminado del carrito");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Error al eliminar producto");
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      if (quantity < 1) {
        await removeItem(itemId);
        return;
      }

      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", itemId);

      if (error) throw error;
      setItems(items.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      ));
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Error al actualizar cantidad");
    }
  };

  const clearCart = async () => {
    try {
      if (!cartId) return;
      const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId);
      if (error) throw error;
      setItems([]);
      toast.success("Carrito vaciado");
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Error al vaciar carrito");
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      loading,
      cartId,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      refreshCart: fetchCartItems,
    }}>
      {children}
    </CartContext.Provider>
  );
};
