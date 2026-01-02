/**
 * Design Tokens - Zentrale Styling-Konstanten
 *
 * Diese Datei definiert einheitliche Werte für das gesamte UI.
 * Alle Komponenten sollten diese Tokens verwenden statt hardcodierter Werte.
 */

// =============================================================================
// SHADOWS - Box Shadow Varianten
// =============================================================================
export const SHADOWS = {
  /** Subtiler Schatten für leichte Erhebung */
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  /** Standard-Schatten für Cards */
  sm: '0 2px 8px rgba(0, 0, 0, 0.06)',
  /** Mittlerer Schatten für hervorgehobene Elemente */
  md: '0 4px 12px rgba(0, 0, 0, 0.08)',
  /** Größerer Schatten für Dialoge/Modals */
  lg: '0 10px 25px rgba(0, 0, 0, 0.12)',
  /** Maximaler Schatten für Overlays */
  xl: '0 20px 40px rgba(0, 0, 0, 0.15)',
  /** Kein Schatten */
  none: 'none',
};

/**
 * Dynamischer Schatten mit Akzentfarbe
 * @param {string} color - Hex-Farbe (z.B. '#4F46E5')
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @returns {string} Box-shadow Wert
 */
export const coloredShadow = (color, size = 'md') => {
  const opacities = { sm: '33', md: '4d', lg: '66' }; // 20%, 30%, 40%
  const spreads = { sm: '8px', md: '12px', lg: '16px' };
  return `0 4px ${spreads[size]} ${color}${opacities[size]}`;
};

// =============================================================================
// BORDER RADIUS - Eckenrundungen
// =============================================================================
export const RADIUS = {
  /** Kleine Rundung für Inputs, Badges (8px) */
  sm: '8px',
  /** Standard-Rundung für Buttons, kleine Cards (10px) */
  md: '10px',
  /** Größere Rundung für Cards (12px) */
  lg: '12px',
  /** Große Rundung für prominente Cards (16px) */
  xl: '16px',
  /** Extra große Rundung für Hero-Elemente (20px) */
  '2xl': '20px',
  /** Maximale Rundung für Pills/Chips */
  full: '9999px',
  /** Keine Rundung */
  none: '0',
};

// =============================================================================
// BREAKPOINTS - Responsive Design
// =============================================================================
export const BREAKPOINTS = {
  /** Mobile: < 640px */
  sm: 640,
  /** Tablet: < 768px */
  md: 768,
  /** Tablet Landscape / Small Desktop: < 900px */
  lg: 900,
  /** Desktop: < 1024px */
  xl: 1024,
  /** Large Desktop: < 1280px */
  '2xl': 1280,
};

// =============================================================================
// FONT SIZES - Typografie
// =============================================================================
export const FONT_SIZE = {
  /** Extra klein für Captions (11px) */
  '2xs': '11px',
  /** Klein für Labels, Metadaten (12px) */
  xs: '12px',
  /** Standard klein für sekundären Text (13px) */
  sm: '13px',
  /** Standard für Body-Text (14px) */
  base: '14px',
  /** Etwas größer für wichtigen Text (15px) */
  md: '15px',
  /** Groß für Überschriften Level 3 (16px) */
  lg: '16px',
  /** Größer für Überschriften Level 2 (18px) */
  xl: '18px',
  /** Groß für Überschriften Level 1 (20px) */
  '2xl': '20px',
  /** Extra groß für Hero-Überschriften (22px) */
  '3xl': '22px',
  /** Titel (24px) */
  '4xl': '24px',
  /** Große Titel (28px) */
  '5xl': '28px',
};

// =============================================================================
// FONT WEIGHTS
// =============================================================================
export const FONT_WEIGHT = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

// =============================================================================
// SPACING - Abstände (basierend auf 4px Grid)
// =============================================================================
export const SPACING = {
  /** 4px */
  1: '4px',
  /** 6px */
  1.5: '6px',
  /** 8px */
  2: '8px',
  /** 10px */
  2.5: '10px',
  /** 12px */
  3: '12px',
  /** 14px */
  3.5: '14px',
  /** 16px */
  4: '16px',
  /** 20px */
  5: '20px',
  /** 24px */
  6: '24px',
  /** 28px */
  7: '28px',
  /** 32px */
  8: '32px',
  /** 40px */
  10: '40px',
  /** 48px */
  12: '48px',
  /** 60px */
  15: '60px',
  /** 64px */
  16: '64px',
};

// =============================================================================
// TRANSITIONS - Animationen
// =============================================================================
export const TRANSITIONS = {
  /** Schnelle Übergänge (100ms) */
  fast: '0.1s ease',
  /** Standard-Übergänge (200ms) */
  normal: '0.2s ease',
  /** Langsame Übergänge (300ms) */
  slow: '0.3s ease',
  /** Sehr langsame Übergänge (400ms) */
  slower: '0.4s ease',
};

// =============================================================================
// Z-INDEX - Layer-Hierarchie
// =============================================================================
export const Z_INDEX = {
  /** Standard-Inhalt */
  base: 0,
  /** Leicht erhöhte Elemente */
  raised: 10,
  /** Sticky Header */
  sticky: 20,
  /** Dropdown Menus */
  dropdown: 30,
  /** Modals/Dialoge */
  modal: 40,
  /** Overlays */
  overlay: 50,
  /** Tooltips */
  tooltip: 60,
  /** Toast Notifications */
  toast: 70,
};

// =============================================================================
// ICON SIZES - Einheitliche Icon-Größen
// =============================================================================
export const ICON_SIZE = {
  /** Extra klein (12px) */
  xs: 12,
  /** Klein (16px) */
  sm: 16,
  /** Standard (18px) */
  md: 18,
  /** Groß (20px) */
  lg: 20,
  /** Extra groß (22px) */
  xl: 22,
  /** 2x groß (24px) */
  '2xl': 24,
  /** 3x groß (32px) */
  '3xl': 32,
  /** 4x groß (48px) */
  '4xl': 48,
};

// =============================================================================
// COMPONENT PRESETS - Häufig verwendete Kombinationen
// =============================================================================
export const COMPONENT = {
  /** Standard Card */
  card: {
    borderRadius: RADIUS.xl,
    padding: SPACING[6],
    shadow: SHADOWS.md,
  },
  /** Kleine Card */
  cardSm: {
    borderRadius: RADIUS.lg,
    padding: SPACING[4],
    shadow: SHADOWS.sm,
  },
  /** Dialog/Modal */
  dialog: {
    borderRadius: RADIUS.xl,
    padding: SPACING[6],
    shadow: SHADOWS.xl,
  },
  /** Standard Button */
  button: {
    borderRadius: RADIUS.lg,
    paddingX: SPACING[6],
    paddingY: SPACING[3],
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
  },
  /** Kleiner Button */
  buttonSm: {
    borderRadius: RADIUS.md,
    paddingX: SPACING[4],
    paddingY: SPACING[2],
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  /** Input/Textarea */
  input: {
    borderRadius: RADIUS.md,
    padding: SPACING[3],
    fontSize: FONT_SIZE.base,
  },
  /** Badge/Chip */
  badge: {
    borderRadius: RADIUS.full,
    paddingX: SPACING[3],
    paddingY: SPACING[1.5],
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
};

// =============================================================================
// OPACITY - Transparenz-Werte
// =============================================================================
export const OPACITY = {
  /** Deaktivierte Elemente */
  disabled: 0.5,
  /** Hover-Overlay */
  hover: 0.1,
  /** Active/Pressed-Overlay */
  active: 0.2,
  /** Leichte Hintergründe */
  subtle: 0.05,
  /** Mittlere Hintergründe */
  light: 0.15,
  /** Mittlere Transparenz */
  medium: 0.3,
  /** Starke Transparenz */
  strong: 0.6,
  /** Backdrop/Overlay */
  backdrop: 0.5,
};

// =============================================================================
// HOVER & INTERACTION STATES
// =============================================================================
export const INTERACTION = {
  /** Standard Hover-Skalierung */
  hoverScale: 1.02,
  /** Aktiv/Pressed-Skalierung */
  activeScale: 0.98,
  /** Card Lift bei Hover (translateY) */
  hoverLift: '-4px',
  /** Button Hover Opacity */
  buttonHoverOpacity: 0.9,
  /** Focus Ring Width */
  focusRingWidth: '3px',
  /** Focus Ring Opacity */
  focusRingOpacity: 0.25,
};

// =============================================================================
// ANIMATION DURATIONS (in ms)
// =============================================================================
export const DURATION = {
  instant: 0,
  fast: 100,
  normal: 200,
  slow: 300,
  slower: 400,
  slowest: 500,
};

// =============================================================================
// EASING FUNCTIONS
// =============================================================================
export const EASING = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  /** Smooth spring-like easing */
  spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
  /** Bounce effect */
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

// =============================================================================
// BORDERS
// =============================================================================
export const BORDERS = {
  /** Keine Border */
  none: 'none',
  /** Dünne Border (1px) */
  thin: '1px solid',
  /** Standard Border (2px) */
  normal: '2px solid',
  /** Dicke Border für Akzente (3px) */
  thick: '3px solid',
  /** Sehr dicke Border (4px) */
  heavy: '4px solid',
};

// =============================================================================
// LINE HEIGHTS
// =============================================================================
export const LINE_HEIGHT = {
  tight: 1.2,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
};

// =============================================================================
// LETTER SPACING
// =============================================================================
export const LETTER_SPACING = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
};

// =============================================================================
// BLUR VALUES
// =============================================================================
export const BLUR = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '40px',
};

// =============================================================================
// TOUCH TARGETS (Accessibility)
// =============================================================================
export const TOUCH = {
  /** Minimum Touch Target (44px - iOS standard) */
  min: '44px',
  /** Comfortable Touch Target */
  comfortable: '48px',
  /** Large Touch Target */
  large: '56px',
};

// =============================================================================
// ASPECT RATIOS
// =============================================================================
export const ASPECT_RATIO = {
  square: '1 / 1',
  video: '16 / 9',
  photo: '4 / 3',
  portrait: '3 / 4',
  wide: '21 / 9',
};

// =============================================================================
// MAX WIDTHS
// =============================================================================
export const MAX_WIDTH = {
  xs: '320px',
  sm: '384px',
  md: '448px',
  lg: '512px',
  xl: '576px',
  '2xl': '672px',
  '3xl': '768px',
  '4xl': '896px',
  '5xl': '1024px',
  '6xl': '1152px',
  '7xl': '1280px',
  full: '100%',
  prose: '65ch',
};

// =============================================================================
// ANIMATION KEYFRAMES (for framer-motion)
// =============================================================================
export const ANIMATION = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
};

// =============================================================================
// STAGGER DELAYS (for list animations)
// =============================================================================
export const STAGGER = {
  fast: 0.03,
  normal: 0.05,
  slow: 0.1,
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================
export default {
  SHADOWS,
  RADIUS,
  BREAKPOINTS,
  FONT_SIZE,
  FONT_WEIGHT,
  SPACING,
  TRANSITIONS,
  Z_INDEX,
  ICON_SIZE,
  COMPONENT,
  OPACITY,
  INTERACTION,
  DURATION,
  EASING,
  BORDERS,
  LINE_HEIGHT,
  LETTER_SPACING,
  BLUR,
  TOUCH,
  ASPECT_RATIO,
  MAX_WIDTH,
  ANIMATION,
  STAGGER,
  coloredShadow,
};
