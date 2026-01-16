import { motion } from "framer-motion";
import { LogoCloud } from "@/components/ui/logo-cloud";
import { useLanguage } from "@/contexts/LanguageContext";

const dentalLogos = [
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Exocad_logo.svg/1200px-Exocad_logo.svg.png",
    alt: "Exocad",
  },
  {
    src: "https://www.3shape.com/hubfs/3SHAPE_october_2018/images/3shape-logo.svg",
    alt: "3Shape",
  },
  {
    src: "https://images.squarespace-cdn.com/content/v1/5e4e5b4c3a8e4c6f5f9c4f8a/1582136892456-ceramill-logo.png",
    alt: "Ceramill",
  },
  {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Straumann_logo.svg/1200px-Straumann_logo.svg.png",
    alt: "Straumann",
  },
  {
    src: "https://www.dentalwings.com/wp-content/uploads/2020/01/dental-wings-logo.svg",
    alt: "Dental Wings",
  },
  {
    src: "https://www.planmeca.com/globalassets/planmeca-logo-black.svg",
    alt: "Planmeca",
  },
  {
    src: "https://www.sirona.com/fileadmin/templates/img/logos/dentsply-sirona-logo.svg",
    alt: "Dentsply Sirona",
  },
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
