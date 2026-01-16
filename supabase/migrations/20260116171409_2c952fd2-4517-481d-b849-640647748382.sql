-- Create wishlist table for favorites
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(session_id)
);

-- Create wishlist items table
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(wishlist_id, product_id)
);

-- Enable RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wishlists
CREATE POLICY "Users can view their own wishlist" ON public.wishlists
  FOR SELECT USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can create their own wishlist" ON public.wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can update their own wishlist" ON public.wishlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlist" ON public.wishlists
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for wishlist_items  
CREATE POLICY "Users can view their wishlist items" ON public.wishlist_items
  FOR SELECT USING (
    wishlist_id IN (SELECT id FROM public.wishlists WHERE user_id = auth.uid() OR session_id IS NOT NULL)
  );

CREATE POLICY "Users can add wishlist items" ON public.wishlist_items
  FOR INSERT WITH CHECK (
    wishlist_id IN (SELECT id FROM public.wishlists WHERE user_id = auth.uid() OR session_id IS NOT NULL)
  );

CREATE POLICY "Users can remove wishlist items" ON public.wishlist_items
  FOR DELETE USING (
    wishlist_id IN (SELECT id FROM public.wishlists WHERE user_id = auth.uid() OR session_id IS NOT NULL)
  );

-- Update orders table for better e-commerce tracking
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'efectivo',
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP WITH TIME ZONE;

-- Create order status history for tracking
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view order status history" ON public.order_status_history
  FOR SELECT USING (true);

CREATE POLICY "Staff can insert order status" ON public.order_status_history
  FOR INSERT WITH CHECK (true);

-- Update carts RLS for guests
DROP POLICY IF EXISTS "Users can view their own cart" ON public.carts;
DROP POLICY IF EXISTS "Users can create their own cart" ON public.carts;
DROP POLICY IF EXISTS "Users can update their own cart" ON public.carts;

CREATE POLICY "Anyone can view carts" ON public.carts FOR SELECT USING (true);
CREATE POLICY "Anyone can create carts" ON public.carts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update carts" ON public.carts FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete carts" ON public.carts FOR DELETE USING (true);

-- Update cart_items RLS
DROP POLICY IF EXISTS "Users can view their cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can add cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can remove cart items" ON public.cart_items;

CREATE POLICY "Anyone can view cart items" ON public.cart_items FOR SELECT USING (true);
CREATE POLICY "Anyone can add cart items" ON public.cart_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update cart items" ON public.cart_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete cart items" ON public.cart_items FOR DELETE USING (true);

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;