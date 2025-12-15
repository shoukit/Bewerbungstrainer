# Karriereheld - Funktionales Design

**Version:** 3.0.0
**Stand:** Dezember 2025

---

## Inhaltsverzeichnis

1. [Produktübersicht](#1-produktübersicht)
2. [Module & Features](#2-module--features)
   - [2.1 Smart Briefings](#21-smart-briefings)
   - [2.2 Live-Simulation](#22-live-simulation)
   - [2.3 Szenario-Training](#23-szenario-training)
   - [2.4 Wirkungs-Analyse](#24-wirkungs-analyse)
   - [2.5 Rhetorik-Gym](#25-rhetorik-gym)
   - [2.6 Session-Historie](#26-session-historie)
3. [Szenario- & Live-Simulation-Konfiguration](#3-szenario---live-simulation-konfiguration)
   - [3.1 WordPress Custom Post Types](#31-wordpress-custom-post-types)
   - [3.2 Variablen-Schema](#32-variablen-schema)
   - [3.3 Interviewer-Profile](#33-interviewer-profile)
   - [3.4 ElevenLabs Agent-Integration](#34-elevenlabs-agent-integration)
4. [Bewertungssystem & KI-Prompts](#4-bewertungssystem--ki-prompts)
   - [4.1 Interview-Feedback (Text-basiert)](#41-interview-feedback-text-basiert)
   - [4.2 Audio-Analyse (Paraverbal)](#42-audio-analyse-paraverbal)
   - [4.3 Rhetorik-Gym Analyse](#43-rhetorik-gym-analyse)
   - [4.4 Bewertungsskalen](#44-bewertungsskalen)
5. [White-Label Branding](#5-white-label-branding)
   - [5.1 Partner-Konfiguration](#51-partner-konfiguration)
   - [5.2 CSS-Variablen](#52-css-variablen)
   - [5.3 Modul-Filterung](#53-modul-filterung)
6. [Benutzerauthentifizierung](#6-benutzerauthentifizierung)
7. [Datenmodell](#7-datenmodell)

---

## 1. Produktübersicht

### Vision

**Karriereheld** ist eine KI-gestützte Trainingsplattform für umfassende Karriere- und Gesprächsvorbereitung. Die Anwendung kombiniert sprachbasierte KI-Interaktion, intelligente Feedback-Generierung und strukturierte Wissensvermittlung zu einem ganzheitlichen Trainingsystem.

> *Menschen dabei unterstützen, selbstbewusst und optimal vorbereitet in wichtige berufliche Gespräche zu gehen – sei es ein Vorstellungsgespräch, eine Gehaltsverhandlung oder ein wichtiges Kundengespräch.*

### Kernfunktionen

| Modul | Beschreibung | Primärer Use Case |
|-------|--------------|-------------------|
| **Smart Briefings** | KI-generierte Wissenspakete zur Vorbereitung | Schnelle, strukturierte Recherche |
| **Live-Simulation** | Echtzeit-Voice-Interviews mit KI-Interviewer | Spontanität unter Druck üben |
| **Szenario-Training** | Strukturiertes Frage-Antwort-Training mit Sofortfeedback | Systematisches Lernen |
| **Wirkungs-Analyse** | Video-Training mit Körpersprache-Feedback | Nonverbale Kommunikation verbessern |
| **Rhetorik-Gym** | Gamifiziertes Sprechtraining | Füllwörter reduzieren |
| **Session-Historie** | Übersicht vergangener Trainings | Fortschritt verfolgen |

### Zielgruppen

- **Bewerber** - Vorbereitung auf Vorstellungsgespräche und Gehaltsverhandlungen
- **Vertriebsmitarbeiter** - Training für Kundengespräche und Verhandlungen
- **Führungskräfte** - Übung von Mitarbeiter- und Feedback-Gesprächen
- **Studierende** - Vorbereitung auf den Berufseinstieg
- **Coaches/Trainer** - Tool für Klienten (White-Label)

---

## 2. Module & Features

### 2.1 Smart Briefings

#### Beschreibung

KI-generierte Wissenspakete zur optimalen Vorbereitung auf berufliche Gespräche. Smart Briefings liefern in Sekunden personalisierte Informationen, die normalerweise Stunden manueller Recherche erfordern würden.

#### Das Problem, das es löst

- **Zeitaufwändige Recherche**: Vor wichtigen Gesprächen verbringen Menschen Stunden mit unstrukturierter Internet-Recherche
- **Informationsüberflutung**: Zu viele Informationen führen zu Unsicherheit statt Selbstvertrauen
- **Fehlender roter Faden**: Ohne Struktur wissen Bewerber nicht, welche Informationen wirklich relevant sind

#### Benutzerflow

```
1. Template auswählen
   ├─ Dashboard zeigt verfügbare Templates (Kategoriefilter)
   └─ Beispiele: Job Interview, Gehaltsverhandlung, Kundengespräch
   ↓
2. Variablen eingeben
   ├─ Position, Unternehmen, Kontext
   └─ Dynamisches Formular basierend auf Template
   ↓
3. Briefing generieren (~10 Sekunden)
   ↓
4. Interaktives Workbook nutzen
   ├─ Sections aufklappen/zuklappen
   ├─ Items durcharbeiten
   ├─ Eigene Notizen hinzufügen ✏️
   ├─ Irrelevante Punkte löschen 🗑️
   └─ "5 weitere Punkte generieren" pro Section
```

#### Verfügbare Templates

| Template | Kategorie | Beschreibung |
|----------|-----------|--------------|
| **Job Interview Deep-Dive** | Karriere | Unternehmens-Insights, typische Fragen, Antwortstrategien |
| **Gehaltsverhandlung Prep** | Karriere | Marktanalyse, Argumente, Konterstrategien |
| **Kundengespräch Vorbereitung** | Vertrieb | Branchenkontext, Kundenanalyse, Gesprächsstrategie |
| **Feedback-Gespräch** | Führung | Strukturierte Vorbereitung auf Mitarbeitergespräche |

#### Workbook-Features

- **Sections**: Thematisch gruppierte Informationspunkte
- **Items**: Einzelne Wissenspunkte mit Erklärungen
- **Notizen**: Persönliche Anmerkungen zu jedem Item
- **Soft-Delete**: Ausgeblendete Items können wiederhergestellt werden
- **Dynamische Erweiterung**: KI generiert weitere Punkte auf Anfrage

---

### 2.2 Live-Simulation

#### Beschreibung

Realistische Voice-Interviews mit KI-gesteuerten Gesprächspartnern über ElevenLabs Conversational AI.

#### Benutzerflow

```
1. Szenario aus Dashboard wählen
   ↓
2. Variablen-Dialog (Name, Position, Firma, etc.)
   ↓
3. Gespräch starten (Anruf-Button)
   ↓
4. Live-Gespräch mit Voice-Interaktion
   • Live-Coaching-Tipps (linke Seite)
   • Live-Transkript (rechte Seite)
   ↓
5. Gespräch beenden
   ↓
6. Feedback-Generierung (Gemini)
   ↓
7. Analyse-Dashboard mit:
   • Coaching-Tab (Stärken, Verbesserungen, Tipps)
   • Analysen-Tab (Audio-Metriken)
   • Gesprächsaufnahme (Audio-Player)
   • Gesprächsverlauf (Transkript)
```

#### Gesprächsstile

Jedes Szenario unterstützt verschiedene Interviewstile:

| Stil | Verhalten des KI-Interviewers |
|------|-------------------------------|
| `friendly` | Ermutigend, unterstützend, geduldig |
| `critical` | Herausfordernd, hinterfragend, anspruchsvoll |
| `professional` | Sachlich, neutral, businessorientiert |

#### Live-Coaching

Während des Gesprächs werden kontextbezogene Tipps eingeblendet:
- Gesprächsstrategien
- Formulierungshilfen
- Erinnerungen an Best Practices

---

### 2.3 Szenario-Training

#### Beschreibung

Strukturiertes Training mit vordefinierten Fragen und sofortigem Feedback nach jeder Antwort.

#### Benutzerflow

```
1. Szenario auswählen
   ↓
2. Setup-Wizard (optionale Variablen)
   ↓
3. Training starten
   ↓
4. Für jede Frage:
   • Frage wird angezeigt
   • Audio-Aufnahme der Antwort
   • Sofortiges Feedback via Gemini
   ↓
5. Abschluss-Zusammenfassung
```

#### Feedback-Kategorien (pro Antwort)

- **Inhalt & Relevanz** - Wurde die Frage beantwortet?
- **Struktur** - War die Antwort logisch aufgebaut?
- **Kommunikation** - Klarheit und Überzeugungskraft
- **Verbesserungsvorschläge** - Konkrete Tipps

---

### 2.4 Wirkungs-Analyse

#### Beschreibung

Video-basiertes Training, das neben dem gesprochenen Wort auch Körpersprache, Mimik und Auftreten analysiert. Die KI wertet das Video aus und gibt konkretes Feedback zur nonverbalen Kommunikation.

#### Das Problem, das es löst

- **Blinder Fleck Körpersprache**: Die meisten wissen nicht, wie sie auf andere wirken
- **Nervöse Ticks**: Unbewusste Gesten und Bewegungen bleiben unbemerkt
- **Keine Video-Übung**: Sich selbst auf Video zu sehen ist ungewohnt

#### Benutzerflow

```
1. Szenario auswählen
   ↓
2. Kamera & Mikrofon einrichten
   ├─ Kamera-Auswahl
   ├─ Licht- und Rahmen-Check
   └─ HD-Qualität (1280x720)
   ↓
3. Video-Aufnahme
   ├─ Kontinuierliche Aufnahme über alle Fragen
   ├─ Fragen-Navigation (Vor/Zurück)
   └─ Timestamps werden pro Frage gespeichert
   ↓
4. Upload & Analyse
   ├─ Video wird hochgeladen
   ├─ Gemini Vision analysiert jeden Abschnitt
   └─ Fortschrittsanzeige während Analyse
   ↓
5. Ergebnisse ansehen
   ├─ Video-Wiedergabe pro Frage
   ├─ Nonverbale Analyse neben Video
   └─ Gesamtbewertung der Präsentation
```

#### Analysierte Aspekte

| Kategorie | Was analysiert wird | Beispiel-Feedback |
|-----------|--------------------|--------------------|
| **Augenkontakt** | Blickrichtung, Häufigkeit | "Mehr direkter Blick in die Kamera" |
| **Körperhaltung** | Aufrecht, entspannt, verkrampft | "Schultern sind angespannt" |
| **Gestik** | Handbewegungen, Nervosität | "Hände unterstützen das Gesagte gut" |
| **Mimik** | Lächeln, Stirnrunzeln | "Freundlicher Gesichtsausdruck" |
| **Gesamtwirkung** | Professionell, sympathisch | "Selbstbewusstes Auftreten" |

---

### 2.5 Rhetorik-Gym

#### Beschreibung

Gamifiziertes Training zur Verbesserung der Sprechqualität. Fokus auf Füllwörter-Reduktion und Sprechtechnik.

#### Spielmodi

| Modus | Dauer | Beschreibung |
|-------|-------|--------------|
| **Der Klassiker** | 60s | Elevator Pitch: "Stelle dich selbst vor" |
| **Zufalls-Thema** | 60s | Slot-Machine wählt ein zufälliges Thema |
| **Stress-Test** | 90s | Überraschende, kritische Interview-Frage |

#### Punktesystem (0-100)

| Komponente | Max. Punkte | Berechnung |
|------------|-------------|------------|
| Basis-Score | 60 | Startpunkt |
| Füllwörter | -10 pro Wort | Abzug für "Ähm", "Halt", "Eigentlich", etc. |
| Inhalt | 0-40 | Gemini-Bewertung (Relevanz, Struktur) |

#### Erkannte Füllwörter

```
"Ähm", "Äh", "Öh", "Mh", "Halt", "Eigentlich",
"Sozusagen", "Quasi", "Irgendwie", "Also" (am Satzanfang),
"Genau", "Ja also"
```

#### Zufalls-Themen (Auswahl)

**Professionell:**
- "Warum bin ich die beste Wahl für diese Position?"
- "Meine größte berufliche Errungenschaft"
- "Wie ich mit schwierigen Kollegen umgehe"

**Kreativ:**
- "Wenn ich ein Tier wäre, welches und warum?"
- "Die beste Erfindung der Menschheit"

**Herausfordernd:**
- "Warum Scheitern wichtig ist"
- "Meine kontroverseste Meinung"

#### Stress-Test Fragen (Auswahl)

- "Warum sollten wir ausgerechnet Sie einstellen und nicht einen der 50 anderen Bewerber?"
- "Ihr Lebenslauf zeigt eine Lücke. Was haben Sie in dieser Zeit wirklich gemacht?"
- "Nennen Sie mir drei echte Schwächen - und bitte keine getarnten Stärken."
- "Wenn ich Ihren letzten Chef anrufe - was wird er mir sagen?"

---

### 2.6 Session-Historie

#### Beschreibung

Zentrale Übersicht aller durchgeführten Trainings mit der Möglichkeit, vergangene Sessions zu reviewen, fortzusetzen oder zu wiederholen.

#### Verfügbare Tabs

| Tab | Inhalt |
|-----|--------|
| **Smart Briefings** | Alle generierten Wissenspakete |
| **Szenario-Training** | Strukturierte Trainings-Sessions |
| **Wirkungs-Analyse** | Video-basierte Trainings |
| **Live-Simulationen** | Echtzeit-Gespräche mit KI |

#### Session-Cards

Jede Session-Karte zeigt:
- Szenario-Name und Erstellungsdatum
- Score/Bewertung (farbcodiert)
- Fortschritt bei unvollständigen Sessions
- Aktionen: Fortsetzen, Wiederholen, Löschen

#### Detail-Ansicht

- Audio/Video-Wiedergabe
- Vollständiges Transkript
- Feedback und Bewertungen
- Analyse-Metriken (paraverbal, nonverbal)

---

## 3. Szenario- & Live-Simulation-Konfiguration

### 3.1 WordPress Custom Post Types

Szenarien werden als WordPress Custom Post Types (`roleplay_scenario`) verwaltet.

#### Felder

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `title` | String | Szenario-Titel (z.B. "Gehaltsverhandlung") |
| `description` | Text | Beschreibung für Dashboard-Karte |
| `difficulty` | Enum | `easy` / `medium` / `hard` |
| `category` | String | Kategorie (z.B. "Bewerbung", "Vertrieb") |
| `agent_id` | String | ElevenLabs Agent ID |
| `system_prompt` | Text | System-Prompt für den KI-Agenten |
| `interviewer_profile` | JSON | Interviewer-Daten (Name, Rolle, Bild, etc.) |
| `variables_schema` | JSON | Erforderliche Variablen |
| `coaching_hints` | Text | Tipps für Live-Coaching |
| `is_active` | Boolean | Aktiv/Inaktiv-Status |
| `sort_order` | Number | Sortierreihenfolge |

### 3.2 Variablen-Schema

Jedes Szenario kann dynamische Variablen definieren, die vom Benutzer vor dem Gespräch eingegeben werden.

#### Schema-Format

```json
{
  "variables": [
    {
      "id": "user_name",
      "label": "Dein Name",
      "type": "text",
      "required": true,
      "placeholder": "z.B. Max Mustermann"
    },
    {
      "id": "position",
      "label": "Beworbene Position",
      "type": "text",
      "required": true,
      "placeholder": "z.B. Marketing Manager"
    },
    {
      "id": "company",
      "label": "Zielunternehmen",
      "type": "text",
      "required": false,
      "placeholder": "z.B. BMW AG"
    },
    {
      "id": "current_salary",
      "label": "Aktuelles Gehalt",
      "type": "number",
      "required": true,
      "placeholder": "z.B. 55000"
    },
    {
      "id": "conversation_style",
      "label": "Gesprächsstil",
      "type": "select",
      "required": true,
      "options": [
        {"value": "friendly", "label": "Freundlich"},
        {"value": "critical", "label": "Kritisch"},
        {"value": "professional", "label": "Professionell"}
      ]
    }
  ]
}
```

#### Variablen-Typen

| Typ | Beschreibung | UI-Element |
|-----|--------------|------------|
| `text` | Freitext-Eingabe | Input-Feld |
| `number` | Numerischer Wert | Number-Input |
| `select` | Auswahl aus Liste | Dropdown |
| `textarea` | Längerer Text | Textarea |

### 3.3 Interviewer-Profile

Jedes Szenario hat einen charakterisierten Gesprächspartner.

#### Profil-Format

```json
{
  "name": "Peter Post",
  "role": "Marketing Leiter",
  "company": "TechCorp GmbH",
  "image_url": "https://example.com/interviewer.jpg",
  "personality": "Sehr beschäftigt und direkt. Erwartet präzise Antworten.",
  "typical_objections": [
    "Ich habe nur 5 Minuten Zeit",
    "Kommen Sie bitte zum Punkt",
    "Was genau ist Ihr Mehrwert?"
  ],
  "background": "20 Jahre Vertriebserfahrung, sucht nach Eigeninitiative"
}
```

#### Verwendung

- **Anzeige**: Profilkarte während des Gesprächs
- **KI-Verhalten**: Personality wird an ElevenLabs Agent übergeben
- **Coaching**: Typische Einwände als Vorbereitung anzeigen

### 3.4 ElevenLabs Agent-Integration

#### Agent-Konfiguration

Jedes Szenario ist mit einem ElevenLabs Conversational AI Agent verknüpft:

```javascript
// Dynamische Variablen werden an den Agent übergeben
const sessionOverrides = {
  agent: {
    prompt: {
      prompt: scenarioSystemPrompt
    }
  },
  variables: {
    user_name: "Max Mustermann",
    position: "Marketing Manager",
    company: "BMW AG",
    conversation_style: "professional"
  }
};

await conversation.startSession({
  agentId: scenario.agent_id,
  overrides: sessionOverrides
});
```

#### Audio-Speicherung

Nach Gesprächsende wird die Audio-Aufnahme über die ElevenLabs API heruntergeladen:

```
GET https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}/audio
```

**Wichtig:** "Audio Saving" muss in den ElevenLabs Agent Settings aktiviert sein.

---

## 4. Bewertungssystem & KI-Prompts

### 4.1 Interview-Feedback (Text-basiert)

#### Verwendung

Generiert Coaching-Feedback basierend auf dem Gesprächstranskript.

#### Vollständiger Prompt

```
Du bist ein professioneller Karriere-Coach. Analysiere das folgende
Bewerbungsgespräch-Transkript und gib konstruktives Feedback in "Du"-Form.

SEHR WICHTIG: Bewerte AUSSCHLIESSLICH den BEWERBER/die BEWERBERIN!
- Die Aussagen des Interviewers (z.B. "H. Müller", "Interviewer", oder
  ähnliche Kennzeichnungen) dienen NUR als Kontext für die Fragen.
- Dein gesamtes Feedback, alle Stärken, Verbesserungen, Tipps und
  Bewertungen beziehen sich NUR auf die Antworten und das Verhalten
  des Bewerbers.
- Bewerte NICHT die Qualität der Fragen oder das Verhalten des Interviewers.

WICHTIG: Antworte NUR mit einem JSON-Objekt in folgendem Format
(keine zusätzlichen Erklärungen):

{
  "summary": "Eine kurze Zusammenfassung des Gesamteindrucks des BEWERBERS
              (2-3 Sätze)",
  "strengths": [
    "Stärke 1: Konkrete positive Beobachtung beim Bewerber",
    "Stärke 2: Was der Bewerber gut gemacht hat",
    "Stärke 3: Weitere Stärken des Bewerbers"
  ],
  "improvements": [
    "Verbesserung 1: Konkreter Bereich, den der Bewerber verbessern kann",
    "Verbesserung 2: Was der Bewerber besser machen könnte",
    "Verbesserung 3: Weitere Verbesserungspotenziale für den Bewerber"
  ],
  "tips": [
    "Tipp 1: Konkrete, umsetzbare Empfehlung für den Bewerber",
    "Tipp 2: Praktischer Ratschlag für den Bewerber",
    "Tipp 3: Weitere hilfreiche Tipps für den Bewerber"
  ],
  "rating": {
    "overall": 7,
    "communication": 6,
    "motivation": 7,
    "professionalism": 8
  }
}

Bewertungsskala: 1-10 (1=sehr schwach, 10=exzellent)

Analysiere diese Aspekte der BEWERBER-Antworten:
- Struktur & Klarheit der Antworten des Bewerbers
- Inhalt & Beispiele, die der Bewerber nennt
- Motivation & Begeisterung des Bewerbers
- Professionalität & Selbstbewusstsein des Bewerbers

Sei konstruktiv, ehrlich und motivierend.
Fokussiere auf umsetzbare Verbesserungen für den Bewerber.

Transkript:
${transcript}

JSON Feedback:
```

#### Output-Format

```json
{
  "summary": "String - Zusammenfassung (2-3 Sätze)",
  "strengths": ["Array von Stärken"],
  "improvements": ["Array von Verbesserungsbereichen"],
  "tips": ["Array von konkreten Tipps"],
  "rating": {
    "overall": 1-10,
    "communication": 1-10,
    "motivation": 1-10,
    "professionalism": 1-10
  }
}
```

---

### 4.2 Audio-Analyse (Paraverbal)

#### Verwendung

Analysiert die Audio-Aufnahme für paraverbale Kommunikationsaspekte.

#### Vollständiger Prompt

```
Du bist der Voice-Coach von "KarriereHeld".
Analysiere die Audio-Datei dieses Rollenspiels.

WICHTIG - QUELLEN-TRENNUNG:
Die Aufnahme enthält ZWEI Stimmen:
1. Den INTERVIEWER (KI-Stimme, akzentfrei, stellt Fragen).
   Die KI-Stimme ERÖFFNET das Gespräch.
2. Den BEWERBER (Mensch, antwortet auf die Fragen des Interviewers).

DEINE AUFGABE:
Höre dir das gesamte Audio an, aber bewerte AUSSCHLIESSLICH die
Stimme des BEWERBERS (2).
Ignoriere alles, was der Interviewer sagt (Pausen, Tempo, Inhalt).

ANALYSE-DIMENSIONEN (NUR BEWERBER):

1. SPEECH CLEANLINESS (Füllwörter)
- Zähle "Ähm", "Öh", "Halt", "Eigentlich", "Sozusagen" beim Bewerber.
- Gib GENAUE Zeitstempel an (Format MM:SS).

2. PACING (Tempo)
- Wie wirkt das Sprechtempo in den Antwort-Phasen?
  (Gehetzt vs. Souverän).
- Notiere auffällige Stellen mit Zeitstempel.

3. TONALITY (Betonung & Melodie)
- Ist die Stimme monoton, natürlich oder lebendig?
- Suche nach Highlights (souverän) oder Lowlights (unsicher/brüchig).

4. CONFIDENCE (Wirkung)
- Confidence Score (0-100): Wie sicher klingt der Bewerber insgesamt?

OUTPUT FORMAT:
Antworte NUR mit einem validen JSON-Objekt.
Keine Markdown-Formatierung, kein Einleitungstext.

{
  "audio_metrics": {
    "summary_text": "Kurzes Fazit zur Stimme des Bewerbers (max 2 Sätze).",
    "confidence_score": (0-100),

    "speech_cleanliness": {
      "score": (0-100, 100=Perfekt sauber),
      "filler_word_analysis": [
        {
          "word": "Ähm",
          "count": (Anzahl),
          "examples": [
            {"timestamp": "00:45", "context": "Satzanfang"},
            {"timestamp": "01:20", "context": "Nachdenken"}
          ]
        }
      ],
      "feedback": "Tipp zur Vermeidung von Füllwörtern."
    },

    "pacing": {
      "rating": "zu_schnell" | "optimal" | "zu_langsam",
      "perceived_wpm": "string (z.B. '~140 WPM')",
      "issues_detected": [
        {"timestamp": "02:10", "issue": "Sehr schnell, wirkt gehetzt"}
      ],
      "feedback": "Feedback zur Geschwindigkeit."
    },

    "tonality": {
      "rating": "monoton" | "natürlich" | "lebendig",
      "highlights": [
        {"timestamp": "00:05", "type": "positive", "note": "Souveräner Einstieg"},
        {"timestamp": "03:20", "type": "negative", "note": "Stimme wird unsicher"}
      ],
      "feedback": "Feedback zur Melodie und Betonung."
    }
  }
}

JSON Analyse:
```

#### Output-Format

```json
{
  "audio_metrics": {
    "summary_text": "String",
    "confidence_score": 0-100,
    "speech_cleanliness": {
      "score": 0-100,
      "filler_word_analysis": [...],
      "feedback": "String"
    },
    "pacing": {
      "rating": "zu_schnell | optimal | zu_langsam",
      "perceived_wpm": "String",
      "issues_detected": [...],
      "feedback": "String"
    },
    "tonality": {
      "rating": "monoton | natürlich | lebendig",
      "highlights": [...],
      "feedback": "String"
    }
  }
}
```

---

### 4.3 Rhetorik-Gym Analyse

#### Verwendung

Schnelle Analyse für gamifiziertes Sprechtraining. Optimiert für Geschwindigkeit.

#### Vollständiger Prompt

```
AUDIO-TRANSKRIPTION UND ANALYSE

THEMA: "${topic}"

ABSOLUTE REGEL - KEINE HALLUZINATION:
Du DARFST NUR transkribieren, was TATSÄCHLICH in der Audio-Datei
gesprochen wird.
- Bei Stille, Rauschen, oder unverständlichem Audio:
  transcript = "[Keine Sprache erkannt]"
- Bei nur 1-2 Sekunden Audio ohne klare Sprache:
  transcript = "[Keine Sprache erkannt]"
- ERFINDE NIEMALS Wörter, Sätze oder Inhalte!
- Wenn du unsicher bist, ob etwas gesagt wurde: NICHT transkribieren!

DEINE AUFGABE (NUR bei klar erkennbarer Sprache):
1. TRANSKRIBIEREN: Schreibe WÖRTLICH was gesprochen wird -
   nichts hinzufügen
2. FÜLLWÖRTER: Finde diese Wörter im Transkript:
   "Ähm", "Äh", "Öh", "Mh", "Halt", "Eigentlich", "Sozusagen",
   "Quasi", "Irgendwie", "Also" (am Satzanfang), "Genau", "Ja also"
3. INHALT: Bewerte wie gut die Antwort zum Thema passt (0-40 Punkte)

INHALTSBEWERTUNG (content_score):
- 0: Keine Sprache / am Thema vorbei / unverständlich
- 10: Nur ansatzweise zum Thema
- 20: Teilweise zum Thema, aber oberflächlich
- 30: Gut zum Thema, mit Substanz
- 40: Exzellent, strukturiert und überzeugend

OUTPUT - NUR valides JSON:
{
  "transcript": "[Keine Sprache erkannt]",
  "filler_words": [],
  "content_score": 0,
  "content_feedback": "Keine Sprache erkannt."
}

ODER bei erkannter Sprache:
{
  "transcript": "Das was tatsächlich gesagt wurde...",
  "filler_words": [{"word": "Ähm", "count": 1}],
  "content_score": 30,
  "content_feedback": "Kurzes Feedback (1-2 Sätze)"
}

ANALYSE DER AUDIO-DATEI:
```

#### Score-Berechnung (Client-seitig)

```javascript
// Basis-Score
let score = 60;

// Füllwörter-Abzug
const totalFillerWords = fillerWords.reduce((sum, fw) => sum + fw.count, 0);
score -= totalFillerWords * 10;

// Inhaltspunkte (0-40 von Gemini)
score += contentScore;

// Min/Max begrenzen
score = Math.max(0, Math.min(100, score));
```

---

### 4.4 Bewertungsskalen

#### Interview-Feedback

| Bewertung | Skala | Bedeutung |
|-----------|-------|-----------|
| Overall | 1-10 | Gesamteindruck |
| Communication | 1-10 | Kommunikationsfähigkeit |
| Motivation | 1-10 | Erkennbare Motivation |
| Professionalism | 1-10 | Professionalität |

#### Audio-Analyse

| Metrik | Skala | Optimal |
|--------|-------|---------|
| Confidence Score | 0-100 | > 70 |
| Speech Cleanliness | 0-100 | > 85 |
| Pacing | zu_schnell/optimal/zu_langsam | optimal |
| Tonality | monoton/natürlich/lebendig | natürlich/lebendig |

#### Rhetorik-Gym

| Score-Bereich | Bewertung | Emoji |
|---------------|-----------|-------|
| 90-100 | Excellent | 🏆 |
| 70-89 | Gut | 🌟 |
| 50-69 | Medium | 💪 |
| 30-49 | Übung nötig | 🎯 |
| 0-29 | Verbesserungsbedarf | 🔄 |

---

## 5. White-Label Branding

### 5.1 Partner-Konfiguration

Partner werden über WordPress Custom Post Type (`whitelabel_partner`) oder REST API konfiguriert.

#### URL-Parameter

```
?partner=partner-slug
?pid=partner-slug
```

#### API-Endpunkt

```
GET /wp-json/karriereheld/v1/config?partner_slug=xxx
```

#### Partner-Objekt

```json
{
  "id": "partner-slug",
  "name": "Partner Name",
  "branding": { /* CSS-Variablen */ },
  "logo_url": "https://example.com/logo.png",
  "modules": ["roleplay", "simulator", "gym", "history"]
}
```

### 5.2 CSS-Variablen

Alle Branding-Aspekte werden über CSS Custom Properties gesteuert:

#### App-Hintergrund

```css
--app-bg-color: linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f0fdfa 100%);
```

#### Sidebar

```css
--sidebar-bg-color: #ffffff;
--sidebar-text-color: #0f172a;
--sidebar-text-muted: #94a3b8;
--sidebar-active-bg: #E8F4F8;
--sidebar-active-text: #2D6485;
--sidebar-hover-bg: #f8fafc;
```

#### Buttons

```css
--button-gradient: linear-gradient(135deg, #3A7FA7 0%, #3DA389 100%);
--button-gradient-hover: linear-gradient(135deg, #2D6485 0%, #2E8A72 100%);
--button-solid: #3A7FA7;
--button-solid-hover: #2D6485;
--button-text: #ffffff;
```

#### Header & Cards

```css
--header-gradient: linear-gradient(135deg, #3A7FA7 0%, #3DA389 100%);
--header-text: #ffffff;
--card-bg-color: #ffffff;
```

#### Primary Accent

```css
--primary-accent: #3A7FA7;
--primary-accent-light: #E8F4F8;
--primary-accent-hover: #2D6485;
```

#### Icons

```css
--icon-primary: #3A7FA7;
--icon-secondary: #3DA389;
--icon-muted: #94a3b8;
```

#### Text

```css
--text-main: #0f172a;
--text-secondary: #475569;
--text-muted: #94a3b8;
```

#### Borders

```css
--border-color: #e2e8f0;
--border-color-light: #f1f5f9;
--focus-ring: rgba(58, 127, 167, 0.3);
```

### 5.3 Modul-Filterung

Partner können festlegen, welche Module sichtbar sind:

```json
{
  "modules": ["roleplay", "simulator"]
}
```

#### Verfügbare Module

| Module ID | Menüpunkt | Beschreibung |
|-----------|-----------|--------------|
| `roleplay` | Live-Gespräche | Voice-Interviews |
| `simulator` | Szenario-Training | Strukturiertes Training |
| `gym` | Rhetorik-Gym | Gamifiziertes Sprechtraining |
| `history` | Meine Sessions | Session-Historie |

#### Logik

- **Leeres Array `[]`**: Alle Module sichtbar
- **Spezifische Module**: Nur gelistete Module werden angezeigt
- Menüpunkte werden automatisch ausgeblendet

---

## 6. Benutzerauthentifizierung

### WordPress-Integration

- Benutzer-Authentifizierung über WordPress Login
- Sessions werden dem angemeldeten User zugeordnet
- Nonce-basierte API-Sicherheit

### API-Endpunkte

```
POST /wp-json/karriereheld/v1/login
POST /wp-json/karriereheld/v1/logout
GET  /wp-json/karriereheld/v1/user
```

### Authentifizierung erforderlich für

- Session erstellen/speichern
- Session-Historie abrufen
- Audio-Uploads
- Alle personenbezogenen Daten

### Gastzugang

- Szenario-Übersicht: Öffentlich
- Training starten: Login erforderlich
- Login-Modal wird bei Bedarf angezeigt

---

## 7. Datenmodell

### Haupt-Tabellen

#### `wp_bewerbungstrainer_sessions`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | BIGINT | Primärschlüssel |
| `user_id` | BIGINT | WordPress User ID |
| `session_id` | VARCHAR(255) | UUID |
| `position` | VARCHAR(255) | Beworbene Position |
| `company` | VARCHAR(255) | Zielunternehmen |
| `conversation_id` | VARCHAR(255) | ElevenLabs ID |
| `audio_url` | TEXT | Audio-URL |
| `transcript` | LONGTEXT | Transkript (JSON) |
| `feedback_json` | LONGTEXT | Feedback (JSON) |
| `audio_analysis_json` | LONGTEXT | Audio-Analyse (JSON) |
| `created_at` | DATETIME | Erstellt |
| `updated_at` | DATETIME | Aktualisiert |

#### `wp_bewerbungstrainer_games`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | BIGINT | Primärschlüssel |
| `user_id` | BIGINT | WordPress User ID |
| `game_mode` | VARCHAR(50) | klassiker/zufall/stress |
| `topic` | VARCHAR(255) | Thema |
| `score` | INT | Punktzahl (0-100) |
| `filler_count` | INT | Anzahl Füllwörter |
| `words_per_minute` | INT | WPM |
| `transcript` | LONGTEXT | Transkript |
| `analysis_json` | LONGTEXT | Gemini-Analyse |
| `created_at` | DATETIME | Erstellt |

### Custom Post Types

| Post Type | Verwendung |
|-----------|------------|
| `roleplay_scenario` | Live-Simulationen (Szenarien) |
| `whitelabel_partner` | White-Label Partner |

---

## Anhang: Gemini Modell-Fallback

Die KI-Analyse verwendet folgende Modelle in dieser Reihenfolge:

1. `gemini-2.0-flash-exp` (experimentell, neueste Features)
2. `gemini-2.0-flash` (stabil)
3. `gemini-1.5-flash-latest` (Fallback)
4. `gemini-1.5-pro-latest` (Fallback für komplexe Analysen)

Bei einem 404-Fehler (Modell nicht verfügbar) wird automatisch das nächste Modell versucht.

---

*Dokumentation erstellt: Dezember 2024*
*Version: 2.0.0*
