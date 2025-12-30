# CLAUDE.md - KI-Assistenten-Leitfaden für Karriereheld

## Projektübersicht

**Karriereheld** ist ein KI-gestütztes WordPress-Plugin für umfassende Karriere- und Gesprächsvorbereitung. Die Anwendung kombiniert sprachbasierte KI-Interaktion, intelligente Feedback-Generierung und strukturierte Wissensvermittlung zu einem ganzheitlichen Trainingsystem.

> **Hinweis:** Ausführliche Dokumentation findet sich im `docs/` Ordner:
> - `PRODUKTBESCHREIBUNG.md` - Umfassende fachliche Dokumentation
> - `FUNKTIONALES_DESIGN.md` - Funktionales Design und Benutzerflows
> - `TECHNISCHE_DOKUMENTATION.md` - Technische Details und API-Referenz

### Vision
Menschen dabei unterstützen, selbstbewusst und optimal vorbereitet in wichtige berufliche Gespräche zu gehen – sei es ein Vorstellungsgespräch, eine Gehaltsverhandlung oder ein wichtiges Kundengespräch.

### Hauptfunktionen

| Modul | Zweck | Zielgruppe |
|-------|-------|------------|
| **Smart Briefings** | KI-generierte Wissenspakete zur optimalen Vorbereitung | Alle Nutzer vor wichtigen Gesprächen |
| **Live-Simulation** | Realistische Echtzeit-Gespräche mit KI-Interviewer | Fortgeschrittene, die unter Druck üben wollen |
| **Szenario-Training** | Strukturiertes Q&A mit sofortigem Feedback | Anfänger und systematische Lerner |
| **Wirkungs-Analyse** | Video-Training mit Körpersprache-Analyse | Nutzer, die an ihrer Präsenz arbeiten wollen |
| **Rhetorik-Gym** | Gamifiziertes Sprechtraining gegen Füllwörter | Alle, die ihre Redegewandtheit verbessern wollen |

### Kernvorteile
- **Kein menschlicher Trainer nötig** – Üben jederzeit und überall möglich
- **Sofortiges, objektives Feedback** – KI analysiert ohne Vorurteile
- **Personalisierte Vorbereitung** – Briefings und Training auf spezifische Situation zugeschnitten
- **Ganzheitlicher Ansatz** – Wissen + verbale + nonverbale Kommunikation
- **White-Label-fähig** – Integration in Partner-Plattformen mit eigenem Branding

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
│  - Audio/Video Handler             │                                      │
│  - Scenarios CRUD                  │                                      │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                           WordPress Database                               │
├───────────────────────────────────────────────────────────────────────────┤
│  wp_bewerbungstrainer_sessions         │  wp_bewerbungstrainer_simulator  │
│  wp_bewerbungstrainer_games            │  wp_bewerbungstrainer_video      │
│  wp_bewerbungstrainer_smartbriefing_*  │  Custom Post Types (Szenarien)   │
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
│                                     │  - Rhetorik-Game-Analyse            │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Verzeichnisstruktur

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
│   │   │   ├── SmartBriefingApp.jsx    # Haupt-Orchestrator
│   │   │   ├── SmartBriefingDashboard.jsx # Template-Auswahl
│   │   │   ├── SmartBriefingForm.jsx   # Variablen-Eingabe
│   │   │   ├── BriefingWorkbook.jsx    # Interaktives Workbook
│   │   │   ├── BriefingList.jsx        # Gespeicherte Briefings
│   │   │   └── BriefingResult.jsx      # Ergebnis-Ansicht (Legacy)
│   │   ├── RoleplayDashboard.jsx   # Live-Simulation: Szenario-Auswahl
│   │   ├── RoleplaySession.jsx     # Live-Simulation: Interview
│   │   ├── simulator/              # Szenario-Training Modul
│   │   │   ├── SimulatorApp.jsx        # Haupt-Orchestrator
│   │   │   ├── SimulatorDashboard.jsx  # Szenario-Auswahl
│   │   │   ├── SimulatorSession.jsx    # Training-Durchführung
│   │   │   ├── SimulatorWizard.jsx     # Setup-Assistent
│   │   │   ├── ImmediateFeedback.jsx   # Sofort-Feedback
│   │   │   └── SessionComplete.jsx     # Abschluss-Zusammenfassung
│   │   ├── video-training/         # Wirkungs-Analyse Modul
│   │   │   ├── VideoTrainingApp.jsx    # Haupt-Orchestrator
│   │   │   ├── VideoTrainingDashboard.jsx # Szenario-Auswahl
│   │   │   ├── VideoTrainingSession.jsx # Video-Aufnahme
│   │   │   └── VideoTrainingResults.jsx # Ergebnisse
│   │   ├── rhetorik-gym/           # Gamification-Modul
│   │   │   ├── RhetorikGym.jsx         # Spielmodus-Auswahl
│   │   │   └── GameSession.jsx         # Aktive Spielsitzung
│   │   ├── SessionHistory.jsx      # Übersicht aller Sessions
│   │   ├── TrainingSessionDetailView.jsx # Unified Detail-Ansicht
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
│   │   │   ├── button.jsx, card.jsx, dialog.jsx
│   │   │   ├── input.jsx, textarea.jsx, sidebar.jsx
│   │   │   └── ...
│   │   ├── LoginModal.jsx          # Benutzer-Authentifizierung
│   │   └── Toast.jsx               # Benachrichtigungen
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

### 1. Smart Briefings – KI-generierte Wissenspakete

> **"Wissen ist Macht – und das richtige Wissen zur richtigen Zeit ist Selbstvertrauen."**

#### Was ist Smart Briefing?

Smart Briefing ist ein KI-gestütztes Vorbereitungssystem, das personalisierte Wissenspakete für berufliche Gespräche generiert. Statt stundenlang im Internet zu recherchieren, erhalten Nutzer in Sekunden ein maßgeschneidertes Briefing mit allem, was sie für ihr spezifisches Gespräch wissen müssen.

#### Das Problem, das es löst

- **Zeitaufwändige Recherche**: Vor wichtigen Gesprächen verbringen Menschen Stunden mit unstrukturierter Internet-Recherche
- **Informationsüberflutung**: Zu viele Informationen führen zu Unsicherheit statt Selbstvertrauen
- **Fehlender roter Faden**: Ohne Struktur wissen Bewerber nicht, welche Informationen wirklich relevant sind

#### Die Lösung

Ein strukturiertes, KI-generiertes Wissenspaket mit:
- **Insider-Wissen** über die Zielposition und das Unternehmen
- **Konkrete Formulierungshilfen** für schwierige Fragen
- **Strategische Tipps** für die spezifische Gesprächssituation
- **Persönliche Notizen** zu jedem Punkt hinzufügbar

#### Verfügbare Briefing-Templates

| Template | Kategorie | Einsatzzweck |
|----------|-----------|--------------|
| **Job Interview Deep-Dive** | Karriere | Vorstellungsgespräch mit Position, Unternehmen, Interviewtyp |
| **Gehaltsverhandlung Prep** | Karriere | Gehaltsverhandlung mit Marktanalyse, Argumenten, Konterstrategien |
| **Kundengespräch Vorbereitung** | Vertrieb | Wichtige Kundenmeetings mit Branchenkontext |
| **Feedback-Gespräch** | Führung | Mitarbeitergespräche mit Gesprächsstruktur |

#### Benutzer-Workflow

```
1. TEMPLATE AUSWÄHLEN
   ├─ Dashboard zeigt verfügbare Templates
   ├─ Kategoriefilter (Karriere, Vertrieb, Führung, Kommunikation)
   └─ Beschreibung und benötigte Eingabefelder sichtbar

2. VARIABLEN EINGEBEN
   ├─ Dynamisches Formular basierend auf Template
   ├─ Beispiel für "Job Interview Deep-Dive":
   │   ├─ Position: "Senior Software Engineer"
   │   ├─ Unternehmen: "Google Germany"
   │   └─ Interview-Typ: "Finales Interview"
   └─ Validierung der Pflichtfelder

3. BRIEFING GENERIEREN
   ├─ Gemini erstellt strukturiertes Briefing (~10 Sekunden)
   ├─ Automatische Speicherung in der Datenbank
   └─ Redirect zum Workbook

4. WORKBOOK NUTZEN
   ├─ Sections aufklappen/zuklappen
   ├─ Items durcharbeiten
   ├─ Persönliche Notizen zu jedem Punkt hinzufügen ✏️
   ├─ Irrelevante Punkte löschen 🗑️ (wiederherstellbar)
   ├─ "5 weitere Punkte generieren" pro Section
   └─ Briefing jederzeit wieder aufrufen
```

#### Technische Umsetzung

**Frontend-Komponenten:**
- `SmartBriefingApp.jsx` – State-Management und View-Router
- `SmartBriefingDashboard.jsx` – Template-Grid mit Kategoriefilter
- `SmartBriefingForm.jsx` – Dynamische Formulargenerierung
- `BriefingWorkbook.jsx` – Interaktives Workbook mit Item-Management
- `BriefingList.jsx` – Gespeicherte Briefings des Nutzers

**Backend:**
- `class-smartbriefing-api.php` – REST API für Templates, Generation, CRUD
- `class-smartbriefing-database.php` – Drei Tabellen (Templates, Briefings, Sections)

**Datenbank-Schema:**
```sql
wp_bewerbungstrainer_smartbriefing_templates  -- Vorlagen mit System-Prompts
wp_bewerbungstrainer_smartbriefing_briefings  -- Generierte Briefings der User
wp_bewerbungstrainer_smartbriefing_sections   -- Sections mit Items (JSON)
```

---

### 2. Live-Simulation – Realistische Echtzeit-Gespräche

> **"Übung macht den Meister – aber nur realistische Übung."**

#### Was ist Live-Simulation?

Live-Simulation ermöglicht echte, bidirektionale Sprachgespräche mit einem KI-gesteuerten Interviewer. Anders als bei vorbereiteten Antworten müssen Nutzer hier spontan reagieren – genau wie in einem echten Gespräch.

#### Das Problem, das es löst

- **Keine spontanen Antworten geübt**: Die meisten üben nur auswendig gelernte Antworten
- **Fehlende Drucksituation**: Alleine vor dem Spiegel üben erzeugt keinen echten Stress
- **Kein menschlicher Sparringspartner**: Freunde und Familie sind oft zu nett oder nicht verfügbar

#### Die Lösung

Ein KI-Interviewer mit:
- **Realistischer Stimme** (ElevenLabs Text-to-Speech)
- **Natürlicher Gesprächsführung** (keine Skripte, echte Konversation)
- **Anpassbarem Schwierigkeitsgrad** (freundlich / kritisch / professionell)
- **Scenario-spezifischen Einwänden** und Nachfragen

#### Interviewer-Persönlichkeiten

| Stil | Beschreibung | Typische Fragen |
|------|--------------|-----------------|
| **Freundlich** | Ermutigend, unterstützend, hilft bei Blockaden | "Interessant! Können Sie mir mehr dazu erzählen?" |
| **Kritisch** | Herausfordernd, hakt nach, testet Belastbarkeit | "Das klingt gut, aber wie genau haben Sie das umgesetzt?" |
| **Professionell** | Sachlich, neutral, geschäftsmäßig | "Verstehe. Kommen wir zur nächsten Frage." |

#### Benutzer-Workflow

```
1. SZENARIO AUSWÄHLEN
   ├─ Dashboard mit verfügbaren Szenarien
   ├─ Filter nach Schwierigkeit (Leicht/Mittel/Schwer)
   ├─ Szenario-Details: Interviewer-Profil, typische Fragen, Dauer
   └─ Option: Eigenes Szenario erstellen

2. VARIABLEN EINGEBEN
   ├─ Name, Position, Unternehmen
   ├─ Gesprächsstil wählen (friendly/critical/professional)
   └─ Optional: Zusätzlicher Kontext

3. MIKROFON TESTEN
   ├─ Geräteauswahl
   ├─ Testaufnahme abspielen
   └─ Latenz-Check für Echtzeit-Kommunikation

4. LIVE-GESPRÄCH FÜHREN
   ├─ Desktop: 3-Spalten-Layout (Coaching | Interview | Transkript)
   ├─ Mobile: Gestapelt mit FAB-Buttons
   ├─ Echtzeit-Transkript mit Zeitstempeln
   ├─ Coaching-Hinweise während des Gesprächs
   └─ Timer zeigt Gesprächsdauer

5. ANALYSE ERHALTEN
   ├─ Strukturiertes Feedback (Gemini)
   │   ├─ Kommunikation
   │   ├─ Motivation
   │   ├─ Professionalität
   │   └─ Vorbereitung
   ├─ Paraverbale Analyse
   │   ├─ Füllwörter (mit Timestamps)
   │   ├─ Sprechtempo (WPM)
   │   ├─ Selbstsicherheit (Gauge)
   │   └─ Tonalität
   └─ Audio-Wiedergabe mit Seek zu Timestamps
```

#### Technische Umsetzung

**KI-Services:**
- **ElevenLabs Conversational AI** (@elevenlabs/react)
  - Bidirektionale Sprach-zu-Sprach-Kommunikation
  - Automatische TTS für Agent, STT für Nutzer
  - Variable Injection (user_name, position, company, conversation_style)
  - Audio-Recording der gesamten Session

- **Google Gemini API**
  - Transkript-Analyse nach Session-Ende
  - Multimodale Audio-Analyse (wenn Audio verfügbar)

**Frontend-Komponenten:**
- `RoleplayDashboard.jsx` – Szenario-Auswahl und Custom-Szenario-Builder
- `RoleplaySession.jsx` – Live-Interview-Interface mit ElevenLabs-Integration
- `RoleplayVariablesDialog.jsx` – Variablen-Eingabe vor Session-Start

---

### 3. Szenario-Training – Strukturiertes Lernen mit sofortigem Feedback

> **"Wer schnell Feedback bekommt, lernt schneller."**

#### Was ist Szenario-Training?

Szenario-Training ist ein strukturiertes Frage-Antwort-Format, bei dem Nutzer nach **jeder Antwort** sofortiges, detailliertes Feedback erhalten. Im Gegensatz zur Live-Simulation können Nutzer hier in ihrem eigenen Tempo lernen und verstehen, was funktioniert und was nicht.

#### Das Problem, das es löst

- **Keine Lernschleife**: Bei der Live-Simulation kommt das Feedback erst am Ende
- **Überforderung bei Anfängern**: Echtzeitgespräche sind für viele zu stressig
- **Keine systematische Verbesserung**: Ohne Feedback nach jeder Antwort bleibt unklar, was falsch war

#### Die Lösung

Ein geführtes Training mit:
- **Vordefinierten Fragen** zu spezifischen Szenarien
- **Sofortigem Feedback** nach jeder Antwort
- **Konkreten Verbesserungsvorschlägen**
- **Fortschrittsverfolgung** (welche Fragen wurden beantwortet)

#### Feedback-Struktur pro Antwort

```
📝 TRANSKRIPT
   └─ Vollständige Verschriftlichung der Antwort

✅ STÄRKEN
   ├─ "Gute Struktur mit klarem Einstieg"
   ├─ "Konkrete Beispiele genannt"
   └─ "Selbstbewusster Tonfall"

🔧 VERBESSERUNGSVORSCHLÄGE
   ├─ "Mehr Zahlen und Ergebnisse nennen"
   ├─ "STAR-Methode konsequenter anwenden"
   └─ "Füllwörter reduzieren (5x 'ähm')"

⭐ BEWERTUNG
   └─ Punktzahl mit Kurzbegründung
```

#### Benutzer-Workflow

```
1. SZENARIO AUSWÄHLEN
   ├─ Dashboard mit Szenarien nach Kategorie
   ├─ Vorschau: Anzahl Fragen, geschätzte Dauer
   └─ Schwierigkeitsgrad und Tags sichtbar

2. VORBEREITUNG
   ├─ Wizard mit Szenario-Kontext
   ├─ Tipps vor dem Start (STAR-Methode, etc.)
   ├─ Mikrofon-Auswahl und Test
   └─ Variablen eingeben (falls nötig)

3. TRAINING DURCHFÜHREN
   │
   │  ┌──────────────────────────────────────┐
   │  │         FRAGE 1 VON 8                │
   │  │  "Erzählen Sie etwas über sich"      │
   │  │                                      │
   │  │  [💡 Tipps anzeigen]                 │
   │  │                                      │
   │  │  🔴 [  AUFNAHME STARTEN  ]           │
   │  │      ⏸️ Pause möglich                │
   │  │                                      │
   │  │  ⏱️ 0:45 / ~2:00 empfohlen           │
   │  │                                      │
   │  │  [  ANTWORT ABSENDEN  ]              │
   │  └──────────────────────────────────────┘
   │
   ▼
   │  ┌──────────────────────────────────────┐
   │  │         SOFORT-FEEDBACK              │
   │  │                                      │
   │  │  📝 Transkript: "Mein Name ist..."   │
   │  │                                      │
   │  │  ✅ Stärken:                         │
   │  │     • Strukturierter Einstieg        │
   │  │     • Relevante Beispiele            │
   │  │                                      │
   │  │  🔧 Verbesserungen:                  │
   │  │     • Mehr Zahlen nennen             │
   │  │     • 3x "ähm" reduzieren            │
   │  │                                      │
   │  │  ⭐ 7/10 Punkte                      │
   │  │                                      │
   │  │  [WIEDERHOLEN]  [WEITER]             │
   │  └──────────────────────────────────────┘
   │
   └── Wiederhole für alle Fragen

4. ZUSAMMENFASSUNG
   ├─ Gesamtpunktzahl
   ├─ Stärken-/Schwächen-Überblick
   └─ Option: Session später fortsetzen
```

#### Technische Umsetzung

**Frontend-Komponenten:**
- `SimulatorApp.jsx` – State-Management, View-Router
- `SimulatorDashboard.jsx` – Szenario-Grid mit Filterung
- `SimulatorWizard.jsx` – Setup-Assistent mit Tipps
- `SimulatorSession.jsx` – Frage-Antwort-Interface mit Recording
- `ImmediateFeedback.jsx` – Feedback-Anzeige nach jeder Antwort
- `SessionComplete.jsx` – Abschluss-Zusammenfassung

**Backend:**
- `class-simulator-api.php` – REST API für Sessions, Answers, Feedback
- `class-simulator-database.php` – Sessions, Answers, Scenarios
- `class-simulator-admin.php` – WordPress Admin für Szenario-Verwaltung

---

### 4. Wirkungs-Analyse – Video-Training mit Körpersprache-Feedback

> **"93% der Kommunikation ist nonverbal – Zeit, daran zu arbeiten."**

#### Was ist Wirkungs-Analyse?

Wirkungs-Analyse ist ein Video-basiertes Training, das neben dem gesprochenen Wort auch Körpersprache, Mimik und Auftreten analysiert. Nutzer sehen sich selbst auf Video und erhalten KI-Feedback zu ihrer gesamten Wirkung.

#### Das Problem, das es löst

- **Blinder Fleck Körpersprache**: Die meisten wissen nicht, wie sie auf andere wirken
- **Nervöse Ticks**: Unbewusste Gesten und Bewegungen bleiben unbemerkt
- **Keine Video-Übung**: Sich selbst auf Video zu sehen ist ungewohnt und unangenehm

#### Die Lösung

Ein Video-Training mit:
- **Kamera-Aufnahme** während der Antworten
- **KI-Analyse der Körpersprache** (Gemini Vision)
- **Video-Wiedergabe** zur Selbstreflexion
- **Konkreten Tipps** zu Haltung, Gestik, Mimik

#### Analysierte Aspekte

| Kategorie | Was analysiert wird | Beispiel-Feedback |
|-----------|--------------------|--------------------|
| **Augenkontakt** | Blickrichtung, Häufigkeit | "Mehr direkter Blick in die Kamera empfohlen" |
| **Körperhaltung** | Aufrecht, entspannt, verkrampft | "Schultern sind angespannt, bewusst lockern" |
| **Gestik** | Handbewegungen, Nervosität | "Hände zeigen Nervosität, ruhiger halten" |
| **Mimik** | Lächeln, Stirnrunzeln | "Freundlicher Gesichtsausdruck, sehr gut!" |
| **Gesamtwirkung** | Professionell, sympathisch | "Selbstbewusstes Auftreten, weiter so" |

#### Benutzer-Workflow

```
1. SZENARIO AUSWÄHLEN
   ├─ Ähnlich wie Szenario-Training
   └─ Video-spezifische Szenarien verfügbar

2. KAMERA & MIKROFON EINRICHTEN
   ├─ Kamera-Auswahl (Frontkamera bevorzugt)
   ├─ Licht- und Rahmen-Check
   ├─ Mikrofon-Auswahl und Test
   └─ HD-Qualität (1280x720)

3. VIDEO-AUFNAHME
   ├─ Kontinuierliche Aufnahme über alle Fragen
   ├─ Fragen-Navigation (Vor/Zurück)
   ├─ Timestamps werden pro Frage gespeichert
   └─ Stop-Button beendet Aufnahme

4. UPLOAD & ANALYSE
   ├─ Video wird hochgeladen (FormData)
   ├─ Backend segmentiert Video nach Fragen
   ├─ Gemini Vision analysiert jeden Abschnitt
   └─ Fortschrittsanzeige während Analyse

5. ERGEBNISSE
   ├─ Video-Wiedergabe pro Frage
   ├─ Nonverbale Analyse neben Video
   ├─ Verbales Feedback (wie Szenario-Training)
   └─ Gesamtbewertung der Präsentation
```

#### Technische Umsetzung

**Frontend-Komponenten:**
- `VideoTrainingApp.jsx` – Haupt-Orchestrator
- `VideoTrainingDashboard.jsx` – Szenario-Auswahl
- `VideoTrainingSession.jsx` – Video-Recording mit MediaRecorder API
- `VideoTrainingResults.jsx` – Video-Player mit Analyse-Anzeige

**Backend:**
- `class-video-training-api.php` – REST API für Sessions
- `class-video-training-database.php` – Video-Sessions, Analysen

---

### 5. Rhetorik-Gym – Gamifiziertes Sprechtraining

> **"Äh, also, ähm... – Schluss damit!"**

#### Was ist Rhetorik-Gym?

Rhetorik-Gym ist ein spielerisches Kurzformat, das gezielt Füllwörter reduziert und die Sprechflüssigkeit verbessert. Mit Score-System, Highscores und schnellem Feedback macht es süchtig, immer besser zu werden.

#### Das Problem, das es löst

- **Unbewusste Füllwörter**: "Ähm", "also", "quasi", "sozusagen" rutschen automatisch raus
- **Zu schnelles/langsames Sprechen**: Optimales Tempo (120-150 WPM) ist schwer zu halten
- **Langweiliges Üben**: Klassisches Rhetorik-Training ist mühsam und trocken

#### Die Lösung

Ein Spiel mit:
- **60-90 Sekunden Challenges**: Kurz genug für zwischendurch
- **Echtzeit-Scoring**: Sofortige Punktzahl motiviert
- **Füllwort-Zähler**: Sichtbar machen, was unbewusst passiert
- **Highscore-System**: Eigene Bestleistung schlagen

#### Spielmodi

| Modus | Dauer | Beschreibung |
|-------|-------|--------------|
| **Der Klassiker** | 60s | Festes Thema, frei sprechen |
| **Zufalls-Thema** | 60s | Slot-Machine wählt Thema – Überraschungseffekt! |
| **Stress-Test** | 90s | Unerwartete Fragen – maximale Herausforderung |

#### Scoring-System (100 Punkte max)

| Kategorie | Max. Punkte | Beschreibung |
|-----------|-------------|--------------|
| **Wortanzahl** | 25 | Mindestmenge zeigt Redefluss |
| **Füllwörter** | 25 | -5 Punkte pro Füllwort |
| **Tempo** | 10 | Optimal: 120-150 WPM |
| **Inhalt** | 40 | KI bewertet Qualität der Antwort |

#### Benutzer-Workflow

```
1. MODUS WÄHLEN
   ├─ Drei Karten mit Modi
   ├─ Persönliche Statistiken sichtbar:
   │   ├─ Highscore: 87
   │   ├─ Spiele: 42
   │   ├─ Durchschnitt: 71
   │   └─ Übungszeit: 2h 15m
   └─ Mikrofon auswählen

2. THEMA ERHALTEN
   ├─ Klassiker: Festes Thema angezeigt
   ├─ Zufalls: "Spin"-Button für neues Thema
   └─ Stress: Überraschungsfrage

3. COUNTDOWN
   └─ 3... 2... 1... LOS!

4. SPRECHEN
   ├─ Großer Timer (farbcodiert: grün → gelb → rot)
   ├─ Audio-Visualisierung (Frequenz-Bars)
   └─ Stop-Button für vorzeitiges Ende

5. ERGEBNIS
   ├─ Großer Score mit Emoji
   │   ├─ 90+: 🏆 "Hervorragend!"
   │   ├─ 70+: 😊 "Gut gemacht!"
   │   ├─ 50+: 🤔 "Weiter üben!"
   │   └─ <50: 💪 "Du schaffst das!"
   ├─ Detaillierte Aufschlüsselung
   ├─ Füllwörter-Liste
   └─ [NOCHMAL]  [ANDERES THEMA]
```

#### Technische Umsetzung

**Frontend-Komponenten:**
- `RhetorikGym.jsx` – Modus-Auswahl, Statistiken, Themen
- `GameSession.jsx` – Recording, Timer, Audio-Visualisierung, Ergebnisse

**Backend:**
- `class-game-api.php` – REST API für Spiele, Statistiken
- `class-game-database.php` – Spiele-Tabelle mit Scores

**Optimierungen:**
- Schneller Gemini-Prompt für <3s Analyse
- Lokale Score-Berechnung (kein API-Call)
- Sofortiges Feedback-Gefühl

---

### 6. Session-Verlauf – Alle Trainings auf einen Blick

#### Zweck

Zentrale Übersicht aller durchgeführten Trainings mit der Möglichkeit, vergangene Sessions zu reviewen, fortzusetzen oder zu wiederholen.

#### Features

- **4 Tabs**: Smart Briefings | Szenario-Training | Wirkungs-Analyse | Live-Simulationen
- **Session-Cards** mit:
  - Szenario-Name und Datum
  - Score/Bewertung (farbcodiert)
  - Fortschritt (bei unvollständigen Sessions)
  - Aktionen: Fortsetzen, Wiederholen, Löschen
- **Detail-Ansicht** pro Session:
  - Audio/Video-Wiedergabe
  - Vollständiges Transkript
  - Feedback und Analyse
  - Export-Optionen

#### Technische Umsetzung

- `SessionHistory.jsx` – Tab-basierte Übersicht aller Session-Typen
- `TrainingSessionDetailView.jsx` – Unified Detail-Ansicht für alle Typen
- `DeleteConfirmDialog` – Styled Lösch-Bestätigung (kein Browser-Dialog)

---

### 7. White-Label Partner-System

#### Zweck

Ermöglicht Partner-Unternehmen, Karriereheld unter eigenem Branding in ihre Plattformen zu integrieren.

#### Funktionsweise

```
1. Partner-Slug via URL: ?partner=karriereheld oder ?pid=kh

2. REST API liefert Partner-Konfiguration:
   GET /karriereheld/v1/config?partner_slug=xxx

3. React PartnerContext wendet Theming an:
   - CSS-Variablen für Farben
   - Logo-Austausch
   - Modul-Filterung (welche Features sichtbar)
```

#### Konfigurierbare Elemente

| Element | CSS-Variable | Beispiel |
|---------|--------------|----------|
| Header-Gradient | `--header-gradient` | `linear-gradient(135deg, #4F46E5, #7C3AED)` |
| Primary Accent | `--primary-accent` | `#4F46E5` |
| Sidebar Background | `--sidebar-bg` | `#1E293B` |
| Button Style | `--button-gradient` | Solid oder Gradient |
| Logo | `--logo-url` | Partner-Logo-URL |
| Sichtbare Module | `visible_modules` | `["briefings", "simulator", "gym"]` |

#### Technische Umsetzung

- `PartnerContext.jsx` – React Context für globales Theming
- `usePartnerTheming.js` – Hook für CSS-Variablen-Injection
- `useBranding.js` – Hook für einfachen Zugriff auf Branding-Werte
- `class-whitelabel-partners.php` – WordPress Custom Post Type
- Demo-Code-System für Testnutzer ohne Account

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

### Smart Briefings (3 Tabellen)

**wp_bewerbungstrainer_smartbriefing_templates**
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | bigint(20) | Primärschlüssel |
| `title` | varchar(255) | Template-Name |
| `description` | text | Beschreibung für Dashboard |
| `icon` | varchar(50) | Lucide-Icon-Name |
| `category` | varchar(100) | CAREER, SALES, LEADERSHIP, COMMUNICATION |
| `system_prompt` | longtext | Gemini-Prompt mit ${variable}-Platzhaltern |
| `variables_schema` | JSON | Array von Formfeld-Definitionen |
| `is_active` | tinyint | Aktiv/Inaktiv |
| `sort_order` | int | Reihenfolge im Dashboard |

**wp_bewerbungstrainer_smartbriefing_briefings**
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | bigint(20) | Primärschlüssel |
| `user_id` | bigint(20) | WordPress User ID |
| `template_id` | bigint(20) | Referenz auf Template |
| `title` | varchar(255) | Auto-generierter Titel |
| `variables` | JSON | Eingegebene Variablen |
| `status` | varchar(20) | generating/completed/failed |
| `demo_code` | varchar(50) | Demo-Code für Gast-Nutzer |
| `created_at` | datetime | Erstellungszeitpunkt |

**wp_bewerbungstrainer_smartbriefing_sections**
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | bigint(20) | Primärschlüssel |
| `briefing_id` | bigint(20) | Referenz auf Briefing |
| `sort_order` | int | Reihenfolge der Section |
| `section_title` | varchar(255) | Section-Überschrift |
| `ai_content` | JSON | Items-Array mit {id, label, content, deleted, user_note} |
| `user_notes` | text | Section-Level Notizen |

---

### Live-Simulation (wp_bewerbungstrainer_sessions)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | bigint(20) | Primärschlüssel |
| `user_id` | bigint(20) | WordPress User ID |
| `session_id` | varchar(255) | UUID der Session |
| `scenario_id` | bigint(20) | Referenz auf Szenario |
| `position` | varchar(255) | Beworbene Position |
| `company` | varchar(255) | Zielunternehmen |
| `conversation_id` | varchar(255) | ElevenLabs Conversation ID |
| `conversation_style` | varchar(50) | friendly/critical/professional |
| `audio_filename` | varchar(255) | Audio-Dateiname |
| `audio_url` | text | Audio-URL |
| `transcript` | longtext | Gesprächs-Transkript |
| `feedback_json` | longtext | Gemini Feedback als JSON |
| `audio_analysis_json` | longtext | Paraverbale Analyse |
| `created_at` | datetime | Erstellungszeitpunkt |

---

### Szenario-Training (Simulator)

**wp_bewerbungstrainer_simulator_sessions**
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | bigint(20) | Primärschlüssel |
| `user_id` | bigint(20) | WordPress User ID |
| `scenario_id` | bigint(20) | Referenz auf Szenario |
| `status` | varchar(20) | in_progress/completed |
| `overall_score` | decimal(5,2) | Durchschnittliche Bewertung |
| `completed_questions` | int | Anzahl beantworteter Fragen |
| `total_questions` | int | Gesamtzahl Fragen |
| `demo_code` | varchar(50) | Demo-Code für Gast-Nutzer |

**wp_bewerbungstrainer_simulator_answers**
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | bigint(20) | Primärschlüssel |
| `session_id` | bigint(20) | Referenz auf Session |
| `question_index` | int | Frage-Nummer |
| `audio_url` | text | Audio der Antwort |
| `transcript` | longtext | Transkript |
| `feedback_json` | longtext | Gemini-Feedback |
| `score` | decimal(5,2) | Bewertung |

---

### Video-Training (Wirkungs-Analyse)

**wp_bewerbungstrainer_video_sessions**
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | bigint(20) | Primärschlüssel |
| `user_id` | bigint(20) | WordPress User ID |
| `scenario_id` | bigint(20) | Referenz auf Szenario |
| `video_url` | text | Video-URL |
| `video_duration_seconds` | int | Video-Länge |
| `timeline_json` | JSON | Timestamps pro Frage |
| `overall_score` | decimal(5,2) | Gesamtbewertung |
| `status` | varchar(20) | recording/analyzing/completed |

---

### Rhetorik-Gym (wp_bewerbungstrainer_games)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | bigint(20) | Primärschlüssel |
| `user_id` | bigint(20) | WordPress User ID |
| `game_mode` | varchar(50) | classic/random/stress |
| `topic` | varchar(255) | Thema |
| `score` | int(11) | Gesamtpunktzahl (0-100) |
| `filler_count` | int(11) | Anzahl Füllwörter |
| `words_per_minute` | int(11) | Sprechtempo |
| `audio_url` | text | Audio-Aufnahme |
| `transcript` | longtext | Transkript |
| `analysis_json` | longtext | Gemini-Analyse |
| `demo_code` | varchar(50) | Demo-Code für Gast-Nutzer |
| `created_at` | datetime | Erstellungszeitpunkt |

---

### Custom Post Types

| Post Type | Beschreibung |
|-----------|--------------|
| `roleplay_scenario` | Live-Simulationen (Szenarien mit Interviewer-Profil) |
| `simulator_scenario` | Szenario-Training (Fragen-Sets) |
| `video_scenario` | Video-Training (Szenarien) |
| `whitelabel_partner` | White-Label Partner-Konfiguration |

---

## REST API Endpoints

### Namespace: bewerbungstrainer/v1

#### Smart Briefings

| Methode | Endpoint | Auth | Beschreibung |
|---------|----------|------|--------------|
| GET | `/smartbriefing/templates` | - | Alle aktiven Templates |
| GET | `/smartbriefing/templates/{id}` | - | Einzelnes Template |
| POST | `/smartbriefing/generate` | Optional | Briefing generieren |
| GET | `/smartbriefing/briefings` | Ja | Briefings des Users |
| GET | `/smartbriefing/briefings/{id}` | - | Einzelnes Briefing mit Sections |
| DELETE | `/smartbriefing/briefings/{id}` | Ja | Briefing löschen |
| PATCH | `/smartbriefing/sections/{id}` | Ja | Section aktualisieren |
| PATCH | `/smartbriefing/sections/{id}/items/{item_id}` | Ja | Item aktualisieren (Note, Delete) |
| POST | `/smartbriefing/sections/{id}/generate-more` | Ja | 5 weitere Items generieren |

#### Live-Simulation (Roleplay)

| Methode | Endpoint | Auth | Beschreibung |
|---------|----------|------|--------------|
| GET | `/sessions` | Ja | Alle Sessions des Users |
| GET | `/sessions/{id}` | Ja | Einzelne Session |
| POST | `/sessions` | Ja | Neue Session erstellen |
| PUT | `/sessions/{id}` | Ja | Session aktualisieren |
| DELETE | `/sessions/{id}` | Ja | Session löschen |
| GET | `/scenarios` | - | Verfügbare Szenarien |
| POST | `/audio/save-elevenlabs` | Ja | Audio von ElevenLabs speichern |

#### Szenario-Training (Simulator)

| Methode | Endpoint | Auth | Beschreibung |
|---------|----------|------|--------------|
| GET | `/simulator/scenarios` | - | Alle Simulator-Szenarien |
| GET | `/simulator/scenarios/{id}` | - | Einzelnes Szenario mit Fragen |
| GET | `/simulator/sessions` | Ja | Sessions des Users |
| POST | `/simulator/sessions` | Ja | Neue Session starten |
| GET | `/simulator/sessions/{id}` | Ja | Session mit Antworten |
| DELETE | `/simulator/sessions/{id}` | Ja | Session löschen |
| POST | `/simulator/sessions/{id}/answers` | Ja | Antwort speichern |

#### Video-Training (Wirkungs-Analyse)

| Methode | Endpoint | Auth | Beschreibung |
|---------|----------|------|--------------|
| GET | `/video-training/scenarios` | - | Alle Video-Szenarien |
| GET | `/video-training/sessions` | Ja | Sessions des Users |
| POST | `/video-training/sessions` | Ja | Neue Session starten |
| GET | `/video-training/sessions/{id}` | Ja | Session mit Analyse |
| DELETE | `/video-training/sessions/{id}` | Ja | Session löschen |
| POST | `/video-training/sessions/{id}/video` | Ja | Video hochladen |

#### Rhetorik-Gym

| Methode | Endpoint | Auth | Beschreibung |
|---------|----------|------|--------------|
| GET | `/games` | Ja | Spiele des Users |
| POST | `/games` | Ja | Neues Spiel speichern |
| GET | `/games/stats` | Ja | Statistiken (Highscore, etc.) |

#### Allgemein

| Methode | Endpoint | Auth | Beschreibung |
|---------|----------|------|--------------|
| POST | `/audio/upload` | Ja | Audio hochladen (base64) |
| GET | `/user/info` | Ja | Benutzer-Informationen |
| GET | `/settings` | - | Plugin-Einstellungen |
| POST | `/gemini/feedback` | Ja | Feedback generieren |
| POST | `/gemini/audio-analysis` | Ja | Audio analysieren |

---

### Namespace: karriereheld/v1

| Methode | Endpoint | Auth | Beschreibung |
|---------|----------|------|--------------|
| GET | `/config` | - | Partner-Konfiguration |
| POST | `/login` | - | Benutzer-Login |
| POST | `/logout` | Ja | Benutzer-Logout |
| GET | `/user` | Ja | Aktueller Benutzer |
| GET | `/demo-codes` | Admin | Demo-Codes verwalten |
| POST | `/demo-codes` | Admin | Neuen Demo-Code erstellen |
| DELETE | `/demo-codes/{code}` | Admin | Demo-Code löschen

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

### ⚠️ WICHTIG: Styling-Standard (Tailwind CSS)

**Tailwind CSS** ist der Standard für dieses Projekt.

```jsx
// ✅ RICHTIG: Tailwind (für neue Komponenten und Migrationen)
<button className="flex items-center gap-2 px-4 py-3
                   bg-primary text-white rounded-xl
                   hover:bg-primary/90 transition-all">

// ⚠️ LEGACY: Inline Styles (nicht aktiv ändern, nur bei Bedarf migrieren)
<button style={{ padding: '12px 16px', backgroundColor: '#3A7FA7' }}>
```

**Regeln:**
1. **Neue Komponenten** → Immer Tailwind verwenden
2. **Bestehende Komponenten bearbeiten** → Schrittweise auf Tailwind migrieren
3. **Nur lesen/kleine Fixes** → Bestehenden Stil belassen

**Warum Tailwind?**
- Hover/Focus: `hover:bg-blue-600` statt JS-State
- Responsive: `md:flex lg:grid` eingebaut
- Kleinere Bundle-Size (Klassen wiederverwendet)
- Konsistenz durch feste Utility-Klassen

**IST-Zustand (historisch gewachsen):**
- ~64% Inline Styles (Legacy)
- ~36% Tailwind Classes
- Migration erfolgt schrittweise bei Bedarf

---

### Komponenten-Patterns

#### 1. Dashboard-Komponenten

**Für Szenarien-basierte Features** → `ScenarioDashboard` verwenden:
```jsx
// ✅ SimulatorDashboard, RoleplayDashboard, SmartBriefingDashboard, VideoTrainingDashboard
<ScenarioDashboard
  title="Feature-Name"
  subtitle="Beschreibung"
  headerIcon={Icon}
  headerActions={<FeatureInfoButton featureId="xxx" size="sm" />}
  fetchScenarios={fetchFunction}
  moduleKey="module_key"
  historyButtonLabel="Meine Sessions"
  onNavigateToHistory={navigateFunction}  // ⚠️ NICHT VERGESSEN!
  // ... weitere Props
/>
```

**Für spezielle Features** (IkigaiApp, DecisionBoardApp) → Eigene Struktur, aber gleiche Header-Logik.

#### 2. Feature-Info System

Jedes Feature braucht:
```jsx
// 1. Modal beim ersten Besuch (auto-show)
<FeatureInfoModal featureId="featurename" showOnMount />

// 2. Info-Button im Header (manuell öffnen)
headerActions={<FeatureInfoButton featureId="featurename" size="sm" />}

// 3. Eintrag in featureDescriptions.js
```

#### 3. Auth-geschützte Features

```jsx
// Für Features die Login erfordern (Ikigai, DecisionBoard):
useEffect(() => {
  if (!isAuthenticated && requireAuth) {
    requireAuth();
  }
}, [isAuthenticated, requireAuth]);
```

---

### Props-Checkliste

Beim Hinzufügen neuer Features in `App.jsx`, IMMER prüfen:

```jsx
<FeatureApp
  isAuthenticated={isAuthenticated}      // ✅ Auth-Status
  requireAuth={requireAuth}              // ✅ Login-Funktion
  setPendingAction={setPendingAction}    // ✅ Für Post-Login-Actions
  onNavigateToHistory={() => navigate(ROUTES.HISTORY)}  // ⚠️ OFT VERGESSEN!
/>
```

---

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
    <div style={{ padding: '24px' }}>
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

### Design Tokens & Tailwind

**Bei Tailwind:** Nutze die Standard-Klassen oder erweitere `tailwind.config.js`:

```jsx
// ✅ Tailwind Standard-Klassen
<div className="text-slate-600 rounded-xl p-6 transition-all">

// ✅ Custom Tailwind (in tailwind.config.js definiert)
<button className="bg-primary text-white rounded-card">

// ⚠️ Legacy: Design Tokens aus config (nur bei Inline Styles)
import { COLORS } from '@/config/colors';
style={{ color: COLORS.slate[600] }}
```

**Tailwind Config erweitern** (`tailwind.config.js`):
```js
theme: {
  extend: {
    colors: {
      primary: 'var(--primary-accent)', // Partner-Theming
    },
    borderRadius: {
      'card': '16px',
    }
  }
}
```

### Console Logging

```javascript
// Einheitliches Format mit Präfixen
console.log('[APP] Module loaded');
console.log('[GEMINI] Starting request...');
console.log('[SUCCESS] Operation completed');
console.log('[ERROR] Something failed:', error);
console.log('[WARN] Potential issue');
```

---

### Häufige Fehler vermeiden

| Fehler | Lösung |
|--------|--------|
| `onNavigateToHistory` nicht übergeben | Immer in App.jsx bei Route prüfen |
| History-Button fehlt | `showHistoryButton` und `onNavigateToHistory` Props setzen |
| Feature-Info fehlt | `FeatureInfoModal` + `FeatureInfoButton` + Eintrag in config |
| Inkonsistentes Styling | Tailwind für neue Komponenten, Legacy-Styles belassen |
| Hardcoded Farben | Tailwind-Klassen oder `COLORS` aus config verwenden |

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

| Version | Datum | Änderungen |
|---------|-------|------------|
| **v1.0.0** | 2025-11-17 | Initiale WordPress-Plugin-Version mit Live-Simulation |
| **v1.1.0** | 2025-11-24 | Conversation Style Feature (friendly/critical/professional) |
| **v1.2.0** | 2025-12-01 | White-Label Partner-System |
| **v1.3.0** | 2025-12-08 | Smart Briefings Feature mit Templates und Workbook |
| **v1.4.0** | 2025-12-15 | Video-Training (Wirkungs-Analyse) mit Körpersprache-Feedback |

---

## Feature-Vergleich

| Feature | Dauer | Feedback | KI-Service | Hauptnutzen |
|---------|-------|----------|------------|-------------|
| **Smart Briefings** | ~10s Generierung | Sofort | Gemini | Wissen aufbauen |
| **Live-Simulation** | ~10 min | Nach Session | ElevenLabs + Gemini | Spontanität üben |
| **Szenario-Training** | ~15-30 min | Nach jeder Antwort | Gemini | Systematisch lernen |
| **Wirkungs-Analyse** | ~15-30 min | Nach Upload | Gemini Vision | Körpersprache verbessern |
| **Rhetorik-Gym** | 60-90s | Sofort | Gemini | Füllwörter reduzieren |

---

**Letzte Aktualisierung:** 2025-12-15
**Dokumentations-Version:** 3.0.0
