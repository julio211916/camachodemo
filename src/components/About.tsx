import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, Cpu, Award, Users } from "lucide-react";
import heroDental from "@/assets/hero-dental.jpg";

const features = [
  {
    icon: Cpu,
    title: "Tecnología Digital",
    description: "Equipos de última generación para diagnósticos precisos y tratamientos efectivos.",
  },
  {
    icon: Shield,
    title: "Seguridad Total",
    description: "Protocolos rigurosos de higiene y bioseguridad para tu tranquilidad.",
  },
  {
    icon: Award,
    title: "Especialistas Certificados",
    description: "Equipo de profesionales con amplia experiencia y constante actualización.",
  },
  {
    icon: Users,
    title: "Atención Personalizada",
    description: "Tratamientos diseñados específicamente para cada paciente.",
  },
];

export const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="quienes-somos" className="section-padding bg-secondary/30" ref={ref}>
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={heroDental}
                alt="NovellDent Clínica Dental"
                className="w-full h-auto object-cover aspect-[4/3]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="absolute -bottom-6 -right-6 bg-card rounded-2xl p-6 shadow-xl"
            >
              <div className="text-4xl font-serif font-bold gradient-text">15+</div>
              <div className="text-sm text-muted-foreground">Años de experiencia</div>
            </motion.div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              ¿Quiénes Somos?
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6 leading-tight">
              Vanguardia en{" "}
              <span className="gradient-text">Odontología Digital</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              En <strong className="text-foreground">NovellDent</strong> estamos enfocados en los servicios de salud dental. 
              Nos caracterizamos por la vanguardia de la tecnología con avances tecnológicos para obtener 
              un diagnóstico eficaz y fiable, principalmente en el tratamiento con resultados óptimos.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="flex gap-4"
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
