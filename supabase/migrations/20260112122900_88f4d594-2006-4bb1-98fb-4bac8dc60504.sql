-- Create locations table for branches
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  map_url TEXT,
  directions_url TEXT,
  city TEXT,
  state TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  display_order INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Locations policies
CREATE POLICY "Anyone can view active locations" 
ON public.locations 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Staff can manage locations" 
ON public.locations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Blog policies
CREATE POLICY "Anyone can view published posts" 
ON public.blog_posts 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Staff can view all posts" 
ON public.blog_posts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff can manage posts" 
ON public.blog_posts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON public.locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default locations
INSERT INTO public.locations (name, address, phone, city, state, map_url, directions_url, display_order) VALUES
('NovellDent Tepic Centro', 'Av. México 123, Col. Centro, Tepic', '311-123-4567', 'Tepic', 'Nayarit', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3736.4!2d-104.8945!3d21.5045!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDMwJzE2LjIiTiAxMDTCsDUzJzQwLjIiVw!5e0!3m2!1ses!2smx!4v1234567890', 'https://maps.google.com/?q=NovellDent+Tepic+Centro', 1),
('NovellDent Plaza Forum', 'Plaza Forum Local 25, Tepic', '311-234-5678', 'Tepic', 'Nayarit', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3736.4!2d-104.8945!3d21.5045!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDMwJzE2LjIiTiAxMDTCsDUzJzQwLjIiVw!5e0!3m2!1ses!2smx!4v1234567890', 'https://maps.google.com/?q=NovellDent+Plaza+Forum', 2),
('NovellDent Bahía de Banderas', 'Av. Sayulita 456, Nuevo Vallarta', '322-345-6789', 'Bahía de Banderas', 'Nayarit', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3736.4!2d-104.8945!3d21.5045!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDMwJzE2LjIiTiAxMDTCsDUzJzQwLjIiVw!5e0!3m2!1ses!2smx!4v1234567890', 'https://maps.google.com/?q=NovellDent+Nuevo+Vallarta', 3),
('NovellDent Puerto Vallarta', 'Marina Vallarta Local 8, Puerto Vallarta', '322-456-7890', 'Puerto Vallarta', 'Jalisco', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3736.4!2d-104.8945!3d21.5045!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDMwJzE2LjIiTiAxMDTCsDUzJzQwLjIiVw!5e0!3m2!1ses!2smx!4v1234567890', 'https://maps.google.com/?q=NovellDent+Marina+Vallarta', 4),
('NovellDent Guadalajara', 'Av. Patria 1234, Zapopan', '333-567-8901', 'Guadalajara', 'Jalisco', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3736.4!2d-104.8945!3d21.5045!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDMwJzE2LjIiTiAxMDTCsDUzJzQwLjIiVw!5e0!3m2!1ses!2smx!4v1234567890', 'https://maps.google.com/?q=NovellDent+Zapopan', 5);
