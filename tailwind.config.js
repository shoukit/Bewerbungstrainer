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
      // BORDER RADIUS
      // ===========================================
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Semantic radius
        'card': '16px',
        'card-sm': '12px',
        'button': '10px',
        'input': '8px',
        'badge': '6px',
      },
      // ===========================================
      // BOX SHADOWS
      // ===========================================
      boxShadow: {
        'card': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 10px 25px rgba(0, 0, 0, 0.12)',
        'dialog': '0 20px 40px rgba(0, 0, 0, 0.15)',
        'subtle': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'button': '0 4px 14px rgba(0, 0, 0, 0.1)',
        'input-focus': '0 0 0 3px var(--focus-ring)',
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
      // COLORS - Partner Branding via CSS Variables
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

        // ===== OCEAN THEME (Static palette) =====
        'ocean-blue': {
          50: '#E8F4F8',
          100: '#D1E9F1',
          200: '#A8D8EA',
          300: '#7AC7E3',
          400: '#5FB3D8',
          500: '#4A9EC9',
          600: '#3A7FA7',
          700: '#2D6485',
          800: '#1F4963',
          900: '#12304A',
        },
        'ocean-teal': {
          50: '#E6F7F4',
          100: '#CCEFE9',
          200: '#99DFD3',
          300: '#66CFBD',
          400: '#4DB8A0',
          500: '#3DA389',
          600: '#2E8A72',
          700: '#22705B',
          800: '#165644',
          900: '#0B3C2D',
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
      },
      // ===========================================
      // FONT SIZES (Accessible)
      // ===========================================
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],  // iOS zoom prevention
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
      },
      // ===========================================
      // TRANSITIONS
      // ===========================================
      transitionDuration: {
        '250': '250ms',
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
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
