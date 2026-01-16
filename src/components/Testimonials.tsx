import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TestimonialSlider, Review } from "@/components/ui/testimonial-slider";

const testimonials: Review[] = [
  {
    id: 1,
    name: "Roberto Hernández",
    affiliation: "Farmacia San José - Toluca",
    quote: "Llevamos más de 15 años distribuyendo productos Camacho. La calidad es inigualable y nuestros clientes confían plenamente en AJOLOTIUS® para problemas respiratorios.",
    imageSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    thumbnailSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
  },
  {
    id: 2,
    name: "María Elena Vázquez",
    affiliation: "Farmacia Natural - Querétaro",
    quote: "Las pomadas medicinales tienen una demanda constante. La Pomada de la Tía es la más solicitada por su efectividad. Excelente relación precio-calidad.",
    imageSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80",
    thumbnailSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
  },
  {
    id: 3,
    name: "Carlos Mendoza",
    affiliation: "Distribuidora Salud Natural - CDMX",
    quote: "Productos Camacho tiene el mejor servicio de distribución. Entregas puntuales, productos de primera calidad y precios competitivos para mayoristas.",
    imageSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80",
    thumbnailSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
  },
  {
    id: 4,
    name: "Ana Patricia Ramírez",
    affiliation: "Botica Tradicional - Morelia",
    quote: "La línea BRONCOPLUS® se ha convertido en imprescindible en nuestra farmacia. Los clientes repiten porque realmente funciona.",
    imageSrc: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&q=80",
    thumbnailSrc: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80",
  },
  {
    id: 5,
    name: "José Luis García",
    affiliation: "Red de Farmacias García - Guadalajara",
    quote: "40 años de tradición hablan por sí solos. Productos Camacho es sinónimo de calidad mexicana. Nuestras 12 sucursales confían en ellos.",
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
