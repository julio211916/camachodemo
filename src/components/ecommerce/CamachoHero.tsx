import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ReactTyped } from "react-typed";
import { useNavigate } from "react-router-dom";
import { ArcGalleryHero } from "@/components/ui/arc-gallery-hero";

// Product images for the arc
import espiritusTomar from "@/assets/products/espiritus-tomar.png";
import locionAgave from "@/assets/products/locion-agave.png";
import locionNardos from "@/assets/products/locion-nardos.png";
import aceiteArrayan from "@/assets/products/aceite-arrayan.png";
import locionMilFlores from "@/assets/products/locion-mil-flores.png";
import locionJazmin from "@/assets/products/locion-jazmin.png";
import pomadaAbeja from "@/assets/products/pomada-abeja.png";
import pomadaManzana from "@/assets/products/pomada-manzana.png";
import aceiteCoco from "@/assets/products/aceite-coco.png";

const productImages = [
  espiritusTomar,
  locionAgave,
  locionNardos,
  aceiteArrayan,
  locionMilFlores,
  locionJazmin,
  pomadaAbeja,
  pomadaManzana,
  aceiteCoco,
];

const productTypes = [
  "Aceites Naturales",
  "Lociones Medicinales", 
  "Pomadas Curativas",
  "Jarabes Tradicionales",
  "Productos Botánicos",
];

export function CamachoHero() {
  const navigate = useNavigate();

  return (
    <ArcGalleryHero
      images={productImages}
      startAngle={25}
      endAngle={155}
      radiusLg={420}
      radiusMd={320}
      radiusSm={220}
      cardSizeLg={100}
      cardSizeMd={85}
      cardSizeSm={65}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8"
        >
          <motion.span
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.8, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-2 h-2 rounded-full bg-emerald-400"
          />
          <span className="text-sm font-medium text-white/90">
            Tradición desde 1980
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight leading-[1.1] mb-6 text-white"
        >
          <span className="block">Productos</span>
          <span className="block bg-gradient-to-r from-emerald-300 via-lime-200 to-emerald-300 bg-clip-text text-transparent">
            Camacho
          </span>
        </motion.h1>

        {/* Typewriter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-lg md:text-xl lg:text-2xl text-white/80 mb-10 h-8"
        >
          Especialistas en{" "}
          <span className="text-white font-medium">
            <ReactTyped
              strings={productTypes}
              typeSpeed={60}
              backSpeed={40}
              backDelay={2000}
              loop
              showCursor
              cursorChar="|"
            />
          </span>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            onClick={() => navigate("/productos")}
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.98 }}
            className="group relative px-8 py-4 text-base font-semibold text-[hsl(145,35%,20%)] bg-white rounded-full shadow-xl shadow-black/20 hover:shadow-2xl transition-all duration-300 overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-200/50 to-transparent -translate-x-full"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
            <span className="relative flex items-center gap-2">
              Ver Productos
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>

          <motion.button
            onClick={() => document.getElementById("categorias")?.scrollIntoView({ behavior: "smooth" })}
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 text-base font-semibold text-white bg-transparent border-2 border-white/50 rounded-full hover:bg-white/10 hover:border-white transition-all duration-300"
          >
            Explorar Categorías
          </motion.button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto"
        >
          {[
            { number: "40+", label: "Años" },
            { number: "165+", label: "Productos" },
            { number: "7", label: "Sucursales" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 + index * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-serif font-bold text-white mb-1">
                {stat.number}
              </div>
              <div className="text-xs md:text-sm text-white/60 uppercase tracking-widest">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </ArcGalleryHero>
  );
}

export default CamachoHero;
