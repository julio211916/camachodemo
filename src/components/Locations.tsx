import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { MapPin, Phone, Clock, Navigation, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const locations = [
  {
    name: "Matriz Tepic",
    address: "Country Club 10, Caoba y Av. Insurgentes, Versalles, C.P. 63139, Tepic, Nayarit",
    phone: "+52 311 133 8000",
    hours: "Lun - Sáb: 9:00 - 19:00",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3735.8897!2d-104.8954!3d21.5051!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x842735a2ac67893f%3A0x4c9a5e7d8f1b2c3d!2sCountry%20Club%2010%2C%20Versalles%2C%20Tepic%2C%20Nay.!5e0!3m2!1ses!2smx!4v1704567890",
    directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=21.5051,-104.8954",
    image: "https://images.unsplash.com/photo-1629909615184-74f495363b67?w=600&q=80",
  },
  {
    name: "La Cruz de Huanacaxtle",
    address: "La Cruz de Huanacaxtle, Bahía de Banderas, Nayarit",
    phone: "+52 329 295 5000",
    hours: "Lun - Sáb: 9:00 - 19:00",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3732.4521!2d-105.3842!3d20.7515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x842145f8a9d2e3b5%3A0x6a7b8c9d0e1f2a3b!2sLa%20Cruz%20de%20Huanacaxtle%2C%20Nay.!5e0!3m2!1ses!2smx!4v1704567891",
    directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=20.7515,-105.3842",
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&q=80",
  },
  {
    name: "Marina Nuevo Nayarit",
    address: "Nuevo Vallarta Plaza Business Center, Bahía de Banderas, Nayarit",
    phone: "+52 322 183 7666",
    hours: "Lun - Sáb: 9:00 - 19:00",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3732.1245!2d-105.2987!3d20.7012!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x84214523bc789def%3A0x1a2b3c4d5e6f7890!2sNuevo%20Vallarta%2C%20Nay.!5e0!3m2!1ses!2smx!4v1704567892",
    directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=20.7012,-105.2987",
    image: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600&q=80",
  },
  {
    name: "Centro Empresarial Nuevo Nayarit",
    address: "Núcleo Médico Joya, Bahía de Banderas, Nayarit",
    phone: "+52 322 183 7666",
    hours: "Lun - Sáb: 9:00 - 19:00",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3732.3567!2d-105.3125!3d20.6845!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8421452abcdef123%3A0x9876543210fedcba!2sNucleo%20Medico%20Joya%2C%20Nay.!5e0!3m2!1ses!2smx!4v1704567893",
    directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=20.6845,-105.3125",
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&q=80",
  },
  {
    name: "Puerto Mágico Puerto Vallarta",
    address: "Plaza Puerto Mágico, Puerto Vallarta, Jalisco",
    phone: "+52 322 183 7666",
    hours: "Lun - Sáb: 9:00 - 19:00",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3733.8912!2d-105.2345!3d20.6123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x842147fedcba9876%3A0xabcdef1234567890!2sPuerto%20Vallarta%2C%20Jal.!5e0!3m2!1ses!2smx!4v1704567894",
    directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=20.6123,-105.2345",
    image: "https://images.unsplash.com/photo-1629909615957-be38d48fbbe4?w=600&q=80",
  },
];

export const Locations = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedLocation, setSelectedLocation] = useState<typeof locations[0] | null>(null);

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
            Sucursales
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
            Encuentra tu{" "}
            <span className="gradient-text">clínica más cercana</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Con 5 ubicaciones estratégicas en Nayarit y Jalisco, siempre hay una clínica NovellDent cerca de ti.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {locations.map((location, index) => (
            <motion.div
              key={location.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group relative overflow-hidden rounded-3xl bg-card border border-border/50 hover:shadow-xl transition-all duration-300"
            >
              {/* Map Preview */}
              <div className="aspect-[16/9] overflow-hidden relative cursor-pointer" onClick={() => setSelectedLocation(location)}>
                <iframe
                  src={location.mapUrl}
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
                    Ver mapa completo
                  </span>
                </div>
              </div>
              
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
                        <span className="line-clamp-2">{location.address}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 flex-shrink-0 text-primary" />
                        {location.phone}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0 text-primary" />
                        {location.hours}
                      </p>
                    </div>
                  </div>
                  <motion.a
                    href={location.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
                    title="Cómo llegar"
                  >
                    <Navigation className="w-5 h-5" />
                  </motion.a>
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
            {selectedLocation && (
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex-1 rounded-xl overflow-hidden min-h-[300px]">
                  <iframe
                    src={selectedLocation.mapUrl}
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
                    </p>
                  </div>
                  <Button asChild>
                    <a
                      href={selectedLocation.directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-2"
                    >
                      <Navigation className="w-4 h-4" />
                      Cómo llegar
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
