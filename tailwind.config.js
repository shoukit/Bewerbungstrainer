/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
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
        // Custom blue/teal theme colors from design
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
        'ocean-deep': {
          50: '#E6EDF0',
          100: '#CDDAE1',
          200: '#9BB6C3',
          300: '#6991A5',
          400: '#527A8A',
          500: '#446573',
          600: '#36515C',
          700: '#283D45',
          800: '#1A292E',
          900: '#0C1417',
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
