import { NewHeader } from "@/components/NewHeader";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Leaf, Heart, Award, Users, Target, Eye } from "lucide-react";

const Nosotros = () => {
  const values = [
    { icon: Leaf, title: "Natural", desc: "Ingredientes 100% naturales en cada producto" },
    { icon: Heart, title: "Salud", desc: "Comprometidos con el bienestar de nuestros clientes" },
    { icon: Award, title: "Calidad", desc: "Estándares de excelencia en cada fórmula" },
    { icon: Users, title: "Familia", desc: "Una empresa familiar con valores tradicionales" },
  ];

  const timeline = [
    { year: "1985", event: "Fundación de Productos Camacho en el Estado de México" },
    { year: "1995", event: "Lanzamiento de la marca AJOLOTIUS®" },
    { year: "2005", event: "Expansión a nivel nacional con red de distribuidores" },
    { year: "2015", event: "Lanzamiento de BRONCOPLUS® y modernización de plantas" },
    { year: "2024", event: "Digitalización completa y tienda en línea" },
  ];

  return (
    <div className="min-h-screen bg-[#1a1f1a] text-white">
      <NewHeader />
      
      {/* Hero Section */}
      <section className="pt-28 pb-16 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="container mx-auto px-4 text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-primary text-sm font-medium uppercase tracking-wider"
          >
            Nuestra Historia
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mt-4 mb-6"
          >
            Más de 40 años cuidando la{" "}
            <span className="text-primary">salud de México</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg"
          >
            Somos una empresa 100% mexicana dedicada a la fabricación de productos naturales basados en fórmulas tradicionales de la botica clásica.
          </motion.p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-serif font-bold text-center mb-12"
          >
            Nuestros Valores
          </motion.h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-2xl p-6 text-center border border-white/10"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary/20 flex items-center justify-center">
                  <value.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-white mb-2">{value.title}</h3>
                <p className="text-sm text-gray-400">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white/5">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[#1a1f1a] rounded-2xl p-8 border border-white/10"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4">Nuestra Misión</h3>
              <p className="text-gray-400 leading-relaxed">
                Ofrecer productos naturales de alta calidad que contribuyan al bienestar y salud de las familias mexicanas, preservando las fórmulas tradicionales de la medicina herbolaria y combinándolas con los más altos estándares de calidad y seguridad.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[#1a1f1a] rounded-2xl p-8 border border-white/10"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4">Nuestra Visión</h3>
              <p className="text-gray-400 leading-relaxed">
                Ser la empresa líder en productos naturales tradicionales en México y Latinoamérica, reconocida por la excelencia de nuestros productos, el compromiso con nuestros clientes y distribuidores, y nuestra contribución al cuidado de la salud con métodos naturales.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-serif font-bold text-center mb-12"
          >
            Nuestra Trayectoria
          </motion.h2>

          <div className="max-w-2xl mx-auto">
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-6 mb-8 last:mb-0"
              >
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-primary" />
                  {index < timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-primary/30 mt-2" />
                  )}
                </div>
                <div className="pb-8">
                  <span className="text-2xl font-serif font-bold text-primary">{item.year}</span>
                  <p className="text-gray-400 mt-1">{item.event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Nosotros;
