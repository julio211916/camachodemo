import { useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ArrowRight } from "lucide-react";
import { ReactTyped } from "react-typed";

export const Hero = () => {
  const services = [
    "Implantes Dentales",
    "Ortodoncia Invisible",
    "Blanqueamiento",
    "Diseño de Sonrisa",
  ];

  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      
      {/* Floating circles decoration */}
      <motion.div
        className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-primary/5 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-accent/5 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Content */}
      <div className="container-wide relative z-10 text-center pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Odontología Digital de Vanguardia
          </motion.span>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-bold text-foreground mb-6 tracking-tight leading-[1.1]"
          >
            Tu sonrisa.
            <br />
            <span className="gradient-text">Perfeccionada.</span>
          </motion.h1>

          {/* Typewriter subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-xl md:text-2xl text-muted-foreground mb-12 h-8"
          >
            Especialistas en{" "}
            <span className="text-foreground font-medium">
              <ReactTyped
                strings={services}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.a
              href="#cita"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-full font-medium text-lg transition-all hover:bg-foreground/90"
            >
              Agendar Cita
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.a>
            <motion.a
              href="#quienes-somos"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-8 py-4 text-foreground rounded-full font-medium text-lg border border-border hover:bg-muted/50 transition-all"
            >
              Conocer Más
            </motion.a>
          </motion.div>
        </motion.div>

        {/* Stats - Minimal style */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mt-24 max-w-3xl mx-auto"
        >
          {[
            { number: "15+", label: "Años" },
            { number: "4", label: "Sucursales" },
            { number: "9", label: "Especialidades" },
            { number: "10K+", label: "Pacientes" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-1">
                {stat.number}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center text-muted-foreground"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </motion.div>
    </section>
  );
};
