import { motion } from "framer-motion";
import { ChevronDown, ArrowRight } from "lucide-react";
import { ReactTyped } from "react-typed";
import { useLanguage } from "@/contexts/LanguageContext";
import { GlassButton } from "@/components/ui/glass-button";

export const Hero = () => {
  const { t } = useLanguage();
  
  const services = [
    t('hero.service1'),
    t('hero.service2'),
    t('hero.service3'),
    t('hero.service4'),
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
            {t('hero.badge')}
          </motion.span>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-bold text-foreground mb-6 tracking-tight leading-[1.1]"
          >
            {t('hero.title1')}
            <br />
            <span className="gradient-text">{t('hero.title2')}</span>
          </motion.h1>

          {/* Typewriter subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-xl md:text-2xl text-muted-foreground mb-12 h-8"
          >
            {t('hero.specialistsIn')}{" "}
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

          {/* CTA Buttons with Glass Effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <GlassButton
              size="lg"
              onClick={() => document.getElementById('cita')?.scrollIntoView({ behavior: 'smooth' })}
              className="group"
            >
              <span className="flex items-center gap-2">
                {t('hero.cta')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </GlassButton>
            
            <motion.button
              onClick={() => document.getElementById('quienes-somos')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-outline"
            >
              {t('hero.secondary')}
            </motion.button>
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
            { number: "15+", label: t('hero.years') },
            { number: "4", label: t('hero.branches') },
            { number: "9", label: t('hero.specialties') },
            { number: "10K+", label: t('hero.patients') },
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
