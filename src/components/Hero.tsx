import { motion } from "framer-motion";
import { Play, ChevronDown } from "lucide-react";
import heroDental from "@/assets/hero-dental.jpg";

export const Hero = () => {
  return (
    <section id="inicio" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Video/Image Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          poster={heroDental}
        >
          <source
            src="https://cdn.pixabay.com/video/2021/09/14/88373-605917555_large.mp4"
            type="video/mp4"
          />
        </video>
        <div className="video-overlay" />
      </div>

      {/* Content */}
      <div className="container-wide relative z-10 pt-32 pb-20">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary-foreground dark:text-primary text-sm font-medium backdrop-blur-sm border border-primary/30">
              Digital Dentistry
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-4xl md:text-5xl lg:text-7xl font-serif font-bold text-white mb-6 leading-tight"
          >
            Tu Sonrisa,{" "}
            <span className="text-primary">Nuestra Pasión</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg md:text-xl text-white/80 mb-8 max-w-xl"
          >
            Tecnología de vanguardia y especialistas certificados para ofrecerte 
            la mejor experiencia en salud dental. Resultados óptimos, sonrisas perfectas.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <motion.a
              href="#cita"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary"
            >
              Agendar Cita
            </motion.a>
            <motion.a
              href="#quienes-somos"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-white border-2 border-white/30 rounded-full backdrop-blur-sm hover:bg-white/10 transition-all"
            >
              <Play className="w-5 h-5" />
              Conocer Más
            </motion.a>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 md:mt-24"
        >
          {[
            { number: "15+", label: "Años de Experiencia" },
            { number: "4", label: "Sucursales" },
            { number: "9", label: "Especialidades" },
            { number: "10K+", label: "Pacientes Felices" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
              className="glass-card rounded-2xl p-6 text-center backdrop-blur-md"
            >
              <div className="text-3xl md:text-4xl font-serif font-bold gradient-text mb-2">
                {stat.number}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center text-white/60"
        >
          <span className="text-xs mb-2">Descubre más</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  );
};
