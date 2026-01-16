"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, User } from 'lucide-react';
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

const AnimatedNavLink = ({ href, children, isRoute, onClick }: { 
  href: string; 
  children: React.ReactNode; 
  isRoute?: boolean;
  onClick?: () => void;
}) => {
  const navigate = useNavigate();
  
  const handleClick = (e: React.MouseEvent) => {
    if (isRoute) {
      e.preventDefault();
      navigate(href);
      onClick?.();
    } else {
      onClick?.();
    }
  };

  return (
    <motion.a
      href={isRoute ? undefined : href}
      onClick={handleClick}
      className="relative px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors cursor-pointer overflow-hidden group"
      whileHover={{ scale: 1.02 }}
    >
      <span className="relative z-10 block transition-transform duration-300 group-hover:-translate-y-full">
        {children}
      </span>
      <span className="absolute inset-0 flex items-center justify-center text-primary transition-transform duration-300 translate-y-full group-hover:translate-y-0">
        {children}
      </span>
    </motion.a>
  );
};

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
      setHeaderShapeClass('rounded-xl');
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

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="fixed top-4 left-0 right-0 z-50 mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Main navbar container */}
        <div
          className={`
            relative transition-all duration-500 ease-in-out
            ${headerShapeClass}
            ${isScrolled 
              ? 'bg-background/95 backdrop-blur-2xl shadow-2xl shadow-primary/5 border border-border/50' 
              : 'bg-gradient-to-r from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/20'
            }
          `}
        >
          {/* Desktop layout */}
          <div className="flex items-center justify-between px-5 py-3 lg:px-8">
            {/* Logo */}
            <motion.a 
              href="#inicio" 
              className="flex items-center gap-2 flex-shrink-0"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <img 
                src={logo} 
                alt="NovellDent" 
                className="h-9 w-auto drop-shadow-lg"
              />
            </motion.a>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navItems.map((item) => (
                <AnimatedNavLink 
                  key={item.href} 
                  href={item.href}
                  isRoute={item.isRoute}
                >
                  {item.label}
                </AnimatedNavLink>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-1 mr-1 p-1 rounded-full bg-white/5">
                <LanguageSelector />
                <ThemeToggle />
              </div>
              
              <motion.button
                onClick={handlePortalClick}
                className={`
                  px-4 py-2 text-sm font-medium rounded-full transition-all duration-300
                  ${isScrolled 
                    ? 'text-foreground hover:text-primary hover:bg-primary/5' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {user ? <User className="w-4 h-4 inline mr-1.5" /> : <LogIn className="w-4 h-4 inline mr-1.5" />}
                {user ? t('nav.portal') : t('nav.login')}
              </motion.button>

              <motion.button
                onClick={handleBookNow}
                className="relative px-6 py-2.5 text-sm font-semibold text-white overflow-hidden rounded-full group shadow-lg shadow-primary/25"
                whileHover={{ scale: 1.03, boxShadow: '0 20px 40px -12px hsl(var(--primary) / 0.4)' }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Base gradient */}
                <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-teal-500 transition-all duration-500" />
                {/* Hover shimmer */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative z-10 flex items-center gap-2">
                  {t('nav.bookNow')}
                </span>
              </motion.button>
            </div>

            {/* Mobile menu toggle */}
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className={`lg:hidden p-2.5 rounded-xl transition-all duration-300 ${
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
                <div className="px-5 py-5 space-y-1">
                  {navItems.map((item, index) => (
                    <motion.a
                      key={item.href}
                      href={item.isRoute ? undefined : item.href}
                      onClick={(e) => {
                        if (item.isRoute) {
                          e.preventDefault();
                          navigate(item.href);
                        }
                        setIsOpen(false);
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        block py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer
                        ${isScrolled 
                          ? 'text-foreground hover:bg-primary/10 hover:text-primary' 
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }
                      `}
                    >
                      {item.label}
                    </motion.a>
                  ))}
                  
                  {/* Mobile controls */}
                  <div className="flex items-center justify-center gap-4 pt-4 mt-4 border-t border-white/10">
                    <LanguageSelector />
                    <ThemeToggle />
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <motion.button
                      onClick={handlePortalClick}
                      className={`
                        w-full py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300
                        ${isScrolled 
                          ? 'bg-muted text-foreground hover:bg-muted/80' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                        }
                      `}
                      whileTap={{ scale: 0.98 }}
                    >
                      {user ? (
                        <>
                          <User className="w-4 h-4 inline mr-2" />
                          {t('nav.portal')}
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4 inline mr-2" />
                          {t('nav.login')}
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      onClick={handleBookNow}
                      className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary to-teal-500 hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
                      whileTap={{ scale: 0.98 }}
                    >
                      {t('nav.bookNow')}
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
