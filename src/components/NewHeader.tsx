"use client";

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, ShoppingCart, User, Menu, X, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-camacho.jpg";

export function NewHeader() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isHomePage = location.pathname === "/";

  const navItems = [
    { name: "Inicio", link: "/" },
    { name: "Productos", link: "/productos" },
    { name: "Marcas", link: "/marcas" },
    { name: "Nosotros", link: "/nosotros" },
    { name: "Contacto", link: "/contacto" },
  ];

  const handleNavClick = (link: string) => {
    navigate(link);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1f1a]/95 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <img src={logo} alt="Productos Camacho" className="h-10 w-10 rounded-full object-cover" />
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-white">Productos</span>
              <span className="text-lg font-bold text-primary ml-1">Camacho</span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.link)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  location.pathname === item.link
                    ? "bg-primary/20 text-primary"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>
            
            <ThemeToggle />
            
            <button className="relative w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                0
              </span>
            </button>
            
            <button
              onClick={() => navigate("/portal")}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/10">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.link)}
                  className={`px-4 py-3 rounded-xl text-left font-medium transition-colors ${
                    location.pathname === item.link
                      ? "bg-primary/20 text-primary"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default NewHeader;
