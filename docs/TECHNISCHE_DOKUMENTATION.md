# Karriereheld - Technische Dokumentation

**Version:** 1.0.0
**Stand:** Dezember 2025

---

## Inhaltsverzeichnis

1. [Technologie-Stack](#1-technologie-stack)
2. [Architektur](#2-architektur)
3. [Verzeichnisstruktur](#3-verzeichnisstruktur)
4. [Frontend-Komponenten](#4-frontend-komponenten)
5. [Backend-API](#5-backend-api)
6. [Datenbank-Schema](#6-datenbank-schema)
7. [KI-Integration](#7-ki-integration)
8. [Entwicklungs-Workflow](#8-entwicklungs-workflow)
9. [Deployment](#9-deployment)

---

## 1. Technologie-Stack

### Frontend

| Technologie | Version | Verwendung |
|-------------|---------|------------|
| **React** | 18.3.1 | UI-Framework (JSX, nicht TypeScript) |
| **Vite** | 7.2.2 | Build-Tool und Dev-Server |
| **Tailwind CSS** | 3.4.15 | Utility-First Styling |
| **Radix UI** | 1.1.2 | Headless UI-Komponenten (Dialog) |
| **Framer Motion** | 12.23.25 | Animationen |
| **Lucide React** | 0.460.0 | Icon-Bibliothek |

### KI-Services

| Service | SDK | Verwendung |
|---------|-----|------------|
| **ElevenLabs** | @elevenlabs/react 0.1.0 | Conversational AI (Voice-Interviews) |
| **Google Gemini** | @google/generative-ai 0.21.0 | Feedback, Audio-/Video-Analyse |

### Backend

| Technologie | Version | Verwendung |
|-------------|---------|------------|
| **WordPress** | 6.0+ | CMS und Backend-Framework |
| **PHP** | 7.4+ | Server-seitige Logik |
| **MySQL** | (via WP) | Datenbank |
| **DomPDF** | 3.1 | PDF-Export |

### Entwicklungswerkzeuge

| Tool | Version | Verwendung |
|------|---------|------------|
| **ESLint** | 9.13.0 | Code-Linting |
| **PostCSS** | 8.4.49 | CSS-Verarbeitung |
| **Autoprefixer** | 10.4.20 | Browser-Präfixe |

---

## 2. Architektur

### Systemübersicht

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           WordPress Frontend                               │
├───────────────────────────────────────────────────────────────────────────┤
│  React SPA (Vite Build)                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│  │   Smart     │ │    Live     │ │  Szenario   │ │  Wirkungs   │         │
│  │  Briefing   │ │  Simulation │ │  Training   │ │  Analyse    │         │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                         │
│  │  Rhetorik   │ │  Session    │ │   Login/    │                         │
│  │    Gym      │ │  History    │ │   Profile   │                         │
│  └─────────────┘ └─────────────┘ └─────────────┘                         │
├───────────────────────────────────────────────────────────────────────────┤
│  Services Layer                                                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│  │  ElevenLabs │ │   Gemini    │ │  WordPress  │ │   Partner   │         │
│  │   Service   │ │   Service   │ │     API     │ │   Context   │         │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘         │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                          WordPress REST API                                │
├───────────────────────────────────────────────────────────────────────────┤
│  /bewerbungstrainer/v1/*           │  /karriereheld/v1/*                  │
│  - Sessions (Roleplay, Simulator)  │  - Partner Config                    │
│  - Smart Briefings (Templates,     │  - Login/Logout                      │
│    Generation, Sections)           │  - User Management                   │
│  - Video Training Sessions         │  - Demo Codes                        │
│  - Rhetorik-Gym Games              │                                      │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                           Externe KI-Services                              │
├───────────────────────────────────────────────────────────────────────────┤
│  ElevenLabs Conversational AI       │  Google Gemini API                  │
│  - Voice Synthesis (TTS)            │  - Briefing-Generierung             │
│  - Speech Recognition (STT)         │  - Interview-Feedback               │
│  - Bidirektionale Konversation      │  - Audio-Analyse (multimodal)       │
│  - Interviewer-Persönlichkeiten     │  - Video-Analyse (Vision)           │
└───────────────────────────────────────────────────────────────────────────┘
```

### Datenfluss

```
User Input → React Component → Service Layer → WordPress REST API → Database
                                    ↓
                            External AI Services
                                    ↓
                            Response Processing
                                    ↓
                            UI Update (React State)
```

---

## 3. Verzeichnisstruktur

```
Bewerbungstrainer/
├── bewerbungstrainer-plugin.php    # WordPress Plugin Hauptdatei
├── includes/                        # PHP Backend-Klassen
│   ├── class-api.php               # Haupt-REST-API Endpoints
│   ├── class-database.php          # Haupt-Datenbank-Management
│   ├── class-simulator-database.php # Simulator-Datenbank
│   ├── class-simulator-api.php     # Simulator REST API
│   ├── class-simulator-admin.php   # Simulator Admin-Bereich
│   ├── class-smartbriefing-api.php # Smart Briefing REST API
│   ├── class-smartbriefing-database.php # Smart Briefing Datenbank
│   ├── class-video-training-api.php    # Video Training REST API
│   ├── class-video-training-database.php # Video Training Datenbank
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
│   │   ├── smartbriefing/          # Smart Briefing Modul
│   │   ├── simulator/              # Szenario-Training Modul
│   │   ├── video-training/         # Wirkungs-Analyse Modul
│   │   ├── rhetorik-gym/           # Rhetorik-Gym Modul
│   │   ├── session-detail/         # Session-Detail Komponenten
│   │   ├── audio-analysis/         # Audio-Analyse Komponenten
│   │   └── ui/                     # Basis UI-Komponenten
│   ├── services/                   # API-Services
│   │   ├── gemini.js               # Google Gemini Integration
│   │   ├── elevenlabs.js           # ElevenLabs Basis-Service
│   │   ├── elevenlabs-convai.js    # ElevenLabs Conversational AI
│   │   └── wordpress-api.js        # WordPress REST API Client
│   ├── config/                     # Konfiguration
│   │   ├── constants.js            # Globale Konstanten
│   │   ├── partners.js             # White-Label Partner-Config
│   │   └── prompts/                # KI-Prompts
│   ├── context/                    # React Context
│   │   └── PartnerContext.jsx      # White-Label Theming
│   ├── hooks/                      # Custom React Hooks
│   │   └── usePartnerTheming.js    # Partner-Theming Hook
│   └── utils/                      # Hilfsfunktionen
├── dist/                            # Production Build (generiert)
├── docs/                            # Dokumentation
├── vendor/                          # Composer Dependencies
├── vite.config.js                   # Vite Build-Konfiguration
├── tailwind.config.js               # Tailwind CSS Konfiguration
└── package.json                     # Node.js Dependencies
```

---

## 4. Frontend-Komponenten

### Komponenten-Hierarchie

```
App.jsx
├── PartnerContext.Provider
│   ├── Navigation/Sidebar
│   ├── View Router (currentView)
│   │   ├── SmartBriefingApp
│   │   │   ├── SmartBriefingDashboard
│   │   │   ├── SmartBriefingForm
│   │   │   ├── BriefingWorkbook
│   │   │   └── BriefingList
│   │   ├── RoleplayDashboard / RoleplaySession
│   │   ├── SimulatorApp
│   │   │   ├── SimulatorDashboard
│   │   │   ├── SimulatorWizard
│   │   │   ├── SimulatorSession
│   │   │   └── SessionComplete
│   │   ├── VideoTrainingApp
│   │   │   ├── VideoTrainingDashboard
│   │   │   ├── VideoTrainingSession
│   │   │   └── VideoTrainingResults
│   │   ├── RhetorikGym / GameSession
│   │   ├── SessionHistory
│   │   └── TrainingSessionDetailView
│   └── LoginModal
```

### Smart Briefing Komponenten

| Komponente | Beschreibung |
|------------|--------------|
| `SmartBriefingApp.jsx` | State-Management, View-Router |
| `SmartBriefingDashboard.jsx` | Template-Grid mit Kategoriefilter |
| `SmartBriefingForm.jsx` | Dynamische Formulargenerierung |
| `BriefingWorkbook.jsx` | Interaktives Workbook mit Item-Management |
| `BriefingList.jsx` | Liste gespeicherter Briefings |

### Simulator Komponenten

| Komponente | Beschreibung |
|------------|--------------|
| `SimulatorApp.jsx` | Orchestrierung, View-Management |
| `SimulatorDashboard.jsx` | Szenario-Grid mit Filterung |
| `SimulatorWizard.jsx` | Setup-Assistent mit Tipps |
| `SimulatorSession.jsx` | Frage-Antwort-Interface |
| `ImmediateFeedback.jsx` | Feedback nach jeder Antwort |
| `SessionComplete.jsx` | Abschluss-Zusammenfassung |

### Video Training Komponenten

| Komponente | Beschreibung |
|------------|--------------|
| `VideoTrainingApp.jsx` | Orchestrierung |
| `VideoTrainingDashboard.jsx` | Szenario-Auswahl |
| `VideoTrainingSession.jsx` | Video-Recording mit MediaRecorder |
| `VideoTrainingResults.jsx` | Video-Player mit Analyse |

### Shared Komponenten

| Komponente | Beschreibung |
|------------|--------------|
| `SessionHistory.jsx` | Tab-basierte Session-Übersicht |
| `TrainingSessionDetailView.jsx` | Unified Detail-Ansicht |
| `AudioPlayerCard.jsx` | Audio-Wiedergabe mit Seek |
| `TranscriptCard.jsx` | Transkript-Anzeige |
| `ConfidenceGauge.jsx` | Selbstsicherheits-Anzeige |

---

## 5. Backend-API

### REST API Namespaces

#### bewerbungstrainer/v1

**Smart Briefings:**

| Methode | Endpoint | Auth | Beschreibung |
|---------|----------|------|--------------|
| GET | `/smartbriefing/templates` | - | Alle aktiven Templates |
| GET | `/smartbriefing/templates/{id}` | - | Einzelnes Template |
| POST | `/smartbriefing/generate` | Optional | Briefing generieren |
| GET | `/smartbriefing/briefings` | Ja | Briefings des Users |
| GET | `/smartbriefing/briefings/{id}` | - | Einzelnes Briefing |
| DELETE | `/smartbriefing/briefings/{id}` | Ja | Briefing löschen |
| PATCH | `/smartbriefing/sections/{id}` | Ja | Section aktualisieren |
| POST | `/smartbriefing/sections/{id}/generate-more` | Ja | Weitere Items |

**Live-Simulation:**

| Methode | Endpoint | Auth | Beschreibung |
|---------|----------|------|--------------|
| GET | `/sessions` | Ja | Alle Sessions |
| POST | `/sessions` | Ja | Neue Session |
| PUT | `/sessions/{id}` | Ja | Session aktualisieren |
| DELETE | `/sessions/{id}` | Ja | Session löschen |
| GET | `/scenarios` | - | Verfügbare Szenarien |
| POST | `/audio/save-elevenlabs` | Ja | Audio speichern |

**Szenario-Training:**

| Methode | Endpoint | Auth | Beschreibung |
|---------|----------|------|--------------|
| GET | `/simulator/scenarios` | - | Alle Szenarien |
| GET | `/simulator/sessions` | Ja | User-Sessions |
| POST | `/simulator/sessions` | Ja | Neue Session |
| DELETE | `/simulator/sessions/{id}` | Ja | Session löschen |
| POST | `/simulator/sessions/{id}/answers` | Ja | Antwort speichern |

**Video-Training:**

| Methode | Endpoint | Auth | Beschreibung |
|---------|----------|------|--------------|
| GET | `/video-training/scenarios` | - | Alle Szenarien |
| GET | `/video-training/sessions` | Ja | User-Sessions |
| POST | `/video-training/sessions` | Ja | Neue Session |
| POST | `/video-training/sessions/{id}/video` | Ja | Video upload |

**Rhetorik-Gym:**

| Methode | Endpoint | Auth | Beschreibung |
|---------|----------|------|--------------|
| GET | `/games` | Ja | User-Spiele |
| POST | `/games` | Ja | Neues Spiel |
| GET | `/games/stats` | Ja | Statistiken |

#### karriereheld/v1

| Methode | Endpoint | Auth | Beschreibung |
|---------|----------|------|--------------|
| GET | `/config` | - | Partner-Konfiguration |
| POST | `/login` | - | Benutzer-Login |
| POST | `/logout` | Ja | Benutzer-Logout |
| GET | `/user` | Ja | Aktueller Benutzer |

---

## 6. Datenbank-Schema

### Smart Briefings

**wp_bewerbungstrainer_smartbriefing_templates**

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | bigint(20) | Primärschlüssel |
| `title` | varchar(255) | Template-Name |
| `description` | text | Beschreibung |
| `icon` | varchar(50) | Lucide-Icon-Name |
| `category` | varchar(100) | CAREER, SALES, etc. |
| `system_prompt` | longtext | Gemini-Prompt mit Platzhaltern |
| `variables_schema` | JSON | Formfeld-Definitionen |
| `is_active` | tinyint | Aktiv/Inaktiv |

**wp_bewerbungstrainer_smartbriefing_briefings**

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | bigint(20) | Primärschlüssel |
| `user_id` | bigint(20) | WordPress User ID |
| `template_id` | bigint(20) | Referenz auf Template |
| `title` | varchar(255) | Auto-generierter Titel |
| `variables` | JSON | Eingegebene Variablen |
| `status` | varchar(20) | generating/completed/failed |

**wp_bewerbungstrainer_smartbriefing_sections**

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | bigint(20) | Primärschlüssel |
| `briefing_id` | bigint(20) | Referenz auf Briefing |
| `section_title` | varchar(255) | Section-Überschrift |
| `ai_content` | JSON | Items mit id, label, content, deleted, user_note |

### Live-Simulation

**wp_bewerbungstrainer_sessions**

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | bigint(20) | Primärschlüssel |
| `user_id` | bigint(20) | WordPress User ID |
| `session_id` | varchar(255) | UUID |
| `scenario_id` | bigint(20) | Referenz auf Szenario |
| `conversation_id` | varchar(255) | ElevenLabs ID |
| `conversation_style` | varchar(50) | friendly/critical/professional |
| `transcript` | longtext | Gesprächs-Transkript |
| `feedback_json` | longtext | Gemini Feedback |
| `audio_analysis_json` | longtext | Paraverbale Analyse |

### Szenario-Training

**wp_bewerbungstrainer_simulator_sessions**

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | bigint(20) | Primärschlüssel |
| `user_id` | bigint(20) | WordPress User ID |
| `scenario_id` | bigint(20) | Referenz auf Szenario |
| `status` | varchar(20) | in_progress/completed |
| `overall_score` | decimal(5,2) | Durchschnitt |
| `completed_questions` | int | Beantwortet |

**wp_bewerbungstrainer_simulator_answers**

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | bigint(20) | Primärschlüssel |
| `session_id` | bigint(20) | Session-Referenz |
| `question_index` | int | Frage-Nummer |
| `audio_url` | text | Audio der Antwort |
| `transcript` | longtext | Transkript |
| `feedback_json` | longtext | Feedback |
| `score` | decimal(5,2) | Bewertung |

### Video-Training

**wp_bewerbungstrainer_video_sessions**

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | bigint(20) | Primärschlüssel |
| `user_id` | bigint(20) | WordPress User ID |
| `scenario_id` | bigint(20) | Referenz |
| `video_url` | text | Video-URL |
| `timeline_json` | JSON | Timestamps pro Frage |
| `overall_score` | decimal(5,2) | Gesamtbewertung |
| `status` | varchar(20) | recording/analyzing/completed |

### Rhetorik-Gym

**wp_bewerbungstrainer_games**

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | bigint(20) | Primärschlüssel |
| `user_id` | bigint(20) | WordPress User ID |
| `game_mode` | varchar(50) | classic/random/stress |
| `topic` | varchar(255) | Thema |
| `score` | int(11) | Punktzahl (0-100) |
| `filler_count` | int(11) | Füllwörter |
| `words_per_minute` | int(11) | Sprechtempo |

### Custom Post Types

| Post Type | Beschreibung |
|-----------|--------------|
| `roleplay_scenario` | Live-Simulation Szenarien |
| `simulator_scenario` | Szenario-Training |
| `video_scenario` | Video-Training |
| `whitelabel_partner` | Partner-Konfiguration |

---

## 7. KI-Integration

### ElevenLabs Conversational AI

**Konfiguration:**

```javascript
const overrides = {
  agent: {
    prompt: {
      prompt: systemPrompt
    }
  },
  variables: {
    user_name: "Max Mustermann",
    position: "Senior Developer",
    company: "Google",
    conversation_style: "professional"
  }
};
```

**Gesprächsstile:**
- `friendly` - Ermutigend, unterstützend
- `critical` - Herausfordernd, anspruchsvoll
- `professional` - Sachlich, neutral

### Google Gemini API

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

| Funktion | Input | Output |
|----------|-------|--------|
| `generateSmartBriefing` | Template, Variables | Strukturierte Sections |
| `generateInterviewFeedback` | Transkript | Kategorisiertes Feedback |
| `generateAudioAnalysis` | Audio (base64) | Paraverbale Metriken |
| `generateVideoAnalysis` | Video-Frame | Nonverbale Analyse |
| `analyzeRhetoricGame` | Audio, Topic | Score + Füllwörter |

---

## 8. Entwicklungs-Workflow

### Installation

```bash
# Repository klonen
git clone https://github.com/shoukit/Bewerbungstrainer.git
cd Bewerbungstrainer

# Dependencies
npm install
composer install

# Environment
cp .env.example .env
# API-Keys eintragen
```

### Verfügbare Scripts

```bash
npm run dev        # Development Server
npm run build      # Production Build
npm run preview    # Preview Build
npm run lint       # ESLint
npm run clean      # Clean Build
npm run fresh      # Fresh Install
```

### Code-Konventionen

**Komponenten:**
```javascript
function MyComponent({ prop1, prop2, onAction }) {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Side effects
  }, [dependencies]);

  return (
    <div className="tailwind-classes">
      {/* JSX */}
    </div>
  );
}
```

**Datei-Benennung:**
- Komponenten: PascalCase (`RoleplaySession.jsx`)
- Services: camelCase (`gemini.js`)
- Hooks: `use` Präfix (`usePartnerTheming.js`)
- PHP-Klassen: `class-` Präfix (`class-database.php`)

---

## 9. Deployment

### WordPress Plugin Installation

1. Plugin-Verzeichnis nach `/wp-content/plugins/` kopieren
2. Plugin in WordPress Admin aktivieren
3. API-Keys konfigurieren:

```php
update_option('bewerbungstrainer_elevenlabs_agent_id', 'xxx');
update_option('bewerbungstrainer_elevenlabs_api_key', 'xxx');
update_option('bewerbungstrainer_gemini_api_key', 'xxx');
```

### Shortcodes

```php
[bewerbungstrainer_interview]  // Haupt-App
[bewerbungstrainer_uebungen]   // Übungsliste
[bewerbungstrainer_dokumente]  // Dokumenten-Ansicht
```

### Sicherheitshinweise

- API-Keys niemals im Frontend speichern
- In Production: Gemini-Calls über Backend proxyen
- WordPress Nonces für alle REST API Requests
- Prepared Statements für Datenbankabfragen
- File-Type-Validierung für Uploads

---

**Dokumentversion:** 1.0.0
**Letzte Aktualisierung:** Dezember 2025
