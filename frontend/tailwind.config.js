/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  // Attiva dark mode tramite classe CSS (gestito da Zustand)
  darkMode: "class",

  theme: {
    extend: {
      // --- Palette SKILLA ---
      colors: {
        skilla: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6", // blu primario
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
          950: "#172554",
        },
        sport: {
          skiing: "#3B82F6",
          snowboard: "#8B5CF6",
          football: "#10B981",
          basketball: "#F59E0B",
          swimming: "#06B6D4",
          cycling: "#EF4444",
          running: "#F97316",
          tennis: "#84CC16",
          volleyball: "#EC4899",
          surf: "#0EA5E9",
          climbing: "#78716C",
          gym: "#6366F1",
          other: "#6B7280",
        },
        // Modalità High Contrast / Emergency
        emergency: {
          bg: "#000000",
          text: "#FFFF00",
          accent: "#FF6600",
          border: "#FFFFFF",
        },
      },

      // --- Font ---
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },

      // --- Font size per modalità Emergency (grandi, leggibili) ---
      fontSize: {
        "emergency-sm": ["20px", "28px"],
        "emergency-base": ["24px", "34px"],
        "emergency-lg": ["30px", "40px"],
        "emergency-xl": ["36px", "48px"],
        "emergency-2xl": ["42px", "56px"],
      },

      // --- Spacing extra ---
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },

      // --- Animazioni ---
      animation: {
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "pulse-ring": "pulseRing 1.5s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },

      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pulseRing: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.15)", opacity: "0.8" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },

      // --- Border radius ---
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      // --- Blur ---
      backdropBlur: {
        xs: "2px",
      },

      // --- Box shadow glassmorphism ---
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255,255,255,0.1)",
        "glass-dark": "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        "sport": "0 4px 24px rgba(59, 130, 246, 0.3)",
        "emergency": "0 0 0 4px #FF6600",
      },
    },
  },

  plugins: [
    // Plugin custom per modalità accessibilità
    function ({ addVariant, addUtilities }) {
      // Variante per modalità essenziale
      addVariant("essential", ".essential &");
      // Variante per modalità emergenza
      addVariant("emergency", ".emergency &");
      // Variante per high-contrast
      addVariant("high-contrast", ".high-contrast &");

      // Utility per pannelli touch-friendly
      addUtilities({
        ".touch-target": {
          "min-height": "44px",
          "min-width": "44px",
        },
        ".touch-target-lg": {
          "min-height": "64px",
          "min-width": "64px",
        },
        ".touch-target-emergency": {
          "min-height": "80px",
          "min-width": "80px",
        },
        ".glass": {
          background: "rgba(255, 255, 255, 0.05)",
          "backdrop-filter": "blur(16px)",
          "-webkit-backdrop-filter": "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
        ".glass-light": {
          background: "rgba(255, 255, 255, 0.7)",
          "backdrop-filter": "blur(16px)",
          "-webkit-backdrop-filter": "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
        },
      });
    },
  ],
};
