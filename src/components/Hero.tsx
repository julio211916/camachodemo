import { motion } from "framer-motion";
import { ChevronDown, ArrowRight, Sparkles } from "lucide-react";
import { ReactTyped } from "react-typed";
import { useLanguage } from "@/contexts/LanguageContext";

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
      {/* Subtle gradient orbs - Apple style */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, hsl(175 60% 35% / 0.15) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, hsl(38 85% 55% / 0.12) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Content */}
      <div className="container-wide relative z-10 text-center pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-5xl mx-auto"
        >
          {/* Badge - Apple style pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/5 border border-primary/10 mb-10"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground/80">
              {t('hero.badge')}
            </span>
          </motion.div>

          {/* Main headline - Apple typography */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-display font-serif mb-6"
          >
            <span className="block text-foreground">
              {t('hero.title1')}
            </span>
            <span className="block gradient-text-animated text-glow">
              {t('hero.title2')}
            </span>
          </motion.h1>

          {/* Typewriter subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-subheadline mb-14 max-w-2xl mx-auto"
          >
            <span className="text-muted-foreground">
              {t('hero.specialistsIn')}{" "}
            </span>
            <span className="text-foreground font-medium">
              <ReactTyped
                strings={services}
                typeSpeed={50}
                backSpeed={30}
                backDelay={2500}
                loop
                showCursor
                cursorChar="|"
              />
            </span>
          </motion.div>

          {/* CTA Buttons - Apple style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5"
          >
            <motion.a
              href="#cita"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="btn-apple group"
            >
              {t('hero.cta')}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </motion.a>
            <motion.a
              href="#quienes-somos"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="btn-ghost-apple"
            >
              {t('hero.secondary')}
            </motion.a>
          </motion.div>
        </motion.div>

        {/* Stats - Minimal Apple style */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1, ease: [0.25, 0.1, 0.25, 1] }}
          className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-16 mt-28 max-w-4xl mx-auto"
        >
          {[
            { number: "15+", label: t('hero.years') },
            { number: "4", label: t('hero.branches') },
            { number: "9", label: t('hero.specialties') },
            { number: "10K+", label: t('hero.patients') },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
              className="text-center group"
            >
              <motion.div 
                className="text-5xl md:text-6xl font-serif font-bold text-foreground mb-2 transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                <span className="group-hover:gradient-text transition-all duration-300">
                  {stat.number}
                </span>
              </motion.div>
              <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-[0.2em] font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator - Minimal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center text-muted-foreground/50"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
};
