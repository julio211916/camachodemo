import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Clock, Navigation, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  map_url: string | null;
  directions_url: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
  display_order: number;
}

export const Locations = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const { t } = useLanguage();

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["public-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Location[];
    },
  });

  if (isLoading) {
    return (
      <section id="sucursales" className="section-padding" ref={ref}>
        <div className="container-wide flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (locations.length === 0) {
    return null;
  }

  return (
    <section id="sucursales" className="section-padding" ref={ref}>
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            {t('locations.badge')}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
            {t('locations.title')}{" "}
            <span className="gradient-text">{t('locations.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('locations.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {locations.map((location, index) => (
            <motion.div
              key={location.id}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group relative overflow-hidden rounded-3xl bg-card border border-border/50 hover:shadow-xl transition-all duration-300"
            >
              {/* Map Preview */}
              {location.map_url && (
                <div 
                  className="aspect-[16/9] overflow-hidden relative cursor-pointer" 
                  onClick={() => setSelectedLocation(location)}
                >
                  <iframe
                    src={location.map_url}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
                      {t('locations.viewMap')}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Location Info */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-serif font-bold text-foreground mb-3">
                      {location.name}
                    </h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                        <span className="line-clamp-2">
                          {location.address}
                          {location.city && `, ${location.city}`}
                          {location.state && `, ${location.state}`}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 flex-shrink-0 text-primary" />
                        {location.phone}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0 text-primary" />
                        {t('locations.hours')}
                      </p>
                    </div>
                  </div>
                  {location.directions_url && (
                    <motion.a
                      href={location.directions_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
                      title={t('locations.directions')}
                    >
                      <Navigation className="w-5 h-5" />
                    </motion.a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Map Modal */}
      <Dialog open={!!selectedLocation} onOpenChange={() => setSelectedLocation(null)}>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedLocation?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 p-4">
            {selectedLocation && selectedLocation.map_url && (
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex-1 rounded-xl overflow-hidden min-h-[300px]">
                  <iframe
                    src={selectedLocation.map_url}
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: '400px' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {selectedLocation.address}
                      {selectedLocation.city && `, ${selectedLocation.city}`}
                      {selectedLocation.state && `, ${selectedLocation.state}`}
                    </p>
                  </div>
                  {selectedLocation.directions_url && (
                    <Button asChild>
                      <a
                        href={selectedLocation.directions_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gap-2"
                      >
                        <Navigation className="w-4 h-4" />
                        {t('locations.directions')}
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
