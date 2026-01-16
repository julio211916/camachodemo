import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const brands = [
  {
    name: "Exocad",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Exocad_logo.svg/1200px-Exocad_logo.svg.png",
  },
  {
    name: "3Shape",
    logo: "https://www.3shape.com/hubfs/3SHAPE_october_2018/images/3shape-logo.svg",
  },
  {
    name: "Straumann",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Straumann_logo.svg/1200px-Straumann_logo.svg.png",
  },
  {
    name: "Planmeca",
    logo: "https://www.planmeca.com/globalassets/planmeca-logo-black.svg",
  },
  {
    name: "Dental Wings",
    logo: "https://www.dentalwings.com/wp-content/uploads/2020/01/dental-wings-logo.svg",
  },
  {
    name: "Dentsply Sirona",
    logo: "https://www.sirona.com/fileadmin/templates/img/logos/dentsply-sirona-logo.svg",
  },
];

export const BrandsSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16 bg-background border-y border-border/30">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
            {t('brands.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('brands.subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-wrap justify-center items-center gap-8 md:gap-12"
        >
          {brands.map((brand, index) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              className="flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="h-8 md:h-10 w-auto object-contain max-w-[120px] md:max-w-[150px] dark:invert"
                onError={(e) => {
                  // Fallback to text if image fails
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<span class="text-lg font-semibold text-muted-foreground">${brand.name}</span>`;
                  }
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
