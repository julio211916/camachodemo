import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Award, CheckCircle, MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const reasons = [
  {
    icon: Award,
    title: "40 años de experiencia",
    description: "Más de cuatro décadas elaborando jarabes, pomadas y aceites a base de ingredientes naturales, con fórmulas estudiadas y mejoradas a lo largo del tiempo.",
  },
  {
    icon: CheckCircle,
    title: "Calidad y eficacia comprobada",
    description: "Nuestros clientes y aliados comerciales reconocen la efectividad de marcas registradas como AJOLOTIUS® y BRONCOPLUS®, referentes en el cuidado respiratorio.",
  },
  {
    icon: MapPin,
    title: "Presencia en 6 estados",
    description: "Actualmente tenemos operación y distribución en Estado de México, Ciudad de México, Morelos, Hidalgo, Querétaro y Puebla con un servicio ágil y cercano.",
  },
];

export const WhyChooseUs = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-[#151915]" ref={ref} id="por-que-elegirnos">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="text-primary text-sm font-medium uppercase tracking-wider">
            Nuestra Diferencia
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mt-2 mb-4">
            ¿Por qué <span className="text-primary">Productos Camacho?</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 group-hover:bg-primary/30 transition-colors">
                <reason.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{reason.title}</h3>
              <p className="text-gray-400 leading-relaxed">{reason.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <Button
            onClick={() => navigate("/contacto")}
            variant="outline"
            size="lg"
            className="border-primary text-primary hover:bg-primary hover:text-white rounded-full px-8"
          >
            Contáctanos
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
