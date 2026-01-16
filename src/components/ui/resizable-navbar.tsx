"use client";

import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import React, { useRef, useState } from "react";

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: {
    name: string;
    link: string;
    isRoute?: boolean;
  }[];
  className?: string;
  onItemClick?: (item: { name: string; link: string; isRoute?: boolean }) => void;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Navbar = ({ children, className }: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.nav
      ref={ref}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn("fixed inset-x-0 top-0 z-50 w-full", className)}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{ visible?: boolean }>,
              { visible }
            )
          : child
      )}
    </motion.nav>
  );
};

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(20px)" : "blur(0px)",
        backgroundColor: visible
          ? "hsl(var(--background) / 0.8)"
          : "transparent",
        width: visible ? "90%" : "100%",
        y: visible ? 10 : 0,
        borderRadius: visible ? "9999px" : "0px",
        boxShadow: visible
          ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          : "none",
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      style={{
        minWidth: "800px",
      }}
      className={cn(
        "relative z-[60] mx-auto hidden w-full max-w-7xl items-center justify-between self-start px-4 py-3 lg:flex",
        visible && "border border-border/30",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-1 text-sm font-medium lg:flex",
        className
      )}
    >
      {items.map((item, idx) => (
        <a
          onMouseEnter={() => setHovered(idx)}
          onClick={(e) => {
            if (item.isRoute) {
              e.preventDefault();
            }
            onItemClick?.(item);
          }}
          className="relative cursor-pointer px-4 py-2 text-foreground/70 hover:text-foreground transition-colors duration-200"
          key={`link-${idx}`}
          href={item.link}
        >
          {hovered === idx && (
            <motion.span
              layoutId="hovered-nav"
              className="absolute inset-0 rounded-full bg-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
          <span className="relative z-20">{item.name}</span>
        </a>
      ))}
    </motion.div>
  );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(20px)" : "blur(0px)",
        backgroundColor: visible
          ? "hsl(var(--background) / 0.9)"
          : "transparent",
        width: visible ? "95%" : "100%",
        y: visible ? 10 : 0,
        borderRadius: visible ? "1rem" : "0px",
        boxShadow: visible
          ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          : "none",
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      className={cn(
        "relative z-50 mx-auto flex w-full flex-col lg:hidden",
        visible && "border border-border/30",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between px-4 py-3",
        className
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
  onClose,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "flex flex-col items-start justify-start gap-2 overflow-hidden px-4 pb-4",
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({
  isOpen,
  onClick,
  className,
}: {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}) => {
  return isOpen ? (
    <X
      className={cn("h-5 w-5 text-foreground cursor-pointer", className)}
      onClick={onClick}
    />
  ) : (
    <Menu
      className={cn("h-5 w-5 text-foreground cursor-pointer", className)}
      onClick={onClick}
    />
  );
};

export const NavbarLogo = ({
  src,
  alt = "Logo",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) => {
  return (
    <a href="#inicio" className="flex items-center z-50">
      <img
        src={src}
        alt={alt}
        className={cn("h-8 w-auto", className)}
      />
    </a>
  );
};

export const NavbarButton = ({
  href,
  children,
  className,
  variant = "primary",
  onClick,
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "dark" | "gradient";
  onClick?: () => void;
}) => {
  const baseStyles =
    "relative px-5 py-2.5 text-sm font-semibold rounded-full cursor-pointer transition-all duration-200 inline-flex items-center justify-center gap-2";

  const variantStyles = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20",
    secondary:
      "bg-transparent text-foreground hover:bg-muted border border-primary text-primary",
    dark: "bg-foreground text-background hover:bg-foreground/90",
    gradient:
      "bg-gradient-to-r from-primary to-accent text-white",
  };

  if (href) {
    return (
      <a
        href={href}
        className={cn(baseStyles, variantStyles[variant], className)}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], className)}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
