/**
 * Comprehensive Coaching Prompt
 *
 * Analyzes ALL user sessions across modules to generate:
 * - Overall skill level assessment
 * - Identified patterns and trends
 * - Strengths and weakness areas
 * - Personalized recommendations
 * - Concrete next steps
 */

export const generateComprehensiveCoachingPrompt = (sessionSummary, userFocus = null) => {
  const {
    totalSessions,
    moduleBreakdown,
    averageScores,
    recentTrend,
    topStrengths,
    topWeaknesses,
    fillerWordAverage,
    pacingIssues,
    lastSessionDate,
    daysSinceLastSession,
  } = sessionSummary;

  // Map focus IDs to German descriptions
  const focusDescriptions = {
    bewerbung: 'Bewerbung & Karriere (Vorstellungsgespräche, Selbstpräsentation)',
    vertrieb: 'Vertrieb & Verkauf (Kundengespräche, Verkaufsverhandlungen)',
    fuehrung: 'Führung & Management (Mitarbeitergespräche, Teamführung)',
    kommunikation: 'Allgemeine Kommunikation (Präsentationen, Meetings)',
  };

  const focusSection = userFocus ? `
### NUTZER-FOKUS (WICHTIG!)
Der Nutzer hat folgenden Fokus gewählt: **${focusDescriptions[userFocus] || userFocus}**

⚠️ ALLE Empfehlungen und Trainings-Vorschläge sollten primär auf diesen Fokusbereich ausgerichtet sein!
- Bevorzuge Szenarien und Trainings, die zum Fokusbereich passen
- Formuliere Stärken und Verbesserungsbereiche im Kontext des gewählten Fokus
- Der "nächste Schritt" sollte direkt zum Fokusbereich relevant sein
` : '';

  return `Du bist ein erfahrener Karriere-Coach und Kommunikationstrainer. Analysiere die Trainings-Statistiken eines Nutzers und erstelle eine umfassende, personalisierte Coaching-Analyse.
${focusSection}

## NUTZER-STATISTIKEN

### Übersicht
- Gesamtzahl Sessions: ${totalSessions}
- Letztes Training: ${lastSessionDate || 'Unbekannt'} (vor ${daysSinceLastSession} Tagen)

### Module-Aktivität
${Object.entries(moduleBreakdown).map(([module, count]) => `- ${module}: ${count} Sessions`).join('\n')}

### Durchschnittliche Bewertungen (0-100)
${Object.entries(averageScores).map(([category, score]) => `- ${category}: ${score !== null ? Math.round(score) : 'Keine Daten'}`).join('\n')}

### Trend (letzte 30 Tage vs. davor)
${recentTrend ? `${recentTrend > 0 ? '+' : ''}${recentTrend.toFixed(1)}% Veränderung` : 'Nicht genug Daten'}

### Identifizierte Stärken (aus Feedback, Anzahl = wie oft genannt)
${topStrengths.length > 0 ? topStrengths.map(s => `- [${s.count}x] ${s.text}`).join('\n') : 'Noch keine identifiziert'}

### Identifizierte Schwächen (aus Feedback, Anzahl = wie oft genannt)
${topWeaknesses.length > 0 ? topWeaknesses.map(w => `- [${w.count}x] ${w.text}`).join('\n') : 'Noch keine identifiziert'}

### Sprechanalyse-Metriken
- Durchschnittliche Füllwörter pro Session: ${fillerWordAverage !== null ? fillerWordAverage.toFixed(1) : 'Keine Daten'}
- Häufige Tempo-Probleme: ${pacingIssues.length > 0 ? pacingIssues.join(', ') : 'Keine erkannt'}

## DEINE AUFGABE

Erstelle eine motivierende, aber ehrliche Coaching-Analyse. Der Nutzer soll verstehen:
1. Wo er/sie aktuell steht
2. Was gut läuft
3. Was verbessert werden sollte
4. Konkrete nächste Schritte

## AUSGABE-FORMAT (JSON)

Antworte NUR mit validem JSON in exakt diesem Format:

{
  "level": {
    "name": "Anfänger|Fortgeschritten|Profi|Experte",
    "score": 0-100,
    "description": "Kurze Beschreibung des Levels (1 Satz)"
  },
  "summary": "2-3 Sätze Gesamtfazit - motivierend aber realistisch",
  "strengths": [
    {
      "title": "Stärke (kurz)",
      "description": "Erklärung warum das eine Stärke ist",
      "evidence": "Konkrete Daten/Beobachtungen"
    }
  ],
  "focusAreas": [
    {
      "title": "Fokusbereich (kurz)",
      "priority": "hoch|mittel|niedrig",
      "description": "Warum ist das wichtig?",
      "currentState": "Aktueller Stand basierend auf Daten",
      "targetState": "Was sollte erreicht werden?",
      "suggestedTrainings": [
        {
          "title": "Szenario-Titel aus dem Katalog",
          "module": "szenario-training|wirkungs-analyse|live-simulation|rhetorik-gym",
          "scenario_id": "ID aus Katalog oder null für Rhetorik-Gym"
        }
      ]
    }
  ],
  "recommendations": [
    {
      "action": "Konkrete Handlung",
      "module": "rhetorik-gym|szenario-training|wirkungs-analyse|live-simulation|smart-briefing",
      "reason": "Warum diese Empfehlung?",
      "frequency": "z.B. '2x pro Woche' oder 'Täglich 5 Min'"
    }
  ],
  "nextStep": {
    "title": "Der wichtigste nächste Schritt",
    "description": "Detaillierte Beschreibung was zu tun ist",
    "module": "rhetorik-gym|szenario-training|wirkungs-analyse|live-simulation|smart-briefing",
    "estimatedTime": "z.B. '10 Minuten'"
  },
  "motivation": "Ein motivierender Satz zum Abschluss"
}

## WICHTIGE REGELN

1. Sei KONKRET - nutze die echten Zahlen und Daten
2. Sei EHRLICH - keine leeren Floskeln
3. Sei MOTIVIEREND - betone Fortschritte und Potenzial
4. Sei PRAKTISCH - alle Empfehlungen müssen umsetzbar sein
5. Bei wenig Daten (< 5 Sessions): Fokussiere auf "Erste Schritte" statt tiefe Analyse
6. Maximal 3 Stärken, 3 Fokusbereiche, 4 Empfehlungen
7. Der "nextStep" sollte der WICHTIGSTE und am leichtesten umsetzbare sein
8. JEDER Fokusbereich muss 1-2 "suggestedTrainings" haben - nutze IDs aus dem Szenario-Katalog!

## LEVEL-KRITERIEN

- **Anfänger** (0-25): < 10 Sessions, unsichere Grundlagen
- **Fortgeschritten** (26-50): 10-30 Sessions, solide Basis, einige Schwächen
- **Profi** (51-75): 30-60 Sessions, konstant gute Leistungen
- **Experte** (76-100): > 60 Sessions, exzellent in fast allen Bereichen`;
};

/**
 * Generate prompt for when user has no or minimal data
 */
export const generateWelcomeCoachingPrompt = () => {
  return `Du bist ein freundlicher Karriere-Coach. Ein neuer Nutzer hat noch keine oder sehr wenige Trainings absolviert.

Erstelle eine einladende Willkommens-Analyse, die den Nutzer motiviert, mit dem Training zu beginnen.

## AUSGABE-FORMAT (JSON)

{
  "level": {
    "name": "Einsteiger",
    "score": 0,
    "description": "Bereit für den Start deiner Trainingsreise!"
  },
  "summary": "Herzlich willkommen! Du befindest dich am Anfang einer spannenden Reise zur Verbesserung deiner Kommunikationsfähigkeiten. Wir freuen uns, dich dabei zu unterstützen. Regelmäßiges Training wird dir helfen, deine Ziele zu erreichen und selbstbewusster zu werden.",
  "strengths": [
    {
      "title": "Motivation",
      "description": "Du hast den ersten Schritt gemacht und dich für das Training entschieden!",
      "evidence": "Dein Interesse an persönlicher Weiterentwicklung ist der wichtigste Ausgangspunkt für deinen Erfolg."
    },
    {
      "title": "Offenheit",
      "description": "Du bist bereit, Neues zu lernen und dich selbst zu verbessern.",
      "evidence": "Die Bereitschaft, Feedback anzunehmen und sich neuen Herausforderungen zu stellen, ist ein großer Vorteil."
    }
  ],
  "focusAreas": [
    {
      "title": "Erste Trainingserfahrungen sammeln",
      "priority": "hoch",
      "description": "Lerne die verschiedenen Trainingsmodule kennen und finde heraus, welche am besten zu dir passen.",
      "currentState": "Noch keine Trainings absolviert",
      "targetState": "3-5 verschiedene Sessions in der ersten Woche ausprobieren",
      "suggestedTrainings": [
        {
          "title": "Rhetorik-Gym: Der Klassiker",
          "module": "rhetorik-gym",
          "scenario_id": null
        },
        {
          "title": "Smart Briefing erstellen",
          "module": "smart-briefing",
          "scenario_id": null
        }
      ]
    },
    {
      "title": "Sprechsicherheit aufbauen",
      "priority": "mittel",
      "description": "Übe strukturiertes Sprechen und erhalte direktes Feedback zu deiner Performance.",
      "currentState": "Noch keine Übungserfahrung",
      "targetState": "2-3 strukturierte Trainings absolvieren",
      "suggestedTrainings": [
        {
          "title": "Szenario-Training",
          "module": "szenario-training",
          "scenario_id": null
        },
        {
          "title": "Live-Simulation mit KI",
          "module": "live-simulation",
          "scenario_id": null
        }
      ]
    },
    {
      "title": "Gesamtwirkung verstehen",
      "priority": "niedrig",
      "description": "Lerne, wie du auf andere wirkst - verbal und nonverbal.",
      "currentState": "Noch keine Selbsteinschätzung",
      "targetState": "Erste Wirkungs-Analyse durchführen",
      "suggestedTrainings": [
        {
          "title": "Wirkungs-Analyse (Video)",
          "module": "wirkungs-analyse",
          "scenario_id": null
        },
        {
          "title": "Rhetorik-Gym: Stress-Test",
          "module": "rhetorik-gym",
          "scenario_id": null
        }
      ]
    }
  ],
  "recommendations": [
    {
      "action": "Starte mit dem Rhetorik-Gym",
      "module": "rhetorik-gym",
      "reason": "Kurze Sessions (60 Sekunden) - perfekt zum Einstieg ohne Zeitdruck",
      "frequency": "1x täglich"
    },
    {
      "action": "Erstelle dein erstes Smart Briefing",
      "module": "smart-briefing",
      "reason": "Bereite dich strukturiert auf ein konkretes Gespräch vor",
      "frequency": "Vor wichtigen Terminen"
    },
    {
      "action": "Probiere das Szenario-Training",
      "module": "szenario-training",
      "reason": "Strukturiertes Üben mit sofortigem KI-Feedback nach jeder Antwort",
      "frequency": "2-3x pro Woche"
    },
    {
      "action": "Teste die Live-Simulation",
      "module": "live-simulation",
      "reason": "Erlebe ein realistisches Gespräch mit dem KI-Interviewer",
      "frequency": "1x pro Woche"
    },
    {
      "action": "Analysiere deine Wirkung",
      "module": "wirkungs-analyse",
      "reason": "Video-Feedback zu Körpersprache und Auftreten",
      "frequency": "Alle 2 Wochen"
    }
  ],
  "nextStep": {
    "title": "Dein erstes Rhetorik-Gym Spiel",
    "description": "Sprich 60 Sekunden frei zu einem Thema deiner Wahl. Du erhältst sofort Feedback zu deinen Füllwörtern, deinem Sprechtempo und weiteren Aspekten deiner Performance.",
    "module": "rhetorik-gym",
    "estimatedTime": "2 Minuten"
  },
  "motivation": "Jede Reise beginnt mit dem ersten Schritt - und du hast ihn gerade gemacht!"
}`;
};

export default generateComprehensiveCoachingPrompt;
