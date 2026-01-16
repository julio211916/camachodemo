import { motion } from "framer-motion";
import { LogoCloud } from "@/components/ui/logo-cloud";
import { useLanguage } from "@/contexts/LanguageContext";

// Import brand logos
import exocadLogo from "@/assets/brands/exocad.png";
import shapeLogo from "@/assets/brands/3shape.png";
import blueskyplanLogo from "@/assets/brands/blueskyplan.png";
import realguideLogo from "@/assets/brands/realguide.png";
import dentsplyLogo from "@/assets/brands/dentsply-sirona.png";
import dolphinLogo from "@/assets/brands/dolphin.png";
import tlanticadLogo from "@/assets/brands/tlanticad.png";
import dsdLogo from "@/assets/brands/dsd.png";
import planmecaLogo from "@/assets/brands/planmeca.png";

const dentalLogos = [
  { src: exocadLogo, alt: "Exocad" },
  { src: shapeLogo, alt: "3Shape" },
  { src: blueskyplanLogo, alt: "BlueSkyPlan" },
  { src: realguideLogo, alt: "RealGUIDE" },
  { src: dentsplyLogo, alt: "Dentsply Sirona" },
  { src: dolphinLogo, alt: "Dolphin" },
  { src: tlanticadLogo, alt: "TlantiCAD" },
  { src: dsdLogo, alt: "Digital Smile Design" },
  { src: planmecaLogo, alt: "Planmeca" },
];

export const TechnologySection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16 md:py-24 bg-muted/30 overflow-hidden">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-4">
            {t('brands.title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('brands.subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <LogoCloud logos={dentalLogos} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-8 mt-16"
        >
          {[
            {
              title: t('technology.precision') || "Precisión Digital",
              description: t('technology.precisionDesc') || "Escaneo 3D intraoral para restauraciones exactas",
              icon: "🎯",
            },
            {
              title: t('technology.speed') || "Rapidez",
              description: t('technology.speedDesc') || "Diseño y fabricación en el mismo día",
              icon: "⚡",
            },
            {
              title: t('technology.quality') || "Calidad Superior",
              description: t('technology.qualityDesc') || "Materiales de última generación certificados",
              icon: "✨",
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              className="text-center p-6 rounded-2xl bg-background border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-serif font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
