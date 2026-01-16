import { NewHeader } from "@/components/NewHeader";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Leaf, Award, Clock, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Marcas = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Leaf, title: "100% Natural", desc: "Ingredientes de origen natural" },
    { icon: Award, title: "Marca Registrada", desc: "Productos certificados" },
    { icon: Clock, title: "40+ Años", desc: "Experiencia y confianza" },
  ];

  const brands = [
    {
      name: "AJOLOTIUS®",
      tagline: "Tradición y salud en cada gota",
      description: "Nuestra marca insignia de jarabes naturales, formulados con ingredientes de la medicina tradicional mexicana. Especialmente reconocido por su efectividad en el cuidado del sistema respiratorio.",
      products: ["Jarabe Ajolotius 240ml", "Jarabe Ajolotius 120ml", "Gotas Ajolotius"],
      color: "from-emerald-500/20 to-teal-500/20",
    },
    {
      name: "BRONCOPLUS®",
      tagline: "Alivio natural para vías respiratorias",
      description: "Línea especializada en el cuidado del sistema respiratorio. Productos formulados con extractos naturales que ayudan a mantener las vías respiratorias saludables.",
      products: ["Jarabe Broncoplus 240ml", "Jarabe Broncoplus 120ml", "Inhalador Broncoplus"],
      color: "from-amber-500/20 to-orange-500/20",
      reverse: true,
    },
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
            Nuestras Marcas
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mt-4 mb-6"
          >
            Calidad que{" "}
            <span className="text-primary">respalda tu salud</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg"
          >
            Conoce nuestras marcas registradas, reconocidas en todo México por su calidad y efectividad en productos naturales.
          </motion.p>
        </div>
      </section>

      {/* Features Bar */}
      <section className="py-8 bg-primary/10 border-y border-primary/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 justify-center"
              >
                <feature.icon className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
                  <p className="text-xs text-gray-400">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 space-y-24">
          {brands.map((brand, index) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`grid md:grid-cols-2 gap-12 items-center ${brand.reverse ? 'md:flex-row-reverse' : ''}`}
            >
              <div className={brand.reverse ? 'md:order-2' : ''}>
                <div className={`aspect-square rounded-3xl bg-gradient-to-br ${brand.color} flex items-center justify-center p-12`}>
                  <div className="text-center">
                    <h2 className="text-5xl font-serif font-bold text-white">{brand.name}</h2>
                  </div>
                </div>
              </div>
              
              <div className={brand.reverse ? 'md:order-1' : ''}>
                <h2 className="text-4xl font-serif font-bold mb-2">{brand.name}</h2>
                <p className="text-primary font-medium text-lg mb-6">{brand.tagline}</p>
                <p className="text-gray-400 leading-relaxed mb-6">{brand.description}</p>
                
                <div className="mb-8">
                  <h4 className="font-semibold mb-3">Productos de la línea:</h4>
                  <ul className="space-y-2">
                    {brand.products.map((product) => (
                      <li key={product} className="flex items-center gap-2 text-gray-400">
                        <Check className="w-4 h-4 text-primary" />
                        {product}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => navigate("/productos")}
                  className="bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-full"
                >
                  Ver Productos
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/20 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              ¿Quieres distribuir nuestras marcas?
            </h2>
            <p className="text-gray-400 mb-8">
              Únete a nuestra red de distribuidores y ofrece productos de calidad probada a tus clientes.
            </p>
            <Button
              onClick={() => navigate("/distribuidores")}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-8"
            >
              Quiero ser Distribuidor
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Marcas;
