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
  { icon: Stethoscope, title: "Odontología General" },
  { icon: HeartPulse, title: "Endodoncia" },
  { icon: Syringe, title: "Implantología" },
  { icon: Sparkles, title: "Estética Maxilofacial" },
  { icon: Crown, title: "Ortodoncia" },
  { icon: Baby, title: "Odontología Pediátrica" },
  { icon: Star, title: "Prótesis Dental" },
  { icon: Scissors, title: "Cirugía Oral" },
  { icon: Smile, title: "Estética Dental" },
];

export const Specialties = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="especialidades" className="section-padding bg-background" ref={ref}>
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-primary text-sm font-medium uppercase tracking-wider mb-4 block">
            Especialidades
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
            Expertos en cada área
          </h2>
          <p className="text-lg text-muted-foreground">
            Un equipo multidisciplinario para un diagnóstico completo y preciso.
          </p>
        </motion.div>

        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
          {specialties.map((specialty, index) => (
            <motion.div
              key={specialty.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="group flex flex-col items-center p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-default"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <specialty.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xs md:text-sm font-medium text-center text-foreground leading-tight">
                {specialty.title}
              </h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
