# Briefing: Live-Simulation (Roleplay-Modul)

**Stand:** Dezember 2025
**Zielgruppe:** Agentur / Partner
**Status:** Aktuell

---

## 1. Was ist die Live-Simulation?

Die Live-Simulation ermöglicht **echte, bidirektionale Sprachgespräche** zwischen dem Nutzer und einem KI-gesteuerten Gesprächspartner. Anders als bei vorbereiteten Frage-Antwort-Szenarien muss der Nutzer hier **spontan reagieren** – genau wie in einem echten Gespräch.

### Kernmerkmale:
- **Echtzeit-Voice-to-Voice:** Nutzer spricht, KI antwortet sofort mit natürlicher Stimme
- **Dynamisches Gespräch:** Keine festen Skripte, echte Konversation
- **Live-Coaching:** Tipps während des Gesprächs in Echtzeit
- **Detaillierte Analyse:** Nach dem Gespräch strukturiertes Feedback + Audio-Analyse

### Technologie-Stack:
| Komponente | Dienst | Funktion |
|------------|--------|----------|
| Voice-Konversation | ElevenLabs Conversational AI | Bidirektionale Sprache (TTS + STT) |
| Live-Coaching | Google Gemini | Echtzeit-Tipps generieren |
| Feedback-Analyse | Google Gemini | Transkript + Audio analysieren |

---

## 2. Benutzer-Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  1. SZENARIO AUSWÄHLEN                                                  │
│     └─ Dashboard zeigt alle Szenarien gefiltert nach Kategorie          │
│     └─ Nutzer wählt ein Szenario (z.B. "Vorstellungsgespräch")          │
└────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  2. VARIABLEN EINGEBEN                                                  │
│     └─ Dynamisches Formular basierend auf Szenario                      │
│     └─ Beispiel: Name, Unternehmen, Position, Erfahrungslevel           │
│     └─ Diese Werte werden in den KI-Prompt eingefügt                    │
└────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  3. MIKROFON-SETUP                                                      │
│     └─ Gerät auswählen                                                  │
│     └─ Optional: Testaufnahme                                           │
└────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  4. LIVE-GESPRÄCH                                                       │
│     ┌─────────────────┬─────────────────┬─────────────────┐             │
│     │  Coaching-Panel │ Interview-Panel │ Transkript-Panel│             │
│     │  (Echtzeit-Tipps)│ (Gesprächs-UI)  │ (Mitschrift)    │             │
│     └─────────────────┴─────────────────┴─────────────────┘             │
│     └─ Nutzer spricht mit KI-Interviewer                                │
│     └─ Coaching-Tipps werden nach jeder Aussage aktualisiert            │
│     └─ Timer zeigt Gesprächsdauer                                       │
└────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  5. ANALYSE & FEEDBACK                                                  │
│     └─ Strukturiertes Feedback (Kommunikation, Motivation, etc.)        │
│     └─ Paraverbale Analyse (Füllwörter, Sprechtempo, Tonalität)         │
│     └─ Audio-Wiedergabe mit klickbaren Zeitstempeln                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Kategorien-System

Szenarien werden nach **Kategorien** gefiltert und angezeigt:

| Kategorie | Slug | Farbe | Icon | Beispiel-Szenarien |
|-----------|------|-------|------|--------------------|
| **Bewerbung & Karriere** | CAREER | Blau | Briefcase | Vorstellungsgespräch, Gehaltsverhandlung |
| **Leadership & Führung** | LEADERSHIP | Lila | Target | Mitarbeitergespräch, Teamkonflikt |
| **Vertrieb & Verhandlung** | SALES | Grün | TrendingUp | Kundentermin, Vertragsverhandlung |
| **Kommunikation & Konflikt** | COMMUNICATION | Amber | MessageCircle | Kritikgespräch, Konfliktlösung |

### Filterung:
- Nutzer kann im Dashboard nach Kategorie filtern
- Szenarien können **mehreren Kategorien** zugeordnet sein
- Zusätzlich: Filter nach "Trainings-Setup" (z.B. Vertriebsmitarbeiter, Führungskraft)

---

## 4. Szenario-Datenstruktur

Ein Szenario besteht aus folgenden Feldern:

### Grundinformationen
| Feld | Beschreibung | Beispiel |
|------|--------------|----------|
| `title` | Name des Szenarios | "Vorstellungsgespräch Senior Developer" |
| `description` | Kurzbeschreibung (Dashboard) | "Realistische Simulation eines Bewerbungsgesprächs" |
| `long_description` | Ausführliche Aufgabenbeschreibung | "Du bewirbst dich bei {{company}} für die Position..." |
| `difficulty` | Schwierigkeitsgrad | easy / medium / hard |
| `category` | Kategorien (JSON-Array) | `["CAREER"]` |

### KI-Konfiguration
| Feld | Beschreibung | Beispiel |
|------|--------------|----------|
| `agent_id` | ElevenLabs Agent ID | `agent_xxx_from_elevenlabs` |
| `content` | System-Prompt für die KI | "Du bist ein professioneller HR-Manager..." |
| `initial_message` | Erste Nachricht der KI | "Guten Morgen {{user_name}}, willkommen!" |
| `feedback_prompt` | Optionaler Custom-Prompt für Feedback | (siehe Abschnitt 7) |

### Interviewer-Profil
| Feld | Beschreibung | Beispiel |
|------|--------------|----------|
| `name` | Name des KI-Gesprächspartners | "Sarah Müller" |
| `role` | Rolle/Position | "HR-Managerin bei {{company}}" |
| `properties` | Charaktereigenschaften | "Freundlich, professionell, direkt" |
| `typical_objections` | Typische Einwände/Pain Points | "Branchenkenntnisse?, Führungserfahrung?" |
| `important_questions` | Erwartete Fragen | "Erzählen Sie von Ihrem größten Projekt" |

### Coaching & Tipps
| Feld | Beschreibung | Beispiel |
|------|--------------|----------|
| `coaching_hints` | Statische Tipps (vor dem Gespräch) | "- STAR-Methode nutzen\n- Konkrete Beispiele nennen" |
| `tips` | Strukturierte Tipps (JSON) | `[{icon: "target", title: "Vorbereitung", text: "..."}]` |

### Variablen-Schema
| Feld | Beschreibung | Beispiel |
|------|--------------|----------|
| `variables_schema` | Dynamische Eingabefelder | (siehe Abschnitt 5) |
| `role_type` | Art des Rollenspiels | interview / simulation |
| `user_role_label` | Rolle des Nutzers | "Bewerber" / "Verkäufer" |

---

## 5. Variablen-System

### Was sind Variablen?
Variablen ermöglichen **personalisierte Szenarien**. Der Nutzer gibt Werte ein (z.B. Unternehmensname), die dann überall im Szenario eingesetzt werden.

### Platzhalter-Syntax
```
{{variable_name}}
```

Beispiel:
```
System-Prompt:
"Du bist ein Interviewer bei {{company}} und führst ein Gespräch
mit {{user_name}} für die Position {{position}}."

→ Wird zu:
"Du bist ein Interviewer bei Google und führst ein Gespräch
mit Max Mustermann für die Position Senior Engineer."
```

### Variable-Schema (JSON)
```json
{
  "key": "company",              // Interner Schlüssel ({{company}})
  "label": "Unternehmen",        // Angezeigter Feldname
  "type": "text",                // text, textarea, number, select
  "default": "Musterfirma GmbH", // Vorausgefüllter Wert
  "required": true,              // Pflichtfeld?
  "user_input": true,            // Im Formular anzeigen?
  "placeholder": "z.B. Google",  // Hinweistext
  "hint": "Das Zielunternehmen"  // Erklärung
}
```

### Variable-Typen
| Typ | Beschreibung | Beispiel |
|-----|--------------|----------|
| `text` | Einzeiliges Textfeld | Unternehmensname |
| `textarea` | Mehrzeiliges Textfeld | Hintergrund-Story |
| `number` | Zahlenfeld | Jahre Erfahrung |
| `select` | Dropdown-Auswahl | Schwierigkeitsgrad |

### Wo werden Variablen ersetzt?
1. **System-Prompt** (content) → An ElevenLabs
2. **Erste Nachricht** (initial_message) → An ElevenLabs
3. **Interviewer-Name** → UI-Anzeige
4. **Interviewer-Rolle** → UI-Anzeige
5. **Long Description** → Aufgabenbeschreibung
6. **Interviewer-Properties** → Coaching-Kontext
7. **Typische Einwände** → Coaching-Kontext

---

## 6. Prompt-Aufbau

Der finale Prompt an ElevenLabs besteht aus mehreren Teilen:

### 6.1 Basis-Prompt (vom Admin erstellt)
```
Du bist ein erfahrener HR-Manager bei {{company}}. Du führst ein
Vorstellungsgespräch mit {{user_name}} für die Position {{position}}.

DEIN VERHALTEN:
- Stelle offene Fragen
- Hake bei unklaren Antworten nach
- Sei professionell, aber freundlich
- Das Gespräch sollte ca. 10 Minuten dauern

GESPRÄCHSSTRUKTUR:
1. Begrüßung und Small Talk
2. "Erzählen Sie etwas über sich"
3. Fachliche Fragen zur Position
4. Verhaltensfragen (Situationsbeispiele)
5. Fragen des Bewerbers
6. Verabschiedung
```

### 6.2 Automatisch hinzugefügtes Interviewer-Profil
```
## Dein Profil:

Dein Name: Sarah Müller
Deine Rolle: HR-Managerin bei Google

### Deine Eigenschaften:
Freundlich, professionell, direkt, erfahren

### Typische Einwände:
- Hat der Bewerber genug Branchenkenntnisse?
- Passt er ins Team?
- Ist die Gehaltsvorstellung realistisch?

### Wichtige Fragen:
- Erzählen Sie von Ihrem größten Projekt
- Wie gehen Sie mit Konflikten um?
- Warum wollen Sie wechseln?
```

### 6.3 Dynamische Variablen (an ElevenLabs)
```javascript
dynamicVariables: {
  user_name: "Max Mustermann",
  company: "Google Germany",
  position: "Senior Software Engineer",
  interviewer_name: "Sarah Müller",
  interviewer_role: "HR-Managerin"
}
```

### Prompt-Zusammenfassung
```
┌────────────────────────────────────────────────────────────────┐
│                    FINALER SYSTEM-PROMPT                       │
├────────────────────────────────────────────────────────────────┤
│  1. Basis-Prompt (scenario.content)                            │
│     └─ Vom Admin geschrieben                                   │
│     └─ Enthält {{variable}} Platzhalter                        │
│                                                                │
│  2. Interviewer-Profil (automatisch hinzugefügt)               │
│     └─ Name & Rolle                                            │
│     └─ Eigenschaften                                           │
│     └─ Typische Einwände                                       │
│     └─ Wichtige Fragen                                         │
│                                                                │
│  3. Variable Replacement                                       │
│     └─ {{company}} → "Google"                                  │
│     └─ {{position}} → "Senior Engineer"                        │
│     └─ etc.                                                    │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. Feedback-System

### 7.1 Strukturiertes Feedback (Gemini)

Nach dem Gespräch analysiert Gemini das Transkript und generiert:

```json
{
  "kommunikation": {
    "score": 78,
    "feedback": "Gute Gesprächsstruktur mit klaren Aussagen..."
  },
  "motivation": {
    "score": 85,
    "feedback": "Hohe Motivation spürbar, gute Begründung..."
  },
  "professionalitaet": {
    "score": 72,
    "feedback": "Angemessener Umgangston, jedoch..."
  },
  "vorbereitung": {
    "score": 80,
    "feedback": "Gute Kenntnisse über das Unternehmen..."
  },
  "overall_score": 79,
  "staerken": ["Strukturierte Antworten", "Konkrete Beispiele"],
  "verbesserungen": ["Mehr Zahlen nennen", "STAR-Methode konsequenter"],
  "zusammenfassung": "Insgesamt ein solides Gespräch mit..."
}
```

### 7.2 Custom Feedback-Prompt

Jedes Szenario kann einen eigenen Feedback-Prompt haben:

```
Du bist ein erfahrener HR-Experte und analysierst folgendes Gespräch.

${transcript}

Bewerte in folgenden Kategorien (0-100):
1. Gesprächsstruktur: War das Interview logisch aufgebaut?
2. Fragetechnik: Wurden offene Fragen gestellt?
3. Professionalität: Angemessener Ton?
4. Tiefgang: Wurden relevante Informationen gewonnen?

Antworte als JSON: { ... }
```

### 7.3 Audio-Analyse (Paraverbal)

Zusätzlich analysiert Gemini die **Audio-Aufnahme**:

| Metrik | Beschreibung | Optimal |
|--------|--------------|---------|
| **Füllwörter** | Ähm, Also, Sozusagen, etc. | < 3 pro Minute |
| **Sprechtempo** | Wörter pro Minute (WPM) | 120-150 WPM |
| **Tonalität** | Monoton / Natürlich / Lebendig | Natürlich |
| **Selbstsicherheit** | Gauge 0-100% | > 70% |
| **Pausen-Issues** | Zu lange/kurze Pausen | Keine |

---

## 8. Live-Coaching Engine

### Wie funktioniert Echtzeit-Coaching?

1. **Trigger:** Nach jeder Aussage des KI-Interviewers (> 20 Zeichen)
2. **Input an Gemini:**
   - Letzte 4 Nachrichten des Gesprächs
   - Nächste Aussage des Interviewers
   - Interviewer-Eigenschaften & Pain Points
3. **Output:**
   ```json
   {
     "content_impulses": ["Konkrete Zahlen nennen", "Projekt-Beispiel bringen"],
     "behavioral_cue": "Ruhig und selbstbewusst antworten",
     "strategic_bridge": "Proaktiv die Teamarbeit betonen"
   }
   ```

### Coaching-Panel zeigt:
| Bereich | Icon | Inhalt |
|---------|------|--------|
| **Inhalt** | MessageSquare | 2-3 kurze Stichpunkte (max. 4 Wörter) |
| **Tonfall** | Zap | Verhaltens-Tipp (wie sprechen) |
| **Strategie** | Target | Bezug zu Pain Points des Interviewers |

---

## 9. ElevenLabs Integration

### Agent-Konfiguration
```javascript
// Session starten
await conversation.startSession({
  agentId: "agent_xxx",           // ElevenLabs Agent ID
  dynamicVariables: {             // Werden zu {{variable}} im Prompt
    user_name: "Max",
    company: "Google",
    position: "Senior Engineer"
  },
  inputDeviceId: selectedMic      // Gewähltes Mikrofon
});
```

### Was ElevenLabs macht:
1. **Speech-to-Text:** Nutzer-Sprache → Text
2. **LLM-Processing:** Text + Prompt → Antwort
3. **Text-to-Speech:** Antwort → natürliche Stimme
4. **Audio-Recording:** Gesamtes Gespräch speichern

### Audio-Abruf nach Session:
```
Frontend → WordPress Proxy → ElevenLabs API
            ↓
       Audio-Blob (MP3)
            ↓
       Gemini Audio-Analyse
```

---

## 10. Rollenspielmodus

### Zwei Modi möglich:

| Modus | `role_type` | Nutzer ist | KI ist |
|-------|-------------|------------|--------|
| **Interview** | `interview` | Bewerber | Interviewer |
| **Simulation** | `simulation` | Interviewer | Bewerber |

### User Role Label
Das `user_role_label` bestimmt, wie der Nutzer im Feedback genannt wird:
- "Bewerber" → "Der Bewerber hat gut auf..."
- "Verkäufer" → "Der Verkäufer sollte mehr..."
- "Interviewer" → "Der Interviewer hat strukturiert..."

---

## 11. Datenbank-Speicherung

### Session-Tabelle
```
wp_bewerbungstrainer_sessions
├── id                    # Session-ID
├── user_id               # WordPress User
├── session_id            # UUID
├── scenario_id           # Szenario-Referenz
├── position              # Variable: Position
├── company               # Variable: Unternehmen
├── conversation_id       # ElevenLabs Conversation ID
├── conversation_style    # friendly/critical/professional
├── audio_filename        # Audio-Datei
├── audio_url             # Audio-URL
├── transcript            # JSON: [{role, text, timestamp}]
├── feedback_json         # Gemini Feedback
├── audio_analysis_json   # Paraverbale Analyse
├── created_at            # Zeitstempel
└── updated_at            # Letzte Änderung
```

---

## 12. Admin-Verwaltung

### Szenario erstellen (WordPress Backend)
1. **Rollenspiel-Szenarien** → Neu hinzufügen
2. Grunddaten ausfüllen (Titel, Beschreibung, Kategorie)
3. **ElevenLabs Agent ID** eingeben
4. **System-Prompt** schreiben (mit {{Variablen}})
5. **Interviewer-Profil** definieren
6. **Variablen-Schema** konfigurieren
7. Optional: Custom Feedback-Prompt
8. Veröffentlichen

### CSV Import/Export
- Szenarien können als CSV exportiert werden
- Felder: id, title, description, content, variables_schema, interviewer_*, etc.
- Import überschreibt oder erstellt neue Szenarien

---

## 13. Zusammenfassung: Wichtige Dateien

| Datei | Funktion |
|-------|----------|
| `RoleplayDashboard.jsx` | Szenario-Auswahl |
| `RoleplayVariablesPage.jsx` | Variablen-Eingabe |
| `RoleplaySession.jsx` | Live-Interview UI (Hauptkomponente) |
| `CoachingPanel.jsx` | Echtzeit-Coaching-Anzeige |
| `InterviewerProfile.jsx` | Interviewer-Details |
| `live-coaching-engine.js` | Coaching-Generierung |
| `roleplay-feedback-adapter.js` | Session-Analyse |
| `class-roleplay-scenarios.php` | Custom Post Type & Admin |
| `class-api.php` | REST API Endpoints |

---

## 14. Beispiel: Vollständiges Szenario

```json
{
  "title": "Vorstellungsgespräch Senior Developer",
  "description": "Realistische Simulation eines technischen Interviews",
  "long_description": "[Mission]: Du bewirbst dich bei {{company}} als {{position}}...",
  "difficulty": "medium",
  "category": ["CAREER"],
  "agent_id": "agent_abc123",
  "role_type": "interview",
  "user_role_label": "Bewerber",

  "content": "Du bist ein erfahrener Technical Recruiter bei {{company}}...",
  "initial_message": "Hallo {{user_name}}, schön dich kennenzulernen!",

  "variables_schema": [
    {"key": "user_name", "label": "Dein Name", "type": "text", "required": true},
    {"key": "company", "label": "Unternehmen", "type": "text", "default": "Google"},
    {"key": "position", "label": "Position", "type": "text", "default": "Senior Developer"}
  ],

  "interviewer_profile": {
    "name": "Thomas Berger",
    "role": "Technical Recruiter bei {{company}}",
    "properties": "Technisch versiert, direkt, aber fair",
    "typical_objections": "- Genug Erfahrung?\n- Team-Fit?\n- Technische Tiefe?",
    "important_questions": "- Größtes technisches Projekt?\n- Umgang mit Legacy-Code?"
  },

  "coaching_hints": "- STAR-Methode nutzen\n- Konkrete Zahlen nennen\n- Fragen stellen",

  "tips": [
    {"icon": "target", "title": "Vorbereitung", "text": "Recherchiere das Unternehmen"},
    {"icon": "message-square", "title": "Kommunikation", "text": "Nutze konkrete Beispiele"}
  ]
}
```

---

**Bei Fragen zur technischen Implementierung oder Erweiterung stehe ich gerne zur Verfügung.**
