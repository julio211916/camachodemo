"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import logo from "@/assets/logo-novelldent.png";

export function NewHeader() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: t("nav.home"), link: "#inicio" },
    { name: t("nav.about"), link: "#quienes-somos" },
    { name: t("nav.specialties"), link: "#especialidades" },
    { name: t("nav.services"), link: "#servicios" },
    { name: t("nav.appointments"), link: "#reservar" },
    { name: t("nav.locations"), link: "#sucursales" },
    { name: "Blog", link: "/blog", isRoute: true },
    { name: t("nav.contact"), link: "#contacto" },
  ];

  const handleNavItemClick = (item: { name: string; link: string; isRoute?: boolean }) => {
    if (item.isRoute) {
      navigate(item.link);
    }
    setIsMobileMenuOpen(false);
  };

  const handlePortalClick = () => {
    navigate("/portal");
    setIsMobileMenuOpen(false);
  };

  const handleBookNow = () => {
    document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  return (
    <Navbar>
      {/* Desktop Navigation */}
      <NavBody>
        <NavbarLogo src={logo} alt="NovellDent" />
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

      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo src={logo} alt="NovellDent" />
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
