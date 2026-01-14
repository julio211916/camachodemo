import * as React from "react";
import { animate } from "animejs";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface AnimatedInputProps extends React.ComponentProps<typeof Input> {
  onAnimateError?: () => void;
  onAnimateSuccess?: () => void;
}

const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ className, onAnimateError, onAnimateSuccess, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const combinedRef = React.useMemo(() => {
      return (node: HTMLInputElement | null) => {
        (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      };
    }, [ref]);

    const handleFocus = React.useCallback(() => {
      const element = inputRef.current;
      if (!element) return;
      
      animate(element, {
        scale: [1, 1.015, 1],
        duration: 250,
        easing: 'easeOutQuad'
      });
    }, []);

    React.useImperativeHandle(ref, () => {
      const element = inputRef.current!;
      
      // Add methods to trigger animations
      return Object.assign(element, {
        animateError: () => {
          animate(element, {
            translateX: [0, -6, 6, -4, 4, 0],
            duration: 400,
            easing: 'easeInOutQuad'
          });
          onAnimateError?.();
        },
        animateSuccess: () => {
          animate(element, {
            scale: [1, 1.03, 1],
            duration: 300,
            easing: 'easeOutBack'
          });
          onAnimateSuccess?.();
        }
      });
    }, [onAnimateError, onAnimateSuccess]);

    return (
      <Input
        ref={combinedRef}
        className={cn("transition-all", className)}
        onFocus={handleFocus}
        {...props}
      />
    );
  }
);

AnimatedInput.displayName = "AnimatedInput";

export { AnimatedInput };
