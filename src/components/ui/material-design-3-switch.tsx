import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

const SWITCH_THEME = {
  "--ease-spring": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
} as React.CSSProperties;

const switchVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "peer-checked:bg-primary peer-checked:border-primary",
        destructive: "peer-checked:bg-destructive peer-checked:border-destructive",
      },
      size: {
        default: "h-8 w-[52px]",
        sm: "h-6 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

const playHapticFeedback = (type: "heavy" | "light" | "none") => {
  if (type === "none" || typeof window === "undefined") return;

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === "heavy") {
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(180, now);
      oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      
      gainNode.gain.setValueAtTime(0.4, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      
      oscillator.start(now);
      oscillator.stop(now + 0.15);
    } else {
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, now);
      
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      
      oscillator.start(now);
      oscillator.stop(now + 0.08);
    }
  } catch (e) {
    console.error("Audio haptic failed", e);
  }
};

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof switchVariants> {
  onCheckedChange?: (checked: boolean) => void;
  showIcons?: boolean;
  checkedIcon?: React.ReactNode;
  uncheckedIcon?: React.ReactNode;
  haptic?: "heavy" | "light" | "none";
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ 
    className, 
    size, 
    variant, 
    checked, 
    defaultChecked, 
    onCheckedChange, 
    showIcons = false, 
    checkedIcon, 
    uncheckedIcon, 
    haptic = "none", 
    style, 
    disabled, 
    ...props 
  }, ref) => {
    const [isChecked, setIsChecked] = React.useState(defaultChecked ?? false);
    const [isPressed, setIsPressed] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);

    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked);
      }
    }, [checked]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const newValue = e.target.checked;
      
      playHapticFeedback(haptic);

      if (checked === undefined) {
        setIsChecked(newValue);
      }
      onCheckedChange?.(newValue);
    };

    const isSmall = size === "sm";
    const translateDist = isSmall ? "translate-x-[16px]" : "translate-x-[20px]";
    const handleSizeUnchecked = isSmall ? "w-3 h-3 ml-[2px]" : "w-4 h-4 ml-[2px]";
    const handleSizeChecked = isSmall ? "w-4 h-4" : "w-6 h-6";
    const handleSizePressed = isSmall ? "w-5 h-5 -ml-[2px]" : "w-7 h-7 -ml-[2px]";
    
    const iconClasses = isSmall ? "w-2.5 h-2.5" : "w-3.5 h-3.5";

    const shouldRenderIcons = showIcons || checkedIcon || uncheckedIcon;

    return (
      <label
        className={cn(
          "relative inline-flex items-center",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        )}
        style={{ ...SWITCH_THEME, ...style }}
        onPointerDown={() => !disabled && setIsPressed(true)}
        onPointerUp={() => setIsPressed(false)}
        onPointerLeave={() => {
          setIsPressed(false);
          setIsHovered(false);
        }}
        onPointerEnter={() => !disabled && setIsHovered(true)}
      >
        <input
          type="checkbox"
          className="sr-only peer"
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          {...props}
        />

        <div
          className={cn(
            switchVariants({ variant, size }),
            isChecked 
              ? "bg-primary border-primary" 
              : "bg-muted border-muted-foreground/30",
            className
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-full bg-background shadow-lg transition-all duration-300",
              isChecked ? translateDist : "",
              isPressed 
                ? handleSizePressed 
                : isChecked 
                  ? handleSizeChecked 
                  : handleSizeUnchecked
            )}
            style={{
              transitionTimingFunction: "var(--ease-spring)",
            }}
          >
            {shouldRenderIcons && (
              <div className="relative w-full h-full flex items-center justify-center">
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
                    isChecked ? "opacity-100" : "opacity-0"
                  )}
                >
                  {checkedIcon ? (
                    checkedIcon
                  ) : (
                    <Check className={cn(iconClasses, "text-primary")} />
                  )}
                </div>

                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
                    isChecked ? "opacity-0" : "opacity-100"
                  )}
                >
                  {uncheckedIcon ? (
                    uncheckedIcon
                  ) : (
                    <X className={cn(iconClasses, "text-muted-foreground")} />
                  )}
                </div>
              </div>
            )}

            <div
              className={cn(
                "absolute inset-0 rounded-full transition-all duration-200",
                isHovered ? "bg-foreground/10 scale-150" : "bg-transparent scale-100"
              )}
            />
          </div>
        </div>
      </label>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };