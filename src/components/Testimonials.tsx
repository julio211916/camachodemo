import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const testimonials = [
  {
    name: "María García",
    year: "2020",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
    content: {
      es: "Excelente atención y resultados increíbles. Mi sonrisa nunca había lucido tan bien. El equipo es muy profesional y las instalaciones son de primera.",
      en: "Excellent care and incredible results. My smile has never looked so good. The team is very professional and the facilities are top-notch.",
      pt: "Atendimento excelente e resultados incríveis. Meu sorriso nunca ficou tão bonito. A equipe é muito profissional e as instalações são de primeira.",
      ru: "Отличный уход и невероятные результаты. Моя улыбка никогда не выглядела так хорошо. Команда очень профессиональная, а условия первоклассные.",
    },
    rating: 5,
  },
  {
    name: "Carlos Mendoza",
    year: "2019",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    content: {
      es: "Después de años buscando una clínica de confianza, encontré NovellDent. Los tratamientos de ortodoncia fueron exactamente lo que necesitaba.",
      en: "After years of searching for a trusted clinic, I found NovellDent. The orthodontic treatments were exactly what I needed.",
      pt: "Depois de anos procurando uma clínica de confiança, encontrei a NovellDent. Os tratamentos de ortodontia foram exatamente o que eu precisava.",
      ru: "После многих лет поиска надёжной клиники я нашёл NovellDent. Ортодонтическое лечение было именно тем, что мне нужно.",
    },
    rating: 5,
  },
  {
    name: "Ana Rodríguez",
    year: "2021",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80",
    content: {
      es: "El tratamiento de blanqueamiento superó mis expectativas. El personal es muy amable y siempre te hacen sentir cómoda. ¡Totalmente recomendados!",
      en: "The whitening treatment exceeded my expectations. The staff is very friendly and always makes you feel comfortable. Totally recommended!",
      pt: "O tratamento de clareamento superou minhas expectativas. A equipe é muito simpática e sempre te fazem sentir confortável. Totalmente recomendado!",
      ru: "Отбеливание превзошло мои ожидания. Персонал очень дружелюбный и всегда создаёт комфортную атмосферу. Полностью рекомендую!",
    },
    rating: 5,
  },
];

export const Testimonials = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t, language } = useLanguage();

  return (
    <section className="section-padding" ref={ref}>
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
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

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative p-8 rounded-3xl bg-card border border-border/50 hover:shadow-xl transition-all duration-300"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/10" />
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('testimonials.patientSince')} {testimonial.year}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed">
                "{testimonial.content[language] || testimonial.content.es}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
