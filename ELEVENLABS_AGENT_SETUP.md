# ElevenLabs Agent Setup - Conversation Style Integration

Diese Anleitung erklärt, wie Sie Ihren ElevenLabs Conversational AI Agent so konfigurieren, dass er die `conversation_style` Variable nutzt, um den Gesprächston anzupassen.

## 🎯 Übersicht

Die Bewerbungstrainer-App übergibt nun eine `conversation_style` Variable an den ElevenLabs Agent mit folgenden möglichen Werten:

- **`friendly`** - Freundlicher, ermutigender Ton
- **`critical`** - Kritischer, anspruchsvoller Ton
- **`professional`** - Sachlicher, professioneller Ton (Standard)

## 📝 Agent-Prompt Konfiguration

### Schritt 1: ElevenLabs Dashboard öffnen

1. Gehen Sie zu [elevenlabs.io](https://elevenlabs.io)
2. Navigieren Sie zu Ihrem Conversational AI Agent
3. Öffnen Sie die Agent-Einstellungen

### Schritt 2: System Prompt erweitern

Fügen Sie folgenden Abschnitt am **Anfang** Ihres Agent System Prompts ein:

```markdown
## Gesprächsstil-Anpassung

Du führst ein Bewerbungsgespräch mit {{user_name}}, der/die sich auf die Position "{{position}}" bei {{company}} bewirbt.

WICHTIG: Dein Gesprächsstil soll {{conversation_style}} sein. Passe deinen Ton entsprechend an:

**Wenn conversation_style = "friendly":**
- Sei freundlich, ermutigend und unterstützend
- Gib positive Verstärkung bei guten Antworten
- Stelle Fragen in einem aufbauenden Ton
- Hilf dem Bewerber, sich wohl zu fühlen
- Beispiel: "Das ist eine sehr gute Antwort! Erzählen Sie mir mehr darüber..."

**Wenn conversation_style = "critical":**
- Sei kritisch und anspruchsvoll
- Stelle herausfordernde Nachfragen
- Hinterfrage Antworten und Annahmen
- Teste die Belastbarkeit des Bewerbers
- Sei professionell, aber fordernd
- Beispiel: "Interessant, aber können Sie das konkreter belegen? Was genau haben Sie dabei gelernt?"

**Wenn conversation_style = "professional":**
- Sei sachlich, neutral und strukturiert
- Stelle klare, professionelle Fragen
- Bleibe objektiv und fokussiert
- Halte einen formellen, aber respektvollen Ton
- Beispiel: "Verstanden. Lassen Sie uns zur nächsten Frage übergehen..."

ZUSÄTZLICH: Der Bewerber kann während des Gesprächs den Ton ändern, indem er dich direkt darum bittet (z.B. "Könnten Sie bitte etwas kritischer sein?"). Reagiere dann entsprechend und passe deinen Gesprächsstil an.

---

[Ihr restlicher Agent-Prompt folgt hier...]
```

### Schritt 3: Dynamic Variables konfigurieren

Stellen Sie sicher, dass folgende Dynamic Variables in Ihrem Agent definiert sind:

| Variable Name | Beschreibung | Beispielwert |
|--------------|--------------|--------------|
| `user_name` | Name des Bewerbers | "Max Mustermann" |
| `position` | Beworbene Position | "Ausbildung zum Mechatroniker" |
| `company` | Unternehmensname | "BMW AG" |
| `conversation_style` | Gesprächsstil | "friendly" / "critical" / "professional" |

Diese Variablen werden automatisch von der App beim Session-Start übergeben.

### Schritt 4: First Message anpassen (Optional)

Sie können auch die erste Nachricht des Agents dynamisch anpassen:

```
{{#if conversation_style == "friendly"}}
Herzlich willkommen, {{user_name}}! Schön, dass Sie da sind. Ich freue mich auf unser Gespräch über Ihre Bewerbung bei {{company}}. Machen Sie es sich bequem und entspannen Sie sich - wir führen hier ein lockeres, aber professionelles Gespräch.
{{else if conversation_style == "critical"}}
Guten Tag, {{user_name}}. Vielen Dank, dass Sie sich die Zeit genommen haben. Ich werde Ihnen heute einige anspruchsvolle Fragen zu Ihrer Bewerbung bei {{company}} stellen. Seien Sie darauf vorbereitet, Ihre Aussagen zu belegen.
{{else}}
Guten Tag, {{user_name}}. Schön, dass Sie zum Gespräch erschienen sind. Lassen Sie uns direkt beginnen. Erzählen Sie mir zunächst etwas über sich selbst.
{{/if}}
```

> **Hinweis**: Die exakte Syntax für Bedingungen kann je nach ElevenLabs-Version variieren. Konsultieren Sie die aktuelle ElevenLabs-Dokumentation für die korrekte Template-Syntax.

## 🎨 Stil-Wechsel während des Gesprächs

### Funktionsweise

Die App zeigt während eines aktiven Gesprächs Buttons zur Stil-Anpassung an. Wenn der Benutzer einen neuen Stil wählt:

1. Die App zeigt eine **Suggestion-Box** mit einem vorformulierten Satz
2. Der Benutzer **liest diesen Satz dem Agent vor**
3. Der Agent **reagiert** auf die Bitte und passt seinen Ton an

### Beispiel-Formulierungen

Die App schlägt dem Benutzer vor zu sagen:

- **→ Freundlich**: *"Könnten Sie bitte etwas freundlicher und ermutigender sein?"*
- **→ Kritisch**: *"Könnten Sie bitte kritischer und anspruchsvoller sein? Stellen Sie mir herausfordernde Fragen."*
- **→ Sachlich**: *"Könnten wir bitte zu einem sachlicheren und professionelleren Ton wechseln?"*

### Agent-Reaktion konfigurieren

Fügen Sie folgenden Abschnitt in Ihren Agent-Prompt ein:

```markdown
## Reaktion auf Stil-Änderungswünsche

Wenn der Bewerber während des Gesprächs darum bittet, den Gesprächston zu ändern (z.B. "Seien Sie bitte kritischer"), dann:

1. Bestätige kurz die Anfrage
2. Passe deinen Ton ab sofort entsprechend an
3. Mache nahtlos mit dem Gespräch weiter

Beispiel:
- Bewerber: "Könnten Sie bitte etwas kritischer sein?"
- Du: "Natürlich, kein Problem. Lassen Sie mich die Frage anders formulieren: Was genau qualifiziert Sie für diese Position, und können Sie das mit konkreten Beispielen belegen?"
```

## ✅ Testing

### Test-Checkliste

Nach der Konfiguration sollten Sie folgende Szenarien testen:

- [ ] **Wizard**: Alle drei Stil-Optionen auswählen und jeweils ein Gespräch starten
- [ ] **Freundlicher Stil**: Agent ist ermutigend und unterstützend
- [ ] **Kritischer Stil**: Agent stellt herausfordernde Fragen
- [ ] **Sachlicher Stil**: Agent bleibt neutral und professionell
- [ ] **Stil-Wechsel**: Während eines Gesprächs den Stil ändern und prüfen, ob der Agent reagiert
- [ ] **Dynamic Variables**: In den Logs prüfen, ob alle Variablen korrekt übergeben werden

### Debug-Tipps

1. **Browser Console öffnen** (F12) und nach `[START]` Logs suchen:
   ```
   📊 [START] Variables being passed to ElevenLabs:
      user_name: "Max Mustermann"
      position: "Ausbildung zum Mechatroniker"
      company: "BMW AG"
      conversation_style: "friendly"
   ```

2. **ElevenLabs Dashboard**: Prüfen Sie im Agent-Log, ob die Variablen ankommen

3. **Test-Gespräche**: Führen Sie kurze Test-Gespräche für jeden Stil durch

## 🔧 Erweiterte Konfiguration

### Custom Styles hinzufügen

Sie können weitere Gesprächsstile in der App definieren:

1. Öffnen Sie `/src/components/ConversationStyleSelector.jsx`
2. Fügen Sie einen neuen Stil zum `CONVERSATION_STYLES` Array hinzu:

```javascript
{
  id: 'motivational',
  label: 'Motivierend',
  icon: Zap, // Lucide icon
  description: 'Extrem motivierender, energetischer Ton',
  gradient: 'from-yellow-500 to-amber-600',
  // ... weitere Style-Eigenschaften
  emoji: '⚡'
}
```

3. Aktualisieren Sie die `handleStyleChange` Funktion in `App.jsx`:

```javascript
const messages = {
  friendly: 'Könnten Sie bitte etwas freundlicher sein?',
  critical: 'Könnten Sie bitte kritischer sein?',
  professional: 'Könnten wir bitte sachlicher werden?',
  motivational: 'Könnten Sie bitte besonders motivierend und energetisch sein?'
};
```

4. Erweitern Sie den Agent-Prompt um den neuen Stil

## 📚 Weitere Ressourcen

- [ElevenLabs Conversational AI Documentation](https://elevenlabs.io/docs/conversational-ai)
- [Dynamic Variables Guide](https://elevenlabs.io/docs/conversational-ai/customization/personalization/dynamic-variables)
- [Agent Customization Best Practices](https://elevenlabs.io/docs/conversational-ai/customization)

## 🆘 Troubleshooting

### Problem: Variable wird nicht übergeben

**Lösung**:
- Prüfen Sie die Browser-Console auf Fehler
- Stellen Sie sicher, dass der Wizard vollständig durchlaufen wurde
- Überprüfen Sie, ob `userData.conversation_style` gesetzt ist

### Problem: Agent ignoriert den Stil

**Lösung**:
- Überprüfen Sie den Agent System Prompt im ElevenLabs Dashboard
- Stellen Sie sicher, dass die `{{conversation_style}}` Variable korrekt verwendet wird
- Testen Sie mit expliziten Bedingungen statt Variablen

### Problem: Stil ändert sich während des Gesprächs nicht

**Lösung**:
- Dies ist normal - der Stil kann nur durch **mündliche Anfrage** geändert werden
- Der Benutzer muss dem Agent den vorgeschlagenen Satz **vorlesen**
- Der Agent muss im Prompt angewiesen sein, auf solche Anfragen zu reagieren

---

**Letzte Aktualisierung**: 2025-11-24
**Version**: 1.0.0
