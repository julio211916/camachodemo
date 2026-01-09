import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { MapPin, Phone, Clock, ExternalLink } from "lucide-react";

const locations = [
  {
    name: "Matriz Tepic",
    address: "Country Club 10, Caoba y Av. Insurgentes, Versalles, C.P. 63139, Tepic, Nayarit",
    phone: "+52 311 133 8000",
    hours: "Lun - Sáb: 9:00 - 19:00",
    mapUrl: "#",
    image: "https://images.unsplash.com/photo-1629909615184-74f495363b67?w=600&q=80",
  },
  {
    name: "Marina Nuevo Nayarit",
    address: "Nuevo Vallarta Plaza Business Center, Bahía de Banderas, Nayarit",
    phone: "+52 322 183 7666",
    hours: "Lun - Sáb: 9:00 - 19:00",
    mapUrl: "#",
    image: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600&q=80",
  },
  {
    name: "Centro Empresarial Nuevo Nayarit",
    address: "Núcleo Médico Joya, Bahía de Banderas, Nayarit",
    phone: "+52 322 183 7666",
    hours: "Lun - Sáb: 9:00 - 19:00",
    mapUrl: "#",
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&q=80",
  },
  {
    name: "Puerto Mágico Puerto Vallarta",
    address: "Plaza Puerto Mágico, Puerto Vallarta, Jalisco",
    phone: "+52 322 183 7666",
    hours: "Lun - Sáb: 9:00 - 19:00",
    mapUrl: "#",
    image: "https://images.unsplash.com/photo-1629909615957-be38d48fbbe4?w=600&q=80",
  },
];

export const Locations = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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
            Con 4 ubicaciones estratégicas en Nayarit y Jalisco, siempre hay una clínica NovellDent cerca de ti.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {locations.map((location, index) => (
            <motion.div
              key={location.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -8 }}
              className="group relative overflow-hidden rounded-3xl bg-card border border-border/50 hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={location.image}
                  alt={location.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-foreground mb-2">
                      {location.name}
                    </h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                        {location.address}
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
                    href={location.mapUrl}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </motion.a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
