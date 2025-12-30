# Karriereheld Styling Guide

## Übersicht

Dieser Guide definiert den verbindlichen Styling-Standard für die Karriereheld App.
**Ziel:** Maximale Konsistenz, Partner-Branding-Fähigkeit, Top Mobile/Tablet UX.

---

## Architektur-Prinzip

```
┌─────────────────────────────────────────────────────────────────┐
│                    STYLING ARCHITEKTUR                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   TAILWIND CLASSES          │    CSS VARIABLES                  │
│   (Statische Styles)        │    (Partner-Branding)             │
│                             │                                   │
│   ✓ Layout (flex, grid)     │    ✓ Farben (--primary-accent)    │
│   ✓ Spacing (p-4, gap-3)    │    ✓ Gradients (--header-gradient)│
│   ✓ Responsive (md:, lg:)   │    ✓ Semantic Colors              │
│   ✓ Hover/Focus States      │                                   │
│   ✓ Transitions             │                                   │
│                             │                                   │
├─────────────────────────────┴───────────────────────────────────┤
│                                                                 │
│                    THEMED COMPONENTS                            │
│                    (Kombinieren beides)                         │
│                                                                 │
│   <Card>        - Partner-branded Card                          │
│   <Button>      - Partner-branded Button                        │
│   <Input>       - Partner-branded Input                         │
│   <Badge>       - Partner-branded Badge                         │
│   <Header>      - Partner-branded Header                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Regeln

### 1. WANN TAILWIND VERWENDEN

```jsx
// ✅ Layout & Struktur
<div className="flex items-center justify-between gap-4">

// ✅ Spacing
<div className="p-6 m-4 space-y-4">

// ✅ Responsive Design
<div className="flex flex-col md:flex-row lg:grid lg:grid-cols-3">

// ✅ Hover/Focus States (bei statischen Farben)
<button className="hover:bg-slate-100 focus:ring-2 focus:ring-blue-500">

// ✅ Transitions & Animations
<div className="transition-all duration-200 ease-out">

// ✅ Typography (wenn nicht gebrandedt)
<p className="text-sm text-slate-600 leading-relaxed">

// ✅ Borders & Radius (statisch)
<div className="rounded-xl border border-slate-200">
```

### 2. WANN CSS VARIABLES (INLINE) VERWENDEN

```jsx
// ✅ Partner-Farben
style={{ color: 'var(--primary-accent)' }}
style={{ background: 'var(--header-gradient)' }}

// ✅ Dynamische/berechnete Werte
style={{ width: `${progress}%` }}

// ✅ Branded Buttons
style={{ background: 'var(--button-gradient)' }}

// ✅ Themed Backgrounds
style={{ background: 'var(--card-bg-color)' }}
```

### 3. NIEMALS

```jsx
// ❌ Hardcodierte Farben
style={{ color: '#3A7FA7' }}           // → var(--primary-accent)
style={{ background: '#ef4444' }}       // → var(--color-error)

// ❌ Hardcodiertes Spacing
style={{ padding: '24px' }}             // → className="p-6"
style={{ marginBottom: '16px' }}        // → className="mb-4"

// ❌ Inline Media Queries
style={{ display: isMobile ? 'none' : 'flex' }}  // → className="hidden md:flex"

// ❌ Doppelte Definitionen
className="p-4" style={{ padding: '20px' }}  // Wähle eines!
```

---

## Responsive Breakpoints

```jsx
// Standard Breakpoints (Tailwind)
sm:   640px   // Große Phones (Landscape)
md:   768px   // Tablets
lg:   1024px  // Kleine Laptops / iPad Pro
xl:   1280px  // Desktops
2xl:  1536px  // Große Screens

// Verwendung
<div className="
  flex flex-col          // Mobile: Stack
  md:flex-row            // Tablet+: Row
  lg:grid lg:grid-cols-3 // Desktop: 3-Column Grid
">

// Touch-Friendly Sizing (Mobile)
<button className="
  min-h-[44px]           // iOS minimum touch target
  p-3 md:p-2             // Größeres Padding auf Mobile
">
```

---

## Partner-Branding CSS Variables

Diese Variables werden von `PartnerContext` gesetzt und können für jedes Partner-Branding angepasst werden:

### Farben

| Variable | Beschreibung | Default |
|----------|--------------|---------|
| `--primary-accent` | Hauptfarbe | `#3A7FA7` |
| `--primary-accent-light` | Helle Variante | `#E8F4F8` |
| `--primary-accent-hover` | Hover-State | `#2D6485` |

### Gradients

| Variable | Beschreibung |
|----------|--------------|
| `--header-gradient` | Header-Hintergrund |
| `--button-gradient` | Primär-Button Hintergrund |
| `--app-bg-color` | App-Hintergrund |

### Text

| Variable | Beschreibung |
|----------|--------------|
| `--text-main` | Haupttext |
| `--text-secondary` | Sekundärtext |
| `--text-muted` | Gedämpfter Text |

### Semantic Colors

| Variable | Beschreibung |
|----------|--------------|
| `--color-success` | Erfolg (Grün) |
| `--color-error` | Fehler (Rot) |
| `--color-warning` | Warnung (Orange) |
| `--color-info` | Info (Blau) |

---

## Themed Components

### Card

```jsx
import { Card } from '@/components/ui/themed';

// Basic
<Card>Content</Card>

// Variants
<Card variant="elevated">Raised Card</Card>
<Card variant="outlined">Bordered Card</Card>
<Card variant="interactive" onClick={handleClick}>Clickable</Card>

// With Header
<Card>
  <Card.Header gradient>
    <Card.Title>Titel</Card.Title>
    <Card.Actions><Button>Action</Button></Card.Actions>
  </Card.Header>
  <Card.Body>Content</Card.Body>
</Card>
```

### Button

```jsx
import { Button } from '@/components/ui/themed';

// Variants
<Button variant="primary">Primär</Button>     // Gradient
<Button variant="secondary">Sekundär</Button> // Outline
<Button variant="ghost">Ghost</Button>        // Transparent
<Button variant="danger">Löschen</Button>     // Rot

// Sizes
<Button size="sm">Klein</Button>
<Button size="md">Normal</Button>
<Button size="lg">Groß</Button>

// States
<Button loading>Lädt...</Button>
<Button disabled>Deaktiviert</Button>

// With Icon
<Button icon={<Save />}>Speichern</Button>
```

### Input

```jsx
import { Input, Textarea, Select } from '@/components/ui/themed';

// Basic
<Input placeholder="Name eingeben" />

// With Label
<Input label="E-Mail" type="email" required />

// States
<Input error="Pflichtfeld" />
<Input success />

// Textarea
<Textarea label="Beschreibung" rows={4} />

// Select
<Select label="Kategorie" options={options} />
```

### Badge

```jsx
import { Badge } from '@/components/ui/themed';

// Variants
<Badge variant="success">Abgeschlossen</Badge>
<Badge variant="warning">In Bearbeitung</Badge>
<Badge variant="error">Fehler</Badge>
<Badge variant="info">Neu</Badge>
<Badge variant="default">Standard</Badge>
```

---

## Layout Patterns

### Page Layout

```jsx
// Standard Page
<div className="min-h-screen p-4 md:p-6 lg:p-8">
  <div className="max-w-4xl mx-auto space-y-6">
    {/* Content */}
  </div>
</div>

// Full-Width Header + Content
<div className="min-h-screen">
  <header style={{ background: 'var(--header-gradient)' }}
          className="p-4 md:p-6">
    {/* Branded Header */}
  </header>
  <main className="p-4 md:p-6 lg:p-8">
    {/* Content */}
  </main>
</div>
```

### Card Grid

```jsx
// Responsive Grid
<div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>
```

### Form Layout

```jsx
// Vertical Form
<form className="space-y-4 max-w-md">
  <Input label="Name" />
  <Input label="E-Mail" type="email" />
  <Textarea label="Nachricht" />
  <Button type="submit" className="w-full">Absenden</Button>
</form>

// Horizontal Form (Desktop)
<form className="space-y-4">
  <div className="grid gap-4 md:grid-cols-2">
    <Input label="Vorname" />
    <Input label="Nachname" />
  </div>
  <Input label="E-Mail" type="email" />
</form>
```

---

## Mobile-First Checklist

Jede Komponente MUSS diese Kriterien erfüllen:

- [ ] **Touch Targets** min. 44x44px
- [ ] **Readable Text** min. 16px auf Mobile
- [ ] **No Horizontal Scroll** auf jeder Viewport-Größe
- [ ] **Stack on Mobile** (`flex-col` → `md:flex-row`)
- [ ] **Full-Width Buttons** auf Mobile (`w-full md:w-auto`)
- [ ] **Reduced Padding** auf Mobile (`p-4 md:p-6`)
- [ ] **No Hover-Only States** (wichtige Infos auch ohne Hover sichtbar)

---

## Migration bestehender Komponenten

### Schritt 1: Identify

```jsx
// VORHER: Gemischte Styles
<div
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
  }}
>
```

### Schritt 2: Separate

```jsx
// NACHHER: Getrennt nach Verantwortung
<div
  className="flex items-center gap-4 p-6 rounded-xl border"
  style={{
    backgroundColor: 'var(--card-bg-color)',
    borderColor: 'var(--border-color)',
  }}
>
```

### Schritt 3: Use Themed Component (wenn verfügbar)

```jsx
// IDEAL: Themed Component
<Card className="flex items-center gap-4">
  {/* Content */}
</Card>
```

---

## ESLint Rules (Empfohlen)

```json
{
  "rules": {
    "no-restricted-syntax": [
      "warn",
      {
        "selector": "JSXAttribute[name.name='style'] Literal[value=/^#[0-9a-fA-F]{3,6}$/]",
        "message": "Hardcodierte Farben vermeiden. Nutze CSS Variables (var(--...)) oder Tailwind."
      }
    ]
  }
}
```

---

## Zusammenfassung

| Kategorie | Methode |
|-----------|---------|
| Layout, Spacing, Responsive | Tailwind Classes |
| Partner-Farben, Gradients | CSS Variables |
| Hover/Focus (statisch) | Tailwind Classes |
| Hover/Focus (branded) | CSS Variables |
| Wiederverwendbare UI | Themed Components |

**Goldene Regel:** Wenn es für jeden Partner gleich aussehen soll → Tailwind.
Wenn es Partner-spezifisch sein kann → CSS Variables.
