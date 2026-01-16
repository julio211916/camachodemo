"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { flushSync } from "react-dom"

import { cn } from "@/lib/utils"

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number
  onThemeChange?: (isDark: boolean) => void
}

export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  onThemeChange,
  ...props
}: AnimatedThemeTogglerProps) => {
  const [isDark, setIsDark] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"))
    }

    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return

    const newTheme = !isDark

    // Check if View Transitions API is supported
    if (document.startViewTransition) {
      await document.startViewTransition(() => {
        flushSync(() => {
          setIsDark(newTheme)
          document.documentElement.classList.toggle("dark", newTheme)
          localStorage.setItem("theme", newTheme ? "dark" : "light")
          onThemeChange?.(newTheme)
        })
      }).ready

      const { top, left, width, height } =
        buttonRef.current.getBoundingClientRect()
      const x = left + width / 2
      const y = top + height / 2
      const maxRadius = Math.hypot(
        Math.max(left, window.innerWidth - left),
        Math.max(top, window.innerHeight - top)
      )

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      )
    } else {
      // Fallback for browsers without View Transitions API
      setIsDark(newTheme)
      document.documentElement.classList.toggle("dark", newTheme)
      localStorage.setItem("theme", newTheme ? "dark" : "light")
      onThemeChange?.(newTheme)
    }
  }, [isDark, duration, onThemeChange])

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(
        "p-2 rounded-full bg-secondary/80 hover:bg-secondary transition-colors",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      {...props}
    >
      {isDark ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-primary" />}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
