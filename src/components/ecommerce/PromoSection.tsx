import { motion } from "framer-motion";
import { Truck, Shield, Clock, Leaf } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Envío Gratis",
    description: "En compras mayores a $500 MXN",
  },
  {
    icon: Shield,
    title: "Pago Seguro",
    description: "Transacciones 100% protegidas",
  },
  {
    icon: Clock,
    title: "Soporte 24/7",
    description: "Atención personalizada",
  },
  {
    icon: Leaf,
    title: "100% Natural",
    description: "Productos tradicionales",
  },
];

export function PromoSection() {
  return (
    <section className="py-16 bg-gradient-to-r from-[hsl(145,35%,22%)] to-[hsl(150,40%,18%)] text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-14 h-14 mx-auto mb-4 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center"
              >
                <feature.icon className="w-7 h-7 text-emerald-300" />
              </motion.div>
              <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
              <p className="text-sm text-white/70">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PromoSection;
