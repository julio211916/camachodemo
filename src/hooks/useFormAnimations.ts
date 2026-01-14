import { useCallback, useRef, useEffect } from 'react';
import { animate } from 'animejs';

export const useFormAnimations = () => {
  const animatingRefs = useRef<Map<string, boolean>>(new Map());

  const animateFocus = useCallback((element: HTMLElement | null) => {
    if (!element || animatingRefs.current.get(element.id)) return;
    
    animatingRefs.current.set(element.id, true);
    
    animate(element, {
      scale: [1, 1.02, 1],
      boxShadow: [
        '0 0 0 0 rgba(var(--primary), 0)',
        '0 0 0 4px rgba(var(--primary), 0.2)',
        '0 0 0 2px rgba(var(--primary), 0.1)'
      ],
      duration: 300,
      easing: 'easeOutQuad',
      complete: () => {
        animatingRefs.current.set(element.id, false);
      }
    });
  }, []);

  const animateError = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    
    animate(element, {
      translateX: [0, -8, 8, -6, 6, -4, 4, 0],
      borderColor: ['hsl(var(--destructive))', 'hsl(var(--destructive))'],
      duration: 500,
      easing: 'easeInOutQuad'
    });
  }, []);

  const animateSuccess = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    
    animate(element, {
      scale: [1, 1.05, 1],
      borderColor: ['hsl(var(--primary))', 'hsl(var(--border))'],
      duration: 400,
      easing: 'easeOutBack'
    });
  }, []);

  const animateSubmitButton = useCallback((element: HTMLElement | null, success: boolean) => {
    if (!element) return;
    
    if (success) {
      animate(element, {
        scale: [1, 0.95, 1.05, 1],
        duration: 400,
        easing: 'easeOutBack'
      });
    } else {
      animate(element, {
        translateX: [0, -4, 4, -4, 4, 0],
        duration: 300,
        easing: 'easeInOutQuad'
      });
    }
  }, []);

  return {
    animateFocus,
    animateError,
    animateSuccess,
    animateSubmitButton
  };
};

export const useFieldAnimation = (inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>) => {
  const { animateFocus, animateError, animateSuccess } = useFormAnimations();

  useEffect(() => {
    const element = inputRef.current;
    if (!element) return;

    const handleFocus = () => animateFocus(element);
    
    element.addEventListener('focus', handleFocus);
    
    return () => {
      element.removeEventListener('focus', handleFocus);
    };
  }, [inputRef, animateFocus]);

  return { animateError, animateSuccess };
};
