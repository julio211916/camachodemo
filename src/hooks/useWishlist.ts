import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WishlistItem {
  id: string;
  product_id: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    retail_price: number;
    images: string[];
  };
}

export const useWishlist = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistId, setWishlistId] = useState<string | null>(null);

  const getSessionId = () => {
    let sessionId = localStorage.getItem("wishlist_session_id");
    if (!sessionId) {
      sessionId = `wishlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("wishlist_session_id", sessionId);
    }
    return sessionId;
  };

  const getOrCreateWishlist = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const sessionId = getSessionId();

    let query = supabase.from("wishlists").select("id");
    
    if (user) {
      query = query.eq("user_id", user.id);
    } else {
      query = query.eq("session_id", sessionId);
    }

    const { data: existingWishlist } = await query.single();

    if (existingWishlist) {
      return existingWishlist.id;
    }

    const { data: newWishlist, error } = await supabase
      .from("wishlists")
      .insert({
        user_id: user?.id || null,
        session_id: user ? null : sessionId,
      })
      .select("id")
      .single();

    if (error) throw error;
    return newWishlist.id;
  }, []);

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const id = await getOrCreateWishlist();
      setWishlistId(id);

      const { data, error } = await supabase
        .from("wishlist_items")
        .select("id, product_id")
        .eq("wishlist_id", id);

      if (error) throw error;

      if (data && data.length > 0) {
        const productIds = data.map(item => item.product_id);
        const { data: products } = await supabase
          .from("products")
          .select("id, name, slug, retail_price, images")
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
      console.error("Error fetching wishlist:", error);
    } finally {
      setLoading(false);
    }
  }, [getOrCreateWishlist]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = async (productId: string) => {
    try {
      const id = wishlistId || await getOrCreateWishlist();
      
      const { data: product } = await supabase
        .from("products")
        .select("name")
        .eq("id", productId)
        .single();

      const { error } = await supabase.from("wishlist_items").insert({
        wishlist_id: id,
        product_id: productId,
      });

      if (error) throw error;
      toast.success(`${product?.name || 'Producto'} agregado a favoritos`);
      await fetchWishlist();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.info("Este producto ya está en tus favoritos");
      } else {
        console.error("Error adding to wishlist:", error);
        toast.error("Error al agregar a favoritos");
      }
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const item = items.find(i => i.product_id === productId);
      if (!item) return;

      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("id", item.id);

      if (error) throw error;
      setItems(items.filter(i => i.id !== item.id));
      toast.success("Producto eliminado de favoritos");
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Error al eliminar de favoritos");
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some(item => item.product_id === productId);
  };

  const toggleWishlist = async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  return {
    items,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    refreshWishlist: fetchWishlist,
  };
};
