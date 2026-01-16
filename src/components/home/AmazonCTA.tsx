import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ShoppingBag, ArrowRight, Truck, Shield, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AmazonCTA = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const benefits = [
    { icon: Truck, text: "Envío seguro y rápido" },
    { icon: Shield, text: "Productos legales y confiables" },
    { icon: CreditCard, text: "Pago protegido" },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-[#1a1f1a] to-[#151915]" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/30 to-primary/10 p-8 md:p-12 lg:p-16 border border-primary/20"
        >
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 mb-8"
            >
              <ShoppingBag className="w-8 h-8 text-white" />
            </motion.div>

            <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-white mb-4">
              Recibe la calidad de la botica tradicional{" "}
              <span className="text-primary">en tu hogar</span>
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Haz tu pedido en línea a través de Amazon y recibe nuestros jarabes, pomadas y aceites con envío seguro y rápido. Productos naturales, legales y confiables directo a tu puerta.
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-10">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-2 text-white/90"
                >
                  <benefit.icon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{benefit.text}</span>
                </motion.div>
              ))}
            </div>

            <Button
              onClick={() => window.open("https://www.amazon.com.mx", "_blank")}
              size="lg"
              className="bg-[#FF9900] hover:bg-[#FF9900]/90 text-black font-semibold rounded-full px-10 py-6 text-base"
            >
              Compra ahora en Amazon
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
