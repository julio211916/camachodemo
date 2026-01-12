import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, Cpu, Award, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import heroDental from "@/assets/hero-dental.jpg";

export const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useLanguage();

  const features = [
    {
      icon: Cpu,
      title: t('about.feature1.title'),
      description: t('about.feature1.desc'),
    },
    {
      icon: Shield,
      title: t('about.feature2.title'),
      description: t('about.feature2.desc'),
    },
    {
      icon: Award,
      title: t('about.feature3.title'),
      description: t('about.feature3.desc'),
    },
    {
      icon: Users,
      title: t('about.feature4.title'),
      description: t('about.feature4.desc'),
    },
  ];

  return (
    <section id="quienes-somos" className="section-padding bg-background" ref={ref}>
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden">
              <img
                src={heroDental}
                alt="NovellDent Clínica Dental"
                className="w-full h-auto object-cover aspect-[4/3]"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="absolute -bottom-8 -right-8 bg-card rounded-2xl p-6 border border-border shadow-lg"
            >
              <div className="text-4xl font-serif font-bold gradient-text">15+</div>
              <div className="text-sm text-muted-foreground">{t('about.yearsExperience')}</div>
            </motion.div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <span className="text-primary text-sm font-medium uppercase tracking-wider mb-4 block">
              {t('about.badge')}
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6 leading-tight">
              {t('about.title1')}
              <br />
              <span className="gradient-text">{t('about.title2')}</span>
            </h2>
            <p 
              className="text-lg text-muted-foreground mb-10 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: t('about.description') }}
            />

            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="flex gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
