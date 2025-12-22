# Szenario-Training – Vollständige Systemdokumentation für Content-Erstellung

---

## 1. Übersicht: Was ist Szenario-Training?

Szenario-Training ist ein **strukturiertes Frage-Antwort-Training** mit **sofortigem KI-Feedback nach jeder Antwort**. Im Gegensatz zur Live-Simulation können Nutzer hier in ihrem eigenen Tempo lernen und verstehen, was funktioniert und was nicht.

### Der Kernmechanismus

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    SZENARIO     │    │   USER-INPUT    │    │    SESSION      │
│   (Vorlage)     │ +  │  (Variablen)    │ →  │   (Training)    │
│                 │    │                 │    │                 │
│ • system_prompt │    │ • position      │    │ • 8-12 Fragen   │
│ • input_config  │    │ • company       │    │ • Audio-Antwort │
│ • question_     │    │ • experience    │    │ • Sofort-       │
│   generation    │    │                 │    │   Feedback      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Zwei Modi

| Modus | Beschreibung | Beispiel |
|-------|--------------|----------|
| **INTERVIEW** | KI stellt Fragen, User antwortet | Vorstellungsgespräch, Gehaltsverhandlung |
| **SIMULATION** | KI spielt Gegenüber, User führt Gespräch | Verkaufsgespräch, Konfliktgespräch |

---

## 2. Die Export-Felder im Detail

### Szenario-Tabelle (Export-Spalten)

| Feld | Typ | Beschreibung | Beispiel |
|------|-----|--------------|----------|
| **id** | Zahl | Eindeutige Szenario-ID | `1` |
| **title** | Text | Name des Szenarios | `Bewerbungsgespräch` |
| **description** | Text | Kurzbeschreibung für Dashboard | `Übe typische Interviewfragen...` |
| **icon** | Text | Lucide-Icon-Name | `briefcase`, `banknote`, `users` |
| **difficulty** | Text | Schwierigkeitsgrad | `beginner`, `intermediate`, `advanced` |
| **category** | JSON | Kategorien als Array | `["karriere","fuehrung"]` |
| **target_audience** | Text | Zielgruppen (Semicolon-getrennt) | `karriere-placement;leadership-academy` |
| **mode** | Text | Trainingsmodus | `INTERVIEW` oder `SIMULATION` |
| **system_prompt** | Text | KI-Rolle und Kontext | Siehe Abschnitt 3 |
| **question_generation_prompt** | Text | Zusätzliche Anweisungen für Fragen | Siehe Abschnitt 4 |
| **feedback_prompt** | Text | Custom Feedback-Anweisungen (optional) | Siehe Abschnitt 5 |
| **input_configuration** | JSON | Formularfelder für Variablen | Siehe Abschnitt 6 |
| **question_count_min** | Zahl | Minimale Fragenanzahl | `8` |
| **question_count_max** | Zahl | Maximale Fragenanzahl | `12` |
| **time_limit_per_question** | Zahl | Sekunden pro Frage | `120` |
| **allow_retry** | 0/1 | Wiederholung erlaubt? | `1` = ja |
| **is_active** | 0/1 | Szenario sichtbar? | `1` = aktiv |
| **sort_order** | Zahl | Reihenfolge im Dashboard | `1`, `2`, `3` |

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

### Schwierigkeitsgrade (difficulty)

| Wert | Beschreibung | Typische Fragen |
|------|--------------|-----------------|
| `beginner` | Einsteiger | Standardfragen, mehr Tipps |
| `intermediate` | Fortgeschritten | Anspruchsvollere Fragen |
| `advanced` | Experte | Stressfragen, weniger Hilfestellung |

---

## 3. Der System-Prompt: KI-Rolle definieren

### Zweck

Der `system_prompt` definiert **WER die KI ist** und **WIE sie sich verhält**. Er wird bei der Fragen-Generierung verwendet.

### Struktur

```
Du bist [ROLLE mit ERFAHRUNG].

[KONTEXT zur Situation]

[VERHALTENSANWEISUNGEN]
```

### Beispiel: Bewerbungsgespräch

```
Du bist ein erfahrener HR-Manager mit über 15 Jahren Erfahrung in der
Personalauswahl bei führenden deutschen Unternehmen.

Du führst ein professionelles Vorstellungsgespräch für die Position
${position}${?company: bei }.

Dein Ziel ist es, die fachliche Eignung, Motivation und Persönlichkeit
des Bewerbers zu prüfen. Du stellst eine Mischung aus klassischen
Interviewfragen, Verhaltens- und Situationsfragen.

Passe den Schwierigkeitsgrad an ${experience_level} an.
```

### Beispiel: Verkaufsgespräch (SIMULATION)

```
Du bist ein skeptischer Einkäufer bei ${customer_company} in der
${industry}-Branche.

Du hast wenig Zeit, bist preissensibel und hast bereits mit Wettbewerbern
gesprochen. Du gibst dem Verkäufer eine faire Chance, bist aber nicht
leicht zu überzeugen.

Bringe typische Einwände wie "zu teuer", "wir haben bereits einen Anbieter"
oder "ich muss das intern abstimmen".
```

### Variablen im System-Prompt

| Syntax | Funktion | Beispiel |
|--------|----------|----------|
| `${variable}` | Einfache Ersetzung | `${position}` → "Developer" |
| `${?variable:prefix}` | Conditional mit Prefix | `${?company: bei }` → " bei Google" (nur wenn company gesetzt) |

---

## 4. Der Question-Generation-Prompt: Fragen steuern

### Zweck

Der `question_generation_prompt` gibt **zusätzliche Anweisungen**, wie die Fragen generiert werden sollen. Er ergänzt den System-Prompt.

### Wann verwenden?

- Spezifische Fragentypen vorgeben
- Themen ein-/ausschließen
- Reihenfolge oder Struktur definieren

### Beispiel: Bewerbungsgespräch

```
Generiere Fragen in dieser Reihenfolge:
1. Einstiegsfrage (Selbstpräsentation)
2. 2-3 Fragen zur fachlichen Qualifikation
3. 2-3 Verhaltensfragen (Situation-Task-Action-Result)
4. 1-2 Fragen zur Motivation
5. Abschlussfrage (Rückfragen des Bewerbers)

WICHTIG:
- Keine Fragen zu Gehalt oder Benefits
- Mindestens eine Stressfrage bei ${experience_level} = "senior"
- Beziehe dich auf aktuelle Trends in der ${position}-Branche
```

### Beispiel: Gehaltsverhandlung

```
Simuliere eine realistische Gehaltsverhandlung.

Phasen:
1. Eröffnung: Frage nach Gehaltsvorstellung
2. Einwand: "Das liegt über unserem Budget"
3. Verhandlung: Gegenangebot machen
4. Zusatzleistungen: Benefits anbieten
5. Abschluss: Finale Entscheidung fordern

Bezugspunkte:
- Aktuelles Gehalt: ${current_salary}
- Zielgehalt: ${target_salary}
- Marktüblich für ${position}: Recherchiere realistische Werte
```

---

## 5. Der Feedback-Prompt: Bewertung anpassen (optional)

### Zweck

Der `feedback_prompt` ist **optional** und ermöglicht, die Bewertungskriterien anzupassen. Wenn leer, wird das Standard-Feedback verwendet.

### Standard-Bewertungskriterien (INTERVIEW)

- **Struktur & Klarheit** der Antworten
- **Inhalt & Beispiele** (konkret, relevant)
- **Motivation & Begeisterung**
- **Professionalität & Selbstbewusstsein**

### Standard-Bewertungskriterien (SIMULATION)

- **Gesprächsführung & Struktur**
- **Kundenorientierung & Empathie**
- **Problemlösungskompetenz**
- **Professionalität & Souveränität**

### Custom Feedback-Prompt Beispiel

```
Bewerte die Antworten mit besonderem Fokus auf:

1. STAR-Methode (Situation-Task-Action-Result)
   - Wurde eine konkrete Situation beschrieben?
   - Wurde das Ergebnis quantifiziert?

2. Unternehmensbezug
   - Hat der Bewerber ${company} erwähnt?
   - Zeigt er Kenntnis der Unternehmenskultur?

3. Authentizität
   - Wirkt die Antwort ehrlich oder auswendig gelernt?

Gewichtung:
- Inhalt: 50%
- Struktur: 30%
- Präsentation: 20%
```

---

## 6. Die Input-Configuration: Eigene Variablen definieren

### Das Prinzip

Jedes Szenario kann **eigene Variablen** definieren, die der Nutzer vor dem Training eingibt. Diese Variablen werden dann in den Prompts verwendet.

### JSON-Struktur

```json
[
  {
    "key": "position",
    "label": "Zielposition",
    "type": "text",
    "required": true,
    "placeholder": "z.B. Senior Developer, Product Manager"
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
    "label": "Erfahrungsstufe",
    "type": "select",
    "required": true,
    "default": "mid",
    "options": [
      {"value": "entry", "label": "Berufseinsteiger (0-2 Jahre)"},
      {"value": "mid", "label": "Berufserfahren (3-7 Jahre)"},
      {"value": "senior", "label": "Senior (8+ Jahre)"}
    ]
  }
]
```

### Feldtypen

| type | Darstellung | Wann verwenden |
|------|-------------|----------------|
| `text` | Einzeiliges Textfeld | Kurze Eingaben (Name, Position) |
| `textarea` | Mehrzeiliges Textfeld | Längere Beschreibungen |
| `select` | Dropdown-Auswahl | Vordefinierte Optionen |
| `number` | Zahlenfeld | Gehalt, Jahre, etc. |

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
| `validation` | ❌ | `{minLength, maxLength}` |

---

## 7. Wie Fragen generiert werden

### Der automatische Ablauf

```
1. USER STARTET SESSION
   └─ Variablen werden gespeichert

2. SYSTEM BAUT PROMPT
   ├─ system_prompt (mit interpolierten Variablen)
   ├─ question_generation_prompt (optional)
   └─ Fragen-Anzahl: random(min, max)

3. GEMINI GENERIERT FRAGEN
   └─ JSON-Array mit {question, category, tips, estimated_time}

4. FRAGEN WERDEN GESPEICHERT
   └─ In Session als questions_json
```

### Das generierte Fragen-Format

```json
[
  {
    "index": 0,
    "question": "Erzählen Sie mir etwas über sich und Ihren beruflichen Werdegang.",
    "category": "Einstieg",
    "estimated_answer_time": 90,
    "tips": [
      "Strukturiere: Vergangenheit → Gegenwart → Zukunft",
      "Nenne 2-3 konkrete Erfolge mit Zahlen",
      "Beziehe dich auf die Zielposition"
    ]
  },
  {
    "index": 1,
    "question": "Was hat Sie an dieser Position besonders angesprochen?",
    "category": "Motivation",
    "estimated_answer_time": 60,
    "tips": [
      "Zeige Recherche über das Unternehmen",
      "Verbinde eigene Stärken mit Anforderungen"
    ]
  }
]
```

### Unterschied INTERVIEW vs. SIMULATION

**INTERVIEW-Modus:**
```
"question": "Warum möchten Sie bei uns arbeiten?"
→ KI fragt, User antwortet
```

**SIMULATION-Modus:**
```
"question": "Das ist mir zu teuer! Ihr Wettbewerber bietet 20% günstiger an."
→ KI spielt Gegenüber (Kunde), User muss reagieren
```

---

## 8. Das Feedback-System

### Feedback nach jeder Antwort

Nach jeder Audio-Antwort erhält der Nutzer sofortiges Feedback:

```json
{
  "summary": "Guter Einstieg mit klarer Struktur. Die Beispiele
              könnten konkreter sein.",
  "strengths": [
    "Klare chronologische Struktur",
    "Selbstbewusster Tonfall",
    "Guter Bezug zur Zielposition"
  ],
  "improvements": [
    "Mehr konkrete Zahlen und Ergebnisse nennen",
    "Füllwörter reduzieren (5x 'ähm' gezählt)",
    "Antwort etwas kürzer halten (90 statt 120 Sekunden)"
  ],
  "tips": [
    "Nutze die STAR-Methode für Beispiele",
    "Übe die Antwort auf 60-90 Sekunden zu kürzen"
  ],
  "rating": {
    "overall": 7.5,
    "communication": 7.0,
    "motivation": 8.0,
    "professionalism": 7.5
  }
}
```

### Audio-Analyse (zusätzlich)

```json
{
  "speech_rate": "optimal",
  "filler_words": {
    "count": 5,
    "words": ["ähm", "also", "halt"],
    "severity": "mittel"
  },
  "confidence_score": 72,
  "clarity_score": 85
}
```

### Score-Umrechnung

| Datenbank | UI-Anzeige | Farbe |
|-----------|------------|-------|
| 8.0-10.0 | 80-100 | Grün |
| 6.0-7.9 | 60-79 | Blau |
| 4.0-5.9 | 40-59 | Orange |
| 0-3.9 | 0-39 | Rot |

---

## 9. Vollständiges Szenario-Beispiel

### Szenario: "Gehaltsverhandlung"

**Metadaten:**

| Feld | Wert |
|------|------|
| title | `Gehaltsverhandlung` |
| description | `Übe Verhandlungstaktiken für mehr Gehalt` |
| icon | `banknote` |
| difficulty | `intermediate` |
| category | `["karriere"]` |
| target_audience | `karriere-placement` |
| mode | `INTERVIEW` |
| question_count_min | `6` |
| question_count_max | `10` |
| time_limit_per_question | `120` |

**system_prompt:**
```
Du bist der Personalleiter eines mittelständischen Unternehmens.
Du führst ein Gehaltsgespräch mit einem Mitarbeiter.

Kontext:
- Position des Mitarbeiters: ${position}
- Aktuelle Berufserfahrung: ${years_experience} Jahre
- Aktuelles Gehalt: ${current_salary}
- Gewünschtes Gehalt: ${target_salary}
- Verhandlungsgrund: ${negotiation_type}

Du bist fair, aber achtest auf das Budget. Du stellst kritische
Rückfragen und bringst typische Arbeitgeber-Einwände.
```

**question_generation_prompt:**
```
Simuliere eine realistische Gehaltsverhandlung mit diesen Phasen:

1. Eröffnung: Frage nach Gehaltsvorstellung und Begründung
2. Rückfrage: Hake bei der Begründung nach
3. Einwand: "Das Budget gibt das nicht her"
4. Verhandlung: Biete Kompromiss oder Benefits an
5. Abschluss: Fordere Entscheidung oder vertage

WICHTIG:
- Sei realistisch und fair
- Die Differenz zwischen ${current_salary} und ${target_salary}
  sollte die Schwierigkeit beeinflussen
- Bei ${negotiation_type} = "befoerderung" mehr Fokus auf neue Aufgaben
```

**input_configuration:**
```json
[
  {
    "key": "position",
    "label": "Deine aktuelle Position",
    "type": "text",
    "required": true,
    "placeholder": "z.B. Senior Developer, Teamleiter"
  },
  {
    "key": "years_experience",
    "label": "Jahre Berufserfahrung",
    "type": "number",
    "required": true,
    "default": "5"
  },
  {
    "key": "current_salary",
    "label": "Aktuelles Jahresgehalt (brutto)",
    "type": "text",
    "required": true,
    "placeholder": "z.B. 55.000 €"
  },
  {
    "key": "target_salary",
    "label": "Gewünschtes Jahresgehalt (brutto)",
    "type": "text",
    "required": true,
    "placeholder": "z.B. 65.000 €"
  },
  {
    "key": "negotiation_type",
    "label": "Verhandlungsgrund",
    "type": "select",
    "required": true,
    "default": "jahresgespraech",
    "options": [
      {"value": "jahresgespraech", "label": "Reguläres Jahresgespräch"},
      {"value": "befoerderung", "label": "Beförderung"},
      {"value": "neue_aufgaben", "label": "Neue Verantwortungsbereiche"},
      {"value": "gegenangebot", "label": "Gegenangebot (anderes Angebot erhalten)"}
    ]
  }
]
```

---

## 10. Best Practices für Szenario-Erstellung

### ✅ DO

**1. Klare Rolle im system_prompt**
```
Du bist ein erfahrener HR-Manager mit 15 Jahren Erfahrung bei
DAX-Unternehmen. Du führst strukturierte Verhaltensinterviews.
```

**2. Variablen mehrfach nutzen**
```
Führe ein Interview für ${position}. Passe den Schwierigkeitsgrad
an ${experience_level} an. Bei ${?company:Fragen zu } stellen.
```

**3. Phasen/Struktur vorgeben**
```
question_generation_prompt:
Generiere Fragen in dieser Reihenfolge:
1. Einstieg (1 Frage)
2. Fachliches (3 Fragen)
3. Verhalten (2 Fragen)
4. Abschluss (1 Frage)
```

**4. Tipps-Qualität sicherstellen**
```
Generiere zu JEDER Frage 2-3 spezifische, umsetzbare Tipps.
Keine generischen Tipps wie "Sei selbstbewusst".
```

**5. SIMULATION klar vom INTERVIEW trennen**
```
SIMULATION: "Das ist mir zu teuer!" (User muss reagieren)
INTERVIEW: "Warum sollten wir Sie einstellen?" (User antwortet)
```

### ❌ DON'T

**1. Zu vage sein**
```
❌ "Führe ein gutes Interview."
✅ "Führe ein strukturiertes Verhaltensinterview mit STAR-Fragen."
```

**2. Variablen vergessen**
```
❌ "Führe ein Interview für einen Developer."
✅ "Führe ein Interview für ${position}."
```

**3. Zu viele/wenige Fragen**
```
❌ question_count_min: 3, question_count_max: 20
✅ question_count_min: 6, question_count_max: 10
```

**4. Modus falsch wählen**
```
❌ INTERVIEW für Verkaufsgespräch (User führt)
✅ SIMULATION für Verkaufsgespräch
```

---

## 11. Checkliste für neue Szenarien

### Metadaten
- [ ] **title**: Klar und aktionsorientiert
- [ ] **description**: 1-2 Sätze, was geübt wird
- [ ] **icon**: Passendes Lucide-Icon
- [ ] **difficulty**: `beginner` | `intermediate` | `advanced`
- [ ] **category**: JSON-Array mit Kategorien
- [ ] **target_audience**: Semicolon-getrennte Zielgruppen
- [ ] **mode**: `INTERVIEW` oder `SIMULATION`

### Fragen-Konfiguration
- [ ] **question_count_min/max**: Sinnvoller Bereich (z.B. 6-10)
- [ ] **time_limit_per_question**: Angemessen (60-180 Sekunden)
- [ ] **allow_retry**: Ja für Übungsszenarien

### Prompts
- [ ] **system_prompt**:
  - [ ] Klare KI-Rolle definiert
  - [ ] Alle Variablen verwendet (`${...}`)
  - [ ] Verhaltensanweisungen gegeben
- [ ] **question_generation_prompt**:
  - [ ] Struktur/Phasen vorgegeben
  - [ ] Tipps-Anforderungen definiert
- [ ] **feedback_prompt** (optional):
  - [ ] Nur wenn Custom-Bewertung nötig

### Input-Konfiguration
- [ ] Alle benötigten Variablen definiert
- [ ] Sinnvolle Defaults und Placeholders
- [ ] Select-Felder für feste Optionen
- [ ] Keys sind sprechend und eindeutig

### Test
- [ ] Session durchgespielt
- [ ] Fragen sind sinnvoll und variabel
- [ ] Feedback ist spezifisch und hilfreich
- [ ] Tipps sind umsetzbar

---

## 12. Zusammenfassung

| Komponente | Funktion |
|------------|----------|
| **system_prompt** | WER ist die KI? (Rolle, Verhalten) |
| **question_generation_prompt** | WIE sollen Fragen sein? (Struktur, Phasen) |
| **feedback_prompt** | WIE bewerten? (Custom-Kriterien, optional) |
| **input_configuration** | WELCHE Variablen eingeben? |
| **mode** | INTERVIEW (KI fragt) oder SIMULATION (User führt) |
| **${variable}** | Platzhalter für Nutzereingaben |

### Der Schlüssel zu guten Szenarien

1. **Klare KI-Rolle** im system_prompt
2. **Strukturierte Fragen** durch question_generation_prompt
3. **Passender Modus** (INTERVIEW vs. SIMULATION)
4. **Sinnvolle Variablen** für Personalisierung
5. **Testen, testen, testen!**

---

## 13. Schnellreferenz

### Variable definieren und nutzen

```
SCHRITT 1: In input_configuration definieren
{
  "key": "position",
  "label": "Zielposition",
  "type": "text",
  "required": true
}

SCHRITT 2: Im Prompt verwenden
"Führe ein Interview für ${position}..."

SCHRITT 3: Nutzer gibt ein
"Senior Developer"

SCHRITT 4: KI erhält
"Führe ein Interview für Senior Developer..."
```

### Conditional Syntax

```
${?company:bei }
→ Wenn company leer: ""
→ Wenn company = "BMW": "bei BMW"
```

### Modus-Entscheidung

```
Wer führt das Gespräch?
├─ KI fragt, User antwortet  → INTERVIEW
└─ User führt, KI reagiert   → SIMULATION
```

---

*Dokumentation Version 1.0 – Szenario-Training System*
