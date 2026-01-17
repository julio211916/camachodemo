import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Droplet, Leaf, FlaskConical, Heart, Sparkles, Wine } from "lucide-react";

const categories = [
  {
    id: "aceites",
    name: "Aceites",
    description: "Aceites naturales y medicinales",
    icon: Droplet,
    color: "from-amber-500 to-orange-600",
    count: 45,
  },
  {
    id: "lociones",
    name: "Lociones",
    description: "Lociones aromáticas y curativas",
    icon: Sparkles,
    color: "from-emerald-500 to-teal-600",
    count: 32,
  },
  {
    id: "pomadas",
    name: "Pomadas",
    description: "Pomadas tradicionales",
    icon: Heart,
    color: "from-rose-500 to-pink-600",
    count: 28,
  },
  {
    id: "jarabes",
    name: "Jarabes",
    description: "Jarabes naturales",
    icon: FlaskConical,
    color: "from-purple-500 to-indigo-600",
    count: 15,
  },
  {
    id: "botanicos",
    name: "Botánicos",
    description: "Productos botánicos",
    icon: Leaf,
    color: "from-green-500 to-emerald-600",
    count: 20,
  },
  {
    id: "vinos",
    name: "Vinos",
    description: "Vinos medicinales",
    icon: Wine,
    color: "from-red-500 to-rose-600",
    count: 12,
  },
];

export function CategorySection() {
  const navigate = useNavigate();

  return (
    <section id="categorias" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-medium uppercase tracking-widest text-sm">
            Explora Nuestras
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mt-2 mb-4">
            Categorías de Productos
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Descubre nuestra amplia variedad de productos naturales y tradicionales
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => navigate(`/productos?category=${category.id}`)}
              className="group cursor-pointer"
            >
              <div className="relative bg-card rounded-2xl p-6 shadow-lg border border-border hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <category.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {category.description}
                </p>
                <span className="text-xs font-medium text-primary">
                  {category.count} productos
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CategorySection;
