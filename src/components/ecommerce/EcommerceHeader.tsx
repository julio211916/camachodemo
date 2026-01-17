"use client";

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Moon, Sun, ShoppingCart, User, Menu, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import logo from "@/assets/logo-camacho.jpg";

export function EcommerceHeader() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { itemCount, setIsOpen: setCartOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isHomePage = location.pathname === "/";

  const navItems = [
    { name: "Inicio", link: "/" },
    { name: "Productos", link: "/productos" },
    { name: "Categorías", link: "/productos?category=all" },
    { name: "Ofertas", link: "/productos?offers=true" },
    { name: "Contacto", link: isHomePage ? "#contacto" : "/#contacto" },
  ];

  const handleLogoClick = () => {
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavClick = (item: { link: string }) => {
    if (item.link.startsWith("#")) {
      document.querySelector(item.link)?.scrollIntoView({ behavior: "smooth" });
    } else if (item.link.startsWith("/#")) {
      if (!isHomePage) navigate("/");
      setTimeout(() => {
        document.querySelector(item.link.substring(1))?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      navigate(item.link);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[hsl(145,35%,22%)] text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center cursor-pointer"
            onClick={handleLogoClick}
          >
            <img
              src={logo}
              alt="Productos Camacho"
              className="h-10 md:h-14 w-auto rounded-lg"
            />
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <motion.button
                key={item.name}
                whileHover={{ y: -2 }}
                onClick={() => handleNavClick(item)}
                className="text-white/90 hover:text-white font-medium transition-colors relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300" />
              </motion.button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search - Desktop only */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="hidden md:flex p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <Search className="w-5 h-5" />
            </motion.button>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </motion.button>

            {/* Cart */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </motion.span>
              )}
            </motion.button>

            {/* User / Profile */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/portal")}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <User className="w-5 h-5" />
            </motion.button>

            {/* Mobile Menu Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[hsl(145,35%,18%)] border-t border-white/10"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navItems.map((item, idx) => (
                <motion.button
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => handleNavClick(item)}
                  className="text-left py-3 px-4 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {item.name}
                </motion.button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default EcommerceHeader;
