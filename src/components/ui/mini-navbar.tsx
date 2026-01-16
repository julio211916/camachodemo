"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import logo from '@/assets/logo-novelldent.png';

interface NavItem {
  label: string;
  href: string;
  isRoute?: boolean;
}

export function MiniNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [headerShapeClass, setHeaderShapeClass] = useState('rounded-full');
  const [isScrolled, setIsScrolled] = useState(false);
  const shapeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { label: t('nav.home'), href: '#inicio' },
    { label: t('nav.about'), href: '#quienes-somos' },
    { label: t('nav.specialties'), href: '#especialidades' },
    { label: t('nav.services'), href: '#servicios' },
    { label: t('nav.appointments'), href: '#reservar' },
    { label: t('nav.locations'), href: '#sucursales' },
    { label: 'Blog', href: '/blog', isRoute: true },
    { label: t('nav.contact'), href: '#contacto' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (shapeTimeoutRef.current) {
      clearTimeout(shapeTimeoutRef.current);
    }

    if (isOpen) {
      setHeaderShapeClass('rounded-2xl');
    } else {
      shapeTimeoutRef.current = setTimeout(() => {
        setHeaderShapeClass('rounded-full');
      }, 300);
    }

    return () => {
      if (shapeTimeoutRef.current) {
        clearTimeout(shapeTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const handlePortalClick = () => {
    navigate('/portal');
    setIsOpen(false);
  };

  const handleBookNow = () => {
    document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth' });
    setIsOpen(false);
  };

  const handleNavClick = (item: NavItem, e: React.MouseEvent) => {
    if (item.isRoute) {
      e.preventDefault();
      navigate(item.href);
    }
    setIsOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-4 left-0 right-0 z-50 px-4"
    >
      <div className="max-w-7xl mx-auto">
        {/* Main navbar container */}
        <div
          className={`
            relative transition-all duration-500 ease-in-out
            ${headerShapeClass}
            ${isScrolled 
              ? 'bg-background/95 backdrop-blur-xl shadow-xl border border-border/50' 
              : 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl border border-white/10 shadow-2xl'
            }
          `}
        >
          {/* Desktop layout */}
          <div className="flex items-center px-4 py-3 lg:px-6">
            {/* Left: Logo */}
            <motion.a 
              href="#inicio" 
              className="flex-shrink-0"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <img 
                src={logo} 
                alt="NovellDent" 
                className="h-8 w-auto"
              />
            </motion.a>

            {/* Center: Navigation Links */}
            <nav className="hidden lg:flex items-center justify-center flex-1 px-8">
              <div className="flex items-center gap-1">
                {navItems.map((item) => (
                  <motion.a
                    key={item.href}
                    href={item.isRoute ? undefined : item.href}
                    onClick={(e) => handleNavClick(item, e)}
                    className={`
                      px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 cursor-pointer
                      ${isScrolled 
                        ? 'text-foreground/70 hover:text-foreground hover:bg-muted' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {item.label}
                  </motion.a>
                ))}
              </div>
            </nav>

            {/* Right: Actions */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              {/* Language & Theme */}
              <LanguageSelector />
              <ThemeToggle />
              
              {/* Login Button - Text only, no icon */}
              <motion.button
                onClick={handlePortalClick}
                className={`
                  px-4 py-2 text-sm font-medium transition-all duration-300
                  ${isScrolled 
                    ? 'text-foreground hover:text-primary' 
                    : 'text-white/80 hover:text-white'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {user ? t('nav.portal') : t('nav.login')}
              </motion.button>

              {/* Book Now Button */}
              <motion.button
                onClick={handleBookNow}
                className="relative px-5 py-2.5 text-sm font-semibold text-white overflow-hidden rounded-full bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center gap-2">
                  {t('nav.bookNow')}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </motion.button>
            </div>

            {/* Mobile menu toggle */}
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className={`lg:hidden ml-auto p-2 rounded-full transition-all duration-300 ${
                isScrolled 
                  ? 'text-foreground hover:bg-muted' 
                  : 'text-white hover:bg-white/10'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.div>
            </motion.button>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="lg:hidden overflow-hidden border-t border-white/10"
              >
                <div className="px-4 py-4 space-y-1">
                  {navItems.map((item, index) => (
                    <motion.a
                      key={item.href}
                      href={item.isRoute ? undefined : item.href}
                      onClick={(e) => handleNavClick(item, e)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        block py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer
                        ${isScrolled 
                          ? 'text-foreground hover:bg-muted' 
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                        }
                      `}
                    >
                      {item.label}
                    </motion.a>
                  ))}
                  
                  {/* Mobile controls */}
                  <div className="flex items-center justify-center gap-3 pt-4 mt-4 border-t border-white/10">
                    <LanguageSelector />
                    <ThemeToggle />
                  </div>

                  <div className="flex flex-col gap-2 pt-4">
                    <motion.button
                      onClick={handlePortalClick}
                      className={`
                        w-full py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300
                        ${isScrolled 
                          ? 'bg-muted text-foreground' 
                          : 'bg-white/10 text-white'
                        }
                      `}
                      whileTap={{ scale: 0.98 }}
                    >
                      {user ? t('nav.portal') : t('nav.login')}
                    </motion.button>

                    <motion.button
                      onClick={handleBookNow}
                      className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                      whileTap={{ scale: 0.98 }}
                    >
                      {t('nav.bookNow')}
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}

export default MiniNavbar;
