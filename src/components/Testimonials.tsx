import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TestimonialSlider, Review } from "@/components/ui/testimonial-slider";

const testimonials: Review[] = [
  {
    id: 1,
    name: "José Manuel Pérez",
    affiliation: "Farmacia San Rafael - Estado de México",
    quote: "Llevamos más de 15 años trabajando con Productos Camacho. El Jarabe AJOLOTIUS® es uno de los más solicitados por nuestros clientes. La calidad y el servicio siempre han sido excelentes.",
    imageSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    thumbnailSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
  },
  {
    id: 2,
    name: "María Elena González",
    affiliation: "Botica Natural - Ciudad de México",
    quote: "Las pomadas y aceites de Productos Camacho tienen muy buena rotación en mi negocio. Mis clientes confían en la tradición y calidad de estas fórmulas magistrales.",
    imageSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80",
    thumbnailSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
  },
  {
    id: 3,
    name: "Roberto Hernández",
    affiliation: "Distribuidora Salud Total - Querétaro",
    quote: "Como distribuidor mayorista, valoro mucho la constancia en la calidad. BRONCOPLUS® es un referente en el cuidado respiratorio y nuestros clientes siempre lo recomiendan.",
    imageSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80",
    thumbnailSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
  },
  {
    id: 4,
    name: "Ana Laura Ramírez",
    affiliation: "Farmacia del Centro - Morelos",
    quote: "La Pomada de la Tía Grande es un clásico que nunca falla. Productos Camacho mantiene la tradición que nuestros clientes buscan con la confiabilidad de una empresa seria.",
    imageSrc: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&q=80",
    thumbnailSrc: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80",
  },
  {
    id: 5,
    name: "Carlos Mendoza",
    affiliation: "Farmacia La Salud - Hidalgo",
    quote: "Productos Camacho nos ha apoyado durante años. Sus aceites naturales y jarabes son de los más vendidos. La atención y puntualidad en entregas es impecable.",
    imageSrc: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80",
    thumbnailSrc: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
  },
];

export const Testimonials = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useLanguage();

  return (
    <section className="section-padding" ref={ref} id="testimonios">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            {t('testimonials.badge')}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
            {t('testimonials.title')}{" "}
            <span className="gradient-text">{t('testimonials.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('testimonials.subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <TestimonialSlider reviews={testimonials} />
        </motion.div>
      </div>
    </section>
  );
};
