import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import jarabeAjolotius from "@/assets/products/jarabe-ajolotius.png";
import jarabeBroncoplus from "@/assets/products/jarabe-broncoplus.png";

export const TechnologySection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16 md:py-24 bg-primary/5 overflow-hidden">
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
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Contamos con marcas registradas y reconocidas como <strong className="text-primary">AJOLOTIUS®</strong> y <strong className="text-primary">BRONCOPLUS®</strong>, formuladas con ingredientes naturales y eficacia comprobada. Nuestros jarabes y productos son aliados de farmacias independientes, distribuidores mayoristas y negocios naturistas que buscan calidad y confianza.
          </p>
        </motion.div>

        {/* Featured Products */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-wrap justify-center items-center gap-8 md:gap-16 mb-16"
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="flex flex-col items-center"
          >
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center p-4">
              <img src={jarabeAjolotius} alt="AJOLOTIUS®" className="w-full h-full object-contain" />
            </div>
            <span className="mt-3 font-serif font-bold text-foreground">AJOLOTIUS®</span>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="flex flex-col items-center"
          >
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-green-500/20 to-teal-500/20 flex items-center justify-center p-4">
              <img src={jarabeBroncoplus} alt="BRONCOPLUS®" className="w-full h-full object-contain" />
            </div>
            <span className="mt-3 font-serif font-bold text-foreground">BRONCOPLUS®</span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-8"
        >
          {[
            {
              title: t('technology.precision'),
              description: t('technology.precisionDesc'),
              icon: "🍯",
            },
            {
              title: t('technology.speed'),
              description: t('technology.speedDesc'),
              icon: "🌿",
            },
            {
              title: t('technology.quality'),
              description: t('technology.qualityDesc'),
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
