# Wirkungs-Analyse (Video-Training) – Vollständige Systemdokumentation für Content-Erstellung

---

## 1. Übersicht: Was ist Wirkungs-Analyse?

Wirkungs-Analyse ist ein **Video-basiertes Training**, das neben dem gesprochenen Wort auch **Körpersprache, Mimik und Auftreten** analysiert. Nutzer nehmen sich auf Video auf und erhalten KI-Feedback zu ihrer gesamten Wirkung.

### Der Kernmechanismus

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    SZENARIO     │    │   USER-INPUT    │    │    SESSION      │
│   (Vorlage)     │ +  │  (Variablen)    │ →  │   (Training)    │
│                 │    │                 │    │                 │
│ • system_prompt │    │ • position      │    │ • Video-Aufnahme│
│ • input_config  │    │ • company       │    │ • Fragen-       │
│ • feedback_     │    │ • experience    │    │   Navigation    │
│   prompt        │    │                 │    │ • KI-Analyse    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Der Unterschied zu Szenario-Training

| Aspekt | Wirkungs-Analyse | Szenario-Training |
|--------|------------------|-------------------|
| **Medium** | Video (Kamera + Mikrofon) | Nur Audio |
| **Aufnahme** | Kontinuierlich über alle Fragen | Pro Frage einzeln |
| **Feedback** | Nach kompletter Session | Nach jeder Antwort |
| **Fokus** | Körpersprache, Mimik, Auftreten | Antwort-Inhalt, Struktur |
| **Analyse** | 6 feste Kategorien | Variabel nach Szenario |

---

## 2. Die Export-Felder im Detail

### Szenario-Tabelle (Export-Spalten)

| Feld | Typ | Beschreibung | Beispiel |
|------|-----|--------------|----------|
| **id** | Zahl | Eindeutige Szenario-ID | `1` |
| **title** | Text | Name des Szenarios | `Selbstpräsentation` |
| **description** | Text | Kurzbeschreibung für Dashboard | `Übe deine Selbstpräsentation...` |
| **icon** | Text | Lucide-Icon-Name | `video`, `user`, `briefcase` |
| **difficulty** | Text | Schwierigkeitsgrad | `beginner`, `intermediate`, `advanced` |
| **category** | JSON | Kategorien als Array | `["karriere","kommunikation"]` |
| **target_audience** | Text | Zielgruppen (Semicolon-getrennt) | `karriere-placement;leadership-academy` |
| **scenario_type** | Text | Art des Szenarios | Siehe Tabelle unten |
| **system_prompt** | Text | KI-Rolle und Kontext | Siehe Abschnitt 3 |
| **question_generation_prompt** | Text | Anweisungen für Fragen | Siehe Abschnitt 4 |
| **feedback_prompt** | Text | Anweisungen für Video-Analyse | Siehe Abschnitt 5 |
| **input_configuration** | JSON | Formularfelder für Variablen | Siehe Abschnitt 6 |
| **question_count** | Zahl | Anzahl der Fragen | `5` |
| **time_limit_per_question** | Zahl | Sekunden pro Frage | `120` |
| **total_time_limit** | Zahl | Gesamtzeit in Sekunden | `900` |
| **enable_tips** | 0/1 | Tipps während Aufnahme zeigen | `1` = ja |
| **enable_navigation** | 0/1 | Navigation zwischen Fragen erlaubt | `1` = ja |
| **is_active** | 0/1 | Szenario sichtbar? | `1` = aktiv |
| **sort_order** | Zahl | Reihenfolge im Dashboard | `1`, `2`, `3` |

### Szenario-Typen (scenario_type)

| Wert | Beschreibung | Typische Verwendung |
|------|--------------|---------------------|
| `self_presentation` | Selbstpräsentation | "Erzählen Sie von sich" |
| `interview` | Bewerbungsgespräch | Klassische Interview-Fragen |
| `pitch` | Elevator Pitch | Kurze, prägnante Präsentation |
| `negotiation` | Verhandlung | Gehalts-/Preisverhandlung |
| `custom` | Benutzerdefiniert | Alles andere |

### Kategorien (category)

| Wert | Beschreibung |
|------|--------------|
| `karriere` | Karriere & Bewerbung |
| `fuehrung` | Führung & Leadership |
| `vertrieb` | Vertrieb & Sales |
| `kommunikation` | Kommunikation & Rhetorik |
| `service` | Kundenservice & Support |
| `social` | Soziale Arbeit & Pflege |

### Zielgruppen (target_audience)

| Wert | Beschreibung |
|------|--------------|
| `karriere-placement` | Karriere-Placement & Bewerbungscoaching |
| `high-performance-sales` | High-Performance Sales Training |
| `leadership-academy` | Leadership Academy / Führungskräfteentwicklung |
| `social-care` | Soziale Arbeit & Pflege |
| `customer-care-resilience` | Kundenservice & Resilienz-Training |

**Format:** Mehrere Werte mit Semicolon trennen: `karriere-placement;leadership-academy`

---

## 3. Der System-Prompt: KI-Kontext definieren

### Zweck

Der `system_prompt` definiert den **Kontext** für die Fragen-Generierung und die Video-Analyse.

### Struktur

```
Du bist [ROLLE mit ERFAHRUNG].

[KONTEXT zur Situation]

[SPEZIFISCHE ANWEISUNGEN]
```

### Beispiel: Selbstpräsentation

```
Du bist ein erfahrener Karriere-Coach und Kommunikationstrainer.

Der Nutzer übt seine Selbstpräsentation für die Position ${position}
${?company:bei }.

Fokus auf:
- Strukturierte Darstellung (Vergangenheit → Gegenwart → Zukunft)
- Konkrete Beispiele und Erfolge
- Authentische, selbstbewusste Präsentation
- Körpersprache und Blickkontakt

Passe den Schwierigkeitsgrad an ${experience_level} an.
```

### Beispiel: Elevator Pitch

```
Du bist ein Pitch-Coach für Startups und Führungskräfte.

Der Nutzer übt einen 60-90 Sekunden Elevator Pitch für ${pitch_topic}.
Zielgruppe: ${target_audience_description}

Fokus auf:
- Prägnante, merkbare Kernbotschaft
- Emotionale Verbindung zur Zielgruppe
- Selbstbewusstes, energiegeladenes Auftreten
- Klarer Call-to-Action am Ende
```

### Variablen im System-Prompt

| Syntax | Funktion | Beispiel |
|--------|----------|----------|
| `${variable}` | Einfache Ersetzung | `${position}` → "Product Manager" |
| `${?variable:prefix}` | Conditional mit Prefix | `${?company:bei }` → "bei BMW" |

---

## 4. Der Question-Generation-Prompt: Fragen steuern

### Zweck

Der `question_generation_prompt` gibt **Anweisungen**, wie die Fragen für das Video-Training generiert werden sollen.

### Beispiel: Selbstpräsentation

```
Generiere Fragen/Aufgaben für ein Selbstpräsentations-Training.

Struktur:
1. Einstieg: "Stellen Sie sich vor" (90 Sekunden)
2. Beruflicher Werdegang (120 Sekunden)
3. Stärken und Erfolge (90 Sekunden)
4. Motivation für die Zielposition (90 Sekunden)
5. Abschluss: Warum Sie der/die Richtige sind (60 Sekunden)

Jede Frage sollte so formuliert sein, dass sie eine natürliche,
flüssige Video-Antwort ermöglicht.

Tipps sollten sich auf Körpersprache, Blickkontakt und
Präsentationstechnik beziehen.
```

### Beispiel: Bewerbungsgespräch

```
Generiere typische Bewerbungsfragen für die Position ${position}.

Mix aus:
- 1x Selbstpräsentation
- 2x Verhaltens-/Situationsfragen (STAR-Methode)
- 1x Stärken/Schwächen
- 1x Motivation/Unternehmensbezug

Bei ${experience_level} = "senior":
- Mehr Führungsfragen
- Komplexere Situationen
- Strategische Fragestellungen

Tipps sollten sowohl inhaltliche als auch nonverbale
Aspekte abdecken.
```

---

## 5. Der Feedback-Prompt: Video-Analyse steuern (optional)

### Zweck

Der `feedback_prompt` gibt **zusätzliche Anweisungen** für die KI-Video-Analyse. Wenn leer, wird das Standard-Feedback verwendet.

### Die 6 Standard-Analyse-Kategorien

Die KI analysiert **immer** diese 6 Kategorien:

| Kategorie | Was wird analysiert |
|-----------|---------------------|
| **Auftreten** | Erster Eindruck, Gesamtwirkung, Professionalität |
| **Selbstbewusstsein** | Sicherheit, Überzeugungskraft, Authentizität |
| **Körpersprache** | Haltung, Gestik, Mimik, Augenkontakt |
| **Kommunikation** | Sprechweise, Klarheit, Struktur, Füllwörter |
| **Professionalität** | Erscheinungsbild, Hintergrund, Technik |
| **Inhalt** | Qualität der Antworten, Relevanz, Beispiele |

### Custom Feedback-Prompt Beispiel

```
Analysiere das Video mit besonderem Fokus auf:

ELEVATOR PITCH SPEZIFISCH:
- Wurde die Kernbotschaft in den ersten 10 Sekunden klar?
- Ist ein emotionaler Hook vorhanden?
- Gibt es einen klaren Call-to-Action?
- Wurde die Zeit (60-90 Sek) eingehalten?

KÖRPERSPRACHE FÜR PITCHES:
- Energielevel und Enthusiasmus
- Gestik zur Unterstützung der Botschaft
- Augenkontakt (simuliert Publikum)

Gewichtung für Pitch:
- Prägnanz: 30%
- Überzeugungskraft: 30%
- Körpersprache: 25%
- Inhalt: 15%
```

---

## 6. Die Input-Configuration: Eigene Variablen definieren

### Das Prinzip

Jedes Szenario kann **eigene Variablen** definieren. Diese werden im Formular abgefragt und in den Prompts verwendet.

### JSON-Struktur

```json
[
  {
    "key": "position",
    "label": "Zielposition",
    "type": "text",
    "required": true,
    "placeholder": "z.B. Product Manager, Vertriebsleiter"
  },
  {
    "key": "company",
    "label": "Unternehmen (optional)",
    "type": "text",
    "required": false,
    "placeholder": "z.B. BMW, Siemens"
  },
  {
    "key": "experience_level",
    "label": "Erfahrungslevel",
    "type": "select",
    "required": true,
    "default": "professional",
    "options": [
      {"value": "student", "label": "Student / Praktikant"},
      {"value": "entry", "label": "Berufseinsteiger (0-2 Jahre)"},
      {"value": "professional", "label": "Professional (3-5 Jahre)"},
      {"value": "senior", "label": "Senior / Führungskraft (5+ Jahre)"}
    ]
  },
  {
    "key": "key_achievements",
    "label": "Wichtigste Erfolge (optional)",
    "type": "textarea",
    "required": false,
    "placeholder": "z.B. Projekt X geleitet, Umsatz um 20% gesteigert..."
  }
]
```

### Feldtypen

| type | Darstellung | Wann verwenden |
|------|-------------|----------------|
| `text` | Einzeiliges Textfeld | Kurze Eingaben (Position, Firma) |
| `textarea` | Mehrzeiliges Textfeld | Längere Beschreibungen |
| `select` | Dropdown-Auswahl | Vordefinierte Optionen |
| `number` | Zahlenfeld | Zeitangaben, Jahre |

### Feld-Eigenschaften

| Eigenschaft | Pflicht | Beschreibung |
|-------------|---------|--------------|
| `key` | ✅ | Technischer Name → `${key}` im Prompt |
| `label` | ✅ | Anzeige-Label im Formular |
| `type` | ✅ | `text`, `textarea`, `select`, `number` |
| `required` | ❌ | `true` = Pflichtfeld |
| `placeholder` | ❌ | Hilfstext im Feld |
| `default` | ❌ | Vorausgewählter Wert |
| `options` | Nur bei `select` | Array mit `{value, label}` |

---

## 7. Wie die Video-Analyse funktioniert

### Der Ablauf

```
1. USER WÄHLT SZENARIO
   └─ GET /video-training/scenarios

2. VARIABLEN EINGEBEN
   └─ Dynamisches Formular aus input_configuration

3. FRAGEN GENERIEREN
   └─ POST /sessions → Session erstellen
   └─ POST /sessions/{id}/questions → Gemini generiert Fragen

4. VIDEO AUFNEHMEN
   ├─ Kontinuierliche Aufnahme über alle Fragen
   ├─ Navigation zwischen Fragen (wenn enable_navigation=1)
   └─ Timeline wird getrackt: {question_index, start_time}

5. VIDEO HOCHLADEN
   └─ POST /sessions/{id}/video
   └─ Status: 'processing'

6. KI-ANALYSE (Gemini Vision)
   ├─ POST /sessions/{id}/analyze
   ├─ Video wird an Gemini gesendet
   └─ Multimodale Analyse (Video + Audio + Text)

7. ERGEBNISSE ANZEIGEN
   ├─ 6 Kategorie-Scores
   ├─ Gesamtscore (Durchschnitt)
   ├─ Detailliertes Feedback
   └─ Transkript
```

### Das Fragen-Format

```json
[
  {
    "index": 0,
    "question": "Stellen Sie sich in 60-90 Sekunden vor.",
    "category": "Einstieg",
    "estimated_time": 90,
    "tips": [
      "Beginnen Sie mit einem selbstbewussten Lächeln",
      "Halten Sie Blickkontakt mit der Kamera",
      "Strukturieren Sie: Wer bin ich → Was kann ich → Was will ich"
    ]
  },
  {
    "index": 1,
    "question": "Beschreiben Sie Ihren wichtigsten beruflichen Erfolg.",
    "category": "Erfahrung",
    "estimated_time": 120,
    "tips": [
      "Nutzen Sie die STAR-Methode",
      "Nennen Sie konkrete Zahlen",
      "Zeigen Sie Begeisterung durch Gestik"
    ]
  }
]
```

### Das Analyse-Ergebnis

```json
{
  "transcript": "Vollständiges Transkript des Videos...",
  "summary": "Gesamteindruck in 2-3 Sätzen...",
  "overall_score": 75,
  "category_scores": [
    {
      "category": "auftreten",
      "label": "Auftreten",
      "score": 78,
      "feedback": "Professioneller erster Eindruck...",
      "strengths": ["Freundliches Lächeln", "Aufrechte Haltung"],
      "improvements": ["Mehr Energie zu Beginn zeigen"]
    },
    {
      "category": "koerpersprache",
      "label": "Körpersprache",
      "score": 72,
      "feedback": "Gute Grundhaltung, aber...",
      "strengths": ["Offene Gestik"],
      "improvements": ["Mehr Blickkontakt zur Kamera"]
    }
  ],
  "analysis": {
    "overall_impression": "Insgesamt souveräner Auftritt...",
    "key_strengths": ["Klare Struktur", "Authentisch"],
    "priority_improvements": ["Füllwörter reduzieren"],
    "actionable_tips": ["Üben Sie vor dem Spiegel"],
    "filler_words": {
      "count": 5,
      "words": ["ähm", "also"],
      "severity": "niedrig"
    }
  }
}
```

---

## 8. Vollständiges Szenario-Beispiel

### Szenario: "Elevator Pitch"

**Metadaten:**

| Feld | Wert |
|------|------|
| title | `Elevator Pitch` |
| description | `Übe deinen 60-Sekunden Pitch für Investoren oder Kunden` |
| icon | `rocket` |
| difficulty | `intermediate` |
| category | `["vertrieb","kommunikation"]` |
| target_audience | `high-performance-sales;leadership-academy` |
| scenario_type | `pitch` |
| question_count | `3` |
| time_limit_per_question | `60` |
| enable_tips | `1` |
| enable_navigation | `1` |

**system_prompt:**
```
Du bist ein erfahrener Pitch-Coach für Startups und Führungskräfte.

Der Nutzer übt einen Elevator Pitch für: ${pitch_topic}
Zielgruppe: ${target_audience_description}
Ziel des Pitches: ${pitch_goal}

Fokus auf:
- Prägnante Kernbotschaft in den ersten 10 Sekunden
- Emotionaler Hook für die Zielgruppe
- Selbstbewusstes, energiegeladenes Auftreten
- Klarer Call-to-Action
```

**question_generation_prompt:**
```
Generiere 3 Pitch-Aufgaben für ein Video-Training:

1. Der Hook (20 Sekunden)
   - Aufmerksamkeit gewinnen
   - Problem oder Chance benennen

2. Die Lösung (30 Sekunden)
   - Was bieten Sie an?
   - Warum ist es einzigartig?

3. Der Call-to-Action (10 Sekunden)
   - Was soll der Zuhörer tun?
   - Wie geht es weiter?

Tipps sollten sich auf Energie, Überzeugungskraft und
Körpersprache fokussieren.
```

**feedback_prompt:**
```
Analysiere den Pitch mit Fokus auf:

PITCH-KRITERIEN:
- Wurde die Aufmerksamkeit in den ersten 5 Sekunden gewonnen?
- Ist die Kernbotschaft klar und merkbar?
- Gibt es einen emotionalen Hook?
- Ist der Call-to-Action konkret?

PRÄSENTATION:
- Energielevel (sollte hoch sein)
- Überzeugungskraft und Authentizität
- Tempo (sollte dynamisch sein)
- Blickkontakt und Gestik

Bewerte strenger bei "Kommunikation" und "Inhalt",
da diese bei Pitches entscheidend sind.
```

**input_configuration:**
```json
[
  {
    "key": "pitch_topic",
    "label": "Worum geht es in deinem Pitch?",
    "type": "text",
    "required": true,
    "placeholder": "z.B. Meine App für Zeitmanagement, Meine Dienstleistung..."
  },
  {
    "key": "target_audience_description",
    "label": "Wer ist deine Zielgruppe?",
    "type": "text",
    "required": true,
    "placeholder": "z.B. Investoren, potenzielle Kunden, Führungskräfte"
  },
  {
    "key": "pitch_goal",
    "label": "Was ist das Ziel des Pitches?",
    "type": "select",
    "required": true,
    "default": "interest",
    "options": [
      {"value": "interest", "label": "Interesse wecken"},
      {"value": "meeting", "label": "Meeting vereinbaren"},
      {"value": "investment", "label": "Investment erhalten"},
      {"value": "sale", "label": "Direkter Verkauf"}
    ]
  }
]
```

---

## 9. Best Practices für Video-Szenarien

### ✅ DO

**1. Klare Aufgaben statt Fragen**
```
✅ "Stellen Sie sich in 60 Sekunden vor."
✅ "Präsentieren Sie Ihren wichtigsten Erfolg."
❌ "Können Sie mir etwas über sich erzählen?"
```

**2. Zeitangaben realistisch setzen**
```
question_count: 5
time_limit_per_question: 90
→ Gesamtdauer: ~7-8 Minuten (realistisch für Video)
```

**3. Tipps auf Körpersprache fokussieren**
```
"tips": [
  "Halten Sie Blickkontakt mit der Kamera",
  "Nutzen Sie offene Gestik",
  "Lächeln Sie zu Beginn"
]
```

**4. enable_navigation bei kurzen Pitches**
```
scenario_type: "pitch"
enable_navigation: 1
→ Nutzer kann zwischen Pitch-Phasen wechseln
```

**5. Feedback-Prompt für spezifische Szenarien**
```
Bei Pitch: Fokus auf Prägnanz und Energie
Bei Interview: Fokus auf Inhalt und Struktur
Bei Verhandlung: Fokus auf Souveränität und Argumentation
```

### ❌ DON'T

**1. Zu viele Fragen**
```
❌ question_count: 12 (zu lang für Video)
✅ question_count: 4-6 (optimal)
```

**2. Zu kurze Zeitlimits**
```
❌ time_limit_per_question: 30 (zu gehetzt)
✅ time_limit_per_question: 60-120 (natürlich)
```

**3. Nur inhaltliche Tipps**
```
❌ "Nennen Sie konkrete Zahlen" (nur Inhalt)
✅ "Nennen Sie konkrete Zahlen und unterstützen Sie diese mit Gestik"
```

**4. scenario_type ignorieren**
```
❌ Alles als 'custom'
✅ Passenden Typ wählen für optimale Analyse
```

---

## 10. Checkliste für neue Video-Szenarien

### Metadaten
- [ ] **title**: Klar und aktionsorientiert
- [ ] **description**: 1-2 Sätze, was geübt wird
- [ ] **icon**: Passendes Lucide-Icon
- [ ] **difficulty**: `beginner` | `intermediate` | `advanced`
- [ ] **category**: JSON-Array mit Kategorien
- [ ] **target_audience**: Semicolon-getrennte Zielgruppen
- [ ] **scenario_type**: Passender Typ gewählt

### Video-Konfiguration
- [ ] **question_count**: 3-6 (optimal für Video)
- [ ] **time_limit_per_question**: 60-120 Sekunden
- [ ] **total_time_limit**: Sinnvoll (5-10 Minuten)
- [ ] **enable_tips**: 1 für Übungsszenarien
- [ ] **enable_navigation**: 1 für Pitches, 0 für Interviews

### Prompts
- [ ] **system_prompt**:
  - [ ] Klare KI-Rolle definiert
  - [ ] Alle Variablen verwendet (`${...}`)
  - [ ] Fokus auf Video-spezifische Aspekte
- [ ] **question_generation_prompt**:
  - [ ] Aufgaben statt Fragen formuliert
  - [ ] Zeitangaben berücksichtigt
  - [ ] Tipps für Körpersprache gefordert
- [ ] **feedback_prompt** (optional):
  - [ ] Szenario-spezifische Kriterien

### Input-Konfiguration
- [ ] Alle benötigten Variablen definiert
- [ ] Sinnvolle Defaults und Placeholders
- [ ] Select-Felder für feste Optionen

### Test
- [ ] Video-Session durchgespielt
- [ ] Aufgaben sind natürlich zu beantworten
- [ ] Zeitlimits sind realistisch
- [ ] Analyse-Feedback ist spezifisch

---

## 11. Zusammenfassung

| Komponente | Funktion |
|------------|----------|
| **system_prompt** | Kontext für Fragen-Generierung und Analyse |
| **question_generation_prompt** | WIE sollen Aufgaben formuliert sein? |
| **feedback_prompt** | Zusätzliche Analyse-Kriterien (optional) |
| **input_configuration** | WELCHE Variablen eingeben? |
| **scenario_type** | Art des Szenarios (beeinflusst Analyse) |
| **${variable}** | Platzhalter für Nutzereingaben |

### Die 6 Analyse-Kategorien (immer)

1. **Auftreten** – Erster Eindruck, Gesamtwirkung
2. **Selbstbewusstsein** – Sicherheit, Authentizität
3. **Körpersprache** – Haltung, Gestik, Mimik
4. **Kommunikation** – Sprechweise, Klarheit
5. **Professionalität** – Erscheinungsbild, Setting
6. **Inhalt** – Qualität der Antworten

### Der Schlüssel zu guten Video-Szenarien

1. **Aufgaben statt Fragen** formulieren
2. **Realistische Zeitlimits** setzen
3. **Tipps auf Körpersprache** fokussieren
4. **Passenden scenario_type** wählen
5. **Testen, testen, testen!**

---

## 12. Schnellreferenz

### Variable definieren und nutzen

```
SCHRITT 1: In input_configuration definieren
{
  "key": "pitch_topic",
  "label": "Thema deines Pitches",
  "type": "text",
  "required": true
}

SCHRITT 2: Im Prompt verwenden
"Übe einen Pitch für ${pitch_topic}..."

SCHRITT 3: Nutzer gibt ein
"Meine App für Zeitmanagement"

SCHRITT 4: KI erhält
"Übe einen Pitch für Meine App für Zeitmanagement..."
```

### Szenario-Typ Entscheidung

```
Was wird geübt?
├─ "Stell dich vor"        → self_presentation
├─ Interview-Fragen        → interview
├─ 60-Sekunden Pitch       → pitch
├─ Gehaltsverhandlung      → negotiation
└─ Alles andere            → custom
```

### Optimale Konfiguration

```
Selbstpräsentation: 5 Fragen, je 90 Sek, navigation=0
Bewerbungsgespräch: 6 Fragen, je 120 Sek, navigation=0
Elevator Pitch:     3 Fragen, je 60 Sek, navigation=1
```

---

*Dokumentation Version 1.0 – Wirkungs-Analyse (Video-Training) System*
