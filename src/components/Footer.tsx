import { motion } from "framer-motion";
import { Facebook, Instagram, MapPin, Phone, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-camacho.jpg";

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com/productoscamacho", label: "Facebook" },
  { icon: Instagram, href: "https://instagram.com/productoscamacho", label: "Instagram" },
];

export const Footer = () => {
  const { t } = useLanguage();

  const footerLinks = {
    productos: [
      { label: t('footer.generalDentistry'), href: "/#servicios" },
      { label: t('footer.whitening'), href: "/#servicios" },
      { label: t('footer.implants'), href: "/#servicios" },
      { label: t('footer.orthodontics'), href: "/#servicios" },
      { label: t('footer.aesthetics'), href: "/#servicios" },
    ],
    categorias: [
      { label: t('footer.endodontics'), href: "/#especialidades" },
      { label: t('footer.periodontics'), href: "/#especialidades" },
      { label: t('footer.oralSurgery'), href: "/#especialidades" },
      { label: t('footer.pediatric'), href: "/#especialidades" },
      { label: t('footer.prosthetics'), href: "/#especialidades" },
    ],
    legal: [
      { label: "Aviso de Privacidad", href: "/privacidad" },
      { label: "Términos y Condiciones", href: "/terminos" },
    ],
  };

  return (
    <footer className="bg-foreground dark:bg-card text-background dark:text-foreground">
      <div className="container-wide section-padding">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img src={logo} alt="Productos Camacho" className="h-12 rounded-lg" />
              <span className="font-serif font-bold text-xl text-background dark:text-foreground">
                Productos Camacho
              </span>
            </Link>
            <p className="text-background/70 dark:text-muted-foreground mb-6 max-w-sm">
              {t('footer.description')}
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-10 h-10 rounded-full bg-background/10 dark:bg-secondary flex items-center justify-center hover:bg-primary transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links - Productos */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-4">{t('footer.services')}</h4>
            <ul className="space-y-3">
              {footerLinks.productos.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-background/70 dark:text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links - Categorías */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-4">{t('footer.specialties')}</h4>
            <ul className="space-y-3">
              {footerLinks.categorias.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-background/70 dark:text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-4">{t('footer.contact')}</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-background/70 dark:text-muted-foreground">
                <MapPin className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                <span>Estado de México, México</span>
              </li>
              <li>
                <a
                  href="tel:+525555555555"
                  className="flex items-center gap-3 text-background/70 dark:text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="w-5 h-5 text-primary" />
                  +52 55 5555 5555
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@productoscamacho.com.mx"
                  className="flex items-center gap-3 text-background/70 dark:text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-5 h-5 text-primary" />
                  info@productoscamacho.com.mx
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 dark:border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-background/50 dark:text-muted-foreground">
          <p>© {new Date().getFullYear()} Productos Camacho. {t('footer.rights')}</p>
          <div className="flex gap-6">
            <Link to="/privacidad" className="hover:text-primary transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link to="/terminos" className="hover:text-primary transition-colors">
              {t('footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
