import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, MapPin, LogIn, User } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSelector } from "./LanguageSelector";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo-novelldent.png";

interface NavItem {
  label: string;
  href: string;
  isRoute?: boolean;
}

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const navItems = [
    { label: t('nav.home'), href: "#inicio" },
    { label: t('nav.about'), href: "#quienes-somos" },
    { label: t('nav.specialties'), href: "#especialidades" },
    { label: t('nav.services'), href: "#servicios" },
    { label: t('nav.appointments'), href: "#reservar" },
    { label: t('nav.locations'), href: "#sucursales" },
    { label: "Blog", href: "/blog", isRoute: true },
    { label: t('nav.contact'), href: "#contacto" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePortalClick = () => {
    navigate('/portal');
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/95 backdrop-blur-md shadow-lg"
            : "bg-transparent"
        }`}
      >
        {/* Top bar - unified controls */}
        <div className={`border-b transition-all duration-300 ${isScrolled ? "border-border/50 py-2" : "border-white/10 py-3"}`}>
          <div className="container-wide flex items-center justify-end text-sm">
            <div className="flex items-center gap-2 sm:gap-4">
              <LanguageSelector />
              <ThemeToggle />
              {user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePortalClick}
                  className={`gap-2 ${isScrolled ? "text-foreground" : "text-white hover:text-white/80"}`}
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('nav.portal')}</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePortalClick}
                  className={`gap-2 ${isScrolled ? "text-foreground" : "text-white hover:text-white/80"}`}
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('nav.login')}</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main nav */}
        <div className={`transition-all duration-300 ${isScrolled ? "py-3" : "py-4"}`}>
          <div className="container-wide flex items-center justify-between">
            <motion.a
              href="#inicio"
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3"
            >
              <img
                src={logo}
                alt="NovellDent"
                className={`transition-all duration-300 ${isScrolled ? "h-10" : "h-14"}`}
              />
              <span className={`font-serif font-bold hidden sm:block transition-all duration-300 ${isScrolled ? "text-foreground text-xl" : "text-white text-2xl"}`}>
                NovellDent
              </span>
            </motion.a>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navItems.map((item: NavItem) => (
                item.isRoute ? (
                  <motion.div key={item.href} whileHover={{ y: -2 }}>
                    <Link
                      to={item.href}
                      className={`font-medium transition-colors relative group ${isScrolled ? "text-foreground/80 hover:text-primary" : "text-white/80 hover:text-white"}`}
                    >
                      {item.label}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                    </Link>
                  </motion.div>
                ) : (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    className={`font-medium transition-colors relative group ${isScrolled ? "text-foreground/80 hover:text-primary" : "text-white/80 hover:text-white"}`}
                    whileHover={{ y: -2 }}
                  >
                    {item.label}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                  </motion.a>
                )
              ))}
              <motion.a
                href="#reservar"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary text-sm"
              >
                {t('nav.bookNow')}
              </motion.a>
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-foreground"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-background/95 backdrop-blur-lg pt-32 px-6">
              <nav className="flex flex-col gap-6">
                {navItems.map((item: NavItem, index: number) => (
                  item.isRoute ? (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-2xl font-serif text-foreground hover:text-primary transition-colors"
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  ) : (
                    <motion.a
                      key={item.href}
                      href={item.href}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-2xl font-serif text-foreground hover:text-primary transition-colors"
                    >
                      {item.label}
                    </motion.a>
                  )
                ))}
                <motion.a
                  href="#reservar"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn-primary mt-4 text-center"
                >
                  {t('nav.bookNow')}
                </motion.a>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
