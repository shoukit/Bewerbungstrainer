# Karriereheld Design System v2.0

> **"Clean Professional"** - Minimalistisch, modern, vertrauenswürdig

Dieses Dokument definiert das vollständige Design-System für Karriereheld.
Alle Komponenten MÜSSEN diese Standards einhalten.

---

## 1. Design-Philosophie

### Kernprinzipien

| Prinzip | Beschreibung |
|---------|--------------|
| **Klarheit** | Jedes Element hat einen klaren Zweck. Kein visuelles Rauschen. |
| **Konsistenz** | Gleiche Probleme → Gleiche Lösungen. Überall. |
| **Professionalität** | Wirkt vertrauenswürdig wie LinkedIn, Stripe, Linear. |
| **Zugänglichkeit** | WCAG 2.1 AA konform. Touch-freundlich (44px Mindestgröße). |

### Designsprache

- **Weiche Kanten** - Großzügige Rundungen (12-16px für Cards)
- **Subtile Schatten** - Leichte Tiefe ohne Dramatik
- **Viel Weißraum** - Elemente atmen lassen
- **Klare Hierarchie** - Wichtiges hervorheben, Rest zurücknehmen

---

## 2. Farbpalette

### 2.1 Primärfarben

```
INDIGO (Primary Brand)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
50:  #EEF2FF  - Hintergründe, Hover-States
100: #E0E7FF  - Leichte Akzente
200: #C7D2FE  - Borders bei Fokus
300: #A5B4FC  - Deaktivierte Elemente
400: #818CF8  - Sekundäre Aktionen
500: #6366F1  - Hover-State für Primary
600: #4F46E5  - ⭐ PRIMARY ACCENT (Hauptfarbe)
700: #4338CA  - Active/Pressed State
800: #3730A3  - Dunkle Akzente
900: #312E81  - Text auf hellem Hintergrund
```

```
VIOLET (Secondary/Gradient)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
400: #A78BFA
500: #8B5CF6
600: #7C3AED  - ⭐ SECONDARY (Gradient-Ende)
700: #6D28D9
```

### 2.2 Neutralfarben (Slate)

```
SLATE (Grautöne)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
50:  #F8FAFC  - ⭐ PAGE BACKGROUND (wärmer als reines Weiß)
100: #F1F5F9  - Sekundärer Hintergrund
200: #E2E8F0  - ⭐ BORDERS
300: #CBD5E1  - Deaktivierte Borders
400: #94A3B8  - ⭐ MUTED TEXT (Platzhalter, Captions)
500: #64748B  - ⭐ SECONDARY TEXT
600: #475569  - Standard-Text
700: #334155  - Überschriften
800: #1E293B  - ⭐ Sidebar Background
900: #0F172A  - ⭐ PRIMARY TEXT (Haupttext)
```

### 2.3 Semantische Farben

```
SUCCESS (Grün)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
50:  #F0FDF4  - Hintergrund
500: #22C55E  - ⭐ Hauptfarbe
600: #16A34A  - Text
700: #15803D  - Hover

WARNING (Amber)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
50:  #FFFBEB  - Hintergrund
500: #F59E0B  - ⭐ Hauptfarbe
600: #D97706  - Text
700: #B45309  - Hover

ERROR (Rot)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
50:  #FEF2F2  - Hintergrund
500: #EF4444  - ⭐ Hauptfarbe
600: #DC2626  - Text
700: #B91C1C  - Hover
```

### 2.4 Feature-Farben

| Feature | Farbe | Hex | Verwendung |
|---------|-------|-----|------------|
| Smart Briefing | Indigo | #4F46E5 | Standard Primary |
| Live-Simulation | Indigo→Violet | Gradient | Header |
| Szenario-Training | Blue | #3B82F6 | Akzente |
| Video-Training | Emerald | #10B981 | Akzente |
| Rhetorik-Gym | Purple | #8B5CF6 | Akzente |
| Decision Board | Teal | #14B8A6 | Akzente |
| Ikigai | Violet | #8B5CF6 | Akzente |

### 2.5 Gradients

```css
/* Header Gradient (Primary) */
--header-gradient: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);

/* Button Gradient */
--button-gradient: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);

/* Subtle Gradient für Hero-Sections */
--hero-gradient: linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 100%);
```

---

## 3. Typografie

### 3.1 Font Stack

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### 3.2 Schriftgrößen

| Token | Größe | Line-Height | Verwendung |
|-------|-------|-------------|------------|
| `text-xs` | 12px | 16px | Captions, Badges, Timestamps |
| `text-sm` | 14px | 20px | Sekundärer Text, Labels |
| `text-base` | 16px | 24px | Body Text, Inputs |
| `text-lg` | 18px | 28px | Lead Text, Card Titles |
| `text-xl` | 20px | 28px | Section Headers |
| `text-2xl` | 24px | 32px | Page Titles |
| `text-3xl` | 30px | 36px | Hero Headlines |

### 3.3 Font Weights

| Token | Wert | Verwendung |
|-------|------|------------|
| `font-normal` | 400 | Body Text |
| `font-medium` | 500 | Labels, Buttons |
| `font-semibold` | 600 | Überschriften, wichtige Text |
| `font-bold` | 700 | Headlines, Emphasis |

### 3.4 Letter Spacing

```css
/* Für große Headlines (-0.02em) */
.headline { letter-spacing: -0.02em; }

/* Für Uppercase Labels (0.05em) */
.label-uppercase { letter-spacing: 0.05em; }
```

---

## 4. Spacing

### 4.1 Spacing Scale (4px Base)

| Token | Wert | Tailwind | Verwendung |
|-------|------|----------|------------|
| `space-1` | 4px | `p-1` | Minimaler Abstand |
| `space-2` | 8px | `p-2` | Zwischen eng verwandten Elementen |
| `space-3` | 12px | `p-3` | Standard innerer Abstand |
| `space-4` | 16px | `p-4` | Card Padding (mobil) |
| `space-5` | 20px | `p-5` | Zwischen Gruppen |
| `space-6` | 24px | `p-6` | ⭐ Card Padding (Desktop) |
| `space-8` | 32px | `p-8` | Zwischen Sections |
| `space-10` | 40px | `p-10` | Große Sections |
| `space-12` | 48px | `p-12` | Page Sections |
| `space-16` | 64px | `p-16` | Hero Spacing |

### 4.2 Komponenten-Abstände

```
Card Padding:        24px (Desktop), 16px (Mobil)
Section Gap:         32-48px
Button Padding:      12px 24px
Input Padding:       12px 16px
Badge Padding:       4px 12px
```

---

## 5. Border Radius

| Token | Wert | Tailwind | Verwendung |
|-------|------|----------|------------|
| `radius-sm` | 6px | `rounded-md` | Badges, Tags |
| `radius-md` | 8px | `rounded-lg` | Inputs, kleine Buttons |
| `radius-lg` | 12px | `rounded-xl` | ⭐ Standard Cards, Buttons |
| `radius-xl` | 16px | `rounded-2xl` | Feature Cards, Modals |
| `radius-2xl` | 20px | `rounded-[20px]` | Hero Cards |
| `radius-full` | 9999px | `rounded-full` | Pills, Avatare, FABs |

### Anwendungsregeln

```
Buttons:     rounded-xl (12px)
Inputs:      rounded-lg (8px)
Cards:       rounded-xl (12px) bis rounded-2xl (16px)
Modals:      rounded-2xl (16px)
Badges:      rounded-full
Avatare:     rounded-full
```

---

## 6. Schatten

### 6.1 Shadow Scale

| Token | Wert | Verwendung |
|-------|------|------------|
| `shadow-xs` | `0 1px 2px rgba(0,0,0,0.04)` | Subtile Erhebung |
| `shadow-sm` | `0 2px 4px rgba(0,0,0,0.06)` | Inputs, kleine Cards |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | ⭐ Standard Cards |
| `shadow-lg` | `0 8px 24px rgba(0,0,0,0.12)` | Hover States, Dropdowns |
| `shadow-xl` | `0 16px 48px rgba(0,0,0,0.16)` | Modals, Dialoge |

### 6.2 Colored Shadows (für Buttons)

```css
/* Primary Button Shadow */
box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);

/* Success Button Shadow */
box-shadow: 0 4px 14px rgba(34, 197, 94, 0.35);

/* Error Button Shadow */
box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
```

---

## 7. Komponenten-Spezifikationen

### 7.1 Buttons

#### Primary Button
```css
background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
color: white;
padding: 12px 24px;
border-radius: 12px;
font-weight: 600;
font-size: 15px;
box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
transition: all 0.2s ease;

/* Hover */
transform: translateY(-1px);
box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);

/* Active */
transform: translateY(0);
```

#### Secondary Button (Outline)
```css
background: white;
color: #4F46E5;
border: 1.5px solid #E2E8F0;
padding: 12px 24px;
border-radius: 12px;
font-weight: 600;

/* Hover */
background: #F8FAFC;
border-color: #4F46E5;
```

#### Ghost Button
```css
background: transparent;
color: #64748B;
padding: 12px 24px;
border-radius: 12px;

/* Hover */
background: #F1F5F9;
color: #334155;
```

#### Danger Button
```css
background: #EF4444;
color: white;
/* Nur für destruktive Aktionen! */
```

### 7.2 Cards

#### Standard Card
```css
background: white;
border-radius: 16px;
padding: 24px;
border: 1px solid #E2E8F0;
box-shadow: 0 4px 12px rgba(0,0,0,0.08);

/* Hover (wenn interaktiv) */
border-color: #C7D2FE;
box-shadow: 0 8px 24px rgba(0,0,0,0.12);
transform: translateY(-2px);
```

#### Elevated Card
```css
/* Wie Standard, aber mehr Shadow */
box-shadow: 0 8px 24px rgba(0,0,0,0.12);
```

### 7.3 Inputs

```css
background: white;
border: 1.5px solid #E2E8F0;
border-radius: 10px;
padding: 12px 16px;
font-size: 16px; /* Verhindert iOS Zoom */
color: #0F172A;
transition: all 0.2s ease;

/* Placeholder */
::placeholder { color: #94A3B8; }

/* Focus */
border-color: #4F46E5;
box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
outline: none;

/* Error */
border-color: #EF4444;
box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
```

### 7.4 Modals/Dialoge

```css
background: white;
border-radius: 20px;
padding: 24px;
box-shadow: 0 16px 48px rgba(0,0,0,0.16);
max-width: 480px;
width: 90%;

/* Backdrop */
background: rgba(15, 23, 42, 0.6);
backdrop-filter: blur(4px);
```

### 7.5 Tags/Badges

```css
display: inline-flex;
align-items: center;
gap: 6px;
padding: 4px 12px;
border-radius: 9999px;
font-size: 12px;
font-weight: 500;

/* Variants */
.badge-default { background: #F1F5F9; color: #64748B; }
.badge-primary { background: #EEF2FF; color: #4F46E5; }
.badge-success { background: #F0FDF4; color: #16A34A; }
.badge-warning { background: #FFFBEB; color: #D97706; }
.badge-error   { background: #FEF2F2; color: #DC2626; }
```

---

## 8. Animationen & Transitions

### 8.1 Transition Timing

| Token | Dauer | Easing | Verwendung |
|-------|-------|--------|------------|
| `fast` | 150ms | ease-out | Hover, Fokus |
| `normal` | 200ms | ease | ⭐ Standard |
| `slow` | 300ms | ease-in-out | Modals, große Änderungen |
| `slower` | 400ms | cubic-bezier | Page Transitions |

### 8.2 Standard Transitions

```css
/* Für alle interaktiven Elemente */
transition: all 0.2s ease;

/* Für Modals */
transition: opacity 0.2s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
```

### 8.3 Hover Effects

```css
/* Subtle Lift (Cards, Buttons) */
transform: translateY(-2px);

/* Scale (Icons, kleine Elemente) */
transform: scale(1.05);

/* Glow (Primary Buttons) */
box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
```

---

## 9. Responsive Design

### 9.1 Breakpoints

| Token | Wert | Tailwind | Beschreibung |
|-------|------|----------|--------------|
| `sm` | 640px | `sm:` | Große Phones |
| `md` | 768px | `md:` | Tablets |
| `lg` | 1024px | `lg:` | Laptops |
| `xl` | 1280px | `xl:` | Desktops |
| `2xl` | 1536px | `2xl:` | Große Screens |

### 9.2 Mobile-First Patterns

```jsx
// Container
className="p-4 md:p-6 lg:p-8"

// Grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"

// Typography
className="text-xl md:text-2xl lg:text-3xl"

// Flex Direction
className="flex flex-col md:flex-row"

// Hide/Show
className="hidden md:block"  // Hide on mobile
className="block md:hidden"  // Show only on mobile
```

### 9.3 Touch Targets

```css
/* Minimum 44x44px für Touch-Elemente */
min-height: 44px;
min-width: 44px;

/* Oder mit Tailwind */
className="min-h-[44px] min-w-[44px]"
```

---

## 10. Icons

### 10.1 Library: Lucide React

```jsx
import { ChevronRight, Plus, X } from 'lucide-react';
```

### 10.2 Icon Sizes

| Context | Größe | Tailwind |
|---------|-------|----------|
| Inline mit Text | 16px | `size={16}` |
| Buttons | 18px | `size={18}` |
| Card Headers | 20px | `size={20}` |
| Feature Icons | 24px | `size={24}` |
| Hero Icons | 32-48px | `size={32}` |

### 10.3 Icon Styling

```jsx
// Standard
<Icon size={20} className="text-slate-500" />

// In Buttons
<Icon size={18} className="mr-2" />

// Stroke Width (default 2, leichter: 1.75)
<Icon size={20} strokeWidth={1.75} />
```

---

## 11. Tailwind-Klassen Referenz

### 11.1 Häufig verwendete Kombinationen

```jsx
// Standard Card
className="bg-white rounded-xl p-6 border border-slate-200 shadow-md"

// Elevated Card
className="bg-white rounded-2xl p-6 shadow-lg"

// Primary Button
className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/35 hover:-translate-y-0.5 transition-all"

// Secondary Button
className="bg-white border border-slate-200 text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:border-indigo-500 hover:bg-slate-50 transition-all"

// Input
className="w-full px-4 py-3 rounded-lg border border-slate-200 text-base focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 outline-none transition-all"

// Badge
className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600"

// Section Title
className="text-2xl font-bold text-slate-900 tracking-tight"

// Muted Text
className="text-sm text-slate-500"

// Modal Backdrop
className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"

// Modal Content
className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-[90%]"
```

---

## 12. Migration Checkliste

Bei der Aktualisierung von Komponenten:

- [ ] Ersetze `#3A7FA7` → `#4F46E5` (Indigo)
- [ ] Ersetze `#3DA389` → `#7C3AED` (Violet für Gradients)
- [ ] Ersetze `rounded-md/lg` → `rounded-xl` für Cards
- [ ] Ersetze harte Schatten → `shadow-md` oder `shadow-lg`
- [ ] Ersetze `style={{}}` → Tailwind Klassen
- [ ] Entferne `useBranding` wo nicht für Partner-Theming nötig
- [ ] Füge Hover-States hinzu (`hover:`, `transition-all`)
- [ ] Prüfe Mobile-Responsiveness (`md:`, `lg:`)
- [ ] Prüfe Touch-Target-Größen (min 44px)

---

## 13. Partner Branding

Partner können diese CSS-Variablen überschreiben:

```css
:root {
  --primary-accent: #4F46E5;
  --primary-accent-light: #EEF2FF;
  --primary-accent-hover: #4338CA;
  --header-gradient: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  --button-gradient: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
  --sidebar-bg-color: #1E293B;
  --sidebar-text-color: #F8FAFC;
}
```

---

**Version:** 2.0.0
**Letzte Aktualisierung:** 2025-12-31
**Status:** Aktiv
