import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Home, Briefcase, Calendar, Shield, Settings, LucideIcon } from 'lucide-react';

export interface InteractiveMenuItem {
  label: string;
  icon: LucideIcon;
}

export interface InteractiveMenuProps {
  items?: InteractiveMenuItem[];
  accentColor?: string;
  onItemClick?: (index: number, label: string) => void;
}

const defaultItems: InteractiveMenuItem[] = [
  { label: 'home', icon: Home },
  { label: 'strategy', icon: Briefcase },
  { label: 'period', icon: Calendar },
  { label: 'security', icon: Shield },
  { label: 'settings', icon: Settings },
];

const defaultAccentColor = 'hsl(var(--primary))';

export const InteractiveMenu: React.FC<InteractiveMenuProps> = ({ 
  items, 
  accentColor,
  onItemClick 
}) => {
  const finalItems = useMemo(() => {
    const isValid = items && Array.isArray(items) && items.length >= 2 && items.length <= 5;
    if (!isValid) {
      return defaultItems;
    }
    return items;
  }, [items]);

  const [activeIndex, setActiveIndex] = useState(0);
  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (activeIndex >= finalItems.length) {
      setActiveIndex(0);
    }
  }, [finalItems, activeIndex]);

  useEffect(() => {
    const setLineWidth = () => {
      const activeItemElement = itemRefs.current[activeIndex];
      const activeTextElement = textRefs.current[activeIndex];

      if (activeItemElement && activeTextElement) {
        const textWidth = activeTextElement.offsetWidth;
        activeItemElement.style.setProperty('--lineWidth', `${textWidth}px`);
      }
    };

    setLineWidth();
    window.addEventListener('resize', setLineWidth);
    return () => {
      window.removeEventListener('resize', setLineWidth);
    };
  }, [activeIndex, finalItems]);

  const handleItemClick = (index: number) => {
    setActiveIndex(index);
    onItemClick?.(index, finalItems[index].label);
  };

  const activeColor = accentColor || defaultAccentColor;

  return (
    <nav 
      className="flex items-center justify-around gap-2 p-3 rounded-2xl bg-card shadow-lg border border-border"
      style={{ '--component-active-color': activeColor } as React.CSSProperties}
    >
      {finalItems.map((item, index) => {
        const isActive = index === activeIndex;
        const IconComponent = item.icon;

        return (
          <button
            key={`${item.label}-${index}`}
            className={`
              relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300
              ${isActive 
                ? 'bg-primary/10' 
                : 'hover:bg-muted'
              }
            `}
            onClick={() => handleItemClick(index)}
            ref={(el) => (itemRefs.current[index] = el)}
            style={{ '--lineWidth': '0px' } as React.CSSProperties}
          >
            <span
              className={`
                transition-all duration-300
                ${isActive 
                  ? 'text-primary animate-bounce' 
                  : 'text-muted-foreground'
                }
              `}
            >
              <IconComponent className="w-5 h-5" />
            </span>
            <span
              className={`
                text-xs font-medium capitalize transition-all duration-300
                ${isActive 
                  ? 'text-primary opacity-100' 
                  : 'text-muted-foreground opacity-70'
                }
              `}
              ref={(el) => (textRefs.current[index] = el)}
            >
              {item.label}
            </span>
            {isActive && (
              <span 
                className="absolute bottom-1 h-0.5 bg-primary rounded-full transition-all duration-300"
                style={{ width: 'var(--lineWidth)' }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
