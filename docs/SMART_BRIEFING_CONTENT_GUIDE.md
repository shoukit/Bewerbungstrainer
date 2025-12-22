# Smart Briefing – Vollständige Systemdokumentation für Content-Erstellung

---

## 1. Übersicht: Was ist Smart Briefing?

Smart Briefing ist ein **KI-gestütztes Vorbereitungssystem**, das personalisierte Wissenspakete für berufliche Gespräche generiert. Nutzer wählen ein **Template** (z.B. "Job Interview Deep-Dive"), geben ihre **spezifischen Variablen** ein (z.B. Position, Unternehmen), und erhalten in Sekunden ein **strukturiertes Briefing** mit allem, was sie wissen müssen.

### Der Kernmechanismus

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    TEMPLATE     │    │   USER-INPUT    │    │    BRIEFING     │
│   (Vorlage)     │ +  │  (Variablen)    │ →  │   (Ergebnis)    │
│                 │    │                 │    │                 │
│ • ai_role       │    │ • role_name     │    │ • 4-6 Sections  │
│ • ai_task       │    │ • target_company│    │ • Je 3-7 Items  │
│ • ai_behavior   │    │ • interview_type│    │ • Notizen       │
│ • Variablen-    │    │                 │    │                 │
│   Schema        │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 2. Die Export-Felder im Detail

### Template-Tabelle (Export-Spalten)

| Feld | Typ | Beschreibung | Beispiel |
|------|-----|--------------|----------|
| **id** | Zahl | Eindeutige Template-ID | `1` |
| **title** | Text | Name des Templates (wird im Dashboard angezeigt) | `Job Interview Deep-Dive` |
| **description** | Text | Kurzbeschreibung für die Vorschau | `Erhalte ein maßgeschneidertes Briefing mit Insider-Wissen...` |
| **icon** | Text | Lucide-Icon-Name ([Lucide Icons](https://lucide.dev/icons)) | `briefcase`, `banknote`, `users` |
| **category** | Text | Kategorie für Filterung | Siehe Tabelle unten |
| **target_audience** | Text | Zielgruppe/Produktlinie | Siehe Tabelle unten |
| **ai_role** | Text | KI-Rolle/Persona | `Du bist ein strategischer Karriere-Coach...` |
| **ai_task** | Text | Aufgabenbeschreibung | `Erstelle ein strukturiertes Briefing...` |
| **ai_behavior** | Text | Gewünschtes Verhalten | `Sei motivierend, spezifisch...` |
| **variables_schema** | JSON | Definition der Eingabefelder | Siehe Abschnitt 4 |
| **is_active** | 0/1 | Template sichtbar? | `1` = aktiv |
| **sort_order** | Zahl | Reihenfolge im Dashboard (höher = weiter oben) | `1`, `2`, `3` |
| **allow_custom_variables** | 0/1 | Darf Nutzer eigene Variablen hinzufügen? | `1` = ja |

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

---

## 3. Der Strukturierte Prompt: Herzstück der Generierung

### Die drei Prompt-Komponenten

Das System verwendet einen **strukturierten Prompt** aus drei getrennten Feldern:

| Feld | Zweck | Inhalt |
|------|-------|--------|
| **ai_role** | WER ist die KI? | Persona, Expertise, Hintergrund |
| **ai_task** | WAS soll sie tun? | Konkrete Aufgabe, Struktur, Sections |
| **ai_behavior** | WIE soll sie es tun? | Ton, Stil, Verhaltensregeln |

### Zusammenbau-Reihenfolge

Das System baut den finalen Prompt automatisch zusammen:

```
┌─────────────────────────────────────────────────────────────────┐
│  1. ai_role                                                     │
│     "Du bist ein strategischer Karriere-Coach mit 15 Jahren     │
│      Erfahrung in der Personalberatung..."                      │
├─────────────────────────────────────────────────────────────────┤
│  2. === USER-DATEN === (automatisch generiert)                  │
│     - Deine Ziel-Rolle: Senior Developer                        │
│     - Unternehmen: Google Germany                               │
│     - Art des Gesprächs: Finalgespräch                          │
├─────────────────────────────────────────────────────────────────┤
│  3. ai_task                                                     │
│     "Erstelle ein strukturiertes Briefing für ein               │
│      Vorstellungsgespräch. Das Briefing soll 4 Sections         │
│      enthalten: Personal Pitch, Fachliche Must-Haves,           │
│      Insider-Wissen, Smart Questions."                          │
├─────────────────────────────────────────────────────────────────┤
│  4. ai_behavior                                                 │
│     "Sei motivierend, aber realistisch. Gib konkrete,           │
│      umsetzbare Tipps. Vermeide Floskeln. Beziehe dich          │
│      immer auf die spezifischen User-Daten."                    │
└─────────────────────────────────────────────────────────────────┘
```

### Beispiel: Vollständiges Template

**ai_role:**
```
Du bist ein erfahrener Verhandlungscoach mit 15 Jahren Erfahrung in
Gehaltsverhandlungen. Du hast tausende Fach- und Führungskräfte erfolgreich
auf ihre Verhandlungen vorbereitet und kennst die Strategien beider Seiten.
```

**ai_task:**
```
Erstelle ein strategisches Briefing für eine Gehaltsverhandlung.

Das Briefing soll folgende 5 Sections enthalten:

### 1. Marktwert-Check 📊
Analysiere den Marktwert für die Position ${position}. Ist das Zielgehalt
von ${target_salary} realistisch? Beziehe Branche und Region ein.

### 2. Deine Top-3 Argumente 💪
Entwickle 3 konkrete, evidenzbasierte Argumente für die Gehaltserhöhung.
Fokus auf Leistung, Mehrwert und Erfolge.

### 3. Gegenargument-Parry 🛡️
Die 3 häufigsten Einwände des Arbeitgebers und wie man sie elegant
entkräftet. Inklusive Formulierungsbeispielen.

### 4. Verhandlungstaktiken 🎯
2-3 konkrete Taktiken passend zum Kontext "${negotiation_context}".
Mit Beispieldialogen.

### 5. Dein Walk-Away-Point 🚪
Definiere die Schmerzgrenze und alternative Benefits
(Homeoffice, Weiterbildung, etc.), die verhandelt werden können.
```

**ai_behavior:**
```
- Sei strategisch und datenorientiert
- Nutze konkrete Zahlen und Formulierungsbeispiele
- Sprich den Nutzer direkt an ("du", nicht "Sie")
- Vermeide Floskeln wie "Es kommt drauf an"
- Beziehe dich immer auf die konkreten User-Daten
- Jedes Item sollte sofort umsetzbar sein
```

---

### Variablen-Platzhalter

**Syntax:** `${variable_name}`

Platzhalter werden automatisch durch die Nutzereingaben ersetzt:

| Platzhalter im Prompt | Nutzereingabe | Ergebnis |
|-----------------------|---------------|----------|
| `${role_name}` | "Senior Developer" | "Senior Developer" |
| `${target_company}` | "Google Germany" | "Google Germany" |
| `${target_salary}` | "75.000 €" | "75.000 €" |

**Wichtig:** Jede Variable, die im `variables_schema` definiert ist, kann im Prompt verwendet werden!

---

## 4. Das Variables-Schema: Eigene Variablen pro Template definieren

### Das Prinzip: Volle Flexibilität

Jedes Template kann **beliebig viele eigene Variablen** definieren. Es gibt keine festen Variablen – Sie entscheiden, welche Informationen Sie vom Nutzer benötigen.

**Die Regel ist einfach:**
```
Was Sie im variables_schema als "key" definieren,
können Sie im Prompt als ${key} verwenden.
```

### Syntax im Überblick

```
┌─────────────────────────────────────────────────────────────────┐
│  VARIABLES_SCHEMA                    →    PROMPT                │
├─────────────────────────────────────────────────────────────────┤
│  { "key": "kunde" }                  →    ${kunde}              │
│  { "key": "branche" }                →    ${branche}            │
│  { "key": "hauptproblem" }           →    ${hauptproblem}       │
│  { "key": "budget_range" }           →    ${budget_range}       │
│  { "key": "entscheider_typ" }        →    ${entscheider_typ}    │
└─────────────────────────────────────────────────────────────────┘
```

### Beispiel 1: Karriere-Template

**variables_schema:**
```json
[
  { "key": "role_name", "label": "Deine Ziel-Rolle", "type": "text", "required": true },
  { "key": "target_company", "label": "Unternehmen", "type": "text", "required": true },
  { "key": "interview_type", "label": "Art des Gesprächs", "type": "select", "required": true,
    "options": [
      {"value": "erstgespraech", "label": "Erstgespräch"},
      {"value": "fachgespraech", "label": "Fachgespräch"}
    ]
  }
]
```

**Verwendung im Prompt (ai_task):**
```
Erstelle ein Briefing für die Position ${role_name} bei ${target_company}.
Passe die Tipps an den Gesprächstyp "${interview_type}" an.
```

### Beispiel 2: Vertrieb-Template (komplett andere Variablen!)

**variables_schema:**
```json
[
  { "key": "kunde", "label": "Kundenname", "type": "text", "required": true },
  { "key": "branche", "label": "Branche des Kunden", "type": "text", "required": true },
  { "key": "produkt", "label": "Dein Produkt/Service", "type": "text", "required": true },
  { "key": "entscheider_typ", "label": "Typ des Entscheiders", "type": "select", "required": true,
    "options": [
      {"value": "ceo", "label": "CEO / Geschäftsführer"},
      {"value": "cfo", "label": "CFO / Finanzleiter"},
      {"value": "it_leiter", "label": "IT-Leiter"},
      {"value": "einkauf", "label": "Einkäufer"}
    ]
  },
  { "key": "haupteinwand", "label": "Erwarteter Haupteinwand", "type": "textarea", "required": false }
]
```

**Verwendung im Prompt (ai_task):**
```
Erstelle ein Sales-Briefing für das Gespräch mit ${kunde} aus der ${branche}-Branche.

Du verkaufst: ${produkt}
Dein Gesprächspartner ist: ${entscheider_typ}
Erwarteter Einwand: ${haupteinwand}

Passe alle Argumente an den ${entscheider_typ} an –
ein CEO interessiert sich für andere Dinge als ein Einkäufer!
```

### Beispiel 3: Social Care-Template

**variables_schema:**
```json
[
  { "key": "gespraechspartner", "label": "Gesprächspartner", "type": "select", "required": true,
    "options": [
      {"value": "angehoeriger", "label": "Angehöriger"},
      {"value": "patient", "label": "Patient/Klient"},
      {"value": "kollege", "label": "Kollege/Team"},
      {"value": "arzt", "label": "Arzt/Therapeut"}
    ]
  },
  { "key": "situation", "label": "Gesprächssituation", "type": "text", "required": true,
    "placeholder": "z.B. Erstgespräch zur Pflegeplanung"
  },
  { "key": "herausforderung", "label": "Besondere Herausforderung", "type": "textarea", "required": false,
    "placeholder": "z.B. Angehöriger ist emotional aufgelöst"
  }
]
```

**Verwendung im Prompt:**
```
Bereite ein Gespräch mit einem ${gespraechspartner} vor.
Situation: ${situation}
Besondere Herausforderung: ${herausforderung}

Gib empathische, aber professionelle Gesprächsstrategien.
```

---

### Regeln für Variable-Keys

| Regel | ✅ Richtig | ❌ Falsch |
|-------|-----------|----------|
| Nur Buchstaben, Zahlen, Unterstrich | `role_name`, `customer_2` | `role-name`, `customer name` |
| Keine Leerzeichen | `target_company` | `target company` |
| Keine Sonderzeichen | `budget_range` | `budget€`, `budget%` |
| Klein geschrieben (Konvention) | `interview_type` | `InterviewType` |
| Aussagekräftig | `haupteinwand` | `var1`, `x` |

### Vollständige Feld-Struktur

```json
{
  "key": "variable_name",           // PFLICHT: Technischer Name → ${variable_name}
  "label": "Anzeige-Label",         // PFLICHT: Was der Nutzer sieht
  "type": "text|textarea|select",   // PFLICHT: Feldtyp
  "required": true|false,           // Optional: Pflichtfeld? (default: false)
  "placeholder": "Beispieltext",    // Optional: Hilfstext im Feld
  "default": "Standardwert",        // Optional: Vorausgewählter Wert
  "options": [                      // NUR bei type="select"
    {"value": "wert1", "label": "Anzeige 1"},
    {"value": "wert2", "label": "Anzeige 2"}
  ]
}
```

### Feldtypen

| type | Darstellung | Wann verwenden |
|------|-------------|----------------|
| `text` | Einzeiliges Textfeld | Kurze Eingaben (Name, Position, Firma) |
| `textarea` | Mehrzeiliges Textfeld | Längere Beschreibungen, Kontext |
| `select` | Dropdown-Auswahl | Vordefinierte Optionen |

---

### Wie Variablen im Prompt ersetzt werden

**Schritt 1: Nutzer füllt Formular aus**
```
Kundenname:        [ Müller GmbH          ]
Branche:           [ Maschinenbau         ]
Entscheider:       [ CFO / Finanzleiter ▼ ]
```

**Schritt 2: System sammelt Werte**
```json
{
  "kunde": "Müller GmbH",
  "branche": "Maschinenbau",
  "entscheider_typ": "cfo"
}
```

**Schritt 3: Platzhalter werden ersetzt**

| Prompt vorher | Prompt nachher |
|---------------|----------------|
| `Gespräch mit ${kunde}` | `Gespräch mit Müller GmbH` |
| `aus der ${branche}-Branche` | `aus der Maschinenbau-Branche` |
| `Gesprächspartner ist ${entscheider_typ}` | `Gesprächspartner ist cfo` |

**Schritt 4: Finaler Prompt an KI**
```
Erstelle ein Sales-Briefing für das Gespräch mit Müller GmbH
aus der Maschinenbau-Branche.
Dein Gesprächspartner ist: cfo
...
```

---

### Tipps für gute Variablen

**1. Nutzen Sie sprechende Keys**
```
✅ ${haupteinwand}     – sofort klar, worum es geht
❌ ${var3}             – niemand weiß, was das ist
```

**2. Verwenden Sie Variablen mehrfach**
```
Ein gutes Briefing für ${role_name} bei ${target_company} enthält:
- Spezifische Skills für ${role_name}
- Insider-Wissen über ${target_company}
- Fragen, die zeigen, dass du ${target_company} recherchiert hast
```

**3. Kombinieren Sie Variablen sinnvoll**
```
Als ${entscheider_typ} bei ${kunde} interessiert sich dein Gesprächspartner
besonders für den ROI im Bereich ${branche}.
```

**4. Nutzen Sie Select für konsistente Werte**
```json
{
  "key": "gespraechsstil",
  "type": "select",
  "options": [
    {"value": "empathisch", "label": "Empathisch & verständnisvoll"},
    {"value": "direkt", "label": "Direkt & lösungsorientiert"},
    {"value": "analytisch", "label": "Analytisch & faktenbasiert"}
  ]
}
```
→ Im Prompt: `Kommuniziere im Stil: ${gespraechsstil}`

---

### Zusammenfassung: Der Variablen-Workflow

```
1. DEFINIEREN
   variables_schema: [{ "key": "meine_variable", ... }]
                            ↓
2. VERWENDEN
   ai_task: "Text mit ${meine_variable} im Prompt"
                            ↓
3. EINGEBEN
   Nutzer füllt Formular aus: "Mein Wert"
                            ↓
4. ERSETZEN
   "Text mit Mein Wert im Prompt"
                            ↓
5. GENERIEREN
   KI erstellt personalisiertes Briefing
```

---

## 5. Das Output-Format: Sections & Items

### Wie die KI antwortet

Die KI generiert ein **JSON-Objekt** mit Sections und Items:

```json
{
  "sections": [
    {
      "title": "1. Marktwert-Check 📊",
      "items": [
        {
          "label": "Gehaltsspanne Senior Developer",
          "content": "Für **Senior Developer** in München liegt die Spanne bei 65.000-85.000 €. Dein Ziel von 75.000 € ist **realistisch und gut begründbar**."
        },
        {
          "label": "Branchenvergleich",
          "content": "Im Tech-Sektor liegen die Gehälter **10-15% über dem Durchschnitt**. Nutze das als Argument."
        }
      ]
    },
    {
      "title": "2. Deine Top-3 Argumente 💪",
      "items": [
        {
          "label": "Argument 1: Projektleitung",
          "content": "Du hast das **Release 2.0 Projekt** geleitet – zeige den konkreten Mehrwert in Zahlen."
        }
      ]
    }
  ]
}
```

### Struktur-Regeln

| Element | Anzahl | Format |
|---------|--------|--------|
| **Sections** | 4-6 | Nummeriert mit Emoji: `1. Titel 🎯` |
| **Items pro Section** | 3-7 | Je nach Tiefe des Themas |
| **Label** | Kurz | 2-5 Wörter, prägnant |
| **Content** | 1-2 Sätze | Mit `**fett**` für Hervorhebungen |

---

## 6. Best Practices für optimale Prompts

### ✅ DO

**1. Spezifische Rolle in ai_role definieren**
```
Du bist ein erfahrener Karriere-Coach mit 15 Jahren Erfahrung
in der Automobilbranche. Du kennst die Recruiting-Prozesse
von BMW, Audi und Mercedes aus erster Hand.
```

**2. Klare Struktur in ai_task vorgeben**
```
Generiere genau 4 Sections:
1. Personal Pitch (3 Items mit konkreten Formulierungen)
2. Fachliche Must-Haves (5 Items mit Tools/Technologien)
3. Insider-Wissen (4 Items zu Unternehmenskultur)
4. Smart Questions (3 Items mit Rückfragen)
```

**3. Variablen mehrfach nutzen**
```
Beziehe dich in jeder Section konkret auf ${target_company} und ${role_name}.
Passe die Tipps an den Gesprächstyp "${interview_type}" an.
```

**4. Konkreten Ton in ai_behavior festlegen**
```
- Duze den Nutzer
- Sei motivierend, aber realistisch
- Vermeide Floskeln wie "du schaffst das"
- Gib stattdessen konkrete, umsetzbare Tipps
- Nutze **fett** für wichtige Begriffe
```

**5. Beispiele im Prompt geben**
```
Beispiel für ein gutes Item:
- Label: "ISTA Diagnosesystem"
- Content: "BMW nutzt **ISTA** als primäres Diagnosetool.
  Erwähne deine Erfahrung damit im Gespräch."
```

### ❌ DON'T

**1. Zu vage sein**
```
❌ "Gib dem Nutzer hilfreiche Tipps."
✅ "Gib 5 konkrete Tipps mit Beispielformulierungen, die der Nutzer
   wortwörtlich im Gespräch verwenden kann."
```

**2. Variablen vergessen**
```
❌ "Erstelle ein Briefing für ein Vorstellungsgespräch."
✅ "Erstelle ein Briefing für ${role_name} bei ${target_company}."
```

**3. Zu viele Sections/Items**
```
❌ 10 Sections mit je 10 Items (überwältigt den Nutzer)
✅ 4-6 Sections mit je 3-7 fokussierten Items
```

**4. Generische Inhalte zulassen**
```
❌ "Sei selbstbewusst im Gespräch."
✅ "Bei ${target_company} wird Wert auf X gelegt – zeige dies,
   indem du konkret Y erwähnst."
```

---

## 7. Vollständiges Template-Beispiel

### Template: "Gehaltsverhandlung Prep"

**Metadaten:**

| Feld | Wert |
|------|------|
| title | `Gehaltsverhandlung Prep` |
| description | `Bereite dich mit Marktwert-Daten, Argumentationsstrategien und Verhandlungstaktiken vor.` |
| icon | `banknote` |
| category | `karriere` |
| target_audience | `karriere-placement` |

**ai_role:**
```
Du bist ein erfahrener Verhandlungscoach mit 15 Jahren Erfahrung.
Du hast tausende Fach- und Führungskräfte auf Gehaltsverhandlungen vorbereitet
und kennst die Taktiken beider Seiten – Arbeitnehmer und Arbeitgeber.
```

**ai_task:**
```
Erstelle ein strategisches Briefing für eine Gehaltsverhandlung.

User-Kontext:
- Position: ${position}
- Aktuelles Gehalt: ${current_salary}
- Zielgehalt: ${target_salary}
- Verhandlungskontext: ${negotiation_context}

Generiere folgende 5 Sections:

### 1. Marktwert-Check 📊
Analysiere den Marktwert für ${position}. Ist ${target_salary} realistisch?
Gib konkrete Gehaltsspannen und Branchenvergleiche.

### 2. Deine Top-3 Argumente 💪
3 evidenzbasierte Argumente für die Erhöhung von ${current_salary} auf ${target_salary}.
Fokus auf Leistung, Mehrwert und messbare Erfolge.

### 3. Gegenargument-Parry 🛡️
Die 3 häufigsten Einwände des Arbeitgebers und wie man sie entkräftet.
Mit konkreten Formulierungsbeispielen.

### 4. Verhandlungstaktiken 🎯
2-3 Taktiken passend zum Kontext "${negotiation_context}".
Mit Beispieldialogen.

### 5. Dein Walk-Away-Point 🚪
Schmerzgrenze und alternative Benefits (Homeoffice, Weiterbildung, etc.).
```

**ai_behavior:**
```
- Sei strategisch und datenorientiert
- Nutze konkrete Zahlen und Formulierungsbeispiele
- Duze den Nutzer
- Vermeide Floskeln und Allgemeinplätze
- Jedes Item muss sofort umsetzbar sein
- Beziehe dich immer auf die konkreten User-Daten
```

**variables_schema:**
```json
[
  {
    "key": "position",
    "label": "Deine Position",
    "type": "text",
    "required": true,
    "placeholder": "z.B. Senior Developer, Teamleiter Vertrieb"
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
    "label": "Dein Zielgehalt (brutto)",
    "type": "text",
    "required": true,
    "placeholder": "z.B. 65.000 €"
  },
  {
    "key": "negotiation_context",
    "label": "Verhandlungskontext",
    "type": "select",
    "required": true,
    "default": "jahresgespraech",
    "options": [
      {"value": "neuer_job", "label": "Neuer Job - Einstiegsgehalt"},
      {"value": "jahresgespraech", "label": "Jahresgespräch / reguläre Erhöhung"},
      {"value": "befoerderung", "label": "Beförderung"},
      {"value": "gegenangebot", "label": "Gegenangebot bei Kündigung"}
    ]
  }
]
```

---

## 8. Checkliste für neue Templates

### Metadaten
- [ ] **title**: Klar und aktionsorientiert
- [ ] **description**: 1-2 Sätze, was der Nutzer erhält
- [ ] **icon**: Passendes [Lucide-Icon](https://lucide.dev/icons) gewählt
- [ ] **category**: `karriere` | `fuehrung` | `vertrieb` | `kommunikation` | `service` | `social`
- [ ] **target_audience**: `karriere-placement` | `high-performance-sales` | `leadership-academy` | `social-care` | `customer-care-resilience`

### Variablen
- [ ] Alle benötigten Eingaben im `variables_schema` definiert
- [ ] Sinnvolle Placeholders mit Beispielen
- [ ] Select-Felder für vordefinierte Optionen
- [ ] Keys sind sprechend und folgen der Syntax (keine Leerzeichen, Sonderzeichen)

### Prompt
- [ ] **ai_role**: Klare Persona mit relevanter Expertise
- [ ] **ai_task**:
  - [ ] Alle definierten Variablen verwendet (`${...}`)
  - [ ] Sections mit Emoji nummeriert (1. Titel 📊)
  - [ ] Klare Inhaltsanweisungen pro Section
  - [ ] Anzahl Items pro Section spezifiziert
- [ ] **ai_behavior**: Ton, Stil und Regeln festgelegt

### Test
- [ ] Mit echten Eingaben generiert
- [ ] Ergebnis auf Qualität und Spezifität geprüft
- [ ] Keine generischen Floskeln im Output
- [ ] Alle Variablen wurden korrekt ersetzt

---

## 9. Zusammenfassung

| Komponente | Funktion |
|------------|----------|
| **ai_role** | Definiert WER die KI ist (Persona, Expertise) |
| **ai_task** | Definiert WAS die KI tun soll (Sections, Struktur) |
| **ai_behavior** | Definiert WIE die KI es tun soll (Ton, Regeln) |
| **variables_schema** | Definiert welche Daten der Nutzer eingibt |
| **${variable}** | Platzhalter, die durch Nutzereingaben ersetzt werden |

### Der Schlüssel zu guten Briefings

1. **Spezifische, erfahrene Persona** in `ai_role`
2. **Klare Struktur mit Sections** in `ai_task`
3. **Konsequente Nutzung** von `${variablen}`
4. **Konkrete Verhaltensregeln** in `ai_behavior`
5. **Testen, testen, testen!**

---

## 10. Schnellreferenz

### Variable definieren und nutzen

```
SCHRITT 1: Im variables_schema definieren
{
  "key": "mein_key",
  "label": "Mein Label",
  "type": "text",
  "required": true
}

SCHRITT 2: Im Prompt verwenden
"Erstelle etwas für ${mein_key}..."

SCHRITT 3: Nutzer gibt ein
"Beispielwert"

SCHRITT 4: KI erhält
"Erstelle etwas für Beispielwert..."
```

### Feldtypen auf einen Blick

| Typ | JSON | Anwendung |
|-----|------|-----------|
| Text | `"type": "text"` | Kurze Eingaben |
| Textarea | `"type": "textarea"` | Lange Texte |
| Select | `"type": "select", "options": [...]` | Auswahl aus Liste |

### Prompt-Struktur

```
ai_role:     WER bin ich?     → Persona & Expertise
ai_task:     WAS soll ich?    → Aufgabe & Sections
ai_behavior: WIE mache ich?   → Ton & Regeln
```

---

*Dokumentation Version 1.0 – Smart Briefing System*
