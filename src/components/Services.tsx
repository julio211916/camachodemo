import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Check } from "lucide-react";

const services = [
  {
    title: "Blanqueamiento Dental",
    description: "Recupera el blanco natural de tus dientes con nuestros tratamientos de blanqueamiento profesional.",
    features: ["Resultados inmediatos", "Tecnología LED", "Sin sensibilidad"],
    image: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&q=80",
  },
  {
    title: "Implantes Dentales",
    description: "Reemplaza piezas dentales perdidas con implantes de titanio de alta calidad.",
    features: ["Biocompatibles", "Duraderos", "Estética natural"],
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&q=80",
  },
  {
    title: "Ortodoncia Invisible",
    description: "Alineadores transparentes personalizados para corregir tu sonrisa discretamente.",
    features: ["Removibles", "Casi invisibles", "Cómodos"],
    image: "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=600&q=80",
  },
  {
    title: "Diseño de Sonrisa",
    description: "Transformación completa de tu sonrisa con carillas y técnicas de estética dental.",
    features: ["Personalizado", "Resultados naturales", "Mínima invasión"],
    image: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=600&q=80",
  },
];

export const Services = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="servicios" className="section-padding bg-secondary/30" ref={ref}>
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Nuestros Servicios
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
            Resultados que{" "}
            <span className="gradient-text">transforman vidas</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Nuestros tratamientos ofrecen al paciente resultados funcionales a largo plazo, 
            la planificación y coordinación con la que trabajamos nos hacen alcanzar los resultados previstos.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group relative overflow-hidden rounded-3xl bg-card border border-border/50"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h3 className="text-2xl font-serif font-bold text-foreground mb-3">
                  {service.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {service.description}
                </p>
                <div className="flex flex-wrap gap-3 mb-4">
                  {service.features.map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center gap-1 text-sm text-primary"
                    >
                      <Check className="w-4 h-4" />
                      {feature}
                    </span>
                  ))}
                </div>
                <motion.a
                  href="#cita"
                  whileHover={{ x: 5 }}
                  className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                >
                  Saber más
                  <ArrowRight className="w-4 h-4" />
                </motion.a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
