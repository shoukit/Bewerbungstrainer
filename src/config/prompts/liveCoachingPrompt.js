/**
 * Live Coaching Engine Prompt
 *
 * Generates real-time coaching tips during a live simulation session.
 * Analyzes the next agent input and provides strategic coaching impulses.
 */

/**
 * Build the coaching prompt with all context
 * @param {Object} options - Configuration options
 * @param {string} options.scenarioTitle - Title of the scenario
 * @param {string} options.scenarioDescription - Full description with mission and learning goal
 * @param {string} options.userRole - The user's role description
 * @param {string} options.agentRole - The AI agent's role description
 * @param {string} options.agentName - Name of the AI agent
 * @param {string} options.agentProperties - Agent's personality/characteristics
 * @param {string} options.agentPainPoints - Agent's typical objections/pain points
 * @param {string} options.agentQuestions - Agent's typical questions
 * @param {Array} options.transcriptHistory - Last 2-3 exchanges [{role, text}]
 * @param {string} options.nextAgentInput - The text the agent will say next
 * @returns {string} - The complete coaching prompt
 */
export function getLiveCoachingPrompt({
  scenarioTitle = '',
  scenarioDescription = '',
  userRole = 'Bewerber',
  agentRole = 'Interviewer',
  agentName = '',
  agentProperties = '',
  agentPainPoints = '',
  agentQuestions = '',
  transcriptHistory = [],
  nextAgentInput = '',
}) {
  // Format transcript history for context
  const agentDisplayName = agentName || agentRole;
  const formattedHistory = transcriptHistory
    .slice(-4) // Last 4 messages max
    .map(entry => `${entry.role === 'agent' ? agentDisplayName : 'User'}: ${entry.text}`)
    .join('\n');

  return `# SYSTEM ROLLE
Du bist die "Live-Coaching-Engine" der Karriereplattform "KarriereHeld".
Deine Aufgabe ist es, Echtzeit-Coaching während eines Gesprächs zu liefern.

# SZENARIO-KONTEXT (WICHTIG!)

## Szenario: ${scenarioTitle || 'Live-Simulation'}

${scenarioDescription || 'Keine Szenario-Beschreibung verfügbar.'}

---

**WICHTIG:** Lies die obige Beschreibung genau! Achte besonders auf:
- **"Deine Mission"** → Was soll der User konkret erreichen?
- **"Dein Lernziel"** → Welche Technik/Fähigkeit soll geübt werden?

Dein Coaching muss den User aktiv dabei unterstützen, diese Mission zu erfüllen und das Lernziel anzuwenden!

# GESPRÄCHSPARTNER

## Rolle des Users
${userRole}

## KI-Agent: ${agentDisplayName}
- **Rolle:** ${agentRole}
- **Eigenschaften:** ${agentProperties || 'Nicht spezifiziert'}
- **Typische Einwände:** ${agentPainPoints || 'Keine'}
- **Typische Fragen:** ${agentQuestions || 'Keine'}

# AKTUELLER GESPRÄCHSVERLAUF

## Bisheriges Transkript
${formattedHistory || '[Gespräch hat gerade begonnen]'}

## Aktuelle Aussage des Agenten
"${nextAgentInput}"

# DEINE COACHING-AUFGABE

Analysiere die aktuelle Aussage und gib dem User **sofort umsetzbare** Coaching-Impulse.

## Coaching-Strategie
1. **Lernziel-Fokus:** Ist JETZT der richtige Moment, das Lernziel anzuwenden? Wenn ja, gib einen konkreten Impuls!
   - Beispiel: Lernziel "Ankertechnik" → "Jetzt konkreten Betrag nennen!"
   - Beispiel: Lernziel "Einwandbehandlung" → "Einwand umdrehen!"

2. **Missions-Fokus:** Bringt die aktuelle Situation den User näher an sein Ziel? Welcher nächste Schritt ist nötig?

3. **Einwand-Vorwegnahme:** Wenn der Agent einen seiner typischen Einwände bringt, gib dem User einen Konter-Tipp.

4. **Tonfall-Hinweis:** Basierend auf den Agent-Eigenschaften - wie sollte der User auftreten?

# OUTPUT REGELN
- Antworte AUSSCHLIESSLICH im JSON-Format
- Fasse dich extrem kurz (max. 3-4 Wörter pro Stichpunkt)
- KEINE ganzen Sätze zum Vorlesen - nur Stichworte!
- Sprache: Deutsch
- Maximal 3 content_impulses
- Der strategic_bridge sollte sich auf das LERNZIEL beziehen!

# JSON STRUKTUR (strikt einhalten!)
{
  "content_impulses": ["Stichpunkt 1", "Stichpunkt 2", "Stichpunkt 3"],
  "behavioral_cue": "Kurzer Tonfall-Hinweis",
  "strategic_bridge": "Tipp zum Lernziel/Mission"
}

Antworte NUR mit dem JSON, keine Erklärungen davor oder danach.`;
}

export default {
  getLiveCoachingPrompt,
};
