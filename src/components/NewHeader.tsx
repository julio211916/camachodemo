"use client";

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import logo from "@/assets/logo-camacho.jpg";

export function NewHeader() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isHomePage = location.pathname === "/";

  const navItems = [
    { name: t("nav.home"), link: isHomePage ? "#inicio" : "/", isRoute: !isHomePage },
    { name: t("nav.about"), link: isHomePage ? "#quienes-somos" : "/#quienes-somos", isRoute: !isHomePage },
    { name: t("nav.specialties"), link: isHomePage ? "#especialidades" : "/#especialidades", isRoute: !isHomePage },
    { name: t("nav.services"), link: isHomePage ? "#servicios" : "/#servicios", isRoute: !isHomePage },
    { name: t("nav.appointments"), link: isHomePage ? "#reservar" : "/#reservar", isRoute: !isHomePage },
    { name: t("nav.locations"), link: isHomePage ? "#sucursales" : "/#sucursales", isRoute: !isHomePage },
    { name: "Blog", link: "/blog", isRoute: true },
    { name: t("nav.contact"), link: isHomePage ? "#contacto" : "/#contacto", isRoute: !isHomePage },
  ];

  const handleNavItemClick = (item: { name: string; link: string; isRoute?: boolean }) => {
    if (item.isRoute) {
      navigate(item.link);
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    if (!isHomePage) {
      navigate("/");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePortalClick = () => {
    navigate("/portal");
    setIsMobileMenuOpen(false);
  };

  const handleBookNow = () => {
    if (isHomePage) {
      document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/#reservar");
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <Navbar>
      <NavBody>
        <NavbarLogo src={logo} alt="Productos Camacho" onClick={handleLogoClick} />
        <NavItems 
          items={navItems} 
          onItemClick={handleNavItemClick}
        />
        <div className="flex items-center gap-3 z-50">
          <LanguageSelector />
          <ThemeToggle />
          <NavbarButton
            onClick={handlePortalClick}
            variant="secondary"
            className="border-none"
          >
            {user ? t("nav.portal") : t("nav.login")}
          </NavbarButton>
        </div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo src={logo} alt="Productos Camacho" onClick={handleLogoClick} />
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </div>
        </MobileNavHeader>

        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {navItems.map((item, idx) => (
            <a
              key={`mobile-link-${idx}`}
              href={item.isRoute ? undefined : item.link}
              onClick={(e) => {
                if (item.isRoute) e.preventDefault();
                handleNavItemClick(item);
              }}
              className="relative w-full py-3 px-4 rounded-xl text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
            >
              {item.name}
            </a>
          ))}
          <div className="flex flex-col gap-2 w-full pt-4 border-t border-border">
            <NavbarButton
              onClick={handlePortalClick}
              variant="secondary"
              className="w-full"
            >
              {user ? t("nav.portal") : t("nav.login")}
            </NavbarButton>
            <NavbarButton
              onClick={handleBookNow}
              variant="primary"
              className="w-full"
            >
              {t("nav.bookNow")}
              <ArrowRight className="w-4 h-4" />
            </NavbarButton>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}

export default NewHeader;
