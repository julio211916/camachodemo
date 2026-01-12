import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Stethoscope, 
  Sparkles, 
  Baby, 
  Scissors, 
  Smile, 
  Crown,
  Syringe,
  HeartPulse,
  Star
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const Specialties = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useLanguage();

  const specialties = [
    { icon: Stethoscope, titleKey: "specialties.general" },
    { icon: HeartPulse, titleKey: "specialties.endodontics" },
    { icon: Syringe, titleKey: "specialties.implantology" },
    { icon: Sparkles, titleKey: "specialties.maxillofacial" },
    { icon: Crown, titleKey: "specialties.orthodontics" },
    { icon: Baby, titleKey: "specialties.pediatric" },
    { icon: Star, titleKey: "specialties.prosthetics" },
    { icon: Scissors, titleKey: "specialties.surgery" },
    { icon: Smile, titleKey: "specialties.aesthetics" },
  ];

  return (
    <section id="especialidades" className="section-padding bg-background" ref={ref}>
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-primary text-sm font-medium uppercase tracking-wider mb-4 block">
            {t('specialties.badge')}
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
            {t('specialties.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('specialties.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
          {specialties.map((specialty, index) => (
            <motion.div
              key={specialty.titleKey}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="group flex flex-col items-center p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-default"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <specialty.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xs md:text-sm font-medium text-center text-foreground leading-tight">
                {t(specialty.titleKey)}
              </h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
