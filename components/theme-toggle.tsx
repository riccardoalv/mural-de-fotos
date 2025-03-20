"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evitar problemas de hidratação
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Renderizar um placeholder com as mesmas dimensões para evitar layout shift
    return <div className="w-16 h-8 rounded-full bg-gray-200 dark:bg-gray-800"></div>
  }

  const isDark = resolvedTheme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative flex h-8 w-16 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ${
        isDark ? "bg-gray-800" : "bg-gray-200"
      }`}
      type="button"
      aria-label={`Mudar para tema ${isDark ? "claro" : "escuro"}`}
    >
      <div className="relative w-full h-full">
        {/* Círculo que se move */}
        <div
          className={`absolute top-0 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transform transition-transform duration-500 ${
            isDark ? "translate-x-8" : "translate-x-0"
          }`}
          style={{
            transform: isDark ? "translateX(8px) rotate(360deg)" : "translateX(0) rotate(0)",
            transition: "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
        >
          {isDark ? <Moon className="h-4 w-4 text-indigo-900" /> : <Sun className="h-4 w-4 text-amber-500" />}
        </div>

        {/* Ícones de fundo */}
        <div className="absolute inset-0 flex justify-between items-center px-1.5 pointer-events-none">
          <div className={`transition-opacity duration-300 ${isDark ? "opacity-0" : "opacity-70"}`}>
            <Sun className="h-4 w-4 text-amber-500" />
          </div>

          <div className={`transition-opacity duration-300 ${isDark ? "opacity-70" : "opacity-0"}`}>
            <Moon className="h-4 w-4 text-indigo-100" />
          </div>
        </div>
      </div>
    </button>
  )
}

