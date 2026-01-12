import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Calendar, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const CTA = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useLanguage();

  return (
    <section className="py-20" ref={ref}>
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-[2.5rem] p-12 md:p-16 lg:p-20"
          style={{ background: "var(--gradient-primary)" }}
        >
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 mb-8"
            >
              <Calendar className="w-8 h-8 text-white" />
            </motion.div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-6">
              {t('cta.title')}
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
              {t('cta.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="#reservar"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-primary bg-white rounded-full hover:bg-white/90 transition-colors"
              >
                {t('cta.button')}
                <ArrowRight className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="tel:+523221837666"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-white border-2 border-white/30 rounded-full hover:bg-white/10 transition-colors"
              >
                {t('cta.call')}
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
