/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ===========================================
      // BORDER RADIUS - Updated for "Clean Professional"
      // ===========================================
      borderRadius: {
        // Base variable (for shadcn)
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",

        // Semantic radius - Updated
        'xs': '6px',      // Badges, Tags
        'button': '12px', // Buttons (was 10px)
        'input': '10px',  // Inputs (was 8px)
        'card': '16px',   // Standard Cards (was 16px)
        'card-sm': '12px', // Small Cards
        'modal': '20px',  // Modals, Dialogs
      },

      // ===========================================
      // BOX SHADOWS - Softer, more subtle
      // ===========================================
      boxShadow: {
        // Hierarchy of shadows
        'xs': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'subtle': '0 2px 4px rgba(0, 0, 0, 0.06)',
        'card': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'elevated': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'dialog': '0 16px 48px rgba(0, 0, 0, 0.16)',

        // Colored shadows for buttons
        'primary': '0 4px 14px rgba(79, 70, 229, 0.35)',
        'primary-hover': '0 6px 20px rgba(79, 70, 229, 0.4)',
        'success': '0 4px 14px rgba(34, 197, 94, 0.35)',
        'error': '0 4px 14px rgba(239, 68, 68, 0.35)',

        // Input focus
        'input-focus': '0 0 0 3px rgba(79, 70, 229, 0.15)',
        'input-error': '0 0 0 3px rgba(239, 68, 68, 0.15)',
      },

      // ===========================================
      // SPACING (Touch-friendly)
      // ===========================================
      spacing: {
        'touch': '44px', // Minimum iOS touch target
        '4.5': '18px',
        '13': '52px',
        '15': '60px',
        '18': '72px',
      },

      // ===========================================
      // COLORS - Updated for "Clean Professional"
      // ===========================================
      colors: {
        // ===== PARTNER BRANDING (Dynamic) =====
        'brand': {
          DEFAULT: 'var(--primary-accent)',
          light: 'var(--primary-accent-light)',
          hover: 'var(--primary-accent-hover)',
        },

        // ===== SEMANTIC COLORS (Partner-aware) =====
        'themed': {
          'bg': 'var(--card-bg-color)',
          'bg-hover': 'var(--card-bg-hover)',
          'border': 'var(--border-color)',
          'border-light': 'var(--border-color-light)',
          'text': 'var(--text-main)',
          'text-secondary': 'var(--text-secondary)',
          'text-muted': 'var(--text-muted)',
        },

        // ===== SIDEBAR (Partner-aware) =====
        'sidebar': {
          'bg': 'var(--sidebar-bg-color)',
          'text': 'var(--sidebar-text-color)',
          'muted': 'var(--sidebar-text-muted)',
          'active-bg': 'var(--sidebar-active-bg)',
          'active-text': 'var(--sidebar-active-text)',
          'hover-bg': 'var(--sidebar-hover-bg)',
        },

        // ===== STATUS COLORS (Consistent) =====
        'status': {
          'success': 'var(--color-success)',
          'success-light': 'var(--color-success-light)',
          'success-dark': 'var(--color-success-dark)',
          'error': 'var(--color-error)',
          'error-light': 'var(--color-error-light)',
          'error-dark': 'var(--color-error-dark)',
          'warning': 'var(--color-warning)',
          'warning-light': 'var(--color-warning-light)',
          'warning-dark': 'var(--color-warning-dark)',
          'info': 'var(--color-info)',
          'info-light': 'var(--color-info-light)',
          'info-dark': 'var(--color-info-dark)',
        },

        // ===== SHADCN DEFAULTS =====
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },

      // ===========================================
      // BACKGROUND IMAGES (Gradients)
      // ===========================================
      backgroundImage: {
        'brand-gradient': 'var(--header-gradient)',
        'button-gradient': 'var(--button-gradient)',
        'button-gradient-hover': 'var(--button-gradient-hover)',
        'app-gradient': 'var(--app-bg-color)',

        // Feature gradients
        'gradient-indigo': 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        'gradient-blue': 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
        'gradient-emerald': 'linear-gradient(135deg, #059669 0%, #0D9488 100%)',
        'gradient-violet': 'linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)',
        'gradient-teal': 'linear-gradient(135deg, #0D9488 0%, #059669 100%)',
      },

      // ===========================================
      // FONT SIZES (Accessible - 16px base prevents iOS zoom)
      // ===========================================
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
      },

      // ===========================================
      // LETTER SPACING
      // ===========================================
      letterSpacing: {
        'tight': '-0.02em',  // Headlines
        'normal': '0',
        'wide': '0.05em',    // Uppercase labels
      },

      // ===========================================
      // TRANSITIONS
      // ===========================================
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
        '350': '350ms',
      },

      // ===========================================
      // Z-INDEX (Semantic layers)
      // ===========================================
      zIndex: {
        'dropdown': '50',
        'sticky': '100',
        'modal': '200',
        'toast': '300',
        'tooltip': '400',
      },

      // ===========================================
      // KEYFRAMES & ANIMATIONS
      // ===========================================
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
