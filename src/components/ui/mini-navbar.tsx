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
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl"
    >
      {/* Main navbar container */}
      <div
        className={`
          relative transition-all duration-500 ease-in-out
          ${headerShapeClass}
          ${isScrolled 
            ? 'bg-background/90 backdrop-blur-xl shadow-lg border border-border' 
            : 'bg-gray-900/80 backdrop-blur-xl border border-white/10'
          }
        `}
      >
        {/* Desktop layout */}
        <div className="flex items-center justify-between px-4 py-2.5 lg:px-6">
          {/* Logo */}
          <motion.a 
            href="#inicio" 
            className="flex items-center gap-2 flex-shrink-0"
            whileHover={{ scale: 1.02 }}
          >
            <img 
              src={logo} 
              alt="NovellDent" 
              className="h-8 w-auto"
            />
          </motion.a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
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
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1 mr-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>
            
            <motion.button
              onClick={handlePortalClick}
              className={`
                px-4 py-1.5 text-sm font-medium rounded-full transition-colors
                ${isScrolled 
                  ? 'text-foreground hover:text-primary' 
                  : 'text-gray-300 hover:text-white'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {user ? <User className="w-4 h-4 inline mr-1" /> : <LogIn className="w-4 h-4 inline mr-1" />}
              {user ? t('nav.portal') : t('nav.login')}
            </motion.button>

            <motion.button
              onClick={handleBookNow}
              className="relative px-5 py-2 text-sm font-medium text-white overflow-hidden rounded-full group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Glow effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-teal-400 opacity-100 group-hover:opacity-90 transition-opacity" />
              <span className="absolute inset-0 bg-gradient-to-r from-primary via-teal-400 to-primary opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
              <span className="relative z-10">{t('nav.bookNow')}</span>
            </motion.button>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden p-2 rounded-full transition-colors ${
              isScrolled ? 'text-foreground' : 'text-white'
            }`}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
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
              <div className="px-4 py-4 space-y-2">
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
                      block py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer
                      ${isScrolled 
                        ? 'text-foreground hover:bg-muted' 
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    {item.label}
                  </motion.a>
                ))}
                
                {/* Mobile controls */}
                <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/10">
                  <LanguageSelector />
                  <ThemeToggle />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <motion.button
                    onClick={handlePortalClick}
                    className={`
                      w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors
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
                    className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-primary to-teal-400 hover:opacity-90 transition-opacity"
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
    </motion.header>
  );
}

export default MiniNavbar;
