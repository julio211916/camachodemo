import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TestimonialSlider, Review } from "@/components/ui/testimonial-slider";

const testimonials: Review[] = [
  {
    id: 1,
    name: "María García",
    affiliation: "Paciente desde 2020",
    quote: "Excelente atención y resultados increíbles. Mi sonrisa nunca había lucido tan bien. El equipo es muy profesional y las instalaciones son de primera.",
    imageSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80",
    thumbnailSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
  },
  {
    id: 2,
    name: "Carlos Mendoza",
    affiliation: "Paciente desde 2019",
    quote: "Después de años buscando una clínica de confianza, encontré NovellDent. Los tratamientos de ortodoncia fueron exactamente lo que necesitaba.",
    imageSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    thumbnailSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
  },
  {
    id: 3,
    name: "Ana Rodríguez",
    affiliation: "Paciente desde 2021",
    quote: "El tratamiento de blanqueamiento superó mis expectativas. El personal es muy amable y siempre te hacen sentir cómoda. ¡Totalmente recomendados!",
    imageSrc: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&q=80",
    thumbnailSrc: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80",
  },
  {
    id: 4,
    name: "Roberto Hernández",
    affiliation: "Paciente desde 2022",
    quote: "Los implantes que me colocaron lucen y se sienten como dientes naturales. El Dr. García es un experto y todo el proceso fue muy profesional.",
    imageSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80",
    thumbnailSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
  },
  {
    id: 5,
    name: "Laura Martínez",
    affiliation: "Paciente desde 2023",
    quote: "Mi hijo tenía mucho miedo al dentista, pero la Dra. Sofía lo hizo sentir tan cómodo que ahora le encanta venir. Excelente servicio pediátrico.",
    imageSrc: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
    thumbnailSrc: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
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
