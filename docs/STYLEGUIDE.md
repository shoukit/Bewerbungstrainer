# Karriereheld - Style Guide

**Version:** 1.0.0
**Stand:** Dezember 2025

---

## Inhaltsverzeichnis

1. [Übersicht](#1-übersicht)
2. [Farbpalette](#2-farbpalette)
3. [Typografie](#3-typografie)
4. [Spacing & Layout](#4-spacing--layout)
5. [UI-Komponenten](#5-ui-komponenten)
6. [Icons](#6-icons)
7. [Animationen](#7-animationen)
8. [Partner-Theming (White-Label)](#8-partner-theming-white-label)
9. [Duplikate & Inkonsistenzen](#9-duplikate--inkonsistenzen)
10. [Refactoring-Empfehlungen](#10-refactoring-empfehlungen)

---

## 1. Übersicht

### Design-Philosophie

Karriereheld folgt einem **Ocean Blue/Teal Theme** mit klaren, professionellen Farben, die Vertrauen und Kompetenz vermitteln. Das Design ist:

- **Clean & Modern**: Viel Weißraum, abgerundete Ecken, subtile Schatten
- **Consistent**: Einheitliche Patterns für Cards, Buttons, Inputs
- **Themeable**: CSS-Variablen ermöglichen White-Label-Anpassungen
- **Accessible**: Kontrastreiche Farben, klare Hierarchie

### Technologie-Stack für Styling

| Technologie | Verwendung |
|-------------|------------|
| **Tailwind CSS** | Utility-First Styling |
| **CSS Variables** | Theming & White-Label |
| **Inline Styles** | WordPress-Konflikt-Vermeidung |
| **Framer Motion** | Animationen |
| **CVA** | Komponenten-Varianten |

---

## 2. Farbpalette

### 2.1 Primärfarben (Ocean Theme)

**Ocean Blue** - Primäre Akzentfarbe

| Stufe | Hex | RGB | Verwendung |
|-------|-----|-----|------------|
| 50 | `#E8F4F8` | 232, 244, 248 | Helle Hintergründe, Hover-States |
| 100 | `#D1E9F1` | 209, 233, 241 | Sekundäre Hintergründe |
| 200 | `#A8D8EA` | 168, 216, 234 | Borders, Dividers |
| 300 | `#7AC7E3` | 122, 199, 227 | Akzente |
| 400 | `#5FB3D8` | 95, 179, 216 | Hover-States |
| 500 | `#4A9EC9` | 74, 158, 201 | Sekundäre Buttons |
| **600** | **`#3A7FA7`** | 58, 127, 167 | **Primärfarbe** |
| 700 | `#2D6485` | 45, 100, 133 | Hover auf Primary |
| 800 | `#1F4963` | 31, 73, 99 | Text auf hellem Grund |
| 900 | `#12304A` | 18, 48, 74 | Dunkler Text |

**Ocean Teal** - Sekundäre Akzentfarbe

| Stufe | Hex | RGB | Verwendung |
|-------|-----|-----|------------|
| 50 | `#E6F7F4` | 230, 247, 244 | Erfolgs-Hintergründe |
| **500** | **`#3DA389`** | 61, 163, 137 | **Sekundärfarbe** |
| 600 | `#2E8A72` | 46, 138, 114 | Hover auf Secondary |
| 700 | `#22705B` | 34, 112, 91 | Dunkler Akzent |

### 2.2 Neutrale Farben (Slate)

| Stufe | Hex | Verwendung |
|-------|-----|------------|
| 50 | `#f8fafc` | Helle Hintergründe |
| 100 | `#f1f5f9` | Card-Hintergründe, Hover |
| 200 | `#e2e8f0` | Borders, Dividers |
| 300 | `#cbd5e1` | Disabled States |
| 400 | `#94a3b8` | Muted Text, Icons |
| 500 | `#64748b` | Sekundärer Text |
| 600 | `#475569` | Body Text |
| 700 | `#334155` | Überschriften |
| 800 | `#1e293b` | Starke Überschriften |
| **900** | **`#0f172a`** | **Haupttext** |

### 2.3 Semantische Farben

| Semantik | Hintergrund | Text | Border | Verwendung |
|----------|-------------|------|--------|------------|
| **Success** | `#f0fdf4` | `#15803d` | `#bbf7d0` | Erfolg, Positiv, Stärken |
| **Warning** | `#fffbeb` | `#b45309` | `#fde68a` | Warnung, Aufmerksamkeit |
| **Error** | `#fef2f2` | `#b91c1c` | `#fecaca` | Fehler, Negativ, Schwächen |
| **Info** | `#eff6ff` | `#1d4ed8` | `#bfdbfe` | Information, Neutral |

### 2.4 Score-basierte Farben

```javascript
// Aus src/config/colors.js
getScoreColors(score) {
  if (score >= 80) → green (Sehr gut)
  if (score >= 60) → blue (Gut)
  if (score >= 40) → amber (Befriedigend)
  else            → red (Verbesserungswürdig)
}
```

### 2.5 Schwierigkeits-Farben

| Schwierigkeit | Hintergrund | Text | Label |
|---------------|-------------|------|-------|
| **Leicht** | `#dcfce7` | `#166534` | Einsteiger |
| **Mittel** | `#fef3c7` | `#92400e` | Fortgeschritten |
| **Schwer** | `#fee2e2` | `#991b1b` | Experte |

---

## 3. Typografie

### 3.1 Font-Stack

```css
font-family: system-ui, -apple-system, BlinkMacSystemFont,
             'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### 3.2 Schriftgrößen

| Name | Größe | Line-Height | Tailwind | Verwendung |
|------|-------|-------------|----------|------------|
| **xs** | 10px | 14px | `text-[10px]` | Badges, Timestamps |
| **sm** | 12px | 16px | `text-xs` | Labels, Meta-Info |
| **base** | 14px | 20px | `text-sm` | Body, Beschreibungen |
| **md** | 16px | 24px | `text-base` | Standard-Text |
| **lg** | 18px | 28px | `text-lg` | Card-Titel |
| **xl** | 20px | 28px | `text-xl` | Section-Überschriften |
| **2xl** | 24px | 32px | `text-2xl` | Page-Titel |
| **3xl** | 30px | 36px | `text-3xl` | Hero-Überschriften |

### 3.3 Schriftgewichte

| Gewicht | Wert | Verwendung |
|---------|------|------------|
| Normal | 400 | Body Text |
| Medium | 500 | Buttons, Labels |
| Semibold | 600 | Card-Titel, Überschriften |
| Bold | 700 | Wichtige Überschriften |

### 3.4 Text-Hierarchie Klassen

```css
/* Aus index.css */
.text-label    { font-size: 12px; color: #64748b; }
.text-body     { font-size: 14px; color: #475569; line-height: 1.6; }
.text-body-muted { font-size: 12px; color: #64748b; }
```

---

## 4. Spacing & Layout

### 4.1 Spacing-Skala

| Name | Wert | Tailwind | Verwendung |
|------|------|----------|------------|
| 1 | 4px | `p-1`, `m-1` | Micro-Spacing |
| 2 | 8px | `p-2`, `gap-2` | Kompakte Elemente |
| 3 | 12px | `p-3`, `gap-3` | Standard Intra-Element |
| 4 | 16px | `p-4`, `gap-4` | Standard Inter-Element |
| 5 | 20px | `p-5` | Medium Spacing |
| 6 | 24px | `p-6`, `gap-6` | Card Padding |
| 8 | 32px | `p-8`, `gap-8` | Section Spacing |
| 12 | 48px | `py-12` | Large Sections |

### 4.2 Border-Radius

| Name | Wert | Verwendung |
|------|------|------------|
| **sm** | 6px | Kleine Buttons, Badges |
| **default** | 8px | Standard Buttons, Inputs |
| **lg** | 12px | Cards, Dialogs |
| **xl** | 16px | Feature Cards |
| **2xl** | 20px | Hero Cards |
| **3xl** | 24px | Dashboard Cards |
| **full** | 9999px | Pills, Circular Elements |

### 4.3 Schatten

| Name | CSS | Verwendung |
|------|-----|------------|
| **sm** | `0 1px 2px rgba(0,0,0,0.05)` | Subtile Elevation |
| **default** | `0 1px 3px rgba(0,0,0,0.1)` | Standard Cards |
| **md** | `0 4px 6px rgba(0,0,0,0.1)` | Elevated Cards |
| **lg** | `0 10px 15px rgba(0,0,0,0.1)` | Modals, Dropdowns |
| **xl** | `0 25px 50px rgba(0,0,0,0.15)` | Hero Elements |

### 4.4 Grid-Layouts

```css
/* Scenario Cards Grid */
display: grid;
grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
gap: 24px;

/* Dashboard Stats */
display: grid;
grid-template-columns: repeat(3, 1fr);
gap: 12px;
```

---

## 5. UI-Komponenten

### 5.1 Buttons

**Datei:** `src/components/ui/button.jsx`

#### Varianten

| Variante | Aussehen | Verwendung |
|----------|----------|------------|
| **default** | Gradient (Primary → Teal) | Haupt-CTAs |
| **solid** | Solid Primary Color | Alternative CTAs |
| **outline** | Border + Transparent | Sekundäre Aktionen |
| **secondary** | Light Background | Tertiäre Aktionen |
| **ghost** | Transparent | Subtile Aktionen |
| **link** | Text Only | Inline Links |
| **destructive** | Red | Löschen, Abbrechen |
| **success** | Green | Bestätigen |

#### Größen

| Größe | Höhe | Padding |
|-------|------|---------|
| **sm** | 32px | 4px 12px |
| **default** | 40px | 8px 20px |
| **lg** | 48px | 12px 32px |
| **icon** | 40x40px | 0 |

#### Beispiel

```jsx
<Button variant="default" size="lg">
  Starten
</Button>
```

### 5.2 Cards

**Datei:** `src/components/ui/card.jsx`

#### Varianten

| Variante | Beschreibung |
|----------|--------------|
| **default** | Weiß mit Border |
| **elevated** | Mit Shadow |
| **outline** | Ocean-Blue Border |
| **ghost** | Transparent |
| **gradient** | Blue-Teal Gradient Background |
| **ocean** | Ocean-Blue Background |

#### Sub-Komponenten

- `Card` - Container
- `CardHeader` - Kopfbereich
- `CardTitle` - Titel mit optionalem Icon
- `CardDescription` - Beschreibungstext
- `CardContent` - Hauptinhalt
- `CardFooter` - Fußbereich mit Border-Top

### 5.3 Inputs

**Datei:** `src/components/ui/input.jsx`

```jsx
// Styling
className={cn(
  'h-11 w-full rounded-xl border-2 px-4 py-2',
  'border-slate-200 bg-white text-slate-900',
  'focus:border-ocean-blue-400 focus:ring-2 focus:ring-ocean-blue-100',
  'placeholder:text-slate-400',
  'hover:border-slate-300',
  'disabled:opacity-50 disabled:bg-slate-50'
)}
```

### 5.4 Textarea

**Datei:** `src/components/ui/textarea.jsx`

Gleiche Styles wie Input, aber mit `min-h-[100px]` und `resize-none`.

### 5.5 Badges

**Datei:** `src/components/ui/badge.jsx`

#### Varianten

| Variante | Hintergrund | Text |
|----------|-------------|------|
| **default** | slate-100 | slate-700 |
| **secondary** | slate-200 | slate-800 |
| **success** | green-100 | green-800 |
| **warning** | amber-100 | amber-800 |
| **error** | red-100 | red-800 |
| **info** | blue-100 | blue-800 |

#### Größen

| Größe | Padding | Font-Size |
|-------|---------|-----------|
| **sm** | 1.5px 6px | 10px |
| **default** | 4px 8px | 12px |
| **lg** | 6px 10px | 14px |

### 5.6 Dialog/Modal

**Datei:** `src/components/ui/dialog.jsx`

Built on **Radix UI Dialog**

```jsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>Titel</DialogTitle>
      <DialogDescription>Beschreibung</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="ghost">Abbrechen</Button>
      <Button>Bestätigen</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 5.7 Fullscreen Loader

**Datei:** `src/components/ui/fullscreen-loader.jsx`

```jsx
<FullscreenLoader
  isLoading={true}
  message="Wird geladen..."
  subMessage="Bitte warten"
/>
```

---

## 6. Icons

### 6.1 Icon-Bibliothek

**Lucide React** - Konsistente, moderne Icons

```jsx
import { Play, Pause, Check, X, ChevronRight } from 'lucide-react';
```

### 6.2 Icon-Größen

```css
/* Aus index.css */
.icon-xs { width: 12px; height: 12px; }
.icon-sm { width: 16px; height: 16px; }
.icon-md { width: 20px; height: 20px; }
.icon-lg { width: 24px; height: 24px; }
```

### 6.3 Icon-Farben

| Kontext | Farbe | Variable |
|---------|-------|----------|
| Primary | `#3A7FA7` | `--icon-primary` |
| Secondary | `#3DA389` | `--icon-secondary` |
| Muted | `#94a3b8` | `--icon-muted` |
| Success | `#16a34a` | - |
| Error | `#dc2626` | - |

---

## 7. Animationen

### 7.1 Framer Motion Patterns

**Fade In:**
```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
/>
```

**Slide Up:**
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
/>
```

**Scale:**
```jsx
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
/>
```

**Stagger Children:**
```jsx
<motion.div
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }}
/>
```

### 7.2 CSS Animationen

```css
/* Aus index.css */
.animate-fade-in { animation: fade-in 0.3s ease-in-out; }
.animate-slide-in-up { animation: slide-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
```

### 7.3 Transitions

```css
/* Standard Transition */
transition: all 0.2s ease;

/* Interactive Elements */
.interactive-scale {
  transition: all 150ms;
}
.interactive-scale:hover { transform: scale(1.02); }
.interactive-scale:active { transform: scale(0.98); }
```

---

## 8. Partner-Theming (White-Label)

### 8.1 CSS-Variablen

**Datei:** `src/config/partners.js` - `DEFAULT_BRANDING`

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `--app-bg-color` | Gradient | App-Hintergrund |
| `--sidebar-bg-color` | `#ffffff` | Sidebar-Hintergrund |
| `--sidebar-text-color` | `#0f172a` | Sidebar-Text |
| `--sidebar-active-bg` | `#E8F4F8` | Aktiver Menüpunkt |
| `--sidebar-active-text` | `#2D6485` | Aktiver Text |
| `--primary-accent` | `#3A7FA7` | Primärfarbe |
| `--primary-accent-light` | `#E8F4F8` | Helle Variante |
| `--primary-accent-hover` | `#2D6485` | Hover-State |
| `--button-gradient` | `linear-gradient(...)` | Button-Gradient |
| `--header-gradient` | `linear-gradient(...)` | Header-Gradient |

### 8.2 Theming-Hooks

**useBranding Hook:**

```jsx
import { useBranding } from '@/hooks/useBranding';

const { headerGradient, primaryAccent, cardBgColor } = useBranding();
```

**useBrandingStyles Hook:**

```jsx
import { useBrandingStyles } from '@/hooks/useBranding';

const styles = useBrandingStyles();
// styles.primaryButton, styles.secondaryButton, styles.card, etc.
```

### 8.3 Partner-Beispiele

| Partner | Primary Color | Sidebar |
|---------|---------------|---------|
| **Karriereheld (Default)** | Ocean Blue `#3A7FA7` | Weiß |
| **Vertriebsakademie Müller** | Amber `#d97706` | Navy |
| **Sales Academy Pro** | Emerald `#059669` | Dark Green |
| **TechSales Institute** | Violet `#7c3aed` | Purple |
| **En Garde Training** | Orange `#ea580c` | Charcoal |
| **Stärkentrainer** | Olive `#6a8032` | Dark Gray |
| **Leadership ID** | Petrol `#1a5f7a` | Teal |

---

## 9. Duplikate & Inkonsistenzen

### 9.1 Identifizierte Duplikate

#### COLORS Konstante (14 Dateien!)

```
src/components/simulator/SimulatorDashboard.jsx
src/components/TrainingSessionDetailView.jsx
src/components/InterviewerProfile.jsx
src/components/MicrophoneSelector.jsx
src/components/MicrophoneTestDialog.jsx
src/components/rhetorik-gym/GameSession.jsx
src/components/RoleplayVariablesDialog.jsx
src/components/session-detail/SessionHeader.jsx
src/components/SessionSidebar.jsx
src/components/simulator/ImmediateFeedback.jsx
src/components/simulator/SessionComplete.jsx
src/components/simulator/SimulatorWizard.jsx
src/components/ui/button.jsx
```

**Problem:** Jede Datei definiert eigene `COLORS`-Konstante statt `src/config/colors.js` zu verwenden.

#### DIFFICULTY_COLORS/STYLES (2 Dateien)

```
src/components/simulator/SimulatorDashboard.jsx
src/components/video-training/VideoTrainingDashboard.jsx
```

**Problem:** Doppelte Definition von Schwierigkeitsfarben.

### 9.2 Inkonsistente Border-Radius

| Wert | Anzahl Dateien |
|------|----------------|
| 16px | 12 |
| 24px | 9 |
| 8px | viele |
| 12px | viele |

**Problem:** Keine klare Konvention, wann welcher Radius verwendet wird.

### 9.3 Hardcoded Colors

**668 Hex-Farben** in Component-Dateien statt CSS-Variablen oder zentrale Konstanten.

Besonders viele in:
- `SessionHistory.jsx` (68 Vorkommen)
- `VideoTrainingWizard.jsx` (47 Vorkommen)
- `VideoTrainingSession.jsx` (40 Vorkommen)
- `SimulatorSession.jsx` (35 Vorkommen)

### 9.4 Inline Styles vs. Tailwind

Manche Komponenten verwenden **Inline Styles** (button.jsx), andere **Tailwind** (card.jsx).

**Grund:** WordPress/Elementor CSS-Konflikte bei manchen Komponenten.

**Inkonsistenz:** Nicht dokumentiert, welche Komponenten warum Inline Styles verwenden.

---

## 10. Refactoring-Empfehlungen

### 10.1 Zentralisierung der Farben

**Priorität: HOCH**

1. **Alle `COLORS`-Konstanten entfernen** und durch `import { COLORS } from '@/config/colors'` ersetzen.

2. **DIFFICULTY_COLORS nach constants.js verschieben:**
```javascript
// src/config/constants.js
export const DIFFICULTY_COLORS = {
  easy: { bg: '#dcfce7', text: '#166534', label: 'Einsteiger' },
  intermediate: { bg: '#fef3c7', text: '#92400e', label: 'Fortgeschritten' },
  hard: { bg: '#fee2e2', text: '#991b1b', label: 'Experte' },
};
```

### 10.2 Border-Radius Standardisierung

**Priorität: MITTEL**

Konvention einführen:
- **8px**: Buttons, Inputs, Badges
- **12px**: kleine Cards, Tooltips
- **16px**: Standard Cards
- **24px**: Dashboard Cards, Dialogs

### 10.3 Theming-Konsistenz

**Priorität: HOCH**

1. **Alle hardcoded Farben durch CSS-Variablen ersetzen**, die vom Partner-Theming überschrieben werden können.

2. **useBranding Hook überall verwenden:**
```jsx
// Statt
const primaryColor = '#3A7FA7';

// Verwenden
const { primaryAccent } = useBranding();
```

### 10.4 Component Library Vervollständigung

**Priorität: MITTEL**

Fehlende UI-Komponenten erstellen:
- `Select` (nicht nur native select)
- `Checkbox`
- `Radio`
- `Switch/Toggle`
- `Tabs`
- `Progress`
- `Slider`

### 10.5 Dokumentation der Inline-Style-Entscheidung

**Priorität: NIEDRIG**

Kommentar in betroffenen Komponenten:
```javascript
/**
 * HINWEIS: Diese Komponente verwendet Inline Styles statt Tailwind,
 * um CSS-Konflikte mit WordPress/Elementor zu vermeiden.
 */
```

### 10.6 Storybook/Showcase

**Priorität: NIEDRIG**

Eine Showcase-Seite erstellen, die alle UI-Komponenten zeigt:
- Alle Button-Varianten
- Alle Card-Varianten
- Alle Badge-Varianten
- Partner-Theme-Vorschau

---

## Anhang: Quick Reference

### Farben (Schnellreferenz)

```javascript
// Primary
'#3A7FA7' // Ocean Blue 600 - Hauptfarbe
'#3DA389' // Ocean Teal 500 - Sekundärfarbe
'#E8F4F8' // Ocean Blue 50 - Helle Hintergründe

// Text
'#0f172a' // Slate 900 - Haupttext
'#64748b' // Slate 500 - Sekundärer Text
'#94a3b8' // Slate 400 - Muted Text

// Semantisch
'#16a34a' // Success Green
'#dc2626' // Error Red
'#f59e0b' // Warning Amber
'#3b82f6' // Info Blue
```

### Spacing (Schnellreferenz)

```javascript
4   // Micro
8   // Compact
12  // Standard Inner
16  // Standard Outer
24  // Card Padding
32  // Section Gap
```

### Transitions (Schnellreferenz)

```css
transition: all 0.2s ease;      /* Standard */
transition: all 0.15s ease;     /* Quick */
transition: all 0.3s ease;      /* Smooth */
```

---

**Dokumentversion:** 1.0.0
**Letzte Aktualisierung:** Dezember 2025
