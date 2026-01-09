import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Check } from "lucide-react";

const services = [
  {
    title: "Blanqueamiento",
    description: "Recupera el blanco natural de tus dientes con tecnología LED profesional.",
    features: ["Resultados inmediatos", "Sin sensibilidad"],
    image: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&q=80",
  },
  {
    title: "Implantes",
    description: "Reemplaza piezas dentales con implantes de titanio de alta calidad.",
    features: ["Biocompatibles", "Duraderos"],
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&q=80",
  },
  {
    title: "Ortodoncia",
    description: "Alineadores transparentes para corregir tu sonrisa discretamente.",
    features: ["Casi invisibles", "Removibles"],
    image: "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=600&q=80",
  },
  {
    title: "Diseño de Sonrisa",
    description: "Transformación completa con carillas y técnicas de estética dental.",
    features: ["Personalizado", "Resultados naturales"],
    image: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=600&q=80",
  },
];

export const Services = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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
            Servicios
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
            Resultados que transforman
          </h2>
          <p className="text-lg text-muted-foreground">
            Tratamientos con planificación precisa para alcanzar resultados óptimos.
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
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8">
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
                  href="#cita"
                  className="inline-flex items-center gap-2 text-primary font-medium group/link"
                >
                  Agendar
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
