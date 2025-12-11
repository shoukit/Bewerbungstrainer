# CLAUDE.md - KI-Assistenten-Leitfaden für Bewerbungstrainer

## Projektübersicht

**Bewerbungstrainer** ist ein KI-gestütztes WordPress-Plugin für realistische Interview- und Gesprächsvorbereitung. Die Anwendung kombiniert sprachbasierte KI-Interaktion mit intelligenter Feedback-Generierung.

### Hauptzweck
- Realistische Voice-Interviews mit KI-gesteuerten Gesprächspartnern
- Detailliertes Feedback zu verbaler und paraverbaler Kommunikation
- Gamifiziertes Rhetorik-Training (Rhetorik-Gym)
- Szenario-basiertes Training mit strukturiertem Feedback
- White-Label-Fähigkeit für Partner-Integration

---

## Technologie-Stack

### Frontend
| Technologie | Version | Verwendung |
|-------------|---------|------------|
| **React** | 18.3.1 | UI-Framework (JSX, nicht TypeScript) |
| **Vite** | 7.2.2 | Build-Tool und Dev-Server |
| **Tailwind CSS** | 3.4.15 | Utility-First Styling |
| **Radix UI** | 1.1.2 | Headless UI-Komponenten (Dialog) |
| **Framer Motion** | 12.23.25 | Animationen |
| **Lucide React** | 0.460.0 | Icon-Bibliothek |

### KI-Integration
| Service | SDK | Verwendung |
|---------|-----|------------|
| **ElevenLabs** | @elevenlabs/react 0.1.0 | Conversational AI (Voice-Interviews) |
| **Google Gemini** | @google/generative-ai 0.21.0 | Feedback-Generierung, Audio-Analyse |

### Backend
| Technologie | Version | Verwendung |
|-------------|---------|------------|
| **WordPress** | 6.0+ | CMS und Backend-Framework |
| **PHP** | 7.4+ | Server-seitige Logik |
| **MySQL** | (via WordPress) | Datenbank |
| **DomPDF** | 3.1 | PDF-Export |

### Entwicklungswerkzeuge
| Tool | Version | Verwendung |
|------|---------|------------|
| **ESLint** | 9.13.0 | Code-Linting |
| **PostCSS** | 8.4.49 | CSS-Verarbeitung |
| **Autoprefixer** | 10.4.20 | Browser-Präfixe |

---

## Architektur

### Systemübersicht

```
┌─────────────────────────────────────────────────────────────────────┐
│                        WordPress Frontend                            │
├─────────────────────────────────────────────────────────────────────┤
│  React SPA (Vite Build)                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  Roleplay   │  │  Simulator  │  │ Rhetorik-   │  │  Session   │ │
│  │  Dashboard  │  │    App      │  │    Gym      │  │  History   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  Services Layer                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  ElevenLabs │  │   Gemini    │  │  WordPress  │                 │
│  │   Service   │  │   Service   │  │     API     │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     WordPress REST API                               │
├─────────────────────────────────────────────────────────────────────┤
│  /bewerbungstrainer/v1/*     │  /karriereheld/v1/*                  │
│  - Sessions CRUD             │  - Partner Config                    │
│  - Audio/Video Handler       │  - Login/Logout                      │
│  - Gemini Proxy              │  - User Management                   │
│  - Scenarios                 │                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      WordPress Database                              │
├─────────────────────────────────────────────────────────────────────┤
│  wp_bewerbungstrainer_sessions   │  wp_bewerbungstrainer_simulator  │
│  wp_bewerbungstrainer_games      │  Custom Post Types               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Externe KI-Services                             │
├─────────────────────────────────────────────────────────────────────┤
│  ElevenLabs Conversational AI    │  Google Gemini API               │
│  - Voice Synthesis (TTS)         │  - Text-Feedback                 │
│  - Speech Recognition (STT)      │  - Audio-Analyse (multimodal)    │
│  - Conversation Management       │  - Rhetorik-Game-Analyse         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Verzeichnisstruktur

```
Bewerbungstrainer/
├── bewerbungstrainer-plugin.php    # WordPress Plugin Hauptdatei
├── includes/                        # PHP Backend-Klassen
│   ├── class-api.php               # REST API Endpoints (73KB)
│   ├── class-database.php          # Haupt-Datenbank-Management
│   ├── class-simulator-database.php # Simulator-Datenbank
│   ├── class-simulator-api.php     # Simulator REST API
│   ├── class-simulator-admin.php   # Simulator Admin-Bereich
│   ├── class-game-database.php     # Rhetorik-Gym Datenbank
│   ├── class-game-api.php          # Rhetorik-Gym REST API
│   ├── class-gemini-handler.php    # Gemini AI Server-Proxy
│   ├── class-audio-handler.php     # Audio-Datei-Management
│   ├── class-video-handler.php     # Video-Datei-Management
│   ├── class-pdf-exporter.php      # PDF-Export mit DomPDF
│   ├── class-roleplay-scenarios.php # Custom Post Type: Szenarien
│   ├── class-whitelabel-partners.php # White-Label Partner-System
│   └── class-shortcodes.php        # WordPress Shortcodes
├── src/                             # React Frontend
│   ├── App.jsx                     # Haupt-App mit View-Router
│   ├── main.jsx                    # React Entry Point
│   ├── index.css                   # Tailwind + globale Styles
│   ├── components/                 # React-Komponenten
│   │   ├── RoleplayDashboard.jsx   # Hauptansicht: Szenario-Auswahl
│   │   ├── RoleplaySession.jsx     # Live-Interview mit ElevenLabs
│   │   ├── SessionHistory.jsx      # Übersicht vergangener Sessions
│   │   ├── SessionDetailView.jsx   # Detailansicht einer Session
│   │   ├── simulator/              # Szenario-Training Modul
│   │   │   ├── SimulatorApp.jsx
│   │   │   ├── SimulatorDashboard.jsx
│   │   │   ├── SimulatorSession.jsx
│   │   │   ├── SimulatorWizard.jsx
│   │   │   ├── ImmediateFeedback.jsx
│   │   │   └── SessionComplete.jsx
│   │   ├── rhetorik-gym/           # Gamification-Modul
│   │   │   ├── RhetorikGym.jsx     # Spielmodus-Auswahl
│   │   │   └── GameSession.jsx     # Aktive Spielsitzung
│   │   ├── session-detail/         # Session-Detail Komponenten
│   │   │   ├── AudioPlayerCard.jsx
│   │   │   ├── TranscriptCard.jsx
│   │   │   └── SessionHeader.jsx
│   │   ├── audio-analysis/         # Audio-Analyse Komponenten
│   │   │   ├── ConfidenceGauge.jsx
│   │   │   ├── PacingSlider.jsx
│   │   │   ├── TonalityCard.jsx
│   │   │   ├── FillerWordCard.jsx
│   │   │   └── PacingIssuesCard.jsx
│   │   ├── ui/                     # Basis UI-Komponenten
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── input.jsx
│   │   │   ├── textarea.jsx
│   │   │   ├── sidebar.jsx
│   │   │   └── ...
│   │   ├── LoginModal.jsx          # Benutzer-Authentifizierung
│   │   ├── Toast.jsx               # Benachrichtigungen
│   │   └── ...
│   ├── services/                   # API-Services
│   │   ├── gemini.js               # Google Gemini Integration
│   │   ├── elevenlabs.js           # ElevenLabs Basis-Service
│   │   ├── elevenlabs-convai.js    # ElevenLabs Conversational AI
│   │   └── wordpress-api.js        # WordPress REST API Client
│   ├── config/                     # Konfiguration
│   │   ├── constants.js            # Globale Konstanten
│   │   ├── partners.js             # White-Label Partner-Config
│   │   └── prompts/                # KI-Prompts
│   │       ├── feedbackPrompt.js   # Interview-Feedback Prompt
│   │       ├── audioAnalysisPrompt.js # Audio-Analyse Prompt
│   │       └── gamePrompts.js      # Rhetorik-Gym Prompts
│   ├── context/                    # React Context
│   │   └── PartnerContext.jsx      # White-Label Theming
│   ├── hooks/                      # Custom React Hooks
│   │   └── usePartnerTheming.js    # Partner-Theming Hook
│   ├── lib/                        # Utility-Bibliotheken
│   │   └── utils.js                # cn() für Tailwind, etc.
│   └── utils/                      # Hilfsfunktionen
│       └── parseJSON.js            # Sicheres JSON-Parsing
├── assets/                          # Statische Assets
│   ├── css/
│   │   └── admin.css               # WordPress Admin Styles
│   └── js/
├── dist/                            # Production Build (generiert)
│   └── assets/
│       ├── index.js                # React Bundle
│       └── wordpress-api.css       # CSS Bundle
├── vendor/                          # Composer Dependencies
│   └── dompdf/                     # PDF-Bibliothek
├── docs/                            # Zusätzliche Dokumentation
├── vite.config.js                   # Vite Build-Konfiguration
├── tailwind.config.js               # Tailwind CSS Konfiguration
├── package.json                     # Node.js Dependencies
├── composer.json                    # PHP Dependencies
└── .env.example                     # Umgebungsvariablen-Vorlage
```

---

## Haupt-Features

### 1. Live-Gespräch (Roleplay)

**Zweck:** Realistische Voice-Interviews mit KI-Interviewer

**Technische Umsetzung:**
- **ElevenLabs Conversational AI** für bidirektionale Sprachkommunikation
- **Dynamische Variablen** werden an den Agent übergeben:
  - `user_name` - Name des Bewerbers
  - `position` - Beworbene Position
  - `company` - Zielunternehmen
  - `conversation_style` - Gesprächsstil (friendly/critical/professional)
- **Session-Persistenz** in WordPress-Datenbank
- **Audio-Aufnahme** der gesamten Konversation

**Komponenten:**
- `RoleplayDashboard.jsx` - Szenario-Auswahl
- `RoleplaySession.jsx` - Live-Interview-UI
- `RoleplayVariablesDialog.jsx` - Variablen-Eingabe

**Datenfluss:**
```
Benutzer -> RoleplayDashboard -> Szenario auswählen
        -> RoleplayVariablesDialog -> Variablen eingeben
        -> RoleplaySession -> ElevenLabs Agent starten
        -> Live-Gespräch führen
        -> Session beenden -> Feedback generieren (Gemini)
        -> SessionDetailView -> Ergebnisse anzeigen
```

### 2. Szenario-Training (Simulator)

**Zweck:** Strukturiertes Training mit vordefinierten Fragen und sofortigem Feedback

**Technische Umsetzung:**
- **Frage-Antwort-Modus** mit Audio-Aufnahme
- **Sofortiges Feedback** nach jeder Antwort via Gemini
- **Eigene Datenbank-Tabelle** für Simulator-Sessions
- **Admin-Bereich** zur Szenario-Verwaltung

**Komponenten:**
- `SimulatorDashboard.jsx` - Szenario-Übersicht
- `SimulatorWizard.jsx` - Setup-Assistent
- `SimulatorSession.jsx` - Training-Durchführung
- `ImmediateFeedback.jsx` - Sofort-Feedback-Anzeige
- `SessionComplete.jsx` - Abschluss-Zusammenfassung

**Backend-Klassen:**
- `class-simulator-database.php` - Tabellen und CRUD
- `class-simulator-api.php` - REST Endpoints
- `class-simulator-admin.php` - WordPress Admin UI

### 3. Rhetorik-Gym (Gamification)

**Zweck:** Spielerisches Training zur Reduzierung von Füllwörtern und Verbesserung der Sprechweise

**Spielmodi:**
| Modus | Dauer | Beschreibung |
|-------|-------|--------------|
| **Der Klassiker** | 60s | Elevator Pitch zu einem Thema |
| **Zufalls-Thema** | 60s | Slot-Machine wählt das Thema |
| **Stress-Test** | 90s | Überraschungsfragen |

**Bewertungssystem:**
- **Füllwörter** werden gezählt und bestraft (-10 Punkte pro Füllwort)
- **Sprechtempo** wird analysiert (optimal: 120-150 WPM)
- **Inhalt** wird von Gemini bewertet (0-40 Punkte)
- **Gesamtscore** aus 100 Punkten

**Komponenten:**
- `RhetorikGym.jsx` - Spielmodus-Auswahl
- `GameSession.jsx` - Aktive Spielsitzung

**Gemini-Integration:**
- Optimierter Prompt für schnelle Analyse
- Nur relevante Metriken: Füllwörter, WPM, Transkript
- Lokale Score-Berechnung für Geschwindigkeit

### 4. Session-Verlauf (History)

**Zweck:** Übersicht und Analyse vergangener Trainingseinheiten

**Features:**
- Chronologische Liste aller Sessions
- Filterung nach Datum, Szenario, Bewertung
- Detail-Ansicht mit:
  - Audio-Wiedergabe
  - Vollständiges Transkript
  - Feedback-Anzeige
  - Audio-Analyse-Metriken

**Komponenten:**
- `SessionHistory.jsx` - Übersichtsliste
- `SessionDetailView.jsx` - Detailansicht
- `AudioPlayerCard.jsx` - Audio-Player
- `TranscriptCard.jsx` - Transkript-Anzeige

### 5. White-Label Partner-System

**Zweck:** Individuelle Branding-Anpassung für Partner-Integrationen

**Funktionsweise:**
- Partner-Slug via URL-Parameter: `?partner=xxx` oder `?pid=xxx`
- Konfiguration über WordPress Custom Post Type
- CSS-Variablen für vollständige Theming-Kontrolle

**Konfigurierbare Elemente:**
- App-Hintergrund (Gradient oder Farbe)
- Sidebar-Farben (Hintergrund, Text, Aktiv-Zustand)
- Button-Styles (Gradient oder Solid)
- Header-Design
- Icon-Farben
- Text-Farben
- Rahmenfarben
- Logo-URL
- Modul-Filterung (welche Features sichtbar sind)

**Technische Umsetzung:**
- `PartnerContext.jsx` - React Context für Theming
- `usePartnerTheming.js` - Hook für CSS-Variablen-Injection
- `class-whitelabel-partners.php` - Backend-Management
- REST API: `/karriereheld/v1/config?partner_slug=xxx`

---

## KI-Integration im Detail

### ElevenLabs Conversational AI

**Verwendung:** Live-Voice-Interviews

**Konfiguration:**
```javascript
// Dynamische Variablen an Agent übergeben
const overrides = {
  agent: {
    prompt: {
      prompt: systemPrompt // Enthält Szenario-spezifische Instruktionen
    }
  },
  variables: {
    user_name: "Max Mustermann",
    position: "Ausbildung zum Mechatroniker",
    company: "BMW AG",
    conversation_style: "professional"
  }
};
```

**Gesprächsstile:**
- `friendly` - Ermutigend, unterstützend
- `critical` - Herausfordernd, anspruchsvoll
- `professional` - Sachlich, neutral

**Audio-Handling:**
- Audio-Aufnahme via ElevenLabs SDK
- Download über ElevenLabs API (`/history/{conversation_id}/audio`)
- Speicherung in WordPress Uploads-Verzeichnis

### Google Gemini API

**Verwendung:** Feedback-Generierung, Audio-Analyse, Rhetorik-Game

**Model-Fallback-Strategie:**
```javascript
GEMINI_MODELS.FALLBACK_ORDER = [
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
];
```

**API-Funktionen:**

1. **Interview-Feedback** (`generateInterviewFeedback`)
   - Input: Gesprächs-Transkript
   - Output: Strukturiertes JSON mit Bewertungen
   - Kategorien: Kommunikation, Motivation, Professionalität, Vorbereitung

2. **Audio-Analyse** (`generateAudioAnalysis`)
   - Input: Audio-Datei (base64)
   - Output: Paraverbale Analyse
   - Metriken: Füllwörter, Sprechtempo, Tonalität, Selbstsicherheit

3. **Rhetorik-Game** (`analyzeRhetoricGame`)
   - Input: Audio-Datei + Thema
   - Output: Schnelle Analyse für Gamification
   - Optimiert für Geschwindigkeit

**Fehlerbehandlung:**
- Model-Not-Found (404) -> Nächstes Model versuchen
- API-Key-Fehler -> Benutzerfreundliche Fehlermeldung
- Netzwerkfehler -> Retry mit Backoff

---

## Datenbank-Schema

### wp_bewerbungstrainer_sessions (Roleplay)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | bigint(20) | Primärschlüssel |
| `user_id` | bigint(20) | WordPress User ID |
| `session_id` | varchar(255) | UUID der Session |
| `position` | varchar(255) | Beworbene Position |
| `company` | varchar(255) | Zielunternehmen |
| `conversation_id` | varchar(255) | ElevenLabs Conversation ID |
| `audio_filename` | varchar(255) | Audio-Dateiname |
| `audio_url` | text | Audio-URL |
| `transcript` | longtext | Gesprächs-Transkript |
| `feedback_json` | longtext | Gemini Feedback als JSON |
| `audio_analysis_json` | longtext | Audio-Analyse als JSON |
| `created_at` | datetime | Erstellungszeitpunkt |
| `updated_at` | datetime | Letztes Update |

### wp_bewerbungstrainer_simulator_* (Simulator)

Separate Tabellen für:
- Simulator-Sessions
- Simulator-Antworten
- Simulator-Feedback

### wp_bewerbungstrainer_games (Rhetorik-Gym)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | bigint(20) | Primärschlüssel |
| `user_id` | bigint(20) | WordPress User ID |
| `game_mode` | varchar(50) | Spielmodus |
| `topic` | varchar(255) | Thema |
| `score` | int(11) | Gesamtpunktzahl |
| `filler_count` | int(11) | Anzahl Füllwörter |
| `words_per_minute` | int(11) | Sprechtempo |
| `audio_url` | text | Audio-Aufnahme |
| `transcript` | longtext | Transkript |
| `analysis_json` | longtext | Gemini-Analyse |
| `created_at` | datetime | Erstellungszeitpunkt |

### Custom Post Types

| Post Type | Beschreibung |
|-----------|--------------|
| `roleplay_scenario` | Rollenspiel-Szenarien |
| `whitelabel_partner` | White-Label Partner |

---

## REST API Endpoints

### Namespace: bewerbungstrainer/v1

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/sessions` | Alle Sessions des Users |
| GET | `/sessions/{id}` | Einzelne Session |
| POST | `/sessions` | Neue Session erstellen |
| PUT | `/sessions/{id}` | Session aktualisieren |
| DELETE | `/sessions/{id}` | Session löschen |
| POST | `/audio/save-elevenlabs` | Audio von ElevenLabs speichern |
| POST | `/audio/upload` | Audio hochladen (base64) |
| GET | `/user/info` | Benutzer-Informationen |
| GET | `/settings` | Plugin-Einstellungen |
| GET | `/scenarios` | Verfügbare Szenarien |
| POST | `/gemini/feedback` | Feedback generieren |
| POST | `/gemini/audio-analysis` | Audio analysieren |

### Namespace: karriereheld/v1

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/config` | Partner-Konfiguration |
| POST | `/login` | Benutzer-Login |
| POST | `/logout` | Benutzer-Logout |
| GET | `/user` | Aktueller Benutzer |

---

## Entwicklungs-Workflow

### Voraussetzungen
- Node.js 18+
- npm 9+
- WordPress 6.0+ (für Plugin-Tests)
- PHP 7.4+

### Installation

```bash
# Repository klonen
git clone https://github.com/shoukit/Bewerbungstrainer.git
cd Bewerbungstrainer

# Dependencies installieren
npm install
composer install  # für DomPDF

# Umgebungsvariablen konfigurieren
cp .env.example .env
# .env bearbeiten und API-Keys eintragen
```

### Verfügbare Scripts

```bash
# Entwicklung
npm run dev          # Vite Dev-Server starten (localhost:5173)
npm run build        # Production Build erstellen
npm run preview      # Production Build lokal testen

# Code-Qualität
npm run lint         # ESLint ausführen

# Wartung
npm run clean        # node_modules, dist, .vite löschen
npm run clean:cache  # Nur dist und .vite löschen
npm run fresh        # Komplett neu installieren
npm run rebuild      # Cache löschen und neu bauen
```

### WordPress-Integration

1. **Plugin installieren:**
   ```bash
   # Plugin-Verzeichnis nach WordPress kopieren
   cp -r . /wp-content/plugins/bewerbungstrainer/
   ```

2. **Plugin aktivieren** in WordPress Admin

3. **API-Keys konfigurieren:**
   ```php
   update_option('bewerbungstrainer_elevenlabs_agent_id', 'xxx');
   update_option('bewerbungstrainer_elevenlabs_api_key', 'xxx');
   update_option('bewerbungstrainer_gemini_api_key', 'xxx');
   ```

4. **Shortcodes verwenden:**
   - `[bewerbungstrainer_interview]` - Haupt-App
   - `[bewerbungstrainer_uebungen]` - Übungsliste
   - `[bewerbungstrainer_dokumente]` - Dokumenten-Ansicht

---

## Konfiguration

### Umgebungsvariablen (.env)

```bash
# ElevenLabs
VITE_ELEVENLABS_AGENT_ID=agent_xxx
VITE_ELEVENLABS_API_KEY=xxx

# Google Gemini
VITE_GEMINI_API_KEY=xxx
```

### WordPress-Optionen

| Option | Beschreibung |
|--------|--------------|
| `bewerbungstrainer_elevenlabs_agent_id` | ElevenLabs Agent ID |
| `bewerbungstrainer_elevenlabs_api_key` | ElevenLabs API Key |
| `bewerbungstrainer_gemini_api_key` | Google Gemini API Key |
| `bewerbungstrainer_version` | Plugin-Version |

### Konstanten (src/config/constants.js)

```javascript
// Gemini Model-Reihenfolge
GEMINI_MODELS.FALLBACK_ORDER

// Score-Schwellenwerte
SCORE_THRESHOLDS.EXCELLENT = 80
SCORE_THRESHOLDS.GOOD = 60
SCORE_THRESHOLDS.FAIR = 40

// Optimales Sprechtempo
OPTIMAL_WPM.MIN = 120
OPTIMAL_WPM.MAX = 150

// Füllwort-Schwellenwerte
FILLER_WORD_THRESHOLDS.GOOD = 2
FILLER_WORD_THRESHOLDS.MODERATE = 5

// UI-Timing
UI_TIMING.ANIMATION_DURATION_NORMAL = 0.4
```

---

## Code-Konventionen

### JavaScript/React

```javascript
// Komponenten-Struktur
import React, { useState, useEffect } from 'react';
import { ComponentName } from './ComponentName';

// Props immer destrukturieren
function MyComponent({ prop1, prop2, onAction }) {
  // State mit useState
  const [state, setState] = useState(initialValue);

  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);

  // Event Handlers
  const handleClick = () => {
    // Handler logic
  };

  // Render
  return (
    <div className="tailwind-classes">
      {/* JSX */}
    </div>
  );
}

export default MyComponent;
```

### Datei-Benennung

| Typ | Konvention | Beispiel |
|-----|------------|----------|
| Komponenten | PascalCase | `RoleplaySession.jsx` |
| Services | camelCase | `gemini.js` |
| Hooks | camelCase mit `use` | `usePartnerTheming.js` |
| Konstanten | camelCase | `constants.js` |
| PHP-Klassen | kebab-case mit `class-` | `class-database.php` |

### CSS mit Tailwind

```jsx
// Utility-Klassen direkt im JSX
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Button
</button>

// Mit cn() für bedingte Klassen
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === 'primary' && "primary-classes"
)}>
```

### Console Logging

```javascript
// Einheitliches Format mit Emoji-Präfixen
console.log('[APP] Module loaded');
console.log('[GEMINI] Starting request...');
console.log('[SUCCESS] Operation completed');
console.log('[ERROR] Something failed:', error);
console.log('[WARN] Potential issue');
console.log('[RETRY] Trying again...');
```

---

## Sicherheit

### Implementierte Maßnahmen

1. **WordPress Nonces** für alle REST API Requests
2. **User-Capability-Checks** auf allen Endpoints
3. **Input-Sanitization** für alle Benutzereingaben
4. **Prepared Statements** für alle Datenbankabfragen
5. **File-Type-Validierung** für Audio/Video-Uploads
6. **.htaccess-Schutz** für Upload-Verzeichnisse

### Wichtige Hinweise

- API-Keys **niemals** im Frontend-Code speichern
- In Production: Gemini-Calls über WordPress Backend proxyen
- Sensitive Daten nur über HTTPS übertragen
- Session-Daten nur für eingeloggten User zugänglich

---

## Fehlerbehebung

### Häufige Probleme

| Problem | Lösung |
|---------|--------|
| Build schlägt fehl | `npm run fresh` ausführen |
| Vite nicht gefunden | `npm install` ausführen |
| API-Key fehlt | `.env` prüfen und Dev-Server neu starten |
| Plugin lädt nicht | Browser-Console auf Fehler prüfen |
| Audio wird nicht gespeichert | ElevenLabs "Audio Saving" aktivieren |

### Debug-Tipps

```javascript
// Browser Console öffnen (F12)
// Nach Präfixen filtern:
[APP]     // App-Level Logs
[GEMINI]  // Gemini API Logs
[AUDIO]   // Audio-bezogene Logs
[START]   // Session-Start Logs
```

---

## Weiterführende Dokumentation

- **README.md** - Projekt-Übersicht
- **README-WORDPRESS.md** - WordPress-spezifische Dokumentation
- **ELEVENLABS_AGENT_SETUP.md** - ElevenLabs Agent-Konfiguration
- **TROUBLESHOOTING.md** - Fehlerbehebungs-Leitfaden

---

## Externe Ressourcen

- [ElevenLabs Conversational AI](https://elevenlabs.io/docs/conversational-ai)
- [Google Gemini API](https://ai.google.dev/docs)
- [React Dokumentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite](https://vitejs.dev/guide/)
- [WordPress REST API](https://developer.wordpress.org/rest-api/)

---

## Versions-Historie

- **v1.0.0** (2025-11-17): Initiale WordPress-Plugin-Version
- **v1.1.0** (2025-11-24): Conversation Style Feature
- **v1.2.0** (2025-12): White-Label Partner-System

---

**Letzte Aktualisierung:** 2025-12-11
**Dokumentations-Version:** 2.0.0
