import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

// Brand logos - using placeholders that represent pharmaceutical brands
const brands = [
  { name: "AJOLOTIUS", color: "#4CAF50" },
  { name: "BRONCOPLUS", color: "#2196F3" },
  { name: "Productos Camacho", color: "#FF9800" },
  { name: "La Tía Grande", color: "#9C27B0" },
  { name: "Natural Care", color: "#00BCD4" },
  { name: "Botica Tradicional", color: "#E91E63" },
];

export const BrandsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-16 bg-[#1a1f1a] border-t border-white/10" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="text-primary text-sm font-medium uppercase tracking-wider">
            Nuestro Portafolio
          </span>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mt-2">
            Marcas que distribuimos
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center items-center gap-8 md:gap-12"
        >
          {brands.map((brand, index) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.3, delay: 0.1 * index }}
              whileHover={{ scale: 1.1 }}
              className="flex items-center justify-center px-6 py-4 bg-white/5 rounded-xl border border-white/10 hover:border-primary/30 transition-all duration-300 cursor-pointer"
            >
              <span 
                className="text-lg font-bold"
                style={{ color: brand.color }}
              >
                {brand.name}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
