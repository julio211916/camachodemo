import { motion } from "framer-motion";
import { ArrowRight, Leaf, Star, CheckCircle, ShoppingCart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Import product images
import jarabeAjolotius from "@/assets/products/jarabe-ajolotius.png";
import jarabeBroncoplus from "@/assets/products/jarabe-broncoplus.png";
import pomadaTia from "@/assets/products/pomada-tia.png";
import aceiteVibora from "@/assets/products/aceite-vibora.png";

export const NewHero = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleShopNow = () => {
    navigate("/productos");
  };

  const handleLearnMore = () => {
    document.getElementById("quienes-somos")?.scrollIntoView({ behavior: "smooth" });
  };

  const featuredProducts = [
    { name: "Jarabe Broncoplus 240ml", brand: "BRONCOPLUS", price: 145, oldPrice: 165, image: jarabeBroncoplus },
    { name: "Jarabe Ajolotius 240ml", brand: "AJOLOTIUS", price: 185, oldPrice: 210, image: jarabeAjolotius },
    { name: "Pomada de la Tía Grande", brand: "PRODUCTOS CAMACHO", price: 95, image: pomadaTia },
    { name: "Aceite de Víbora 30ml", brand: "PRODUCTOS CAMACHO", price: 75, image: aceiteVibora },
  ];

  const categories = [
    { name: "Jarabes", count: 8, slug: "jarabes" },
    { name: "Pomadas", count: 6, slug: "pomadas" },
    { name: "Aceites", count: 25, slug: "aceites" },
    { name: "Lociones", count: 22, slug: "lociones" },
    { name: "Químicos", count: 55, slug: "quimicos" },
    { name: "Botánicos", count: 10, slug: "botanicos" },
  ];

  return (
    <section id="inicio" className="relative bg-[#1a1f1a] text-white overflow-hidden">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-28 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30"
            >
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="text-sm text-primary font-medium">Desde 1985 cuidando tu salud</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold leading-tight"
            >
              <span className="text-white">Tradición, Calidad y</span>
              <br />
              <span className="text-primary">Bienestar Natural</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-gray-300 max-w-lg"
            >
              Somos una empresa 100% mexicana con más de 40 años de experiencia en la fabricación de jarabes, pomadas, aceites y productos de rebotica tradicional.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <Button
                onClick={handleShopNow}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6 text-base font-semibold"
              >
                Comprar Ahora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={handleLearnMore}
                variant="outline"
                size="lg"
                className="border-2 border-white/30 text-white hover:bg-white/10 rounded-full px-8 py-6 text-base font-semibold"
              >
                Conocer Más
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-6 pt-4"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-primary/30 border-2 border-[#1a1f1a] flex items-center justify-center text-xs font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="text-white ml-2 font-medium">4.9</span>
                </div>
                <p className="text-sm text-gray-400">Clientes satisfechos</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Product Showcase */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Stats Badges */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute -top-4 right-0 bg-primary text-white px-4 py-2 rounded-xl z-10"
            >
              <span className="text-2xl font-bold">40+</span>
              <p className="text-xs">años de experiencia</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="absolute bottom-20 -left-4 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-xl z-10 flex items-center gap-2"
            >
              <Leaf className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">100% Natural</span>
            </motion.div>

            {/* Product Grid Preview */}
            <div className="grid grid-cols-2 gap-4 p-4">
              {featuredProducts.slice(0, 2).map((product, index) => (
                <motion.div
                  key={product.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
                >
                  <div className="aspect-square relative mb-3 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain p-2" />
                    {product.oldPrice && (
                      <span className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                        -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-primary font-medium">{product.brand}</p>
                  <h3 className="text-sm font-semibold text-white truncate">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold text-primary">${product.price}</span>
                    {product.oldPrice && (
                      <span className="text-sm text-gray-400 line-through">${product.oldPrice}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Value Props */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white/5 backdrop-blur-sm border-y border-white/10 py-8"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Leaf, title: "100% Natural", desc: "Ingredientes naturales de la más alta calidad" },
              { icon: CheckCircle, title: "Tradición Mexicana", desc: "Más de 40 años preservando fórmulas ancestrales" },
              { icon: Star, title: "Marca Registrada", desc: "Productos certificados y confiables" },
              { icon: ShoppingCart, title: "Envío Nacional", desc: "Entrega a todo México" },
            ].map((item, index) => (
              <div key={item.title} className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/20 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Brand Banner */}
      <div className="bg-primary/10 py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <p className="text-lg text-gray-300 leading-relaxed">
              Contamos con marcas registradas y reconocidas como{" "}
              <span className="text-primary font-semibold">AJOLOTIUS®</span> y{" "}
              <span className="text-primary font-semibold">BRONCOPLUS®</span>,
              formuladas con ingredientes naturales y eficacia comprobada. Nuestros jarabes y productos son aliados de farmacias independientes, distribuidores mayoristas y negocios naturistas que buscan calidad y confianza.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="py-16 bg-[#1a1f1a]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <span className="text-primary text-sm font-medium uppercase tracking-wider">Explora</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mt-2">
              Nuestras Categorías
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <motion.button
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate(`/productos?categoria=${category.slug}`)}
                className="bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/30 rounded-2xl p-6 transition-all duration-300"
              >
                <h3 className="font-semibold text-white">{category.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{category.count} productos</p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="py-16 bg-[#151915]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-10"
          >
            <div>
              <span className="text-primary text-sm font-medium uppercase tracking-wider">Los más vendidos</span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mt-2">
                Productos Destacados
              </h2>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/productos")}
              className="hidden md:flex border-primary text-primary hover:bg-primary hover:text-white rounded-full"
            >
              Ver Todos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-primary/30 transition-all duration-300"
              >
                <div className="aspect-square relative mb-4 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden">
                  <img src={product.image} alt={product.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" />
                  {product.oldPrice && (
                    <span className="absolute top-3 left-3 bg-primary text-white text-xs px-2 py-1 rounded-full">
                      Destacado
                    </span>
                  )}
                  <button className="absolute top-3 right-3 w-8 h-8 bg-white/10 hover:bg-primary rounded-full flex items-center justify-center transition-colors">
                    <ShoppingCart className="w-4 h-4 text-white" />
                  </button>
                </div>
                <p className="text-xs text-primary font-medium uppercase">{product.brand}</p>
                <h3 className="font-semibold text-white mt-1">{product.name}</h3>
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="text-xs text-gray-400 ml-1">(24)</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white">${product.price}.00</span>
                    {product.oldPrice && (
                      <span className="text-sm text-gray-400 line-through">${product.oldPrice}</span>
                    )}
                  </div>
                  <button className="w-10 h-10 bg-primary hover:bg-primary/80 rounded-full flex items-center justify-center transition-colors">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8 md:hidden">
            <Button
              variant="outline"
              onClick={() => navigate("/productos")}
              className="border-primary text-primary hover:bg-primary hover:text-white rounded-full"
            >
              Ver Todos los Productos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Distributor CTA */}
      <div className="py-20 bg-gradient-to-r from-primary/20 to-primary/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
              ¿Eres distribuidor o tienes un negocio?
            </h2>
            <p className="text-gray-300 mb-8">
              Únete a nuestra red de distribuidores y ofrece productos de calidad a tus clientes. Contamos con precios especiales para mayoristas.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => navigate("/distribuidores")}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white rounded-full px-8"
              >
                Quiero ser Distribuidor
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/contacto")}
                className="border-white/30 text-white hover:bg-white/10 rounded-full px-8"
              >
                Contactar Ventas
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default NewHero;
