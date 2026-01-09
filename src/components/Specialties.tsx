import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { 
  Stethoscope, 
  Sparkles, 
  Baby, 
  Scissors, 
  Smile, 
  Crown,
  Syringe,
  HeartPulse,
  Star
} from "lucide-react";

const specialties = [
  {
    icon: Stethoscope,
    title: "Odontología General",
    description: "Servicios dentales integrales para toda la familia.",
  },
  {
    icon: HeartPulse,
    title: "Endodoncia",
    description: "Tratamientos de conducto con tecnología avanzada.",
  },
  {
    icon: Syringe,
    title: "Implantología y Periodoncia",
    description: "Implantes dentales y cuidado de encías.",
  },
  {
    icon: Sparkles,
    title: "Estética y Rehabilitación Maxilofacial",
    description: "Restauración completa de la función y estética facial.",
  },
  {
    icon: Crown,
    title: "Ortodoncia",
    description: "Alineación dental con brackets y alineadores invisibles.",
  },
  {
    icon: Baby,
    title: "Odontología Pediátrica",
    description: "Atención especializada para los más pequeños.",
  },
  {
    icon: Star,
    title: "Prótesis y Rehabilitación Oral",
    description: "Restauración de piezas dentales perdidas.",
  },
  {
    icon: Scissors,
    title: "Cirugía Oral",
    description: "Procedimientos quirúrgicos con mínima invasión.",
  },
  {
    icon: Smile,
    title: "Estética Dental",
    description: "Blanqueamiento, carillas y diseño de sonrisa.",
  },
];

export const Specialties = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="especialidades" className="section-padding" ref={ref}>
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Áreas y Especialidades
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
            Expertos en cada{" "}
            <span className="gradient-text">especialidad</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            En el desarrollo de tu tratamiento intervienen especialistas de diferentes áreas, 
            así aseguramos un diagnóstico más completo y preciso.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialties.map((specialty, index) => (
            <motion.div
              key={specialty.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group relative p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <specialty.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-semibold text-foreground mb-3">
                  {specialty.title}
                </h3>
                <p className="text-muted-foreground">
                  {specialty.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
