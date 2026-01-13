import { motion } from "framer-motion";
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo-novelldent.png";

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Twitter, href: "#", label: "Twitter" },
];

export const Footer = () => {
  const { t } = useLanguage();

  const footerLinks = {
    servicios: [
      { label: t('footer.generalDentistry'), href: "#servicios" },
      { label: t('footer.whitening'), href: "#servicios" },
      { label: t('footer.implants'), href: "#servicios" },
      { label: t('footer.orthodontics'), href: "#servicios" },
      { label: t('footer.aesthetics'), href: "#servicios" },
    ],
    especialidades: [
      { label: t('footer.endodontics'), href: "#especialidades" },
      { label: t('footer.periodontics'), href: "#especialidades" },
      { label: t('footer.oralSurgery'), href: "#especialidades" },
      { label: t('footer.pediatric'), href: "#especialidades" },
      { label: t('footer.prosthetics'), href: "#especialidades" },
    ],
  };

  return (
    <footer className="bg-foreground dark:bg-card text-background dark:text-foreground">
      <div className="container-wide section-padding">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <img src={logo} alt="NovellDent" className="h-12 mb-6 brightness-0 invert dark:brightness-100 dark:invert-0" />
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

          {/* Links */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-4">{t('footer.services')}</h4>
            <ul className="space-y-3">
              {footerLinks.servicios.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-background/70 dark:text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-lg mb-4">{t('footer.specialties')}</h4>
            <ul className="space-y-3">
              {footerLinks.especialidades.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-background/70 dark:text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-lg mb-4">{t('footer.contact')}</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-background/70 dark:text-muted-foreground">
                <MapPin className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                <span>Jalisco, México</span>
              </li>
              <li>
                <a
                  href="tel:+523221837666"
                  className="flex items-center gap-3 text-background/70 dark:text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="w-5 h-5 text-primary" />
                  +52 322 183 7666
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@novelldent.com"
                  className="flex items-center gap-3 text-background/70 dark:text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-5 h-5 text-primary" />
                  info@novelldent.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 dark:border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-background/50 dark:text-muted-foreground">
          <p>© {new Date().getFullYear()} NovellDent. {t('footer.rights')}</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">{t('footer.privacy')}</a>
            <a href="#" className="hover:text-primary transition-colors">{t('footer.terms')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
