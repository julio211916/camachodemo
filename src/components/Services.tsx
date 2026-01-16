import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import jarabeAjolotius from "@/assets/products/jarabe-ajolotius.png";
import pomadaAbeja from "@/assets/products/pomada-abeja.png";
import aceiteCoco from "@/assets/products/aceite-coco.png";
import glicerinaQp from "@/assets/products/glicerina-qp.png";

export const Services = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useLanguage();

  const services = [
    {
      title: t('services.whitening'),
      description: t('services.whitening.desc'),
      features: [t('services.whitening.f1'), t('services.whitening.f2')],
      image: jarabeAjolotius,
      bgColor: "from-amber-500/20 to-orange-500/20",
    },
    {
      title: t('services.implants'),
      description: t('services.implants.desc'),
      features: [t('services.implants.f1'), t('services.implants.f2')],
      image: pomadaAbeja,
      bgColor: "from-yellow-500/20 to-amber-500/20",
    },
    {
      title: t('services.orthodontics'),
      description: t('services.orthodontics.desc'),
      features: [t('services.orthodontics.f1'), t('services.orthodontics.f2')],
      image: aceiteCoco,
      bgColor: "from-blue-500/20 to-cyan-500/20",
    },
    {
      title: t('services.smileDesign'),
      description: t('services.smileDesign.desc'),
      features: [t('services.smileDesign.f1'), t('services.smileDesign.f2')],
      image: glicerinaQp,
      bgColor: "from-gray-500/20 to-slate-500/20",
    },
  ];

  return (
    <section id="servicios" className="section-padding bg-muted/30" ref={ref}>
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-primary text-sm font-medium uppercase tracking-wider mb-4 block">
            {t('services.badge')}
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
            {t('services.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('services.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-3xl bg-card border border-border/50 hover:border-primary/20 transition-all"
            >
              <div className={`aspect-[16/9] overflow-hidden bg-gradient-to-br ${service.bgColor} flex items-center justify-center p-8`}>
                <motion.img
                  src={service.image}
                  alt={service.title}
                  className="w-auto h-full max-h-48 object-contain group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-serif font-bold text-foreground mb-2">
                  {service.title}
                </h3>
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {service.description}
                </p>
                <div className="flex flex-wrap gap-4 mb-4">
                  {service.features.map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center gap-1.5 text-sm text-primary"
                    >
                      <Check className="w-4 h-4" />
                      {feature}
                    </span>
                  ))}
                </div>
                <motion.a
                  href="#contacto"
                  className="inline-flex items-center gap-2 text-primary font-medium group/link"
                >
                  {t('services.schedule')}
                  <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </motion.a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
