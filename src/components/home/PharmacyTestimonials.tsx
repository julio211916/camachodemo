import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "José Manuel Pérez",
    role: "Farmacia San Rafael",
    location: "Estado de México",
    quote: "Llevamos más de 15 años trabajando con Productos Camacho. El Jarabe AJOLOTIUS® es uno de los más solicitados por nuestros clientes. La calidad y el servicio siempre han sido excelentes.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
  },
  {
    id: 2,
    name: "María Elena González",
    role: "Botica Natural",
    location: "Ciudad de México",
    quote: "Las pomadas y aceites de Productos Camacho tienen muy buena rotación en mi negocio. Mis clientes confían en la tradición y calidad de estas fórmulas magistrales.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
  },
  {
    id: 3,
    name: "Roberto Hernández",
    role: "Distribuidora Salud Total",
    location: "Querétaro",
    quote: "Como distribuidor mayorista, valoro mucho la constancia en la calidad. BRONCOPLUS® es un referente en el cuidado respiratorio y nuestros clientes siempre lo recomiendan.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
  },
  {
    id: 4,
    name: "Ana Laura Ramírez",
    role: "Farmacia del Centro",
    location: "Morelos",
    quote: "La Pomada de la Tía Grande es un clásico que nunca falla. Productos Camacho mantiene la tradición que nuestros clientes buscan con la confiabilidad de una empresa seria.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80",
  },
];

export const PharmacyTestimonials = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 bg-[#151915]" ref={ref} id="testimonios">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="text-primary text-sm font-medium uppercase tracking-wider">
            Lo que dicen
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mt-2 mb-4">
            Nuestros <span className="text-primary">Clientes</span>
          </h2>
          <p className="text-lg text-gray-400">
            Farmacias, distribuidores y negocios naturistas confían en nosotros desde hace más de 40 años.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <Quote className="w-8 h-8 text-primary/50 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 italic mb-4 leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
                    />
                    <div>
                      <h4 className="font-semibold text-white">{testimonial.name}</h4>
                      <p className="text-sm text-primary">{testimonial.role}</p>
                      <p className="text-xs text-gray-500">{testimonial.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
