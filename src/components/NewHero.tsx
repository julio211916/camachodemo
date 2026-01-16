import { motion } from "framer-motion";
import { ChevronDown, ArrowRight } from "lucide-react";
import { ReactTyped } from "react-typed";
import { useLanguage } from "@/contexts/LanguageContext";

export const NewHero = () => {
  const { t } = useLanguage();
  
  const services = [
    t("hero.service1"),
    t("hero.service2"),
    t("hero.service3"),
    t("hero.service4"),
  ];

  const handleBookNow = () => {
    document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLearnMore = () => {
    document.getElementById("quienes-somos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      {/* Decorative circles */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/3 blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-accent/3 blur-3xl" />

      {/* Main Content */}
      <div className="container relative z-10 text-center px-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-10"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">
              {t("hero.badge")}
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight leading-[1.05] mb-8"
          >
            <span className="text-foreground">{t("hero.title1")}</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-primary to-teal-400 bg-clip-text text-transparent">
              {t("hero.title2")}
            </span>
          </motion.h1>

          {/* Typewriter Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-12 h-8"
          >
            {t("hero.specialistsIn")}{" "}
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
            {/* Primary Button */}
            <motion.button
              onClick={handleBookNow}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group relative px-8 py-4 text-base font-semibold text-primary-foreground bg-primary rounded-full shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                {t("hero.cta")}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>

            {/* Secondary Button */}
            <motion.button
              onClick={handleLearnMore}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 text-base font-semibold text-primary bg-transparent border-2 border-primary rounded-full hover:bg-primary/5 transition-all duration-300"
            >
              {t("hero.secondary")}
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 mt-24 max-w-4xl mx-auto"
        >
          {[
            { number: "15", suffix: "+", label: t("hero.years") },
            { number: "4", suffix: "", label: t("hero.branches") },
            { number: "9", suffix: "", label: t("hero.specialties") },
            { number: "10K", suffix: "+", label: t("hero.patients") },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-2">
                {stat.number}
                <span className="text-primary">{stat.suffix}</span>
              </div>
              <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-widest font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center text-muted-foreground cursor-pointer"
          onClick={() => document.getElementById("quienes-somos")?.scrollIntoView({ behavior: "smooth" })}
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default NewHero;
