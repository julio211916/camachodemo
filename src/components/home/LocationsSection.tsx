import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const locations = [
  { name: "Estado de México", icon: "🏭" },
  { name: "Ciudad de México", icon: "🏛️" },
  { name: "Morelos", icon: "🌺" },
  { name: "Hidalgo", icon: "⛰️" },
  { name: "Querétaro", icon: "🏰" },
  { name: "Puebla", icon: "🎭" },
];

export const LocationsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-[#1a1f1a]" ref={ref} id="ubicaciones">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary text-sm font-medium uppercase tracking-wider">
              Nuestra Presencia
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mt-2 mb-4">
              ¿Dónde puedes <span className="text-primary">encontrarnos?</span>
            </h2>
            <p className="text-gray-300 text-lg mb-6">
              Nuestra empresa tiene presencia en 6 estados de la República Mexicana, 
              sirviendo a farmacias locales, distribuidores y establecimientos de salud en crecimiento.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {locations.map((location, index) => (
                <motion.div
                  key={location.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3 border border-white/10"
                >
                  <span className="text-xl">{location.icon}</span>
                  <span className="text-sm text-white font-medium">{location.name}</span>
                </motion.div>
              ))}
            </div>

            <Button
              onClick={() => navigate("/productos")}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-8"
            >
              Compra ahora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          {/* Right Content - Map Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl p-8 border border-primary/20">
              <div className="aspect-square relative flex items-center justify-center">
                <MapPin className="w-32 h-32 text-primary/30 absolute" />
                <div className="relative z-10 text-center">
                  <span className="text-6xl font-bold text-primary">6</span>
                  <p className="text-xl font-semibold text-white mt-2">Estados</p>
                  <p className="text-gray-400">de la República</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <span className="text-2xl font-bold text-primary">100+</span>
                  <p className="text-sm text-gray-400">Farmacias atendidas</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <span className="text-2xl font-bold text-primary">40+</span>
                  <p className="text-sm text-gray-400">Años de servicio</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
