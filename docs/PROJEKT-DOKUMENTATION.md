# KarriereHeld - Bewerbungstrainer

## Projektdokumentation

**Version:** 1.0.0
**Stand:** Dezember 2024

---

## Inhaltsverzeichnis

1. [Fachliche Dokumentation](#fachliche-dokumentation)
   - [Projektübersicht](#projektübersicht)
   - [Zielgruppe](#zielgruppe)
   - [Hauptfunktionen](#hauptfunktionen)
   - [Benutzerflows](#benutzerflows)
2. [Technische Dokumentation](#technische-dokumentation)
   - [Architektur](#architektur)
   - [Technologie-Stack](#technologie-stack)
   - [Komponentenstruktur](#komponentenstruktur)
   - [API-Schnittstellen](#api-schnittstellen)
   - [Datenmodelle](#datenmodelle)
   - [Externe Services](#externe-services)

---

# Fachliche Dokumentation

## Projektübersicht

**KarriereHeld Bewerbungstrainer** ist eine interaktive Web-Anwendung zur Vorbereitung auf Bewerbungsgespräche. Die Anwendung ermöglicht es Benutzern, realistische Gesprächssituationen mit KI-gesteuerten Interviewern zu üben und detailliertes Feedback zu ihrer Performance zu erhalten.

### Vision

Jedem Bewerber die Möglichkeit geben, sich optimal auf Vorstellungsgespräche vorzubereiten - durch realistische Übungsszenarien mit sofortigem, konstruktivem Feedback.

### Kernwertversprechen

- **Realistische Gesprächssimulation** mit KI-gesteuerten Interviewern
- **Sprachbasierte Interaktion** für authentische Übungserfahrung
- **Detaillierte Analyse** von Kommunikation, Inhalt und Sprechtechnik
- **Personalisiertes Coaching** mit konkreten Verbesserungsvorschlägen

---

## Zielgruppe

### Primäre Zielgruppe
- **Berufseinsteiger** - Vorbereitung auf erste Vorstellungsgespräche
- **Berufstätige** - Vorbereitung auf Jobwechsel oder Beförderungsgespräche
- **Karrierewechsler** - Übung für neue Branchen oder Positionen

### Sekundäre Zielgruppe
- **Karriere-Coaches** - Als Tool für ihre Klienten
- **HR-Abteilungen** - Zur Mitarbeiterentwicklung
- **Bildungseinrichtungen** - Für Karrierevorbereitung von Studenten

---

## Hauptfunktionen

### 1. Rollenspiel-Szenarien (Gesprächsübungen)

Interaktive Gesprächssimulationen mit verschiedenen Schwierigkeitsgraden und Szenarien.

#### Szenarien-Typen:
- **Gehaltsverhandlung** - Übung von Verhandlungstechniken
- **Kaltakquise** - Training für Erstgespräche mit schwierigen Gesprächspartnern
- **Klassisches Vorstellungsgespräch** - Standard-Interviewvorbereitung
- **Stressinterview** - Umgang mit herausfordernden Situationen

#### Interviewer-Profile:
Jedes Szenario verfügt über einen charakterisierten Interviewer mit:
- **Name und Rolle** (z.B. "Peter Post, Marketing Leiter")
- **Persönlichkeitseigenschaften** (z.B. "Sehr abweisen und gestresst")
- **Typische Einwände** - Realistische Gegenargumente
- **Profilbild** - Für visuelle Immersion

#### Schwierigkeitsgrade:
- **Einfach** - Freundlicher, geduldiger Gesprächspartner
- **Mittel** - Neutraler, professioneller Interviewer
- **Schwer** - Kritischer, herausfordernder Gesprächspartner

### 2. Live Coaching

Während des Gesprächs werden in Echtzeit Coaching-Tipps eingeblendet:
- Kontextbezogene Hinweise
- Gesprächsstrategien
- Formulierungshilfen

### 3. Live Transkript

Echtzeit-Mitschrift des Gesprächs mit:
- Unterscheidung zwischen Bewerber und Interviewer
- Zeitstempel für jede Nachricht
- Automatisches Scrollen

### 4. Analyse-Dashboard (nach dem Gespräch)

#### Coaching-Tab
Detaillierte Feedback-Analyse mit:

- **Gesamtbewertung** - Prozentuale Punktzahl mit visueller Darstellung
- **Zusammenfassung** - Überblick über die Performance
- **Deine Superkraft** - Hervorhebung der größten Stärke
- **Dein Trainingsfeld** - Wichtigster Verbesserungsbereich
- **Bewertungskriterien:**
  - Kommunikation
  - Motivation
  - Professionalität
- **Kategoriebasiertes Feedback** - Detailbewertung pro Themenbereich

#### Analysen-Tab
Audio- und Sprachanalyse:

- **Redefluss** - Bewertung der Sprachflüssigkeit
- **Füllwörter** - Erkennung und Zählung (z.B. "ähm", "also")
- **Sprechtempo** - Bewertung (zu schnell / optimal / zu langsam)
- **Betonung & Tonalität** - Analyse der Stimmvariation

### 5. Gesprächsaufnahme

- **Audio-Player** - Wiedergabe der Gesprächsaufnahme
- **Timeline-Marker** - Visualisierung wichtiger Momente
- **Zeitnavigation** - Direktes Springen zu bestimmten Stellen

### 6. Gesprächsverlauf

Scrollbare Transkript-Ansicht mit:
- Farblicher Unterscheidung (Bewerber/Interviewer)
- Synchronisation mit Audio-Player
- Hervorhebung der aktuellen Stelle

### 7. Session-Historie

Übersicht aller bisherigen Übungssitzungen:
- Datum und Dauer
- Szenario-Typ
- Erreichte Punktzahl
- Schnellzugriff zur Detailansicht

---

## Benutzerflows

### Flow 1: Neue Übung starten

```
1. Dashboard öffnen
   ↓
2. Szenario auswählen (Karten mit Vorschau)
   ↓
3. Optionale Variablen eingeben (z.B. aktuelles Gehalt)
   ↓
4. "Anrufen" klicken → Gespräch startet
   ↓
5. Sprachbasiertes Gespräch führen
   ↓
6. "Gespräch beenden" klicken
   ↓
7. Analyse wird generiert (Loading-Screen)
   ↓
8. Analyse-Dashboard mit Feedback
```

### Flow 2: Vergangene Übung ansehen

```
1. "Übungen" Tab im Dashboard
   ↓
2. Session aus Liste auswählen
   ↓
3. Detailansicht mit:
   - Gesprächsaufnahme
   - Transkript
   - Feedback-Analyse
```

### Flow 3: Erneut üben

```
1. Analyse-Dashboard nach Gespräch
   ↓
2. "Erneut üben" Button klicken
   ↓
3. Gleiches Szenario startet neu
```

---

# Technische Dokumentation

## Architektur

### Systemübersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                        WordPress Site                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    React Frontend                         │   │
│  │  (Vite Build → WordPress eingebettet via Shortcode)      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↕                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              WordPress REST API Plugin                    │   │
│  │         /wp-json/bewerbungstrainer/v1/*                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↕                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   MySQL Database                          │   │
│  │    (Custom Tables für Sessions, Scenarios, etc.)         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               ↕
┌─────────────────────────────────────────────────────────────────┐
│                     Externe Services                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  ElevenLabs  │  │   Gemini AI  │  │  ElevenLabs ConvAI   │  │
│  │  (TTS/STT)   │  │  (Analyse)   │  │  (Konversation)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Architektur-Prinzipien

- **WordPress als Backend** - Nutzt bestehendes Auth-System und Admin-Interface
- **React SPA Frontend** - Moderne, reaktive Benutzeroberfläche
- **REST API Kommunikation** - Lose Kopplung zwischen Frontend und Backend
- **Externe KI-Services** - Spezialisierte APIs für Sprache und Analyse

---

## Technologie-Stack

### Frontend

| Technologie | Version | Verwendung |
|-------------|---------|------------|
| React | 18.3 | UI-Framework |
| Vite | 7.2 | Build-Tool & Dev-Server |
| Tailwind CSS | 3.4 | Styling |
| Framer Motion | 12.x | Animationen |
| Lucide React | 0.460 | Icons |
| @elevenlabs/react | 0.1 | Voice AI Integration |
| @google/generative-ai | 0.21 | Gemini AI Integration |

### Backend (WordPress Plugin)

| Technologie | Verwendung |
|-------------|------------|
| PHP 8.x | Plugin-Logik |
| WordPress REST API | API-Endpoints |
| MySQL | Datenpersistenz |
| WordPress Hooks | Integration |

### Externe Services

| Service | Verwendung |
|---------|------------|
| ElevenLabs Conversational AI | Sprachbasierte Gesprächsführung |
| ElevenLabs Audio API | Audio-Download der Gespräche |
| Google Gemini AI | Feedback-Analyse & Audio-Analyse |

---

## Komponentenstruktur

### Frontend-Komponenten

```
src/
├── components/
│   ├── RoleplayDashboard.jsx      # Hauptansicht mit Szenarien-Auswahl
│   ├── RoleplaySession.jsx        # Aktive Gesprächssitzung
│   ├── SessionDetailView.jsx      # Analyse-Dashboard nach Gespräch
│   ├── SessionSidebar.jsx         # Feedback-Sidebar mit Tabs
│   ├── SessionHistory.jsx         # Liste vergangener Sessions
│   │
│   ├── CoachingPanel.jsx          # Live-Coaching Tipps (links)
│   ├── StructuredFeedbackDisplay.jsx  # Coaching-Tab Inhalt
│   ├── AudioAnalysisDisplay.jsx   # Analysen-Tab Inhalt
│   │
│   ├── RoleplayVariablesDialog.jsx    # Variablen-Eingabe Dialog
│   ├── InterviewerProfile.jsx     # Interviewer-Profilkarte
│   ├── FeedbackModal.jsx          # Feedback-Modal (Legacy)
│   │
│   ├── VideoTrainingApp.jsx       # Video-Training Modul
│   ├── VideoTrainingWizard.jsx    # Video-Training Wizard
│   ├── VideoRecorder.jsx          # Videoaufnahme-Komponente
│   ├── VideoFeedback.jsx          # Video-Feedback Anzeige
│   │
│   └── ui/                        # Basis-UI-Komponenten
│       ├── button.jsx
│       ├── dialog.jsx
│       └── ...
│
├── services/
│   ├── wordpress-api.js           # WordPress REST API Client
│   ├── elevenlabs-convai.js       # ElevenLabs Conversational AI
│   ├── elevenlabs.js              # ElevenLabs Audio API
│   ├── gemini.js                  # Google Gemini AI
│   └── roleplay-feedback-adapter.js  # Feedback-Verarbeitung
│
├── lib/
│   └── utils.js                   # Utility-Funktionen (cn, etc.)
│
└── main-*.jsx                     # Entry Points
```

### Komponenten-Hierarchie (Rollenspiel)

```
RoleplayDashboard
├── SessionHistory (Tab: Übungen)
└── Szenarien-Grid (Tab: Szenarien)
    └── Szenario-Karte → onClick → RoleplayVariablesDialog
                                        ↓
                                   RoleplaySession
                                   ├── CoachingPanel (links)
                                   ├── InterviewerProfile (mitte)
                                   └── LiveTranskript (rechts)
                                        ↓ onEnd
                                   SessionDetailView
                                   ├── AudioPlayer + Transkript (links)
                                   └── SessionSidebar (rechts)
                                       ├── StructuredFeedbackDisplay
                                       └── AudioAnalysisDisplay
```

### Backend-Klassen

```
includes/
├── class-api.php                  # REST API Endpoints
├── class-database.php             # Datenbank-Operationen
├── class-roleplay-scenarios.php   # Szenarien-Verwaltung
├── class-shortcodes.php           # WordPress Shortcodes
├── class-gemini-handler.php       # Gemini AI Backend-Handler
├── class-audio-handler.php        # Audio-Verarbeitung
├── class-video-handler.php        # Video-Verarbeitung
└── class-pdf-exporter.php         # PDF-Export
```

---

## API-Schnittstellen

### WordPress REST API Endpoints

Basis-URL: `/wp-json/bewerbungstrainer/v1`

#### Rollenspiel-Sessions

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/roleplays/sessions` | Alle Sessions des Benutzers |
| GET | `/roleplays/sessions/{id}` | Einzelne Session |
| POST | `/roleplays/sessions` | Neue Session erstellen |
| PUT | `/roleplays/sessions/{id}` | Session aktualisieren |
| DELETE | `/roleplays/sessions/{id}` | Session löschen |

#### Szenarien

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/roleplays/scenarios` | Alle verfügbaren Szenarien |
| GET | `/roleplays/scenarios/{id}` | Einzelnes Szenario |

#### Audio

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| POST | `/audio/save-elevenlabs` | ElevenLabs Audio speichern |
| POST | `/audio/upload` | Audio-Upload (Base64) |

#### Benutzer

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/user/info` | Aktuelle Benutzerinfos |

### Request/Response Beispiele

#### Session erstellen

```javascript
// Request
POST /roleplays/sessions
{
  "scenario_id": 1,
  "user_name": "Max Mustermann",
  "variables": {
    "aktuelles_gehalt": "55000",
    "wunschgehalt": "65000"
  }
}

// Response
{
  "success": true,
  "data": {
    "id": 123,
    "session_id": "abc-123-xyz",
    "scenario_id": 1,
    "created_at": "2024-12-07T10:30:00Z"
  }
}
```

#### Session aktualisieren (mit Feedback)

```javascript
// Request
PUT /roleplays/sessions/123
{
  "transcript": "[{\"role\":\"agent\",\"text\":\"Hallo...\"}]",
  "feedback_json": "{\"summary\":\"...\",\"rating\":{...}}",
  "audio_analysis_json": "{\"speech_cleanliness_score\":85,...}",
  "duration": 180,
  "conversation_id": "conv_abc123"
}

// Response
{
  "success": true,
  "data": {
    "id": 123,
    "feedback_json": {...},
    "audio_analysis_json": {...}
  }
}
```

---

## Datenmodelle

### Datenbank-Tabellen

#### `{prefix}_bewerbungstrainer_roleplay_sessions`

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | BIGINT | Primary Key |
| session_id | VARCHAR(255) | Eindeutige Session-ID |
| user_id | BIGINT | WordPress User ID |
| user_name | VARCHAR(255) | Anzeigename |
| scenario_id | BIGINT | FK zu Szenarien |
| agent_id | VARCHAR(255) | ElevenLabs Agent ID |
| variables_json | LONGTEXT | Session-Variablen (JSON) |
| transcript | LONGTEXT | Gesprächstranskript (JSON) |
| feedback_json | LONGTEXT | Gemini Feedback (JSON) |
| audio_analysis_json | LONGTEXT | Audio-Analyse (JSON) |
| conversation_id | VARCHAR(255) | ElevenLabs Conversation ID |
| duration | INT | Dauer in Sekunden |
| created_at | DATETIME | Erstellungszeitpunkt |
| updated_at | DATETIME | Aktualisierungszeitpunkt |

#### `{prefix}_bewerbungstrainer_roleplay_scenarios`

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | BIGINT | Primary Key |
| title | VARCHAR(255) | Szenario-Titel |
| description | TEXT | Beschreibung |
| difficulty | ENUM | easy, medium, hard |
| category | VARCHAR(100) | Kategorie |
| agent_id | VARCHAR(255) | ElevenLabs Agent ID |
| interviewer_profile | LONGTEXT | Interviewer-Daten (JSON) |
| coaching_hints | TEXT | Coaching-Tipps |
| variables | LONGTEXT | Erforderliche Variablen (JSON) |
| is_active | TINYINT | Aktiv-Status |
| sort_order | INT | Sortierreihenfolge |

### JSON-Strukturen

#### Feedback JSON (feedback_json)

```json
{
  "overall_analysis": {
    "total_score": 70,
    "summary_text": "Der Bewerber zeigt Gesprächsbereitschaft...",
    "top_strength": "Eigeninitiative gezeigt",
    "primary_weakness": "Antworten könnten ausführlicher sein"
  },
  "audio_metrics": {
    "speech_cleanliness_score": 85,
    "filler_words_detected": [
      {"word": "ähm", "count": 3}
    ],
    "pacing": {
      "rating": "optimal",
      "feedback": "Gutes Sprechtempo"
    },
    "tonality": {
      "rating": "natürlich",
      "feedback": "Angenehme Stimmvariation"
    }
  },
  "categories": [
    {
      "id": "communication",
      "title": "Kommunikation",
      "score": 75,
      "items": [
        {
          "criterion": "Klarheit",
          "rating": 4,
          "observation": "Klare Ausdrucksweise",
          "improvement_suggestion": "Mehr Beispiele nennen"
        }
      ]
    }
  ]
}
```

#### Interviewer Profile JSON

```json
{
  "name": "Peter Post",
  "role": "Marketing Leiter",
  "image_url": "https://...",
  "personality": "Sehr abweisen und gestresst",
  "typical_objections": [
    "Ich habe keine Zeit für lange Gespräche",
    "Was genau wollen Sie?"
  ]
}
```

---

## Externe Services

### ElevenLabs Conversational AI

**Verwendung:** Sprachbasierte Gesprächsführung in Echtzeit

**Integration:**
```javascript
import { useConversation } from '@elevenlabs/react';

const conversation = useConversation({
  onMessage: (message) => { /* Transkript aktualisieren */ },
  onError: (error) => { /* Fehlerbehandlung */ }
});

// Gespräch starten
await conversation.startSession({
  agentId: scenario.agent_id,
  dynamicVariables: sessionVariables
});

// Gespräch beenden
await conversation.endSession();
```

**Konfiguration:**
- Agent-IDs werden pro Szenario in der Datenbank gespeichert
- API-Key wird via WordPress Config bereitgestellt

### ElevenLabs Audio API

**Verwendung:** Download der Gesprächsaufnahme nach Session-Ende

**Endpoint:** `https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}/audio`

**Integration:**
```javascript
const response = await fetch(audioUrl, {
  headers: { 'xi-api-key': apiKey }
});
const audioBlob = await response.blob();
```

### Google Gemini AI

**Verwendung:**
1. Feedback-Generierung basierend auf Transkript
2. Audio-Analyse (optional mit Audio-Datei)

**Modelle:**
- `gemini-2.0-flash-exp` (primär)
- `gemini-1.5-flash-latest` (Fallback)
- `gemini-1.5-pro-latest` (Fallback)

**Integration:**
```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

const result = await model.generateContent(prompt);
const feedback = result.response.text();
```

---

## Deployment

### Build-Prozess

```bash
# Dependencies installieren
npm install

# Entwicklungsserver
npm run dev

# Production Build
npm run build

# Output: dist/ Ordner
```

### WordPress Integration

1. Plugin-Ordner nach `/wp-content/plugins/bewerbungstrainer/` kopieren
2. Plugin im WordPress Admin aktivieren
3. API-Keys in den Plugin-Einstellungen konfigurieren
4. Shortcode `[bewerbungstrainer]` auf gewünschter Seite einfügen

### Umgebungsvariablen

```
VITE_ELEVENLABS_AGENT_ID=xxx     # Standard Agent ID
VITE_ELEVENLABS_API_KEY=xxx      # ElevenLabs API Key
VITE_GEMINI_API_KEY=xxx          # Google Gemini API Key
```

Diese werden alternativ via WordPress Config (`bewerbungstrainerConfig`) bereitgestellt.

---

## Sicherheit

### Authentifizierung
- WordPress Nonce für alle API-Requests
- User-ID aus WordPress Session

### Autorisierung
- Sessions sind User-gebunden
- Nur eigene Sessions können abgerufen werden

### Datenschutz
- Audio-Aufnahmen werden verschlüsselt gespeichert
- Transkripte und Feedback sind nur für den jeweiligen User sichtbar
- Keine Weitergabe an Dritte (außer für KI-Analyse)

---

## Wartung & Monitoring

### Logging
- PHP `error_log()` für Backend-Fehler
- Browser Console für Frontend-Debugging
- Präfixe: `[Roleplay Feedback]`, `[GEMINI]`, `[SESSION_DETAIL]`

### Häufige Probleme

| Problem | Ursache | Lösung |
|---------|---------|--------|
| Feedback nicht gespeichert | Markdown-Wrapper in JSON | `safe_json_decode()` im Backend |
| Audio nicht verfügbar | ElevenLabs Audio-Saving deaktiviert | In ElevenLabs Agent Settings aktivieren |
| Gespräch startet nicht | Ungültige Agent-ID | Agent-ID in Szenario prüfen |

---

## Changelog

### Version 1.0.0 (Dezember 2024)
- Initiale Version
- Rollenspiel-Szenarien mit ElevenLabs ConvAI
- Gemini-basierte Feedback-Analyse
- Audio-Analyse mit Sprachmetriken
- Session-Historie und Detailansicht
- Responsive Design (Desktop/Mobile)

---

*Dokumentation erstellt: Dezember 2024*
